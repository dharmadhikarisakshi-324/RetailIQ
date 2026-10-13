import apiClient from './client'

export interface InventoryItem {
  id: number
  product_id: number
  quantity: number
  reorder_level: number
  reorder_quantity: number
  last_restocked: string | null
  product_code?: string
  product_name?: string
}

export interface InventoryIntelligence {
  product_id: string
  current_stock: number
  predicted_daily_demand: number
  lead_time_days: number
  lead_time_demand: number
  demand_std: number
  safety_stock: number
  reorder_point: number
  recommended_order_quantity: number
  risk_level: string
  recommendation: string
}

export async function getInventory(): Promise<InventoryItem[]> {
  const response = await apiClient.get<InventoryItem[]>(
    '/api/inventory',
    {
      params: {
        skip: 0,
        limit: 5000,
      },
    },
  )

  return response.data
}

export async function getInventoryItem(
  inventoryId: number,
): Promise<InventoryItem> {
  const response = await apiClient.get<InventoryItem>(
    `/api/inventory/${inventoryId}`,
  )

  return response.data
}

export async function updateInventory(
  inventoryId: number,
  data: Partial<InventoryItem>,
): Promise<InventoryItem> {
  const response = await apiClient.put<InventoryItem>(
    `/api/inventory/${inventoryId}`,
    data,
  )

  return response.data
}

export async function getInventoryIntelligence(
  productId: string,
): Promise<InventoryIntelligence> {
  const response =
    await apiClient.get<InventoryIntelligence>(
      `/api/inventory/intelligence/${encodeURIComponent(productId)}`,
    )

  return response.data
}