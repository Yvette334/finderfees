import { useState, useMemo, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { authAPI } from '../utils/api'

function Navbar() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('language', language)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
  }, [language])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentUser = authAPI.getCurrentUser()
  const userName = currentUser?.fullName || ''
  const userPhone = currentUser?.phone || ''

  const claims = useMemo(() => ({
    approved: JSON.parse(localStorage.getItem('approvedClaims') || '[]'),
  }), [])

  const filterMine = (list) => {
    if (userPhone) return list.filter(c => c.phone === userPhone)
    if (userName) return list.filter(c => c.fullName === userName)
    return []
  }

  const myApproved = filterMine(claims.approved)

  const notifications = useMemo(() => {
    const viewedIds = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
    return myApproved.filter(claim => !viewedIds.includes(claim.id))
  }, [myApproved])

  const unreadCount = notifications.length

  const markAsRead = (claimId) => {
    const viewedIds = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
    if (!viewedIds.includes(claimId)) {
      viewedIds.push(claimId)
      localStorage.setItem('viewedNotifications', JSON.stringify(viewedIds))
    }
    setShowNotificationDropdown(false)
    window.location.reload()
  }

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    const viewedIds = JSON.parse(localStorage.getItem('viewedNotifications') || '[]')
    const newViewedIds = [...new Set([...viewedIds, ...allIds])]
    localStorage.setItem('viewedNotifications', JSON.stringify(newViewedIds))
    setShowNotificationDropdown(false)
    window.location.reload()
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h1 className="text-lg font-semibold text-gray-900">Finders Fee</h1>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/" className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Home' : 'Ahabanza'}
          </Link>
          <Link to="/search" className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Search' : 'Shakisha'}
          </Link>
          <Link to="/dashboard" className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Dashboard' : 'Ikibaho'}
          </Link>
          <Link to="/profile" className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900">
            {language === 'en' ? 'Profile' : 'Profayili'}
          </Link>
          
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {language === 'en' ? 'Notifications' : 'Amatangazo'}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gray-600 hover:text-gray-900"
                    >
                      {language === 'en' ? 'Mark all as read' : "Guhagarika byose nk'aho byasomwe"}
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {language === 'en' ? 'No new notifications' : 'Nta tangazo rishya'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-green-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {language === 'en' ? 'Claim Verified!' : 'Icyifuzo cyemejwe!'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {language === 'en' 
                                ? `Your claim for "${notification.itemName}" has been approved.`
                                : `Icyifuzo cyawe cya "${notification.itemName}" cyemejwe.`
                              }
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.approvedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Link 
            to="/"
              onClick={() => authAPI.logout()}
            className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity inline-block"
            >
              {language === 'en' ? 'Logout' : 'Sohoka'}
          </Link>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer outline-none"
          >
            <option value="en">English</option>
            <option value="rw">Kinyarwanda</option>
            </select>
        </div>
      </nav>
    </header>
  )
}

export default Navbar