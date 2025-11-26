import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/footer'
function Home() {
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
    <div className="min-h-screen bg-white">
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
      <div className="bg-linear-to-br from-gray-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Finders Fee</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {language === 'en' ? 'Connect lost items with their owners and earn rewards for helping others' : 'Huza ibintu byabuze n\'abanyirabyo kandi wakire ibihembo kubera gufasha abandi'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/login">
              <button className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
                {language === 'en' ? 'Get Started' : 'Tangira'}
              </button>
            </Link>
            <Link to="/search">
              <button className="bg-white text-black border-2 border-gray-300 px-8 py-3 rounded-lg font-medium hover:border-gray-900 transition-colors">
                {language === 'en' ? 'Browse Found' : 'Reba ibyabonetse'}
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-gray-50">
            <div className="text-4xl font-bold text-gray-900 mb-2">1,250</div>
            <div className="text-gray-600">
              {language === 'en' ? 'Total items reported' : 'Umubare w\'ibintu byatangajwe'}
            </div>
          </div>
          <div className="text-center p-6 rounded-lg bg-gray-50">
            <div className="text-4xl font-bold text-gray-900 mb-2">950</div>
            <div className="text-gray-600">
              {language === 'en' ? 'Items Returned' : 'Ibintu byagarutse kuri ba nyirabyo'}
            </div>
          </div>
          <div className="text-center p-6 rounded-lg bg-gray-50">
            <div className="text-4xl font-bold text-gray-900 mb-2">75%</div>
            <div className="text-gray-600">
              {language === 'en' ? 'Recovery Rate' : 'Ingano y\'ibintu byagarutse'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'en' ? 'How it Works' : 'Uko bikore '}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'en' ? 'A simple process to help reunite lost items with their owners' : 'Inzira yoroshye yo guhuza ibintu byabuze n\'ababyifite'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Report or Search' : 'Tangaza cyangwa Shakisha'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' ? 'Report a lost item or search for found items in our database' : 'Tangaza ikintu cyabuze cyangwa shakisha ibintu byabonetse mu kigenga wacu'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Earn Rewards' : 'Akira Ibihembo'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' ? 'Get rewarded for helping reunite items with their owners' : 'Wakire ibihembo iyo wafashije guhuza ibintu n\'abanyirabyo'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Community Driven' : 'Gufatanya'}
              </h3>
              <p className="text-gray-600">
                {language === 'en' ? 'Join a community of helpful people making a difference' : 'Jya mu muryango w\'abantu bafasha kuzana iminduka'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            {language === 'en' ? 'Ready To Start' : 'Witeguye Gutangira'}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {language === 'en' ? 'Join Thousands of users helping each other' : 'Jya mu bantu ibihumbi bafasha abandi'}
          </p>
          <Link to="/register">
            <button className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
              {language === 'en' ? 'Create Account' : 'Kora Konti'}
            </button>
          </Link>
        </div>
      </div>
      <Footer/>
    </div>
  )
}

export default Home