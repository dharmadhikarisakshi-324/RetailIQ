import apiClient from './client'

// ============================================================
// TYPES
// ============================================================

export interface SalesAnalytics {
  date: string
  sales: number
  orders: number
}

export interface TopProductAnalytics {
  product_id: number
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface LowStockProductAnalytics {
  product_id: number
  product_name: string
  stock_quantity: number
  reorder_level: number
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

function validatePositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`)
  }
}

// ============================================================
// SALES ANALYTICS
// ============================================================

/**
 * Fetch sales and order statistics.
 *
 * API: GET /api/analytics/sales
 */
export async function getSalesAnalytics(): Promise<SalesAnalytics[]> {
  const response = await apiClient.get<SalesAnalytics[]>(
    '/api/analytics/sales',
  )

  return response.data
}

// ============================================================
// TOP PRODUCTS
// ============================================================

/**
 * Fetch the top-performing products.
 *
 * API: GET /api/analytics/top-products
 */
export async function getTopProducts(
  limit: number = 5,
): Promise<TopProductAnalytics[]> {
  validatePositiveInteger(limit, 'Product limit')

  const response = await apiClient.get<TopProductAnalytics[]>(
    '/api/analytics/top-products',
    {
      params: { limit },
    },
  )

  return response.data
}

// ============================================================
// LOW STOCK PRODUCTS
// ============================================================

/**
 * Fetch products requiring inventory attention.
 *
 * API: GET /api/analytics/low-stock
 */
export async function getLowStockProducts(): Promise<
  LowStockProductAnalytics[]
> {
  const response = await apiClient.get<LowStockProductAnalytics[]>(
    '/api/analytics/low-stock',
  )

  return response.data
}

// ============================================================
// ANALYTICS HELPERS
// ============================================================

/**
 * Calculate total revenue from sales analytics data.
 */
export function calculateTotalSales(
  sales: SalesAnalytics[],
): number {
  return sales.reduce(
    (total, item) => total + (Number(item.sales) || 0),
    0,
  )
}

/**
 * Calculate total orders from sales analytics data.
 */
export function calculateTotalOrders(
  sales: SalesAnalytics[],
): number {
  return sales.reduce(
    (total, item) => total + (Number(item.orders) || 0),
    0,
  )
}

/**
 * Calculate the combined revenue of the returned top products.
 */
export function calculateTopProductsRevenue(
  products: TopProductAnalytics[],
): number {
  return products.reduce(
    (total, product) => total + (Number(product.revenue) || 0),
    0,
  )
}

/**
 * Return the number of products that need inventory attention.
 */
export function getLowStockCount(
  products: LowStockProductAnalytics[],
): number {
  return products.length
}