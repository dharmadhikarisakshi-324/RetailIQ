import apiClient from './client'

// ============================================================
// PRODUCT
// ============================================================

export interface POSProduct {
  id: number
  product_code: string
  barcode: string | null
  name: string
  description: string | null
  price: number
  is_active: boolean
}

// ============================================================
// CUSTOMER
// ============================================================

export interface POSCustomer {
  id: number
  customer_code: string
  name: string
  phone: string | null
  email: string | null
  is_active: boolean
}

// ============================================================
// CART
// ============================================================

export interface POSCartItem {
  product: POSProduct
  quantity: number
}

// ============================================================
// ORDER ITEM
// ============================================================

export interface CreatePOSOrderItem {
  product_id: number
  quantity: number
}

// ============================================================
// CREATE ORDER
// ============================================================

export interface CreatePOSOrder {
  customer_id?: number | null
  items: CreatePOSOrderItem[]
  status?: string
}

// ============================================================
// ORDER RESPONSE
// ============================================================

export interface POSOrderResponse {
  id: number
  order_number: string
  customer_id: number | null
  total_amount: number
  status: string
  created_at: string

  items: Array<{
    id: number
    order_id: number
    product_id: number
    quantity: number
    unit_price: number
    subtotal: number
  }>
}

// ============================================================
// PAYMENT
// ============================================================

export interface CreatePOSPayment {
  order_id: number
  payment_method: string
  amount: number
  status?: string
  transaction_reference?: string | null
}

// ============================================================
// PAYMENT RESPONSE
// ============================================================

export interface POSPaymentResponse {
  id: number
  order_id: number
  payment_method: string
  amount: number
  status: string
  transaction_reference: string | null
  paid_at: string
}

// ============================================================
// GET PRODUCTS
// ============================================================

export async function getPOSProducts(): Promise<POSProduct[]> {
  const response = await apiClient.get<POSProduct[]>(
    '/api/products',
    {
      params: {
        skip: 0,
        limit: 500,
      },
    },
  )

  const products = response.data

  if (!Array.isArray(products)) {
    throw new Error('Products API did not return an array.')
  }

  return products.filter((product) => product.is_active)
}

// ============================================================
// GET CUSTOMERS
// ============================================================

export async function getPOSCustomers(): Promise<POSCustomer[]> {
  // Do not send skip/limit until the backend's accepted
  // pagination parameters and limits have been confirmed.
  const response = await apiClient.get<POSCustomer[]>(
    '/api/customers',
  )

  const customers = response.data

  if (!Array.isArray(customers)) {
    throw new Error('Customers API did not return an array.')
  }

  return customers.filter((customer) => customer.is_active)
}

// ============================================================
// CREATE ORDER
// ============================================================

export async function createPOSOrder(
  orderData: CreatePOSOrder,
): Promise<POSOrderResponse> {
  const response = await apiClient.post<POSOrderResponse>(
    '/api/orders',
    orderData,
  )

  return response.data
}

// ============================================================
// CREATE PAYMENT
// ============================================================

export async function createPOSPayment(
  paymentData: CreatePOSPayment,
): Promise<POSPaymentResponse> {
  const response = await apiClient.post<POSPaymentResponse>(
    '/api/payments',
    paymentData,
  )

  return response.data
}