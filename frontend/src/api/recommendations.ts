import apiClient from './client';

// ============================================================
// TYPES
// ============================================================

export interface RecommendedProduct {
  StockCode: string;
  Description: string;
  TotalQuantity?: number;
  TotalRevenue?: number;
  Transactions?: number;
  Customers?: number;
  [key: string]: unknown;
}

export interface RecommendationResponse {
  customer_id?: number;
  recommendation_type: string;
  message?: string;
  products: RecommendedProduct[];
}

export interface SimilarProductsResponse {
  stock_code: string;
  recommendation_type: string;
  products: RecommendedProduct[];
}

// ============================================================
// GET PERSONALIZED RECOMMENDATIONS
// GET /api/recommendations/for-you?top_n=10
// ============================================================

export async function getRecommendations(
  topN: number = 10
): Promise<RecommendationResponse> {
  const response = await apiClient.get<RecommendationResponse>(
    '/api/recommendations/for-you',
    {
      params: {
        top_n: topN,
      },
    }
  );

  return response.data;
}

// ============================================================
// GET SIMILAR PRODUCTS
// GET /api/recommendations/similar/{stock_code}?top_n=10
// ============================================================

export async function getSimilarProducts(
  stockCode: string,
  topN: number = 10
): Promise<SimilarProductsResponse> {
  const response = await apiClient.get<SimilarProductsResponse>(
    `/api/recommendations/similar/${encodeURIComponent(stockCode)}`,
    {
      params: {
        top_n: topN,
      },
    }
  );

  return response.data;
}