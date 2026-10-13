from pathlib import Path
from typing import List, Dict, Any

import joblib
import pandas as pd


# ============================================================
# PATHS
# ============================================================

CURRENT_FILE = Path(__file__).resolve()

# D:\AI-Retail-Intelligence
PROJECT_BASE = CURRENT_FILE.parents[4]

ML_FOLDER = PROJECT_BASE / "ml"

MODEL_PATH = (
    ML_FOLDER
    / "models"
    / "recommendation_model.pkl"
)

PRODUCT_SUMMARY_PATH = (
    ML_FOLDER
    / "data"
    / "processed"
    / "product_summary.csv"
)

ASSOCIATION_RULES_PATH = (
    ML_FOLDER
    / "data"
    / "processed"
    / "product_association_rules.csv"
)


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Recommendation model not found:\n{MODEL_PATH}"
    )

if not PRODUCT_SUMMARY_PATH.exists():
    raise FileNotFoundError(
        f"Product summary file not found:\n{PRODUCT_SUMMARY_PATH}"
    )

if not ASSOCIATION_RULES_PATH.exists():
    raise FileNotFoundError(
        f"Association rules file not found:\n{ASSOCIATION_RULES_PATH}"
    )


# ============================================================
# LOAD RECOMMENDATION MODEL
# ============================================================

model_package = joblib.load(MODEL_PATH)

content_similarity = model_package[
    "content_similarity"
]

product_lookup = model_package[
    "product_lookup"
]


# ============================================================
# PREPARE PRODUCT LOOKUP
# ============================================================

if isinstance(product_lookup, dict):

    product_lookup_df = pd.DataFrame(
        list(product_lookup.items()),
        columns=[
            "StockCode",
            "Description"
        ]
    )

else:

    product_lookup_df = product_lookup.copy()

    if "StockCode" not in product_lookup_df.columns:

        product_lookup_df = (
            product_lookup_df
            .reset_index()
            .rename(
                columns={
                    "index": "StockCode"
                }
            )
        )


product_lookup_df["StockCode"] = (
    product_lookup_df["StockCode"]
    .astype(str)
    .str.strip()
)

product_lookup_df["Description"] = (
    product_lookup_df["Description"]
    .fillna("")
    .astype(str)
    .str.strip()
)


# ============================================================
# LOAD PRODUCT SUMMARY
# ============================================================

product_summary = pd.read_csv(
    PRODUCT_SUMMARY_PATH,
    low_memory=False
)

product_summary["StockCode"] = (
    product_summary["StockCode"]
    .astype(str)
    .str.strip()
)

product_summary["Description"] = (
    product_summary["Description"]
    .fillna("")
    .astype(str)
    .str.strip()
)


# ============================================================
# LOAD ASSOCIATION RULES
# ============================================================

association_rules = pd.read_csv(
    ASSOCIATION_RULES_PATH,
    low_memory=False
)


# ============================================================
# PRODUCT DESCRIPTION HELPER
# ============================================================

def _get_product_description(
    stock_code: str
) -> str:

    stock_code = str(
        stock_code
    ).strip()

    matching = product_lookup_df[
        product_lookup_df["StockCode"]
        == stock_code
    ]

    if not matching.empty:

        return str(
            matching.iloc[0]["Description"]
        )

    return ""


# ============================================================
# GET PRODUCT SUMMARY
# ============================================================

def get_product_summary(
    stock_code: str
) -> Dict[str, Any] | None:

    stock_code = str(
        stock_code
    ).strip()

    matching = product_summary[
        product_summary["StockCode"]
        == stock_code
    ]

    if matching.empty:
        return None

    row = matching.iloc[0]

    return {
        "StockCode": stock_code,
        "Description": str(
            row["Description"]
        ),
        "TotalQuantity": float(
            row["TotalQuantity"]
        ),
        "TotalRevenue": float(
            row["TotalRevenue"]
        ),
        "Transactions": int(
            row["Transactions"]
        ),
        "Customers": int(
            row["Customers"]
        )
    }


# ============================================================
# GET SIMILAR PRODUCTS
# ============================================================

def get_similar_products(
    stock_code: str,
    top_n: int = 5
) -> List[Dict[str, Any]]:

    stock_code = str(
        stock_code
    ).strip()

    top_n = max(
        1,
        min(int(top_n), 20)
    )

    # --------------------------------------------------------
    # Check whether product exists in similarity model
    # --------------------------------------------------------

    if stock_code not in content_similarity.index:

        return []

    # --------------------------------------------------------
    # Get similarity row using StockCode labels
    # --------------------------------------------------------

    similarity_row = (
        content_similarity
        .loc[stock_code]
    )

    # --------------------------------------------------------
    # Remove the product itself
    # --------------------------------------------------------

    similarity_row = similarity_row.drop(
        labels=[stock_code],
        errors="ignore"
    )

    # --------------------------------------------------------
    # Sort by highest similarity
    # --------------------------------------------------------

    top_products = (
        similarity_row
        .sort_values(
            ascending=False
        )
        .head(top_n)
    )

    results = []

    for similar_code, score in top_products.items():

        similar_code = str(
            similar_code
        ).strip()

        results.append(
            {
                "StockCode": similar_code,
                "Description":
                    _get_product_description(
                        similar_code
                    ),
                "similarity_score":
                    round(
                        float(score),
                        4
                    )
            }
        )

    return results


# ============================================================
# GET ASSOCIATION RULES
# ============================================================

def get_association_rules(
    stock_code: str
) -> List[Dict[str, Any]]:

    stock_code = str(
        stock_code
    ).strip()

    if association_rules.empty:

        return []

    results = []

    for _, row in association_rules.iterrows():

        antecedents = str(
            row["antecedents"]
        ).strip()

        consequents = str(
            row["consequents"]
        ).strip()

        # ----------------------------------------------------
        # Check whether product appears in the rule
        # ----------------------------------------------------

        if (
            antecedents == stock_code
            or consequents == stock_code
        ):

            results.append(
                {
                    "antecedents":
                        antecedents,

                    "consequents":
                        consequents,

                    "support":
                        round(
                            float(
                                row["support"]
                            ),
                            6
                        ),

                    "confidence":
                        round(
                            float(
                                row["confidence"]
                            ),
                            6
                        ),

                    "lift":
                        round(
                            float(
                                row["lift"]
                            ),
                            6
                        )
                }
            )

    return results


# ============================================================
# COMPLETE PRODUCT INTELLIGENCE
# ============================================================

def get_product_intelligence(
    stock_code: str,
    top_n: int = 5
) -> Dict[str, Any] | None:

    stock_code = str(
        stock_code
    ).strip()

    summary = get_product_summary(
        stock_code
    )

    # --------------------------------------------------------
    # Product must exist in product summary
    # --------------------------------------------------------

    if summary is None:

        return None

    similar_products = (
        get_similar_products(
            stock_code=stock_code,
            top_n=top_n
        )
    )

    rules = (
        get_association_rules(
            stock_code=stock_code
        )
    )

    return {
        "product": summary,
        "similar_products":
            similar_products,
        "association_rules":
            rules
    }