from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
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
    / "promotion_model.pkl"
)


# ============================================================
# CHECK MODEL
# ============================================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Promotion model not found:\n{MODEL_PATH}"
    )


# ============================================================
# LOAD PROMOTION MODEL
# ============================================================

promotion_model = joblib.load(
    MODEL_PATH
)


# ============================================================
# EXTRACT MODEL COMPONENTS
# ============================================================

purchase_model = promotion_model[
    "purchase_model"
]

feature_columns = promotion_model[
    "feature_columns"
]

promotion_scenarios = promotion_model[
    "promotion_scenarios"
]

segment_response = promotion_model[
    "segment_response"
]

customer_features = promotion_model[
    "customer_features"
]

product_features = promotion_model[
    "product_features"
]

customer_product_features = promotion_model[
    "customer_product_features"
]


# ============================================================
# NORMALIZE DATA TYPES
# ============================================================

customer_features = customer_features.copy()

product_features = product_features.copy()

customer_product_features = (
    customer_product_features.copy()
)


# Customer IDs

customer_features["Customer ID"] = (
    pd.to_numeric(
        customer_features["Customer ID"],
        errors="coerce"
    )
)


customer_product_features["Customer ID"] = (
    pd.to_numeric(
        customer_product_features["Customer ID"],
        errors="coerce"
    )
)


# Product codes

product_features["StockCode"] = (
    product_features["StockCode"]
    .astype(str)
    .str.strip()
)

customer_product_features["StockCode"] = (
    customer_product_features["StockCode"]
    .astype(str)
    .str.strip()
)


# ============================================================
# CLEAN NUMERIC COLUMNS
# ============================================================

numeric_customer_columns = [
    "Recency",
    "Frequency",
    "MonetaryValue",
    "AOV"
]

for column in numeric_customer_columns:

    if column in customer_features.columns:

        customer_features[column] = (
            pd.to_numeric(
                customer_features[column],
                errors="coerce"
            )
            .fillna(0)
        )


numeric_product_columns = [
    "TotalQuantity",
    "TotalRevenue",
    "Transactions",
    "Customers",
    "AveragePrice",
    "ProductPopularity",
    "PurchaseFrequency"
]

for column in numeric_product_columns:

    if column in product_features.columns:

        product_features[column] = (
            pd.to_numeric(
                product_features[column],
                errors="coerce"
            )
            .fillna(0)
        )


numeric_history_columns = [
    "PurchaseCount",
    "PreviousQuantity",
    "PreviousSpending",
    "PreviouslyPurchased"
]

for column in numeric_history_columns:

    if column in customer_product_features.columns:

        customer_product_features[column] = (
            pd.to_numeric(
                customer_product_features[column],
                errors="coerce"
            )
            .fillna(0)
        )


# ============================================================
# HELPER
# ============================================================

def _safe_float(value: Any) -> float:

    try:

        value = float(value)

        if np.isnan(value):
            return 0.0

        if np.isinf(value):
            return 0.0

        return value

    except Exception:

        return 0.0


# ============================================================
# SELECT BEST OFFER
# ============================================================

def select_best_offer(
    purchase_probability: float,
    product_price: float,
    customer_segment: str
) -> pd.DataFrame:

    results = []

    for _, offer in promotion_scenarios.iterrows():

        offer_name = offer["Offer"]

        discount_rate = _safe_float(
            offer["DiscountRate"]
        )

        # ----------------------------------------------------
        # Segment-specific response
        # ----------------------------------------------------

        segment_factors = (
            segment_response.get(
                customer_segment,
                {}
            )
        )

        response_factor = (
            segment_factors.get(
                offer_name,
                1.00
            )
        )

        response_factor = _safe_float(
            response_factor
        )

        # ----------------------------------------------------
        # Estimated purchase probability
        # ----------------------------------------------------

        estimated_probability = (
            purchase_probability
            * response_factor
        )

        estimated_probability = min(
            estimated_probability,
            1.0
        )

        # ----------------------------------------------------
        # Discounted price
        # ----------------------------------------------------

        discounted_price = (
            product_price
            * (1 - discount_rate)
        )

        # ----------------------------------------------------
        # Expected revenue
        # ----------------------------------------------------

        expected_revenue = (
            estimated_probability
            * discounted_price
        )

        results.append(
            {
                "Offer": offer_name,
                "DiscountRate": discount_rate,
                "ResponseFactor": response_factor,
                "EstimatedPurchaseProbability":
                    estimated_probability,
                "DiscountedPrice":
                    discounted_price,
                "ExpectedRevenue":
                    expected_revenue
            }
        )

    results_df = pd.DataFrame(
        results
    )

    results_df = (
        results_df
        .sort_values(
            "ExpectedRevenue",
            ascending=False
        )
        .reset_index(
            drop=True
        )
    )

    return results_df


