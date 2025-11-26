import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function register() {
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

  // Save language to localStorage when changed
  useEffect(() => {
    localStorage.setItem('language', language)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
  }, [language])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer outline-none"
        >
          <option value="en">English</option>
          <option value="rw">Kinyarwanda</option>
        </select>
      </div>
      <div className="w-full max-w-md bg-white border rounded-xl overflow-hidden">
        <div className="flex">
          <Link to="/login" className="flex-1"><button className="w-full px-6 py-4 text-center font-medium text-gray-900 bg-gray-100 rounded-tl-xl cursor-pointer hover:bg-gray-200 transition-colors">
            {language === 'en' ? 'Login' : 'Injira'}
          </button></Link>
          <button className="flex-1 px-6 py-4 text-center font-medium text-gray-900 bg-white rounded-tr-xl cursor-pointer shadow-sm">
            {language === 'en' ? 'Register' : 'Kwiyandikisha'}
          </button>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {language === 'en' ? 'Create Account' : 'Kora Konti'}
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {language === 'en' ? 'Create your Finders Fee account' : 'Kora konti yawe ya Finders Fee'}
          </p>
          <form className="space-y-5">
            <div >
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Full name' : 'Amazina yuzuye'}
              </label>
              <input type="text" name="name" placeholder={language === 'en' ? 'Enter the name' : 'Injiza amazina yawe'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" />
            </div>
            <div >
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Email' : 'Imeyili'}
              </label>
              <input type="email" name="email" placeholder={language === 'en' ? 'Enter your email' : 'Injiza imeyili yawe'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" />
            </div>
            <div >
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Phone Number' : 'Numero ya telefoni'}
              </label>
              <input type="number" name="phone" placeholder={language === 'en' ? '0788123456' : '0788123456'} required className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" />
            </div>
            <div >
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Password' : 'Ijambobanga'}
              </label>
              <input type="password" name="password" required minLength="6" placeholder={language === 'en' ? 'Password' : 'Ijambobanga'} className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" />
            </div>
            <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              {language === 'en' ? 'Register' : 'Kwiyandikisha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default register