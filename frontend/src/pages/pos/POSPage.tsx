import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { BrowserMultiFormatReader } from '@zxing/browser'

import {
  AlertCircle,
  Banknote,
  Camera,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  ReceiptIndianRupee,
  ScanBarcode,
  Smartphone,
  Trash2,
  UserRound,
  X,
  Printer,
  RotateCcw,
} from 'lucide-react'

import {
  createPOSOrder,
  createPOSPayment,
  getPOSCustomers,
  getPOSProducts,
  type POSCartItem,
  type POSCustomer,
  type POSProduct,
} from '../../api/pos'

// ============================================================
// TYPES
// ============================================================

type PaymentMethod = 'cash' | 'upi' | 'card'

type ScannerStatus = 'ready' | 'scanned' | 'not-found'

type CameraScannerStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'error'

interface ScannerControlsLike {
  stop: () => void
}

interface CompletedSale {
  orderNumber: string
  orderId: number
  customer: POSCustomer | null
  items: POSCartItem[]
  subtotal: number
  total: number
  paymentMethod: PaymentMethod
  completedAt: string
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeBarcode(value: string) {
  return value.trim().toLowerCase()
}

// ============================================================
// COMPONENT
// ============================================================

export default function POSPage() {
  // ==========================================================
  // DATA
  // ==========================================================

  const [products, setProducts] = useState<POSProduct[]>([])
  const [customers, setCustomers] = useState<POSCustomer[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ==========================================================
  // CART / SEARCH
  // ==========================================================

  const [cart, setCart] = useState<POSCartItem[]>([])
  const [search, setSearch] = useState('')

  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] =
    useState<POSCustomer | null>(null)

  const [showCustomers, setShowCustomers] = useState(false)

  // ==========================================================
  // SCANNER
  // ==========================================================

  const [scannerStatus, setScannerStatus] =
    useState<ScannerStatus>('ready')

  const [scannerMessage, setScannerMessage] = useState('')

  const [showCameraScanner, setShowCameraScanner] =
    useState(false)

  const [cameraScannerStatus, setCameraScannerStatus] =
    useState<CameraScannerStatus>('idle')

  const [scannerError, setScannerError] = useState('')

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  const [showCheckout, setShowCheckout] = useState(false)

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash')

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // ==========================================================
  // COMPLETED SALE
  // ==========================================================

  const [completedSale, setCompletedSale] =
    useState<CompletedSale | null>(null)

  // ==========================================================
  // REFS
  // ==========================================================

  const searchRef = useRef<HTMLInputElement>(null)

  const scannerVideoRef =
    useRef<HTMLVideoElement>(null)

  const scannerControlsRef =
    useRef<ScannerControlsLike | null>(null)

  const scannerReaderRef =
    useRef<BrowserMultiFormatReader | null>(null)

  // ==========================================================
  // LOAD PRODUCTS + CUSTOMERS
  // ==========================================================

  async function loadPOSData() {
    try {
      setLoading(true)
      setError('')

      const [productData, customerData] =
        await Promise.all([
          getPOSProducts(),
          getPOSCustomers(),
        ])

      setProducts(
        productData.filter((product) => product.is_active),
      )

      setCustomers(
        customerData.filter((customer) => customer.is_active),
      )
    } catch (loadError) {
      console.error('POS data loading error:', loadError)

      setError(
        'Unable to load POS products and customers. Please check that the backend is running.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPOSData()
  }, [])

  // ==========================================================
  // AUTO FOCUS SEARCH
  // ==========================================================

  useEffect(() => {
    if (
      !loading &&
      !completedSale &&
      !showCheckout &&
      !showCameraScanner
    ) {
      window.setTimeout(() => {
        searchRef.current?.focus()
      }, 100)
    }
  }, [
    loading,
    completedSale,
    showCheckout,
    showCameraScanner,
  ])

  // ==========================================================
  // FILTERED PRODUCTS
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return products.slice(0, 8)
    }

    return products
      .filter((product) => {
        return (
          product.name.toLowerCase().includes(value) ||
          product.product_code.toLowerCase().includes(value) ||
          (product.barcode ?? '')
            .toLowerCase()
            .includes(value)
        )
      })
      .slice(0, 8)
  }, [products, search])

  // ==========================================================
  // FILTERED CUSTOMERS
  // ==========================================================

  const filteredCustomers = useMemo(() => {
    const value = customerSearch.trim().toLowerCase()

    if (!value) {
      return customers.slice(0, 8)
    }

    return customers
      .filter((customer) => {
        return (
          customer.name.toLowerCase().includes(value) ||
          customer.customer_code
            .toLowerCase()
            .includes(value) ||
          (customer.phone ?? '')
            .toLowerCase()
            .includes(value) ||
          (customer.email ?? '')
            .toLowerCase()
            .includes(value)
        )
      })
      .slice(0, 8)
  }, [customers, customerSearch])

  // ==========================================================
  // CART CALCULATIONS
  // ==========================================================

  const itemCount = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0,
    )
  }, [cart])

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0,
    )
  }, [cart])

  const total = subtotal

  // ==========================================================
  // FIND PRODUCT BY BARCODE
  // ==========================================================

  function findProductByBarcode(
    barcode: string,
  ): POSProduct | undefined {
    const normalized = normalizeBarcode(barcode)

    return products.find((product) => {
      const productBarcode = product.barcode
        ? normalizeBarcode(product.barcode)
        : ''

      const productCode = normalizeBarcode(
        product.product_code,
      )

      return (
        productBarcode === normalized ||
        productCode === normalized
      )
    })
  }

  // ==========================================================
  // ADD PRODUCT TO CART
  // ==========================================================

  function addToCart(product: POSProduct) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product.id === product.id,
      )

      if (existing) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        )
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ]
    })

    setSearch('')

    setScannerStatus('scanned')

    setScannerMessage(
      `${product.name} added to cart.`,
    )

    window.setTimeout(() => {
      setScannerStatus('ready')
      setScannerMessage('')
    }, 2500)

    window.setTimeout(() => {
      searchRef.current?.focus()
    }, 50)
  }

  // ==========================================================
  // REMOVE PRODUCT
  // ==========================================================

  function removeFromCart(productId: number) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.product.id !== productId,
      ),
    )
  }

  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  function updateQuantity(
    productId: number,
    quantity: number,
  ) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    )
  }

  // ==========================================================
  // CLEAR CART
  // ==========================================================

  function clearCart() {
    setCart([])
    setSelectedCustomer(null)
    setCustomerSearch('')
    setSearch('')
    setScannerMessage('')
    setScannerError('')
    setScannerStatus('ready')

    window.setTimeout(() => {
      searchRef.current?.focus()
    }, 50)
  }

  // ==========================================================
  // PRODUCT SEARCH ENTER
  // ==========================================================

  function handleProductSearchKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== 'Enter') {
      return
    }

    const value = search.trim()

    if (!value) {
      return
    }

    // First try exact barcode/product code.
    const barcodeProduct =
      findProductByBarcode(value)

    if (barcodeProduct) {
      addToCart(barcodeProduct)
      return
    }

    // Then if exactly one product is matched,
    // add that product.
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0])
      return
    }

    setScannerStatus('not-found')
    setScannerMessage(
      `No exact product found for "${value}".`,
    )

    window.setTimeout(() => {
      setScannerStatus('ready')
      setScannerMessage('')
    }, 2500)
  }

  // ==========================================================
  // USB / BLUETOOTH BARCODE SCANNER
  // ==========================================================

  function handleFallbackBarcode(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== 'Enter') {
      return
    }

    const value = search.trim()

    if (!value) {
      return
    }

    const product = findProductByBarcode(value)

    if (!product) {
      setScannerStatus('not-found')

      setScannerMessage(
        `Barcode "${value}" was not found.`,
      )

      window.setTimeout(() => {
        setScannerStatus('ready')
        setScannerMessage('')
      }, 3000)

      return
    }

    addToCart(product)
  }

  // ==========================================================
  // CAMERA SCANNER CLEANUP
  // ==========================================================

  function stopCameraScanner() {
    scannerControlsRef.current?.stop()

    scannerControlsRef.current = null
    scannerReaderRef.current = null

    if (scannerVideoRef.current) {
      scannerVideoRef.current.pause()
      scannerVideoRef.current.srcObject = null
    }
  }

  // ==========================================================
  // ZXING CAMERA SCANNER
  // ==========================================================

  useEffect(() => {
    if (!showCameraScanner) {
      stopCameraScanner()

      setCameraScannerStatus('idle')

      return
    }

    let cancelled = false

    async function startZXingScanner() {
      setCameraScannerStatus('starting')
      setScannerError('')

      try {
        const video = scannerVideoRef.current

        if (!video) {
          throw new Error(
            'Scanner video element is unavailable.',
          )
        }

        const reader = new BrowserMultiFormatReader()

        scannerReaderRef.current = reader

        const controls =
          await reader.decodeFromConstraints(
            {
              video: {
                facingMode: {
                  ideal: 'environment',
                },
              },
              audio: false,
            },
            video,
            (result, _error) => {
              if (cancelled || !result) {
                return
              }

              const rawValue =
                result.getText().trim()

              if (!rawValue) {
                return
              }

              console.log(
                'Barcode detected:',
                rawValue,
              )

              const product =
                findProductByBarcode(rawValue)

              if (!product) {
                controls.stop()

                scannerControlsRef.current = null

                setCameraScannerStatus('error')

                setScannerError(
                  `Barcode "${rawValue}" was detected, but no matching product was found.`,
                )

                return
              }

              // Product found.
              addToCart(product)

              setScannerMessage(
                `Scanned: ${rawValue} • ${product.name}`,
              )

              setCameraScannerStatus('idle')

              controls.stop()

              scannerControlsRef.current = null

              setShowCameraScanner(false)
            },
          )

        if (cancelled) {
          controls.stop()
          return
        }

        scannerControlsRef.current = controls

        setCameraScannerStatus('scanning')
      } catch (cameraError) {
        console.error(
          'ZXing camera scanner error:',
          cameraError,
        )

        if (cancelled) {
          return
        }

        setCameraScannerStatus('error')

        if (
          cameraError instanceof DOMException
        ) {
          if (
            cameraError.name ===
            'NotAllowedError'
          ) {
            setScannerError(
              'Camera permission was denied. Allow camera access in your browser and try again.',
            )
          } else if (
            cameraError.name ===
            'NotFoundError'
          ) {
            setScannerError(
              'No camera was found on this device.',
            )
          } else {
            setScannerError(
              'Unable to start the camera scanner.',
            )
          }
        } else {
          setScannerError(
            'Unable to start the camera scanner. You can still use the barcode input below.',
          )
        }
      }
    }

    void startZXingScanner()

    return () => {
      cancelled = true

      scannerControlsRef.current?.stop()

      scannerControlsRef.current = null
      scannerReaderRef.current = null

      if (scannerVideoRef.current) {
        scannerVideoRef.current.pause()
        scannerVideoRef.current.srcObject = null
      }
    }
  }, [showCameraScanner, products])

  // ==========================================================
  // OPEN CAMERA
  // ==========================================================

  function openCameraScanner() {
    setScannerError('')
    setCameraScannerStatus('starting')
    setShowCameraScanner(true)
  }

  // ==========================================================
  // CLOSE CAMERA
  // ==========================================================

  function closeCameraScanner() {
    stopCameraScanner()

    setShowCameraScanner(false)

    setCameraScannerStatus('idle')
    setScannerError('')
  }

  // ==========================================================
  // RESTART CAMERA
  // ==========================================================

  function restartCameraScanner() {
    stopCameraScanner()

    setScannerError('')
    setCameraScannerStatus('starting')

    setShowCameraScanner(false)

    window.setTimeout(() => {
      setShowCameraScanner(true)
    }, 150)
  }

  // ==========================================================
  // CUSTOMER SELECT
  // ==========================================================

  function selectCustomer(
    customer: POSCustomer,
  ) {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomers(false)
  }

  // ==========================================================
  // REMOVE CUSTOMER
  // ==========================================================

  function clearCustomer() {
    setSelectedCustomer(null)
    setCustomerSearch('')
  }

  // ==========================================================
  // START NEW SALE
  // ==========================================================

  function startNewSale() {
    setCompletedSale(null)
    setShowCheckout(false)
    setPaymentMethod('cash')

    clearCart()

    setTimeout(() => {
      searchRef.current?.focus()
    }, 100)
  }

  // ==========================================================
  // PRINT RECEIPT
  // ==========================================================

  function printReceipt() {
    window.print()
  }

  // ==========================================================
  // COMPLETE SALE
  // ==========================================================

  async function completeSale() {
    if (cart.length === 0) {
      setError(
        'Please add at least one product before checkout.',
      )
      return
    }

    try {
      setCheckoutLoading(true)
      setError('')

      // ------------------------------------------------------
      // 1. CREATE ORDER
      // ------------------------------------------------------

      const order = await createPOSOrder({
        customer_id:
          selectedCustomer?.id ?? null,

        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),

        status: 'pending',
      })

      // ------------------------------------------------------
      // 2. CREATE PAYMENT
      // ------------------------------------------------------

      await createPOSPayment({
        order_id: order.id,

        payment_method: paymentMethod,

        amount: Number(
          order.total_amount.toFixed(2),
        ),

        transaction_reference: null,

        status: 'completed',
      })

      // ------------------------------------------------------
      // 3. SAVE COMPLETED SALE FOR RECEIPT
      // ------------------------------------------------------

      setCompletedSale({
        orderNumber: order.order_number,
        orderId: order.id,
        customer: selectedCustomer,
        items: cart,
        subtotal,
        total: Number(
          order.total_amount.toFixed(2),
        ),
        paymentMethod,
        completedAt: new Date().toISOString(),
      })

      // ------------------------------------------------------
      // 4. RESET ACTIVE SALE
      // ------------------------------------------------------

      setCart([])
      setSelectedCustomer(null)
      setCustomerSearch('')
      setSearch('')
      setShowCheckout(false)
      setPaymentMethod('cash')
    } catch (checkoutError: any) {
      console.error(
        'Checkout error:',
        checkoutError,
      )

      const backendMessage =
        checkoutError?.response?.data?.detail

      if (Array.isArray(backendMessage)) {
        setError(
          backendMessage
            .map(
              (item: any) =>
                item?.msg ?? 'Validation error',
            )
            .join(', '),
        )
      } else if (
        typeof backendMessage === 'string'
      ) {
        setError(backendMessage)
      } else {
        setError(
          'Unable to complete the sale. Please try again.',
        )
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 h-20 animate-pulse rounded-3xl bg-white shadow-sm" />

          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-3xl bg-white" />

              <div className="h-[500px] animate-pulse rounded-3xl bg-white" />
            </div>

            <div className="h-[600px] animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================
  // COMPLETED SALE / RECEIPT SCREEN
  // ==========================================================

  if (completedSale) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:bg-white print:p-0">
        <div className="mx-auto max-w-3xl">
          {/* SUCCESS HEADER */}

          <div className="mb-6 rounded-3xl bg-white p-6 text-center shadow-sm print:hidden">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2
                className="h-9 w-9 text-emerald-600"
                strokeWidth={2.5}
              />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Sale Completed
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Order #{completedSale.orderNumber}
            </p>
          </div>

          {/* RECEIPT */}

          <div
            id="pos-receipt"
            className="rounded-3xl bg-white p-6 shadow-sm print:rounded-none print:p-8 print:shadow-none"
          >
            {/* RECEIPT HEADER */}

            <div className="border-b border-dashed border-slate-300 pb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
                <ReceiptIndianRupee className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                RetailIQ
              </h2>

              <p className="text-sm text-slate-500">
                AI-Powered Retail Intelligence
              </p>

              <div className="mt-4 text-sm text-slate-600">
                <p>
                  Order:{' '}
                  <span className="font-semibold text-slate-900">
                    #{completedSale.orderNumber}
                  </span>
                </p>

                <p className="mt-1">
                  {formatDateTime(
                    completedSale.completedAt,
                  )}
                </p>
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="border-b border-dashed border-slate-300 py-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Customer
              </p>

              {completedSale.customer ? (
                <div>
                  <p className="font-semibold text-slate-900">
                    {completedSale.customer.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {completedSale.customer.customer_code}
                  </p>

                  {completedSale.customer.phone && (
                    <p className="mt-1 text-sm text-slate-500">
                      {completedSale.customer.phone}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Walk-in Customer
                </p>
              )}
            </div>

            {/* ITEMS */}

            <div className="border-b border-dashed border-slate-300 py-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Items
              </p>

              <div className="space-y-4">
                {completedSale.items.map(
                  (item) => (
                    <div
                      key={item.product.id}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {item.product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.quantity} ×{' '}
                          {formatCurrency(
                            item.product.price,
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 font-semibold text-slate-900">
                        {formatCurrency(
                          item.product.price *
                            item.quantity,
                        )}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* TOTALS */}

            <div className="py-5">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>

                <span>
                  {formatCurrency(
                    completedSale.subtotal,
                  )}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <span>Tax</span>

                <span>
                  Included
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-lg font-bold text-slate-900">
                  Total
                </span>

                <span className="text-2xl font-bold text-slate-900">
                  {formatCurrency(
                    completedSale.total,
                  )}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Payment Method
                </span>

                <span className="font-semibold capitalize text-slate-900">
                  {completedSale.paymentMethod}
                </span>
              </div>
            </div>

            {/* FOOTER */}

            <div className="border-t border-dashed border-slate-300 pt-5 text-center">
              <p className="text-sm font-medium text-slate-700">
                Thank you for shopping with us!
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Powered by RetailIQ
              </p>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 print:hidden">
            <button
              type="button"
              onClick={printReceipt}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              <Printer className="h-5 w-5" />

              Print Receipt
            </button>

            <button
              type="button"
              onClick={startNewSale}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-5 w-5" />

              New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================
  // MAIN POS UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-6 rounded-3xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/10 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <ReceiptIndianRupee className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Retail Operations
                </p>

                <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                  Point of Sale
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Fast billing, barcode scanning and payments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-slate-400">
                  Items
                </p>

                <p className="mt-0.5 text-lg font-bold">
                  {itemCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs text-slate-400">
                  Current Bill
                </p>

                <p className="mt-0.5 text-lg font-bold">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ====================================================
            SCANNER MESSAGE
        ==================================================== */}

        {scannerMessage && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 ${
              scannerStatus === 'not-found'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {scannerStatus === 'not-found' ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}

            <p className="text-sm font-medium">
              {scannerMessage}
            </p>
          </div>
        )}

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <section className="min-w-0 space-y-5">
            {/* SEARCH */}

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Add Products
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Search by product, code or scan a barcode
                  </p>
                </div>

                <ScanBarcode className="h-5 w-5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <ScanBarcode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      handleProductSearchKeyDown(event)
                      handleFallbackBarcode(event)
                    }}
                    placeholder="Scan barcode or search product..."
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={openCameraScanner}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-800"
                >
                  <Camera className="h-5 w-5" />

                  <span>Camera Scan</span>
                </button>
              </div>

              {/* SEARCH RESULTS */}

              {search.trim() &&
                filteredProducts.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                    {filteredProducts.map(
                      (product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() =>
                            addToCart(product)
                          }
                          className="flex w-full items-center justify-between gap-4 border-b border-slate-100 p-4 text-left transition last:border-b-0 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {product.product_code}
                              {product.barcode
                                ? ` • ${product.barcode}`
                                : ''}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="font-bold text-slate-900">
                              {formatCurrency(
                                product.price,
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Add
                            </p>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}

              {search.trim() &&
                filteredProducts.length === 0 && (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-5 text-center">
                    <AlertCircle className="mx-auto h-6 w-6 text-slate-400" />

                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Product not found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Press Enter after checking the barcode or product code.
                    </p>
                  </div>
                )}
            </div>

            {/* CART */}

            <div className="rounded-3xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Current Cart
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {itemCount} item
                    {itemCount === 1 ? '' : 's'} in this sale
                  </p>
                </div>

                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />

                    Clear
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                    <ScanBarcode className="h-9 w-9 text-slate-400" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-800">
                    Your cart is empty
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Search for a product, scan a barcode, or use the camera scanner to start a sale.
                  </p>

                  <button
                    type="button"
                    onClick={openCameraScanner}
                    className="mt-5 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Camera className="h-4 w-4" />

                    Scan Product
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-5"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                          <ReceiptIndianRupee className="h-6 w-6 text-slate-500" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {item.product.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {item.product.product_code}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.product.id,
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <span className="w-10 text-center text-sm font-bold text-slate-900">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                  )
                                }
                                className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-400">
                                {formatCurrency(
                                  item.product.price,
                                )}{' '}
                                each
                              </p>

                              <p className="mt-1 font-bold text-slate-900">
                                {formatCurrency(
                                  item.product.price *
                                    item.quantity,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <aside className="space-y-5">
            {/* CUSTOMER */}

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Customer
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Attach a customer to this sale
                  </p>
                </div>

                <UserRound className="h-5 w-5 text-slate-400" />
              </div>

              {selectedCustomer ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-emerald-900">
                        {selectedCustomer.name}
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        {selectedCustomer.customer_code}
                      </p>

                      {selectedCustomer.phone && (
                        <p className="mt-1 text-xs text-emerald-700">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={clearCustomer}
                      className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      type="text"
                      value={customerSearch}
                      onFocus={() =>
                        setShowCustomers(true)
                      }
                      onChange={(event) => {
                        setCustomerSearch(
                          event.target.value,
                        )
                        setShowCustomers(true)
                      }}
                      placeholder="Search customer..."
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                    />
                  </div>

                  {showCustomers && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(
                          (customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() =>
                                selectCustomer(
                                  customer,
                                )
                              }
                              className="w-full border-b border-slate-100 p-3 text-left last:border-b-0 hover:bg-slate-50"
                            >
                              <p className="text-sm font-semibold text-slate-900">
                                {customer.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  customer.customer_code
                                }

                                {customer.phone
                                  ? ` • ${customer.phone}`
                                  : ''}
                              </p>
                            </button>
                          ),
                        )
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No customer found
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* BILL SUMMARY */}

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    Bill Summary
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Review before payment
                  </p>
                </div>

                <ReceiptIndianRupee className="h-5 w-5 text-slate-400" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Items</span>

                  <span className="font-semibold text-slate-900">
                    {itemCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>

                  <span className="font-semibold text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Tax</span>

                  <span className="font-semibold text-slate-900">
                    Included
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-600">
                      Total Payable
                    </span>

                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() =>
                  setShowCheckout(true)
                }
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CreditCard className="h-5 w-5" />

                Proceed to Payment
              </button>
            </div>

            {/* FAST BILLING */}

            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
              <p className="text-sm font-semibold">
                Fast Billing
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Barcode scanners automatically send the product code followed by Enter.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <ScanBarcode className="mx-auto h-5 w-5 text-slate-300" />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Barcode
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <Camera className="mx-auto h-5 w-5 text-slate-300" />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Camera
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-3 text-center">
                  <ReceiptIndianRupee className="mx-auto h-5 w-5 text-slate-300" />

                  <p className="mt-2 text-[11px] text-slate-400">
                    Receipt
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ======================================================
          CAMERA SCANNER MODAL
      ====================================================== */}

      {showCameraScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Camera Barcode Scanner
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Point the camera at a product barcode
                </p>
              </div>

              <button
                type="button"
                onClick={closeCameraScanner}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* CAMERA AREA */}

            <div className="relative aspect-video bg-slate-950">
              <video
                ref={scannerVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* SCANNING FRAME */}

              {cameraScannerStatus ===
                'scanning' && (
                <>
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-1/2 h-48 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />

                    <div className="absolute left-1/2 top-1/2 h-0.5 w-[72%] -translate-x-1/2 -translate-y-1/2 animate-pulse bg-emerald-400" />
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                    Scanning...
                  </div>
                </>
              )}

              {/* STARTING */}

              {cameraScannerStatus ===
                'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                  <div className="text-center text-white">
                    <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-white/20 border-t-white" />

                    <p className="mt-4 font-semibold">
                      Starting camera...
                    </p>

                    <p className="mt-1 text-xs text-slate-300">
                      Please allow camera access if prompted.
                    </p>
                  </div>
                </div>
              )}

              {/* ERROR */}

              {cameraScannerStatus ===
                'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-6">
                  <div className="max-w-sm text-center text-white">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
                      <AlertCircle className="h-7 w-7 text-amber-400" />
                    </div>

                    <h3 className="mt-4 text-lg font-bold">
                      Camera scanning unavailable
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {scannerError ||
                        'The camera could not be started. You can still use the barcode input below.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* MANUAL / USB INPUT */}

            <div className="p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <ScanBarcode className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      USB / Bluetooth Scanner
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      You can also close this window and scan directly into the product search field.
                    </p>
                  </div>
                </div>
              </div>

              {scannerError && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />

                    <p className="text-sm text-amber-800">
                      {scannerError}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTIONS */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={restartCameraScanner}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />

                  Restart Camera
                </button>

                <button
                  type="button"
                  onClick={closeCameraScanner}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />

                  Close Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          CHECKOUT MODAL
      ====================================================== */}

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  Complete Payment
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Select payment method and confirm sale
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCheckout(false)
                }
                disabled={checkoutLoading}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {/* TOTAL */}

              <div className="rounded-3xl bg-slate-900 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Amount
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight">
                  {formatCurrency(total)}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {itemCount} item
                  {itemCount === 1 ? '' : 's'}
                  {selectedCustomer
                    ? ` • ${selectedCustomer.name}`
                    : ' • Walk-in Customer'}
                </p>
              </div>

              {/* PAYMENT METHODS */}

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Payment Method
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* CASH */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod('cash')
                    }
                    disabled={checkoutLoading}
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <Banknote className="mx-auto h-6 w-6" />

                    <p className="mt-2 text-xs font-bold">
                      Cash
                    </p>
                  </button>

                  {/* UPI */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod('upi')
                    }
                    disabled={checkoutLoading}
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod === 'upi'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <Smartphone className="mx-auto h-6 w-6" />

                    <p className="mt-2 text-xs font-bold">
                      UPI
                    </p>
                  </button>

                  {/* CARD */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod('card')
                    }
                    disabled={checkoutLoading}
                    className={`rounded-2xl border p-3 transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <CreditCard className="mx-auto h-6 w-6" />

                    <p className="mt-2 text-xs font-bold">
                      Card
                    </p>
                  </button>
                </div>
              </div>

              {/* PAYMENT NOTE */}

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs leading-5 text-blue-700">
                  <span className="font-semibold">
                    Payment mode:
                  </span>{' '}
                  {paymentMethod.toUpperCase()} payment will be recorded against this order.
                </p>
              </div>

              {/* CONFIRM */}

              <button
                type="button"
                onClick={completeSale}
                disabled={checkoutLoading}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />

                    Confirm Payment
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowCheckout(false)
                }
                disabled={checkoutLoading}
                className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}