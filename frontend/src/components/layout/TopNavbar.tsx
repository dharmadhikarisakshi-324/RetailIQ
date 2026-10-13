import {
  Bell,
  ChevronDown,
  Search,
  User,
} from 'lucide-react'

function TopNavbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Left Side */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Dashboard
        </h2>

        <p className="mt-0.5 text-sm text-slate-500">
          Welcome back to RetailIQ
        </p>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search..."
            className="
              h-10 w-64 rounded-xl
              border border-slate-200
              bg-slate-50
              pl-10 pr-4
              text-sm text-slate-700
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-indigo-400
              focus:bg-white
              focus:ring-2
              focus:ring-indigo-100
            "
          />
        </div>

        {/* Notification */}
        <button
          type="button"
          className="
            relative flex h-10 w-10 items-center justify-center
            rounded-xl
            text-slate-500
            transition-colors
            hover:bg-slate-100
            hover:text-slate-700
          "
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />

          {/* Notification indicator */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* User Profile */}
        <button
          type="button"
          className="
            flex items-center gap-3 rounded-xl px-2 py-1.5
            transition-colors
            hover:bg-slate-50
          "
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
            <User className="h-5 w-5 text-indigo-600" />
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Admin User
            </p>

            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}

export default TopNavbar