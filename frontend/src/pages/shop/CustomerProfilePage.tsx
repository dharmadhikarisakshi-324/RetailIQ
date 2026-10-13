import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { updateMyProfile } from '../../api/auth'

function CustomerProfilePage() {
  const { user, logout, updateUser } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  if (!user) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Profile unavailable
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Please log in again to view your profile.
        </p>

        <Link
          to="/login"
          className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  const handleEdit = () => {
    setUsername(user.username)
    setEmail(user.email)
    setSuccessMessage('')
    setErrorMessage('')
    setIsEditing(true)
  }

  const handleCancel = () => {
    setUsername(user.username)
    setEmail(user.email)
    setIsEditing(false)
    setSuccessMessage('')
    setErrorMessage('')
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSuccessMessage('')
    setErrorMessage('')

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (trimmedUsername.length < 3) {
      setErrorMessage('Username must contain at least 3 characters.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsSaving(true)

    try {
      const updatedUser = await updateMyProfile({
        username: trimmedUsername,
        email: trimmedEmail,
      })

      // Update the shared authentication state.
      updateUser(updatedUser)

      setUsername(updatedUser.username)
      setEmail(updatedUser.email)
      setIsEditing(false)
      setSuccessMessage('Your profile was updated successfully.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to update your profile. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Profile
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          View and manage your RetailIQ account information.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {/* Profile card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-blue-600 px-6 py-8 text-white sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-600">
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2 className="break-words text-2xl font-bold">
                {user.username}
              </h2>

              <p className="mt-1 break-all text-sm text-blue-100">
                {user.email}
              </p>

              <span className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">
              Account Information
            </h3>

            {!isEditing && (
              <button
                type="button"
                onClick={handleEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Edit form */}
          {isEditing && (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label
                  htmlFor="profile-username"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Username
                </label>

                <input
                  id="profile-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={100}
                  required
                  autoComplete="username"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  required
                  autoComplete="email"
                  disabled={isSaving}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Account details */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">User ID</p>
              <p className="mt-1 font-semibold text-slate-900">
                {user.id}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Username</p>
              <p className="mt-1 break-words font-semibold text-slate-900">
                {user.username}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Email Address</p>
              <p className="mt-1 break-all font-semibold text-slate-900">
                {user.email}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Account Role</p>
              <p className="mt-1 font-semibold capitalize text-slate-900">
                {user.role}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm text-slate-500">Account Status</p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  user.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Link
              to="/my-orders"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              View My Orders
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CustomerProfilePage