import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function Profile() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || '')
    setUserPhone(localStorage.getItem('userPhone') || '')
    setUserEmail(localStorage.getItem('userEmail') || '')
  }, [])

  const handleSave = () => {
    localStorage.setItem('userName', userName)
    localStorage.setItem('userPhone', userPhone)
    localStorage.setItem('userEmail', userEmail)
    setIsEditing(false)
  }

  const reportedItems = JSON.parse(localStorage.getItem('reportedItems') || '[]')
  const myItems = reportedItems.filter(item => 
    item.userName === userName || item.userPhone === userPhone
  )

  const claims = {
    pending: JSON.parse(localStorage.getItem('pendingClaims') || '[]'),
    approved: JSON.parse(localStorage.getItem('approvedClaims') || '[]'),
    rejected: JSON.parse(localStorage.getItem('rejectedClaims') || '[]'),
  }

  const filterMine = (list) => {
    if (userPhone) return list.filter(c => c.phone === userPhone)
    if (userName) return list.filter(c => c.fullName === userName)
    return []
  }

  const myClaims = filterMine(claims.pending).length + filterMine(claims.approved).length + filterMine(claims.rejected).length

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
            <div className="text-2xl font-bold text-gray-900 mb-1">{myClaims}</div>
            <div className="text-sm text-gray-500">
              {language === 'en' ? 'Total Claims' : 'Ibyifuzo Byose'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {filterMine(claims.approved).length}
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
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                />
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

