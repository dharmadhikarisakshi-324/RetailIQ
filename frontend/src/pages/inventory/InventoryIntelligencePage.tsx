import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react'
import { useState } from 'react'

import {
  getInventoryIntelligence,
  type InventoryRecommendation,
} from '../../api/inventoryIntelligence'

// ============================================================
// HELPERS
// ============================================================

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value)
}

function getRiskClasses(risk: string) {
  switch (risk) {
    case 'High':
      return {
        badge: 'bg-red-50 text-red-700 border-red-200',
        icon: 'text-red-600',
        card: 'border-red-200 bg-red-50/50',
      }

    case 'Medium':
      return {
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'text-amber-600',
        card: 'border-amber-200 bg-amber-50/50',
      }

    default:
      return {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'text-emerald-600',
        card: 'border-emerald-200 bg-emerald-50/50',
      }
  }
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: typeof Package
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

function InventoryIntelligencePage() {
  const [productId, setProductId] = useState('85123A')

  const [result, setResult] =
    useState<InventoryRecommendation | null>(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // ==========================================================
  // ANALYZE PRODUCT
  // ==========================================================

  const analyzeProduct = async () => {
    const trimmedProductId = productId.trim()

    if (!trimmedProductId) {
      setError('Please enter a product code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data =
        await getInventoryIntelligence(
          trimmedProductId,
        )

      setResult(data)
    } catch (err: any) {
      console.error(
        'Inventory intelligence error:',
        err,
      )

      const message =
        err?.response?.data?.detail ||
        'Unable to load inventory intelligence for this product.'

      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // CLEAR
  // ==========================================================

  const clearAnalysis = () => {
    setProductId('')
    setResult(null)
    setError(null)
  }

  const riskClasses = result
    ? getRiskClasses(result.risk_level)
    : null

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />

            AI-Powered Inventory Intelligence
          </div>

          <div className="mt-5 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Predict demand. Prevent stockouts.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Use RetailIQ's machine learning inventory model
              to forecast demand and generate reorder
              recommendations for individual products.
            </p>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                value={productId}
                onChange={(event) =>
                  setProductId(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    analyzeProduct()
                  }
                }}
                placeholder="Enter product code e.g. 85123A"
                className="h-12 w-full rounded-xl border border-white/10 bg-white px-12 pr-12 text-sm font-medium text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/30"
              />

              {productId && (
                <button
                  type="button"
                  onClick={clearAnalysis}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={analyzeProduct}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Analyze Inventory
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Inventory analysis failed
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!result && !loading && !error && (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Boxes className="h-8 w-8 text-indigo-600" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-900">
            Inventory intelligence is ready
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Enter a product code to generate demand forecasts,
            safety stock calculations, reorder points and
            inventory risk recommendations.
          </p>
        </section>
      )}

      {/* =====================================================
          RESULTS
      ===================================================== */}

      {result && (
        <>
          {/* =================================================
              PRODUCT HEADER
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                  <Package className="h-6 w-6 text-indigo-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Product
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {result.product_id}
                  </h2>
                </div>
              </div>

              {riskClasses && (
                <div
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${riskClasses.badge}`}
                >
                  {result.risk_level === 'High' && (
                    <AlertTriangle className="h-4 w-4" />
                  )}

                  {result.risk_level === 'Medium' && (
                    <AlertCircle className="h-4 w-4" />
                  )}

                  {result.risk_level === 'Low' && (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {result.risk_level} Risk
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              KPI CARDS
          ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Predicted Daily Demand"
              value={formatNumber(
                result.predicted_daily_demand,
              )}
              description="Expected units per day"
              icon={TrendingUp}
            />

            <StatCard
              title="Current Stock"
              value={formatNumber(
                result.current_stock,
              )}
              description="Current inventory level"
              icon={Boxes}
            />

            <StatCard
              title="Safety Stock"
              value={formatNumber(
                result.safety_stock,
              )}
              description="Demand variability buffer"
              icon={ShieldCheck}
            />

            <StatCard
              title="Reorder Point"
              value={formatNumber(
                result.reorder_point,
              )}
              description="Trigger inventory level"
              icon={Package}
            />
          </section>

          {/* =================================================
              RECOMMENDATION
          ================================================= */}

          <section
            className={`rounded-2xl border p-6 shadow-sm ${riskClasses?.card}`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${riskClasses?.icon}`}
                >
                  {result.risk_level === 'High' ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : result.risk_level === 'Medium' ? (
                    <AlertCircle className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    AI Recommendation
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {result.recommendation}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    RetailIQ recommends ordering{' '}
                    <strong>
                      {formatNumber(
                        result.recommended_order_quantity,
                      )}
                    </strong>{' '}
                    units based on predicted demand,
                    safety stock and the current inventory
                    level.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white px-6 py-4 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Recommended Order
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatNumber(
                    result.recommended_order_quantity,
                  )}
                </p>

                <p className="text-xs text-slate-400">
                  units
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              INVENTORY DETAILS
          ================================================= */}

          <section className="grid gap-6 lg:grid-cols-2">
            {/* Demand Forecast */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Demand Forecast
                  </h3>

                  <p className="text-xs text-slate-400">
                    Machine learning prediction
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    Daily demand
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(
                      result.predicted_daily_demand,
                    )}{' '}
                    units
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    Demand variability
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(result.demand_std)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Lead time
                  </span>

                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4 text-indigo-500" />
                    {result.lead_time_days} day
                    {result.lead_time_days !== 1
                      ? 's'
                      : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Reorder Planning */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Reorder Planning
                  </h3>

                  <p className="text-xs text-slate-400">
                    Inventory control metrics
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    Lead-time demand
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(
                      result.lead_time_demand,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-sm text-slate-500">
                    Safety stock
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatNumber(
                      result.safety_stock,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Reorder point
                  </span>

                  <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700">
                    <ArrowDown className="h-4 w-4" />

                    {formatNumber(
                      result.reorder_point,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              DECISION SUMMARY
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Inventory Decision Summary
                </h3>

                <p className="text-xs text-slate-400">
                  How RetailIQ arrived at the recommendation
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current stock
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatNumber(result.current_stock)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Reorder threshold
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatNumber(result.reorder_point)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Action
                </p>

                <p className="mt-2 text-xl font-bold text-indigo-700">
                  {result.recommendation}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex gap-3">
                <ArrowUp className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

                <p className="text-sm leading-6 text-indigo-900">
                  The recommendation combines the ML demand
                  forecast with product demand variability and
                  the calculated safety stock. This helps the
                  retailer decide when and how much inventory
                  should be reordered.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default InventoryIntelligencePage