# ============================================================
# GET PROMOTION RECOMMENDATION
# ============================================================

def get_promotion_recommendation(
    customer_id: int,
    product_id: str
) -> Optional[Dict[str, Any]]:

    # --------------------------------------------------------
    # Normalize IDs
    # --------------------------------------------------------

    try:

        customer_id = int(
            float(customer_id)
        )

    except Exception:

        return None


    product_id = str(
        product_id
    ).strip()


    # ========================================================
    # GET CUSTOMER
    # ========================================================

    customer_row = customer_features[
        customer_features["Customer ID"]
        == customer_id
    ]

    if customer_row.empty:

        return None


    # ========================================================
    # GET PRODUCT
    # ========================================================

    product_row = product_features[
        product_features["StockCode"]
        == product_id
    ]

    if product_row.empty:

        return None


    customer_row = (
        customer_row
        .iloc[0]
    )

    product_row = (
        product_row
        .iloc[0]
    )


    # ========================================================
    # PREVIOUS PURCHASE HISTORY
    # ========================================================

    history = customer_product_features[
        (
            customer_product_features[
                "Customer ID"
            ]
            == customer_id
        )
        &
        (
            customer_product_features[
                "StockCode"
            ]
            == product_id
        )
    ]


    if history.empty:

        purchase_count = 0

        previous_quantity = 0

        previous_spending = 0

        previously_purchased = 0

    else:

        history = (
            history
            .iloc[0]
        )

        purchase_count = (
            history["PurchaseCount"]
        )

        previous_quantity = (
            history["PreviousQuantity"]
        )

        previous_spending = (
            history["PreviousSpending"]
        )

        previously_purchased = 1


    # ========================================================
    # MODEL INPUT
    # ========================================================

    model_input = pd.DataFrame(
        [
            {
                "Recency":
                    customer_row["Recency"],

                "Frequency":
                    customer_row["Frequency"],

                "MonetaryValue":
                    customer_row[
                        "MonetaryValue"
                    ],

                "AOV":
                    customer_row["AOV"],

                "TotalQuantity":
                    product_row[
                        "TotalQuantity"
                    ],

                "TotalRevenue":
                    product_row[
                        "TotalRevenue"
                    ],

                "Transactions":
                    product_row[
                        "Transactions"
                    ],

                "Customers":
                    product_row[
                        "Customers"
                    ],

                "AveragePrice":
                    product_row[
                        "AveragePrice"
                    ],

                "ProductPopularity":
                    product_row[
                        "ProductPopularity"
                    ],

                "PurchaseFrequency":
                    product_row[
                        "PurchaseFrequency"
                    ],

                "PurchaseCount":
                    purchase_count,

                "PreviousQuantity":
                    previous_quantity,

                "PreviousSpending":
                    previous_spending,

                "PreviouslyPurchased":
                    previously_purchased
            }
        ]
    )


    # ========================================================
    # ENSURE FEATURE ORDER
    # ========================================================

    model_input = model_input[
        feature_columns
    ]


    # ========================================================
    # PURCHASE PROBABILITY
    # ========================================================

    purchase_probability = (
        purchase_model
        .predict_proba(
            model_input
        )[0, 1]
    )


    purchase_probability = _safe_float(
        purchase_probability
    )


    # ========================================================
    # CUSTOMER SEGMENT
    # ========================================================

    customer_segment = str(
        customer_row[
            "CustomerSegment"
        ]
    )


    # ========================================================
    # PRODUCT PRICE
    # ========================================================

    product_price = _safe_float(
        product_row[
            "AveragePrice"
        ]
    )


    # ========================================================
    # EVALUATE OFFERS
    # ========================================================

    offer_results = select_best_offer(
        purchase_probability,
        product_price,
        customer_segment
    )


    # ========================================================
    # NO OFFERS
    # ========================================================

    if offer_results.empty:

        return None


    # ========================================================
    # BEST OFFER
    # ========================================================

    best_offer = (
        offer_results
        .iloc[0]
    )


    # ========================================================
    # FINAL RESULT
    # ========================================================

    return {
        "Customer ID":
            customer_id,

        "StockCode":
            product_id,

        "Description":
            str(
                product_row[
                    "Description"
                ]
            ).strip(),

        "CustomerSegment":
            customer_segment,

        "PurchaseProbability":
            round(
                purchase_probability,
                4
            ),

        "RecommendedOffer":
            str(
                best_offer[
                    "Offer"
                ]
            ),

        "DiscountRate":
            round(
                _safe_float(
                    best_offer[
                        "DiscountRate"
                    ]
                ),
                4
            ),

        "EstimatedPurchaseProbability":
            round(
                _safe_float(
                    best_offer[
                        "EstimatedPurchaseProbability"
                    ]
                ),
                4
            ),

        "ProductPrice":
            round(
                product_price,
                2
            ),

        "DiscountedPrice":
            round(
                _safe_float(
                    best_offer[
                        "DiscountedPrice"
                    ]
                ),
                2
            ),

        "ExpectedRevenue":
            round(
                _safe_float(
                    best_offer[
                        "ExpectedRevenue"
                    ]
                ),
                2
            )
    }


