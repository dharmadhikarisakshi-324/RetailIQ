import { useState } from 'react'
import { X } from 'lucide-react'
import apiClient from '../../api/client'

interface AddProductModalProps {
  onClose: () => void
  onProductCreated: () => void
}

interface ProductForm {
  product_code: string
  barcode: string
  name: string
  description: string
  category_id: string
  price: string
  supplier: string
  aisle: string
  shelf: string
  is_active: boolean
}

export default function AddProductModal({
  onClose,
  onProductCreated,
}: AddProductModalProps) {
  const [form, setForm] = useState<ProductForm>({
    product_code: '',
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    price: '',
    supplier: '',
    aisle: '',
    shelf: '',
    is_active: true,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError('')

    if (!form.product_code.trim()) {
      setError('Product code is required.')
      return
    }

    if (!form.name.trim()) {
      setError('Product name is required.')
      return
    }

    if (!form.price || Number(form.price) < 0) {
      setError('Please enter a valid price.')
      return
    }

    createProduct()
  }

  async function createProduct() {
    try {
      setLoading(true)

      const payload = {
        product_code: form.product_code.trim(),
        barcode: form.barcode.trim() || null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        category_id: form.category_id
          ? Number(form.category_id)
          : null,
        price: Number(form.price),
        supplier: form.supplier.trim() || null,
        aisle: form.aisle.trim() || null,
        shelf: form.shelf.trim() || null,
        is_active: form.is_active,
      }

      await apiClient.post('/api/products', payload)

      onProductCreated()
      onClose()
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            'A product with this product code already exists.'
        )
      } else {
        setError(
          err.response?.data?.detail ||
            'Failed to create product. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Add Product
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a new product to your inventory
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Product Code + Barcode */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Product Code *
              </label>

              <input
                type="text"
                name="product_code"
                value={form.product_code}
                onChange={handleChange}
                placeholder="e.g. PROD001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Barcode
              </label>

              <input
                type="text"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="e.g. 890000001234"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* Product Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Product Name *
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Category ID
              </label>

              <input
                type="number"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Price *
              </label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* Supplier */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Supplier
            </label>

            <input
              type="text"
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              placeholder="Enter supplier name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Location */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Physical Location
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Aisle
                </label>

                <input
                  type="text"
                  name="aisle"
                  value={form.aisle}
                  onChange={handleChange}
                  placeholder="e.g. A2"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Shelf
                </label>

                <input
                  type="text"
                  name="shelf"
                  value={form.shelf}
                  onChange={handleChange}
                  placeholder="e.g. S3"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>
          </div>

          {/* Active */}
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            <span className="text-sm text-slate-700">
              Product is active
            </span>
          </label>

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>

          </div>

        </form>
      </div>
    </div>
  )
}