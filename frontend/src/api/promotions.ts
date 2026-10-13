import apiClient from './client'

export interface PromotionRecommendation {
  customer_id: number
  stock_code: string
  description: string
  customer_segment: string
  purchase_probability: number
  recommended_offer: string
  discount_rate: number
  estimated_purchase_probability: number
  product_price: number
  discounted_price: number
  expected_revenue: number
}

export interface PromotionOffer {
  offer: string
  discount_rate: number
  response_factor: number
  estimated_purchase_probability: number
  discounted_price: number
  expected_revenue: number
}

export interface PromotionOffersResponse {
  customer_id: number
  stock_code: string
  offers: PromotionOffer[]
}

export async function getPromotionRecommendation(
  customerId: number,
  productId: string,
): Promise<PromotionRecommendation> {
  const response = await apiClient.get<PromotionRecommendation>(
    `/api/promotions/recommend/${encodeURIComponent(customerId)}/${encodeURIComponent(productId)}`,
  )

  return response.data
}

export async function getPromotionOffers(
  customerId: number,
  productId: string,
): Promise<PromotionOffersResponse> {
  const response = await apiClient.get<PromotionOffersResponse>(
    `/api/promotions/offers/${encodeURIComponent(customerId)}/${encodeURIComponent(productId)}`,
  )

  return response.data
}