# ============================================================
# GET ALL OFFER SCENARIOS
# ============================================================

def get_all_promotion_offers(
    customer_id: int,
    product_id: str
) -> Optional[List[Dict[str, Any]]]:

    # --------------------------------------------------------
    # Normalize IDs
    # --------------------------------------------------------

    try:

        customer_id = int(
            float(customer_id)
        )

    except Exception:

        return None


    product_id = str(
        product_id
    ).strip()


    # ========================================================
    # CUSTOMER
    # ========================================================

    customer_row = customer_features[
        customer_features["Customer ID"]
        == customer_id
    ]

    if customer_row.empty:

        return None


    # ========================================================
    # PRODUCT
    # ========================================================

    product_row = product_features[
        product_features["StockCode"]
        == product_id
    ]

    if product_row.empty:

        return None


    customer_row = (
        customer_row
        .iloc[0]
    )

    product_row = (
        product_row
        .iloc[0]
    )


    # ========================================================
    # HISTORY
    # ========================================================

    history = customer_product_features[
        (
            customer_product_features[
                "Customer ID"
            ]
            == customer_id
        )
        &
        (
            customer_product_features[
                "StockCode"
            ]
            == product_id
        )
    ]


    if history.empty:

        purchase_count = 0
        previous_quantity = 0
        previous_spending = 0
        previously_purchased = 0

    else:

        history = (
            history
            .iloc[0]
        )

        purchase_count = (
            history["PurchaseCount"]
        )

        previous_quantity = (
            history["PreviousQuantity"]
        )

        previous_spending = (
            history["PreviousSpending"]
        )

        previously_purchased = 1


    # ========================================================
    # MODEL INPUT
    # ========================================================

    model_input = pd.DataFrame(
        [
            {
                "Recency":
                    customer_row["Recency"],

                "Frequency":
                    customer_row["Frequency"],

                "MonetaryValue":
                    customer_row[
                        "MonetaryValue"
                    ],

                "AOV":
                    customer_row["AOV"],

                "TotalQuantity":
                    product_row[
                        "TotalQuantity"
                    ],

                "TotalRevenue":
                    product_row[
                        "TotalRevenue"
                    ],

                "Transactions":
                    product_row[
                        "Transactions"
                    ],

                "Customers":
                    product_row[
                        "Customers"
                    ],

                "AveragePrice":
                    product_row[
                        "AveragePrice"
                    ],

                "ProductPopularity":
                    product_row[
                        "ProductPopularity"
                    ],

                "PurchaseFrequency":
                    product_row[
                        "PurchaseFrequency"
                    ],

                "PurchaseCount":
                    purchase_count,

                "PreviousQuantity":
                    previous_quantity,

                "PreviousSpending":
                    previous_spending,

                "PreviouslyPurchased":
                    previously_purchased
            }
        ]
    )


    model_input = model_input[
        feature_columns
    ]


    # ========================================================
    # BASE PROBABILITY
    # ========================================================

    purchase_probability = (
        purchase_model
        .predict_proba(
            model_input
        )[0, 1]
    )

    purchase_probability = _safe_float(
        purchase_probability
    )


    # ========================================================
    # CUSTOMER SEGMENT
    # ========================================================

    customer_segment = str(
        customer_row[
            "CustomerSegment"
        ]
    )


    product_price = _safe_float(
        product_row[
            "AveragePrice"
        ]
    )


    # ========================================================
    # ALL OFFERS
    # ========================================================

    all_offers = select_best_offer(
        purchase_probability,
        product_price,
        customer_segment
    )


    # ========================================================
    # CONVERT TO API FORMAT
    # ========================================================

    results = []

    for _, row in all_offers.iterrows():

        results.append(
            {
                "offer": str(
                    row["Offer"]
                ),

                "discount_rate": round(
                    _safe_float(
                        row["DiscountRate"]
                    ),
                    4
                ),

                "response_factor": round(
                    _safe_float(
                        row["ResponseFactor"]
                    ),
                    4
                ),

                "estimated_purchase_probability":
                    round(
                        _safe_float(
                            row[
                                "EstimatedPurchaseProbability"
                            ]
                        ),
                        4
                    ),

                "discounted_price": round(
                    _safe_float(
                        row[
                            "DiscountedPrice"
                        ]
                    ),
                    2
                ),

                "expected_revenue": round(
                    _safe_float(
                        row[
                            "ExpectedRevenue"
                        ]
                    ),
                    2
                )
            }
        )

    return results