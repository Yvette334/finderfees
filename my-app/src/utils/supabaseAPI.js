import supabase from './supabaseClient'

// Auth helpers
export const authSupabase = {
  signUp: async ({ email, password, fullName, phone, language }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { fullName, phone, language }
      }
    })
    if (error) throw error
    return data
  },
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  getUser: () => supabase.auth.getUser(),
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser()
    return data.user || null
  },
  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({ data: updates })
    if (error) throw error
    return data
  },
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb)
}

// Items table functions
export const itemsSupabase = {
  createItem: async (item) => {
    const now = new Date().toISOString()
    const payload = {
      user_id: item.user_id || item.userId || null,
      type: item.type,
      item_name: item.item_name || item.itemName,
      description: item.description || '',
      category: item.category || 'Other',
      location: item.location || '',
      event_date: item.event_date || item.date || new Date().toISOString().slice(0, 10),
      photo: item.photo || null,
      reward: item.reward ?? null,
      commission: item.commission ?? null,
      status: item.status || 'active',
      verified: item.verified ?? false,
      payment_status: item.payment_status || 'unpaid',
      user_name: item.user_name || item.userName || '',
      user_phone: item.user_phone || item.userPhone || '',
      owner_name: item.owner_name || item.ownerName || '',
      owner_phone: item.owner_phone || item.ownerPhone || '',
      created_at: now,
      updated_at: now
    }
    const { data, error } = await supabase.from('items').insert(payload).select()
    if (error) throw error
    return data[0]
  },
  getItems: async (filters = {}) => {
    let builder = supabase.from('items').select('*')
    if (filters.userId) builder = builder.eq('user_id', filters.userId)
    if (filters.type) builder = builder.eq('type', filters.type)
    if (filters.category) builder = builder.eq('category', filters.category)
    if (filters.status) builder = builder.eq('status', filters.status)
    if (filters.search) builder = builder.textSearch('item_name,description,location', filters.search)
    const { data, error } = await builder.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  getItemById: async (id) => {
    const { data, error } = await supabase.from('items').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },
  updateItem: async (id, update) => {
    const u = { ...update, updated_at: new Date().toISOString() }
    const { data, error } = await supabase.from('items').update(u).eq('id', id).select()
    if (error) throw error
    return data?.[0]
  },
  deleteItem: async (id) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    return true
  }
}

// Claims table
export const claimsSupabase = {
  createClaim: async (claim) => {
    const now = new Date().toISOString()
    const payload = { ...claim, created_at: now, updated_at: now, status: 'pending' }
    const { data, error } = await supabase.from('claims').insert(payload).select()
    if (error) throw error
    return data[0]
  },
  getPendingClaims: async () => {
    const { data, error } = await supabase.from('claims').select('*').eq('status', 'pending').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  getMyClaims: async (userId) => {
    const { data, error } = await supabase.from('claims').select('*').eq('claimant_id', userId).order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  approveClaim: async (claimId, reviewedBy) => {
    const { data, error } = await supabase.from('claims').update({ status: 'approved', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', claimId).select()
    if (error) throw error
    return data[0]
  },
  rejectClaim: async (claimId, reviewedBy) => {
    const { data, error } = await supabase.from('claims').update({ status: 'rejected', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', claimId).select()
    if (error) throw error
    return data[0]
  }
}

export default {
  authSupabase,
  itemsSupabase,
  claimsSupabase
}
