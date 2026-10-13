import apiClient from './client'

// ============================================================
// INVENTORY INTELLIGENCE TYPES
// ============================================================

export interface InventoryRecommendation {
  product_id: string
  current_stock: number
  predicted_daily_demand: number
  lead_time_days: number
  lead_time_demand: number
  demand_std: number
  safety_stock: number
  reorder_point: number
  recommended_order_quantity: number
  risk_level: 'High' | 'Medium' | 'Low'
  recommendation: string
}

// ============================================================
// GET INVENTORY INTELLIGENCE
// ============================================================

export async function getInventoryIntelligence(
  productId: string,
): Promise<InventoryRecommendation> {
  const response =
    await apiClient.get<InventoryRecommendation>(
      `/api/inventory/intelligence/${encodeURIComponent(productId)}`,
    )

  return response.data
}