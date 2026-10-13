import apiClient from './client'

// ============================================================
// ORDER STATUS
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | string

// ============================================================
// ORDER ITEM
// ============================================================

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
}

// ============================================================
// ORDER
// ============================================================

export interface Order {
  id: number
  order_number: string
  customer_id: number | null
  total_amount: number
  status: OrderStatus
  created_at: string
  items: OrderItem[]
}

// ============================================================
// CREATE ORDER REQUEST
// ============================================================

export interface CreateOrderItem {
  product_id: number
  quantity: number
}

export interface CreateOrderRequest {
  items: CreateOrderItem[]
}

// ============================================================
// VALIDATE ORDER REQUEST
// ============================================================

function validateOrderRequest(orderData: CreateOrderRequest): void {
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error('Your cart is empty.')
  }

  for (const item of orderData.items) {
    if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
      throw new Error('Invalid product selected.')
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Product quantity must be at least 1.')
    }
  }
}

// ============================================================
// CREATE ORDER
// ============================================================

export async function createOrder(
  orderData: CreateOrderRequest,
): Promise<Order> {
  validateOrderRequest(orderData)

  const response = await apiClient.post<Order>(
    '/api/orders',
    orderData,
  )

  return response.data
}

// ============================================================
// GET ALL ORDERS
// ============================================================

export async function getOrders(
  skip: number = 0,
  limit: number = 100,
): Promise<Order[]> {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('Skip must be a non-negative integer.')
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Limit must be a positive integer.')
  }

  const response = await apiClient.get<Order[]>('/api/orders', {
    params: {
      skip,
      limit,
    },
  })

  return response.data
}

// ============================================================
// GET ORDER BY ID
// ============================================================

export async function getOrder(
  orderId: number,
): Promise<Order> {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('Invalid order ID.')
  }

  const response = await apiClient.get<Order>(
    `/api/orders/${orderId}`,
  )

  return response.data
}

// ============================================================
// GET MY ORDERS
//
// Uses the existing orders endpoint.
// The backend must filter results for the authenticated customer.
// ============================================================

export async function getMyOrders(
  skip: number = 0,
  limit: number = 100,
): Promise<Order[]> {
  return getOrders(skip, limit)
}

// ============================================================
// GET MY ORDER BY ID
// ============================================================

export async function getMyOrder(
  orderId: number,
): Promise<Order> {
  return getOrder(orderId)
}