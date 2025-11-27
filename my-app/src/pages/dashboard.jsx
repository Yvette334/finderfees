import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { authAPI, statisticsAPI } from '../utils/api'
import { authSupabase, itemsSupabase, claimsSupabase, notificationsSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'

function Dashboard() {
  const navigate = useNavigate()
  const cachedUser = authAPI.getCurrentUser()
  const [userName, setUserName] = useState(cachedUser?.fullName || cachedUser?.email || '')
  const [userPhone, setUserPhone] = useState(cachedUser?.phone || '')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  useEffect(() => {
    const load = async () => {
      try {
        const u = await authSupabase.getCurrentUser()
        if (u) {
          // Check role in user metadata first; if admin redirect
          const metaRole = u?.user_metadata?.role || u?.user_metadata?.role?.toLowerCase?.()
          if (metaRole && String(metaRole).toLowerCase() === 'admin') {
            navigate('/admin')
            return
          }
          // Check role and redirect to admin if required
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).maybeSingle()
            const role = profile?.role?.toLowerCase?.() || profile?.role || ''
            if (role === 'admin') {
              navigate('/admin')
              return
            }
          } catch (e) {
            // ignore role lookup errors; continue to load dashboard
          }
          setCurrentUserId(u.id)
          setUserName(u.user_metadata?.fullName || u.email || '')
          setUserPhone(u.user_metadata?.phone || '')
          // load user's items and claims
          const items = await itemsSupabase.getItems({ userId: u.id })
          setReportedItems(items || [])
          const myClaims = await claimsSupabase.getMyClaims(u.id)
          setMyClaims(myClaims || [])
          const stats = await statisticsAPI.getMyStats()
          setMyStats(stats || {})
        }
      } catch (err) {
        console.error('Dashboard data load failed', err)
      }
    }
    load()
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  const [reportedItems, setReportedItems] = useState([])
  const [currentUserId, setCurrentUserId] = useState(cachedUser?.id || null)
  const [notifications, setNotifications] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const verifiedSet = useMemo(() => new Set(JSON.parse(localStorage.getItem('verifiedItemIds') || '[]')), [])
  const paidItemsSet = useMemo(() => new Set(JSON.parse(localStorage.getItem('paidItems') || '[]')), [])
  const [myStats, setMyStats] = useState({
    totalEarnings: 0,
    pendingClaims: 0,
    approvedClaims: 0,
    returnedItems: 0,
    totalItems: 0
  })
  const [myClaims, setMyClaims] = useState([])
  
  // Fetch notifications and approved claims
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = await authSupabase.getCurrentUser()
        if (user) {
          const notifs = await notificationsSupabase.getNotifications(user.id)
          setNotifications(notifs || [])
          
          // Also fetch approved claims to check item status
          const { data: claimsData } = await supabase
            .from('claims')
            .select('*')
            .eq('status', 'approved')
          setApprovedClaims(claimsData || [])
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }
    fetchNotifications()
  }, [])
  
  const isItemClaimed = (item) => {
    if (!item) return false
    if (typeof item.status === 'string' && (item.status.toLowerCase() === 'returned' || item.status.toLowerCase() === 'verified')) return true
    if (approvedClaims.some(c => c.item_id === item.id || c.itemId === item.id)) return true
    if (paidItemsSet.has(item.id)) return true
    if (verifiedSet.has(item.id)) return true
    return false
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(language === 'en'
      ? 'Delete this item? This cannot be undone.'
      : 'Ushaka gusiba iki kintu? Ntibishobora gusubizwa.')) {
      return
    }

    try {
      await itemsSupabase.deleteItem(itemId)
      setReportedItems(prev => prev.filter(item => item.id !== itemId))
      const stored = JSON.parse(localStorage.getItem('reportedItems') || '[]')
        .filter(item => (item.id || item._id) !== itemId)
      localStorage.setItem('reportedItems', JSON.stringify(stored))
    } catch (error) {
      console.error('Delete item failed', error)
      alert(language === 'en' ? 'Failed to delete item' : 'Gusiba ikintu byanze')
    }
  }
  const filterMine = (list) => list || []
  const myPending = myClaims.filter(c => c.status === 'pending')
  const myApproved = myClaims.filter(c => c.status === 'approved')
  const myRejected = myClaims.filter(c => c.status === 'rejected')

  const [showNotification, setShowNotification] = useState(false)
  const [latestNotification, setLatestNotification] = useState(null)

  useEffect(() => {
    // Check for unread notifications from Supabase
    const unreadNotifs = notifications.filter(n => !n.read_at)
    if (unreadNotifs.length > 0) {
      const latest = unreadNotifs[0]
      setLatestNotification(latest)
      setShowNotification(true)
    } else {
      // Fallback to approved claims check
      const viewedIds = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
      const newApproved = myApproved.find(claim => !viewedIds.includes(claim.id))
      
      if (newApproved) {
        setLatestNotification({
          title: language === 'en' ? 'Claim Verified!' : 'Icyifuzo cyemejwe!',
          body: language === 'en' 
            ? `Your claim for "${newApproved.item_name || newApproved.itemName}" has been approved by admin.`
            : `Icyifuzo cyawe cya "${newApproved.item_name || newApproved.itemName}" cyemejwe na admin.`,
          notif_type: 'claim_approved',
          data: { claimId: newApproved.id, itemName: newApproved.item_name || newApproved.itemName }
        })
        setShowNotification(true)
      }
    }
  }, [notifications, myApproved, language])

  const dismissNotification = async () => {
    if (latestNotification) {
      // Mark notification as read in Supabase if it has an id
      if (latestNotification.id) {
        try {
          await notificationsSupabase.markAsRead(latestNotification.id)
          // Reload notifications
          const user = await authSupabase.getCurrentUser()
          if (user) {
            const notifs = await notificationsSupabase.getNotifications(user.id)
            setNotifications(notifs || [])
          }
        } catch (err) {
          console.error('Failed to mark notification as read', err)
        }
      } else {
        // Fallback for legacy approved claims
        const viewedIds = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
        if (latestNotification.data?.claimId && !viewedIds.includes(latestNotification.data.claimId)) {
          viewedIds.push(latestNotification.data.claimId)
          localStorage.setItem('viewedNotifications', JSON.stringify(viewedIds))
        }
      }
    }
    setShowNotification(false)
  }

  const totalItems = reportedItems.length
  const itemsReturned = myApproved.length
  const totalRewards = myStats.totalEarnings || myApproved.reduce((sum, c) => sum + (c.reward || 0), 0)

  const recentItems = [...reportedItems]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 6)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        {showNotification && latestNotification && (
          <div className={`mb-6 border-l-4 p-4 rounded-lg flex items-center justify-between ${
            latestNotification.notif_type === 'claim_approved' 
              ? 'bg-green-50 border-green-500' 
              : latestNotification.notif_type === 'claim_rejected'
              ? 'bg-red-50 border-red-500'
              : 'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className={latestNotification.notif_type === 'claim_approved' ? 'text-green-600' : latestNotification.notif_type === 'claim_rejected' ? 'text-red-600' : 'text-blue-600'}>
                {latestNotification.notif_type === 'claim_approved' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : latestNotification.notif_type === 'claim_rejected' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-semibold ${
                  latestNotification.notif_type === 'claim_approved' ? 'text-green-900' : 
                  latestNotification.notif_type === 'claim_rejected' ? 'text-red-900' : 
                  'text-blue-900'
                }`}>{latestNotification.title}</p>
                <p className={`text-sm ${
                  latestNotification.notif_type === 'claim_approved' ? 'text-green-700' : 
                  latestNotification.notif_type === 'claim_rejected' ? 'text-red-700' : 
                  'text-blue-700'
                }`}>{latestNotification.body}</p>
                {latestNotification.notif_type === 'claim_approved' && latestNotification.data && (
                  <div className="flex gap-2 mt-2">
                    <Link
                      to="/payment"
                      state={{
                        claimId: latestNotification.data.claim_id || latestNotification.data.claimId,
                        itemName: latestNotification.data.item_name || latestNotification.data.itemName,
                        ownerName: latestNotification.data.ownerName
                      }}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium transition-colors"
                    >
                      {language === 'en' ? 'Pay Now' : 'Kwishyura None'}
                    </Link>
                    <Link
                      to="/search"
                      className="text-xs bg-white hover:bg-gray-100 text-green-700 border border-green-600 px-3 py-1 rounded font-medium transition-colors"
                    >
                      {language === 'en' ? 'View Item' : 'Reba Ikintu'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={dismissNotification}
              className={`font-medium text-sm ${
                latestNotification.notif_type === 'claim_approved' ? 'text-green-700 hover:text-green-900' : 
                latestNotification.notif_type === 'claim_rejected' ? 'text-red-700 hover:text-red-900' : 
                'text-blue-700 hover:text-blue-900'
              }`}
            >
              {language === 'en' ? 'Dismiss' : 'Guhagarika'}
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? `Welcome back, ${userName || 'User'}!` : `Murakaza neza, ${userName || 'Mukoresha'}!`}
          </h1>
          <p className="text-gray-600">
            {language === 'en' 
              ? 'Manage your lost and found items from your dashboard'
              : 'Gucunga ibintu byabuze kandi byabonetse kuri dashboard yawe'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link 
            to="/report/lost"
            className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4 hover:border-gray-300 transition-colors text-left"
          >
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">+</div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Report an Item' : 'Tangaza Ikintu'}</p>
              <p className="text-sm text-gray-500">{language === 'en' ? 'Lost or found something?' : 'Wabuze cyangwa wabonye ikintu?'}</p>
            </div>
          </Link>
          <Link 
            to="/search"
            className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4 hover:border-gray-300 transition-colors text-left"
          >
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🔍</div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'Browse Items' : 'Shakisha Ibintu'}</p>
              <p className="text-sm text-gray-500">{language === 'en' ? 'Search for your lost items' : 'Shakisha ibintu byawe byabuze'}</p>
            </div>
          </Link>
          <Link 
            to="/profile"
            className="bg-white border border-gray-200 rounded-xl p-6 flex items-start gap-4 hover:border-gray-300 transition-colors text-left"
          >
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">👤</div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">{language === 'en' ? 'My Profile' : 'Profayili Yange'}</p>
              <p className="text-sm text-gray-500">{language === 'en' ? 'Manage your account' : 'Gucunga konti yawe'}</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Items' : 'Ibintu Byose'}</p>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Items Returned' : 'Ibintu Byagarutse'}</p>
            <p className="text-2xl font-bold text-gray-900">{itemsReturned}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">{language === 'en' ? 'Total Rewards Earned' : 'Ibihembo Byose'}</p>
            <p className="text-2xl font-bold text-gray-900">{totalRewards.toLocaleString()} RWF</p>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{language === 'en' ? 'Recent Items' : 'Ibintu Bishya'}</h2>
            <Link to="/search" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              {language === 'en' ? 'View All' : 'Reba Byose'}
            </Link>
          </div>
          
          {recentItems.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              {language === 'en' 
                ? 'No items reported yet. Click "Report an Item" to get started.'
                : 'Nta bintu byatangajwe. Kanda "Tangaza Ikintu" kugirango utangire.'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map(item => {
                const claimed = isItemClaimed(item)
                const canDelete = currentUserId && (item.user_id === currentUserId || item.userId === currentUserId)
                return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {item.photo ? (
                    <img 
                      src={item.photo} 
                      alt={item.itemName}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                      {item.itemName}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === 'lost' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-900 text-white'
                      }`}>
                        {item.type === 'lost' 
                          ? (language === 'en' ? 'Lost' : 'Byabuze')
                          : (language === 'en' ? 'Found' : 'Byabonetse')
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          claimed ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {claimed
                            ? (language === 'en' ? 'Claimed' : 'Cyamaze gufatwa')
                            : (language === 'en' ? 'Available' : 'Kiraboneka')}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            {language === 'en' ? 'Delete' : 'Siba'}
                          </button>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.itemName}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      <p>📍 {item.location}</p>
                      <p>📅 {item.date ? new Date(item.date).toLocaleDateString() : (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—')}</p>
                    </div>
                    {item.reward && (
                      <div className="pt-3 border-t border-gray-200 mb-3">
                        <p className="text-sm font-semibold text-green-600">
                          {language === 'en' ? 'Reward:' : 'Igihembo:'} {item.reward.toLocaleString()} RWF
                        </p>
                      </div>
                    )}
                    {!claimed ? (
                      <button
                        onClick={() => {
                          navigate('/verify', { state: { itemId: item.id, itemName: item.itemName, ownerName: item.userName, photo: item.photo, itemType: item.type } })
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm mt-3"
                      >
                        {language === 'en' ? 'Claim This Item' : 'Fata Iki Kintu'}
                      </button>
                    ) : (
                      <div className="w-full text-center text-sm text-gray-600 border border-gray-200 rounded-lg py-2 mt-3">
                        {language === 'en' ? 'Already claimed' : 'Cyamaze gufatwa'}
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default Dashboard
