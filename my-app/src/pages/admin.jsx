import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AdminNavbar from '../components/AdminNavbar'
import Footer from '../components/footer'
import { authAPI, userAPI } from '../utils/api'
import { authSupabase, claimsSupabase, itemsSupabase, notificationsSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'
import { sampleItems } from './search'

function Admin() {
  const [pendingClaims, setPendingClaims] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const [rejectedClaims, setRejectedClaims] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [allItems, setAllItems] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
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

  // Fetch all users from database on component mount and when users tab is active
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        console.log('Fetching all users from database...')
        const response = await userAPI.getAllUsers()
        let users = []
        
        if (Array.isArray(response)) {
          users = response
        } else if (response?.users && Array.isArray(response.users)) {
          users = response.users
        } else if (response?.data && Array.isArray(response.data)) {
          users = response.data
        }
        
        console.log(`Fetched ${users.length} users from database`, users)
        
        // Ensure current user is included if not already in the list
        const currentUser = authAPI.getCurrentUser()
        if (currentUser) {
          const currentUserId = currentUser._id || currentUser.id
          const userExists = users.some(u => {
            const uid = u._id || u.id
            return uid && (String(uid) === String(currentUserId) || uid === currentUserId)
          })
          if (!userExists && currentUserId) {
            // Add current user if not found
            users = [{
              id: currentUserId,
              _id: currentUserId,
              email: currentUser.email || '',
              fullName: currentUser.fullName || currentUser.email || 'Current User',
              phone: currentUser.phone || '',
              role: null,
              verified: true,
              ...currentUser
            }, ...users]
          }
        }
        
        // Sort by creation date (newest first)
        users.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0)
          const dateB = new Date(b.created_at || b.updated_at || 0)
          return dateB - dateA
        })
        
        setAllUsers(users)
      } catch (error) {
        console.error('Error fetching users:', error)
        // Fallback to local storage if available
        try {
          const localUsers = JSON.parse(localStorage.getItem('users') || '[]')
          setAllUsers(localUsers)
        } catch (e) {
          console.error('Failed to load local users:', e)
          setAllUsers([])
        }
      } finally {
        setLoadingUsers(false)
      }
    }
    
    // Fetch users on mount and when users tab becomes active
    fetchUsers()
  }, [activeTab])

  // Calculate statistics from real Supabase data + sample items
  const stats = useMemo(() => {
    const totalUsers = allUsers.length || 0
    const pendingClaimsCount = pendingClaims.length
    
    // Calculate commission from approved claims (platform fee is 1000 RWF per approved claim)
    const totalCommission = approvedClaims.length * 1000
    
    // Combine sample items with Supabase items
    const allSampleItems = [...(sampleItems.lost || []), ...(sampleItems.found || [])]
    const combinedItems = [...allItems, ...allSampleItems]
    
    const totalItems = combinedItems.length
    const lostItems = combinedItems.filter(item => item.type === 'lost').length
    const foundItems = combinedItems.filter(item => item.type === 'found').length
    const returnedItems = combinedItems.filter(item => item.status === 'returned' || item.status === 'verified').length
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
  }, [pendingClaims, allUsers, allItems, approvedClaims])

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
        alert(`${language === 'en' ? 'User:' : 'Umukoresha:'} ${user.fullName}\n${language === 'en' ? 'Email:' : 'Imeyili:'} ${user.email}\n${language === 'en' ? 'Phone:' : 'Telefoni:'} ${user.phone || 'N/A'}`)
      } else {
        alert(language === 'en' ? 'User not found' : 'Umukoresha ntabwo aboneka')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      const localUser = allUsers.find(u => (u._id || u.id) === userId)
      if (localUser) {
        alert(`${language === 'en' ? 'User:' : 'Umukoresha:'} ${localUser.fullName}\n${language === 'en' ? 'Email:' : 'Imeyili:'} ${localUser.email}\n${language === 'en' ? 'Phone:' : 'Telefoni:'} ${localUser.phone || 'N/A'}`)
      } else {
        alert(language === 'en' ? 'Failed to load user details' : 'Kugenzura amakuru y\'umukoresha byanze')
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    const confirmMessage = language === 'en' 
      ? 'Are you sure you want to delete this user? This action cannot be undone.'
      : 'Urabyemera ko ushaka gusiba uyu mukoresha? Iki gikorwa ntigishobora guhindurwa.'
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await userAPI.deleteUser(userId)
      setAllUsers(allUsers.filter(user => {
        const uid = user._id || user.id
        return uid && uid.toString() !== userId.toString()
      }))
      alert(language === 'en' ? 'User deleted successfully' : 'Umukoresha yasibwe neza')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert(language === 'en' ? 'Failed to delete user' : 'Gusiba umukoresha byanze')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="mb-4">
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {language === 'en' ? 'Admin Dashboard' : 'Dashboard ya Admin'}
        </h1>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Overview' : 'Incamake'}
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'claims'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Manage Claims' : 'Gucunga Ibyifuzo'}
              {pendingClaims.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {pendingClaims.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {language === 'en' ? 'Manage Users' : 'Gucunga Abakoresha'}
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Users' : 'Abakoresha Bose'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Pending Claims' : 'Ibyifuzo Bitegereje'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingClaimsCount}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Commission' : 'Komisiyo Yose'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCommission.toLocaleString()} RWF</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Items' : 'Ibintu Byose'}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>

            {/* System Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'System Overview' : 'Incamake y\'Ikigo'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Lost Items' : 'Ibintu Byabuze'}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lostItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Found Items' : 'Ibintu Byabonetse'}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.foundItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Active Items' : 'Ibintu Bikora'}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeItems}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Returned Items' : 'Ibintu Byagarutse'}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.returnedItems}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Manage Claims Tab */}
        {activeTab === 'claims' && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'en' ? 'Pending Claims' : 'Ibyifuzo Bitegereje'}
              </h2>
              <span className="text-sm text-gray-500">
                {pendingClaims.length} {language === 'en' ? 'pending' : 'bitegereje'}
              </span>
            </div>
            {pendingClaims.length === 0 ? (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                {language === 'en' ? 'No claims awaiting verification.' : 'Nta byifuzo bitegereje ukemura.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {language === 'en' ? 'All Users' : 'Abakoresha Byose'}
              </h2>
              <span className="text-sm text-gray-500">
                {allUsers.length} {language === 'en' ? 'users' : 'abakoresha'}
              </span>
            </div>
            {loadingUsers ? (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                {language === 'en' ? 'Loading users...' : 'Gusoma abakoresha...'}
              </div>
            ) : allUsers.length === 0 ? (
              <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                {language === 'en' ? 'No users found.' : 'Nta bakoresha babonetse.'}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Name' : 'Amazina'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Email' : 'Imeyili'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Phone' : 'Telefoni'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Role' : 'Urwego'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Verified' : 'Byemejwe'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === 'en' ? 'Actions' : 'Ibyakozwe'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          {language === 'en' ? 'No users found' : 'Nta bakoresha babonetse'}
                        </td>
                      </tr>
                    ) : (
                      allUsers.map((user, index) => {
                        const userId = user._id || user.id || `temp-${index}`
                        const currentUser = authAPI.getCurrentUser()
                        const currentUserId = currentUser?._id || currentUser?.id
                        const isCurrentUser = currentUserId && (
                          currentUserId === userId || 
                          currentUserId.toString() === userId.toString() ||
                          (user.email && currentUser?.email === user.email) ||
                          (user.phone && currentUser?.phone === user.phone)
                        )
                        
                        return (
                          <tr key={userId || index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role || 'user'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.verified || user.email_confirmed_at
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.verified || user.email_confirmed_at
                                  ? (language === 'en' ? 'Verified' : 'Byemejwe')
                                  : (language === 'en' ? 'Unverified' : 'Ntibyemejwe')
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => handleViewUser(userId)}
                                className="text-blue-600 hover:text-blue-900 mr-3 font-medium"
                              >
                                {language === 'en' ? 'View' : 'Reba'}
                              </button>
                              {!isCurrentUser && (
                                <button 
                                  onClick={() => handleDeleteUser(userId)}
                                  className="text-red-600 hover:text-red-900 font-medium"
                                >
                                  {language === 'en' ? 'Delete' : 'Siba'}
                                </button>
                              )}
                              {isCurrentUser && (
                                <span className="text-gray-400 text-xs italic">
                                  {language === 'en' ? '(Current User)' : '(Umukoresha wa None)'}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default Admin
