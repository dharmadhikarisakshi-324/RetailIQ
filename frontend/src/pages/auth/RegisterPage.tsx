import { useState, type FormEvent } from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
  User,
} from 'lucide-react'

import { Link, useNavigate } from 'react-router-dom'

import { registerCustomer } from '../../api/auth'
import Button from '../../components/ui/Button'

function RegisterPage() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')
    setSuccess(false)

    const cleanUsername = username.trim()
    const cleanEmail = email.trim()

    if (cleanUsername.length < 3) {
      setError('Username must contain at least 3 characters.')
      return
    }

    if (cleanUsername.length > 100) {
      setError('Username cannot exceed 100 characters.')
      return
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    if (password.length > 128) {
      setError('Password cannot exceed 128 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      await registerCustomer({
        username: cleanUsername,
        email: cleanEmail,
        password,
      })

      setSuccess(true)

      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
        })
      }, 1200)
    } catch (err: unknown) {
      console.error('RetailIQ registration error:', err)

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
          messages.length
            ? messages.join(', ')
            : 'Please check your registration details.',
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to create your account. Please try again.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* BRANDING */}

        <div className="hidden bg-indigo-600 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">
                RetailIQ
              </h1>

              <p className="text-sm text-indigo-200">
                AI-Powered Retail Platform
              </p>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-200">
              Smarter Retail. Better Shopping.
            </p>

            <h2 className="text-4xl font-bold leading-tight text-white">
              Your shopping experience starts here.
            </h2>

            <p className="mt-6 text-base leading-7 text-indigo-100">
              Discover products, explore recommendations, manage
              your cart, and track your orders with RetailIQ.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-white" />

                <p className="text-sm font-medium text-white">
                  Personalized shopping experience
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-indigo-200">
            RetailIQ © 2026
          </p>
        </div>

        {/* REGISTRATION FORM */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  RetailIQ
                </h1>

                <p className="text-sm text-slate-400">
                  Smart Retail Platform
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
              <div className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Register as a RetailIQ customer.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                  <span>
                    Account created successfully! Redirecting to login...
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* USERNAME */}

                <div>
                  <label
                    htmlFor="register-username"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Username
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="register-username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={100}
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Choose a username"
                      disabled={isLoading || success}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="register-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="register-email"
                      type="email"
                      required
                      maxLength={255}
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      disabled={isLoading || success}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      maxLength={128}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      disabled={isLoading || success}
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isLoading || success}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Enter your password again"
                      disabled={isLoading || success}
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      disabled={isLoading || success}
                      aria-label={
                        showConfirmPassword
                          ? 'Hide confirmation password'
                          : 'Show confirmation password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || success}
                  className="mt-2 h-11 w-full rounded-xl"
                >
                  {isLoading
                    ? 'Creating account...'
                    : success
                      ? 'Account created'
                      : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Your shopping and retail intelligence platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage