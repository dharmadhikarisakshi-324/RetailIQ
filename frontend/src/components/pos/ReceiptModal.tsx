import type { ReceiptData } from "../../types/pos";

interface ReceiptModalProps {
  receipt: ReceiptData;
  onNewBill: () => void;
  onClose: () => void;
}

export default function ReceiptModal({
  receipt,
  onNewBill,
  onClose,
}: ReceiptModalProps) {
  const date = new Date(
    receipt.order.created_at ?? Date.now(),
  );

  function printReceipt() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Bill generated successfully
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Order #{receipt.order.order_number}
          </p>
        </div>

        <div className="my-6 border-y border-dashed border-gray-300 py-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Date</span>
            <span>{date.toLocaleString()}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-500">Customer</span>
            <span>{receipt.customer?.name ?? "Walk-in customer"}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-500">Payment method</span>
            <span>{receipt.paymentMethod}</span>
          </div>
        </div>

        <div className="space-y-3">
          {receipt.items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex justify-between gap-4 text-sm"
            >
              <div>
                <p className="font-medium text-gray-800">
                  {product.name}
                </p>
                <p className="text-gray-500">
                  {quantity} × ₹{product.price.toFixed(2)}
                </p>
              </div>

              <span className="font-medium">
                ₹{(product.price * quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{receipt.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>−₹{receipt.discount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold">
            <span>Total paid</span>
            <span>₹{receipt.total.toFixed(2)}</span>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Thank you for shopping with RetailIQ!
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={printReceipt}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50"
          >
            Print receipt
          </button>

          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium hover:bg-gray-50"
          >
            Close
          </button>

          <button
            onClick={onNewBill}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Create new bill
          </button>
        </div>
      </div>
    </div>
  );
}