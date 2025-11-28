import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import AdminNavbar from '../components/AdminNavbar'
import Footer from '../components/footer'
import { authSupabase, claimsSupabase, itemsSupabase, notificationsSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'
import { sampleItems } from './Search'


function Admin() {
  const [pendingClaims, setPendingClaims] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const [rejectedClaims, setRejectedClaims] = useState([])
  const [allItems, setAllItems] = useState([])
  const [allPayments, setAllPayments] = useState([])
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
              onClick={() => setActiveTab('items')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
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

        {/* Manage Items Tab */}
        {activeTab === 'items' && (() => {
          // Combine sample items with Supabase items (same as stats calculation)
          // Filter out deleted sample items
          const allSampleItems = [...(sampleItems.lost || []), ...(sampleItems.found || [])]
            .filter(sample => !deletedSampleItems.includes(sample.id))
          const combinedItems = [...allItems, ...allSampleItems]
          
          return (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {language === 'en' ? 'All Items' : 'Ibintu Byose'}
                </h2>
                <span className="text-sm text-gray-500">
                  {combinedItems.length} {language === 'en' ? 'items' : 'ibintu'}
                </span>
              </div>
              {loadingItems ? (
                <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                  {language === 'en' ? 'Loading items...' : 'Gusoma ibintu...'}
                </div>
              ) : combinedItems.length === 0 ? (
                <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                  {language === 'en' ? 'No items found.' : 'Nta bintu babonetse.'}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
