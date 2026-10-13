import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Lightbulb,
  Moon,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Link } from 'react-router-dom'

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

// ======================================================
// TYPES
// ======================================================

interface DashboardState {
  analytics: DashboardAnalytics | null
  sales: SalesAnalytics[]
  products: TopProductAnalytics[]
  lowStock: LowStockProductAnalytics[]
}

interface SalesPoint {
  ts: number
  sales: number
  orders: number
}

type PeriodFilter = 'all' | '7' | '30' | '90' | 'custom'
type TrendChartType = 'area' | 'line' | 'bar'
type SalesMetric = 'sales' | 'orders'
type ProductMetric = 'revenue' | 'quantity'
type ProductLayout = 'vertical' | 'horizontal'
type PieStyle = 'donut' | 'pie'
type SortDirection = 'asc' | 'desc'
type ProductSortKey = 'name' | 'quantity' | 'revenue'
type InventorySortKey = 'name' | 'stock' | 'reorder' | 'gap'

const INITIAL_DATA: DashboardState = {
  analytics: null,
  sales: [],
  products: [],
  lowStock: [],
}

const CHART_COLORS = [
  '#818cf8',
  '#22d3ee',
  '#c084fc',
  '#fbbf24',
  '#34d399',
  '#f472b6',
  '#fb923c',
  '#60a5fa',
]

const DAY_MS = 86_400_000

const PERIOD_OPTIONS: { label: string; value: PeriodFilter }[] = [
  { label: 'All', value: 'all' },
  { label: '7D', value: '7' },
  { label: '30D', value: '30' },
  { label: '90D', value: '90' },
  { label: 'Custom', value: 'custom' },
]

// ======================================================
// HELPERS
// ======================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

function formatCompactCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0

  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }

  // Small amounts keep their decimals (so ₹10.66 is not shown as ₹11)
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatNumber(value: number): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString('en-IN')
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatDate(ts: number, showYear: boolean): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    ...(showYear ? { year: '2-digit' } : {}),
    timeZone: 'UTC',
  })
}

function formatMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

function toInputDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(previous) || previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function truncateText(value: string, length = 20): string {
  return value.length > length ? `${value.slice(0, length)}…` : value
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as {
      response?: { data?: { detail?: string } }
    }
    const detail = apiError.response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  return 'Unable to load dashboard data. Check your backend connection and try again.'
}

// ======================================================
// THEME (works with Tailwind darkMode: 'class')
// ======================================================

function useTheme() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  // Stay in sync if another part of the app changes the theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage can be unavailable; the toggle still works for this session
    }
    setIsDark(next)
  }, [])

  return { isDark, toggle }
}

// ======================================================
// REUSABLE COMPONENTS
// ======================================================

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div
      className={`riq-reveal ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div>
      {eyebrow && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { label: string; value: T }[]
  label: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function TrendBadge({
  value,
  label = 'vs previous period',
}: {
  value: number | null
  label?: string
}) {
  if (value === null) {
    return (
      <span className="text-[11px] text-slate-400 dark:text-slate-500">
        No prior-period data
      </span>
    )
  }

  const positive = value >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
          positive
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
        }`}
      >
        <Icon size={12} />
        {formatPercent(value)}
      </span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </span>
  )
}

