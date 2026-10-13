import { useEffect, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  Package,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'

import Card from '../../components/ui/Card'
import { getOrder, getOrders, type Order } from '../../api/orders'

// ============================================================
// CUSTOMER ORDER HISTORY
// ============================================================

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrderId, setExpandedOrderId] =
    useState<number | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ==========================================================
  // LOAD CUSTOMER ORDERS
  // The backend returns only the authenticated customer's orders.
  // ==========================================================

  async function loadOrders(refresh = false) {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError(null)

      const data = await getOrders(0, 100)

      const sortedOrders = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      )

      setOrders(sortedOrders)
    } catch (err) {
      console.error('Failed to load customer orders:', err)

      setError(
        'Unable to load your orders. Please check your connection and try again.',
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  // ==========================================================
  // HELPERS
  // ==========================================================

  function formatCurrency(value: number) {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  function formatDate(value: string) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function formatTime(value: string) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getStatusStyle(status: string) {
    const normalized = (status || '').toLowerCase()

    if (
      normalized.includes('complete') ||
      normalized.includes('delivered') ||
      normalized.includes('success') ||
      normalized.includes('paid')
    ) {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    }

    if (
      normalized.includes('pending') ||
      normalized.includes('process')
    ) {
      return 'border-amber-200 bg-amber-50 text-amber-700'
    }

    if (
      normalized.includes('cancel') ||
      normalized.includes('fail')
    ) {
      return 'border-red-200 bg-red-50 text-red-700'
    }

    return 'border-slate-200 bg-slate-50 text-slate-600'
  }

  function formatStatus(status: string) {
    if (!status) return 'Unknown'

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  // ==========================================================
  // EXPAND ORDER DETAILS
  // ==========================================================

  async function toggleOrderDetails(order: Order) {
    if (expandedOrderId === order.id) {
      setExpandedOrderId(null)
      return
    }

    setExpandedOrderId(order.id)

    try {
      const detailedOrder = await getOrder(order.id)

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === detailedOrder.id
            ? detailedOrder
            : currentOrder,
        ),
      )
    } catch (err) {
      console.error('Failed to load order details:', err)
      // Keep the order visible if its details cannot be refreshed.
    }
  }

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalSpent = orders.reduce(
    (total, order) => total + Number(order.total_amount || 0),
    0,
  )

  const pendingCount = orders.filter((order) => {
    const status = (order.status || '').toLowerCase()

    return status.includes('pending') || status.includes('process')
  }).length

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-indigo-200">
              <ShoppingBag className="h-4 w-4" />
              My Account
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              My Orders
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              View your purchases, check order statuses, and review
              the items in your orders.
            </p>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <PackageCheck className="h-8 w-8 text-indigo-300" />
          </div>
        </div>
      </section>

      {/* ERROR */}

      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void loadOrders(true)}
            className="w-fit rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>

              <p className="mt-2 text-2xl font-bold text-slate-950">
                {isLoading ? '—' : orders.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>

              <p className="mt-2 text-2xl font-bold text-slate-950">
                {isLoading ? '—' : formatCurrency(totalSpent)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Orders</p>

              <p className="mt-2 text-2xl font-bold text-slate-950">
                {isLoading ? '—' : pendingCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* ORDER LIST HEADER */}

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Order History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your most recent orders appear first.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="space-y-4 p-5 sm:p-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : orders.length === 0 && !error ? (
          /* EMPTY STATE */

          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <ShoppingBag className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No orders yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When you place an order from the RetailIQ shop, it will
              appear here.
            </p>

            <a
              href="/shop"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          /* ORDER CARDS */

          <div className="space-y-4 p-4 sm:p-6">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 transition hover:border-indigo-200"
                >
                  {/* ORDER SUMMARY */}

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                          <PackageCheck className="h-5 w-5 text-indigo-600" />
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {order.order_number ||
                              `ORD-${String(order.id).padStart(6, '0')}`}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(order.created_at)}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTime(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                            order.status,
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>

                        <p className="text-lg font-bold text-slate-950">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-500">
                        Order ID: #{order.id}
                      </p>

                      <button
                        type="button"
                        onClick={() => void toggleOrderDetails(order)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        {isExpanded ? 'Hide items' : 'View items'}

                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED ORDER ITEMS */}

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
                      <h3 className="mb-3 text-sm font-bold text-slate-900">
                        Items in this order
                      </h3>

                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  Product #{item.product_id}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Quantity: {item.quantity} ×{' '}
                                  {formatCurrency(item.unit_price)}
                                </p>
                              </div>

                              <p className="shrink-0 text-sm font-bold text-slate-900">
                                {formatCurrency(item.subtotal)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-white p-4 text-sm text-slate-500">
                          No item details are available for this order.
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                        <span className="text-sm font-semibold text-slate-600">
                          Order Total
                        </span>

                        <span className="text-lg font-bold text-slate-950">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* FOOTNOTE */}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-6 text-indigo-900">
        <p className="font-semibold">About your order history</p>

        <p className="mt-1 text-indigo-800">
          Order status reflects the latest information returned by
          RetailIQ. Payment processing and delivery tracking may depend
          on additional integrations.
        </p>
      </div>
    </div>
  )
}