from pathlib import Path
from math import ceil

import joblib
import numpy as np
import pandas as pd

from sqlalchemy.orm import Session

from backend.app.models.product import Product
from backend.app.models.inventory import Inventory


# ============================================================
# PATHS AND CONFIGURATION
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_ROOT = BACKEND_DIR.parent
ML_ROOT = PROJECT_ROOT.parent / "ml"

MODEL_PATH = ML_ROOT / "models" / "inventory_model.pkl"

DATA_PATH = (
    ML_ROOT
    / "data"
    / "processed"
    / "retail_master_clean.csv"
)

# Inventory policy configuration
DEFAULT_LEAD_TIME_DAYS = 1

# Provisional policy: maintain one additional day
# of forecast demand as safety stock.
SAFETY_STOCK_DAYS = 1


# ============================================================
# MODEL FEATURES
# IMPORTANT: Keep these consistent with the trained model.
# ============================================================

LAG_PERIODS = [1, 3, 7, 14, 21, 28]

ROLLING_MEAN_WINDOWS = [7, 14, 30, 60]

ROLLING_STD_WINDOWS = [7, 30]

MODEL_FEATURES = [
    "Lag_1",
    "Lag_3",
    "Lag_7",
    "Lag_14",
    "Lag_21",
    "Lag_28",
    "RollingMean_7",
    "RollingMean_14",
    "RollingMean_30",
    "RollingMean_60",
    "RollingStd_7",
    "RollingStd_30",
    "DayOfWeek",
    "Month",
    "Day",
    "IsWeekend",
    "ProductMeanDemand",
    "ProductMaxDemand",
    "ProductStdDemand",
    "ProductActiveDays",
]


# ============================================================
# CACHED MODEL AND DATA
# ============================================================

_model_package = None
_master_data = None


# ============================================================
# LOAD TRAINED MODEL
# ============================================================

def load_model():
    """Load and validate the saved inventory model package."""

    global _model_package

    if _model_package is None:

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Inventory model not found: {MODEL_PATH}"
            )

        package = joblib.load(MODEL_PATH)

        if not isinstance(package, dict):
            raise TypeError(
                "Expected inventory_model.pkl to contain "
                "a dictionary model package."
            )

        required_keys = {
            "model",
            "feature_columns",
            "prediction_transform",
        }

        missing = required_keys - set(package.keys())

        if missing:
            raise KeyError(
                "Inventory model package is missing keys: "
                f"{sorted(missing)}"
            )

        saved_features = list(package["feature_columns"])

        if saved_features != MODEL_FEATURES:
            raise ValueError(
                "The backend feature list does not match "
                "the saved model feature list.\n"
                f"Expected: {MODEL_FEATURES}\n"
                f"Found: {saved_features}"
            )

        _model_package = package

    return _model_package


# ============================================================
# LOAD HISTORICAL DATA
# ============================================================

def load_master_data():
    """Load and cache the cleaned historical retail dataset."""

    global _master_data

    if _master_data is None:

        if not DATA_PATH.exists():
            raise FileNotFoundError(
                f"Clean retail dataset not found: {DATA_PATH}"
            )

        data = pd.read_csv(DATA_PATH)

        required_columns = {
            "StockCode",
            "InvoiceDate",
            "Quantity",
        }

        missing = required_columns - set(data.columns)

        if missing:
            raise ValueError(
                "Missing required dataset columns: "
                f"{sorted(missing)}"
            )

        data["StockCode"] = (
            data["StockCode"]
            .astype(str)
            .str.strip()
        )

        data["InvoiceDate"] = pd.to_datetime(
            data["InvoiceDate"],
            errors="coerce",
        )

        data["Quantity"] = pd.to_numeric(
            data["Quantity"],
            errors="coerce",
        )

        data = data.dropna(
            subset=[
                "StockCode",
                "InvoiceDate",
                "Quantity",
            ]
        ).copy()

        data = data[
            data["StockCode"].ne("")
        ].copy()

        data["Date"] = data["InvoiceDate"].dt.normalize()

        _master_data = data

    return _master_data


# ============================================================
# BUILD DAILY DEMAND
# ============================================================

def build_daily_demand(product_code: str) -> pd.DataFrame:
    """
    Build a continuous daily demand series for a product.

    Positive transaction quantities are aggregated by date.
    Missing dates between the first and last sale are filled
    with zero demand.
    """

    data = load_master_data()

    product_code = str(product_code).strip()

    product_data = data[
        data["StockCode"] == product_code
    ].copy()

    if product_data.empty:
        raise ValueError(
            f"No historical transactions found for "
            f"product {product_code}."
        )

    # Match the original notebook's preprocessing.
    product_data = product_data[
        product_data["Quantity"] > 0
    ].copy()

    if product_data.empty:
        raise ValueError(
            f"No positive historical demand found for "
            f"product {product_code}."
        )

    daily = (
        product_data.groupby("Date")["Quantity"]
        .sum()
        .sort_index()
        .rename("DailyDemand")
        .to_frame()
    )

    complete_dates = pd.date_range(
        start=daily.index.min(),
        end=daily.index.max(),
        freq="D",
    )

    daily = daily.reindex(
        complete_dates,
        fill_value=0,
    )

    daily.index.name = "Date"

    daily["DailyDemand"] = (
        daily["DailyDemand"].astype(float)
    )

    return daily


