import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import axios from 'axios'

import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  BadgePercent,
  Brain,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import {
  getCustomers,
  type Customer,
} from '../../api/customers'

import {
  getProducts,
  type Product,
} from '../../api/products'

import {
  getPromotionRecommendation,
  getPromotionOffers,
  type PromotionRecommendation,
  type PromotionOffer,
} from '../../api/promotions'

// ============================================================
// CONSTANTS
// ============================================================

const CUSTOMER_BATCH_SIZE = 500

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (error.response?.status === 400) {
      return 'The backend rejected the request. Check the request parameters.'
    }

    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.'
    }

    if (error.response?.status === 403) {
      return 'Your account does not have permission to access promotions.'
    }

    if (error.response?.status === 404) {
      return 'The requested promotion endpoint was not found.'
    }

    if (!error.response) {
      return 'Cannot connect to the backend. Check that FastAPI is running on port 8002.'
    }

    return error.message || 'The request could not be completed.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

// ============================================================
// LOAD ALL CUSTOMERS IN VALID BATCHES
// ============================================================

async function getAllCustomers(): Promise<Customer[]> {
  const allCustomers: Customer[] = []
  let skip = 0

  while (true) {
    const batch = await getCustomers(
      skip,
      CUSTOMER_BATCH_SIZE,
    )

    allCustomers.push(...batch)

    if (batch.length < CUSTOMER_BATCH_SIZE) {
      break
    }

    skip += CUSTOMER_BATCH_SIZE
  }

  return allCustomers
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  description: string
  icon: typeof Target
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-lg font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

function PromotionIntelligencePage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')

  const [recommendation, setRecommendation] =
    useState<PromotionRecommendation | null>(null)

  const [offers, setOffers] = useState<PromotionOffer[]>([])

  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [pageError, setPageError] = useState('')
  const [analysisError, setAnalysisError] = useState('')

  // ==========================================================
  // LOAD CUSTOMERS AND PRODUCTS
  // ==========================================================

  const loadOptions = useCallback(async () => {
    setIsLoadingOptions(true)
    setPageError('')

    try {
      const [customerData, productData] = await Promise.all([
        getAllCustomers(),
        getProducts(),
      ])

      const activeCustomers = customerData.filter(
        (customer) =>
          customer.is_active &&
          customer.ml_customer_id !== null &&
          customer.ml_customer_id !== undefined,
      )

      const activeProducts = productData.filter(
        (product) =>
          product.is_active &&
          Boolean(product.product_code?.trim()),
      )

      setCustomers(activeCustomers)
      setProducts(activeProducts)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setIsLoadingOptions(false)
    }
  }, [])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  // ==========================================================
  // RUN PROMOTION ANALYSIS
  // ==========================================================

  async function handleAnalyze(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!customerId || !productId) {
      setAnalysisError(
        'Please select both a customer and a product.',
      )
      return
    }

    setIsAnalyzing(true)
    setAnalysisError('')
    setRecommendation(null)
    setOffers([])

    try {
      const selectedCustomer = customers.find(
        (customer) =>
          String(customer.ml_customer_id) === customerId,
      )

      if (
        !selectedCustomer ||
        selectedCustomer.ml_customer_id === null ||
        selectedCustomer.ml_customer_id === undefined
      ) {
        throw new Error(
          'The selected customer does not have a valid ML customer ID.',
        )
      }

      const [bestOffer, offerResponse] = await Promise.all([
        getPromotionRecommendation(
          selectedCustomer.ml_customer_id,
          productId,
        ),

        getPromotionOffers(
          selectedCustomer.ml_customer_id,
          productId,
        ),
      ])

      setRecommendation(bestOffer)
      setOffers(offerResponse.offers)
    } catch (error) {
      setAnalysisError(getErrorMessage(error))
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ==========================================================
  // SELECTED DATA
  // ==========================================================

  const selectedCustomer = customers.find(
    (customer) =>
      String(customer.ml_customer_id) === customerId,
  )

  const selectedProduct = products.find(
    (product) => product.product_code === productId,
  )

  const bestOffer =
    offers.length > 0
      ? offers[0]
      : null

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (isLoadingOptions) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-9 w-9 animate-spin text-indigo-600" />

          <p className="mt-4 font-semibold text-slate-800">
            Loading promotion intelligence
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Fetching customers and products...
          </p>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">

      {/* HEADER */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-52 w-52 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <Sparkles className="h-4 w-4" />
              MACHINE LEARNING · PROMOTION ENGINE
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Promotion Intelligence
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Discover personalized offers using customer behaviour,
              product insights, and predicted purchase probability.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <Brain className="h-4 w-4" />
                ML-powered predictions
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <BadgePercent className="h-4 w-4" />
                Offer comparison
              </span>
            </div>
          </div>

          <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 lg:flex">
            <Brain
              className="h-20 w-20 text-white"
              strokeWidth={1.2}
            />
          </div>
        </div>
      </section>

      {/* PAGE ERROR */}

      {pageError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">
              Unable to load promotion data
            </p>

            <p className="mt-1">
              {pageError}
            </p>

            <button
              type="button"
              onClick={() => void loadOptions()}
              className="mt-3 inline-flex items-center gap-2 font-semibold underline"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* CUSTOMER AND PRODUCT SELECTION */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <SectionHeading
          eyebrow="Promotion workspace"
          title="Find the right offer"
          description="Choose a customer and a product to generate personalized promotion recommendations."
        />

        <form
          onSubmit={handleAnalyze}
          className="mt-6"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* CUSTOMER */}

            <div>
              <label
                htmlFor="promotion-customer"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select customer
              </label>

              <div className="relative">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <select
                  id="promotion-customer"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value)
                    setAnalysisError('')
                    setRecommendation(null)
                    setOffers([])
                  }}
                  disabled={
                    customers.length === 0 ||
                    isAnalyzing ||
                    Boolean(pageError)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="">
                    Choose a customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={String(customer.ml_customer_id)}
                    >
                      {customer.name} · ML ID {customer.ml_customer_id}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {selectedCustomer && (
                <p className="mt-2 text-xs text-slate-500">
                  Customer code: {selectedCustomer.customer_code}
                </p>
              )}
            </div>

            {/* PRODUCT */}

            <div>
              <label
                htmlFor="promotion-product"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Select product
              </label>

              <div className="relative">
                <ShoppingBag className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <select
                  id="promotion-product"
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value)
                    setAnalysisError('')
                    setRecommendation(null)
                    setOffers([])
                  }}
                  disabled={
                    products.length === 0 ||
                    isAnalyzing ||
                    Boolean(pageError)
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="">
                    Choose a product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.product_code}
                    >
                      {product.name} · {product.product_code}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              {selectedProduct && (
                <p className="mt-2 text-xs text-slate-500">
                  Product code: {selectedProduct.product_code}
                </p>
              )}
            </div>
          </div>

          {/* SELECTION SUMMARY */}

          {(selectedCustomer || selectedProduct) && (
            <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Users className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Customer
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedCustomer?.name ?? 'Not selected'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <ShoppingBag className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Product
                  </p>

                  <p className="truncate text-sm font-semibold text-slate-800">
                    {selectedProduct?.name ?? 'Not selected'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ANALYSIS ERROR */}

          {analysisError && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

              <p>
                {analysisError}
              </p>
            </div>
          )}

          {/* SUBMIT */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              Uses your existing backend promotion model.
              No model retraining is performed.
            </p>

            <button
              type="submit"
              disabled={
                isAnalyzing ||
                customers.length === 0 ||
                products.length === 0 ||
                Boolean(pageError)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Analyzing offers...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate recommendations
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {customers.length === 0 && !pageError && (
            <p className="mt-4 text-sm text-amber-700">
              No active customers with an ML customer ID are available.
            </p>
          )}

          {products.length === 0 && !pageError && (
            <p className="mt-2 text-sm text-amber-700">
              No active products are available.
            </p>
          )}
        </form>
      </section>

      {/* EMPTY STATE */}

      {!recommendation &&
        !isAnalyzing &&
        !analysisError && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Target className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Ready to discover a personalized offer?
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Select a customer and product above. RetailIQ will
              evaluate the available offers and return the
              recommendation from your promotion model.
            </p>
          </section>
        )}

      {/* RECOMMENDATION RESULTS */}

      {recommendation && (
        <div className="space-y-7">

          {/* BEST OFFER */}

          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:flex-row sm:items-center sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Recommended promotion
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {recommendation.recommended_offer}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Personalized for {recommendation.customer_segment}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-5 py-4 sm:min-w-36 sm:text-center">
                <p className="text-xs font-semibold text-slate-500">
                  Recommended discount
                </p>

                <p className="mt-1 text-3xl font-bold text-emerald-700">
                  {formatPercentage(recommendation.discount_rate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Product
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {recommendation.description}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Code: {recommendation.stock_code}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Customer segment
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {recommendation.customer_segment}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Customer ID: {recommendation.customer_id}
                </p>
              </div>
            </div>
          </section>

          {/* METRICS */}

          <section>
            <SectionHeading
              eyebrow="Prediction results"
              title="Promotion performance"
              description="Model estimates for the selected customer and product."
            />

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Base purchase probability"
                value={formatPercentage(
                  recommendation.purchase_probability,
                )}
                description="Predicted probability before the offer response adjustment."
                icon={Target}
                accent="bg-indigo-50 text-indigo-600"
              />

              <MetricCard
                title="Estimated purchase probability"
                value={formatPercentage(
                  recommendation.estimated_purchase_probability,
                )}
                description="Estimated probability after the recommended offer response factor."
                icon={TrendingUp}
                accent="bg-emerald-50 text-emerald-600"
              />

              <MetricCard
                title="Discounted price"
                value={formatCurrency(
                  recommendation.discounted_price,
                )}
                description={`Original model price: ${formatCurrency(
                  recommendation.product_price,
                )}`}
                icon={Wallet}
                accent="bg-violet-50 text-violet-600"
              />

              <MetricCard
                title="Expected revenue"
                value={formatCurrency(
                  recommendation.expected_revenue,
                )}
                description="Model-estimated expected revenue for this product opportunity."
                icon={CircleDollarSign}
                accent="bg-amber-50 text-amber-600"
              />
            </div>
          </section>

          {/* PRICE COMPARISON */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              eyebrow="Price analysis"
              title="Original price vs discounted price"
              description="See how the recommended discount changes the product price."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Original price
                </p>

                <p className="mt-3 text-2xl font-bold text-slate-800">
                  {formatCurrency(recommendation.product_price)}
                </p>
              </div>

              <div className="flex items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>

                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    {formatCurrency(
                      recommendation.product_price -
                      recommendation.discounted_price,
                    )}{' '}
                    saved per unit
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    {formatPercentage(recommendation.discount_rate)} discount
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  Discounted price
                </p>

                <p className="mt-3 text-2xl font-bold text-indigo-900">
                  {formatCurrency(recommendation.discounted_price)}
                </p>
              </div>
            </div>
          </section>

          {/* OFFER COMPARISON */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center sm:p-7">
              <SectionHeading
                eyebrow="Decision support"
                title="Compare available offers"
                description="Offers are ordered by the expected revenue calculated by your backend."
              />

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                <TrendingUp className="h-4 w-4" />
                Revenue-based ranking
              </div>
            </div>

            {offers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Offer
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Discount
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Response factor
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Purchase probability
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Discounted price
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Expected revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {offers.map((offer, index) => {
                      const isRecommended =
                        offer.offer === recommendation.recommended_offer

                      return (
                        <tr
                          key={`${offer.offer}-${index}`}
                          className={
                            isRecommended
                              ? 'bg-emerald-50/60'
                              : 'transition hover:bg-slate-50'
                          }
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  isRecommended
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isRecommended ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <BadgePercent className="h-5 w-5" />
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {offer.offer}
                                </p>

                                {isRecommended && (
                                  <span className="mt-1 inline-block text-xs font-semibold text-emerald-700">
                                    Recommended
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-700">
                            {formatPercentage(offer.discount_rate)}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {offer.response_factor.toFixed(2)}×
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800">
                              {formatPercentage(
                                offer.estimated_purchase_probability,
                              )}
                            </div>

                            <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      offer.estimated_purchase_probability * 100,
                                    ),
                                  )}%`,
                                }}
                              />
                            </div>
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-700">
                            {formatCurrency(offer.discounted_price)}
                          </td>

                          <td className="px-5 py-4 font-bold text-slate-900">
                            {formatCurrency(offer.expected_revenue)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-t border-slate-100 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No offer scenarios were returned for this selection.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3 border-t border-slate-100 bg-slate-50 p-5">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

              <p className="text-xs leading-5 text-slate-500">
                These are model estimates, not guaranteed sales or actual
                revenue. The expected revenue calculation in the current
                backend is estimated purchase probability multiplied by
                discounted product price.
              </p>
            </div>
          </section>

          {/* FOOTER */}

          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Brain className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  RetailIQ Promotion Engine
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Existing ML model · Customer segmentation · Offer comparison
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setRecommendation(null)
                setOffers([])
                setAnalysisError('')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              New analysis
            </button>
          </div>

          {bestOffer && (
            <p className="text-center text-xs text-slate-400">
              Highest expected revenue among the returned offer scenarios:{' '}
              {bestOffer.offer}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PromotionIntelligencePage