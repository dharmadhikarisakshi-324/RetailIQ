import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react'

import Card from '../../components/ui/Card'

import {
  getInventory,
  getInventoryIntelligence,
  updateInventory,
  type InventoryIntelligence,
  type InventoryItem,
} from '../../api/inventory'

// ============================================================
// INVENTORY PAGE
// ============================================================

export default function InventoryPage() {
  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([])

  const [search, setSearch] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null)

  const [
    intelligence,
    setIntelligence,
  ] = useState<InventoryIntelligence | null>(
    null,
  )

  const [
    intelligenceLoading,
    setIntelligenceLoading,
  ] = useState(false)

  const [
    intelligenceError,
    setIntelligenceError,
  ] = useState<string | null>(null)

  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(null)

  const [editQuantity, setEditQuantity] =
    useState('')

  const [
    editReorderLevel,
    setEditReorderLevel,
  ] = useState('')

  const [
    editReorderQuantity,
    setEditReorderQuantity,
  ] = useState('')

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    saveMessage,
    setSaveMessage,
  ] = useState<string | null>(null)

  // ==========================================================
  // LOAD INVENTORY
  // ==========================================================

  async function loadInventory() {
    try {
      setLoading(true)
      setError(null)

      const data = await getInventory()

      setInventory(data)
    } catch (err) {
      console.error(err)

      setError(
        'Unable to load inventory. Please check the backend.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredInventory = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase()

    if (!value) {
      return inventory
    }

    return inventory.filter((item) =>
      [
        item.product_code,
        item.product_name,
        String(item.product_id),
      ]
        .filter(Boolean)
        .some((field) =>
          String(field)
            .toLowerCase()
            .includes(value),
        ),
    )
  }, [inventory, search])

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const total = inventory.length

    const outOfStock = inventory.filter(
      (item) => Number(item.quantity) <= 0,
    ).length

    const lowStock = inventory.filter(
      (item) =>
        Number(item.quantity) > 0 &&
        Number(item.quantity) <=
          Number(item.reorder_level),
    ).length

    const healthy = Math.max(
      total - outOfStock - lowStock,
      0,
    )

    return {
      total,
      healthy,
      lowStock,
      outOfStock,
    }
  }, [inventory])

  // ==========================================================
  // AI INTELLIGENCE
  // ==========================================================

  async function handleIntelligence(
    item: InventoryItem,
  ) {
    try {
      setSelectedItem(item)

      setIntelligence(null)
      setIntelligenceError(null)
      setIntelligenceLoading(true)

      const productId =
        item.product_code ??
        String(item.product_id)

      const result =
        await getInventoryIntelligence(
          productId,
        )

      setIntelligence(result)
    } catch (err) {
      console.error(err)

      setIntelligenceError(
        'AI inventory intelligence could not be loaded.',
      )
    } finally {
      setIntelligenceLoading(false)
    }
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  function openEdit(
    item: InventoryItem,
  ) {
    setEditingItem(item)

    setEditQuantity(
      String(item.quantity ?? 0),
    )

    setEditReorderLevel(
      String(item.reorder_level ?? 0),
    )

    setEditReorderQuantity(
      String(item.reorder_quantity ?? 0),
    )

    setSaveMessage(null)
  }

  function closeEdit() {
    if (saving) return

    setEditingItem(null)
  }

  async function handleSave() {
    if (!editingItem) return

    try {
      setSaving(true)
      setSaveMessage(null)

      await updateInventory(
        editingItem.id,
        {
          quantity: Number(editQuantity),
          reorder_level:
            Number(editReorderLevel),
          reorder_quantity:
            Number(editReorderQuantity),
        },
      )

      setSaveMessage(
        'Inventory updated successfully.',
      )

      await loadInventory()

      setTimeout(() => {
        setEditingItem(null)
      }, 700)
    } catch (err) {
      console.error(err)

      setSaveMessage(
        'Unable to update inventory.',
      )
    } finally {
      setSaving(false)
    }
  }

  // ==========================================================
  // STOCK STATUS
  // ==========================================================

  function getStatus(
    item: InventoryItem,
  ) {
    const quantity = Number(
      item.quantity ?? 0,
    )

    const reorderLevel = Number(
      item.reorder_level ?? 0,
    )

    if (quantity <= 0) {
      return {
        label: 'Out of Stock',
        className:
          'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
      }
    }

    if (
      reorderLevel > 0 &&
      quantity <= reorderLevel
    ) {
      return {
        label: 'Low Stock',
        className:
          'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle,
      }
    }

    return {
      label: 'Healthy',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ),
          )}
        </div>

        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />

      </div>
    )
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Stock health, reorder management and AI forecasting.
          </p>
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">

            <XCircle className="h-12 w-12 text-red-500" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Unable to load inventory
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={loadInventory}
              className="
                mt-6
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-indigo-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-indigo-700
              "
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>

          </div>
        </Card>

      </div>
    )
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor stock health and make AI-powered replenishment decisions.
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
          "
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>

      </div>

      {/* KPI CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Products
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {statistics.total}
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-3">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>

          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Healthy Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {statistics.healthy}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>

          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Low Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {statistics.lowStock}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>

          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-slate-500">
                Out of Stock
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {statistics.outOfStock}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>

          </div>
        </Card>

      </div>

      {/* SEARCH */}

      <Card>

        <div className="relative">

          <Search
            className="
              absolute
              left-3
              top-1/2
              h-5
              w-5
              -translate-y-1/2
              text-slate-400
            "
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search product code, product name or product ID..."
            className="
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              py-3
              pl-10
              pr-4
              text-sm
              outline-none
              transition
              focus:border-indigo-500
              focus:bg-white
              focus:ring-2
              focus:ring-indigo-100
            "
          />

        </div>

      </Card>

      {/* INVENTORY TABLE */}

      <Card className="overflow-hidden p-0">

        <div className="border-b border-slate-100 px-5 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="font-semibold text-slate-900">
                Inventory Stock
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing {filteredInventory.length} of {inventory.length} products
              </p>
            </div>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-[900px] w-full">

            <thead className="bg-slate-50">

              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">

                <th className="px-5 py-4">
                  Product
                </th>

                <th className="px-5 py-4">
                  Stock
                </th>

                <th className="px-5 py-4">
                  Reorder Level
                </th>

                <th className="px-5 py-4">
                  Reorder Qty
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {filteredInventory.map(
                (item) => {
                  const status =
                    getStatus(item)

                  const StatusIcon =
                    status.icon

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <div className="font-semibold text-slate-900">
                          {item.product_code ??
                            `Product ${item.product_id}`}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.product_name ??
                            `Product ID: ${item.product_id}`}
                        </div>

                      </td>

                      <td className="px-5 py-4">

                        <span className="font-semibold text-slate-900">
                          {item.quantity ?? 0}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.reorder_level ?? 0}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.reorder_quantity ?? 0}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            px-2.5
                            py-1
                            text-xs
                            font-semibold
                            ${status.className}
                          `}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={() =>
                              handleIntelligence(item)
                            }
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              bg-indigo-50
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-indigo-700
                              transition
                              hover:bg-indigo-100
                            "
                          >
                            <Brain className="h-4 w-4" />
                            AI
                          </button>

                          <button
                            onClick={() =>
                              openEdit(item)
                            }
                            className="
                              rounded-lg
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-semibold
                              text-slate-700
                              transition
                              hover:bg-slate-50
                            "
                          >
                            Edit
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                },
              )}

            </tbody>

          </table>

          {filteredInventory.length === 0 && (
            <div className="px-6 py-16 text-center">

              <Package className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-700">
                No inventory found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try a different search term.
              </p>

            </div>
          )}

        </div>

      </Card>

      {/* ======================================================
          AI INTELLIGENCE MODAL
      ======================================================= */}

      {selectedItem && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-sm
          "
        >

          <div
            className="
              max-h-[90vh]
              w-full
              max-w-3xl
              overflow-y-auto
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >

            <div className="border-b border-slate-100 px-6 py-5">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <div className="flex items-center gap-2">

                    <div className="rounded-xl bg-indigo-50 p-2">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">
                      AI Inventory Intelligence
                    </h2>

                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedItem.product_code ??
                      selectedItem.product_id}
                    {' · '}
                    {selectedItem.product_name ??
                      'Product'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setIntelligence(null)
                    setIntelligenceError(null)
                  }}
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  <XCircle className="h-5 w-5" />
                </button>

              </div>

            </div>

            <div className="p-6">

              {intelligenceLoading && (
                <div className="py-12 text-center">

                  <div
                    className="
                      mx-auto
                      h-10
                      w-10
                      animate-spin
                      rounded-full
                      border-4
                      border-slate-200
                      border-t-indigo-600
                    "
                  />

                  <p className="mt-4 text-sm text-slate-500">
                    Running inventory intelligence...
                  </p>

                </div>
              )}

              {intelligenceError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {intelligenceError}
                </div>
              )}

              {intelligence && (
                <div className="space-y-5">

                  {/* RISK */}

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-sm font-medium text-indigo-700">
                          AI Recommendation
                        </p>

                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {intelligence.recommendation}
                        </p>
                      </div>

                      <span
                        className={`
                          rounded-full
                          px-4
                          py-2
                          text-sm
                          font-bold
                          ${
                            intelligence.risk_level
                              .toLowerCase()
                              .includes('high')
                              ? 'bg-red-100 text-red-700'
                              : intelligence.risk_level
                                  .toLowerCase()
                                  .includes('medium')
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }
                        `}
                      >
                        {intelligence.risk_level} Risk
                      </span>

                    </div>

                  </div>

                  {/* METRICS */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    {[
                      {
                        label: 'Current Stock',
                        value: intelligence.current_stock,
                        icon: Package,
                      },
                      {
                        label: 'Daily Demand',
                        value:
                          intelligence.predicted_daily_demand.toFixed(
                            2,
                          ),
                        icon: TrendingUp,
                      },
                      {
                        label: 'Lead Time',
                        value: `${intelligence.lead_time_days} days`,
                        icon: RefreshCw,
                      },
                      {
                        label: 'Lead Time Demand',
                        value:
                          intelligence.lead_time_demand.toFixed(
                            2,
                          ),
                        icon: TrendingUp,
                      },
                      {
                        label: 'Safety Stock',
                        value:
                          intelligence.safety_stock.toFixed(
                            2,
                          ),
                        icon: CheckCircle2,
                      },
                      {
                        label: 'Reorder Point',
                        value:
                          intelligence.reorder_point.toFixed(
                            2,
                          ),
                        icon: AlertTriangle,
                      },
                    ].map(
                      ({
                        label,
                        value,
                        icon: Icon,
                      }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-slate-200 p-4"
                        >

                          <div className="flex items-center gap-2 text-slate-500">

                            <Icon className="h-4 w-4" />

                            <span className="text-xs font-medium">
                              {label}
                            </span>

                          </div>

                          <p className="mt-2 text-xl font-bold text-slate-900">
                            {value}
                          </p>

                        </div>
                      ),
                    )}

                  </div>

                  {/* REORDER */}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                    <p className="text-sm font-semibold text-slate-700">
                      Recommended Order Quantity
                    </p>

                    <p className="mt-1 text-3xl font-bold text-indigo-600">
                      {intelligence.recommended_order_quantity}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Based on predicted demand, lead time and safety stock.
                    </p>

                  </div>

                </div>
              )}

            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">

              <button
                onClick={() => {
                  setSelectedItem(null)
                  setIntelligence(null)
                  setIntelligenceError(null)
                }}
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
                  hover:bg-slate-50
                "
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          EDIT MODAL
      ======================================================= */}

      {editingItem && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/50
            p-4
            backdrop-blur-sm
          "
        >

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="border-b border-slate-100 px-6 py-5">

              <h2 className="text-lg font-bold text-slate-900">
                Edit Inventory
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingItem.product_code ??
                  editingItem.product_id}
              </p>

            </div>

            <div className="space-y-4 p-6">

              <label className="block">

                <span className="text-sm font-semibold text-slate-700">
                  Current Quantity
                </span>

                <input
                  type="number"
                  min="0"
                  value={editQuantity}
                  onChange={(event) =>
                    setEditQuantity(
                      event.target.value,
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-indigo-500
                    focus:ring-2
                    focus:ring-indigo-100
                  "
                />

              </label>

              <label className="block">

                <span className="text-sm font-semibold text-slate-700">
                  Reorder Level
                </span>

                <input
                  type="number"
                  min="0"
                  value={editReorderLevel}
                  onChange={(event) =>
                    setEditReorderLevel(
                      event.target.value,
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-indigo-500
                    focus:ring-2
                    focus:ring-indigo-100
                  "
                />

              </label>

              <label className="block">

                <span className="text-sm font-semibold text-slate-700">
                  Reorder Quantity
                </span>

                <input
                  type="number"
                  min="0"
                  value={editReorderQuantity}
                  onChange={(event) =>
                    setEditReorderQuantity(
                      event.target.value,
                    )
                  }
                  className="
                    mt-2
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    outline-none
                    focus:border-indigo-500
                    focus:ring-2
                    focus:ring-indigo-100
                  "
                />

              </label>

              {saveMessage && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  {saveMessage}
                </div>
              )}

            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">

              <button
                onClick={closeEdit}
                disabled={saving}
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
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-indigo-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-indigo-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}