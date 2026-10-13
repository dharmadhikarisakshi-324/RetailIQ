import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'

import Card from '../../components/ui/Card'

import {
  getPayments,
  type Payment,
} from '../../api/payments'

// ============================================================
// PAYMENTS PAGE
// ============================================================

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null)

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('All')

  const [methodFilter, setMethodFilter] = useState('All')

  const [isLoading, setIsLoading] = useState(true)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // ==========================================================
  // LOAD PAYMENTS
  // ==========================================================

  const loadPayments = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError(null)

      const data = await getPayments()

      setPayments(data)
    } catch (err) {
      console.error('Failed to load payments:', err)

      setError(
        'Unable to load payments. Please check that the RetailIQ backend is running.',
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // ==========================================================
  // HELPERS
  // ==========================================================

  const formatCurrency = (value: number) => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`
  }

  const formatDate = (value: string) => {
    if (!value) {
      return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value: string) => {
    if (!value) {
      return '—'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: string) => {
    if (!status) {
      return 'Unknown'
    }

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const getStatusClasses = (status: string) => {
    const normalized = status.toLowerCase()

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

  const getPaymentMethodLabel = (method: string) => {
    if (!method) {
      return 'Unknown'
    }

    const normalized = method.toLowerCase()

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
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  const statusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(
        payments
          .map((payment) => payment.status)
          .filter(Boolean),
      ),
    )

    return ['All', ...statuses]
  }, [payments])

  const methodOptions = useMemo(() => {
    const methods = Array.from(
      new Set(
        payments
          .map((payment) => payment.payment_method)
          .filter(Boolean),
      ),
    )

    return ['All', ...methods]
  }, [payments])

  // ==========================================================
  // FILTERED PAYMENTS
  // ==========================================================

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesSearch =
        query === '' ||
        String(payment.id)
          .toLowerCase()
          .includes(query) ||
        String(payment.order_id)
          .toLowerCase()
          .includes(query) ||
        String(payment.payment_method ?? '')
          .toLowerCase()
          .includes(query) ||
        String(payment.status ?? '')
          .toLowerCase()
          .includes(query) ||
        String(payment.transaction_reference ?? '')
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        payment.status === statusFilter

      const matchesMethod =
        methodFilter === 'All' ||
        payment.payment_method === methodFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      )
    })
  }, [
    payments,
    search,
    statusFilter,
    methodFilter,
  ])

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const totalPaymentAmount = useMemo(() => {
    return payments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0,
    )
  }, [payments])

  const completedPayments = useMemo(() => {
    return payments.filter((payment) => {
      const status =
        payment.status?.toLowerCase() || ''

      return (
        status.includes('complete') ||
        status.includes('success') ||
        status.includes('paid')
      )
    })
  }, [payments])

  const completedPaymentAmount = useMemo(() => {
    return completedPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0,
    )
  }, [completedPayments])

  // ==========================================================
  // PAYMENT METHOD SUMMARY
  // ==========================================================

  const paymentMethodSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        count: number
        amount: number
      }
    > = {}

    payments.forEach((payment) => {
      const method = getPaymentMethodLabel(
        payment.payment_method,
      )

      if (!summary[method]) {
        summary[method] = {
          count: 0,
          amount: 0,
        }
      }

      summary[method].count += 1

      summary[method].amount +=
        Number(payment.amount || 0)
    })

    return Object.entries(summary)
  }, [payments])

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
              <CreditCard className="h-3.5 w-3.5" />

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
              Payments
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
              Monitor payment activity, payment
              methods, transaction status and
              payment records across RetailIQ.
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
            <ShieldCheck className="h-9 w-9 text-indigo-300" />
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

        {/* TOTAL PAYMENTS */}

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
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Transactions
            </span>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total Payments
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : payments.length.toLocaleString('en-IN')}
          </p>
        </Card>

        {/* TOTAL AMOUNT */}

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
              Amount
            </span>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Total Payment Amount
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : formatCurrency(totalPaymentAmount)}
          </p>
        </Card>

        {/* COMPLETED */}

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
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Completed
            </span>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Completed Payments
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : completedPayments.length.toLocaleString(
                  'en-IN',
                )}
          </p>
        </Card>

        {/* COMPLETED VALUE */}

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
              <IndianRupee className="h-5 w-5 text-violet-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Settled
            </span>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Completed Amount
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-950">
            {isLoading
              ? '—'
              : formatCurrency(
                  completedPaymentAmount,
                )}
          </p>
        </Card>

      </div>

      {/* ======================================================
          PAYMENT METHOD SUMMARY
      ====================================================== */}

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-900">
            Payment Methods
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Breakdown of available payment transactions.
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {paymentMethodSummary.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-slate-500">
                No payment method data available.
              </p>
            </Card>
          ) : (
            paymentMethodSummary.map(
              ([method, data]) => (
                <Card
                  key={method}
                  className="p-5 transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
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
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {data.count}{' '}
                      {data.count === 1
                        ? 'payment'
                        : 'payments'}
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-medium text-slate-500">
                    {method}
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {formatCurrency(data.amount)}
                  </p>
                </Card>
              ),
            )
          )}
        </div>
      </div>

      {/* ======================================================
          SEARCH / FILTER BAR
      ====================================================== */}

      <Card className="p-4">
        <div
          className="
            flex
            flex-col
            gap-4
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
                setSearch(event.target.value)
              }
              placeholder="Search payment, order, method or transaction..."
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
            {statusOptions.map((status) => (
              <button
                key={`status-${status}`}
                type="button"
                onClick={() =>
                  setStatusFilter(status)
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
                    statusFilter === status
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                  }
                `}
              >
                {status === 'All'
                  ? 'All Status'
                  : getStatusLabel(status)}
              </button>
            ))}

            {methodOptions.map((method) => (
              <button
                key={`method-${method}`}
                type="button"
                onClick={() =>
                  setMethodFilter(method)
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
                    methodFilter === method
                      ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                  }
                `}
              >
                {method === 'All'
                  ? 'All Methods'
                  : getPaymentMethodLabel(method)}
              </button>
            ))}

            <button
              type="button"
              onClick={() => loadPayments(true)}
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
          PAYMENTS TABLE
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
              Payment Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredPayments.length.toLocaleString(
                'en-IN',
              )}{' '}
              payments shown
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              bg-emerald-50
              px-3
              py-1.5
              text-xs
              font-medium
              text-emerald-700
            "
          >
            <ShieldCheck className="h-3.5 w-3.5" />

            Payment Records
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    h-16
                    animate-pulse
                    rounded-xl
                    bg-slate-100
                  "
                />
              ),
            )}
          </div>
        ) : filteredPayments.length === 0 ? (
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
              <CreditCard className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No payments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Order
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Method
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Paid At
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => {
                  const statusStyle =
                    getStatusClasses(
                      payment.status,
                    )

                  return (
                    <tr
                      key={payment.id}
                      className="
                        group
                        transition
                        hover:bg-slate-50
                      "
                    >
                      {/* PAYMENT */}

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
                            "
                          >
                            <CreditCard className="h-4 w-4 text-indigo-600" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              PAY-
                              {String(
                                payment.id,
                              ).padStart(5, '0')}
                            </p>

                            <p className="text-xs text-slate-400">
                              Payment #{payment.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ORDER */}

                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Order #{payment.order_id}
                        </p>
                      </td>

                      {/* METHOD */}

                      <td className="px-6 py-4">
                        <span
                          className="
                            inline-flex
                            items-center
                            rounded-full
                            bg-slate-100
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-slate-700
                          "
                        >
                          {getPaymentMethodLabel(
                            payment.payment_method,
                          )}
                        </span>
                      </td>

                      {/* AMOUNT */}

                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(
                            payment.amount,
                          )}
                        </p>
                      </td>

                      {/* STATUS */}

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
                            payment.status,
                          )}
                        </span>
                      </td>

                      {/* PAID AT */}

                     <p className="text-sm font-medium text-slate-700">
  {payment.paid_at ? formatDate(payment.paid_at) : "—"}
</p>

<p className="text-xs text-slate-400">
  {payment.paid_at ? formatTime(payment.paid_at) : "—"}
</p>

                      {/* ACTION */}

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPayment(
                              payment,
                            )
                          }
                          className="
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
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ======================================================
          PAYMENT DETAILS MODAL
      ====================================================== */}

      {selectedPayment && (
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
            {/* HEADER */}

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
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>

                <h2 className="text-xl font-bold text-slate-950">
                  Payment Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  PAY-
                  {String(
                    selectedPayment.id,
                  ).padStart(5, '0')}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
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
              {/* AMOUNT */}

              <div
                className="
                  rounded-2xl
                  bg-slate-950
                  p-5
                  text-white
                "
              >
                <p className="text-xs font-medium text-slate-400">
                  Payment Amount
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {formatCurrency(
                    selectedPayment.amount,
                  )}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>
                    Order #{selectedPayment.order_id}
                  </span>

                  <span>•</span>

                  <span>
                    {getPaymentMethodLabel(
                      selectedPayment.payment_method,
                    )}
                  </span>
                </div>
              </div>

              {/* STATUS */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  border-slate-100
                  bg-slate-50
                  p-4
                "
              >
                <div className="flex items-center gap-3">
                  {selectedPayment.status
                    .toLowerCase()
                    .includes('fail') ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}

                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Payment Status
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {getStatusLabel(
                        selectedPayment.status,
                      )}
                    </p>
                  </div>
                </div>

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
                        selectedPayment.status,
                      ).badge
                    }
                  `}
                >
                  {getStatusLabel(
                    selectedPayment.status,
                  )}
                </span>
              </div>

              {/* PAYMENT INFORMATION */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Payment ID
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    #{selectedPayment.id}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Order ID
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    #{selectedPayment.order_id}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Payment Method
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {getPaymentMethodLabel(
                      selectedPayment.payment_method,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Amount
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatCurrency(
                      selectedPayment.amount,
                    )}
                  </p>
                </div>
              </div>

              {/* TRANSACTION */}

              <div className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />

                  <p className="text-sm font-semibold text-slate-900">
                    Transaction Information
                  </p>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Transaction Reference
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                      {selectedPayment.transaction_reference ||
                        'Not provided'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Paid At
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
  {selectedPayment.paid_at
    ? formatDate(selectedPayment.paid_at)
    : "—"}
</p>

<p className="text-xs text-slate-500">
  {selectedPayment.paid_at
    ? formatTime(selectedPayment.paid_at)
    : "—"}
</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* INSIGHT */}

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
                      RetailIQ Payment Insight
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This payment record is linked
                      directly to the RetailIQ order
                      transaction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CLOSE */}

            <div className="border-t border-slate-100 p-6">
              <button
                type="button"
                onClick={() =>
                  setSelectedPayment(null)
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

export default PaymentsPage