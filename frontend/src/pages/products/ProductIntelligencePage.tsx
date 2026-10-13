import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  getProductIntelligence,
} from '../../api/productIntelligence'

import type {
  AssociationRule,
  ProductIntelligenceResponse,
  SimilarProduct,
} from '../../api/productIntelligence'

// =========================================================
// HELPERS
// =========================================================

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

function formatScore(value: number) {
  return value.toFixed(2)
}

// =========================================================
// STAT CARD
// =========================================================

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
}

function StatCard({
  title,
  value,
  subtitle,
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
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
      </div>
    </div>
  )
}

// =========================================================
// SIMILAR PRODUCT CARD
// =========================================================

interface SimilarProductCardProps {
  product: SimilarProduct
}

function SimilarProductCard({
  product,
}: SimilarProductCardProps) {
  const similarityPercentage =
    product.similarity_score * 100

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-indigo-200 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
          <Package className="h-5 w-5 text-indigo-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {product.Description}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Stock Code: {product.StockCode}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {similarityPercentage.toFixed(1)}%
            </span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Similarity
              </span>

              <span className="text-xs font-medium text-slate-600">
                {formatScore(product.similarity_score)}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${Math.min(
                    similarityPercentage,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================================
// ASSOCIATION RULE CARD
// =========================================================

interface AssociationRuleCardProps {
  rule: AssociationRule
}

function AssociationRuleCard({
  rule,
}: AssociationRuleCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-indigo-200 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="rounded-lg bg-slate-100 px-3 py-2">
            <span className="text-xs font-semibold text-slate-700">
              {rule.antecedents}
            </span>
          </div>

          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

          <div className="rounded-lg bg-indigo-50 px-3 py-2">
            <span className="text-xs font-semibold text-indigo-700">
              {rule.consequents}
            </span>
          </div>
        </div>

        {rule.lift >= 3 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            Strong association
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Support
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {formatPercent(rule.support)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-400">
            Confidence
          </p>

          <p className="mt-1 text-sm font-bold text-slate-900">
            {formatPercent(rule.confidence)}
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3">
          <p className="text-xs text-indigo-500">
            Lift
          </p>

          <p className="mt-1 text-sm font-bold text-indigo-700">
            {rule.lift.toFixed(2)}x
          </p>
        </div>
      </div>
    </div>
  )
}

// =========================================================
// MAIN PAGE
// =========================================================

function ProductIntelligencePage() {
  const [stockCodeInput, setStockCodeInput] =
    useState('85123A')

  const [activeStockCode, setActiveStockCode] =
    useState('85123A')

  const [data, setData] =
    useState<ProductIntelligenceResponse | null>(null)

  const [isLoading, setIsLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  // =======================================================
  // LOAD PRODUCT INTELLIGENCE
  // =======================================================

  async function loadProduct(
    stockCode: string = activeStockCode,
  ) {
    const cleanedStockCode = stockCode.trim()

    if (!cleanedStockCode) {
      setError('Please enter a stock code.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response =
        await getProductIntelligence(
          cleanedStockCode,
        )

      setData(response)
      setActiveStockCode(cleanedStockCode)
      setStockCodeInput(cleanedStockCode)
    } catch (err) {
      console.error(
        'Product intelligence error:',
        err,
      )

      setData(null)

      setError(
        'Unable to load product intelligence. Please check the stock code and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {
    void loadProduct('85123A')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =======================================================
  // KEYBOARD SEARCH
  // =======================================================

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Enter') {
      void loadProduct(stockCodeInput)
    }
  }

  // =======================================================
  // AI INSIGHTS
  // =======================================================

  const strongestSimilarity = useMemo(() => {
    if (
      !data ||
      data.similar_products.length === 0
    ) {
      return null
    }

    return data.similar_products.reduce(
      (best, current) =>
        current.similarity_score >
        best.similarity_score
          ? current
          : best,
    )
  }, [data])

  const strongestAssociation = useMemo(() => {
    if (
      !data ||
      data.association_rules.length === 0
    ) {
      return null
    }

    return data.association_rules.reduce(
      (best, current) =>
        current.lift > best.lift
          ? current
          : best,
    )
  }, [data])

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HERO
      ================================================= */}

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Brain className="h-3.5 w-3.5" />
              AI-Powered Product Intelligence
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Product Intelligence
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Explore product performance, AI-powered
              similarity and market-basket relationships
              using RetailIQ intelligence.
            </p>
          </div>

          <div className="hidden lg:flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/10 backdrop-blur">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-7 max-w-3xl">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-200" />

                <input
                  type="text"
                  value={stockCodeInput}
                  onChange={(event) =>
                    setStockCodeInput(
                      event.target.value,
                    )
                  }
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Enter product stock code..."
                  className="h-12 w-full rounded-xl border border-white/10 bg-white px-11 pr-10 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/40"
                />

                {stockCodeInput && (
                  <button
                    type="button"
                    onClick={() =>
                      setStockCodeInput('')
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadProduct(stockCodeInput)
                }
                disabled={isLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Analyze Product
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-indigo-200">
            Try stock code: 85123A
          </p>
        </div>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-800">
              Product intelligence unavailable
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadProduct(activeStockCode)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {isLoading && !data && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-600" />

          <p className="mt-4 text-sm font-medium text-slate-700">
            Analyzing product intelligence...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Loading product performance and AI insights.
          </p>
        </div>
      )}

      {/* =================================================
          DATA
      ================================================= */}

      {data && (
        <>
          {/* =============================================
              PRODUCT HEADER
          ============================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                  <Package className="h-7 w-7 text-indigo-600" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {data.product.StockCode}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      AI analyzed
                    </span>
                  </div>

                  <h2 className="mt-2 truncate text-xl font-bold text-slate-900">
                    {data.product.Description}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadProduct(activeStockCode)
                }
                disabled={isLoading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                Refresh
              </button>
            </div>
          </section>

          {/* =============================================
              KPI CARDS
          ============================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(
                data.product.TotalRevenue,
              )}
              subtitle="Lifetime product revenue"
              icon={TrendingUp}
            />

            <StatCard
              title="Total Quantity"
              value={formatNumber(
                data.product.TotalQuantity,
              )}
              subtitle="Units sold"
              icon={ShoppingBag}
            />

            <StatCard
              title="Transactions"
              value={formatNumber(
                data.product.Transactions,
              )}
              subtitle="Purchase transactions"
              icon={BarChart3}
            />

            <StatCard
              title="Customers"
              value={formatNumber(
                data.product.Customers,
              )}
              subtitle="Unique customers"
              icon={Users}
            />
          </section>

          {/* =============================================
              AI INSIGHTS
          ============================================= */}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    AI Similarity Insight
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {strongestSimilarity
                      ? `${strongestSimilarity.Description} is the closest AI-identified product.`
                      : 'No similar products available.'}
                  </p>

                  {strongestSimilarity && (
                    <p className="mt-1 text-sm text-slate-500">
                      Similarity score:{' '}
                      <span className="font-semibold text-indigo-700">
                        {formatScore(
                          strongestSimilarity.similarity_score,
                        )}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    Basket Association Insight
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {strongestAssociation
                      ? `${strongestAssociation.antecedents} has the strongest association with this product.`
                      : 'No association rules available.'}
                  </p>

                  {strongestAssociation && (
                    <p className="mt-1 text-sm text-slate-500">
                      Lift:{' '}
                      <span className="font-semibold text-emerald-700">
                        {strongestAssociation.lift.toFixed(
                          2,
                        )}
                        x
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =============================================
              SIMILAR PRODUCTS
          ============================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Similar Products
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Products identified as similar by the
                  RetailIQ product intelligence model.
                </p>
              </div>

              <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {data.similar_products.length}{' '}
                products
              </span>
            </div>

            {data.similar_products.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {data.similar_products.map(
                  (product) => (
                    <SimilarProductCard
                      key={product.StockCode}
                      product={product}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                <Package className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No similar products found.
                </p>
              </div>
            )}
          </section>

          {/* =============================================
              ASSOCIATION RULES
          ============================================= */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Association Rules
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Products frequently associated with
                  this product in customer baskets.
                </p>
              </div>

              <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {data.association_rules.length}{' '}
                rules
              </span>
            </div>

            {data.association_rules.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {data.association_rules.map(
                  (rule, index) => (
                    <AssociationRuleCard
                      key={`${rule.antecedents}-${rule.consequents}-${index}`}
                      rule={rule}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No association rules found.
                </p>
              </div>
            )}
          </section>

          {/* =============================================
              MODEL INTERPRETATION
          ============================================= */}

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                <Brain className="h-5 w-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  How to read these insights
                </h2>

                <div className="mt-3 grid gap-4 text-sm text-slate-500 md:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-700">
                      Similarity Score
                    </p>

                    <p className="mt-1 leading-5">
                      Higher values indicate stronger
                      similarity between products.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700">
                      Confidence
                    </p>

                    <p className="mt-1 leading-5">
                      Indicates how often the consequent
                      appears when the antecedent occurs.
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700">
                      Lift
                    </p>

                    <p className="mt-1 leading-5">
                      Values above 1 indicate a positive
                      product association.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default ProductIntelligencePage