function MetricCard({
  id,
  title,
  value,
  description,
  icon: Icon,
  accent,
  iconBackground,
  iconColor,
  sparkColor,
  spark,
  trend,
}: {
  id: string
  title: string
  value: string
  description: string
  icon: typeof IndianRupee
  accent: string
  iconBackground: string
  iconColor: string
  sparkColor: string
  spark?: { value: number }[]
  trend?: number | null
}) {
  return (
    <Card className="group relative overflow-hidden border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute left-0 top-0 h-1 w-full ${accent}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBackground} ${iconColor} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={23} />
        </div>
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-3 h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <defs>
                <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={sparkColor}
                strokeWidth={2}
                fill={`url(#spark-${id})`}
                isAnimationActive
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <span className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
    </Card>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
    color?: string
    dataKey?: string
    payload?: { fullName?: string }
  }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null

  const title = payload[0]?.payload?.fullName ?? label

  return (
    <div className="min-w-[170px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {title !== undefined && title !== '' && (
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </p>
      )}

      {payload.map((item, index) => {
        const isCurrency =
          item.dataKey === 'sales' || item.dataKey === 'revenue'

        return (
          <div
            key={`${item.dataKey ?? item.name}-${index}`}
            className="flex items-center justify-between gap-4 py-1"
          >
            <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? '#6366f1' }}
              />
              {item.name ?? item.dataKey}
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {isCurrency
                ? formatCurrency(Number(item.value ?? 0))
                : formatNumber(Number(item.value ?? 0))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function EmptyChart({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <TrendingUp size={28} />
      </div>
      <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
  align = 'left',
}: {
  label: string
  active: boolean
  direction: SortDirection
  onClick: () => void
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      aria-sort={
        active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      className={`px-6 py-4 ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition ${
          active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        {label}
        <ArrowUpDown size={12} />
      </button>
    </th>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-56"
      />
    </label>
  )
}

// ======================================================
// MAIN DASHBOARD
// ======================================================

export default function DashboardPage() {
  const { isDark, toggle: toggleTheme } = useTheme()

  const [data, setData] = useState<DashboardState>(INITIAL_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Filters and chart-type switches
  const [period, setPeriod] = useState<PeriodFilter>('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [trendType, setTrendType] = useState<TrendChartType>('area')
  const [trendMetric, setTrendMetric] = useState<SalesMetric>('sales')
  const [monthlyMetric, setMonthlyMetric] = useState<SalesMetric>('sales')
  const [productMetric, setProductMetric] = useState<ProductMetric>('revenue')
  const [productLayout, setProductLayout] = useState<ProductLayout>('vertical')
  const [pieStyle, setPieStyle] = useState<PieStyle>('donut')

  // Table state
  const [productSearch, setProductSearch] = useState('')
  const [productSort, setProductSort] = useState<{
    key: ProductSortKey
    dir: SortDirection
  }>({ key: 'revenue', dir: 'desc' })
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventorySort, setInventorySort] = useState<{
    key: InventorySortKey
    dir: SortDirection
  }>({ key: 'gap', dir: 'asc' })

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError('')

      const [dashboardAnalytics, salesAnalytics, topProductsData, lowStockData] =
        await Promise.all([
          getDashboardAnalytics(),
          getSalesAnalytics(),
          getTopProducts(10),
          getLowStockProducts(),
        ])

      setData({
        analytics: dashboardAnalytics,
        sales: salesAnalytics,
        products: topProductsData,
        lowStock: lowStockData,
      })
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard loading error:', err)
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  // ====================================================
  // SALES DATA (real API data, filtered client-side)
  // ====================================================

  const salesPoints = useMemo<SalesPoint[]>(
    () =>
      data.sales
        .map((item) => ({
          ts: new Date(item.date).getTime(),
          sales: Number(item.sales) || 0,
          orders: Number(item.orders) || 0,
        }))
        .filter((point) => Number.isFinite(point.ts))
        .sort((a, b) => a.ts - b.ts),
    [data.sales],
  )

  const dataBounds = useMemo(
    () =>
      salesPoints.length > 0
        ? {
            earliest: salesPoints[0].ts,
            latest: salesPoints[salesPoints.length - 1].ts,
          }
        : null,
    [salesPoints],
  )

  const range = useMemo(() => {
    if (!dataBounds) return null
    const { earliest, latest } = dataBounds

    if (period === 'all') return { start: earliest, end: latest }

    if (period === 'custom') {
      const parsedStart = customStart ? Date.parse(customStart) : NaN
      const parsedEnd = customEnd ? Date.parse(customEnd) : NaN
      return {
        start: Number.isFinite(parsedStart) ? parsedStart : earliest,
        end: Number.isFinite(parsedEnd) ? parsedEnd + DAY_MS - 1 : latest,
      }
    }

    const days = Number(period)
    return { start: latest - (days - 1) * DAY_MS, end: latest }
  }, [dataBounds, period, customStart, customEnd])

  const filteredSales = useMemo(
    () =>
      range
        ? salesPoints.filter((p) => p.ts >= range.start && p.ts <= range.end)
        : [],
    [salesPoints, range],
  )

  // The equally long window right before the selected one (for trends)
  const previousSales = useMemo(() => {
    if (!range || period === 'all') return []
    const length = range.end - range.start + 1
    const prevEnd = range.start - 1
    const prevStart = range.start - length
    return salesPoints.filter((p) => p.ts >= prevStart && p.ts <= prevEnd)
  }, [salesPoints, range, period])

  const showYear = range ? range.end - range.start > 330 * DAY_MS : false

  const salesChartData = useMemo(
    () =>
      filteredSales.map((p) => ({
        date: formatDate(p.ts, showYear),
        sales: p.sales,
        orders: p.orders,
      })),
    [filteredSales, showYear],
  )

  const periodRevenue = useMemo(
    () => filteredSales.reduce((t, p) => t + p.sales, 0),
    [filteredSales],
  )
  const periodOrders = useMemo(
    () => filteredSales.reduce((t, p) => t + p.orders, 0),
    [filteredSales],
  )
  const previousRevenue = useMemo(
    () => previousSales.reduce((t, p) => t + p.sales, 0),
    [previousSales],
  )
  const previousOrders = useMemo(
    () => previousSales.reduce((t, p) => t + p.orders, 0),
    [previousSales],
  )

  const hasPrevious = previousSales.length > 0
  const revenueTrend = hasPrevious
    ? percentChange(periodRevenue, previousRevenue)
    : null
  const ordersTrend = hasPrevious
    ? percentChange(periodOrders, previousOrders)
    : null

  const averageOrderValue = periodOrders > 0 ? periodRevenue / periodOrders : 0

  // ====================================================
  // MONTHLY PERFORMANCE (aggregated from the daily data)
  // ====================================================

  const monthlyData = useMemo(() => {
    const buckets = new Map<string, { sales: number; orders: number }>()

    salesPoints.forEach((p) => {
      const d = new Date(p.ts)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
      const entry = buckets.get(key) ?? { sales: 0, orders: 0 }
      entry.sales += p.sales
      entry.orders += p.orders
      buckets.set(key, entry)
    })

    const keys = Array.from(buckets.keys()).sort()

    return keys.map((key, index) => {
      const current = buckets.get(key)!
      const previous = index > 0 ? buckets.get(keys[index - 1])! : null
      return {
        key,
        month: formatMonth(key),
        sales: current.sales,
        orders: current.orders,
        change: previous ? percentChange(current.sales, previous.sales) : null,
      }
    })
  }, [salesPoints])

  const monthlyChartData = useMemo(() => monthlyData.slice(-12), [monthlyData])

  const bestMonth = useMemo(
    () =>
      monthlyData.reduce<(typeof monthlyData)[number] | null>(
        (best, month) => (!best || month.sales > best.sales ? month : best),
        null,
      ),
    [monthlyData],
  )

  const latestMonth =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null

  const averageMonthlyRevenue =
    monthlyData.length > 0
      ? monthlyData.reduce((t, m) => t + m.sales, 0) / monthlyData.length
      : 0

  // ====================================================
  // PRODUCT DATA
  // ====================================================

  const totalProductRevenue = useMemo(
    () => data.products.reduce((t, p) => t + (Number(p.revenue) || 0), 0),
    [data.products],
  )

  const productChartData = useMemo(
    () =>
      [...data.products]
        .sort((a, b) =>
          productMetric === 'revenue'
            ? Number(b.revenue) - Number(a.revenue)
            : Number(b.quantity_sold) - Number(a.quantity_sold),
        )
        .slice(0, 8)
        .map((p) => ({
          name: truncateText(p.product_name, 18),
          fullName: p.product_name,
          quantity: Number(p.quantity_sold) || 0,
          revenue: Number(p.revenue) || 0,
        })),
    [data.products, productMetric],
  )

  const productRevenueDistribution = useMemo(
    () =>
      data.products
        .map((p) => ({
          name: truncateText(p.product_name, 18),
          fullName: p.product_name,
          revenue: Number(p.revenue) || 0,
        }))
        .filter((p) => p.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6),
    [data.products],
  )

  const distributionTotal = productRevenueDistribution.reduce(
    (t, p) => t + p.revenue,
    0,
  )

  const productRows = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    const direction = productSort.dir === 'asc' ? 1 : -1

    return data.products
      .filter((p) => p.product_name.toLowerCase().includes(query))
      .sort((a, b) => {
        if (productSort.key === 'name') {
          return direction * a.product_name.localeCompare(b.product_name)
        }
        if (productSort.key === 'quantity') {
          return direction * (Number(a.quantity_sold) - Number(b.quantity_sold))
        }
        return direction * (Number(a.revenue) - Number(b.revenue))
      })
  }, [data.products, productSearch, productSort])

  const maxProductRevenue = Math.max(
    ...data.products.map((p) => Number(p.revenue) || 0),
    1,
  )

  const toggleProductSort = (key: ProductSortKey) =>
    setProductSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    )

  // ====================================================
  // INVENTORY DATA
  // ====================================================

  const inventoryRows = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase()
    const direction = inventorySort.dir === 'asc' ? 1 : -1

    return data.lowStock
      .map((item) => {
        const stock = Number(item.stock_quantity) || 0
        const reorder = Number(item.reorder_level) || 0
        const status: 'out' | 'critical' | 'low' =
          stock <= 0 ? 'out' : stock <= reorder / 2 ? 'critical' : 'low'
        return {
          name: item.product_name,
          stock,
          reorder,
          gap: stock - reorder,
          status,
        }
      })
      .filter((row) => row.name.toLowerCase().includes(query))
      .sort((a, b) => {
        if (inventorySort.key === 'name') {
          return direction * a.name.localeCompare(b.name)
        }
        return direction * (a[inventorySort.key] - b[inventorySort.key])
      })
  }, [data.lowStock, inventorySearch, inventorySort])

  const inventoryChartData = useMemo(
    () =>
      data.lowStock.slice(0, 8).map((p) => ({
        name: truncateText(p.product_name, 17),
        fullName: p.product_name,
        stock: Number(p.stock_quantity) || 0,
        reorder: Number(p.reorder_level) || 0,
      })),
    [data.lowStock],
  )

  const outOfStockCount = inventoryRows.filter((r) => r.status === 'out').length
  const inventoryAttentionCount = data.lowStock.length

  const toggleInventorySort = (key: InventorySortKey) =>
    setInventorySort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )

  // ====================================================
  // RULE-BASED INSIGHTS (computed from the real data above)
  // ====================================================

  const insights = useMemo(() => {
    const list: string[] = []

    if (revenueTrend !== null) {
      list.push(
        `Revenue is ${revenueTrend >= 0 ? 'up' : 'down'} ${Math.abs(revenueTrend).toFixed(1)}% compared with the previous period.`,
      )
    }

    if (data.products.length > 0 && totalProductRevenue > 0) {
      const top = [...data.products].sort(
        (a, b) => Number(b.revenue) - Number(a.revenue),
      )[0]
      const share = ((Number(top.revenue) || 0) / totalProductRevenue) * 100
      list.push(
        `${truncateText(top.product_name, 28)} drives ${share.toFixed(0)}% of top-product revenue.`,
      )
    }

    if (inventoryAttentionCount > 0) {
      list.push(
        `${inventoryAttentionCount} product${inventoryAttentionCount === 1 ? '' : 's'} need restocking attention.`,
      )
    }

    if (bestMonth) {
      list.push(
        `${bestMonth.month} is your strongest month at ${formatCompactCurrency(bestMonth.sales)}.`,
      )
    }

    return list
  }, [
    revenueTrend,
    data.products,
    totalProductRevenue,
    inventoryAttentionCount,
    bestMonth,
  ])

  const axisTick = { fontSize: 11, fill: '#94a3b8' }

  // ====================================================
  // LOADING
  // ====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-6 bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
        <div className="h-64 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      </div>
    )
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error && !data.analytics) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-6">
        <Card className="w-full max-w-lg p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
            Dashboard unavailable
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={16} />
            Retry connection
          </button>
        </Card>
      </div>
    )
  }

  const analytics = data.analytics
  const trendLabel = trendMetric === 'sales' ? 'Revenue' : 'Orders'
  const sparkRevenue = salesChartData.map((p) => ({ value: p.sales }))
  const sparkOrders = salesChartData.map((p) => ({ value: p.orders }))

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="min-h-screen space-y-7 bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <style>{`
        @keyframes riq-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }
        .riq-reveal { opacity: 0; animation: riq-fade-up 0.55s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .riq-reveal { animation: none; opacity: 1; }
        }
      `}</style>

      {/* HERO */}

      <Reveal>
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-2xl sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-indigo-100 backdrop-blur">
                <Sparkles size={14} />
                RETAIL INTELLIGENCE PLATFORM
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={
                    isDark ? 'Switch to light mode' : 'Switch to dark mode'
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  {isDark ? 'Light' : 'Dark'}
                </button>

                <button
                  type="button"
                  onClick={() => void loadDashboard(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                >
                  <RefreshCw
                    size={15}
                    className={isRefreshing ? 'animate-spin' : ''}
                  />
                  {isRefreshing ? 'Refreshing…' : 'Refresh analytics'}
                </button>
              </div>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <p className="text-sm font-medium text-indigo-300">
                  Welcome to your command center
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  Turn retail data into
                  <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                    intelligent decisions.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Explore business performance, compare sales trends,
                  investigate product revenue and monitor stock risks with
                  interactive analytics.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 ring-1 ring-emerald-300/20">
                    <CheckCircle2 size={15} />
                    Analytics connected
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-indigo-100 ring-1 ring-white/10">
                    <BrainCircuit size={15} />
                    AI-powered insights
                  </span>
                  {lastUpdated && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-indigo-100 ring-1 ring-white/10">
                      <Clock3 size={15} />
                      Updated{' '}
                      {lastUpdated.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Inventory attention
                  </span>
                  <span className="rounded-lg bg-amber-400/15 p-2 text-amber-300">
                    <AlertTriangle size={18} />
                  </span>
                </div>
                <p className="mt-5 text-4xl font-black">
                  {formatNumber(inventoryAttentionCount)}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Products returned by the low-stock analytics endpoint.
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                    style={{
                      width: inventoryAttentionCount > 0 ? '100%' : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* REFRESH ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <span>{error} Showing the last successfully loaded data.</span>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* DATE RANGE FILTER */}

      <Reveal delay={60}>
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <CalendarDays size={19} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Date range
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {range && filteredSales.length > 0
                  ? `${formatDate(range.start, true)} – ${formatDate(range.end, true)} · ${filteredSales.length} data points`
                  : 'Applies to the sales and orders charts'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Date range"
              value={period}
              onChange={setPeriod}
              options={PERIOD_OPTIONS}
            />

            {period === 'custom' && dataBounds && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  aria-label="Start date"
                  value={customStart}
                  min={toInputDate(dataBounds.earliest)}
                  max={toInputDate(dataBounds.latest)}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  aria-label="End date"
                  value={customEnd}
                  min={toInputDate(dataBounds.earliest)}
                  max={toInputDate(dataBounds.latest)}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            )}
          </div>
        </section>
      </Reveal>

      {/* KPI CARDS */}

      <Reveal delay={100}>
        <section>
          <div className="mb-4">
            <SectionHeading
              eyebrow="Business overview"
              title="Performance at a glance"
              description="Lifetime totals from your backend. Trend badges compare the selected date range with the previous one."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              id="sales"
              title="Total Sales"
              value={formatCompactCurrency(Number(analytics?.total_sales ?? 0))}
              description="Sales value reported by the API"
              icon={IndianRupee}
              accent="bg-gradient-to-r from-emerald-400 to-teal-500"
              iconBackground="bg-emerald-50 dark:bg-emerald-500/10"
              iconColor="text-emerald-600 dark:text-emerald-400"
              sparkColor="#34d399"
              spark={sparkRevenue}
              trend={revenueTrend}
            />
            <MetricCard
              id="orders"
              title="Total Orders"
              value={formatNumber(Number(analytics?.total_orders ?? 0))}
              description="Orders tracked by the system"
              icon={ShoppingCart}
              accent="bg-gradient-to-r from-blue-400 to-cyan-500"
              iconBackground="bg-blue-50 dark:bg-blue-500/10"
              iconColor="text-blue-600 dark:text-blue-400"
              sparkColor="#22d3ee"
              spark={sparkOrders}
              trend={ordersTrend}
            />
            <MetricCard
              id="customers"
              title="Customers"
              value={formatNumber(Number(analytics?.total_customers ?? 0))}
              description="Customers reported by the API"
              icon={Users}
              accent="bg-gradient-to-r from-violet-400 to-purple-500"
              iconBackground="bg-violet-50 dark:bg-violet-500/10"
              iconColor="text-violet-600 dark:text-violet-400"
              sparkColor="#c084fc"
            />
            <MetricCard
              id="products"
              title="Products"
              value={formatNumber(Number(analytics?.total_products ?? 0))}
              description="Products reported by the API"
              icon={Package}
              accent="bg-gradient-to-r from-amber-400 to-orange-500"
              iconBackground="bg-amber-50 dark:bg-amber-500/10"
              iconColor="text-amber-600 dark:text-amber-400"
              sparkColor="#fbbf24"
            />
          </div>
        </section>
      </Reveal>

      {/* REVENUE TREND + AI PANEL */}

      <Reveal delay={140}>
        <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.7fr_1fr]">
          <Card className="min-w-0 overflow-hidden border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading
                eyebrow="Sales analytics"
                title={`${trendLabel} trend`}
                description="Switch the metric and chart style. Hover for exact values."
              />

              <div className="flex flex-wrap gap-2">
                <Segmented
                  label="Trend metric"
                  value={trendMetric}
                  onChange={setTrendMetric}
                  options={[
                    { label: 'Revenue', value: 'sales' },
                    { label: 'Orders', value: 'orders' },
                  ]}
                />
                <Segmented
                  label="Trend chart type"
                  value={trendType}
                  onChange={setTrendType}
                  options={[
                    { label: 'Area', value: 'area' },
                    { label: 'Line', value: 'line' },
                    { label: 'Bar', value: 'bar' },
                  ]}
                />
              </div>
            </div>

            {salesChartData.length > 0 ? (
              <>
                <div className="mt-7 h-[310px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={salesChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="retailTrendGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#94a3b8"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tick={axisTick}
                        minTickGap={20}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        tick={axisTick}
                        tickFormatter={
                          trendMetric === 'sales'
                            ? formatCompactCurrency
                            : (value) => formatNumber(Number(value))
                        }
                      />
                      <Tooltip content={<ChartTooltip />} />

                      {trendType === 'area' && (
                        <Area
                          type="monotone"
                          dataKey={trendMetric}
                          name={trendLabel}
                          stroke="#818cf8"
                          strokeWidth={3}
                          fill="url(#retailTrendGradient)"
                          animationDuration={700}
                          activeDot={{
                            r: 6,
                            fill: '#818cf8',
                            stroke: '#ffffff',
                            strokeWidth: 2,
                          }}
                        />
                      )}
                      {trendType === 'line' && (
                        <Line
                          type="monotone"
                          dataKey={trendMetric}
                          name={trendLabel}
                          stroke="#818cf8"
                          strokeWidth={3}
                          dot={{ r: 3, fill: '#818cf8' }}
                          animationDuration={700}
                          activeDot={{
                            r: 6,
                            fill: '#818cf8',
                            stroke: '#ffffff',
                            strokeWidth: 2,
                          }}
                        />
                      )}
                      {trendType === 'bar' && (
                        <Bar
                          dataKey={trendMetric}
                          name={trendLabel}
                          fill="#818cf8"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                          animationDuration={700}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
                  <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-500/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Revenue in range
                    </p>
                    <p className="mt-2 text-lg font-bold text-indigo-700 dark:text-indigo-300">
                      {formatCompactCurrency(periodRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cyan-50 p-4 dark:bg-cyan-500/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Orders in range
                    </p>
                    <p className="mt-2 text-lg font-bold text-cyan-700 dark:text-cyan-300">
                      {formatNumber(periodOrders)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Avg. order value
                    </p>
                    <p className="mt-2 text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCompactCurrency(averageOrderValue)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Data points
                    </p>
                    <p className="mt-2 text-lg font-bold text-violet-700 dark:text-violet-300">
                      {salesChartData.length}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <EmptyChart
                title="No sales data in this range"
                description="The sales analytics API returned no data for the selected dates. Try a wider range."
              />
            )}
          </Card>

          {/* AI PANEL */}

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-800 p-6 text-white shadow-xl">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/15">
                  <BrainCircuit size={25} />
                </div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                  AI intelligence
                </span>
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
                RetailIQ insights
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight">
                Make every retail decision count.
              </h2>

              {insights.length > 0 && (
                <ul className="mt-5 space-y-2.5">
                  {insights.map((insight) => (
                    <li
                      key={insight}
                      className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.08] p-3 text-xs leading-5 text-indigo-50"
                    >
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-300" />
                      {insight}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-3">
                {[
                  {
                    icon: Users,
                    title: 'Customer intelligence',
                    text: 'Explore customer segments and value.',
                    to: '/customers',
                  },
                  {
                    icon: Sparkles,
                    title: 'Product recommendations',
                    text: 'Discover products suggested by your ML system.',
                    to: '/recommendations',
                  },
                  {
                    icon: Package,
                    title: 'Inventory intelligence',
                    text: 'Investigate products needing stock attention.',
                    to: '/inventory',
                  },
                  {
                    icon: Zap,
                    title: 'Promotion intelligence',
                    text: 'Explore promotion opportunities.',
                    to: '/promotions',
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.title}
                      to={item.to}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.08] p-3 transition hover:bg-white/[0.16]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-indigo-200">{item.text}</p>
                      </div>
                      <ArrowUpRight size={16} />
                    </Link>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-indigo-200">
                <Zap size={15} />
                Insights are calculated from your live analytics data
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* SALES VS ORDERS + MONTHLY PERFORMANCE */}

      <Reveal delay={180}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="min-w-0 border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <SectionHeading
              eyebrow="Sales vs orders"
              title="Revenue against order volume"
              description="Bars show revenue (left axis); the line shows orders (right axis)."
            />

            {salesChartData.length > 0 ? (
              <div className="mt-6 h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={salesChartData}
                    margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#94a3b8"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={axisTick}
                      minTickGap={20}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tick={axisTick}
                      tickFormatter={formatCompactCurrency}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      width={45}
                      tick={axisTick}
                      tickFormatter={(value) => formatNumber(Number(value))}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="sales"
                      name="Revenue"
                      fill="#818cf8"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                      animationDuration={700}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#22d3ee' }}
                      animationDuration={700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart
                title="No data for this range"
                description="Select a wider date range to compare revenue and orders."
              />
            )}
          </Card>

          <Card className="min-w-0 border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading
                eyebrow="Monthly performance"
                title="Month-by-month results"
                description="Daily sales aggregated by month (last 12 months of data)."
              />
              <Segmented
                label="Monthly metric"
                value={monthlyMetric}
                onChange={setMonthlyMetric}
                options={[
                  { label: 'Revenue', value: 'sales' },
                  { label: 'Orders', value: 'orders' },
                ]}
              />
            </div>

            {monthlyChartData.length > 0 ? (
              <>
                <div className="mt-6 h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyChartData}
                      margin={{ top: 10, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#94a3b8"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={axisTick}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={70}
                        tick={axisTick}
                        tickFormatter={
                          monthlyMetric === 'sales'
                            ? formatCompactCurrency
                            : (value) => formatNumber(Number(value))
                        }
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey={monthlyMetric}
                        name={monthlyMetric === 'sales' ? 'Revenue' : 'Orders'}
                        radius={[7, 7, 0, 0]}
                        maxBarSize={44}
                        animationDuration={700}
                      >
                        {monthlyChartData.map((item, index) => (
                          <Cell
                            key={item.key}
                            fill={
                              index === monthlyChartData.length - 1
                                ? '#c084fc'
                                : '#818cf8'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Best month
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {bestMonth
                        ? `${bestMonth.month} · ${formatCompactCurrency(bestMonth.sales)}`
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Avg. monthly revenue
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {formatCompactCurrency(averageMonthlyRevenue)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {latestMonth ? `${latestMonth.month} vs prior month` : 'Latest month'}
                    </p>
                    <div className="mt-1">
                      <TrendBadge
                        value={latestMonth ? latestMonth.change : null}
                        label=""
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyChart
                title="No monthly data yet"
                description="Monthly results appear once the sales analytics API returns data."
              />
            )}
          </Card>
        </section>
      </Reveal>

      {/* TOP PRODUCTS + REVENUE DISTRIBUTION */}

      <Reveal delay={220}>
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="min-w-0 border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionHeading
                eyebrow="Product analytics"
                title="Top-performing products"
                description="Switch metric and orientation."
              />
              <div className="flex flex-wrap gap-2">
                <Segmented
                  label="Product metric"
                  value={productMetric}
                  onChange={setProductMetric}
                  options={[
                    { label: 'Revenue', value: 'revenue' },
                    { label: 'Units', value: 'quantity' },
                  ]}
                />
                <Segmented
                  label="Product chart layout"
                  value={productLayout}
                  onChange={setProductLayout}
                  options={[
                    { label: 'Columns', value: 'vertical' },
                    { label: 'Rows', value: 'horizontal' },
                  ]}
                />
              </div>
            </div>

            {productChartData.length > 0 ? (
              <>
                <div className="mt-6 h-[330px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productChartData}
                      layout={productLayout === 'horizontal' ? 'vertical' : 'horizontal'}
                      margin={{
                        top: 10,
                        right: 15,
                        left: 0,
                        bottom: productLayout === 'horizontal' ? 0 : 40,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        horizontal={productLayout === 'vertical'}
                        vertical={productLayout === 'horizontal'}
                        stroke="#94a3b8"
                        opacity={0.2}
                      />

                      {productLayout === 'horizontal' ? (
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tick={axisTick}
                          tickFormatter={
                            productMetric === 'revenue'
                              ? formatCompactCurrency
                              : (value) => formatNumber(Number(value))
                          }
                        />
                      ) : (
                        <XAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                          height={75}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                      )}

                      {productLayout === 'horizontal' ? (
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={120}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                      ) : (
                        <YAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          width={70}
                          tick={axisTick}
                          tickFormatter={
                            productMetric === 'revenue'
                              ? formatCompactCurrency
                              : (value) => formatNumber(Number(value))
                          }
                        />
                      )}

                      <Tooltip content={<ChartTooltip />} />

                      <Bar
                        dataKey={productMetric}
                        name={productMetric === 'revenue' ? 'Revenue' : 'Units sold'}
                        radius={productLayout === 'horizontal' ? [0, 7, 7, 0] : [7, 7, 0, 0]}
                        maxBarSize={36}
                        animationDuration={700}
                      >
                        {productChartData.map((item, index) => (
                          <Cell
                            key={`${item.fullName}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Combined revenue of the returned top products
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(totalProductRevenue)}
                  </p>
                </div>
              </>
            ) : (
              <EmptyChart
                title="No product analytics available"
                description="The product analytics endpoint has not returned any products."
              />
            )}
          </Card>

          <Card className="min-w-0 border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <SectionHeading
      eyebrow="Revenue distribution"
      title="Top product revenue share"
      description="Hover over a slice to inspect its revenue."
    />

    <Segmented
      label="Distribution chart style"
      value={pieStyle}
      onChange={setPieStyle}
      options={[
        { label: 'Donut', value: 'donut' },
        { label: 'Pie', value: 'pie' },
      ]}
    />
  </div>

  {productRevenueDistribution.length > 0 ? (
    <>
      <div className="mt-5 flex h-[310px] w-full min-w-0 justify-center">
        <PieChart width={320} height={310}>
          <Pie
            data={productRevenueDistribution}
            dataKey="revenue"
            nameKey="name"
            cx={160}
            cy={125}
            outerRadius={90}
            innerRadius={pieStyle === 'donut' ? 50 : 0}
            paddingAngle={
              pieStyle === 'donut' &&
              productRevenueDistribution.length > 1
                ? 3
                : 0
            }
            cornerRadius={4}
            isAnimationActive={false}
          >
            {productRevenueDistribution.map((item, index) => (
              <Cell
                key={`${item.fullName}-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>

          <Tooltip content={<ChartTooltip />} />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{
              fontSize: '11px',
              paddingTop: '10px',
              color: '#94a3b8',
            }}
          />
        </PieChart>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Revenue from displayed top products
        </p>

        <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
          {formatCurrency(distributionTotal)}
        </p>
      </div>
    </>
  ) : (
    <EmptyChart
      title="No revenue distribution available"
      description="The chart appears when product revenue data is returned."
    />
  )}
</Card>
        </section>
      </Reveal>

      {/* INVENTORY HEALTH */}

      <Reveal delay={260}>
        <section>
          <Card className="min-w-0 overflow-hidden border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
              <SectionHeading
                eyebrow="Inventory monitoring"
                title="Inventory health"
                description="Current stock against the reorder level for products returned by the low-stock endpoint."
              />

              <div className="flex items-center gap-3">
                {outOfStockCount > 0 && (
                  <span className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    {outOfStockCount} out of stock
                  </span>
                )}
                <div
                  className={`rounded-xl p-3 ${
                    data.lowStock.length > 0
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  }`}
                >
                  {data.lowStock.length > 0 ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <CheckCircle2 size={20} />
                  )}
                </div>
              </div>
            </div>

            {inventoryChartData.length > 0 ? (
              <>
                <div className="h-[320px] w-full px-5 sm:px-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryChartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                        stroke="#94a3b8"
                        opacity={0.2}
                      />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <YAxis tickLine={false} axisLine={false} tick={axisTick} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                      />
                      <Bar
                        dataKey="stock"
                        name="Current stock"
                        fill="#f59e0b"
                        radius={[5, 5, 0, 0]}
                        animationDuration={700}
                      />
                      <Bar
                        dataKey="reorder"
                        name="Reorder level"
                        fill="#818cf8"
                        radius={[5, 5, 0, 0]}
                        animationDuration={700}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Restock list
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <SearchBox
                      value={inventorySearch}
                      onChange={setInventorySearch}
                      placeholder="Search inventory..."
                    />
                    <Link
                      to="/inventory"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300"
                    >
                      View inventory
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>

                {inventoryRows.length > 0 ? (
                  <div className="max-h-[360px] overflow-auto">
                    <table className="w-full min-w-[620px] text-left">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <SortHeader
                            label="Product"
                            active={inventorySort.key === 'name'}
                            direction={inventorySort.dir}
                            onClick={() => toggleInventorySort('name')}
                          />
                          <SortHeader
                            label="Stock"
                            align="right"
                            active={inventorySort.key === 'stock'}
                            direction={inventorySort.dir}
                            onClick={() => toggleInventorySort('stock')}
                          />
                          <SortHeader
                            label="Reorder level"
                            align="right"
                            active={inventorySort.key === 'reorder'}
                            direction={inventorySort.dir}
                            onClick={() => toggleInventorySort('reorder')}
                          />
                          <SortHeader
                            label="Gap"
                            align="right"
                            active={inventorySort.key === 'gap'}
                            direction={inventorySort.dir}
                            onClick={() => toggleInventorySort('gap')}
                          />
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryRows.map((row, index) => (
                          <tr
                            key={`${row.name}-${index}`}
                            className="border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                          >
                            <td className="max-w-[280px] truncate px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {row.name}
                            </td>
                            <td className="px-6 py-3.5 text-right text-sm text-slate-600 dark:text-slate-300">
                              {formatNumber(row.stock)}
                            </td>
                            <td className="px-6 py-3.5 text-right text-sm text-slate-600 dark:text-slate-300">
                              {formatNumber(row.reorder)}
                            </td>
                            <td
                              className={`px-6 py-3.5 text-right text-sm font-semibold ${
                                row.gap < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {formatNumber(row.gap)}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                                  row.status === 'low'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                                    : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                                }`}
                              >
                                {row.status === 'out'
                                  ? 'Out of stock'
                                  : row.status === 'critical'
                                    ? 'Critical'
                                    : 'Low'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="p-8 text-center text-sm text-slate-500">
                    No inventory items match your search.
                  </p>
                )}
              </>
            ) : (
              <div className="px-5 pb-6 sm:px-6">
                <EmptyChart
                  title="No inventory alerts returned"
                  description="The low-stock endpoint did not return products requiring attention."
                />
              </div>
            )}
          </Card>
        </section>
      </Reveal>

      {/* PRODUCT PERFORMANCE REPORT */}

      <Reveal delay={300}>
        <section>
          <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <SectionHeading
                eyebrow="Business performance"
                title="Product performance report"
                description="Search products and click a column header to sort."
              />
              <SearchBox
                value={productSearch}
                onChange={setProductSearch}
                placeholder="Search products..."
              />
            </div>

            {productRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <SortHeader
                        label="Product"
                        active={productSort.key === 'name'}
                        direction={productSort.dir}
                        onClick={() => toggleProductSort('name')}
                      />
                      <SortHeader
                        label="Units sold"
                        active={productSort.key === 'quantity'}
                        direction={productSort.dir}
                        onClick={() => toggleProductSort('quantity')}
                      />
                      <SortHeader
                        label="Revenue"
                        active={productSort.key === 'revenue'}
                        direction={productSort.dir}
                        onClick={() => toggleProductSort('revenue')}
                      />
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Performance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productRows.map((product, index) => {
                      const revenue = Number(product.revenue) || 0
                      const percentage = (revenue / maxProductRevenue) * 100
                      const share =
                        totalProductRevenue > 0
                          ? (revenue / totalProductRevenue) * 100
                          : 0

                      return (
                        <tr
                          key={product.product_id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                                {index + 1}
                              </div>
                              <span className="max-w-[280px] truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {product.product_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {formatNumber(Number(product.quantity_sold))}
                          </td>

                          <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(revenue)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex min-w-[140px] items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-12 text-right text-xs font-medium text-slate-500">
                                {share.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Package size={34} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
                  No matching products
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try another product name.
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              Showing {productRows.length} of {data.products.length} products
              returned by the API. The bar shows revenue relative to the best
              product; the percentage is its share of top-product revenue.
            </div>
          </Card>
        </section>
      </Reveal>

      {/* INTELLIGENCE MODULES */}

      <Reveal delay={340}>
        <section>
          <div className="mb-5">
            <SectionHeading
              eyebrow="Explore RetailIQ"
              title="Your intelligence workspace"
              description="Open the existing intelligence modules."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Customer Intelligence',
                description:
                  'Explore customer segments, value and churn analysis.',
                icon: Users,
                to: '/customers',
                color:
                  'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
              },
              {
                title: 'Product Intelligence',
                description:
                  'Understand product performance and purchasing patterns.',
                icon: Package,
                to: '/products',
                color:
                  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
              },
              {
                title: 'Recommendation Engine',
                description:
                  'Explore personalized recommendations from your ML system.',
                icon: Sparkles,
                to: '/recommendations',
                color:
                  'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
              },
              {
                title: 'Promotion Intelligence',
                description:
                  'Explore customer-product promotion opportunities.',
                icon: Zap,
                to: '/promotions',
                color:
                  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
              },
            ].map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.title} to={module.to} className="group block">
                  <Card className="h-full border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50">
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${module.color}`}
                      >
                        <Icon size={22} />
                      </div>
                      <ArrowUpRight
                        size={18}
                        className="text-slate-300 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-indigo-500"
                      />
                    </div>
                    <h3 className="mt-5 text-sm font-bold text-slate-900 dark:text-white">
                      {module.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                      {module.description}
                    </p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      </Reveal>

      {/* FOOTER */}

      <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-indigo-500">
            <BrainCircuit size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              RetailIQ Analytics
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Your retail intelligence workspace
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Dashboard data loaded
          </span>
          <span className="flex items-center gap-2">
            <Clock3 size={14} />
            Refresh to fetch the latest data
          </span>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 dark:text-indigo-400"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </footer>
    </div>
  )
}
