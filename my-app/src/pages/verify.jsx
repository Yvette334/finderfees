import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { authSupabase, claimsSupabase } from '../utils/supabaseAPI'

function Verify() {
  const location = useLocation()
  const navigate = useNavigate()
  const { itemId, itemName, ownerName } = location.state || {}

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [phoneError, setPhoneError] = useState('')

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow numbers
    if (value.length <= 10) {
      setPhone(value)
      if (value.length === 10) {
        setPhoneError('')
      } else if (value.length > 0) {
        setPhoneError(language === 'en' 
          ? 'Phone number must be 10 digits' 
          : 'Numero ya telefoni igomba kuba inyuguti 10')
      } else {
        setPhoneError('')
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(language === 'en' ? 'Please select an image file' : 'Hitamo dosiye y\'ishusho')
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(language === 'en' ? 'File size must be less than 10MB' : 'Ingano y\'idosiye igomba kuba nto kuruta 10MB')
        return
      }
      // Convert to data URL for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result)
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

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
            onSubmit={async (e) => {
              e.preventDefault()
              
              // Validate phone number
              if (phone.length !== 10) {
                setPhoneError(language === 'en' 
                  ? 'Phone number must be exactly 10 digits' 
                  : 'Numero ya telefoni igomba kuba inyuguti 10')
                return
              }
              
              // Use Supabase: require auth to submit a claim
              const user = await authSupabase.getCurrentUser()
              if (!user) {
                alert('Please sign in to submit a claim')
                return navigate('/auth/login')
              }

              // Check if itemId is a valid UUID (sample items have IDs like "1", "2" which aren't UUIDs)
              const isValidUUID = (str) => {
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                return str && uuidRegex.test(str)
              }

              const payload = {
                item_id: (itemId && isValidUUID(itemId)) ? itemId : null,
                item_name: itemName || 'Unknown Item',
                owner_name: ownerName || '',
                claimant_id: user.id,
                claimant_name: fullName,
                claimant_phone: phone,
                description,
                photo: photo || location.state?.photo || ''
              }

              try {
                await claimsSupabase.createClaim(payload)
                setSubmitted(true)
              } catch (err) {
                console.error('Failed to create claim', err)
                const errorMsg = err?.message || (language === 'en' ? 'Failed to submit claim' : 'Gutanga icyifuzo byanze')
                alert(errorMsg)
              }
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
                {language === 'en' ? 'Phone number' : 'Numero ya telefoni'} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder={language === 'en' ? '0788123456' : '0788123456'}
                maxLength={10}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                  phoneError ? 'border-red-500' : 'border-gray-300 focus:border-gray-900'
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
                {language === 'en' ? 'Supporting Photo (Optional)' : 'Ishusho Yashyigikiye (Ntibyuzuye)'}
              </label>
              <label className="w-full border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center text-sm text-gray-600 cursor-pointer hover:border-gray-400 transition-colors">
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {photoPreview ? (
                  <div className="w-full h-full relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPhoto('')
                        setPhotoPreview('')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl mb-2">⬆️</div>
                    <div>{language === 'en' ? 'Click to upload or drag and drop' : 'Kanda kugirango wongereho cyangwa kurura'}</div>
                    <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</div>
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'en' 
                  ? 'Optional: Upload a photo that helps prove this item belongs to you (e.g., receipt, photo of you with the item, etc.)'
                  : 'Ntibyuzuye: Ongeraho ishusho ishyigikiye ko iki kintu ni cyawe (urugero: inyemezabuguzi, ishusho yawe hamwe n\'ikintu, n\'ibindi)'
                }
              </p>
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
