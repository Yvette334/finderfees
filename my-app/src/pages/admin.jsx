import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AdminNavbar from '../components/AdminNavbar'
import Footer from '../components/footer'
import { authAPI, userAPI } from '../utils/api'
import { authSupabase, claimsSupabase, itemsSupabase, notificationsSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'
import { sampleItems } from './Search'


function Admin() {
  const [pendingClaims, setPendingClaims] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const [rejectedClaims, setRejectedClaims] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allItems, setAllItems] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [deletedSampleItems, setDeletedSampleItems] = useState(() => {
    // Load deleted sample items from localStorage
    try {
      return JSON.parse(localStorage.getItem('deletedSampleItems') || '[]')
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  const loadAdminData = async () => {
    try {
      const [pending, items, allClaims] = await Promise.all([
        claimsSupabase.getPendingClaims(),
        itemsSupabase.getItems(),
        supabase.from('claims').select('*')
      ])
      
      setPendingClaims(pending || [])
      setAllItems(items || [])
      
      // Separate approved and rejected claims
      const approved = (allClaims.data || []).filter(c => c.status === 'approved')
      const rejected = (allClaims.data || []).filter(c => c.status === 'rejected')
      setApprovedClaims(approved)
      setRejectedClaims(rejected)
      
      // Fetch total users count from Supabase Auth
      try {
        const { data: allAuthUsers, error: authError } = await supabase.rpc('get_all_auth_users')
        
        if (!authError && allAuthUsers && Array.isArray(allAuthUsers)) {
          setTotalUsersCount(allAuthUsers.length)
        } else if (authError) {
          // Fallback: try alternative RPC name
          const { data: altUsers, error: altError } = await supabase.rpc('get_all_users')
          
          if (!altError && altUsers && Array.isArray(altUsers)) {
            setTotalUsersCount(altUsers.length)
          } else {
            // Try to get count from profiles table as last resort
            const { count: profilesCount, error: profilesError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
            if (!profilesError && profilesCount !== null) {
              setTotalUsersCount(profilesCount)
            } else {
              setTotalUsersCount(0)
            }
          }
        } else {
          setTotalUsersCount(0)
        }
      } catch (userCountError) {
        console.error('Error fetching user count:', userCountError)
        setTotalUsersCount(0)
      }
    } catch (err) {
      console.warn('Failed to load admin data via Supabase', err)
      // Fallback to localStorage if Supabase fails
      const storedPending = JSON.parse(localStorage.getItem('pendingClaims') || '[]')
      const storedApproved = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
      const storedRejected = JSON.parse(localStorage.getItem('rejectedClaims') || '[]')
      setPendingClaims(storedPending)
      setApprovedClaims(storedApproved)
      setRejectedClaims(storedRejected)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Fetch all users when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      const fetchUsers = async () => {
        setLoadingUsers(true)
        try {
          const response = await userAPI.getAllUsers()
          let users = []
          
          if (Array.isArray(response)) {
            users = response
          } else if (response?.users && Array.isArray(response.users)) {
            users = response.users
          } else if (response?.data && Array.isArray(response.data)) {
            users = response.data
          }
          
          setAllUsers(users)
        } catch (error) {
          console.error('Error fetching users:', error)
          setAllUsers([])
        } finally {
          setLoadingUsers(false)
        }
      }
      fetchUsers()
    }
  }, [activeTab])

  // Fetch all items when items tab is active
  useEffect(() => {
    if (activeTab === 'items') {
      const fetchItems = async () => {
        setLoadingItems(true)
        try {
          const items = await itemsSupabase.getItems()
          setAllItems(items || [])
        } catch (error) {
          console.error('Error fetching items:', error)
          setAllItems([])
        } finally {
          setLoadingItems(false)
        }
      }
      fetchItems()
    }
  }, [activeTab])

  // Calculate statistics from real Supabase data + sample items
  const stats = useMemo(() => {
    const totalUsers = totalUsersCount
    const pendingClaimsCount = pendingClaims.length
    
    // Calculate commission from approved claims (platform fee is 1000 RWF per approved claim)
    const totalCommission = approvedClaims.length * 1000
    
    // Combine sample items with Supabase items
    const allSampleItems = [...(sampleItems.lost || []), ...(sampleItems.found || [])]
    const combinedItems = [...allItems, ...allSampleItems]
    
    // Get item IDs that have approved claims (these are the claimed/returned items)
    const itemsWithApprovedClaims = new Set(
      approvedClaims
        .map(claim => {
          // Handle both item_id and itemId, and also check item_name matching for sample items
          return claim.item_id || claim.itemId || null
        })
        .filter(Boolean)
        .map(id => String(id))
    )
    
    // Also check approved claims by item_name for sample items (since they might have null item_id)
    const approvedClaimItemNames = new Set(
      approvedClaims
        .map(claim => (claim.item_name || claim.itemName || '').toLowerCase().trim())
        .filter(Boolean)
    )
    
    const totalItems = combinedItems.length
    const lostItems = combinedItems.filter(item => item.type === 'lost').length
    const foundItems = combinedItems.filter(item => item.type === 'found').length
    
    // Count returned items = items with approved claims (claimed items)
    const returnedItemsArray = combinedItems.filter(item => {
      const itemId = String(item.id || item._id || '')
      const itemName = (item.itemName || item.item_name || '').toLowerCase().trim()
      
      // Check if item has an approved claim by ID
      const hasApprovedClaimById = itemsWithApprovedClaims.has(itemId)
      
      // Check if item has an approved claim by name (for sample items or items with null item_id)
      const hasApprovedClaimByName = approvedClaimItemNames.has(itemName)
      
      // Also check status as fallback
      const hasReturnedStatus = item.status === 'returned' || item.status === 'verified'
      
      return hasApprovedClaimById || hasApprovedClaimByName || hasReturnedStatus
    })
    const returnedItems = returnedItemsArray.length
    
    const activeItems = totalItems - returnedItems
    
    return {
      totalUsers,
      pendingClaimsCount,
      totalCommission,
      totalItems,
      lostItems,
      foundItems,
      returnedItems,
      activeItems
    }
    }, [pendingClaims, allItems, approvedClaims, totalUsersCount])

  const persist = (nextPending, nextApproved, nextRejected, nextVerifiedIds) => {
    localStorage.setItem('pendingClaims', JSON.stringify(nextPending))
    localStorage.setItem('approvedClaims', JSON.stringify(nextApproved))
    localStorage.setItem('rejectedClaims', JSON.stringify(nextRejected))
    if (nextVerifiedIds) {
      localStorage.setItem('verifiedItemIds', JSON.stringify(nextVerifiedIds))
    }
  }

  const handleApprove = async (claimId) => {
    const claim = pendingClaims.find(c => c.id === claimId)
    if (!claim) return
    
    try {
      const user = await authSupabase.getCurrentUser()
      if (!user) {
        alert(language === 'en' ? 'Please sign in to approve claims' : 'Nyamuneka winjire kugirango ukemure ibyifuzo')
        return
      }
      
      const reviewerId = user.id
      
      // Update claim in Supabase
      const approvedClaim = await claimsSupabase.approveClaim(claimId, reviewerId)
      
      // Update item status - mark as verified and returned
      if (claim.item_id) {
        try {
          await itemsSupabase.updateItem(claim.item_id, { 
            status: 'returned',
            verified: true
          })
        } catch (itemErr) {
          console.warn('Failed to update item status', itemErr)
        }
      }
      
      // Create notification for the claimant
      if (claim.claimant_id) {
        try {
          await notificationsSupabase.createNotification({
            user_id: claim.claimant_id,
            title: language === 'en' ? 'Claim Verified!' : 'Icyifuzo cyemejwe!',
            body: language === 'en' 
              ? `Your claim for "${claim.item_name || claim.itemName || 'item'}" has been approved by admin. The founder's contact is now visible.`
              : `Icyifuzo cyawe cya "${claim.item_name || claim.itemName || 'ikintu'}" cyemejwe na admin. Kontaki y'umwubatsi iboneka.`,
            notif_type: 'claim_approved',
            data: {
              claim_id: claimId,
              item_id: claim.item_id,
              item_name: claim.item_name || claim.itemName
            }
          })
        } catch (notifErr) {
          console.warn('Failed to create notification', notifErr)
        }
      }
      
      // Reload all data to get fresh state
      await loadAdminData()
      
      alert(language === 'en' ? 'Claim approved successfully' : 'Icyifuzo cyakemuwe neza')
    } catch (err) {
      console.error('Failed to approve claim', err)
      const errorMsg = err?.message || (language === 'en' ? 'Failed to approve claim' : 'Gukemura icyifuzo byanze')
      alert(`${language === 'en' ? 'Error:' : 'Ikosa:'} ${errorMsg}`)
    }
  }

  const handleReject = async (claimId) => {
    const claim = pendingClaims.find(c => c.id === claimId)
    if (!claim) return
    
    try {
      const user = await authSupabase.getCurrentUser()
      if (!user) {
        alert(language === 'en' ? 'Please sign in to reject claims' : 'Nyamuneka winjire kugirango wange ibyifuzo')
        return
      }
      
      const reviewerId = user.id
      
      // Update claim in Supabase
      await claimsSupabase.rejectClaim(claimId, reviewerId)
      
      // Reload all data to get fresh state
      await loadAdminData()
      
      alert(language === 'en' ? 'Claim rejected successfully' : 'Icyifuzo cyanjiwe neza')
    } catch (err) {
      console.error('Failed to reject claim', err)
      const errorMsg = err?.message || (language === 'en' ? 'Failed to reject claim' : 'Kwanga icyifuzo byanze')
      alert(`${language === 'en' ? 'Error:' : 'Ikosa:'} ${errorMsg}`)
    }
  }

  const handleViewUser = async (userId) => {
    try {
      const response = await userAPI.getUserById(userId)
      let user = null
      if (response.user) {
        user = response.user
      } else if (response.data) {
        user = response.data
      } else if (response._id || response.id) {
        user = response
      } else {
        user = allUsers.find(u => (u._id || u.id) === userId)
      }
      
      if (user) {
        alert(`${language === 'en' ? 'User Details' : 'Amakuru y\'Umukoresha'}\n\n${language === 'en' ? 'Name:' : 'Amazina:'} ${user.fullName || 'N/A'}\n${language === 'en' ? 'Email:' : 'Imeyili:'} ${user.email || 'N/A'}\n${language === 'en' ? 'Phone:' : 'Telefoni:'} ${user.phone || 'N/A'}\n${language === 'en' ? 'Role:' : 'Urwego:'} ${user.role || 'user'}\n${language === 'en' ? 'Verified:' : 'Byemejwe:'} ${user.verified || user.email_confirmed_at ? (language === 'en' ? 'Yes' : 'Yego') : (language === 'en' ? 'No' : 'Oya')}`)
      } else {
        alert(language === 'en' ? 'User not found' : 'Umukoresha ntabwo aboneka')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      const localUser = allUsers.find(u => (u._id || u.id) === userId)
      if (localUser) {
        alert(`${language === 'en' ? 'User Details' : 'Amakuru y\'Umukoresha'}\n\n${language === 'en' ? 'Name:' : 'Amazina:'} ${localUser.fullName || 'N/A'}\n${language === 'en' ? 'Email:' : 'Imeyili:'} ${localUser.email || 'N/A'}\n${language === 'en' ? 'Phone:' : 'Telefoni:'} ${localUser.phone || 'N/A'}\n${language === 'en' ? 'Role:' : 'Urwego:'} ${localUser.role || 'user'}`)
      } else {
        alert(language === 'en' ? 'Failed to load user details' : 'Kugenzura amakuru y\'umukoresha byanze')
      }
    }
  }

  const handleDeleteItem = async (itemId) => {
    const confirmMessage = language === 'en' 
      ? 'Are you sure you want to delete this item? This action cannot be undone.'
      : 'Urabyemera ko ushaka gusiba iki kintu? Iki gikorwa ntigishobora guhindurwa.'
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      // Check if it's a sample item (string ID like '1', '2', etc.)
      const isSampleItem = typeof itemId === 'string' && !itemId.includes('-')
      
      if (isSampleItem) {
        // For sample items, mark as deleted in localStorage
        const newDeleted = [...deletedSampleItems, itemId]
        setDeletedSampleItems(newDeleted)
        localStorage.setItem('deletedSampleItems', JSON.stringify(newDeleted))
        // Refresh items list
        const items = await itemsSupabase.getItems()
        setAllItems(items || [])
        alert(language === 'en' ? 'Item removed successfully' : 'Ikintu cyasibwe neza')
      } else {
        // For database items, delete from Supabase
        await itemsSupabase.deleteItem(itemId)
        const items = await itemsSupabase.getItems()
        setAllItems(items || [])
        alert(language === 'en' ? 'Item deleted successfully' : 'Ikintu cyasibwe neza')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert(language === 'en' ? 'Failed to delete item' : 'Gusiba ikintu byanze')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-4">
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
          {language === 'en' ? 'Admin Dashboard' : 'Dashboard ya Admin'}
        </h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Overview' : 'Incamake'}
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`whitespace-nowrap py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'claims'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Manage Claims' : 'Gucunga Ibyifuzo'}
              {pendingClaims.length > 0 && (
                <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {pendingClaims.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'users'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Manage Users' : 'Gucunga Abakoresha'}
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`whitespace-nowrap py-2 sm:py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'items'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Manage Items' : 'Gucunga Ibintu'}
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Users' : 'Abakoresha Bose'}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalUsersCount || stats.totalUsers || 0}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Pending Claims' : 'Ibyifuzo Bitegereje'}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pendingClaimsCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Commission' : 'Komisiyo Yose'}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalCommission.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Items' : 'Ibintu Byose'}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                {language === 'en' ? 'System Overview' : 'Incamake y\'Ikigo'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Lost Items' : 'Ibintu Byabuze'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.lostItems}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Found Items' : 'Ibintu Byabonetse'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.foundItems}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Active Items' : 'Ibintu Bikora'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.activeItems}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">{language === 'en' ? 'Returned Items' : 'Ibintu Byagarutse'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.returnedItems}</p>
                </div>
              </div>
            </div>
          </>
        )}

            {/* Manage Claims Tab */}
            {activeTab === 'claims' && (
              <section className="mb-6 sm:mb-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {language === 'en' ? 'Pending Claims' : 'Ibyifuzo Bitegereje'}
                  </h2>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {pendingClaims.length} {language === 'en' ? 'pending' : 'bitegereje'}
                  </span>
                </div>
                {pendingClaims.length === 0 ? (
                  <div className="border border-gray-200 rounded-lg p-4 sm:p-6 text-center text-gray-500">
                    {language === 'en' ? 'No claims awaiting verification.' : 'Nta byifuzo bitegereje ukemura.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pendingClaims.map(claim => (
                  <div key={claim.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    {claim.photo ? (
                      <img src={claim.photo} alt={claim.itemName} className="w-full h-40 object-cover" />
                    ) : null}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{claim.itemName}</h3>
                        <span className="text-xs text-gray-500">#{claim.itemId}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{claim.description}</p>
                      <div className="text-xs text-gray-500 mb-3">
                        <p>
                          {language === 'en' ? 'Claimant:' : 'Uwiyifuza:'} <span className="font-medium text-gray-900">{claim.fullName}</span> — {claim.phone}
                        </p>
                        {claim.ownerName ? (
                          <p>{language === 'en' ? 'Founder:' : 'Umwubatsi:'} {claim.ownerName}</p>
                        ) : null}
                        <p>{language === 'en' ? 'Submitted:' : 'Byoherejwe:'} {new Date(claim.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleReject(claim.id)} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-lg text-sm font-medium">
                          {language === 'en' ? 'Reject' : 'Wanga'}
                        </button>
                        <button onClick={() => handleApprove(claim.id)} className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2 rounded-lg text-sm font-medium">
                          {language === 'en' ? 'Approve' : 'Emeza'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Manage Users Tab */}
        {activeTab === 'users' && (
          <section className="mb-6 sm:mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {language === 'en' ? 'All Users' : 'Abakoresha Byose'}
              </h2>
              <span className="text-xs sm:text-sm text-gray-500">
                {allUsers.length} {language === 'en' ? 'users' : 'abakoresha'}
              </span>
            </div>
            {loadingUsers ? (
              <div className="border border-gray-200 rounded-lg p-4 sm:p-6 text-center text-gray-500">
                {language === 'en' ? 'Loading users...' : 'Gusoma abakoresha...'}
              </div>
            ) : allUsers.length === 0 ? (
              <div className="border border-gray-200 rounded-lg p-4 sm:p-6 text-center text-gray-500">
                {language === 'en' ? 'No users found.' : 'Nta bakoresha babonetse.'}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'en' ? 'Name' : 'Amazina'}
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'en' ? 'Email' : 'Imeyili'}
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'en' ? 'Phone' : 'Telefoni'}
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'en' ? 'Role' : 'Urwego'}
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'en' ? 'Actions' : 'Ibyakozwe'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((user, index) => {
                          const userId = user._id || user.id || `temp-${index}`
                          
                          return (
                            <tr key={userId || index} className="hover:bg-gray-50">
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 truncate max-w-xs">{user.email || 'N/A'}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role || 'user'}
                                </span>
                              </td>
                              <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button 
                                  onClick={() => handleViewUser(userId)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  {language === 'en' ? 'View' : 'Reba'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {allUsers.map((user, index) => {
                    const userId = user._id || user.id || `temp-${index}`
                    
                    return (
                      <div key={userId || index} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">{user.fullName || 'N/A'}</h3>
                            <p className="text-xs text-gray-500 truncate">{user.email || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ml-2 ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role || 'user'}
                          </span>
                        </div>
                        <div className="space-y-1 mb-3">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">{language === 'en' ? 'Phone:' : 'Telefoni:'}</span> {user.phone || 'N/A'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleViewUser(userId)}
                          className="w-full text-sm text-blue-600 hover:text-blue-900 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50"
                        >
                          {language === 'en' ? 'View Details' : 'Reba Amakuru'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Manage Items Tab */}
        {activeTab === 'items' && (() => {
          // Combine sample items with Supabase items (same as stats calculation)
          // Filter out deleted sample items
          const allSampleItems = [...(sampleItems.lost || []), ...(sampleItems.found || [])]
            .filter(sample => !deletedSampleItems.includes(sample.id))
          const combinedItems = [...allItems, ...allSampleItems]
          
          return (
            <section className="mb-6 sm:mb-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'All Items' : 'Ibintu Byose'}
                </h2>
                <span className="text-xs sm:text-sm text-gray-500">
                  {combinedItems.length} {language === 'en' ? 'items' : 'ibintu'}
                </span>
              </div>
              {loadingItems ? (
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 text-center text-gray-500">
                  {language === 'en' ? 'Loading items...' : 'Gusoma ibintu...'}
                </div>
              ) : combinedItems.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-4 sm:p-6 text-center text-gray-500">
                  {language === 'en' ? 'No items found.' : 'Nta bintu babonetse.'}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Item' : 'Ikintu'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Type' : 'Ubwoko'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Category' : 'Icyiciro'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Location' : 'Ahantu'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Status' : 'Imiterere'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Date' : 'Itariki'}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {language === 'en' ? 'Actions' : 'Ibyakozwe'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {combinedItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {item.photo && (
                                    <img 
                                      src={item.photo} 
                                      alt={item.item_name || item.itemName} 
                                      className="h-10 w-10 rounded object-cover mr-3"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.item_name || item.itemName || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500 line-clamp-1">
                                      {item.description || ''}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.type === 'lost' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.type === 'lost' 
                                    ? (language === 'en' ? 'Lost' : 'Byabuze')
                                    : (language === 'en' ? 'Found' : 'Byabonetse')
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{item.category || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{item.location || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  item.status === 'returned' || item.status === 'verified'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status === 'returned' || item.status === 'verified'
                                    ? (language === 'en' ? 'Returned' : 'Byagarutse')
                                    : item.status === 'active'
                                    ? (language === 'en' ? 'Active' : 'Bikora')
                                    : (item.status || 'N/A')
                                  }
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {item.event_date || item.date 
                                    ? new Date(item.event_date || item.date).toLocaleDateString()
                                    : item.created_at
                                    ? new Date(item.created_at).toLocaleDateString()
                                    : 'N/A'
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  {language === 'en' ? 'Delete' : 'Siba'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-3">
                    {combinedItems.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start gap-3 mb-3">
                          {item.photo && (
                            <img 
                              src={item.photo} 
                              alt={item.item_name || item.itemName} 
                              className="h-16 w-16 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {item.item_name || item.itemName || 'N/A'}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {item.description || ''}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                item.type === 'lost' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {item.type === 'lost' 
                                  ? (language === 'en' ? 'Lost' : 'Byabuze')
                                  : (language === 'en' ? 'Found' : 'Byabonetse')
                                }
                              </span>
                              <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                                item.status === 'returned' || item.status === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.status === 'returned' || item.status === 'verified'
                                  ? (language === 'en' ? 'Returned' : 'Byagarutse')
                                  : item.status === 'active'
                                  ? (language === 'en' ? 'Active' : 'Bikora')
                                  : (item.status || 'N/A')
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">{language === 'en' ? 'Category:' : 'Icyiciro:'}</span> {item.category || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">{language === 'en' ? 'Location:' : 'Ahantu:'}</span> {item.location || 'N/A'}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">{language === 'en' ? 'Date:' : 'Itariki:'}</span> {
                              item.event_date || item.date 
                                ? new Date(item.event_date || item.date).toLocaleDateString()
                                : item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : 'N/A'
                            }
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full text-sm text-red-600 hover:text-red-900 font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50"
                        >
                          {language === 'en' ? 'Delete' : 'Siba'}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )
        })()}
      </main>

      <Footer />
    </div>
  )
}

export default Admin