# ============================================================
# FEATURE ENGINEERING
# ============================================================

def build_forecast_features(
    product_code: str,
) -> pd.DataFrame:
    """
    Generate the same 20 features used to train the model.

    Rolling features use shift(1) to exclude the current
    day's demand from its rolling calculations.
    """

    daily = build_daily_demand(product_code)

    features = daily.copy()

    # --------------------------------------------------------
    # 1. LAG FEATURES
    # --------------------------------------------------------

    for lag in LAG_PERIODS:

        features[f"Lag_{lag}"] = (
            daily["DailyDemand"].shift(lag)
        )

    # --------------------------------------------------------
    # 2. ROLLING MEANS
    # --------------------------------------------------------

    for window in ROLLING_MEAN_WINDOWS:

        features[f"RollingMean_{window}"] = (
            daily["DailyDemand"]
            .shift(1)
            .rolling(
                window=window,
                min_periods=window,
            )
            .mean()
        )

    # --------------------------------------------------------
    # 3. ROLLING STANDARD DEVIATIONS
    # --------------------------------------------------------

    for window in ROLLING_STD_WINDOWS:

        features[f"RollingStd_{window}"] = (
            daily["DailyDemand"]
            .shift(1)
            .rolling(
                window=window,
                min_periods=window,
            )
            .std()
        )

    # --------------------------------------------------------
    # 4. CALENDAR FEATURES
    # --------------------------------------------------------

    features["DayOfWeek"] = (
        features.index.dayofweek
    )

    features["Month"] = (
        features.index.month
    )

    features["Day"] = (
        features.index.day
    )

    features["IsWeekend"] = (
        features["DayOfWeek"] >= 5
    ).astype(int)

    # --------------------------------------------------------
    # 5. PRODUCT-LEVEL HISTORICAL STATISTICS
    # --------------------------------------------------------

    demand = daily["DailyDemand"]

    features["ProductMeanDemand"] = float(
        demand.mean()
    )

    features["ProductMaxDemand"] = float(
        demand.max()
    )

    product_std = demand.std()

    features["ProductStdDemand"] = (
        0.0
        if pd.isna(product_std)
        else float(product_std)
    )

    features["ProductActiveDays"] = int(
        (demand > 0).sum()
    )

    # --------------------------------------------------------
    # 6. CLEAN INVALID VALUES
    # --------------------------------------------------------

    features = features.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    complete_features = features.dropna(
        subset=MODEL_FEATURES
    )

    if complete_features.empty:
        raise ValueError(
            f"Insufficient historical data to construct "
            f"all 20 forecasting features for {product_code}. "
            "The model requires sufficient history for its "
            "60-day rolling mean."
        )

    return complete_features


# ============================================================
# MODEL AND FEATURE CONFIGURATION
# ============================================================

def _get_model_and_features():
    """Extract the trained estimator and model configuration."""

    package = load_model()

    return (
        package["model"],
        list(package["feature_columns"]),
        package["prediction_transform"],
    )


# ============================================================
# PREDICT DAILY DEMAND
# ============================================================

def predict_demand(product_code: str) -> dict:
    """
    Predict next-day demand using the trained Random Forest.

    The prediction is transformed back to the original demand
    scale when the saved model package specifies expm1.
    """

    features = build_forecast_features(product_code)

    latest = features.iloc[[-1]].copy()

    model, feature_columns, transform = (
        _get_model_and_features()
    )

    missing = [
        column
        for column in feature_columns
        if column not in latest.columns
    ]

    if missing:
        raise ValueError(
            f"Missing forecasting features: {missing}"
        )

    X = latest[feature_columns].copy()

    X = X.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    if X.isna().any().any():
        raise ValueError(
            "The latest forecasting row contains "
            "missing feature values."
        )

    prediction = float(
        np.asarray(
            model.predict(X)
        ).reshape(-1)[0]
    )

    if transform == "expm1":

        prediction = float(
            np.expm1(prediction)
        )

    elif transform not in (None, "", "none"):

        raise ValueError(
            "Unsupported prediction transformation: "
            f"{transform}"
        )

    if not np.isfinite(prediction):
        raise ValueError(
            f"Invalid demand prediction for {product_code}."
        )

    predicted_daily_demand = max(
        0.0,
        prediction,
    )

    latest_row = latest.iloc[0]

    return {
        "predicted_daily_demand": predicted_daily_demand,
        "product_mean_demand": max(
            0.0,
            float(latest_row["ProductMeanDemand"]),
        ),
        "demand_std": max(
            0.0,
            float(latest_row["ProductStdDemand"]),
        ),
    }


# ============================================================
# DATABASE LOOKUP
# ============================================================

