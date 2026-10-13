import { useEffect, useMemo, useState } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
  CreditCard,
} from 'lucide-react'

import { getProducts } from '../../api/products'
import type { Product } from '../../api/products'

import { createOrder } from '../../api/orders'
import type { Order } from '../../api/orders'

import {
  checkoutPayment,
  getPaymentStatusLabel,
} from '../../api/payments'

import type {
  Payment,
  PaymentMethod,
} from '../../api/payments'

import { getRecommendations } from '../../api/recommendations'
import type { RecommendedProduct } from '../../api/recommendations'

import Button from '../../components/ui/Button'

// ============================================================
// TYPES
// ============================================================

interface CartItem {
  product: Product
  quantity: number
}

interface OrderConfirmation {
  order: Order
  payment: Payment | null
  paymentError: string
}

interface PendingShoppingListItem {
  product_id: number
  quantity: number
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function normalizeCode(
  code: string | number | null | undefined,
): string {
  return String(code ?? '').trim().toUpperCase()
}

function normalizeName(
  name: string | null | undefined,
): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const apiError = error as {
      response?: {
        status?: number
        data?: {
          detail?: string | Array<{ msg?: string }>
        }
      }
    }

    const detail = apiError.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg ?? 'Invalid request')
        .join(', ')
    }

    if (apiError.response?.status === 401) {
      return 'Your session has expired. Please log in again.'
    }

    if (apiError.response?.status === 409) {
      return (
        typeof detail === 'string'
          ? detail
          : 'A payment record already exists for this order.'
      )
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to complete your request. Please try again.'
}

// ============================================================
// SHOP PAGE
// ============================================================

