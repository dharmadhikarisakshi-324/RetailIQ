import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

import {
  deleteProduct,
  getProducts,
  type Product,
} from '../../api/products'

import AddProductModal from './AddProductModal'
import EditProductModal from './EditProductModal'

// ============================================================
// PRODUCT IMAGE HELPER
// ============================================================

function getProductImage(productCode: string): string {
  const safeProductCode = encodeURIComponent(productCode.trim())

  return `/images/products/${safeProductCode}.jpg`
}

// ============================================================
// PRODUCT IMAGE COMPONENT
// ============================================================

function ProductImage({
  product,
}: {
  product: Product
}) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [product.product_code])

  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <Package className="h-6 w-6 text-slate-400" />

      {!imageFailed && (
        <img
          src={getProductImage(product.product_code)}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full bg-white object-contain"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  )
}

// ============================================================
// PRODUCTS PAGE
// ============================================================

function ProductsPage() {
  // ==========================================================
  // PRODUCTS
  // ==========================================================

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ==========================================================
  // ADD PRODUCT
  // ==========================================================

  const [isAddProductOpen, setIsAddProductOpen] = useState(false)

  // ==========================================================
  // EDIT PRODUCT
  // ==========================================================

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // ==========================================================
  // DELETE PRODUCT
  // ==========================================================

  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getProducts()
      setProducts(data)
    } catch (err: any) {
      console.error('Failed to load products:', err)

      const detail = err?.response?.data?.detail

      if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('Unable to load products. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void loadProducts()
  }, [])

  // ==========================================================
  // SEARCH
  // ==========================================================

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return products
    }

    return products.filter(
      (product) =>
        product.product_code.toLowerCase().includes(search) ||
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.barcode?.toLowerCase().includes(search) ||
        product.supplier?.toLowerCase().includes(search),
    )
  }, [products, searchTerm])

  // ==========================================================
  // OPEN DELETE CONFIRMATION
  // ==========================================================

  const handleDeleteClick = (product: Product) => {
    setDeleteSuccess(false)
    setProductToDelete(product)
  }

  // ==========================================================
  // CANCEL DELETE
  // ==========================================================

  const handleCancelDelete = () => {
    if (deletingProductId !== null) {
      return
    }

    setProductToDelete(null)
  }

  // ==========================================================
  // CONFIRM DELETE
  // ==========================================================

  const handleConfirmDelete = async () => {
    if (!productToDelete) {
      return
    }

    try {
      setDeletingProductId(productToDelete.id)
      setError(null)
      setDeleteSuccess(false)

      await deleteProduct(productToDelete.id)

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== productToDelete.id,
        ),
      )

      setDeleteSuccess(true)
      setProductToDelete(null)

      window.setTimeout(() => {
        setDeleteSuccess(false)
      }, 3000)
    } catch (err: any) {
      console.error('Failed to delete product:', err)

      const detail = err?.response?.data?.detail

      if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('Unable to delete product. Please try again.')
      }
    } finally {
      setDeletingProductId(null)
    }
  }

  // ==========================================================
  // LOADING SKELETON
  // ==========================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />

          <div className="mt-6 space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Products
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your retail product catalog
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {deleteSuccess && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Product deleted successfully.</span>
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">{error}</div>

            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-red-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* PRODUCTS CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* SEARCH BAR */}

          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products by name, code, barcode, supplier..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-700">
                {filteredProducts.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-700">
                {products.length}
              </span>{' '}
              products
            </div>
          </div>

          {/* EMPTY STATE */}

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Package className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800">
                No products found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {searchTerm
                  ? 'Try changing your search term.'
                  : 'Add your first product to get started.'}
              </p>
            </div>
          ) : (
            /* PRODUCTS TABLE */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Code
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Price
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Supplier
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                    >
                      {/* PRODUCT IMAGE AND DETAILS */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <ProductImage product={product} />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {product.name}
                            </p>

                            {product.description && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* CODE */}

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {product.product_code}
                          </p>

                          {product.barcode && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {product.barcode}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-slate-800">
                          ₹{Number(product.price).toFixed(2)}
                        </span>
                      </td>

                      {/* LOCATION */}

                      <td className="px-5 py-4">
                        {product.aisle || product.shelf ? (
                          <div>
                            <p className="text-sm text-slate-700">
                              {product.aisle
                                ? `Aisle ${product.aisle}`
                                : '—'}
                            </p>

                            {product.shelf && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                Shelf {product.shelf}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* SUPPLIER */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">
                          {product.supplier || '—'}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {product.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product)}
                            disabled={deletingProductId === product.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />

                            {deletingProductId === product.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}

      {isAddProductOpen && (
        <AddProductModal
          onClose={() => setIsAddProductOpen(false)}
          onProductCreated={loadProducts}
        />
      )}

      {/* EDIT PRODUCT MODAL */}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={loadProducts}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}

      {productToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCancelDelete()
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Delete Product
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deletingProductId !== null}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close delete confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                Are you sure you want to delete this product?
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  {productToDelete.name}
                </p>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">
                    Product Code:{' '}
                    <span className="font-medium text-slate-700">
                      {productToDelete.product_code}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    Product ID:{' '}
                    <span className="font-medium text-slate-700">
                      {productToDelete.id}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    Price:{' '}
                    <span className="font-medium text-slate-700">
                      ₹{Number(productToDelete.price).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deletingProductId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingProductId !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />

                {deletingProductId !== null
                  ? 'Deleting...'
                  : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductsPage