import apiClient from './client'

// =========================================================
// PRODUCT INTELLIGENCE TYPES
// =========================================================

export interface ProductSummary {
  StockCode: string
  Description: string
  TotalQuantity: number
  TotalRevenue: number
  Transactions: number
  Customers: number
}

export interface SimilarProduct {
  StockCode: string
  Description: string
  similarity_score: number
}

export interface AssociationRule {
  antecedents: string
  consequents: string
  support: number
  confidence: number
  lift: number
}

export interface ProductIntelligenceResponse {
  product: ProductSummary
  similar_products: SimilarProduct[]
  association_rules: AssociationRule[]
}

export interface SimilarProductsResponse {
  StockCode: string
  Description: string
  similar_products: SimilarProduct[]
}

export interface AssociationRulesResponse {
  StockCode: string
  Description: string
  association_rules: AssociationRule[]
}

// =========================================================
// GET COMPLETE PRODUCT INTELLIGENCE
// =========================================================

export async function getProductIntelligence(
  stockCode: string,
): Promise<ProductIntelligenceResponse> {
  const response =
    await apiClient.get<ProductIntelligenceResponse>(
      `/api/product-intelligence/${encodeURIComponent(stockCode)}`,
    )

  return response.data
}

// =========================================================
// GET PRODUCT SUMMARY
// =========================================================

export async function getProductSummary(
  stockCode: string,
): Promise<ProductSummary> {
  const response =
    await apiClient.get<ProductSummary>(
      `/api/product-intelligence/summary/${encodeURIComponent(stockCode)}`,
    )

  return response.data
}

// =========================================================
// GET SIMILAR PRODUCTS
// =========================================================

export async function getSimilarProducts(
  stockCode: string,
): Promise<SimilarProductsResponse> {
  const response =
    await apiClient.get<SimilarProductsResponse>(
      `/api/product-intelligence/similar/${encodeURIComponent(stockCode)}`,
    )

  return response.data
}

// =========================================================
// GET ASSOCIATION RULES
// =========================================================

export async function getAssociationRules(
  stockCode: string,
): Promise<AssociationRulesResponse> {
  const response =
    await apiClient.get<AssociationRulesResponse>(
      `/api/product-intelligence/associations/${encodeURIComponent(stockCode)}`,
    )

  return response.data
}