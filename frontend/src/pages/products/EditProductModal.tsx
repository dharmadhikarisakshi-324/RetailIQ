import { useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'

import type { Product } from '../../api/products'
import { updateProduct } from '../../api/products'

// ============================================================
// PROPS
// ============================================================

interface EditProductModalProps {
  product: Product
  onClose: () => void
  onProductUpdated: () => Promise<void> | void
}

// ============================================================
// COMPONENT
// ============================================================

function EditProductModal({
  product,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [productCode, setProductCode] =
    useState(product.product_code)

  const [barcode, setBarcode] =
    useState(product.barcode ?? '')

  const [name, setName] =
    useState(product.name)

  const [description, setDescription] =
    useState(product.description ?? '')

  const [categoryId, setCategoryId] =
    useState(
      product.category_id !== null
        ? String(product.category_id)
        : '',
    )

  const [price, setPrice] =
    useState(String(product.price))

  const [supplier, setSupplier] =
    useState(product.supplier ?? '')

  const [aisle, setAisle] =
    useState(product.aisle ?? '')

  const [shelf, setShelf] =
    useState(product.shelf ?? '')

  const [isActive, setIsActive] =
    useState(product.is_active)

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [isSaving, setIsSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState(false)

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError(null)
    setSuccess(false)

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    const trimmedCode =
      productCode.trim()

    const trimmedName =
      name.trim()

    const parsedPrice =
      Number(price)

    if (!trimmedCode) {
      setError(
        'Product code is required.',
      )
      return
    }

    if (!trimmedName) {
      setError(
        'Product name is required.',
      )
      return
    }

    if (
      !price.trim() ||
      Number.isNaN(parsedPrice) ||
      parsedPrice < 0
    ) {
      setError(
        'Please enter a valid price.',
      )
      return
    }

    // --------------------------------------------------------
    // UPDATE PRODUCT
    // --------------------------------------------------------

    try {
      setIsSaving(true)

      await updateProduct(
        product.id,
        {
          product_code: trimmedCode,

          barcode:
            barcode.trim() || null,

          name: trimmedName,

          description:
            description.trim() || null,

          category_id:
            categoryId.trim()
              ? Number(categoryId)
              : null,

          price: parsedPrice,

          supplier:
            supplier.trim() || null,

          aisle:
            aisle.trim() || null,

          shelf:
            shelf.trim() || null,

          is_active: isActive,
        },
      )

      setSuccess(true)

      await onProductUpdated()

      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err: any) {
      console.error(
        'Failed to update product:',
        err,
      )

      const detail =
        err?.response?.data?.detail

      if (
        typeof detail === 'string'
      ) {
        setError(detail)
      } else {
        setError(
          'Unable to update product. Please try again.',
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ==========================================================
  // INPUT STYLE
  // ==========================================================

  const inputClassName = `
    mt-1
    h-10
    w-full
    rounded-lg
    border
    border-slate-200
    bg-white
    px-3
    text-sm
    text-slate-700
    outline-none
    transition
    placeholder:text-slate-400
    focus:border-indigo-400
    focus:ring-2
    focus:ring-indigo-100
  `

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-900/50
        p-4
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >

        {/* ====================================================
            HEADER
        ===================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-slate-200
            px-6
            py-4
          "
        >
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Edit Product
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Update product information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-5 p-6">

            {/* ERROR */}

            {error && (
              <div
                className="
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-3
                  text-sm
                  text-red-700
                "
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-emerald-200
                  bg-emerald-50
                  p-3
                  text-sm
                  text-emerald-700
                "
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />

                <span>
                  Product updated successfully.
                </span>
              </div>
            )}

            {/* =================================================
                BASIC INFORMATION
            ================================================== */}

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Basic Information
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">

                {/* PRODUCT CODE */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Product Code *
                  </label>

                  <input
                    type="text"
                    value={productCode}
                    onChange={(event) =>
                      setProductCode(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* BARCODE */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Barcode
                  </label>

                  <input
                    type="text"
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* PRODUCT NAME */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Product Name *
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    rows={3}
                    className="
                      mt-1
                      w-full
                      resize-none
                      rounded-lg
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-slate-700
                      outline-none
                      transition
                      placeholder:text-slate-400
                      focus:border-indigo-400
                      focus:ring-2
                      focus:ring-indigo-100
                    "
                    disabled={isSaving}
                  />
                </div>

              </div>
            </div>

            {/* =================================================
                PRICING
            ================================================== */}

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Pricing & Category
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">

                {/* PRICE */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(event) =>
                      setPrice(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* CATEGORY ID */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Category ID
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

              </div>
            </div>

            {/* =================================================
                SUPPLIER & LOCATION
            ================================================== */}

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Supplier & Location
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">

                {/* SUPPLIER */}

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Supplier
                  </label>

                  <input
                    type="text"
                    value={supplier}
                    onChange={(event) =>
                      setSupplier(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* AISLE */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Aisle
                  </label>

                  <input
                    type="text"
                    value={aisle}
                    onChange={(event) =>
                      setAisle(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

                {/* SHELF */}

                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Shelf
                  </label>

                  <input
                    type="text"
                    value={shelf}
                    onChange={(event) =>
                      setShelf(
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                    disabled={isSaving}
                  />
                </div>

              </div>
            </div>

            {/* =================================================
                STATUS
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
              "
            >
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Product is active
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Active products are available in the catalog.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsActive(
                    (current) => !current,
                  )
                }
                disabled={isSaving}
                className={`
                  relative
                  h-6
                  w-11
                  rounded-full
                  transition
                  ${
                    isActive
                      ? 'bg-indigo-600'
                      : 'bg-slate-300'
                  }
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                `}
              >
                <span
                  className={`
                    absolute
                    top-0.5
                    h-5
                    w-5
                    rounded-full
                    bg-white
                    shadow
                    transition
                    ${
                      isActive
                        ? 'left-[22px]'
                        : 'left-0.5'
                    }
                  `}
                />
              </button>
            </div>

          </div>

          {/* ==================================================
              FOOTER
          =================================================== */}

          <div
            className="
              flex
              flex-col-reverse
              gap-3
              border-t
              border-slate-200
              bg-slate-50
              px-6
              py-4
              sm:flex-row
              sm:justify-end
            "
          >

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="
                rounded-xl
                bg-indigo-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-indigo-700
                hover:shadow
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {isSaving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal