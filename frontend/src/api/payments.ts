import apiClient from './client'

// ============================================================
// PAYMENT TYPES
// ============================================================

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod =
  | 'online'
  | 'cash'
  | 'card'
  | 'upi'

// ============================================================
// PAYMENT INTERFACE
// ============================================================

export interface Payment {
  id: number
  order_id: number
  payment_method: PaymentMethod | string
  amount: number
  status: PaymentStatus | string
  transaction_reference: string | null
  paid_at: string | null
}

// ============================================================
// CHECKOUT REQUEST
// ============================================================

export interface CheckoutRequest {
  order_id: number
  payment_method: PaymentMethod
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

function normalizeStatus(payment: Payment): string {
  return String(payment.status ?? '')
    .trim()
    .toLowerCase()
}

// ============================================================
// CREATE CHECKOUT PAYMENT
// POST /api/payments/checkout
// ============================================================

export async function checkoutPayment(
  checkoutData: CheckoutRequest,
): Promise<Payment> {
  validatePositiveInteger(checkoutData.order_id, 'Order ID')

  const validMethods: PaymentMethod[] = [
    'online',
    'cash',
    'card',
    'upi',
  ]

  if (!validMethods.includes(checkoutData.payment_method)) {
    throw new Error('Please select a valid payment method.')
  }

  const response = await apiClient.post<Payment>(
    '/api/payments/checkout',
    checkoutData,
  )

  return response.data
}

// ============================================================
// GET ALL PAYMENTS
// ============================================================

export async function getPayments(
  skip: number = 0,
  limit: number = 100,
): Promise<Payment[]> {
  if (!Number.isInteger(skip) || skip < 0) {
    throw new Error('Skip must be a non-negative integer.')
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Limit must be between 1 and 500.')
  }

  const response = await apiClient.get<Payment[]>(
    '/api/payments',
    {
      params: {
        skip,
        limit,
      },
    },
  )

  return response.data
}

// ============================================================
// GET PAYMENT BY ID
// ============================================================

export async function getPayment(
  paymentId: number,
): Promise<Payment> {
  validatePositiveInteger(paymentId, 'Payment ID')

  const response = await apiClient.get<Payment>(
    `/api/payments/${paymentId}`,
  )

  return response.data
}

// ============================================================
// GET PAYMENT BY ORDER ID
// ============================================================

export async function getPaymentByOrder(
  orderId: number,
): Promise<Payment> {
  validatePositiveInteger(orderId, 'Order ID')

  const response = await apiClient.get<Payment>(
    `/api/payments/order/${orderId}`,
  )

  return response.data
}

// ============================================================
// PAYMENT STATUS HELPERS
// ============================================================

export function isPaymentSuccessful(
  payment: Payment,
): boolean {
  return normalizeStatus(payment) === 'paid'
}

export function isPaymentPending(
  payment: Payment,
): boolean {
  const status = normalizeStatus(payment)

  return status === 'pending' || status === 'processing'
}

export function isPaymentFailed(
  payment: Payment,
): boolean {
  const status = normalizeStatus(payment)

  return status === 'failed' || status === 'cancelled'
}

export function isPaymentRefunded(
  payment: Payment,
): boolean {
  return normalizeStatus(payment) === 'refunded'
}

// ============================================================
// USER-FRIENDLY PAYMENT STATUS
// ============================================================

export function getPaymentStatusLabel(
  payment: Payment,
): string {
  const status = normalizeStatus(payment)

  switch (status) {
    case 'paid':
      return 'Paid'

    case 'pending':
      return 'Pending'

    case 'processing':
      return 'Processing'

    case 'failed':
      return 'Failed'

    case 'cancelled':
      return 'Cancelled'

    case 'refunded':
      return 'Refunded'

    default:
      return 'Unknown'
  }
}

// ============================================================
// FORMAT PAYMENT AMOUNT
// ============================================================

export function formatPaymentAmount(
  amount: number,
): string {
  if (!Number.isFinite(amount)) {
    return '₹0.00'
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}