def get_inventory_record(
    product_code: str,
    db: Session,
):
    """Retrieve the product and its associated inventory."""

    product_code = str(product_code).strip()

    product = (
        db.query(Product)
        .filter(
            Product.product_code == product_code
        )
        .first()
    )

    if product is None:
        return None, None

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == product.id
        )
        .first()
    )

    return product, inventory


# ============================================================
# INVENTORY RECOMMENDATION
# ============================================================

def get_inventory_recommendation(
    product_id: str,
    db: Session,
):
    """
    Combine ML demand forecasting with database inventory.

    The safety-stock policy is provisional and uses a
    configurable number of additional forecast-demand days.

    Returns None if the product or inventory record is absent.
    """

    product_code = str(product_id).strip()

    product, inventory = get_inventory_record(
        product_code,
        db,
    )

    if product is None or inventory is None:
        return None

    current_stock = max(
        0,
        int(inventory.stock_quantity or 0),
    )

    print(
        f"[INVENTORY DEBUG] "
        f"Product code={product_code}, "
        f"Product ID={product.id}, "
        f"Inventory ID={inventory.id}, "
        f"Stock={current_stock}, "
        f"Reorder level={inventory.reorder_level}"
    )

    # --------------------------------------------------------
    # 1. ML DEMAND FORECAST
    # --------------------------------------------------------

    forecast = predict_demand(product_code)

    predicted_daily_demand = (
        forecast["predicted_daily_demand"]
    )

    demand_std = forecast["demand_std"]

    product_mean_demand = (
        forecast["product_mean_demand"]
    )

    # --------------------------------------------------------
    # 2. LEAD TIME
    # --------------------------------------------------------

    # Placeholder until supplier lead time is available
    # as a database field.
    lead_time_days = max(
        1,
        int(DEFAULT_LEAD_TIME_DAYS),
    )

    lead_time_demand = (
        predicted_daily_demand * lead_time_days
    )

    # --------------------------------------------------------
    # 3. SAFETY STOCK AND REORDER POINT
    # --------------------------------------------------------

    # Provisional policy:
    # maintain SAFETY_STOCK_DAYS of additional forecast demand.
    safety_stock = (
        predicted_daily_demand
        * max(0, SAFETY_STOCK_DAYS)
    )

    reorder_point = (
        lead_time_demand + safety_stock
    )

    database_reorder_level = max(
        0,
        int(inventory.reorder_level or 0),
    )

    target_stock = max(
        reorder_point,
        float(database_reorder_level),
    )

    # --------------------------------------------------------
    # 4. RECOMMENDED ORDER QUANTITY
    # --------------------------------------------------------

    shortage = max(
        0.0,
        target_stock - current_stock,
    )

    configured_order_quantity = max(
        0,
        int(inventory.reorder_quantity or 0),
    )

    if shortage > 0:

        recommended_order_quantity = max(
            ceil(shortage),
            configured_order_quantity,
        )

    else:

        recommended_order_quantity = 0

    # --------------------------------------------------------
    # 5. STOCK COVERAGE AND DEMAND RISK
    # --------------------------------------------------------

    if predicted_daily_demand > 0:

        days_of_stock = (
            current_stock / predicted_daily_demand
        )

    else:

        days_of_stock = float("inf")

    if product_mean_demand > 0:

        demand_risk_ratio = (
            predicted_daily_demand
            / product_mean_demand
        )

    elif predicted_daily_demand > 0:

        demand_risk_ratio = float("inf")

    else:

        demand_risk_ratio = 1.0

    # --------------------------------------------------------
    # 6. RISK LEVEL
    # --------------------------------------------------------

    if current_stock <= 0:

        risk_level = "High"

    elif current_stock <= reorder_point:

        risk_level = "High"

    elif days_of_stock <= lead_time_days:

        risk_level = "High"

    elif (
        current_stock <= target_stock
        or demand_risk_ratio >= 2
    ):

        risk_level = "Medium"

    else:

        risk_level = "Low"

    # --------------------------------------------------------
    # 7. RECOMMENDED ACTION
    # --------------------------------------------------------

    if (
        recommended_order_quantity > 0
        and risk_level == "High"
    ):

        recommendation = "Urgent Reorder"

    elif recommended_order_quantity > 0:

        recommendation = "Monitor & Reorder"

    else:

        recommendation = "Normal Stock"

    # --------------------------------------------------------
    # 8. API RESPONSE
    # --------------------------------------------------------

    return {
        "product_id": product_code,

        "current_stock": current_stock,

        "predicted_daily_demand": round(
            predicted_daily_demand,
            2,
        ),

        "lead_time_days": lead_time_days,

        "lead_time_demand": round(
            lead_time_demand,
            2,
        ),

        "demand_std": round(
            demand_std,
            2,
        ),

        "safety_stock": round(
            float(safety_stock),
            2,
        ),

        "reorder_point": round(
            float(reorder_point),
            2,
        ),

        "recommended_order_quantity": (
            recommended_order_quantity
        ),

        "risk_level": risk_level,

        "recommendation": recommendation,
    }