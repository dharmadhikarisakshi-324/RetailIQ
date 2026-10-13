import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  X,
} from 'lucide-react'

import {
  createCustomer,
  type CreateCustomer,
} from '../../api/customers'

interface Props {
  onClose: () => void
  onCustomerCreated: () => Promise<void> | void
}

function AddCustomerModal({
  onClose,
  onCustomerCreated,
}: Props) {
  const [customerCode, setCustomerCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loyaltyMember, setLoyaltyMember] = useState(false)
  const [isActive, setIsActive] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Close the modal when Escape is pressed.
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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError(null)

    const trimmedCode = customerCode.trim()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    // Frontend validation
    if (!trimmedCode) {
      setError('Customer code is required.')
      return
    }

    if (trimmedCode.length > 50) {
      setError('Customer code cannot exceed 50 characters.')
      return
    }

    if (!trimmedName) {
      setError('Customer name is required.')
      return
    }

    if (trimmedName.length > 150) {
      setError('Customer name cannot exceed 150 characters.')
      return
    }

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

    if (trimmedPhone.length > 20) {
      setError('Phone number cannot exceed 20 characters.')
      return
    }

    try {
      setIsSaving(true)

      const customerData: CreateCustomer = {
        customer_code: trimmedCode,
        name: trimmedName,
        email: trimmedEmail || null,
        phone: trimmedPhone || null,
        loyalty_member: loyaltyMember,
        is_active: isActive,
      }

      await createCustomer(customerData)

      setSuccess(true)

      // Refresh the customer list after successful creation.
      await onCustomerCreated()

      // Give the user a moment to see the success message.
      window.setTimeout(() => {
        onClose()
      }, 700)
    } catch (err: unknown) {
      console.error('Failed to create customer:', err)

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
            : 'Please check the customer information and try again.',
        )
      } else {
        setError(
          apiError.message ||
            'Unable to create customer. Please try again.',
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isSaving
        ) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-customer-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="add-customer-title"
              className="text-lg font-bold text-slate-900"
            >
              Add Customer
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Create a new customer profile
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-5 p-6">
            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>Customer created successfully.</span>
              </div>
            )}

            {/* Basic information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Basic Information
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {/* Customer code */}
                <div>
                  <label
                    htmlFor="customer-code"
                    className="text-xs font-medium text-slate-600"
                  >
                    Customer Code *
                  </label>

                  <input
                    id="customer-code"
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

                {/* Customer name */}
                <div>
                  <label
                    htmlFor="customer-name"
                    className="text-xs font-medium text-slate-600"
                  >
                    Customer Name *
                  </label>

                  <input
                    id="customer-name"
                    required
                    maxLength={150}
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Customer name"
                    className={inputClass}
                    disabled={isSaving || success}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="customer-email"
                    className="text-xs font-medium text-slate-600"
                  >
                    Email
                  </label>

                  <input
                    id="customer-email"
                    type="email"
                    maxLength={255}
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="customer@email.com"
                    className={inputClass}
                    disabled={isSaving || success}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="customer-phone"
                    className="text-xs font-medium text-slate-600"
                  >
                    Phone
                  </label>

                  <input
                    id="customer-phone"
                    type="tel"
                    maxLength={20}
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+91..."
                    className={inputClass}
                    disabled={isSaving || success}
                  />
                </div>
              </div>
            </div>

            {/* Loyalty membership */}
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
                      Add this customer to the loyalty program.
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

            {/* Active status */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Customer is active
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Active customers can use RetailIQ services.
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

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || success}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Creating...'
                : success
                  ? 'Created'
                  : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCustomerModal