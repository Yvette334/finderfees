import supabase from './supabaseClient'
import { authSupabase, itemsSupabase, claimsSupabase } from './supabaseAPI'

const PROFILES_TABLE = 'profiles'

const serializeUser = (user) => {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.fullName || user.email || '',
    phone: user.user_metadata?.phone || '',
    language: user.user_metadata?.language || 'en'
  }
}

const persistAuthState = (session, user) => {
  const token = session?.access_token || null
  if (token) {
    localStorage.setItem('authToken', token)
  } else {
    localStorage.removeItem('authToken')
  }

  const safeUser = serializeUser(user)
  if (safeUser) {
    // Store in both localStorage (shared) and sessionStorage (tab-specific)
    localStorage.setItem('user', JSON.stringify(safeUser))
    sessionStorage.setItem('activeUser', JSON.stringify(safeUser))
    sessionStorage.setItem('activeUserToken', token || '')
  } else {
    localStorage.removeItem('user')
    sessionStorage.removeItem('activeUser')
    sessionStorage.removeItem('activeUserToken')
  }

  return { token, user: safeUser }
}

const syncProfileRecord = async (user) => {
  if (!user) return
  const record = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.fullName || user.email || '',
    phone: user.user_metadata?.phone || '',
    language: user.user_metadata?.language || 'en',
    updated_at: new Date().toISOString()
  }

  try {
    await supabase.from(PROFILES_TABLE).upsert(record, { onConflict: 'id' })
  } catch (error) {
    console.warn('Profile sync skipped:', error.message || error)
  }
}

const mapProfileRow = (row) => ({
  id: row.id,
  fullName: row.full_name || row.fullName || '',
  email: row.email,
  phone: row.phone || '',
  language: row.language || 'en',
  createdAt: row.created_at || row.createdAt,
  updatedAt: row.updated_at || row.updatedAt
})

const fallbackUsers = () => JSON.parse(localStorage.getItem('users') || '[]')

export const authAPI = {
  register: async ({ email, password, fullName, phone, language }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName, phone, language }
      }
    })
    if (error) throw new Error(error.message)
    await syncProfileRecord(data.user)
    return persistAuthState(data.session, data.user)
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    await syncProfileRecord(data.user)
    return persistAuthState(data.session, data.user)
  },

  logout: async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Supabase sign out warning:', error.message || error)
    }
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    // Clear tab-specific session storage
    sessionStorage.removeItem('activeUser')
    sessionStorage.removeItem('activeUserToken')
  },

  getCurrentUser: () => {
    // Check sessionStorage first (tab-specific) for presentations
    // This allows different users in different tabs
    const sessionUserStr = sessionStorage.getItem('activeUser')
    if (sessionUserStr) {
      try {
        return JSON.parse(sessionUserStr)
      } catch (e) {
        // Invalid JSON, fall back to localStorage
      }
    }
    // Fall back to localStorage (shared across tabs)
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem('authToken') || localStorage.getItem('user'))
  }
}

export const userAPI = {
  getProfile: async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw new Error(error.message)
    await syncProfileRecord(data.user)
    return serializeUser(data.user)
  },

  updateProfile: async (userData) => {
    const { data, error } = await supabase.auth.updateUser({ data: userData })
    if (error) throw new Error(error.message)
    await syncProfileRecord(data.user)
    const safeUser = serializeUser(data.user)
    if (safeUser) {
      localStorage.setItem('user', JSON.stringify(safeUser))
    }
    return safeUser
  },

  getAllUsers: async () => {
    try {
      // First, try to get all users from auth.users via RPC function (includes unverified)
      try {
        const { data: allAuthUsers, error: authError } = await supabase
          .rpc('get_all_users')
        
        if (!authError && allAuthUsers && allAuthUsers.length > 0) {
          // Fetch profiles to merge role and additional info
          const { data: profiles, error: profilesError } = await supabase
            .from(PROFILES_TABLE)
            .select('*')
          
          // Create a map of profiles by ID
          const profilesMap = new Map()
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              profilesMap.set(profile.id, profile)
            })
          }
          
          // Merge auth users with profiles data
          const usersMap = new Map()
          
          // Process all auth users (including unverified)
          allAuthUsers.forEach(authUser => {
            const profile = profilesMap.get(authUser.id)
            const userMetadata = authUser.user_metadata || {}
            
            usersMap.set(authUser.id, {
              id: authUser.id,
              _id: authUser.id, // For compatibility
              email: authUser.email || '',
              email_confirmed_at: authUser.email_confirmed_at,
              created_at: authUser.created_at,
              updated_at: profile?.updated_at || authUser.created_at,
              fullName: profile?.full_name || userMetadata?.fullName || userMetadata?.full_name || '',
              phone: profile?.phone || userMetadata?.phone || '',
              role: profile?.role || null,
              verified: !!authUser.email_confirmed_at,
              language: profile?.language || userMetadata?.language || 'en'
            })
          })
          
          // Also add any profiles that might not be in auth.users
          if (!profilesError && profiles) {
            profiles.forEach(profile => {
              if (!usersMap.has(profile.id)) {
                usersMap.set(profile.id, mapProfileRow(profile))
              }
            })
          }
          
          // Return sorted by creation date (newest first)
          return Array.from(usersMap.values()).sort((a, b) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB - dateA
          })
        }
      } catch (rpcError) {
        console.warn('RPC get_all_users not available or failed:', rpcError.message)
      }
      
      // Fallback: Fetch from profiles table only (will miss unverified users without profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from(PROFILES_TABLE)
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (profilesError) throw profilesError
      
      // Map profiles to user format
      return (profiles || []).map(mapProfileRow)
    } catch (error) {
      console.warn('Error fetching users, falling back to local:', error.message || error)
      return fallbackUsers()
    }
  },
  // Check if the RPC 'get_all_users' is available
  checkGetAllUsersRpc: async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users')
      if (error) return false
      return !!data
    } catch (err) {
      return false
    }
  },

  // Attempts to sync all auth users into profiles table using an RPC function that should be created
  // in Supabase DB: `rpc('sync_all_auth_users_to_profiles')`
  syncUsersFromAuth: async () => {
    try {
      const { data, error } = await supabase.rpc('sync_all_auth_users_to_profiles')
      if (error) throw error
      // After syncing, refetch profiles
      const { data: profiles, error: profilesError } = await supabase.from(PROFILES_TABLE).select('*')
      if (profilesError) throw profilesError
      return (profiles || []).map(mapProfileRow)
    } catch (err) {
      console.warn('Failed to sync users from auth:', err.message || err)
      throw err
    }
  },

  getUserById: async (userId) => {
    try {
      const { data, error } = await supabase.from(PROFILES_TABLE).select('*').eq('id', userId).single()
      if (error) throw error
      return mapProfileRow(data)
    } catch (error) {
      console.warn('Failed to fetch user from Supabase:', error.message || error)
      return fallbackUsers().find((u) => (u.id || u._id) === userId) || null
    }
  },

  deleteUser: async (userId) => {
    try {
      await supabase.from(PROFILES_TABLE).delete().eq('id', userId)
    } catch (error) {
      console.warn('Supabase delete warning:', error.message || error)
      const filtered = fallbackUsers().filter((u) => (u.id || u._id) !== userId)
      localStorage.setItem('users', JSON.stringify(filtered))
    }
  }
}

export const itemAPI = {
  createItem: async (itemData) => itemsSupabase.createItem(itemData),
  getItems: async (filters = {}) => itemsSupabase.getItems(filters),
  getItemById: async (itemId) => itemsSupabase.getItemById(itemId),
  updateItem: async (itemId, itemData) => itemsSupabase.updateItem(itemId, itemData),
  deleteItem: async (itemId) => itemsSupabase.deleteItem(itemId)
}

export const claimAPI = {
  createClaim: async (claimData) => claimsSupabase.createClaim(claimData),
  getPendingClaims: async () => claimsSupabase.getPendingClaims(),
  getMyClaims: async (userId) => claimsSupabase.getMyClaims(userId),
  approveClaim: async (claimId, reviewer) => claimsSupabase.approveClaim(claimId, reviewer),
  rejectClaim: async (claimId, reviewer) => claimsSupabase.rejectClaim(claimId, reviewer)
}

export const statisticsAPI = {
  getPlatformStats: async () => {
    const items = (await itemsSupabase.getItems()) || []
    const pendingClaims = (await claimsSupabase.getPendingClaims()) || []
    const returnedItems = items.filter((item) => item.status === 'returned').length
    const lostItems = items.filter((item) => item.type === 'lost').length
    const foundItems = items.filter((item) => item.type === 'found').length

    return {
      totalItems: items.length,
      lostItems,
      foundItems,
      returnedItems,
      pendingClaims: pendingClaims.length
    }
  },

  getMyStats: async () => {
    const user = await authSupabase.getCurrentUser()
    if (!user) {
      return {
        totalItems: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        returnedItems: 0,
        totalEarnings: 0
      }
    }

    const [items, claims] = await Promise.all([
      itemsSupabase.getItems({ userId: user.id }),
      claimsSupabase.getMyClaims(user.id)
    ])

    const safeItems = items || []
    const safeClaims = claims || []
    const approvedClaims = safeClaims.filter((claim) => claim.status === 'approved')
    const pendingClaims = safeClaims.filter((claim) => claim.status === 'pending')
    const returnedItems = safeItems.filter((item) => item.status === 'returned').length
    const totalEarnings = approvedClaims.reduce((sum, claim) => sum + (claim.reward || 0), 0)

    return {
      totalItems: safeItems.length,
      pendingClaims: pendingClaims.length,
      approvedClaims: approvedClaims.length,
      returnedItems,
      totalEarnings
    }
  }
}

export default {
  authAPI,
  userAPI,
  itemAPI,
  claimAPI,
  statisticsAPI
}
