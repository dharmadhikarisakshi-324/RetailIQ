import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react'

import {
  getCustomers,
  type Customer,
} from '../../api/customers'

import AddCustomerModal from './AddCustomerModal'
import EditCustomerModal from './EditCustomerModal'

const PAGE_SIZE = 10

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null)

  // Fetch customers from the backend.
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const response = await getCustomers()

      setCustomers(response)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load customers.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  // Search by name, customer code, email, phone, or ML ID.
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return customers
    }

    return customers.filter((customer) => {
      const searchableValues = [
        customer.name,
        customer.customer_code,
        customer.email ?? '',
        customer.phone ?? '',
        customer.ml_customer_id ?? '',
      ]

      return searchableValues.some((value) =>
        String(value).toLowerCase().includes(query),
      )
    })
  }, [customers, search])

  // Calculate pagination.
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / PAGE_SIZE),
  )

  const currentPage = Math.min(page, totalPages)

  const startIndex = (currentPage - 1) * PAGE_SIZE

  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  // Summary statistics.
  const totalCustomers = customers.length

  const activeCustomers = customers.filter(
    (customer) => customer.is_active,
  ).length

  const loyaltyCustomers = customers.filter(
    (customer) => customer.loyalty_member,
  ).length

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // Called after a customer is created.
  const handleCustomerCreated = async () => {
    setShowAddModal(false)
    setPage(1)
    await loadCustomers()
  }

  // Called after a customer is updated.
  const handleCustomerUpdated = async () => {
    setEditingCustomer(null)
    await loadCustomers()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* PAGE HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Customer Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customer profiles and loyalty membership.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadCustomers()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Customers"
          value={totalCustomers}
          description="Customers in the database"
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-indigo-100 text-indigo-600"
        />

        <SummaryCard
          title="Active Customers"
          value={activeCustomers}
          description="Currently active profiles"
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-emerald-100 text-emerald-600"
        />

        <SummaryCard
          title="Loyalty Members"
          value={loyaltyCustomers}
          description="Enrolled in the loyalty program"
          icon={<Crown className="h-5 w-5" />}
          iconClass="bg-amber-100 text-amber-600"
        />
      </div>

      {/* CUSTOMER TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              All Customers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredCustomers.length} customer
              {filteredCustomers.length === 1 ? '' : 's'} found
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                handleSearch(event.target.value)
              }
              placeholder="Search customers..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Unable to load customers
              </p>

              <p className="mt-1 break-words text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadCustomers()}
              className="text-sm font-semibold text-red-700 hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading customers...
            </p>
          </div>
        ) : (
          <>
            {/* RESPONSIVE TABLE */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer Code
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Loyalty
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* CUSTOMER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-600">
                            {customer.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {customer.name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ML ID:{' '}
                              {customer.ml_customer_id ??
                                'Not assigned'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CODE */}

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                          {customer.customer_code}
                        </span>
                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-2 text-sm text-slate-700">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                            <span className="max-w-48 truncate">
                              {customer.email || 'No email'}
                            </span>
                          </p>

                          <p className="text-xs text-slate-500">
                            {customer.phone || 'No phone'}
                          </p>
                        </div>
                      </td>

                      {/* LOYALTY */}

                      <td className="px-5 py-4">
                        {customer.loyalty_member ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Crown className="h-3.5 w-3.5" />
                            Member
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                            Not enrolled
                          </span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        {customer.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCustomer(customer)
                          }
                          aria-label={`Edit ${customer.name}`}
                          title="View or edit customer"
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* EMPTY STATE */}

                  {paginatedCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                          <Users className="h-7 w-7 text-slate-400" />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-800">
                          No customers found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {search
                            ? 'Try another search term.'
                            : 'Add your first customer to get started.'}
                        </p>

                        {!search && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowAddModal(true)
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            <Plus className="h-4 w-4" />
                            Add Customer
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {filteredCustomers.length === 0 ? (
                  'Showing 0 customers'
                ) : (
                  <>
                    Showing{' '}
                    <span className="font-semibold text-slate-700">
                      {startIndex + 1}
                    </span>
                    {'–'}
                    <span className="font-semibold text-slate-700">
                      {Math.min(
                        startIndex + PAGE_SIZE,
                        filteredCustomers.length,
                      )}
                    </span>
                    {' of '}
                    <span className="font-semibold text-slate-700">
                      {filteredCustomers.length}
                    </span>
                    {' customers'}
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.max(1, previous - 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <span className="px-2 text-sm font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((previous) =>
                      Math.min(totalPages, previous + 1),
                    )
                  }
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ADD CUSTOMER MODAL */}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onCustomerCreated={handleCustomerCreated}
        />
      )}

      {/* EDIT CUSTOMER MODAL */}

      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}
    </div>
  )
}

// Summary card component.
function SummaryCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

export default CustomersPage