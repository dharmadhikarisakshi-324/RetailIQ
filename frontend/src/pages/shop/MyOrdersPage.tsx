import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'

import { getOrders } from '../../api/orders'
import type { Order } from '../../api/orders'

import Button from '../../components/ui/Button'

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'delivered':
      return 'bg-green-100 text-green-800'

    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800'

    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800'

    case 'shipped':
      return 'bg-blue-100 text-blue-800'

    default:
      return 'bg-gray-100 text-gray-700'
  }
}

// ============================================================
// MY ORDERS PAGE
// ============================================================

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrders, setExpandedOrders] = useState<number[]>([])

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  async function loadOrders() {
    try {
      setIsLoading(true)
      setError('')

      const result = await getOrders(0, 100)

      setOrders(Array.isArray(result) ? result : [])
    } catch (err) {
      console.error('Failed to load orders:', err)

      setError(
        'Unable to load your orders. Please check your connection and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  // ==========================================================
  // EXPAND ORDER DETAILS
  // ==========================================================

  function toggleOrder(orderId: number) {
    setExpandedOrders((previous) =>
      previous.includes(orderId)
        ? previous.filter((id) => id !== orderId)
        : [...previous, orderId],
    )
  }

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3">
        <Loader2
          size={36}
          className="animate-spin text-blue-600"
        />

        <p className="text-gray-500">
          Loading your orders...
        </p>
      </div>
    )
  }

  // ==========================================================
  // PAGE UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ShoppingBag size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                My Orders
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View your purchases and order details.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void loadOrders()}
            className="flex items-center gap-2"
          >
            <RefreshCw size={17} />
            Refresh
          </Button>
        </div>

        {/* ERROR STATE */}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              <p className="font-semibold">
                Could not load orders
              </p>

              <p className="mt-1 text-sm">{error}</p>

              <Button
                type="button"
                onClick={() => void loadOrders()}
                className="mt-3"
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {/* ORDER SUMMARY */}

        {!error && orders.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <Package size={23} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total orders
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {orders.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3 text-green-700">
                  <ShoppingBag size={23} />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Total order value
                  </p>

                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      orders.reduce(
                        (total, order) =>
                          total + order.total_amount,
                        0,
                      ),
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}

        {!error && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <ShoppingBag
                size={32}
                className="text-blue-500"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Your placed orders will appear here. Visit the shop
              to discover products and start shopping.
            </p>
          </div>
        )}

        {/* ORDER LIST */}

        {!error && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const isExpanded = expandedOrders.includes(order.id)

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* ORDER HEADER */}

                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Order number
                      </p>

                      <h2 className="mt-1 break-all text-lg font-bold text-gray-900">
                        {order.order_number}
                      </h2>

                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <CalendarDays size={16} />

                        <span>
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-xs text-gray-500">
                          Order total
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-700">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${getStatusClasses(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* ORDER DETAILS TOGGLE */}

                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    className="flex w-full items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    aria-expanded={isExpanded}
                  >
                    <span>
                      {isExpanded
                        ? 'Hide order details'
                        : 'View order details'}
                    </span>

                    {isExpanded ? (
                      <ChevronUp size={19} />
                    ) : (
                      <ChevronDown size={19} />
                    )}
                  </button>

                  {/* ORDER ITEMS */}

                  {isExpanded && (
                    <div className="border-t border-gray-200 p-5">
                      {!order.items ||
                      order.items.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No item details are available for this order.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[440px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-500">
                                <th className="pb-3 pr-4 font-medium">
                                  Product ID
                                </th>

                                <th className="pb-3 px-4 text-center font-medium">
                                  Quantity
                                </th>

                                <th className="pb-3 px-4 text-right font-medium">
                                  Unit price
                                </th>

                                <th className="pb-3 pl-4 text-right font-medium">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {order.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className="border-b border-gray-100 last:border-0"
                                >
                                  <td className="py-4 pr-4 font-medium text-gray-900">
                                    #{item.product_id}
                                  </td>

                                  <td className="px-4 py-4 text-center text-gray-600">
                                    {item.quantity}
                                  </td>

                                  <td className="px-4 py-4 text-right text-gray-600">
                                    {formatCurrency(item.unit_price)}
                                  </td>

                                  <td className="py-4 pl-4 text-right font-semibold text-gray-900">
                                    {formatCurrency(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
                        <span className="font-medium text-gray-600">
                          Order total
                        </span>

                        <span className="font-bold text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {/* FOOTER NOTE */}

        <p className="mt-8 text-center text-sm text-gray-500">
          Order information is loaded from your RetailIQ account.
        </p>
      </div>
    </div>
  )
}