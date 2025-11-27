import { useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { authAPI } from '../utils/api'

export default function Login() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      const response = await authAPI.login(email, password)
      if (response.token) {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Login failed. Please check your credentials.' : 'Kwinjira byanze. Ongera ugerageze.'))
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
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                          {language === 'en' ? 'Password' : 'Ijambobanga'}
                        </label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required 
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
                        ? (language === 'en' ? 'Logging in...' : 'Kwinjira...')
                        : (language === 'en' ? 'Login' : 'Injira')
                      }
                    </button>
                </form>
            </div>

        </div>
    </div>
  )
}
