import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { authSupabase } from '../utils/supabaseAPI'

function AdminNavbar() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  useEffect(() => {
    localStorage.setItem('language', language)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
  }, [language])

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h1 className="text-lg font-semibold text-gray-900">Finders Fee Admin</h1>
        </Link>

        <div className="flex items-center gap-3">
          <Link 
            to="/admin" 
            className="hidden sm:inline-block text-sm text-gray-600 hover:text-gray-900"
          >
            {language === 'en' ? 'Admin Panel' : 'Panele y\'Ubuyobozi'}
          </Link>

          <Link 
            to="/"
            onClick={async () => { 
              try { 
                await authSupabase.signOut()
                localStorage.removeItem('user')
                localStorage.removeItem('authToken')
                window.location.href = '/'
              } catch (e) {
                console.error('Logout error:', e)
                window.location.href = '/'
              }
            }}
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

export default AdminNavbar

