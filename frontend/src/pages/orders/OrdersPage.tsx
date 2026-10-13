import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  IndianRupee,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react'

import Card from '../../components/ui/Card'

import {
  getOrder,
  getOrders,
  type Order,
} from '../../api/orders'

import {
  getPayments,
  type Payment,
} from '../../api/payments'

// ============================================================
// ORDERS PAGE
// ============================================================

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState('All')

  const [isLoading, setIsLoading] =
    useState(true)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [isDetailsLoading, setIsDetailsLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  // ==========================================================
  // LOAD ORDERS + PAYMENTS
  // ==========================================================

  const loadOrders = async (
    refresh = false,
  ) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError(null)

      const [ordersData, paymentsData] =
        await Promise.all([
          getOrders(),
          getPayments(),
        ])

      setOrders(ordersData)
      setPayments(paymentsData)
    } catch (err) {
      console.error(
        'Failed to load orders and payments:',
        err,
      )

      setError(
        'Unable to load orders and payment information. Please check that the RetailIQ backend is running.',
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatCurrency = (
    value: number,
  ) => {
    return `₹${Number(value || 0).toLocaleString(
      'en-IN',
      {
        maximumFractionDigits: 2,
      },
    )}`
  }

  const formatDate = (
    value: string,
  ) => {
    if (!value) {
      return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    )
  }

  const formatTime = (
    value: string,
  ) => {
    if (!value) {
      return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    )
  }

  const getStatusLabel = (
    status: string,
  ) => {
    if (!status) {
      return 'Unknown'
    }

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  }

  const getStatusClasses = (
    status: string,
  ) => {
    const normalized =
      status.toLowerCase()

    if (
      normalized.includes('complete') ||
      normalized.includes('paid') ||
      normalized.includes('delivered') ||
      normalized.includes('success')
    ) {
      return {
        badge:
          'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-500',
      }
    }

    if (
      normalized.includes('pending') ||
      normalized.includes('process')
    ) {
      return {
        badge:
          'bg-amber-50 text-amber-700 border-amber-100',
        dot: 'bg-amber-500',
      }
    }

    if (
      normalized.includes('cancel') ||
      normalized.includes('fail')
    ) {
      return {
        badge:
          'bg-red-50 text-red-700 border-red-100',
        dot: 'bg-red-500',
      }
    }

    return {
      badge:
        'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    }
  }

  const getPaymentForOrder = (
    orderId: number,
  ) => {
    return payments.find(
      (payment) =>
        payment.order_id === orderId,
    )
  }

  const getPaymentMethodLabel = (
    method: string,
  ) => {
    if (!method) {
      return 'Unknown'
    }

    const normalized =
      method.toLowerCase()

    if (normalized === 'upi') {
      return 'UPI'
    }

    if (normalized === 'cash') {
      return 'Cash'
    }

    if (normalized === 'card') {
      return 'Card'
    }

    return method
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase(),
      )
  }

  const getPaymentStatusClasses = (
    status: string,
  ) => {
    const normalized =
      status.toLowerCase()

    if (
      normalized.includes('complete') ||
      normalized.includes('success') ||
      normalized.includes('paid')
    ) {
      return {
        badge:
          'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-500',
      }
    }

    if (
      normalized.includes('pending') ||
      normalized.includes('process')
    ) {
      return {
        badge:
          'bg-amber-50 text-amber-700 border-amber-100',
        dot: 'bg-amber-500',
      }
    }

    if (
      normalized.includes('fail') ||
      normalized.includes('cancel')
    ) {
      return {
        badge:
          'bg-red-50 text-red-700 border-red-100',
        dot: 'bg-red-500',
      }
    }

    return {
      badge:
        'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    }
  }

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const statusOptions = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(
        orders
          .map((order) => order.status)
          .filter(Boolean),
      ),
    )

    return [
      'All',
      ...uniqueStatuses,
    ]
  }, [orders])

  // ==========================================================
  // FILTERED ORDERS
  // ==========================================================

  const filteredOrders = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return orders.filter((order) => {
      const payment =
        getPaymentForOrder(order.id)

      const matchesSearch =
        query === '' ||
        String(order.id)
          .toLowerCase()
          .includes(query) ||
        String(
          order.order_number ?? '',
        )
          .toLowerCase()
          .includes(query) ||
        String(
          order.customer_id ?? '',
        )
          .toLowerCase()
          .includes(query) ||
        String(order.status ?? '')
          .toLowerCase()
          .includes(query) ||
        String(
          payment?.payment_method ?? '',
        )
          .toLowerCase()
          .includes(query) ||
        String(
          payment?.status ?? '',
        )
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        order.status === statusFilter

      return (
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    orders,
    payments,
    search,
    statusFilter,
  ])

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalRevenue = useMemo(() => {
    return orders.reduce(
      (total, order) =>
        total +
        Number(
          order.total_amount || 0,
        ),
      0,
    )
  }, [orders])

  const averageOrderValue =
    orders.length > 0
      ? totalRevenue / orders.length
      : 0

  const pendingOrders = orders.filter(
    (order) => {
      const status =
        order.status?.toLowerCase() || ''

      return (
        status.includes('pending') ||
        status.includes('process')
      )
    },
  ).length

  const completedPayments =
    payments.filter((payment) => {
      const status =
        payment.status?.toLowerCase() || ''

      return (
        status.includes('complete') ||
        status.includes('success') ||
        status.includes('paid')
      )
    }).length

  // ==========================================================
  // OPEN ORDER DETAILS
  // ==========================================================

  const openOrderDetails = async (
    order: Order,
  ) => {
    try {
      setIsDetailsLoading(true)

      const freshOrder =
        await getOrder(order.id)

      setSelectedOrder(freshOrder)
    } catch (err) {
      console.error(
        'Failed to load order:',
        err,
      )

      setSelectedOrder(order)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          bg-slate-950
          px-6
          py-7
          text-white
          shadow-xl
          sm:px-8
        "
      >

        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-64
            w-64
            rounded-full
            bg-indigo-500/20
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-20
            left-1/3
            h-56
            w-56
            rounded-full
            bg-violet-500/20
            blur-3xl
          "
        />

        <div
          className="
            relative
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div>

            <div
              className="
                mb-3
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/10
                bg-white/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-indigo-200
              "
            >
              <ShoppingBag className="h-3.5 w-3.5" />

              Retail Operations
            </div>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                sm:text-4xl
              "
            >
              Orders & Payments
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-300
              "
            >
              Monitor transactions, track order
              activity and inspect payment details
              across RetailIQ.
            </p>

          </div>

          <div
            className="
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-2xl
              border
              border-white/10
              bg-white/10
              backdrop-blur
            "
          >
            <CreditCard className="h-9 w-9 text-indigo-300" />
          </div>

        </div>

      </section>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            text-red-700
          "
        >
          {error}
        </div>
      )}

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        <Card className="group p-5 transition hover:-translate-y-1 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
              "
            >
              <ShoppingBag className="h-5 w-5 text-indigo-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Orders
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : orders.length.toLocaleString(
                  'en-IN',
                )}
          </p>

        </Card>

        <Card className="group p-5 transition hover:-translate-y-1 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
              "
            >
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Revenue
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Order Revenue
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : formatCurrency(
                  totalRevenue,
                )}
          </p>

        </Card>

        <Card className="group p-5 transition hover:-translate-y-1 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-violet-50
              "
            >
              <TrendingIcon />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Average
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Average Order Value
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : formatCurrency(
                  averageOrderValue,
                )}
          </p>

        </Card>

        <Card className="group p-5 transition hover:-translate-y-1 hover:shadow-lg">

          <div className="flex items-start justify-between">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-50
              "
            >
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Payments
            </span>

          </div>

          <p className="mt-5 text-sm text-slate-500">
            Completed Payments
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : completedPayments.toLocaleString(
                  'en-IN',
                )}
          </p>

        </Card>

      </div>

      {/* ======================================================
          SECONDARY SUMMARY
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
        "
      >

        <Card className="p-5">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-amber-50
              "
            >
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>

            <div>

              <p className="text-xs font-medium text-slate-400">
                Attention
              </p>

              <p className="text-lg font-bold text-slate-900">
                {isLoading
                  ? '—'
                  : pendingOrders.toLocaleString(
                      'en-IN',
                    )}
              </p>

              <p className="text-xs text-slate-500">
                Pending orders
              </p>

            </div>

          </div>

        </Card>

        <Card className="p-5">

          <div className="flex items-center gap-3">

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-indigo-50
              "
            >
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>

            <div>

              <p className="text-xs font-medium text-slate-400">
                Payment Coverage
              </p>

              <p className="text-lg font-bold text-slate-900">
                {isLoading
                  ? '—'
                  : `${payments.length} payments`}
              </p>

              <p className="text-xs text-slate-500">
                Payment records available
              </p>

            </div>

          </div>

        </Card>

      </div>

      {/* ======================================================
          SEARCH / FILTER BAR
      ====================================================== */}

      <Card className="p-4">

        <div
          className="
            flex
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div
            className="
              relative
              w-full
              lg:max-w-md
            "
          >

            <Search
              className="
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search order, customer, status or payment..."
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                py-2.5
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-indigo-400
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-50
              "
            />

          </div>

          <div className="flex flex-wrap gap-2">

            {statusOptions.map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      status,
                    )
                  }
                  className={`
                    rounded-full
                    border
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    transition
                    ${
                      statusFilter ===
                      status
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                    }
                  `}
                >
                  {getStatusLabel(status)}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() =>
                loadOrders(true)
              }
              disabled={isRefreshing}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <RefreshCw
                className={`
                  h-4
                  w-4
                  ${
                    isRefreshing
                      ? 'animate-spin'
                      : ''
                  }
                `}
              />

              Refresh
            </button>

          </div>

        </div>

      </Card>

      {/* ======================================================
          ORDERS TABLE
      ====================================================== */}

      <Card className="overflow-hidden p-0">

        <div
          className="
            flex
            flex-col
            gap-2
            border-b
            border-slate-100
            p-6
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredOrders.length.toLocaleString(
                'en-IN',
              )}{' '}
              orders shown
            </p>

          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              bg-indigo-50
              px-3
              py-1.5
              text-xs
              font-medium
              text-indigo-700
            "
          >

            <Sparkles className="h-3.5 w-3.5" />

            RetailIQ Operations
          </div>

        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">

            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="
                  h-16
                  animate-pulse
                  rounded-xl
                  bg-slate-100
                "
              />
            ))}

          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
              "
            >
              <ShoppingBag className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No orders found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filter.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Order
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredOrders.map(
                  (order) => {
                    const statusStyle =
                      getStatusClasses(
                        order.status,
                      )

                    const payment =
                      getPaymentForOrder(
                        order.id,
                      )

                    return (
                      <tr
                        key={order.id}
                        className="
                          group
                          transition
                          hover:bg-slate-50
                        "
                      >

                        {/* ORDER */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div
                              className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                bg-indigo-50
                                text-indigo-600
                              "
                            >
                              <FileText className="h-4 w-4" />
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-slate-900">
                                {order.order_number ||
                                  `ORD-${String(
                                    order.id,
                                  ).padStart(
                                    5,
                                    '0',
                                  )}`}
                              </p>

                              <p className="text-xs text-slate-400">
                                Order #{order.id}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <div
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                bg-slate-100
                              "
                            >
                              <User className="h-4 w-4 text-slate-500" />
                            </div>

                            <span className="text-sm text-slate-700">
                              {order.customer_id
                                ? `Customer #${order.customer_id}`
                                : 'Walk-in Customer'}
                            </span>

                          </div>

                        </td>

                        {/* DATE */}

                        <td className="px-6 py-4">

                          <div>

                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(
                                order.created_at,
                              )}
                            </p>

                            <p className="text-xs text-slate-400">
                              {formatTime(
                                order.created_at,
                              )}
                            </p>

                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-6 py-4">

                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(
                              order.total_amount,
                            )}
                          </p>

                          {payment && (
                            <p className="mt-1 text-xs text-emerald-600">
                              Paid{' '}
                              {formatCurrency(
                                payment.amount,
                              )}
                            </p>
                          )}

                        </td>

                        {/* PAYMENT */}

                        <td className="px-6 py-4">

                          {payment ? (
                            <div>

                              <div className="flex items-center gap-2">

                                <CreditCard className="h-4 w-4 text-indigo-500" />

                                <span className="text-sm font-semibold text-slate-700">
                                  {getPaymentMethodLabel(
                                    payment.payment_method,
                                  )}
                                </span>

                              </div>

                              <span
                                className={`
                                  mt-1
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  border
                                  px-2
                                  py-1
                                  text-[11px]
                                  font-semibold
                                  ${
                                    getPaymentStatusClasses(
                                      payment.status,
                                    ).badge
                                  }
                                `}
                              >

                                <span
                                  className={`
                                    h-1.5
                                    w-1.5
                                    rounded-full
                                    ${
                                      getPaymentStatusClasses(
                                        payment.status,
                                      ).dot
                                    }
                                  `}
                                />

                                {getStatusLabel(
                                  payment.status,
                                )}

                              </span>

                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No payment record
                            </span>
                          )}

                        </td>

                        {/* ORDER STATUS */}

                        <td className="px-6 py-4">

                          <span
                            className={`
                              inline-flex
                              items-center
                              gap-2
                              rounded-full
                              border
                              px-3
                              py-1.5
                              text-xs
                              font-semibold
                              ${statusStyle.badge}
                            `}
                          >

                            <span
                              className={`
                                h-1.5
                                w-1.5
                                rounded-full
                                ${statusStyle.dot}
                              `}
                            />

                            {getStatusLabel(
                              order.status,
                            )}

                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              openOrderDetails(
                                order,
                              )
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1
                              rounded-lg
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-indigo-600
                              transition
                              hover:bg-indigo-50
                            "
                          >
                            View

                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>

                        </td>

                      </tr>
                    )
                  },
                )}

              </tbody>

            </table>

          </div>
        )}

      </Card>

      {/* ======================================================
          ORDER DETAILS MODAL
      ====================================================== */}

      {selectedOrder && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-sm
          "
        >

          <div
            className="
              max-h-[90vh]
              w-full
              max-w-lg
              overflow-y-auto
              rounded-3xl
              bg-white
              shadow-2xl
            "
          >

            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-start
                justify-between
                border-b
                border-slate-100
                p-6
              "
            >

              <div>

                <div
                  className="
                    mb-2
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-indigo-50
                  "
                >
                  <PackageCheck className="h-5 w-5 text-indigo-600" />
                </div>

                <h2 className="text-xl font-bold text-slate-950">
                  Order Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedOrder.order_number ||
                    `ORD-${String(
                      selectedOrder.id,
                    ).padStart(5, '0')}`}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="
                  rounded-xl
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                "
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="space-y-4 p-6">

              {isDetailsLoading && (
                <div
                  className="
                    rounded-xl
                    bg-indigo-50
                    p-3
                    text-xs
                    text-indigo-700
                  "
                >
                  Refreshing order details...
                </div>
              )}

              {/* BASIC ORDER DETAILS */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  sm:grid-cols-2
                "
              >

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium text-slate-400">
                    Order ID
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    #{selectedOrder.id}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedOrder.customer_id
                      ? `#${selectedOrder.customer_id}`
                      : 'Walk-in'}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatCurrency(
                      selectedOrder.total_amount,
                    )}
                  </p>

                </div>

                <div className="rounded-2xl bg-slate-50 p-4">

                  <p className="text-xs font-medium text-slate-400">
                    Order Status
                  </p>

                  <div className="mt-2">

                    <span
                      className={`
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        border
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        ${
                          getStatusClasses(
                            selectedOrder.status,
                          ).badge
                        }
                      `}
                    >

                      <span
                        className={`
                          h-1.5
                          w-1.5
                          rounded-full
                          ${
                            getStatusClasses(
                              selectedOrder.status,
                            ).dot
                          }
                        `}
                      />

                      {getStatusLabel(
                        selectedOrder.status,
                      )}

                    </span>

                  </div>

                </div>

              </div>

              {/* PAYMENT DETAILS */}

              {(() => {
                const payment =
                  getPaymentForOrder(
                    selectedOrder.id,
                  )

                if (!payment) {
                  return (
                    <div
                      className="
                        rounded-2xl
                        border
                        border-amber-100
                        bg-amber-50
                        p-5
                      "
                    >

                      <div className="flex items-start gap-3">

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-amber-100
                          "
                        >
                          <CreditCard className="h-5 w-5 text-amber-600" />
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-900">
                            Payment Information
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            No payment record is currently
                            associated with this order.
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                }

                return (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-emerald-100
                      bg-emerald-50/60
                      p-5
                    "
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-3">

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-emerald-100
                          "
                        >
                          <CreditCard className="h-5 w-5 text-emerald-600" />
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-slate-900">
                            Payment Details
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Payment #{payment.id}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`
                          inline-flex
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          px-2.5
                          py-1
                          text-[11px]
                          font-semibold
                          ${
                            getPaymentStatusClasses(
                              payment.status,
                            ).badge
                          }
                        `}
                      >

                        <span
                          className={`
                            h-1.5
                            w-1.5
                            rounded-full
                            ${
                              getPaymentStatusClasses(
                                payment.status,
                              ).dot
                            }
                          `}
                        />

                        {getStatusLabel(
                          payment.status,
                        )}

                      </span>

                    </div>

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-2
                      "
                    >

                      <div className="rounded-xl bg-white/80 p-3">

                        <p className="text-[11px] font-medium text-slate-400">
                          Method
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {getPaymentMethodLabel(
                            payment.payment_method,
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-white/80 p-3">

                        <p className="text-[11px] font-medium text-slate-400">
                          Paid Amount
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatCurrency(
                            payment.amount,
                          )}
                        </p>

                      </div>

                      <div className="rounded-xl bg-white/80 p-3">

                        <p className="text-[11px] font-medium text-slate-400">
                          Transaction Reference
                        </p>

                        <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                          {payment.transaction_reference ||
                            'Not provided'}
                        </p>

                      </div>

                      <div className="rounded-xl bg-white/80 p-3">

                        <p className="text-[11px] font-medium text-slate-400">
                          Paid At
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
  {payment.paid_at ? formatDate(payment.paid_at) : "—"}
</p>

                        <p className="text-xs text-slate-500">
  {payment.paid_at
    ? formatTime(payment.paid_at)
    : "—"}
</p>

                      </div>

                    </div>

                  </div>
                )
              })()}

              {/* RETAILIQ INSIGHT */}

              <div
                className="
                  rounded-2xl
                  border
                  border-indigo-100
                  bg-indigo-50/50
                  p-5
                "
              >

                <div className="flex items-start gap-3">

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-indigo-100
                    "
                  >
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-900">
                      RetailIQ Order Insight
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This order is connected to
                      RetailIQ's customer, product
                      and sales intelligence ecosystem.
                    </p>

                  </div>

                </div>

              </div>

              {/* CREATED */}

              <div className="rounded-2xl border border-slate-100 p-4">

                <div className="flex items-center gap-2 text-slate-500">

                  <CalendarDays className="h-4 w-4" />

                  <span className="text-xs font-medium">
                    Created
                  </span>

                </div>

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(
                    selectedOrder.created_at,
                  )}
                </p>

                <p className="text-xs text-slate-500">
                  {formatTime(
                    selectedOrder.created_at,
                  )}
                </p>

              </div>

              {/* ORDER ITEMS */}

              {selectedOrder.items &&
                selectedOrder.items.length > 0 && (
                  <div className="rounded-2xl border border-slate-100 p-4">

                    <div className="flex items-center gap-2">

                      <PackageCheck className="h-4 w-4 text-indigo-500" />

                      <p className="text-sm font-semibold text-slate-900">
                        Order Items
                      </p>

                    </div>

                    <div className="mt-3 space-y-2">

                      {selectedOrder.items.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="
                              flex
                              items-center
                              justify-between
                              rounded-xl
                              bg-slate-50
                              p-3
                            "
                          >

                            <div>

                              <p className="text-xs font-semibold text-slate-700">
                                Product #{item.product_id}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Qty {item.quantity} ×{' '}
                                {formatCurrency(
                                  item.unit_price,
                                )}
                              </p>

                            </div>

                            <p className="text-sm font-bold text-slate-900">
                              {formatCurrency(
                                item.subtotal,
                              )}
                            </p>

                          </div>
                        ),
                      )}

                    </div>

                  </div>
                )}

            </div>

            {/* CLOSE */}

            <div className="border-t border-slate-100 p-6">

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="
                  w-full
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

// ============================================================
// SMALL TREND ICON
// ============================================================

function TrendingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 text-violet-600"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17l6-6 4 4 8-9"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 6h5v5"
      />
    </svg>
  )
}

export default OrdersPage