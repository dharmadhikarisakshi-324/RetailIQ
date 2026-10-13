import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  UserRound,
  X,
} from 'lucide-react'

import {
  updateCustomer,
  type Customer,
  type UpdateCustomer,
} from '../../api/customers'

interface Props {
  customer: Customer
  onClose: () => void
  onCustomerUpdated: () => Promise<void> | void
}

function EditCustomerModal({
  customer,
  onClose,
  onCustomerUpdated,
}: Props) {
  const [customerCode, setCustomerCode] = useState(customer.customer_code)
  const [mlCustomerId, setMlCustomerId] = useState(
    customer.ml_customer_id == null
      ? ''
      : String(customer.ml_customer_id),
  )
  const [name, setName] = useState(customer.name)
  const [email, setEmail] = useState(customer.email ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [loyaltyMember, setLoyaltyMember] = useState(
    customer.loyalty_member,
  )
  const [isActive, setIsActive] = useState(customer.is_active)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSaving, onClose])

  const inputClass = `
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
    focus:border-indigo-400
    focus:ring-2
    focus:ring-indigo-100
    disabled:cursor-not-allowed
    disabled:bg-slate-50
    disabled:opacity-60
  `

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError(null)

    const trimmedCode = customerCode.trim()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    const trimmedMlId = mlCustomerId.trim()

    // Validate customer code.
    if (!trimmedCode) {
      setError('Customer code is required.')
      return
    }

    if (trimmedCode.length > 50) {
      setError('Customer code cannot exceed 50 characters.')
      return
    }

    // Validate customer name.
    if (!trimmedName) {
      setError('Customer name is required.')
      return
    }

    if (trimmedName.length > 150) {
      setError('Customer name cannot exceed 150 characters.')
      return
    }

    // Validate email.
    if (trimmedEmail.length > 255) {
      setError('Email cannot exceed 255 characters.')
      return
    }

    if (
      trimmedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
    ) {
      setError('Please enter a valid email address.')
      return
    }

    // Validate phone.
    if (trimmedPhone.length > 20) {
      setError('Phone number cannot exceed 20 characters.')
      return
    }

    // Validate optional ML customer ID.
    let parsedMlCustomerId: number | null = null

    if (trimmedMlId !== '') {
      parsedMlCustomerId = Number(trimmedMlId)

      if (
        !Number.isSafeInteger(parsedMlCustomerId) ||
        parsedMlCustomerId < 0
      ) {
        setError(
          'ML Customer ID must be a non-negative whole number.',
        )
        return
      }
    }

    try {
      setIsSaving(true)

      const updateData: UpdateCustomer = {
        customer_code: trimmedCode,
        ml_customer_id: parsedMlCustomerId,
        name: trimmedName,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        loyalty_member: loyaltyMember,
        is_active: isActive,
      }

      await updateCustomer(customer.id, updateData)

      setSuccess(true)

      await onCustomerUpdated()

      onClose()
    } catch (err: unknown) {
      console.error('Failed to update customer:', err)

      const apiError = err as {
        response?: {
          data?: {
            detail?: unknown
          }
        }
        message?: string
      }

      const detail = apiError.response?.data?.detail

      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              'msg' in item
            ) {
              return String(item.msg)
            }

            return ''
          })
          .filter(Boolean)

        setError(
          messages.length > 0
            ? messages.join(', ')
            : 'Please check the entered information.',
        )
      } else {
        setError(
          apiError.message ||
            'Unable to update customer. Please try again.',
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSaving
        ) {
          handleClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="edit-customer-title"
              className="text-lg font-bold text-slate-900"
            >
              Edit Customer
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Update customer profile information
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-5 p-6">
            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Customer updated successfully.
              </div>
            )}

            {/* CUSTOMER HEADER */}

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-600">
                {name.trim().charAt(0).toUpperCase() || '?'}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="break-words text-lg font-bold text-slate-900">
                  {name || 'Customer name'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Customer ID: {customer.id}
                </p>
              </div>

              {isActive ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Inactive
                </span>
              )}
            </div>

            {/* BASIC INFORMATION */}

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Basic Information
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {/* CUSTOMER CODE */}

                <div>
                  <label
                    htmlFor="edit-customer-code"
                    className="text-xs font-medium text-slate-600"
                  >
                    Customer Code *
                  </label>

                  <input
                    id="edit-customer-code"
                    required
                    maxLength={50}
                    value={customerCode}
                    onChange={(event) =>
                      setCustomerCode(event.target.value)
                    }
                    placeholder="C10001"
                    className={inputClass}
                    disabled={isSaving || success}
                  />
                </div>

                {/* ML CUSTOMER ID */}

                <div>
                  <label
                    htmlFor="edit-ml-customer-id"
                    className="text-xs font-medium text-slate-600"
                  >
                    ML Customer ID
                  </label>

                  <input
                    id="edit-ml-customer-id"
                    type="number"
                    min={0}
                    step={1}
                    value={mlCustomerId}
                    onChange={(event) =>
                      setMlCustomerId(event.target.value)
                    }
                    placeholder="Optional"
                    className={inputClass}
                    disabled={isSaving || success}
                  />
                </div>

                {/* NAME */}

                <div>
                  <label
                    htmlFor="edit-customer-name"
                    className="text-xs font-medium text-slate-600"
                  >
                    Customer Name *
                  </label>

                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      id="edit-customer-name"
                      required
                      maxLength={150}
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Customer name"
                      className={`${inputClass} pl-9`}
                      disabled={isSaving || success}
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="edit-customer-email"
                    className="text-xs font-medium text-slate-600"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      id="edit-customer-email"
                      type="email"
                      maxLength={255}
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="customer@email.com"
                      className={`${inputClass} pl-9`}
                      disabled={isSaving || success}
                    />
                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="edit-customer-phone"
                    className="text-xs font-medium text-slate-600"
                  >
                    Phone
                  </label>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />

                    <input
                      id="edit-customer-phone"
                      type="tel"
                      maxLength={20}
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder="+91..."
                      className={`${inputClass} pl-9`}
                      disabled={isSaving || success}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LOYALTY */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                    <Crown className="h-5 w-5 text-amber-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Loyalty Member
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Enroll this customer in the loyalty program.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={loyaltyMember}
                  aria-label="Loyalty membership"
                  onClick={() =>
                    setLoyaltyMember((value) => !value)
                  }
                  disabled={isSaving || success}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    loyaltyMember
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      loyaltyMember
                        ? 'left-[22px]'
                        : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* ACTIVE STATUS */}

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Customer is active
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Control whether this customer is active.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label="Customer active status"
                onClick={() =>
                  setIsActive((value) => !value)
                }
                disabled={isSaving || success}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  isActive
                    ? 'bg-indigo-600'
                    : 'bg-slate-300'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    isActive
                      ? 'left-[22px]'
                      : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || success}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCustomerModal