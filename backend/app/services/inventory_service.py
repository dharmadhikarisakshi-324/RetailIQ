from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

CURRENT_FILE = Path(__file__).resolve()

# inventory_service.py
# -> services
# -> app
# -> backend
# -> RetailIQ
# -> AI-Retail-Intelligence
#
# Therefore parents[4] = D:\AI-Retail-Intelligence

PROJECT_ROOT = CURRENT_FILE.parents[4]


MODEL_PATH = (
    PROJECT_ROOT
    / "ml"
    / "models"
    / "inventory_model.pkl"
)


DATA_PATH = (
    PROJECT_ROOT
    / "ml"
    / "data"
    / "processed"
    / "retail_master_clean.csv"
)


# ============================================================
# LOAD INVENTORY MODEL
# ============================================================

inventory_model_package = joblib.load(
    MODEL_PATH
)


demand_model = inventory_model_package["model"]

feature_columns = inventory_model_package[
    "feature_columns"
]

prediction_transform = inventory_model_package.get(
    "prediction_transform",
    "expm1"
)


# ============================================================
# LOAD RETAIL MASTER DATA
# ============================================================

master_df = pd.read_csv(
    DATA_PATH
)


master_df["Date"] = pd.to_datetime(
    master_df["Date"],
    errors="coerce"
)


# ============================================================
# CREATE DAILY PRODUCT DEMAND
# ============================================================

daily_demand = (
    master_df
    .groupby(
        ["StockCode", "Date"],
        as_index=False
    )
    .agg(
        Quantity=("Quantity", "sum")
    )
)


# ============================================================
# GET PRODUCT HISTORY
# ============================================================

def build_product_history(
    product_id: str
) -> Optional[pd.DataFrame]:

    product_history = (
        daily_demand[
            daily_demand["StockCode"].astype(str)
            == str(product_id)
        ]
        .sort_values("Date")
        .copy()
    )

    if product_history.empty:
        return None

    return product_history


# ============================================================
# CREATE MODEL FEATURES
# ============================================================

def create_forecast_features(
    product_history: pd.DataFrame
) -> Optional[pd.DataFrame]:

    df = product_history.copy()

    df = df.sort_values(
        "Date"
    )

    # --------------------------------------------------------
    # Lag features
    # --------------------------------------------------------

    df["Lag_1"] = (
        df["Quantity"]
        .shift(1)
    )

    df["Lag_3"] = (
        df["Quantity"]
        .shift(3)
    )

    df["Lag_7"] = (
        df["Quantity"]
        .shift(7)
    )

    df["Lag_14"] = (
        df["Quantity"]
        .shift(14)
    )

    df["Lag_21"] = (
        df["Quantity"]
        .shift(21)
    )

    df["Lag_28"] = (
        df["Quantity"]
        .shift(28)
    )

    # --------------------------------------------------------
    # Rolling mean features
    # --------------------------------------------------------

    df["RollingMean_7"] = (
        df["Quantity"]
        .shift(1)
        .rolling(7)
        .mean()
    )

    df["RollingMean_14"] = (
        df["Quantity"]
        .shift(1)
        .rolling(14)
        .mean()
    )

    df["RollingMean_30"] = (
        df["Quantity"]
        .shift(1)
        .rolling(30)
        .mean()
    )

    df["RollingMean_60"] = (
        df["Quantity"]
        .shift(1)
        .rolling(60)
        .mean()
    )

    # --------------------------------------------------------
    # Rolling standard deviation features
    # --------------------------------------------------------

    df["RollingStd_7"] = (
        df["Quantity"]
        .shift(1)
        .rolling(7)
        .std()
    )

    df["RollingStd_30"] = (
        df["Quantity"]
        .shift(1)
        .rolling(30)
        .std()
    )

    # --------------------------------------------------------
    # Calendar features
    # --------------------------------------------------------

    df["DayOfWeek"] = (
        df["Date"]
        .dt
        .dayofweek
    )

    df["Month"] = (
        df["Date"]
        .dt
        .month
    )

    df["Day"] = (
        df["Date"]
        .dt
        .day
    )

    df["IsWeekend"] = (
        df["DayOfWeek"] >= 5
    ).astype(int)

    # --------------------------------------------------------
    # Product-level demand statistics
    # --------------------------------------------------------

    df["ProductMeanDemand"] = (
        df["Quantity"]
        .mean()
    )

    df["ProductMaxDemand"] = (
        df["Quantity"]
        .max()
    )

    df["ProductStdDemand"] = (
        df["Quantity"]
        .std()
    )

    df["ProductActiveDays"] = (
        df["Quantity"] > 0
    ).sum()

    # --------------------------------------------------------
    # Handle infinity
    # --------------------------------------------------------

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    # --------------------------------------------------------
    # Keep only rows containing
    # all required model features
    # --------------------------------------------------------

    valid_df = (
        df
        .dropna(
            subset=feature_columns
        )
        .copy()
    )

    if valid_df.empty:
        return None

    return valid_df


# ============================================================
# APPLY MODEL PREDICTION TRANSFORMATION
# ============================================================

