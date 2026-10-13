from pathlib import Path
from typing import Any

import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

CURRENT_FILE = Path(__file__).resolve()

# Expected project structure:
# D:\AI-Retail-Intelligence\
#   ml\
#     models\
#       recommendation_model.pkl
#     data\
#       processed\
#       product_summary.csv

PROJECT_BASE = CURRENT_FILE.parents[4]
ML_FOLDER = PROJECT_BASE / "ml"

MODEL_PATH = ML_FOLDER / "models" / "recommendation_model.pkl"

PRODUCT_SUMMARY_PATH = (
    ML_FOLDER
    / "data"
    / "processed"
    / "product_summary.csv"
)


# ============================================================
# LOAD MODEL PACKAGE
# ============================================================

_model_package: dict[str, Any] | None = None
_product_summary: pd.DataFrame | None = None


def _load_recommendation_assets() -> None:
    """Load recommendation assets once when first needed."""

    global _model_package, _product_summary

    if _model_package is not None and _product_summary is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Recommendation model not found: {MODEL_PATH}"
        )

    if not PRODUCT_SUMMARY_PATH.exists():
        raise FileNotFoundError(
            f"Product summary not found: {PRODUCT_SUMMARY_PATH}"
        )

    package = joblib.load(MODEL_PATH)

    required_keys = {
        "content_similarity",
        "product_lookup",
        "popular_products",
    }

    missing_keys = required_keys.difference(package.keys())

    if missing_keys:
        raise ValueError(
            "Recommendation model is missing required keys: "
            + ", ".join(sorted(missing_keys))
        )

    summary = pd.read_csv(
        PRODUCT_SUMMARY_PATH,
        low_memory=False,
    )

    required_columns = {
        "StockCode",
        "Description",
        "TotalQuantity",
        "TotalRevenue",
        "Transactions",
        "Customers",
    }

    missing_columns = required_columns.difference(summary.columns)

    if missing_columns:
        raise ValueError(
            "Product summary is missing required columns: "
            + ", ".join(sorted(missing_columns))
        )

    summary["StockCode"] = (
        summary["StockCode"]
        .astype(str)
        .str.strip()
    )

    summary["Description"] = (
        summary["Description"]
        .fillna("")
        .astype(str)
        .str.strip()
    )

    _model_package = package
    _product_summary = summary


# ============================================================
# PRODUCT DATA HELPER
# ============================================================

def _get_product(stock_code: str) -> dict[str, Any] | None:
    """Return a product's summary information."""

    _load_recommendation_assets()

    assert _product_summary is not None

    stock_code = str(stock_code).strip()

    matches = _product_summary[
        _product_summary["StockCode"] == stock_code
    ]

    if matches.empty:
        return None

    row = matches.iloc[0]

    return {
        "StockCode": stock_code,
        "Description": str(row["Description"]),
        "TotalQuantity": float(row["TotalQuantity"]),
        "TotalRevenue": float(row["TotalRevenue"]),
        "Transactions": int(row["Transactions"]),
        "Customers": int(row["Customers"]),
    }


# ============================================================
# POPULAR PRODUCTS
# ============================================================

def get_popular_products(top_n: int = 10) -> list[dict[str, Any]]:
    """
    Return popular products from the saved recommendation package.

    This is a popularity-based fallback. It does not claim to be
    personalized to a particular customer.
    """

    _load_recommendation_assets()

    assert _model_package is not None

    top_n = max(1, min(int(top_n), 50))

    popular = _model_package["popular_products"]

    if isinstance(popular, pd.Series):
        popular_codes = popular.index.tolist()

    elif isinstance(popular, pd.DataFrame):
        if "StockCode" in popular.columns:
            popular_codes = popular["StockCode"].tolist()
        else:
            popular_codes = popular.index.tolist()

    elif isinstance(popular, dict):
        popular_codes = list(popular.keys())

    elif isinstance(popular, (list, tuple)):
        popular_codes = list(popular)

    else:
        popular_codes = []

    results: list[dict[str, Any]] = []
    seen: set[str] = set()

    for code in popular_codes:
        stock_code = str(code).strip()

        if stock_code in seen:
            continue

        product = _get_product(stock_code)

        if product is None:
            continue

        seen.add(stock_code)

        results.append(product)

        if len(results) >= top_n:
            break

    # Fallback to products ordered by historical revenue when the
    # saved popularity list doesn't contain usable StockCodes.
    if not results:
        assert _product_summary is not None

        fallback = _product_summary.sort_values(
            "TotalRevenue",
            ascending=False,
        ).head(top_n)

        for _, row in fallback.iterrows():
            results.append({
                "StockCode": str(row["StockCode"]),
                "Description": str(row["Description"]),
                "TotalQuantity": float(row["TotalQuantity"]),
                "TotalRevenue": float(row["TotalRevenue"]),
                "Transactions": int(row["Transactions"]),
                "Customers": int(row["Customers"]),
            })

    return results


# ============================================================
# SIMILAR PRODUCTS
# ============================================================

def get_recommended_products(
    stock_code: str | None = None,
    top_n: int = 10,
) -> list[dict[str, Any]]:
    """
    Recommend products related to a selected product.

    If no StockCode is supplied, return popular products.
    """

    _load_recommendation_assets()

    assert _model_package is not None

    top_n = max(1, min(int(top_n), 50))

    if not stock_code:
        return get_popular_products(top_n)

    selected_code = str(stock_code).strip()

    selected_product = _get_product(selected_code)

    if selected_product is None:
        return []

    similarity = _model_package["content_similarity"]

    if selected_code not in similarity.index:
        return get_popular_products(top_n)

    similarity_row = similarity.loc[selected_code]

    # Handle either a Series or a single-row DataFrame.
    if isinstance(similarity_row, pd.DataFrame):
        similarity_row = similarity_row.iloc[0]

    similarity_row = similarity_row.drop(
        labels=[selected_code],
        errors="ignore",
    )

    top_matches = similarity_row.sort_values(
        ascending=False,
    ).head(top_n)

    results: list[dict[str, Any]] = []

    for code, score in top_matches.items():
        product = _get_product(str(code))

        if product is None:
            continue

        product["similarity_score"] = round(float(score), 4)
        results.append(product)

    return results


# ============================================================
# CUSTOMER RECOMMENDATIONS
# ============================================================

def get_customer_recommendations(
    customer_id: int | None = None,
    top_n: int = 10,
) -> dict[str, Any]:
    """
    Return a safe initial recommendation response.

    Until customer purchase history is connected to the saved
    interaction matrix, recommendations are popularity-based.
    """

    products = get_popular_products(top_n)

    return {
        "customer_id": customer_id,
        "recommendation_type": "popular_products",
        "message": (
            "Popular products based on historical retail sales."
        ),
        "products": products,
    }