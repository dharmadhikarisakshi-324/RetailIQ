import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import apiClient from '../../api/client'

interface ShoppingListProduct {
  id: number
  product_code: string
  barcode: string | null
  name: string
  price: number
  is_active: boolean
}

interface ShoppingListItem {
  id: number
  shopping_list_id: number
  product_id: number
  quantity: number
  is_purchased: boolean
  product: ShoppingListProduct
}

interface ShoppingList {
  id: number
  customer_id: number
  name: string
  created_at: string
  updated_at: string
  items: ShoppingListItem[]
}

interface Product {
  id: number
  product_code: string
  barcode?: string | null
  name: string
  price: number
  is_active: boolean
  category_id?: number | null
  description?: string | null
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item: { msg?: string }) => item.msg ?? 'Invalid input')
        .join(', ')
    }

    if (!error.response) {
      return 'Cannot connect to RetailIQ. Please check that the backend is running.'
    }
  }

  return 'Something went wrong. Please try again.'
}

export default function ShoppingListsPage() {
  const navigate = useNavigate()

  const [lists, setLists] = useState<ShoppingList[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [newListName, setNewListName] = useState('')
  const [selectedListId, setSelectedListId] = useState<number | null>(null)

  const [selectedProductId, setSelectedProductId] = useState('')
  const [productQuantity, setProductQuantity] = useState(1)

  const [editingListId, setEditingListId] = useState<number | null>(null)
  const [editingListName, setEditingListName] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedList =
    lists.find((list) => list.id === selectedListId) ?? null

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const [listsResponse, productsResponse] = await Promise.all([
        apiClient.get<ShoppingList[]>('/api/shopping-lists'),
        apiClient.get<Product[]>('/api/products'),
      ])

      setLists(listsResponse.data)

      setProducts(
        productsResponse.data.filter((product) => product.is_active),
      )

      setSelectedListId((currentId) => {
        if (
          currentId !== null &&
          listsResponse.data.some((list) => list.id === currentId)
        ) {
          return currentId
        }

        return listsResponse.data[0]?.id ?? null
      })
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const clearMessages = () => {
    setErrorMessage('')
    setSuccessMessage('')
  }

  // Queue the selected list so ShopPage can add its products to the cart.
  const handleAddListToCart = () => {
    clearMessages()

    if (!selectedList || selectedList.items.length === 0) {
      setErrorMessage('Your shopping list is empty.')
      return
    }

    const pendingItems = selectedList.items
      .filter(
        (item) =>
          !item.is_purchased && item.product.is_active,
      )
      .map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))

    if (pendingItems.length === 0) {
      setErrorMessage(
        'There are no unpurchased active products in this list to add to your cart.',
      )
      return
    }

    try {
      sessionStorage.setItem(
        'retailiq_pending_shopping_list',
        JSON.stringify(pendingItems),
      )

      navigate('/shop')
    } catch {
      setErrorMessage(
        'Could not prepare your shopping list. Please check your browser storage settings and try again.',
      )
    }
  }

  const handleCreateList = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    clearMessages()

    const name = newListName.trim()

    if (!name) {
      setErrorMessage('Please enter a shopping list name.')
      return
    }

    setSaving(true)

    try {
      const response = await apiClient.post<ShoppingList>(
        '/api/shopping-lists',
        { name },
      )

      setLists((current) => [...current, response.data])
      setSelectedListId(response.data.id)
      setNewListName('')

      setSuccessMessage(
        `"${response.data.name}" was created successfully.`,
      )
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleRenameList = async (listId: number) => {
    clearMessages()

    const name = editingListName.trim()

    if (!name) {
      setErrorMessage('Please enter a list name.')
      return
    }

    setSaving(true)

    try {
      const response = await apiClient.patch<ShoppingList>(
        `/api/shopping-lists/${listId}`,
        { name },
      )

      setLists((current) =>
        current.map((list) =>
          list.id === listId ? response.data : list,
        ),
      )

      setEditingListId(null)
      setEditingListName('')
      setSuccessMessage('Shopping list renamed successfully.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteList = async (list: ShoppingList) => {
    const confirmed = window.confirm(
      `Delete "${list.name}" and all its saved items?`,
    )

    if (!confirmed) return

    clearMessages()
    setSaving(true)

    try {
      await apiClient.delete(`/api/shopping-lists/${list.id}`)

      const remainingLists = lists.filter(
        (item) => item.id !== list.id,
      )

      setLists(remainingLists)

      if (selectedListId === list.id) {
        setSelectedListId(remainingLists[0]?.id ?? null)
      }

      setSuccessMessage('Shopping list deleted successfully.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    clearMessages()

    if (selectedListId === null) {
      setErrorMessage('Create or select a shopping list first.')
      return
    }

    if (!selectedProductId) {
      setErrorMessage('Please select a product.')
      return
    }

    if (
      !Number.isInteger(productQuantity) ||
      productQuantity < 1 ||
      productQuantity > 10000
    ) {
      setErrorMessage('Quantity must be between 1 and 10000.')
      return
    }

    setSaving(true)

    try {
      const response = await apiClient.post<ShoppingList>(
        `/api/shopping-lists/${selectedListId}/items`,
        {
          product_id: Number(selectedProductId),
          quantity: productQuantity,
        },
      )

      setLists((current) =>
        current.map((list) =>
          list.id === response.data.id ? response.data : list,
        ),
      )

      setSelectedProductId('')
      setProductQuantity(1)
      setSuccessMessage('Product added to your shopping list.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async (
    listId: number,
    item: ShoppingListItem,
    changes: { quantity?: number; is_purchased?: boolean },
  ) => {
    clearMessages()

    const newQuantity = changes.quantity ?? item.quantity

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity < 1 ||
      newQuantity > 10000
    ) {
      setErrorMessage('Quantity must be between 1 and 10000.')
      return
    }

    setSaving(true)

    try {
      const response = await apiClient.patch<ShoppingList>(
        `/api/shopping-lists/${listId}/items/${item.id}`,
        changes,
      )

      setLists((current) =>
        current.map((list) =>
          list.id === response.data.id ? response.data : list,
        ),
      )
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (
    listId: number,
    item: ShoppingListItem,
  ) => {
    const confirmed = window.confirm(
      `Remove "${item.product.name}" from this list?`,
    )

    if (!confirmed) return

    clearMessages()
    setSaving(true)

    try {
      const response = await apiClient.delete<ShoppingList>(
        `/api/shopping-lists/${listId}/items/${item.id}`,
      )

      setLists((current) =>
        current.map((list) =>
          list.id === response.data.id ? response.data : list,
        ),
      )

      setSuccessMessage('Product removed from the list.')
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) return true

    return (
      product.name.toLowerCase().includes(search) ||
      product.product_code.toLowerCase().includes(search) ||
      product.barcode?.toLowerCase().includes(search)
    )
  })

  const listTotal =
    selectedList?.items.reduce(
      (total, item) =>
        total + Number(item.product.price) * item.quantity,
      0,
    ) ?? 0

  const purchasedCount =
    selectedList?.items.filter((item) => item.is_purchased).length ?? 0

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'GBP',
  })

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            RetailIQ Customer
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Shopping Lists
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Save your regular purchases, organize products, and reuse
            your lists whenever you shop.
          </p>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="font-bold"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Create list */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Create a shopping list
          </h2>

          <form
            onSubmit={handleCreateList}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="e.g. Weekly groceries"
              maxLength={100}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Please wait...' : '+ Create list'}
            </button>
          </form>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />

            <p className="text-sm text-slate-600">
              Loading your shopping lists...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Shopping list sidebar */}
            <aside className="lg:col-span-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    Your lists
                  </h2>

                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    {lists.length}
                  </span>
                </div>

                {lists.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                    <div className="mb-3 text-4xl">🛍️</div>

                    <p className="font-semibold text-slate-800">
                      No lists yet
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Create your first list above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lists.map((list) => {
                      const isSelected = list.id === selectedListId

                      return (
                        <div
                          key={list.id}
                          className={`rounded-xl border p-3 transition ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {editingListId === list.id ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault()
                                void handleRenameList(list.id)
                              }}
                              className="space-y-2"
                            >
                              <input
                                autoFocus
                                value={editingListName}
                                onChange={(event) =>
                                  setEditingListName(event.target.value)
                                }
                                maxLength={100}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingListId(null)
                                    setEditingListName('')
                                  }}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedListId(list.id)
                                  clearMessages()
                                }}
                                className="w-full text-left"
                              >
                                <span className="block break-words font-semibold text-slate-900">
                                  {list.name}
                                </span>

                                <span className="mt-1 block text-sm text-slate-500">
                                  {list.items.length}{' '}
                                  {list.items.length === 1 ? 'item' : 'items'}
                                </span>
                              </button>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingListId(list.id)
                                    setEditingListName(list.name)
                                    clearMessages()
                                  }}
                                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                                >
                                  Rename
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void handleDeleteList(list)}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </aside>

            {/* Selected list details */}
            <section className="min-w-0 lg:col-span-8">
              {!selectedList ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                  <div className="mb-3 text-5xl">🧺</div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Select a shopping list
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Choose an existing list or create one to get started.
                  </p>
                </div>
              ) : (
                <>
                  {/* List summary */}
                  <div className="mb-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-sm sm:p-7">
                    <p className="text-sm font-medium text-indigo-100">
                      Selected shopping list
                    </p>

                    <h2 className="mt-1 break-words text-2xl font-bold">
                      {selectedList.name}
                    </h2>

                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-white/10 p-3">
                        <p className="text-sm text-indigo-100">
                          Total items
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {selectedList.items.length}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/10 p-3">
                        <p className="text-sm text-indigo-100">
                          Purchased
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {purchasedCount}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl bg-white/10 p-3 sm:col-span-1">
                        <p className="text-sm text-indigo-100">
                          Estimated total
                        </p>

                        <p className="mt-1 text-2xl font-bold">
                          {currencyFormatter.format(listTotal)}
                        </p>
                      </div>
                    </div>

                    {/* Add entire list to cart */}
                    <button
                      type="button"
                      onClick={handleAddListToCart}
                      disabled={selectedList.items.length === 0}
                      className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      🛒 Add Entire List to Cart
                    </button>

                    <p className="mt-2 text-xs text-indigo-100">
                      Already purchased items are skipped.
                    </p>
                  </div>

                  {/* Add product */}
                  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">
                      Add a product
                    </h3>

                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div>
                        <label
                          htmlFor="product-search"
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Search products
                        </label>

                        <input
                          id="product-search"
                          type="text"
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search by product name, code, or barcode..."
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="product-select"
                            className="mb-2 block text-sm font-medium text-slate-700"
                          >
                            Product
                          </label>

                          <select
                            id="product-select"
                            value={selectedProductId}
                            onChange={(event) =>
                              setSelectedProductId(event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          >
                            <option value="">Choose a product</option>

                            {filteredProducts.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} — {product.product_code} (
                                {currencyFormatter.format(Number(product.price))})
                              </option>
                            ))}
                          </select>

                          {filteredProducts.length === 0 && (
                            <p className="mt-2 text-sm text-slate-500">
                              No matching active products found.
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="product-quantity"
                            className="mb-2 block text-sm font-medium text-slate-700"
                          >
                            Quantity
                          </label>

                          <input
                            id="product-quantity"
                            type="number"
                            min={1}
                            max={10000}
                            value={productQuantity}
                            onChange={(event) =>
                              setProductQuantity(Number(event.target.value))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saving || products.length === 0}
                        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        {saving ? 'Please wait...' : '+ Add to list'}
                      </button>
                    </form>
                  </div>

                  {/* List items */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <h3 className="text-lg font-bold text-slate-900">
                        Saved products
                      </h3>

                      <span className="text-sm text-slate-500">
                        {selectedList.items.length} saved{' '}
                        {selectedList.items.length === 1
                          ? 'product'
                          : 'products'}
                      </span>
                    </div>

                    {selectedList.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                        <div className="mb-3 text-4xl">📦</div>

                        <p className="font-semibold text-slate-800">
                          This list is empty
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Search for a product above and add it to this list.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedList.items.map((item) => (
                          <article
                            key={item.id}
                            className={`rounded-xl border p-4 transition ${
                              item.is_purchased
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={item.is_purchased}
                                    onChange={(event) =>
                                      void handleUpdateItem(
                                        selectedList.id,
                                        item,
                                        {
                                          is_purchased: event.target.checked,
                                        },
                                      )
                                    }
                                    aria-label={`Mark ${item.product.name} as purchased`}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />

                                  <div className="min-w-0">
                                    <h4
                                      className={`break-words font-semibold ${
                                        item.is_purchased
                                          ? 'text-slate-500 line-through'
                                          : 'text-slate-900'
                                      }`}
                                    >
                                      {item.product.name}
                                    </h4>

                                    <p className="mt-1 text-sm text-slate-500">
                                      Code: {item.product.product_code}
                                    </p>

                                    <p className="mt-2 font-semibold text-slate-800">
                                      {currencyFormatter.format(
                                        Number(item.product.price),
                                      )}{' '}
                                      <span className="font-normal text-slate-500">
                                        × {item.quantity}
                                      </span>
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-indigo-700">
                                      Subtotal:{' '}
                                      {currencyFormatter.format(
                                        Number(item.product.price) *
                                          item.quantity,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <button
                                  type="button"
                                  disabled={saving || item.quantity <= 1}
                                  onClick={() =>
                                    void handleUpdateItem(
                                      selectedList.id,
                                      item,
                                      { quantity: item.quantity - 1 },
                                    )
                                  }
                                  className="h-9 w-9 rounded-lg border border-slate-300 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Decrease quantity of ${item.product.name}`}
                                >
                                  −
                                </button>

                                <span className="min-w-8 text-center font-semibold">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={saving || item.quantity >= 10000}
                                  onClick={() =>
                                    void handleUpdateItem(
                                      selectedList.id,
                                      item,
                                      { quantity: item.quantity + 1 },
                                    )
                                  }
                                  className="h-9 w-9 rounded-lg border border-slate-300 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Increase quantity of ${item.product.name}`}
                                >
                                  +
                                </button>

                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() =>
                                    void handleDeleteItem(selectedList.id, item)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}

                    {selectedList.items.length > 0 && (
                      <div className="mt-5 flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                        <span className="text-sm text-slate-500">
                          Estimated list value
                        </span>

                        <span className="text-xl font-bold text-slate-900">
                          {currencyFormatter.format(listTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Prices are estimates based on the product prices currently returned
          by RetailIQ. Final checkout totals should be calculated and verified
          by the backend.
        </p>
      </div>
    </main>
  )
}