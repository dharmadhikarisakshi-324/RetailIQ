import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  IndianRupee,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  RefreshCw,
  CalendarDays,
  Activity,
  CircleCheck,
} from 'lucide-react'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Card from '../../components/ui/Card'

import {
  getDashboardAnalytics,
  type DashboardAnalytics,
} from '../../api/dashboard'

import {
  getSalesAnalytics,
  getTopProducts,
  getLowStockProducts,
  type SalesAnalytics,
  type TopProductAnalytics,
  type LowStockProductAnalytics,
} from '../../api/analytics'

type Period = '7' | '30' | 'all'

function formatCurrency(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`
}

function formatNumber(value: number): string {
  return Number(value || 0).toLocaleString('en-IN')
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  })
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
}: {
  title: string
  value: string
  description: string
  icon: typeof IndianRupee
  iconStyle: string
}) {
  return (
    <Card className="h-full p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900"
            title={value}
          >
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className={`shrink-0 rounded-xl p-3 ${iconStyle}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="animate-pulse space-y-2">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>

      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] =
    useState<DashboardAnalytics | null>(null)

  const [sales, setSales] = useState<SalesAnalytics[]>([])
  const [products, setProducts] = useState<TopProductAnalytics[]>([])
  const [lowStock, setLowStock] =
    useState<LowStockProductAnalytics[]>([])

  const [period, setPeriod] = useState<Period>('30')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      const [
        dashboardData,
        salesData,
        productData,
        lowStockData,
      ] = await Promise.all([
        getDashboardAnalytics(),
        getSalesAnalytics(),
        getTopProducts(10),
        getLowStockProducts(),
      ])

      setDashboard(dashboardData)
      setSales(salesData)
      setProducts(productData)
      setLowStock(lowStockData)
    } catch (err) {
      console.error('Analytics loading failed:', err)

      setError(
        'Unable to load analytics data. Please check your connection and login session.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const filteredSales = useMemo(() => {
    const sortedSales = [...sales].sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    if (period === 'all' || sortedSales.length === 0) {
      return sortedSales
    }

    const validDates = sortedSales
      .map((item) => new Date(item.date))
      .filter((date) => !Number.isNaN(date.getTime()))

    if (validDates.length === 0) {
      return sortedSales.slice(-Number(period))
    }

    const latestDate = validDates[validDates.length - 1]
    const startDate = new Date(latestDate)

    startDate.setDate(
      startDate.getDate() - Number(period) + 1,
    )

    return sortedSales.filter((item) => {
      const date = new Date(item.date)

      return (
        !Number.isNaN(date.getTime()) &&
        date >= startDate &&
        date <= latestDate
      )
    })
  }, [sales, period])

  const periodSales = filteredSales.reduce(
    (total, item) => total + Number(item.sales || 0),
    0,
  )

  const periodOrders = filteredSales.reduce(
    (total, item) => total + Number(item.orders || 0),
    0,
  )

  const averageOrderValue =
    periodOrders > 0 ? periodSales / periodOrders : 0

  const chartData = filteredSales.map((item) => ({
    date: formatDate(item.date),
    fullDate: item.date,
    sales: Number(item.sales || 0),
    orders: Number(item.orders || 0),
  }))

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error && !dashboard) {
    return (
      <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-6 sm:m-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />

          <div>
            <h1 className="font-semibold text-red-800">
              Analytics unavailable
            </h1>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>

        <button
          onClick={() => void loadAnalytics()}
          disabled={refreshing}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-100 p-2">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Business Intelligence
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Retail Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor sales, customer activity, product performance, and inventory.
          </p>
        </div>

        <button
          onClick={() => void loadAnalytics(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>
      </div>

      {/* REFRESH ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{error} Previously loaded data is still displayed.</p>
        </div>
      )}

      {/* KPI CARDS */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Business Overview
          </h2>

          <span className="text-xs text-slate-500">
            Current totals
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total Sales"
            value={formatCurrency(dashboard?.total_sales ?? 0)}
            description="Revenue from paid orders"
            icon={IndianRupee}
            iconStyle="bg-indigo-50 text-indigo-600"
          />

          <MetricCard
            title="Total Orders"
            value={formatNumber(dashboard?.total_orders ?? 0)}
            description="Orders recorded in the system"
            icon={ShoppingCart}
            iconStyle="bg-blue-50 text-blue-600"
          />

          <MetricCard
            title="Active Customers"
            value={formatNumber(dashboard?.total_customers ?? 0)}
            description="Currently active customers"
            icon={Users}
            iconStyle="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            title="Active Products"
            value={formatNumber(dashboard?.total_products ?? 0)}
            description="Currently active products"
            icon={Package}
            iconStyle="bg-violet-50 text-violet-600"
          />

          <MetricCard
            title="Low Stock Items"
            value={formatNumber(dashboard?.low_stock_products ?? 0)}
            description="At or below reorder level"
            icon={AlertTriangle}
            iconStyle="bg-amber-50 text-amber-600"
          />
        </div>
      </section>

      {/* SALES PERFORMANCE */}

      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Sales Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Daily revenue from paid transactions
            </p>
          </div>

          <label className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 sm:self-auto">
            <CalendarDays className="h-4 w-4 text-slate-500" />

            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as Period)
              }
              aria-label="Sales date range"
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="all">All dates</option>
            </select>
          </label>
        </div>

        {/* SALES SUMMARY */}

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Sales in selected period
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatCurrency(periodSales)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Paid orders in selected period
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatNumber(periodOrders)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Average order value
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatCurrency(averageOrderValue)}
            </p>
          </div>
        </div>

        {/* CHART */}

        <div className="h-80 w-full px-2 pb-5 sm:h-96 sm:px-5">
          {chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <TrendingUp className="h-9 w-9 text-slate-300" />

              <p className="text-sm font-medium text-slate-600">
                No paid sales data available
              </p>

              <p className="text-xs text-slate-400">
                Try another date range or add paid orders.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 15,
                  right: 15,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />

                <YAxis
                  tickFormatter={(value: number) =>
                    value >= 100000
                      ? `₹${(value / 100000).toFixed(1)}L`
                      : value >= 1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                  }
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={75}
                />

                <Tooltip
                  labelFormatter={(_, payload) => {
                    const fullDate = payload?.[0]?.payload?.fullDate

                    return fullDate
                      ? new Date(String(fullDate)).toLocaleDateString(
                          'en-IN',
                          {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          },
                        )
                      : 'Sales'
                  }}
                  formatter={(value, name) => [
                    name === 'Orders'
                      ? formatNumber(Number(value ?? 0))
                      : formatCurrency(Number(value ?? 0)),
                    name === 'Orders' ? 'Orders' : 'Sales',
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 2,
                    fill: '#ffffff',
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* TOP PRODUCTS AND INVENTORY */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* TOP PRODUCTS */}

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Top Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ranked by quantity sold
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="p-6 text-center">
              <Package className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-2 text-sm text-slate-500">
                No product sales data available.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {products.map((product, index) => {
                const quantity = Number(product.quantity_sold || 0)
                const maxQuantity = Math.max(
                  ...products.map((item) =>
                    Number(item.quantity_sold || 0),
                  ),
                  1,
                )

                const percentage = Math.max(
                  0,
                  Math.min(100, (quantity / maxQuantity) * 100),
                )

                return (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-3 p-4 transition hover:bg-slate-50 sm:gap-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                        index < 3
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-semibold text-slate-800"
                        title={product.product_name}
                      >
                        {product.product_name}
                      </p>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="mt-1.5 text-xs text-slate-500">
                        {formatNumber(quantity)} units sold
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(Number(product.revenue || 0))}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Revenue
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* INVENTORY ALERTS */}

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Inventory Alerts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Products at or below reorder level
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CircleCheck className="h-9 w-9 text-emerald-500" />

              <p className="mt-3 text-sm font-semibold text-emerald-700">
                No low-stock products found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No products currently meet the low-stock condition.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {lowStock.map((product) => {
                const stock = Number(product.stock_quantity || 0)
                const reorderLevel = Number(product.reorder_level || 0)
                const critical = stock <= reorderLevel * 0.5

                return (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`rounded-xl p-2 ${
                          critical
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <Package className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-semibold text-slate-800"
                          title={product.product_name}
                        >
                          {product.product_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Reorder level: {formatNumber(reorderLevel)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${
                          critical ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {formatNumber(stock)} left
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${
                          critical
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {critical ? 'Critical stock' : 'Restock needed'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* FOOTER */}

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />

          <span>
            Analytics are based on data currently available through RetailIQ APIs.
          </span>
        </div>

        <span>
          {refreshing ? 'Updating data...' : 'Dashboard data loaded'}
        </span>
      </div>
    </div>
  )
}