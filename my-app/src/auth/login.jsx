import { useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { authSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'

export default function Login() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authSupabase.getCurrentUser()
        if (user) {
          // Check role in auth metadata first
          const metaRole = user?.user_metadata?.role || user?.user_metadata?.role?.toLowerCase?.()
          if (metaRole && String(metaRole).toLowerCase() === 'admin') {
            navigate('/admin', { replace: true })
            return
          }
          // determine if user is admin and redirect accordingly
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle()

            const role = profile?.role?.toLowerCase?.() || profile?.role || ''
            if (!error && role === 'admin') {
              navigate('/admin', { replace: true })
            } else {
              navigate('/dashboard', { replace: true })
            }
          } catch (err) {
            // fallback to dashboard
            navigate('/dashboard', { replace: true })
          }
        }
      } catch (err) {
        // User not authenticated, continue to login page
      }
    }
    checkAuth()
  }, [navigate])

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('language', language)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
  }, [language])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Use Supabase for login to avoid relying on backend
      const res = await authSupabase.signIn(email, password)
        const user = res?.user || res?.data?.user
      if (user) {
        // store user
        try {
          localStorage.setItem('user', JSON.stringify(user))
        } catch (e) {}
        // fetch role
        const metaRole = user?.user_metadata?.role || user?.user_metadata?.role?.toLowerCase?.()
        if (metaRole && String(metaRole).toLowerCase() === 'admin') {
          navigate('/admin')
          return
        }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        const role = profile?.role?.toLowerCase?.() || profile?.role || ''
        if (!error && role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Login failed. Please check your credentials.' : 'Kwinjira byanze. Ongera ugerageze.'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setError(language === 'en' ? 'Please enter your email address' : 'Nyamuneka winjize imeyili yawe')
      return
    }

    setResetLoading(true)
    setError('')

    try {
      const { error } = await authSupabase.resetPassword(email)
      if (error) {
        setError(error.message || (language === 'en' ? 'Failed to send reset email' : 'Kohereza imeyili yongeyeho byanze'))
      } else {
        setResetEmailSent(true)
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Failed to send reset email' : 'Kohereza imeyili yongeyeho byanze'))
    } finally {
      setResetLoading(false)
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
                <button className="flex-1 px-6 py-4 text-center font-medium text-gray-900 bg-white rounded-tl-xl cursor-pointer shadow-sm">
                  {language === 'en' ? 'Login' : 'Injira'}
                </button>
                <Link to="/register" className="flex-1"><button className="w-full px-6 py-4 text-center font-medium text-gray-900 bg-gray-100 rounded-tr-xl cursor-pointer hover:bg-gray-200 transition-colors">
                  {language === 'en' ? 'Register' : 'Kwiyandikisha'}
                </button></Link>
            </div>
            <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {language === 'en' ? 'Welcome Back' : 'Murakaza neza'}
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  {language === 'en' ? 'Login to your Finders Fee account' : 'Injira kuri konti yawe kuri Finders Fee'}
                </p>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-semibold text-gray-900">
                            {language === 'en' ? 'Password' : 'Ijambobanga'}
                          </label>
                          {!showForgotPassword && (
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs text-gray-600 hover:text-gray-900"
                            >
                              {language === 'en' ? 'Forgot password?' : 'Wibagiwe ijambobanga?'}
                            </button>
                          )}
                        </div>
                        {!showForgotPassword ? (
                          <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            placeholder={language === 'en' ? 'Password' : 'Ijambobanga'} 
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" 
                          />
                        ) : (
                          <div className="space-y-4">
                            {resetEmailSent ? (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800 mb-2">
                                  {language === 'en' 
                                    ? 'Password reset email sent! Check your inbox and follow the instructions to reset your password.'
                                    : 'Ineyili yongeyeho ijambobanga yoherejwe! Reba mu inbox yawe ukurikire amabwiriza kugirango wongereho ijambobanga.'
                                  }
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowForgotPassword(false)
                                    setResetEmailSent(false)
                                  }}
                                  className="text-sm text-green-700 hover:text-green-900 underline"
                                >
                                  {language === 'en' ? 'Back to login' : 'Subira ku kwinjira'}
                                </button>
                              </div>
                            ) : (
                              <>
                                <input 
                                  type="email" 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder={language === 'en' ? 'Enter your email' : 'Injiza imeyili yawe'} 
                                  required 
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-gray-900 transition-colors" 
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className="flex-1 bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
                                  >
                                    {language === 'en' ? 'Cancel' : 'Kureka'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={resetLoading || !email}
                                    className="flex-1 bg-black text-white py-2 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                  >
                                    {resetLoading 
                                      ? (language === 'en' ? 'Sending...' : 'Kohereza...')
                                      : (language === 'en' ? 'Send Reset Link' : 'Kohereza Ihuza')
                                    }
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                    </div>
                    {!showForgotPassword && (
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading 
                          ? (language === 'en' ? 'Logging in...' : 'Kwinjira...')
                          : (language === 'en' ? 'Login' : 'Injira')
                        }
                      </button>
                    )}
                </form>
            </div>

        </div>
    </div>
  )
}
