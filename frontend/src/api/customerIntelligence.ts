import apiClient from './client'

// =========================================================
// CUSTOMER INTELLIGENCE TYPES
// =========================================================

export interface CustomerIntelligence {
  customer_id: number
  customer_code: string
  name: string
  email: string | null
  phone: string | null

  loyalty_member: boolean
  is_active: boolean

  total_spending: number | null
  total_quantity: number | null
  number_of_transactions: number | null

  recency: number | null
  average_order_value: number | null

  r_score: number | null
  f_score: number | null
  m_score: number | null

  rfm_score: number | null
  rfm_total: number | null

  ml_cluster: number | null
  segment_name: string | null
}

// =========================================================
// GET ALL CUSTOMER INTELLIGENCE
// =========================================================

export async function getCustomerIntelligence(): Promise<
  CustomerIntelligence[]
> {
  const response = await apiClient.get<CustomerIntelligence[]>(
    '/api/customer-intelligence',
  )

  return response.data
}

// =========================================================
// GET CUSTOMER INTELLIGENCE BY CUSTOMER ID
// =========================================================

export async function getCustomerIntelligenceById(
  customerId: number,
): Promise<CustomerIntelligence> {
  const response = await apiClient.get<CustomerIntelligence>(
    `/api/customer-intelligence/${customerId}`,
  )

  return response.data
}