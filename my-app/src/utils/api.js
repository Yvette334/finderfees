/**
 * API Service for Finders Fee Platform
 * Connects React frontend to MongoDB backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const token = localStorage.getItem('authToken')

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  }

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// ============================================
// AUTHENTICATION API
// ============================================

export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: userData
    })
    if (response.token) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },

  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (response.token) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },

  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken')
  }
}

// ============================================
// USER API
// ============================================

export const userAPI = {
  getProfile: async () => {
    return apiRequest('/users/me')
  },

  updateProfile: async (userData) => {
    return apiRequest('/users/me', {
      method: 'PUT',
      body: userData
    })
  }
}

// ============================================
// ITEM API
// ============================================

export const itemAPI = {
  createItem: async (itemData) => {
    return apiRequest('/items', {
      method: 'POST',
      body: itemData
    })
  },

  getItems: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString()
    return apiRequest(`/items?${queryParams}`)
  },

  getItemById: async (itemId) => {
    return apiRequest(`/items/${itemId}`)
  },

  updateItem: async (itemId, itemData) => {
    return apiRequest(`/items/${itemId}`, {
      method: 'PUT',
      body: itemData
    })
  },

  deleteItem: async (itemId) => {
    return apiRequest(`/items/${itemId}`, {
      method: 'DELETE'
    })
  }
}

// ============================================
// CLAIM API
// ============================================

export const claimAPI = {
  createClaim: async (claimData) => {
    return apiRequest('/claims', {
      method: 'POST',
      body: claimData
    })
  },

  getPendingClaims: async () => {
    return apiRequest('/claims/pending')
  },

  getMyClaims: async () => {
    return apiRequest('/claims/my')
  },

  approveClaim: async (claimId) => {
    return apiRequest(`/claims/${claimId}/approve`, {
      method: 'PUT'
    })
  },

  rejectClaim: async (claimId) => {
    return apiRequest(`/claims/${claimId}/reject`, {
      method: 'PUT'
    })
  }
}

// ============================================
// PAYMENT API
// ============================================

export const paymentAPI = {
  createPayment: async (paymentData) => {
    return apiRequest('/payments', {
      method: 'POST',
      body: paymentData
    })
  },

  getMyPayments: async () => {
    return apiRequest('/payments/my')
  },

  updatePaymentStatus: async (paymentId, status, transactionId = null) => {
    return apiRequest(`/payments/${paymentId}/status`, {
      method: 'PUT',
      body: { status, transactionId }
    })
  }
}

// ============================================
// NOTIFICATION API
// ============================================

export const notificationAPI = {
  getNotifications: async (unreadOnly = false) => {
    const params = unreadOnly ? { unreadOnly: 'true' } : {}
    const queryParams = new URLSearchParams(params).toString()
    return apiRequest(`/notifications?${queryParams}`)
  },

  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    })
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'PUT'
    })
  }
}

// ============================================
// STATISTICS API
// ============================================

export const statisticsAPI = {
  getPlatformStats: async () => {
    return apiRequest('/statistics/platform')
  },

  getMyStats: async () => {
    return apiRequest('/statistics/my')
  }
}

export default {
  authAPI,
  userAPI,
  itemAPI,
  claimAPI,
  paymentAPI,
  notificationAPI,
  statisticsAPI
}

