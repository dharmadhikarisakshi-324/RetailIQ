import axios from 'axios'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8002'
).replace(/\/+$/, '')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
})

// ==================================================
// REQUEST INTERCEPTOR
// Attach the logged-in user's JWT token.
// ==================================================

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('retailiq_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      delete config.headers.Authorization
    }

    return config
  },
  (error: unknown) => Promise.reject(error),
)

// ==================================================
// RESPONSE INTERCEPTOR
// Handle API errors consistently.
// ==================================================

apiClient.interceptors.response.use(
  (response) => response,

  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(
          'RetailIQ API request timed out. Please try again.',
        )
      } else if (!error.response) {
        console.error(
          `Cannot connect to RetailIQ API at ${API_BASE_URL}. ` +
            'Check that the backend is running.',
        )
      } else {
        const statusCode = error.response.status
        const detail = error.response.data?.detail

        const message =
          typeof detail === 'string'
            ? detail
            : error.message

        console.error(
          `RetailIQ API error (${statusCode}):`,
          message,
        )
      }
    } else {
      console.error('Unexpected RetailIQ API error:', error)
    }

    return Promise.reject(error)
  },
)

export default apiClient