import apiClient from './client'

// =========================================================
// CUSTOMER TYPES
// =========================================================

export interface Customer {
  id: number
  customer_code: string
  ml_customer_id: number | null
  name: string
  email: string | null
  phone: string | null
  loyalty_member: boolean
  is_active: boolean
}

// =========================================================
// CREATE CUSTOMER TYPE
// =========================================================

export interface CreateCustomer {
  customer_code: string
  ml_customer_id?: number | null
  name: string
  email?: string | null
  phone?: string | null
  loyalty_member?: boolean
  is_active?: boolean
}

// =========================================================
// UPDATE CUSTOMER TYPE
// =========================================================

export interface UpdateCustomer {
  customer_code?: string
  ml_customer_id?: number | null
  name?: string
  email?: string | null
  phone?: string | null
  loyalty_member?: boolean
  is_active?: boolean
}

// =========================================================
// GET ALL CUSTOMERS
// Backend maximum limit: 500
// =========================================================

export async function getCustomers(
  skip: number = 0,
  limit: number = 100,
): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(
    '/api/customers',
    {
      params: { skip, limit },
    },
  )

  return response.data
}

// =========================================================
// GET CUSTOMER BY ID
// =========================================================

export async function getCustomer(
  customerId: number,
): Promise<Customer> {
  const response = await apiClient.get<Customer>(
    `/api/customers/${customerId}`,
  )

  return response.data
}

// =========================================================
// CREATE CUSTOMER
// =========================================================

export async function createCustomer(
  customerData: CreateCustomer,
): Promise<Customer> {
  const response = await apiClient.post<Customer>(
    '/api/customers',
    customerData,
  )

  return response.data
}

// =========================================================
// UPDATE CUSTOMER
// =========================================================

export async function updateCustomer(
  customerId: number,
  customerData: UpdateCustomer,
): Promise<Customer> {
  const response = await apiClient.put<Customer>(
    `/api/customers/${customerId}`,
    customerData,
  )

  return response.data
}

// =========================================================
// DELETE CUSTOMER
// Admin only
// =========================================================

export async function deleteCustomer(
  customerId: number,
): Promise<void> {
  await apiClient.delete(
    `/api/customers/${customerId}`,
  )
}