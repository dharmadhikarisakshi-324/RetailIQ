import apiClient from './client'

// ============================================================
// LOGIN
// ============================================================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// ============================================================
// CURRENT USER
// ============================================================

export interface CurrentUser {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
}

// ============================================================
// CUSTOMER REGISTRATION
// ============================================================

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
}

export async function registerCustomer(
  registrationData: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>(
    '/api/auth/register',
    registrationData,
  )

  return response.data
}

// ============================================================
// LOGIN API
// ============================================================

export async function loginUser(
  credentials: LoginRequest,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    '/api/auth/login',
    credentials,
  )

  return response.data
}

// ============================================================
// GET CURRENT USER
// ============================================================

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>(
    '/api/auth/me',
  )

  return response.data
}

// ============================================================
// UPDATE CUSTOMER PROFILE
// ============================================================

export interface ProfileUpdateRequest {
  username: string
  email: string
}

export async function updateMyProfile(
  profileData: ProfileUpdateRequest,
): Promise<CurrentUser> {
  const token = localStorage.getItem('retailiq_token')

  if (!token) {
    throw new Error('Please log in again.')
  }

  const response = await fetch('/api/auth/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : 'Failed to update profile.',
    )
  }

  return data as CurrentUser
}