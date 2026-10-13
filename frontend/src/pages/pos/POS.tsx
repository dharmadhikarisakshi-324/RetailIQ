import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  ReceiptText,
  LoaderCircle,
} from "lucide-react";

import {
  createOrder,
  createPayment,
  getCustomers,
  getProducts,
} from "../../services/posService";
import type {
  CartItem,
  Customer,
  Product,
  ReceiptData,
} from "../../types/pos";
import ReceiptModal from "../../components/pos/ReceiptModal";
const money = (amount: number) =>
  `₹${amount.toFixed(2)}`;

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] =
    useState("");

  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [productData, customerData] =
          await Promise.all([
            getProducts(),
            getCustomers(),
          ]);

        if (cancelled) return;

        setProducts(productData);
        setCustomers(customerData);
      } catch (err) {
        if (cancelled) return;

        setError(
          "Unable to load products or customers. Please check your login and API connection.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.product_code,
        product.barcode ?? "",
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [products, search]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + item.product.price * item.quantity,
        0,
      ),
    [cart],
  );

  const discount = useMemo(
    () => subtotal * (discountPercent / 100),
    [subtotal, discountPercent],
  );

  const total = Math.max(0, subtotal - discount);

  function addToCart(product: Product) {
    setError("");
    setSuccess("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id,
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(
    productId: number,
    change: number,
  ) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: item.quantity + change,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: number) {
    setCart((current) =>
      current.filter(
        (item) => item.product.id !== productId,
      ),
    );
  }

  function clearCart() {
    setCart([]);
    setDiscountPercent(0);
    setSelectedCustomerId("");
    setSuccess("");
    setError("");
  }

  async function checkout() {
    if (checkingOut) return;

    if (cart.length === 0) {
      setError("Add at least one product to the cart.");
      return;
    }

    if (total <= 0) {
      setError("The bill total must be greater than zero.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm checkout for ${money(total)}?`,
    );

    if (!confirmed) return;

    setCheckingOut(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Step 1: Create the order.
       *
       * The backend calculates the total from database
       * product prices. Do not trust a client-submitted total.
       *
       * IMPORTANT:
       * This payload must match your existing OrderCreate
       * Pydantic schema. If that schema uses "product_id"
       * and "quantity", this payload is compatible.
       */
      const order = await createOrder({
        customer_id: selectedCustomerId
          ? Number(selectedCustomerId)
          : null,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      /*
       * Step 2: Record payment.
       *
       * This is a payment record, not a real card transaction.
       * No external payment gateway is connected here.
       */
      const payment = await createPayment({
        order_id: order.id,
        amount: Number(order.total_amount),
        payment_method: paymentMethod,
        status: "completed",
      });

      const customer = customers.find(
        (item) =>
          item.id === Number(selectedCustomerId),
      );

      setReceipt({
        order,
        customer: customer ?? null,
        items: cart.map((item) => ({ ...item })),
        subtotal,
        discount,
        total: Number(order.total_amount),
        paymentMethod,
        payment,
      });

      setSuccess("Order and payment recorded successfully.");
    } catch (err: unknown) {
      /*
       * If order creation succeeded but payment creation
       * failed, the order may already exist. Do not retry
       * blindly, or you could create a duplicate order.
       */
      const message =
        err &&
        typeof err === "object" &&
        "response" in err
          ? (
              err as {
                response?: {
                  data?: {
                    detail?: string;
                  };
                };
              }
            ).response?.data?.detail
          : undefined;

      setError(
        message ??
          "Checkout could not be completed. Check whether an order was created before retrying.",
      );
    } finally {
      setCheckingOut(false);
    }
  }

  function startNewBill() {
    setReceipt(null);
    clearCart();
    setSearch("");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">
              RETAILIQ · RETAIL OPERATIONS
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              POS & Billing
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Select products, prepare a bill and complete checkout.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-3">
            <ShoppingCart className="text-blue-600" />

            <span className="font-semibold">
              {cart.reduce(
                (count, item) => count + item.quantity,
                0,
              )}{" "}
              items
            </span>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && !receipt && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {/* PRODUCT CATALOG */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Select products
              </h2>

              <span className="text-sm text-slate-500">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="relative mb-5">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by product name, code or barcode..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
                <LoaderCircle className="animate-spin" />
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-slate-500">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => {
                  const inCart = cart.find(
                    (item) =>
                      item.product.id === product.id,
                  );

                  return (
                    <article
                      key={product.id}
                      className="flex flex-col rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-slate-100 text-3xl font-bold text-blue-600">
                        {product.name
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <h3 className="line-clamp-2 font-semibold text-slate-900">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Code: {product.product_code}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <span className="text-lg font-bold text-slate-900">
                          {money(Number(product.price))}
                        </span>

                        <button
                          onClick={() => addToCart(product)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {inCart ? "Add another" : "Add"}
                        </button>
                      </div>

                      {inCart && (
                        <p className="mt-2 text-xs text-green-700">
                          {inCart.quantity} in cart
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* CART AND BILLING */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 xl:sticky xl:top-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <ShoppingCart className="text-blue-600" />
                Current bill
              </h2>

              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-sm font-medium text-red-600 disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Customer
            </label>

            <select
              value={selectedCustomerId}
              onChange={(event) =>
                setSelectedCustomerId(event.target.value)
              }
              className="mb-5 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-blue-500"
            >
              <option value="">
                Walk-in customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name}
                  {customer.phone
                    ? ` — ${customer.phone}`
                    : ""}
                </option>
              ))}
            </select>

            <div className="max-h-[360px] space-y-4 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                  <ShoppingCart
                    className="mx-auto mb-3 text-slate-300"
                    size={34}
                  />

                  <p className="font-medium text-slate-700">
                    Your cart is empty
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add products to prepare a bill.
                  </p>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="border-b border-slate-100 pb-4"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800">
                          {product.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {money(Number(product.price))} each
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(product.id)
                        }
                        aria-label={`Remove ${product.name}`}
                        className="h-fit rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            changeQuantity(product.id, -1)
                          }
                          aria-label="Decrease quantity"
                          className="rounded-lg border p-2 hover:bg-slate-50"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-5 text-center font-semibold">
                          {quantity}
                        </span>

                        <button
                          onClick={() =>
                            changeQuantity(product.id, 1)
                          }
                          aria-label="Increase quantity"
                          className="rounded-lg border p-2 hover:bg-slate-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="font-semibold">
                        {money(
                          Number(product.price) * quantity,
                        )}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Discount (%)
              </label>

              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={discountPercent}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setDiscountPercent(
                    Math.min(100, Math.max(0, value || 0)),
                  );
                }}
                className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
              />

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
                className="mb-5 w-full rounded-lg border border-slate-200 px-3 py-3"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span>{money(subtotal)}</span>
                </div>

                <div className="flex justify-between text-green-700">
                  <span>Discount</span>

                  <span>−{money(discount)}</span>
                </div>

                <div className="flex justify-between border-t pt-4 text-xl font-bold text-slate-900">
                  <span>Total</span>

                  <span>{money(total)}</span>
                </div>
              </div>

              <button
                onClick={() => void checkout()}
                disabled={
                  checkingOut ||
                  loading ||
                  cart.length === 0
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingOut ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Proceed to checkout
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                Confirm the items and total before completing the bill.
              </p>
            </div>
          </aside>
        </div>

        {receipt && (
          <ReceiptModal
            receipt={receipt}
            onClose={() => setReceipt(null)}
            onNewBill={startNewBill}
          />
        )}

        {!receipt && success && (
          <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
            <ReceiptText size={18} />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}