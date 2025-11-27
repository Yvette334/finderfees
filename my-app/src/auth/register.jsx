import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'

function register() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authSupabase.getCurrentUser()
        if (user) {
          try {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
            const role = profile?.role?.toLowerCase?.() || profile?.role || ''
            if (role === 'admin') {
              navigate('/admin', { replace: true })
              return
            }
          } catch (e) {
            // ignore
          }
          navigate('/dashboard', { replace: true })
        }
      } catch (err) {
        // User not authenticated, continue to register page
      }
    }
    checkAuth()
  }, [navigate])

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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow numbers
    if (value.length <= 10) {
      setPhone(value)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate phone number
    if (phone.length !== 10) {
      setPhoneError(language === 'en' 
        ? 'Phone number must be exactly 10 digits' 
        : 'Numero ya telefoni igomba kuba inyuguti 10')
      return
    }
    
    // Validate phone starts with 078 or 073
    if (!phone.startsWith('078') && !phone.startsWith('073')) {
      setPhoneError(language === 'en' 
        ? 'Phone number must start with 078 or 073' 
        : 'Numero ya telefoni igomba gutangira na 078 cyangwa 073')
      return
    }
    
    setLoading(true)

    try {
      const res = await authSupabase.signUp({
        email,
        password,
        fullName,
        phone,
        language
      })
      // Registration successful - always redirect to login page
      // Don't auto-login the user, they should login manually
      alert(language === 'en' 
        ? 'Registration successful! Please login to continue.' 
        : 'Kwiyandikisha byagenze neza! Nyamuneka winjire kugirango ukomeze.')
      navigate('/login')
    } catch (err) {
      // Supabase error objects may be Error or contain message
      const message = err?.message || (err?.error && err.error.message) || (language === 'en' ? 'Registration failed' : 'Kwiyandikisha byanze')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

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
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Full name' : 'Amazina yuzuye'}
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'en' ? 'Enter the name' : 'Injiza amazina yawe'} 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Email' : 'Imeyili'}
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'en' ? 'Enter your email' : 'Injiza imeyili yawe'} 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Phone Number' : 'Numero ya telefoni'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={handlePhoneChange}
                placeholder={language === 'en' ? '0788123456' : '0788123456'} 
                required 
                maxLength={10}
                className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${
                  phoneError ? 'border-red-500' : 'border-gray-200 focus:border-gray-900'
                }`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
              {!phoneError && phone.length > 0 && phone.length < 10 && (
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'en' 
                    ? `${10 - phone.length} more digit${10 - phone.length > 1 ? 's' : ''} needed`
                    : `Hari inyuguti ${10 - phone.length} zisigaye`
                  }
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Password' : 'Ijambobanga'}
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength="6" 
                placeholder={language === 'en' ? 'Password' : 'Ijambobanga'} 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (language === 'en' ? 'Registering...' : 'Kwiyandikisha...') 
                : (language === 'en' ? 'Register' : 'Kwiyandikisha')
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default register