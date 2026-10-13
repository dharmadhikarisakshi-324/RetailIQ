from typing import List

from pydantic import BaseModel


# =========================================================
# SIMILAR PRODUCT
# =========================================================

class SimilarProduct(BaseModel):
    StockCode: str
    Description: str
    similarity_score: float


# =========================================================
# SIMILAR PRODUCTS RESPONSE
# =========================================================

class SimilarProductsResponse(BaseModel):
    StockCode: str
    Description: str
    similar_products: List[SimilarProduct]


# =========================================================
# PRODUCT SUMMARY
# =========================================================

class ProductSummary(BaseModel):
    StockCode: str
    Description: str
    TotalQuantity: float
    TotalRevenue: float
    Transactions: int
    Customers: int


# =========================================================
# ASSOCIATION RULE
# =========================================================

class AssociationRule(BaseModel):
    antecedents: str
    consequents: str
    support: float
    confidence: float
    lift: float


# =========================================================
# PRODUCT INTELLIGENCE RESPONSE
# =========================================================

class ProductIntelligenceResponse(BaseModel):
    product: ProductSummary
    similar_products: List[SimilarProduct]
    association_rules: List[AssociationRule]