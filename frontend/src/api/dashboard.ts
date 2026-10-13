import apiClient from './client'

export interface DashboardAnalytics {
  total_sales: number
  total_orders: number
  total_customers: number
  total_products: number
  low_stock_products: number
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const response = await apiClient.get<DashboardAnalytics>(
    '/api/analytics/dashboard',
  )

  return response.data
}