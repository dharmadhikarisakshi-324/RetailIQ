import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Sparkles,
  User,
  ShoppingBag,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  LoaderCircle,
} from 'lucide-react'

import {
  loginUser,
  getCurrentUser,
} from '../../api/auth'

import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'

function LoginPage() {
  const navigate = useNavigate()
  const { setAuthToken } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter your username.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Authenticate the user.
      const loginResponse = await loginUser({
        username: username.trim(),
        password,
      })

      if (!loginResponse.access_token) {
        throw new Error(
          'The server did not return an access token.',
        )
      }

      // Step 2: Save the token using the existing auth context.
      setAuthToken(loginResponse.access_token)

      // Step 3: Verify the logged-in user's details.
      const currentUser = await getCurrentUser()
      const role = currentUser.role?.toLowerCase()

      console.log('RetailIQ login successful:', {
        username: currentUser.username,
        role,
      })

      // Step 4: Redirect according to the user's role.
      if (role === 'customer') {
        navigate('/shop', { replace: true })
      } else if (role === 'admin' || role === 'staff') {
        navigate('/dashboard', { replace: true })
      } else {
        throw new Error(
          'Your account has an unsupported role. Please contact the administrator.',
        )
      }
    } catch (caughtError: unknown) {
      console.error('RetailIQ login error:', caughtError)

      if (
        typeof caughtError === 'object' &&
        caughtError !== null &&
        'response' in caughtError
      ) {
        const response = (
          caughtError as {
            response?: {
              status?: number
              data?: {
                detail?: string
              }
            }
          }
        ).response

        const status = response?.status
        const detail = response?.data?.detail

        if (status === 401) {
          setError(detail || 'Invalid username or password.')
        } else if (status === 403) {
          setError(
            detail || 'You do not have permission to sign in.',
          )
        } else if (detail) {
          setError(`Login error: ${detail}`)
        } else {
          setError(
            `Login failed${status ? ` with status ${status}` : ''}. Please try again.`,
          )
        }
      } else if (caughtError instanceof Error) {
        setError(caughtError.message)
      } else {
        setError(
          'An unexpected error occurred during login.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="riq-login min-h-screen w-full"
      style={{
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT PANEL: BRANDING */}

        <section
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
          style={{
            background:
              'linear-gradient(145deg, #111827 0%, #1e1b4b 48%, #4338ca 100%)',
            padding: '48px',
            color: '#ffffff',
          }}
        >
          {/* Decorative background elements */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full"
            style={{
              background: 'rgba(129, 140, 248, 0.15)',
              filter: 'blur(3px)',
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full"
            style={{
              background: 'rgba(168, 85, 247, 0.18)',
              filter: 'blur(3px)',
            }}
          />

          {/* Logo */}

          <div className="relative z-10 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: '#ffffff', margin: 0 }}
              >
                RetailIQ
              </h1>

              <p
                className="text-sm"
                style={{
                  color: '#c7d2fe',
                  margin: 0,
                }}
              >
                AI-Powered Retail Intelligence
              </p>
            </div>
          </div>

          {/* Main message */}

          <div className="relative z-10 my-12 max-w-xl">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{
                color: '#e0e7ff',
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.13)',
              }}
            >
              <Sparkles className="h-4 w-4" />
              Intelligence for modern retail
            </div>

            <h2
              className="text-4xl font-bold leading-tight xl:text-5xl"
              style={{
                color: '#ffffff',
                marginBottom: '20px',
                maxWidth: '580px',
              }}
            >
              Turn retail data into smarter decisions.
            </h2>

            <p
              className="max-w-lg text-base leading-8"
              style={{
                color: '#cbd5e1',
                marginBottom: 0,
              }}
            >
              Understand customer behaviour, discover product
              insights, personalize recommendations, and make
              better inventory decisions with RetailIQ.
            </p>

            {/* Feature cards */}

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(129,140,248,0.2)',
                  }}
                >
                  <BrainCircuit className="h-6 w-6 text-indigo-200" />
                </div>

                <h3
                  className="font-semibold"
                  style={{
                    color: '#ffffff',
                    marginBottom: '6px',
                  }}
                >
                  AI Intelligence
                </h3>

                <p
                  className="text-sm leading-6"
                  style={{ color: '#cbd5e1', margin: 0 }}
                >
                  Data-driven insights for smarter retail.
                </p>
              </div>

              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(45,212,191,0.15)',
                  }}
                >
                  <BarChart3 className="h-6 w-6 text-teal-200" />
                </div>

                <h3
                  className="font-semibold"
                  style={{
                    color: '#ffffff',
                    marginBottom: '6px',
                  }}
                >
                  Live Insights
                </h3>

                <p
                  className="text-sm leading-6"
                  style={{ color: '#cbd5e1', margin: 0 }}
                >
                  Monitor retail performance and trends.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom information */}

          <div className="relative z-10">
            <div
              className="mb-5"
              style={{
                height: '1px',
                background: 'rgba(255,255,255,0.15)',
              }}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <p
                className="text-sm"
                style={{ color: '#cbd5e1', margin: 0 }}
              >
                RetailIQ © 2026
              </p>

              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: '#cbd5e1' }}
              >
                <ShieldCheck className="h-4 w-4" />
                Secure account access
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: LOGIN */}

        <section
          className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8"
          style={{ background: '#f8fafc' }}
        >
          <div className="w-full max-w-md">
            {/* Mobile logo */}

            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, #4f46e5, #7c3aed)',
                }}
              >
                <Sparkles className="h-6 w-6 text-white" />
              </div>

              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ color: '#0f172a', margin: 0 }}
                >
                  RetailIQ
                </h1>

                <p
                  className="text-sm"
                  style={{ color: '#64748b', margin: 0 }}
                >
                  AI-Powered Retail Platform
                </p>
              </div>
            </div>

            {/* Login heading */}

            <div className="mb-8">
              <div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: '#eef2ff',
                  border: '1px solid #e0e7ff',
                }}
              >
                <LockKeyhole
                  className="h-7 w-7"
                  style={{ color: '#4f46e5' }}
                />
              </div>

              <p
                className="mb-2 text-sm font-semibold uppercase tracking-wider"
                style={{ color: '#4f46e5' }}
              >
                Welcome back
              </p>

              <h2
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                style={{
                  color: '#0f172a',
                  marginBottom: '12px',
                }}
              >
                Sign in to RetailIQ
              </h2>

              <p
                className="text-sm leading-6"
                style={{ color: '#64748b', margin: 0 }}
              >
                Enter your account details to continue.
              </p>
            </div>

            {/* Login card */}

            <div
              className="rounded-3xl p-6 sm:p-8"
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow:
                  '0 20px 60px rgba(15,23,42,0.07)',
              }}
            >
              {/* Error message */}

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-6 rounded-xl px-4 py-3 text-sm leading-6"
                  style={{
                    color: '#b91c1c',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Login form */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Username */}

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold"
                    style={{ color: '#334155' }}
                  >
                    Username
                  </label>

                  <div className="relative">
                    <User
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      style={{ color: '#94a3b8' }}
                    />

                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      placeholder="Enter your username"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      disabled={isLoading}
                      required
                      className="h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition"
                      style={{
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold"
                      style={{ color: '#334155' }}
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2"
                      style={{ color: '#94a3b8' }}
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                      className="h-12 w-full rounded-xl pl-11 pr-12 text-sm outline-none transition"
                      style={{
                        color: '#0f172a',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={isLoading}
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1 transition"
                      style={{ color: '#64748b' }}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Footer */}

              <div
                className="mt-7 border-t pt-6 text-center"
                style={{ borderColor: '#e2e8f0' }}
              >
                <p
                  className="text-xs leading-5"
                  style={{ color: '#64748b', margin: 0 }}
                >
                  <ShieldCheck className="mr-1 inline h-4 w-4 align-[-3px]" />
                  Your account information is handled securely.
                </p>

                <p
                  className="mt-5 text-sm"
                  style={{ color: '#64748b', marginBottom: 0 }}
                >
                  New to RetailIQ?{' '}
                  <Link
                    to="/register"
                    className="font-semibold transition"
                    style={{ color: '#4f46e5' }}
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom note */}

            <p
              className="mt-6 text-center text-xs leading-5"
              style={{ color: '#94a3b8' }}
            >
              Smart shopping. Better insights. Smarter retail.
            </p>

            {/* Mobile feature note */}

            <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
              <div
                className="rounded-xl p-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <ShoppingBag
                  className="mb-2 h-5 w-5"
                  style={{ color: '#4f46e5' }}
                />

                <p
                  className="text-xs font-semibold"
                  style={{ color: '#334155', margin: 0 }}
                >
                  Smart Shopping
                </p>
              </div>

              <div
                className="rounded-xl p-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                }}
              >
                <BrainCircuit
                  className="mb-2 h-5 w-5"
                  style={{ color: '#7c3aed' }}
                />

                <p
                  className="text-xs font-semibold"
                  style={{ color: '#334155', margin: 0 }}
                >
                  AI Recommendations
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LoginPage