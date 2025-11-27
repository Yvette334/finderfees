import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { authSupabase, itemsSupabase, claimsSupabase } from '../utils/supabaseAPI'
import { userAPI } from '../utils/api'

function Profile() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const u = await authSupabase.getCurrentUser()
        if (u) {
          setUserName(u.user_metadata?.fullName || u.email || '')
          setUserPhone(u.user_metadata?.phone || '')
          setUserEmail(u.email || '')
          // load user items and claims
          const items = await itemsSupabase.getItems({ userId: u.id })
          setMyItems(items || [])
          const claims = await claimsSupabase.getMyClaims(u.id)
          setMyClaims(claims || [])
        }
      } catch (err) {
        console.error('Failed to load profile data', err)
      }
    }
    loadProfile()
  }, [])

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow numbers
    if (value.length <= 10) {
      setUserPhone(value)
      if (value.length === 10) {
        // Validate phone starts with 078 or 073
        if (value.startsWith('078') || value.startsWith('073')) {
          setPhoneError('')
        } else {
          setPhoneError(language === 'en' 
            ? 'Phone number must start with 078 or 073' 
            : 'Numero ya telefoni igomba gutangira na 078 cyangwa 073')
        }
      } else if (value.length > 0) {
        setPhoneError(language === 'en' 
          ? 'Phone number must be 10 digits and start with 078 or 073' 
          : 'Numero ya telefoni igomba kuba inyuguti 10 kandi itangire na 078 cyangwa 073')
      } else {
        setPhoneError('')
      }
    }
  }

  const handleSave = async () => {
    // Validate phone number
    if (userPhone && userPhone.length !== 10) {
      setPhoneError(language === 'en' 
        ? 'Phone number must be exactly 10 digits' 
        : 'Numero ya telefoni igomba kuba inyuguti 10')
      return
    }
    
    // Validate phone starts with 078 or 073
    if (userPhone && !userPhone.startsWith('078') && !userPhone.startsWith('073')) {
      setPhoneError(language === 'en' 
        ? 'Phone number must start with 078 or 073' 
        : 'Numero ya telefoni igomba gutangira na 078 cyangwa 073')
      return
    }
    
    try {
      await userAPI.updateProfile({ fullName: userName, phone: userPhone })
      // Update local UI
      setIsEditing(false)
      setPhoneError('')
    } catch (error) {
      console.error('Profile update failed', error)
      alert(language === 'en' ? 'Failed to update profile' : 'Kugenzura profayili byanze')
    }
  }
  const [myItems, setMyItems] = useState([])
  const [myClaims, setMyClaims] = useState([])
    const myClaimsCount = myClaims.length
    const approvedCount = myClaims.filter(c => c.status === 'approved').length
  return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'My Profile' : 'Profayili Yange'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'en' ? 'Manage your account information' : 'Gucunga amakuru ya konti yawe'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">{myItems.length}</div>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'Items Reported' : 'Ibintu Byatangajwe'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">{myClaimsCount}</div>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'Total Claims' : 'Ibyifuzo Byose'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {approvedCount}
            </div>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'Items Recovered' : 'Ibintu Byagarutse'}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'en' ? 'Account Information' : 'Amakuru ya Konti'}
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {language === 'en' ? 'Edit Profile' : 'Guhindura Profayili'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  {language === 'en' ? 'Cancel' : 'Kureka'}
                </button>
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {language === 'en' ? 'Save Changes' : 'Bika Ihinduka'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Full Name' : 'Amazina Yuzuye'}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
              ) : (
                <p className="text-gray-900">{userName || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Phone Number' : 'Numero ya Telefoni'}
              </label>
              {isEditing ? (
                <>
                <input
                  type="tel"
                  value={userPhone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none transition-colors ${
                      phoneError ? 'border-red-500' : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                  )}
                  {!phoneError && userPhone.length > 0 && userPhone.length < 10 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'en' 
                        ? `${10 - userPhone.length} more digit${10 - userPhone.length > 1 ? 's' : ''} needed`
                        : `Hari inyuguti ${10 - userPhone.length} zisigaye`
                      }
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-900">{userPhone || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'en' ? 'Email' : 'Imeyili'}
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
              ) : (
                <p className="text-gray-900">{userEmail || '—'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {language === 'en' ? 'Account Settings' : 'Igenamiterere ya Konti'}
          </h2>
          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">
                {language === 'en' ? 'Go to Dashboard' : 'Genda ku Dashboard'}
              </span>
            </Link>
            <Link
              to="/search"
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">
                {language === 'en' ? 'Browse Items' : 'Shakisha Ibintu'}
              </span>
            </Link>
            <Link
              to="/messages"
              className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="font-medium text-gray-900">
                {language === 'en' ? 'Messages' : 'Amatangazo'}
              </span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Profile