def transform_prediction(
    prediction: float
) -> float:

    if prediction_transform == "expm1":

        prediction = np.expm1(
            prediction
        )

    prediction = max(
        0.0,
        float(prediction)
    )

    return prediction


# ============================================================
# FORECAST DEMAND
# ============================================================

def forecast_demand(
    product_id: str
) -> Optional[dict]:

    product_history = (
        build_product_history(
            product_id
        )
    )

    if product_history is None:
        return None

    feature_df = (
        create_forecast_features(
            product_history
        )
    )

    if feature_df is None:
        return None

    # --------------------------------------------------------
    # Latest available feature row
    # --------------------------------------------------------

    latest_row = (
        feature_df
        .sort_values("Date")
        .iloc[-1]
    )

    # --------------------------------------------------------
    # Prepare model input
    # --------------------------------------------------------

    X = pd.DataFrame(
        [
            latest_row[
                feature_columns
            ].to_dict()
        ]
    )

    # --------------------------------------------------------
    # Predict
    # --------------------------------------------------------

    raw_prediction = (
        demand_model
        .predict(X)[0]
    )

    predicted_demand = (
        transform_prediction(
            raw_prediction
        )
    )

    return {
        "product_id": str(
            product_id
        ),
        "forecast_date": str(
            latest_row["Date"].date()
        ),
        "forecast_demand": round(
            predicted_demand,
            2
        )
    }


# ============================================================
# INVENTORY RECOMMENDATION
# ============================================================

def get_inventory_recommendation(
    product_id: str,
    current_stock: int,
    lead_time_days: int = 4,
    service_level_z: float = 1.65
) -> Optional[dict]:

    product_history = (
        build_product_history(
            product_id
        )
    )

    if product_history is None:
        return None

    feature_df = (
        create_forecast_features(
            product_history
        )
    )

    if feature_df is None:
        return None

    # --------------------------------------------------------
    # Latest feature row
    # --------------------------------------------------------

    latest_row = (
        feature_df
        .sort_values("Date")
        .iloc[-1]
    )

    # --------------------------------------------------------
    # Prepare model input
    # --------------------------------------------------------

    X = pd.DataFrame(
        [
            latest_row[
                feature_columns
            ].to_dict()
        ]
    )

    # --------------------------------------------------------
    # Forecast daily demand
    # --------------------------------------------------------

    raw_prediction = (
        demand_model
        .predict(X)[0]
    )

    predicted_daily_demand = (
        transform_prediction(
            raw_prediction
        )
    )

    # --------------------------------------------------------
    # Demand variability
    # --------------------------------------------------------

    if pd.notna(
        latest_row["RollingStd_30"]
    ):

        demand_std = float(
            latest_row[
                "RollingStd_30"
            ]
        )

    else:

        demand_std = 0.0

    demand_std = max(
        0.0,
        demand_std
    )

    # --------------------------------------------------------
    # Safety stock
    # --------------------------------------------------------

    safety_stock = (
        service_level_z
        * demand_std
        * np.sqrt(
            lead_time_days
        )
    )

    safety_stock = max(
        0.0,
        float(safety_stock)
    )

    # --------------------------------------------------------
    # Lead-time demand
    # --------------------------------------------------------

    lead_time_demand = (
        predicted_daily_demand
        * lead_time_days
    )

    # --------------------------------------------------------
    # Reorder point
    # --------------------------------------------------------

    reorder_point = (
        lead_time_demand
        + safety_stock
    )

    # --------------------------------------------------------
    # Target stock
    #
    # Reorder point + 7 days of expected demand
    # --------------------------------------------------------

    target_stock = (
        reorder_point
        + (
            predicted_daily_demand
            * 7
        )
    )

    # --------------------------------------------------------
    # Recommended order quantity
    # --------------------------------------------------------

    reorder_quantity = (
        target_stock
        - current_stock
    )

    reorder_quantity = max(
        0.0,
        float(reorder_quantity)
    )

    # --------------------------------------------------------
    # Inventory risk
    # --------------------------------------------------------

    if current_stock <= (
        reorder_point * 0.5
    ):

        risk_level = "Critical"

    elif current_stock <= reorder_point:

        risk_level = "High"

    elif current_stock <= (
        reorder_point * 1.5
    ):

        risk_level = "Medium"

    else:

        risk_level = "Low"

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    if current_stock <= reorder_point:

        recommendation = (
            "Reorder Now"
        )

    elif current_stock <= (
        reorder_point * 1.5
    ):

        recommendation = (
            "Monitor Stock"
        )

    else:

        recommendation = (
            "Stock Sufficient"
        )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "product_id": str(
            product_id
        ),

        "current_stock": int(
            current_stock
        ),

        "predicted_daily_demand": round(
            predicted_daily_demand,
            2
        ),

        "lead_time_days": int(
            lead_time_days
        ),

        "lead_time_demand": round(
            lead_time_demand,
            2
        ),

        "demand_std": round(
            demand_std,
            2
        ),

        "safety_stock": round(
            safety_stock,
            2
        ),

        "reorder_point": round(
            reorder_point,
            2
        ),

        "recommended_order_quantity": int(
            np.ceil(
                reorder_quantity
            )
        ),

        "risk_level": risk_level,

        "recommendation": recommendation
    }