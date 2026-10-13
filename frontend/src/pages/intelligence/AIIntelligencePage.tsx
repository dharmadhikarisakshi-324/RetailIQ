import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Boxes,
  CreditCard,
  Package,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'

import {
  getDashboardAnalytics,
  type DashboardAnalytics,
} from '../../api/dashboard'

import {
  getTopProducts,
  type TopProductAnalytics,
} from '../../api/analytics'

import {
  getCustomerIntelligence,
  type CustomerIntelligence,
} from '../../api/customerIntelligence'

import {
  getProductIntelligence,
  type ProductIntelligenceResponse,
} from '../../api/productIntelligence'

import {
  getInventoryIntelligence,
  type InventoryRecommendation,
} from '../../api/inventoryIntelligence'

import {
  getPayments,
  type Payment,
} from '../../api/payments'


const DEFAULT_PRODUCT_CODE = '85123A'


function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}


function formatNumber(value: number) {
  return value.toLocaleString('en-IN')
}


function getRiskClasses(
  risk: InventoryRecommendation['risk_level'],
) {
  if (risk === 'High') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (risk === 'Medium') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}


function AIIntelligencePage() {
  const [dashboard, setDashboard] =
    useState<DashboardAnalytics | null>(null)

  const [topProducts, setTopProducts] =
    useState<TopProductAnalytics[]>([])

  const [customers, setCustomers] =
    useState<CustomerIntelligence[]>([])

  const [productIntelligence, setProductIntelligence] =
    useState<ProductIntelligenceResponse | null>(null)

  const [inventory, setInventory] =
    useState<InventoryRecommendation | null>(null)

  const [payments, setPayments] =
    useState<Payment[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)


  const loadIntelligence = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await Promise.allSettled([
        getDashboardAnalytics(),
        getTopProducts(5),
        getCustomerIntelligence(),
        getProductIntelligence(DEFAULT_PRODUCT_CODE),
        getInventoryIntelligence(DEFAULT_PRODUCT_CODE),
        getPayments(0, 100),
      ])

      const [
        dashboardResult,
        topProductsResult,
        customersResult,
        productResult,
        inventoryResult,
        paymentsResult,
      ] = results

      let successfulRequests = 0

      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value)
        successfulRequests++
      }

      if (topProductsResult.status === 'fulfilled') {
        setTopProducts(topProductsResult.value)
        successfulRequests++
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value)
        successfulRequests++
      }

      if (productResult.status === 'fulfilled') {
        setProductIntelligence(productResult.value)
        successfulRequests++
      }

      if (inventoryResult.status === 'fulfilled') {
        setInventory(inventoryResult.value)
        successfulRequests++
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value)
        successfulRequests++
      }

      if (successfulRequests === 0) {
        throw new Error(
          'Unable to load RetailIQ intelligence data.',
        )
      }

      setLastUpdated(new Date())

      if (successfulRequests < results.length) {
        setError(
          'Some intelligence modules could not be loaded. Available insights are still shown.',
        )
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load intelligence data.'

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    loadIntelligence()
  }, [])


  const completedPayments = useMemo(() => {
    return payments.filter(
      (payment) =>
        payment.status.toLowerCase() === 'completed',
    )
  }, [payments])


  const completedPaymentAmount = useMemo(() => {
    return completedPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0,
    )
  }, [completedPayments])


  const paymentMethodSummary = useMemo(() => {
    const summary: Record<string, number> = {}

    payments.forEach((payment) => {
      const method =
        payment.payment_method || 'Unknown'

      summary[method] =
        (summary[method] || 0) +
        Number(payment.amount || 0)
    })

    return Object.entries(summary).sort(
      (a, b) => b[1] - a[1],
    )
  }, [payments])


  const topCustomer = useMemo(() => {
    if (!customers.length) {
      return null
    }

    return [...customers].sort(
      (a, b) =>
        Number(b.total_spending || 0) -
        Number(a.total_spending || 0),
    )[0]
  }, [customers])


  const segmentSummary = useMemo(() => {
    const summary: Record<string, number> = {}

    customers.forEach((customer) => {
      const segment =
        customer.segment_name || 'Unknown'

      summary[segment] =
        (summary[segment] || 0) + 1
    })

    return Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [customers])


  const strongestAssociation = useMemo(() => {
    const rules =
      productIntelligence?.association_rules || []

    if (!rules.length) {
      return null
    }

    return [...rules].sort(
      (a, b) => b.lift - a.lift,
    )[0]
  }, [productIntelligence])


  const topSimilarProduct = useMemo(() => {
    const products =
      productIntelligence?.similar_products || []

    if (!products.length) {
      return null
    }

    return [...products].sort(
      (a, b) =>
        b.similarity_score -
        a.similarity_score,
    )[0]
  }, [productIntelligence])


  const aiInsights = useMemo(() => {
    const insights: Array<{
      title: string
      description: string
      icon: typeof Sparkles
      tone: string
    }> = []


    if (topProducts.length > 0) {
      const product = topProducts[0]

      insights.push({
        title: 'Top product opportunity',
        description: `${product.product_name} is currently the highest-revenue product in the available product analytics.`,
        icon: TrendingUp,
        tone: 'bg-indigo-50 text-indigo-700',
      })
    }


    if (topCustomer) {
      insights.push({
        title: 'High-value customer detected',
        description: `${topCustomer.name} has the highest recorded customer spending in the current intelligence dataset.`,
        icon: Users,
        tone: 'bg-violet-50 text-violet-700',
      })
    }


    if (inventory) {
      insights.push({
        title: 'Inventory planning signal',
        description: `${inventory.product_id} has predicted demand of ${inventory.predicted_daily_demand.toFixed(
          2,
        )} units/day with a reorder point of ${inventory.reorder_point.toFixed(
          2,
        )}.`,
        icon: Boxes,
        tone: 'bg-emerald-50 text-emerald-700',
      })
    }


    if (strongestAssociation) {
      insights.push({
        title: 'Cross-sell opportunity',
        description: `${strongestAssociation.antecedents} → ${strongestAssociation.consequents} has the strongest association lift for the selected product.`,
        icon: Zap,
        tone: 'bg-amber-50 text-amber-700',
      })
    }


    if (dashboard && dashboard.low_stock_products > 0) {
      insights.push({
        title: 'Inventory attention required',
        description: `${dashboard.low_stock_products} products are currently flagged as low stock by the dashboard analytics.`,
        icon: AlertTriangle,
        tone: 'bg-red-50 text-red-700',
      })
    }


    if (!insights.length) {
      insights.push({
        title: 'Retail intelligence ready',
        description:
          'RetailIQ is collecting signals from customers, products, inventory, orders, and payments.',
        icon: Sparkles,
        tone: 'bg-indigo-50 text-indigo-700',
      })
    }


    return insights.slice(0, 5)
  }, [
    dashboard,
    inventory,
    topCustomer,
    topProducts,
    strongestAssociation,
  ])


  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">

          <div
            className="
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-indigo-50
            "
          >
            <Sparkles
              className="
                h-7
                w-7
                animate-pulse
                text-indigo-600
              "
            />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            Loading AI Intelligence
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Collecting signals from your retail modules...
          </p>

        </div>
      </div>
    )
  }


  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* HERO */}
      {/* ================================================== */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          border
          border-indigo-100
          bg-gradient-to-br
          from-indigo-50
          via-white
          to-violet-50
          p-6
          shadow-sm
          sm:p-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-indigo-600
                shadow-lg
                shadow-indigo-200
              "
            >
              <Brain className="h-7 w-7 text-white" />
            </div>

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-indigo-200
                  bg-white
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-indigo-700
                "
              >
                <Sparkles className="h-3.5 w-3.5" />
                RetailIQ Intelligence
              </div>

              <h1
                className="
                  mt-3
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                "
              >
                AI Intelligence Command Center
              </h1>

              <p
                className="
                  mt-2
                  max-w-3xl
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                A unified view of customer, product,
                inventory, payment, and retail
                performance signals.
              </p>

              {lastUpdated && (
                <p className="mt-3 text-xs text-slate-400">
                  Last updated{' '}
                  {lastUpdated.toLocaleTimeString(
                    'en-IN',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </p>
              )}

            </div>

          </div>


          <button
            type="button"
            onClick={loadIntelligence}
            disabled={isLoading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              shadow-sm
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh Intelligence
          </button>

        </div>
      </section>


      {/* ================================================== */}
      {/* PARTIAL ERROR */}
      {/* ================================================== */}

      {error && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-4
            text-sm
            text-amber-800
          "
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">
              Intelligence warning
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}


      {/* ================================================== */}
      {/* EXECUTIVE KPIs */}
      {/* ================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Sales
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(
              dashboard?.total_sales || 0,
            )}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-indigo-50 p-2.5 w-fit">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Total Orders
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(
              dashboard?.total_orders || 0,
            )}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-violet-50 p-2.5 w-fit">
            <Users className="h-5 w-5 text-violet-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Customers
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(
              dashboard?.total_customers || 0,
            )}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-amber-50 p-2.5 w-fit">
            <Boxes className="h-5 w-5 text-amber-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Products
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(
              dashboard?.total_products || 0,
            )}
          </p>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-sky-50 p-2.5 w-fit">
            <CreditCard className="h-5 w-5 text-sky-600" />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Completed Payments
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(
              completedPaymentAmount,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {completedPayments.length} transactions
          </p>
        </div>

      </section>


      {/* ================================================== */}
      {/* AI BUSINESS INSIGHTS */}
      {/* ================================================== */}

      <section>

        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              AI Business Insights
            </h2>

            <p className="text-sm text-slate-500">
              Signals generated from the existing RetailIQ intelligence modules.
            </p>
          </div>
        </div>


        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

          {aiInsights.map(
            (insight) => {
              const Icon = insight.icon

              return (
                <div
                  key={insight.title}
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    p-5
                    shadow-sm
                  "
                >

                  <div
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      ${insight.tone}
                    `}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-900">
                    {insight.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {insight.description}
                  </p>

                </div>
              )
            },
          )}

        </div>

      </section>


      {/* ================================================== */}
      {/* CUSTOMER + PRODUCT */}
      {/* ================================================== */}

      <section className="grid gap-6 xl:grid-cols-2">

        {/* CUSTOMER INTELLIGENCE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-violet-50 p-2.5">
                <Users className="h-5 w-5 text-violet-600" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Customer Intelligence
                </h2>

                <p className="text-xs text-slate-500">
                  RFM and ML customer segmentation
                </p>
              </div>

            </div>

            <ArrowUpRight className="h-5 w-5 text-slate-300" />

          </div>


          {topCustomer && (
            <div
              className="
                mt-5
                rounded-xl
                bg-slate-50
                p-4
              "
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Highest Spending Customer
              </p>

              <div className="mt-2 flex items-end justify-between gap-3">

                <div>
                  <p className="font-semibold text-slate-900">
                    {topCustomer.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {topCustomer.segment_name || 'Unknown segment'}
                  </p>
                </div>

                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(
                    Number(
                      topCustomer.total_spending || 0,
                    ),
                  )}
                </p>

              </div>
            </div>
          )}


          <div className="mt-5">

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">
                Customer Segments
              </p>

              <span className="text-xs text-slate-400">
                {customers.length} customers
              </span>
            </div>


            <div className="mt-3 space-y-3">

              {segmentSummary.map(
                ([segment, count]) => {

                  const percentage =
                    customers.length > 0
                      ? (count / customers.length) *
                        100
                      : 0

                  return (
                    <div key={segment}>

                      <div className="flex items-center justify-between gap-3">

                        <p className="truncate text-xs font-medium text-slate-600">
                          {segment}
                        </p>

                        <p className="shrink-0 text-xs font-semibold text-slate-900">
                          {count}
                        </p>

                      </div>

                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${Math.min(
                              percentage,
                              100,
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  )
                },
              )}

            </div>

          </div>

        </div>


        {/* PRODUCT INTELLIGENCE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-indigo-50 p-2.5">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Product Intelligence
                </h2>

                <p className="text-xs text-slate-500">
                  Product similarity and market basket signals
                </p>
              </div>

            </div>

            <span
              className="
                rounded-full
                bg-indigo-50
                px-2.5
                py-1
                text-xs
                font-semibold
                text-indigo-700
              "
            >
              {DEFAULT_PRODUCT_CODE}
            </span>

          </div>


          {productIntelligence?.product && (
            <div className="mt-5">

              <h3 className="text-sm font-bold text-slate-900">
                {productIntelligence.product.Description}
              </h3>


              <div className="mt-4 grid grid-cols-3 gap-3">

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Revenue
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatCurrency(
                      productIntelligence.product.TotalRevenue,
                    )}
                  </p>
                </div>


                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Transactions
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatNumber(
                      productIntelligence.product.Transactions,
                    )}
                  </p>
                </div>


                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Customers
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatNumber(
                      productIntelligence.product.Customers,
                    )}
                  </p>
                </div>

              </div>


              {topSimilarProduct && (
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    Most Similar Product
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">

                    <p className="text-sm font-semibold text-slate-900">
                      {topSimilarProduct.Description}
                    </p>

                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-indigo-700">
                      {(
                        topSimilarProduct.similarity_score *
                        100
                      ).toFixed(1)}
                      %
                    </span>

                  </div>

                </div>
              )}


              {strongestAssociation && (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                    Strongest Association
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3">

                    <p className="text-sm font-semibold text-slate-900">
                      {strongestAssociation.antecedents}
                      {' → '}
                      {strongestAssociation.consequents}
                    </p>

                    <span className="shrink-0 text-xs font-bold text-amber-700">
                      Lift{' '}
                      {strongestAssociation.lift.toFixed(2)}
                    </span>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </section>


      {/* ================================================== */}
      {/* INVENTORY + PAYMENTS */}
      {/* ================================================== */}

      <section className="grid gap-6 xl:grid-cols-2">

        {/* INVENTORY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-emerald-50 p-2.5">
                <Boxes className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Inventory Intelligence
                </h2>

                <p className="text-xs text-slate-500">
                  ML demand forecast and reorder planning
                </p>
              </div>

            </div>

            {inventory && (
              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-bold
                  ${getRiskClasses(
                    inventory.risk_level,
                  )}
                `}
              >
                {inventory.risk_level} Risk
              </span>
            )}

          </div>


          {inventory && (
            <div className="mt-5">

              <div
                className="
                  rounded-xl
                  border
                  border-emerald-100
                  bg-emerald-50/50
                  p-4
                "
              >

                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  AI Recommendation
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {inventory.recommendation}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Product {inventory.product_id}
                </p>

              </div>


              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Daily Demand
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {inventory.predicted_daily_demand.toFixed(
                      2,
                    )}
                  </p>
                </div>


                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Current Stock
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatNumber(
                      inventory.current_stock,
                    )}
                  </p>
                </div>


                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Reorder Point
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {inventory.reorder_point.toFixed(
                      2,
                    )}
                  </p>
                </div>


                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">
                    Recommended Order
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatNumber(
                      inventory.recommended_order_quantity,
                    )}
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>


        {/* PAYMENTS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-3">

              <div className="rounded-xl bg-sky-50 p-2.5">
                <CreditCard className="h-5 w-5 text-sky-600" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Payment Intelligence
                </h2>

                <p className="text-xs text-slate-500">
                  Payment volume and method distribution
                </p>
              </div>

            </div>

            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {completedPayments.length} completed
            </span>

          </div>


          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Total Payment Records
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatNumber(payments.length)}
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Completed Amount
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(
                  completedPaymentAmount,
                )}
              </p>
            </div>

          </div>


          <div className="mt-5">

            <p className="text-sm font-semibold text-slate-900">
              Payment Methods
            </p>

            <div className="mt-3 space-y-3">

              {paymentMethodSummary.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No payment data available.
                </p>
              ) : (
                paymentMethodSummary.map(
                  ([method, amount]) => {

                    const percentage =
                      completedPaymentAmount > 0
                        ? (amount /
                            completedPaymentAmount) *
                          100
                        : 0

                    return (
                      <div key={method}>

                        <div className="flex items-center justify-between gap-3">

                          <p className="text-xs font-medium capitalize text-slate-600">
                            {method}
                          </p>

                          <p className="text-xs font-bold text-slate-900">
                            {formatCurrency(amount)}
                          </p>

                        </div>

                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{
                              width: `${Math.min(
                                percentage,
                                100,
                              )}%`,
                            }}
                          />

                        </div>

                      </div>
                    )
                  },
                )
              )}

            </div>

          </div>

        </div>

      </section>


      {/* ================================================== */}
      {/* MODULE STATUS */}
      {/* ================================================== */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-indigo-50 p-2.5">
            <Brain className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              Intelligence Coverage
            </h2>

            <p className="text-xs text-slate-500">
              Connected RetailIQ modules
            </p>
          </div>

        </div>


        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

          {[
            'Customer Intelligence',
            'Product Intelligence',
            'Inventory Intelligence',
            'Payment Intelligence',
            'Sales Analytics',
            'Top Product Analytics',
          ].map((module) => (
            <div
              key={module}
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-emerald-100
                bg-emerald-50/50
                px-4
                py-3
              "
            >

              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <span className="text-sm font-medium text-slate-700">
                {module}
              </span>

            </div>
          ))}

        </div>

      </section>

    </div>
  )
}

export default AIIntelligencePage