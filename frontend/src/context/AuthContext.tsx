import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import apiClient from '../api/client'

import {
  getCurrentUser,
  type CurrentUser,
} from '../api/auth'


// ==================================================
// AUTH CONTEXT TYPE
// ==================================================

interface AuthContextType {
  user: CurrentUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  setAuthToken: (token: string) => void
  updateUser: (updatedUser: CurrentUser) => void
  logout: () => void
}


// ==================================================
// CREATE CONTEXT
// ==================================================

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)


// ==================================================
// AUTH PROVIDER PROPS
// ==================================================

interface AuthProviderProps {
  children: ReactNode
}


// ==================================================
// AUTH PROVIDER
// ==================================================

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null)

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('retailiq_token')
  })

  const [isLoading, setIsLoading] = useState(true)


  // ==================================================
  // SET AUTH TOKEN
  // ==================================================

  const setAuthToken = (newToken: string) => {
    localStorage.setItem('retailiq_token', newToken)

    setToken(newToken)

    apiClient.defaults.headers.common.Authorization =
      `Bearer ${newToken}`
  }


  // ==================================================
  // UPDATE USER INFORMATION
  // ==================================================

  const updateUser = (updatedUser: CurrentUser) => {
    setUser(updatedUser)
  }


  // ==================================================
  // LOGOUT
  // ==================================================

  const logout = () => {
    localStorage.removeItem('retailiq_token')

    delete apiClient.defaults.headers.common.Authorization

    setToken(null)
    setUser(null)
  }


  // ==================================================
  // INITIALIZE AUTHENTICATION
  // ==================================================

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      apiClient.defaults.headers.common.Authorization =
        `Bearer ${token}`

      try {
        const currentUser = await getCurrentUser()

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [token])


  // ==================================================
  // CONTEXT PROVIDER
  // ==================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        setAuthToken,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


// ==================================================
// CUSTOM AUTH HOOK
// ==================================================

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider',
    )
  }

  return context
}


export default AuthProvider