export default function ShopPage() {
  // ----------------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------------

  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productError, setProductError] = useState('')

  // ----------------------------------------------------------
  // AI RECOMMENDATIONS
  // ----------------------------------------------------------

  const [recommendations, setRecommendations] = useState<
    RecommendedProduct[]
  >([])

  const [recommendationMessage, setRecommendationMessage] =
    useState('')

  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true)

  const [recommendationError, setRecommendationError] = useState('')

  // ----------------------------------------------------------
  // SEARCH AND FILTERS
  // ----------------------------------------------------------

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // ----------------------------------------------------------
  // CART
  // ----------------------------------------------------------

  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')

  // ----------------------------------------------------------
  // PAYMENT METHOD
  // ----------------------------------------------------------

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash')

  // ----------------------------------------------------------
  // CHECKOUT
  // ----------------------------------------------------------

  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const [confirmation, setConfirmation] =
    useState<OrderConfirmation | null>(null)

  // ----------------------------------------------------------
  // LOAD ACTIVE PRODUCTS
  // ----------------------------------------------------------

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        setIsLoadingProducts(true)
        setProductError('')

        const result = await getProducts()

        if (!isMounted) return

        setProducts(
          result.filter((product) => product.is_active),
        )
      } catch (error) {
        console.error('Failed to load products:', error)

        if (isMounted) {
          setProductError(
            'Unable to load products. Please check your connection and try again.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false)
        }
      }
    }

    void loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  // ----------------------------------------------------------
  // LOAD PERSONALIZED RECOMMENDATIONS
  // ----------------------------------------------------------

  useEffect(() => {
    let isMounted = true

    async function loadRecommendations() {
      try {
        setIsLoadingRecommendations(true)
        setRecommendationError('')

        const response = await getRecommendations(10)

        if (!isMounted) return

        setRecommendations(
          Array.isArray(response.products)
            ? response.products
            : [],
        )

        setRecommendationMessage(response.message ?? '')
      } catch (error) {
        console.error('Failed to load recommendations:', error)

        if (isMounted) {
          setRecommendationError(
            'Personalized recommendations are temporarily unavailable. You can still browse and buy products below.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecommendations(false)
        }
      }
    }

    void loadRecommendations()

    return () => {
      isMounted = false
    }
  }, [])

  // ----------------------------------------------------------
  // MATCH ML RECOMMENDATIONS TO DATABASE PRODUCTS
  // ----------------------------------------------------------

  const recommendedShopProducts = useMemo(() => {
    const productsByCode = new Map<string, Product>()
    const productsByName = new Map<string, Product>()

    for (const product of products) {
      const code = normalizeCode(product.product_code)
      const name = normalizeName(product.name)

      if (code && !productsByCode.has(code)) {
        productsByCode.set(code, product)
      }

      if (name && !productsByName.has(name)) {
        productsByName.set(name, product)
      }
    }

    const matchedProducts: Product[] = []
    const seenIds = new Set<number>()

    for (const recommendation of recommendations) {
      const recommendedCode = normalizeCode(
        recommendation.StockCode,
      )

      let matchedProduct = recommendedCode
        ? productsByCode.get(recommendedCode)
        : undefined

      if (!matchedProduct) {
        const recommendedName = normalizeName(
          recommendation.Description,
        )

        if (recommendedName) {
          matchedProduct = productsByName.get(recommendedName)
        }
      }

      if (
        matchedProduct &&
        matchedProduct.is_active &&
        !seenIds.has(matchedProduct.id)
      ) {
        matchedProducts.push(matchedProduct)
        seenIds.add(matchedProduct.id)
      }
    }

    return matchedProducts
  }, [products, recommendations])

  // ----------------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------------

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category_id)
      .filter(
        (value): value is number =>
          value !== null && value !== undefined,
      )

    return [...new Set(values)].sort((a, b) => a - b)
  }, [products])

  // ----------------------------------------------------------
  // FILTER PRODUCTS
  // ----------------------------------------------------------

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query) ||
        (product.barcode ?? '').toLowerCase().includes(query)

      const matchesCategory =
        selectedCategory === 'all' ||
        String(product.category_id) === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory])

  // ----------------------------------------------------------
  // CART TOTALS
  // ----------------------------------------------------------

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.product.price) * item.quantity,
    0,
  )

  // ----------------------------------------------------------
  // ADD TO CART
  // ----------------------------------------------------------

  function addToCart(product: Product) {
    setCheckoutError('')
    setConfirmation(null)
    setCartMessage('')

    setCart((previousCart) => {
      const existing = previousCart.find(
        (item) => item.product.id === product.id,
      )

      if (existing) {
        return previousCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        )
      }

      return [
        ...previousCart,
        {
          product,
          quantity: 1,
        },
      ]
    })
  }

  // ----------------------------------------------------------
  // ADD SAVED SHOPPING LIST TO CART
  // ----------------------------------------------------------

  useEffect(() => {
    if (isLoadingProducts) return

    const storageKey = 'retailiq_pending_shopping_list'
    const pendingData = sessionStorage.getItem(storageKey)

    if (!pendingData) return

    let pendingItems: PendingShoppingListItem[]

    try {
      const parsed: unknown = JSON.parse(pendingData)

      if (!Array.isArray(parsed)) {
        throw new Error('Shopping list data must be an array.')
      }

      pendingItems = parsed.map((item: unknown) => {
        if (
          typeof item !== 'object' ||
          item === null ||
          !('product_id' in item) ||
          !('quantity' in item)
        ) {
          throw new Error('Invalid shopping list item.')
        }

        const productId = Number(item.product_id)
        const quantity = Number(item.quantity)

        if (
          !Number.isInteger(productId) ||
          productId <= 0 ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 10000
        ) {
          throw new Error('Invalid product ID or quantity.')
        }

        return {
          product_id: productId,
          quantity,
        }
      })
    } catch (error) {
      console.error('Invalid pending shopping list:', error)

      sessionStorage.removeItem(storageKey)

      setCartMessage(
        'The saved shopping list could not be read. Please return to My Shopping Lists and try again.',
      )

      return
    }

    if (productError) {
      setCartMessage(
        'Your saved list is waiting to be added. Please retry loading the product catalogue.',
      )

      return
    }

    const activeProductsById = new Map(
      products
        .filter((product) => product.is_active)
        .map((product) => [product.id, product]),
    )

    const quantitiesByProductId = new Map<number, number>()

    for (const item of pendingItems) {
      quantitiesByProductId.set(
        item.product_id,
        (quantitiesByProductId.get(item.product_id) ?? 0) +
          item.quantity,
      )
    }

    const matchedItems: CartItem[] = []
    let unavailableCount = 0

    for (const [productId, quantity] of quantitiesByProductId) {
      const product = activeProductsById.get(productId)

      if (!product) {
        unavailableCount += 1
        continue
      }

      matchedItems.push({
        product,
        quantity,
      })
    }

    sessionStorage.removeItem(storageKey)

    if (matchedItems.length === 0) {
      setCartMessage(
        'None of the saved products are currently available in the shop.',
      )

      return
    }

    setCart((previousCart) => {
      const nextCart = [...previousCart]

      for (const savedItem of matchedItems) {
        const existingIndex = nextCart.findIndex(
          (item) => item.product.id === savedItem.product.id,
        )

        if (existingIndex >= 0) {
          nextCart[existingIndex] = {
            ...nextCart[existingIndex],
            product: savedItem.product,
            quantity:
              nextCart[existingIndex].quantity +
              savedItem.quantity,
          }
        } else {
          nextCart.push(savedItem)
        }
      }

      return nextCart
    })

    setCheckoutError('')
    setConfirmation(null)
    setShowCart(true)

    setCartMessage(
      unavailableCount > 0
        ? `Added ${matchedItems.length} saved product(s) to your cart. ${unavailableCount} unavailable product(s) were skipped.`
        : `Successfully added ${matchedItems.length} saved product(s) to your cart.`,
    )
  }, [isLoadingProducts, productError, products])

  // ----------------------------------------------------------
  // UPDATE CART QUANTITY
  // ----------------------------------------------------------

  function updateQuantity(productId: number, change: number) {
    setCheckoutError('')
    setCartMessage('')

    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  // ----------------------------------------------------------
  // REMOVE CART ITEM
  // ----------------------------------------------------------

  function removeFromCart(productId: number) {
    setCheckoutError('')
    setCartMessage('')

    setCart((previousCart) =>
      previousCart.filter(
        (item) => item.product.id !== productId,
      ),
    )
  }

  // ============================================================
  // CREATE ORDER AND PAYMENT
  // ============================================================

  async function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.')
      return
    }

    if (isCheckingOut) return

    setIsCheckingOut(true)
    setCheckoutError('')

    let createdOrder: Order | null = null

    try {
      // STEP 1: Create the order.
      createdOrder = await createOrder({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      })

      // STEP 2: Create a pending payment record for this order.
      // The backend calculates the amount from the order total.
      try {
        const payment = await checkoutPayment({
          order_id: createdOrder.id,
          payment_method: paymentMethod,
        })

        // Clear the cart only after the order has been created.
        setCart([])
        setShowCart(false)
        setCartMessage('')

        setConfirmation({
          order: createdOrder,
          payment,
          paymentError: '',
        })
      } catch (paymentError: unknown) {
        console.error(
          'Order created, but payment record creation failed:',
          paymentError,
        )

        // The order already exists. Do not retry createOrder here,
        // because that could create a duplicate order.
        setCart([])
        setShowCart(false)
        setCartMessage('')

        setConfirmation({
          order: createdOrder,
          payment: null,
          paymentError: getErrorMessage(paymentError),
        })
      }
    } catch (orderError: unknown) {
      console.error('Order creation failed:', orderError)

      if (createdOrder === null) {
        setCheckoutError(getErrorMessage(orderError))
      }
    } finally {
      setIsCheckingOut(false)
    }
  }

  // ============================================================
  // PRODUCT CARD
  // ============================================================

  function renderProductCard(
    product: Product,
    isRecommended = false,
  ) {
    const cartItem = cart.find(
      (item) => item.product.id === product.id,
    )

    return (
      <article
        key={product.id}
        className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Package size={52} className="text-blue-300" />

          {isRecommended && (
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles size={13} />
              Recommended
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {product.product_code}
            </span>

            {product.category_id != null && (
              <span className="text-xs text-gray-500">
                Category {product.category_id}
              </span>
            )}
          </div>

          <h3 className="line-clamp-2 min-h-12 font-semibold text-gray-900">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-500">
              {product.description}
            </p>
          )}

          <div className="mt-auto pt-5">
            <p className="mb-4 text-xl font-bold text-blue-700">
              {formatCurrency(Number(product.price))}
            </p>

            {cartItem ? (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, -1)}
                  className="rounded-lg p-2 text-blue-700 hover:bg-blue-100"
                  aria-label={`Decrease ${product.name} quantity`}
                >
                  <Minus size={17} />
                </button>

                <span className="font-semibold text-gray-900">
                  {cartItem.quantity} in cart
                </span>

                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  className="rounded-lg p-2 text-blue-700 hover:bg-blue-100"
                  aria-label={`Increase ${product.name} quantity`}
                >
                  <Plus size={17} />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => addToCart(product)}
                className="flex w-full items-center justify-center gap-2"
              >
                <ShoppingCart size={17} />
                Add to cart
              </Button>
            )}
          </div>
        </div>
      </article>
    )
  }

  // ============================================================
  // ORDER CONFIRMATION
  // ============================================================

  if (confirmation) {
    const { order, payment, paymentError } = confirmation

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={36} className="text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            Order placed successfully!
          </h1>

          <p className="mt-3 text-gray-600">
            Thank you for shopping with RetailIQ.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-xl bg-gray-50 p-6 text-left">
            <div className="flex justify-between gap-4 border-b border-gray-200 pb-4">
              <span className="text-gray-600">Order number</span>

              <span className="break-all text-right font-bold text-gray-900">
                {order.order_number}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b border-gray-200 py-4">
              <span className="text-gray-600">Order status</span>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium capitalize text-yellow-800">
                {order.status}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b border-gray-200 py-4">
              <span className="text-gray-600">Payment method</span>

              <span className="font-medium capitalize text-gray-900">
                {payment?.payment_method ?? paymentMethod}
              </span>
            </div>

            <div className="flex justify-between gap-4 border-b border-gray-200 py-4">
              <span className="text-gray-600">Payment status</span>

              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  payment?.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : payment
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {payment
                  ? getPaymentStatusLabel(payment)
                  : 'Not recorded'}
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <span className="text-gray-600">Total amount</span>

              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(Number(order.total_amount))}
              </span>
            </div>
          </div>

          {paymentError && (
            <div
              role="alert"
              className="mx-auto mt-5 flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-800"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Your order was created, but payment setup failed.
                </p>

                <p className="mt-1">{paymentError}</p>

                <p className="mt-2">
                  Your order number is {order.order_number}. Check
                  My Orders before attempting another order.
                </p>
              </div>
            </div>
          )}

          {payment && payment.status === 'pending' && (
            <div
              role="status"
              className="mx-auto mt-5 max-w-md rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-left text-sm text-yellow-900"
            >
              <p className="font-semibold">
                Payment is pending.
              </p>

              <p className="mt-1">
                A payment record has been created. This does not
                confirm that money has been received.
              </p>

              {payment.payment_method === 'online' && (
                <p className="mt-2">
                  Online payment gateway integration is not enabled
                  yet.
                </p>
              )}
            </div>
          )}

          {payment && payment.status === 'paid' && (
            <div
              role="status"
              className="mx-auto mt-5 max-w-md rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm text-green-800"
            >
              Payment is confirmed as paid.
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              onClick={() => {
                setConfirmation(null)
                setCheckoutError('')
                setShowCart(false)
              }}
            >
              Continue shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // SHOP PAGE UI
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SHOP HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShoppingBag size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                RetailIQ Shop
              </h1>

              <p className="text-sm text-gray-500">
                Discover your everyday essentials
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2"
          >
            <ShoppingCart size={19} />
            <span>Cart</span>

            <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm">
              {cartCount}
            </span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* CART MESSAGE */}

        {cartMessage && (
          <div
            role="status"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"
          >
            <span>{cartMessage}</span>

            <button
              type="button"
              onClick={() => setCartMessage('')}
              className="font-bold"
              aria-label="Dismiss cart message"
            >
              ×
            </button>
          </div>
        )}

        {/* AI RECOMMENDATIONS */}

        <section className="mb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Sparkles size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Recommended for You
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {recommendationMessage ||
                    'Discover products recommended by our retail intelligence system.'}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
              AI RECOMMENDATIONS
            </span>
          </div>

          {isLoadingRecommendations && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-10">
              <Loader2
                size={25}
                className="animate-spin text-purple-600"
              />

              <p className="text-sm text-gray-500">
                Finding products for you...
              </p>
            </div>
          )}

          {!isLoadingRecommendations && recommendationError && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
            >
              <AlertCircle size={20} className="mt-0.5 shrink-0" />

              <p>{recommendationError}</p>
            </div>
          )}

          {!isLoadingRecommendations &&
            !recommendationError &&
            isLoadingProducts && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Loading the shop catalogue to match recommended products...
              </div>
            )}

          {!isLoadingRecommendations &&
            !recommendationError &&
            !isLoadingProducts &&
            recommendedShopProducts.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No recommended products could be matched to the active
                shop catalogue. You can still explore all available
                products below.
              </div>
            )}

          {!isLoadingRecommendations &&
            !recommendationError &&
            !isLoadingProducts &&
            recommendedShopProducts.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recommendedShopProducts.map((product) =>
                  renderProductCard(product, true),
                )}
              </div>
            )}
        </section>

        {/* SEARCH AND FILTERS */}

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product name, code or barcode..."
                className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>

              {categories.map((categoryId) => (
                <option key={categoryId} value={String(categoryId)}>
                  Category {categoryId}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              {filteredProducts.length} products available
            </p>

            <p className="text-sm text-gray-500">
              {cartCount} items in your cart
            </p>
          </div>
        </section>

        {/* PRODUCT ERROR */}

        {productError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-medium">Unable to load products</p>

              <p className="mt-1 text-sm">{productError}</p>

              <Button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* PRODUCT LOADING */}

        {isLoadingProducts && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-blue-600" />

            <p className="text-gray-500">Loading products...</p>
          </div>
        )}

        {/* EMPTY STATE */}

        {!isLoadingProducts &&
          !productError &&
          filteredProducts.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
              <Package size={44} className="mx-auto text-gray-300" />

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                No products found
              </h2>

              <p className="mt-2 text-gray-500">
                Try changing your search or category filter.
              </p>
            </div>
          )}

        {/* ALL PRODUCTS */}

        {!isLoadingProducts &&
          !productError &&
          filteredProducts.length > 0 && (
            <section>
              <h2 className="mb-5 text-2xl font-bold text-gray-900">
                Explore All Products
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) =>
                  renderProductCard(product),
                )}
              </div>
            </section>
          )}
      </main>

      {/* CART BACKDROP */}

      {showCart && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => {
            if (!isCheckingOut) {
              setShowCart(false)
            }
          }}
        />
      )}

      {/* CART DRAWER */}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          showCart ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
        aria-hidden={!showCart}
      >
        {/* CART HEADER */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Your Cart
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {cartCount} items
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCart(false)}
            disabled={isCheckingOut}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close cart"
          >
            <X size={22} />
          </button>
        </div>

        {/* CART ITEMS */}

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart size={48} className="text-gray-300" />

              <h3 className="mt-4 font-semibold text-gray-900">
                Your cart is empty
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add some products to continue shopping.
              </p>

              <Button
                type="button"
                onClick={() => setShowCart(false)}
                className="mt-5"
              >
                Continue shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {item.product.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {item.product.product_code}
                      </p>

                      <p className="mt-2 font-semibold text-blue-700">
                        {formatCurrency(Number(item.product.price))}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      disabled={isCheckingOut}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Remove ${item.product.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-1">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product.id, -1)
                        }
                        disabled={isCheckingOut}
                        className="rounded-md p-1.5 hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-5 text-center font-medium">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => addToCart(item.product)}
                        disabled={isCheckingOut}
                        className="rounded-md p-1.5 hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="font-semibold text-gray-900">
                      {formatCurrency(
                        Number(item.product.price) * item.quantity,
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CART FOOTER */}

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-5">
            {/* PAYMENT METHOD */}

            <div className="mb-4">
              <label
                htmlFor="payment-method"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Payment method
              </label>

              <div className="relative">
                <CreditCard
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value as PaymentMethod)
                  }
                  disabled={isCheckingOut}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  <option value="cash">Cash on delivery / cash</option>
                  <option value="online">
                    Online payment — gateway not connected
                  </option>
                </select>
              </div>

              {paymentMethod === 'online' && (
                <p className="mt-2 text-xs text-amber-700">
                  This option creates a pending payment record only.
                  No money will be collected through this demo.
                </p>
              )}
            </div>

            {/* CHECKOUT ERROR */}

            {checkoutError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />

                <span>{checkoutError}</span>
              </div>
            )}

            {/* TOTAL */}

            <div className="mb-3 flex items-center justify-between">
              <span className="text-gray-600">Estimated subtotal</span>

              <span className="font-semibold text-gray-900">
                {formatCurrency(cartTotal)}
              </span>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              The backend calculates the final order amount. Creating
              a payment record does not mean payment has been received.
            </p>

            {/* PLACE ORDER */}

            <Button
              type="button"
              onClick={() => void handleCheckout()}
              disabled={isCheckingOut || cart.length === 0}
              className="flex w-full items-center justify-center gap-2"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating order and payment...
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Place order
                </>
              )}
            </Button>
          </div>
        )}
      </aside>
    </div>
  )
}