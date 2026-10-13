import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Award,
  Brain,
  ChevronRight,
  DollarSign,
  Filter,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { getCustomerIntelligence } from '../../api/customerIntelligence'
import type { CustomerIntelligence } from '../../api/customerIntelligence'

// =========================================================
// HELPERS
// =========================================================

function formatCurrency(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }

  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }

  return value.toLocaleString('en-IN')
}

function getSegmentClass(segment: string | null): string {
  if (!segment) {
    return 'bg-slate-100 text-slate-600'
  }

  if (segment.includes('High-Value')) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (segment.includes('Recent')) {
    return 'bg-blue-50 text-blue-700'
  }

  if (segment.includes('Inactive')) {
    return 'bg-amber-50 text-amber-700'
  }

  if (segment.includes('Lost')) {
    return 'bg-red-50 text-red-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function getRfmColor(score: number | null): string {
  if (score === null) {
    return 'bg-slate-100 text-slate-500'
  }

  if (score >= 4) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (score >= 3) {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-red-50 text-red-700'
}

// =========================================================
// PAGE
// =========================================================

export default function CustomerIntelligencePage() {
  const [customers, setCustomers] = useState<CustomerIntelligence[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('All')
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerIntelligence | null>(null)

  // =======================================================
  // LOAD DATA
  // =======================================================

  async function loadCustomers(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError(null)

      const data = await getCustomerIntelligence()

      setCustomers(data)
    } catch (err) {
      console.error(err)

      setError(
        'Unable to load customer intelligence. Please check the backend API.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // =======================================================
  // SEGMENTS
  // =======================================================

  const segments = useMemo(() => {
    const uniqueSegments = customers
      .map((customer) => customer.segment_name)
      .filter((segment): segment is string => Boolean(segment))

    return ['All', ...Array.from(new Set(uniqueSegments))]
  }, [customers])

  // =======================================================
  // FILTERED CUSTOMERS
  // =======================================================

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.customer_code.toLowerCase().includes(query) ||
        String(customer.customer_id).includes(query) ||
        (customer.email ?? '').toLowerCase().includes(query)

      const matchesSegment =
        segmentFilter === 'All' ||
        customer.segment_name === segmentFilter

      return matchesSearch && matchesSegment
    })
  }, [customers, search, segmentFilter])

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary = useMemo(() => {
    const customersWithSpend = customers.filter(
      (customer) => customer.total_spending !== null,
    )

    const totalSpending = customersWithSpend.reduce(
      (sum, customer) => sum + (customer.total_spending ?? 0),
      0,
    )

    const totalTransactions = customers.reduce(
      (sum, customer) =>
        sum + (customer.number_of_transactions ?? 0),
      0,
    )

    const highValueCustomers = customers.filter((customer) =>
      customer.segment_name?.includes('High-Value'),
    ).length

    const recentCustomers = customers.filter((customer) =>
      customer.segment_name?.includes('Recent'),
    ).length

    const inactiveCustomers = customers.filter((customer) =>
      customer.segment_name?.includes('Inactive'),
    ).length

    const lostCustomers = customers.filter((customer) =>
      customer.segment_name?.includes('Lost'),
    ).length

    const avgOrderValue =
      customersWithSpend.length > 0
        ? customersWithSpend.reduce(
            (sum, customer) =>
              sum + (customer.average_order_value ?? 0),
            0,
          ) / customersWithSpend.length
        : 0

    return {
      totalCustomers: customers.length,
      totalSpending,
      totalTransactions,
      highValueCustomers,
      recentCustomers,
      inactiveCustomers,
      lostCustomers,
      avgOrderValue,
    }
  }, [customers])

  // =======================================================
  // SEGMENT CHART
  // =======================================================

  const segmentChartData = useMemo(() => {
    const counts = new Map<string, number>()

    customers.forEach((customer) => {
      const segment = customer.segment_name ?? 'Unclassified'

      counts.set(segment, (counts.get(segment) ?? 0) + 1)
    })

    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }))
  }, [customers])

  // =======================================================
  // TOP CUSTOMERS
  // =======================================================

  const topCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) => customer.total_spending !== null)
      .sort(
        (a, b) =>
          (b.total_spending ?? 0) -
          (a.total_spending ?? 0),
      )
      .slice(0, 5)
  }, [customers])

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-32 animate-pulse rounded-3xl bg-white shadow-sm" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="h-96 animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </div>
    )
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <Activity className="h-7 w-7 text-red-500" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Customer Intelligence unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => loadCustomers()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                AI-Powered Customer Intelligence
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Understand every customer.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Analyze customer value, purchase behavior, RFM
                scores, and machine-learning segments from your
                RetailIQ data.
              </p>
            </div>

            <button
              onClick={() => loadCustomers(true)}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? 'animate-spin' : ''
                }`}
              />
              Refresh intelligence
            </button>
          </div>
        </section>

        {/* KPI CARDS */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-indigo-50 p-3">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>

              <span className="text-xs font-semibold text-emerald-600">
                Active data
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Customers analyzed
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(summary.totalCustomers)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>

              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Total customer spending
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalSpending)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Transactions
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Total transactions
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(summary.totalTransactions)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-50 p-3">
                <Award className="h-5 w-5 text-amber-600" />
              </div>

              <span className="text-xs font-semibold text-amber-600">
                High value
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              High-value customers
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(summary.highValueCustomers)}
            </p>
          </div>
        </section>

        {/* SEGMENT OVERVIEW */}

        <section className="grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  ML SEGMENTATION
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Customer segment distribution
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current RFM-driven customer segments from RetailIQ.
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>
            </div>

            <div className="mt-6 h-64">
              {segmentChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {segmentChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              '#4f46e5',
                              '#10b981',
                              '#f59e0b',
                              '#ef4444',
                              '#0ea5e9',
                              '#8b5cf6',
                            ][index % 6]
                          }
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No segment data available.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-50 p-3">
                <Target className="h-5 w-5 text-cyan-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Segment signals
                </p>

                <p className="text-xs text-slate-500">
                  Customer portfolio health
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    High-value
                  </p>

                  <p className="mt-1 text-xl font-bold text-emerald-900">
                    {summary.highValueCustomers}
                  </p>
                </div>

                <Award className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-blue-50 p-4">
                <div>
                  <p className="text-xs font-medium text-blue-700">
                    Recent regular
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-900">
                    {summary.recentCustomers}
                  </p>
                </div>

                <Activity className="h-6 w-6 text-blue-600" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">
                <div>
                  <p className="text-xs font-medium text-amber-700">
                    Inactive
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-900">
                    {summary.inactiveCustomers}
                  </p>
                </div>

                <Users className="h-6 w-6 text-amber-600" />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-red-50 p-4">
                <div>
                  <p className="text-xs font-medium text-red-700">
                    Lost / very low
                  </p>

                  <p className="mt-1 text-xl font-bold text-red-900">
                    {summary.lostCustomers}
                  </p>
                </div>

                <Activity className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </section>

        {/* TOP CUSTOMERS */}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                CUSTOMER VALUE
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Top customers by spending
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Customers with the highest recorded spending.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {topCustomers.map((customer, index) => (
              <button
                key={customer.customer_id}
                onClick={() => setSelectedCustomer(customer)}
                className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    #{index + 1}
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-indigo-500" />
                </div>

                <p className="mt-4 truncate text-sm font-semibold text-slate-900">
                  {customer.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {customer.customer_code}
                </p>

                <p className="mt-4 text-lg font-bold text-emerald-600">
                  {formatCurrency(customer.total_spending)}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* CUSTOMER DIRECTORY */}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-sm font-semibold text-indigo-600">
                  CUSTOMER INTELLIGENCE
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Intelligence directory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Search and inspect customer behavior, RFM scores,
                  and ML segments.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search customer..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-64"
                  />

                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    value={segmentFilter}
                    onChange={(event) =>
                      setSegmentFilter(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-64"
                  >
                    {segments.map((segment) => (
                      <option key={segment} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {filteredCustomers.length} of{' '}
                {customers.length} customers
              </span>

              <span>
                Avg order value:{' '}
                <strong className="text-slate-700">
                  {formatCurrency(summary.avgOrderValue)}
                </strong>
              </span>
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-4 py-4">Spending</th>
                  <th className="px-4 py-4">Transactions</th>
                  <th className="px-4 py-4">Recency</th>
                  <th className="px-4 py-4">RFM</th>
                  <th className="px-4 py-4">ML Cluster</th>
                  <th className="px-4 py-4">Segment</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.customer_id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {customer.name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {customer.customer_code}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(customer.total_spending)}
                      </p>

                      <p className="text-xs text-slate-400">
                        AOV{' '}
                        {formatCurrency(
                          customer.average_order_value,
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatNumber(
                        customer.number_of_transactions,
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {customer.recency !== null
                          ? `${customer.recency} days`
                          : '—'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-bold ${getRfmColor(
                            customer.r_score,
                          )}`}
                        >
                          R{customer.r_score ?? '—'}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-xs font-bold ${getRfmColor(
                            customer.f_score,
                          )}`}
                        >
                          F{customer.f_score ?? '—'}
                        </span>

                        <span
                          className={`rounded-md px-2 py-1 text-xs font-bold ${getRfmColor(
                            customer.m_score,
                          )}`}
                        >
                          M{customer.m_score ?? '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {customer.ml_cluster !== null
                          ? `Cluster ${customer.ml_cluster}`
                          : '—'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSegmentClass(
                          customer.segment_name,
                        )}`}
                      >
                        {customer.segment_name ??
                          'Unclassified'}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          setSelectedCustomer(customer)
                        }
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}

          <div className="space-y-3 p-4 md:hidden">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.customer_id}
                onClick={() => setSelectedCustomer(customer)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {customer.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {customer.customer_code}
                    </p>
                  </div>

                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400">
                      Spending
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatCurrency(customer.total_spending)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] text-slate-400">
                      Transactions
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {formatNumber(
                        customer.number_of_transactions,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getSegmentClass(
                      customer.segment_name,
                    )}`}
                  >
                    {customer.segment_name ?? 'Unclassified'}
                  </span>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    RFM {customer.rfm_total ?? '—'}
                  </span>
                </div>
              </button>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">
                No customers match your search.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* CUSTOMER DETAIL MODAL */}

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedCustomer.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCustomer.customer_code}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">

              {/* SEGMENT */}

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ML Customer Segment
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${getSegmentClass(
                      selectedCustomer.segment_name,
                    )}`}
                  >
                    {selectedCustomer.segment_name ??
                      'Unclassified'}
                  </span>

                  <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                    Cluster {selectedCustomer.ml_cluster ?? '—'}
                  </span>
                </div>
              </div>

              {/* METRICS */}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">
                    Spending
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(
                      selectedCustomer.total_spending,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">
                    AOV
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(
                      selectedCustomer.average_order_value,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">
                    Transactions
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(
                      selectedCustomer.number_of_transactions,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">
                    Quantity
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatNumber(
                      selectedCustomer.total_quantity,
                    )}
                  </p>
                </div>
              </div>

              {/* RFM */}

              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />

                  <h3 className="font-bold text-slate-900">
                    RFM Intelligence
                  </h3>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      Recency
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {selectedCustomer.r_score ?? '—'}
                    </p>

                    <p className="text-xs text-slate-400">
                      R score
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      Frequency
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {selectedCustomer.f_score ?? '—'}
                    </p>

                    <p className="text-xs text-slate-400">
                      F score
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-xs text-slate-400">
                      Monetary
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {selectedCustomer.m_score ?? '—'}
                    </p>

                    <p className="text-xs text-slate-400">
                      M score
                    </p>
                  </div>

                  <div className="rounded-2xl bg-indigo-50 p-4 text-center">
                    <p className="text-xs text-indigo-500">
                      RFM total
                    </p>

                    <p className="mt-1 text-xl font-bold text-indigo-700">
                      {selectedCustomer.rfm_total ?? '—'}
                    </p>

                    <p className="text-xs text-indigo-400">
                      Overall
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">
                    RFM score
                  </p>

                  <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                    {selectedCustomer.rfm_score ?? '—'}
                  </p>
                </div>
              </div>

              {/* CUSTOMER DETAILS */}

              <div>
                <h3 className="font-bold text-slate-900">
                  Customer details
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Customer ID
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedCustomer.customer_id}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-slate-900">
                      {selectedCustomer.email ?? 'Not available'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedCustomer.phone ?? 'Not available'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Loyalty member
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedCustomer.loyalty_member
                        ? 'Yes'
                        : 'No'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Recency
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedCustomer.recency !== null
                        ? `${selectedCustomer.recency} days`
                        : 'Not available'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">
                      Total quantity
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatNumber(
                        selectedCustomer.total_quantity,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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