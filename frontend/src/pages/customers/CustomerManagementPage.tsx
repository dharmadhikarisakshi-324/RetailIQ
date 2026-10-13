import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Plus,
  Search,
  Users,
  Crown,
  Mail,
  Phone,
  Eye,
  X,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react'

import Card from '../../components/ui/Card'

import {
  createCustomer,
  getCustomers,
  type Customer,
  type CreateCustomer,
} from '../../api/customers'


export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null)

  const [isCreating, setIsCreating] = useState(false)

  const [form, setForm] = useState<CreateCustomer>({
    customer_code: '',
    name: '',
    email: '',
    phone: '',
    loyalty_member: false,
    is_active: true,
  })


  // =========================================================
  // LOAD CUSTOMERS
  // =========================================================

  async function loadCustomers() {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getCustomers(0, 5000)

      setCustomers(data)
    } catch (err) {
      console.error('Customer loading error:', err)
      setError('Unable to load customers.')
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    loadCustomers()
  }, [])


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return customers
    }

    return customers.filter((customer) =>
      [
        customer.name,
        customer.customer_code,
        customer.email ?? '',
        customer.phone ?? '',
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [customers, search])


  // =========================================================
  // FORM
  // =========================================================

  function updateForm(
    field: keyof CreateCustomer,
    value: string | boolean,
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }


  function openAddModal() {
    setForm({
      customer_code: '',
      name: '',
      email: '',
      phone: '',
      loyalty_member: false,
      is_active: true,
    })

    setShowAddModal(true)
  }


  function closeAddModal() {
    if (!isCreating) {
      setShowAddModal(false)
    }
  }


  async function handleCreateCustomer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!form.customer_code.trim() || !form.name.trim()) {
      return
    }

    try {
      setIsCreating(true)

      const newCustomer = await createCustomer({
        customer_code: form.customer_code.trim(),
        name: form.name.trim(),
        email: form.email?.trim() || null,
        phone: form.phone?.trim() || null,
        loyalty_member: Boolean(form.loyalty_member),
        is_active: true,
      })

      setCustomers((previous) => [
        newCustomer,
        ...previous,
      ])

      setShowAddModal(false)

    } catch (err) {
      console.error('Customer creation error:', err)
      setError('Unable to create customer.')
    } finally {
      setIsCreating(false)
    }
  }


  // =========================================================
  // LOADING
  // =========================================================

  if (isLoading) {
    return (
      <div className="space-y-6">

        <div className="h-36 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>

        <div className="h-[500px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />

      </div>
    )
  }


  return (
    <div className="space-y-6">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">

        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

          <div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-indigo-100">
              <Users size={14} />
              Customer Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Customers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Manage customer profiles, loyalty membership and
              customer information from one place.
            </p>

          </div>


          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100"
          >
            <Plus size={18} />
            Add Customer
          </button>

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">

          <span>{error}</span>

          <button
            onClick={() => {
              setError(null)
              loadCustomers()
            }}
            className="inline-flex items-center gap-2 font-medium"
          >
            <RefreshCw size={15} />
            Retry
          </button>

        </div>
      )}


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <Card className="p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total Customers
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {customers.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Users size={21} />
            </div>

          </div>

        </Card>


        <Card className="p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loyalty Members
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {
                  customers.filter(
                    (customer) =>
                      customer.loyalty_member,
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Crown size={21} />
            </div>

          </div>

        </Card>


        <Card className="p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Active Customers
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {
                  customers.filter(
                    (customer) =>
                      customer.is_active,
                  ).length
                }
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <UserCheck size={21} />
            </div>

          </div>

        </Card>

      </section>


      {/* =====================================================
          CUSTOMER TABLE
      ===================================================== */}

      <Card className="overflow-hidden">

        <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Customer Directory
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {filteredCustomers.length} customers found
              </p>
            </div>


            <div className="relative w-full lg:max-w-sm">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customers..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500/10"
              />

            </div>

          </div>

        </div>


        {/* DESKTOP TABLE */}

        <div className="hidden overflow-x-auto md:block">

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/70 text-left dark:border-slate-800 dark:bg-slate-900/50">

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contact
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loyalty
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredCustomers.map((customer) => (

                <tr
                  key={customer.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/30"
                >

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {customer.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {customer.name}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {customer.customer_code}
                        </p>

                      </div>

                    </div>

                  </td>


                  <td className="px-6 py-4">

                    <div className="space-y-1">

                      {customer.email ? (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Mail size={13} />
                          {customer.email}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No email
                        </span>
                      )}

                      {customer.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <Phone size={13} />
                          {customer.phone}
                        </div>
                      )}

                    </div>

                  </td>


                  <td className="px-6 py-4">

                    {customer.loyalty_member ? (

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <Crown size={13} />
                        Member
                      </span>

                    ) : (

                      <span className="text-xs text-slate-400">
                        Not enrolled
                      </span>

                    )}

                  </td>


                  <td className="px-6 py-4">

                    {customer.is_active ? (

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>

                    ) : (

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
                        <UserX size={13} />
                        Inactive
                      </span>

                    )}

                  </td>


                  <td className="px-6 py-4 text-right">

                    <button
                      onClick={() =>
                        setSelectedCustomer(customer)
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                    >
                      <Eye size={15} />
                      View
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>


        {/* MOBILE CARDS */}

        <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">

          {filteredCustomers.map((customer) => (

            <div
              key={customer.id}
              className="p-4"
            >

              <div className="flex items-start gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {customer.name}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {customer.customer_code}
                  </p>

                  <div className="mt-3 space-y-1">

                    {customer.email && (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={13} />
                        {customer.email}
                      </p>
                    )}

                    {customer.phone && (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={13} />
                        {customer.phone}
                      </p>
                    )}

                  </div>

                </div>


                <button
                  onClick={() =>
                    setSelectedCustomer(customer)
                  }
                  className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                >
                  <Eye size={17} />
                </button>

              </div>


              <div className="mt-4 flex flex-wrap gap-2">

                {customer.loyalty_member && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <Crown size={12} />
                    Loyalty Member
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    customer.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                  }`}
                >
                  {customer.is_active
                    ? 'Active'
                    : 'Inactive'}
                </span>

              </div>

            </div>

          ))}

        </div>


        {/* EMPTY */}

        {filteredCustomers.length === 0 && (

          <div className="flex min-h-[300px] items-center justify-center p-6">

            <div className="text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Users size={26} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                No customers found
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try changing your search or add a new customer.
              </p>

            </div>

          </div>

        )}

      </Card>


      {/* =====================================================
          VIEW CUSTOMER MODAL
      ===================================================== */}

      {selectedCustomer && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">

              <div>

                <p className="text-xs font-medium text-indigo-500">
                  Customer Profile
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedCustomer.name}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedCustomer(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={19} />
              </button>

            </div>


            <div className="space-y-4 p-5">

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">
                    Customer ID
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    #{selectedCustomer.id}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">
                    Customer Code
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedCustomer.customer_code}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">
                    ML Customer ID
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedCustomer.ml_customer_id ?? '—'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <p className="text-xs text-slate-500">
                    Status
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {selectedCustomer.is_active
                      ? 'Active'
                      : 'Inactive'}
                  </p>
                </div>

              </div>


              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">

                <p className="text-xs font-medium text-slate-500">
                  Contact Information
                </p>

                <div className="mt-3 space-y-3">

                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Mail size={16} />
                    {selectedCustomer.email ?? 'No email'}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Phone size={16} />
                    {selectedCustomer.phone ?? 'No phone'}
                  </div>

                </div>

              </div>


              <div className="flex flex-wrap gap-2">

                {selectedCustomer.loyalty_member && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <Crown size={14} />
                    Loyalty Member
                  </span>
                )}

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {selectedCustomer.is_active
                    ? 'Active Customer'
                    : 'Inactive Customer'}
                </span>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          ADD CUSTOMER MODAL
      ===================================================== */}

      {showAddModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">

              <div>

                <p className="text-xs font-medium text-indigo-500">
                  Customer Management
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  Add Customer
                </h2>

              </div>

              <button
                onClick={closeAddModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={19} />
              </button>

            </div>


            <form
              onSubmit={handleCreateCustomer}
              className="space-y-4 p-5"
            >

              <div>

                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Customer Code *
                </label>

                <input
                  required
                  value={form.customer_code}
                  onChange={(event) =>
                    updateForm(
                      'customer_code',
                      event.target.value,
                    )
                  }
                  placeholder="C10001"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

              </div>


              <div>

                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value,
                    )
                  }
                  placeholder="Customer name"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

              </div>


              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={(event) =>
                      updateForm(
                        'email',
                        event.target.value,
                      )
                    }
                    placeholder="customer@email.com"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />

                </div>


                <div>

                  <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Phone
                  </label>

                  <input
                    value={form.phone ?? ''}
                    onChange={(event) =>
                      updateForm(
                        'phone',
                        event.target.value,
                      )
                    }
                    placeholder="Phone number"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />

                </div>

              </div>


              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">

                <input
                  type="checkbox"
                  checked={Boolean(form.loyalty_member)}
                  onChange={(event) =>
                    updateForm(
                      'loyalty_member',
                      event.target.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />

                <div>

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Loyalty Member
                  </p>

                  <p className="text-xs text-slate-500">
                    Add this customer to the loyalty program.
                  </p>

                </div>

              </label>


              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isCreating}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Customer
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}