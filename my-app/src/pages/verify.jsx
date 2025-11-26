import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function Verify() {
  const location = useLocation()
  const navigate = useNavigate()
  const { itemId, itemName, ownerName } = location.state || {}

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)
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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <div className="mb-4">
          <Link to="/search" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Search' : 'Subira ku Shakisha'}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {language === 'en' ? 'Verification' : 'Gukemura'}
        </h1>
        {itemName && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">
              {language === 'en' ? 'Verifying claim for:' : 'Gukemura icyifuzo cya:'} <span className="font-semibold text-gray-900">{itemName}</span>
              {ownerName ? (
                <>
                  {' '}{language === 'en' ? 'from' : 'kuva'} <span className="font-medium">{ownerName}</span>
                </>
              ) : null}
            </p>
            {itemId ? <p className="text-xs text-gray-500">{language === 'en' ? 'Reference ID:' : 'ID y\'Inyandiko:'} {itemId}</p> : null}
          </div>
        )}

        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // save to localStorage as pending claim
              const pending = JSON.parse(localStorage.getItem('pendingClaims') || '[]')
              const claimRecord = {
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
                itemId: itemId || 'unknown',
                itemName: itemName || 'Unknown Item',
                ownerName: ownerName || '',
                fullName,
                phone,
                description,
                createdAt: new Date().toISOString(),
                photo: location.state?.photo || ''
              }
              pending.unshift(claimRecord)
              localStorage.setItem('pendingClaims', JSON.stringify(pending))
              // store user identity for dashboard filtering
              localStorage.setItem('userName', fullName)
              localStorage.setItem('userPhone', phone)
              setSubmitted(true)
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Full name' : 'Amazina yuzuye'}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'en' ? 'Enter your full name' : 'Injiza amazina yawe yuzuye'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                {language === 'en' ? 'Phone number' : 'Numero ya telefoni'}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0788 123 456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {language === 'en' ? 'Describe why you think this item is yours' : 'Sobanura ukuntu wiyumvira ko iki kintu ni cyawe'}
              </label>
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'en' 
                  ? 'Provide identifying details, unique marks, purchase info, receipts, photos, etc.'
                  : 'Tanga amakuru yerekana, ibimenyetso byihariye, amakuru y\'igurwa, inyemezabuguzi, amashusho, n\'ibindi'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {language === 'en' 
                  ? 'Note: The founder\'s phone number is revealed only after admin verification. Platform commission is 1,000 RWF.'
                  : 'Icyitonderwa: Numero ya telefoni y\'umwubatsi iboneka gusa nyuma y\'ukemura kwa admin. Komisiyo y\'ikigo ni 1,000 RWF.'
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Kureka'}
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {language === 'en' ? 'Submit for Verification' : 'Ohereza kugirango ukemurwe'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {language === 'en' ? 'Claim Submitted' : 'Icyifuzo Cyoherejwe'}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'en' 
                ? 'Your claim has been submitted for admin review. You will see the founder\'s contact details once verified.'
                : 'Icyifuzo cyawe cyoherejwe kugirango admin cyakemure. Uzabona amakuru y\'umwubatsi igihe cyakemuwe.'
              }
            </p>
            <div className="flex gap-3">
              <Link
                to="/search"
                className="bg-white border border-gray-300 hover:border-gray-500 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors text-center"
              >
                {language === 'en' ? 'Back to Search' : 'Subira ku Shakisha'}
              </Link>
              <Link
                to="/dashboard"
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors text-center"
              >
                {language === 'en' ? 'Go to Dashboard' : 'Genda ku Dashboard'}
              </Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Verify
