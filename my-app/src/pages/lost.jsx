import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function Lost() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [photo, setPhoto] = useState('')
  const [photoPreview, setPhotoPreview] = useState('')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  const userName = localStorage.getItem('userName') || 'Anonymous'
  const userPhone = localStorage.getItem('userPhone') || ''

  // Listen for language changes
  React.useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const all = JSON.parse(localStorage.getItem('reportedItems') || '[]')
    all.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      type: 'lost',
      itemName: title,
      description,
      category: category || 'Other',
      location,
      date: date || new Date().toISOString().slice(0,10),
      photo,
      userName,
      userPhone,
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem('reportedItems', JSON.stringify(all))
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="mb-5">
          <div className="mb-3">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
              ← {language === 'en' ? 'Back to Dashboard' : 'Subira ku Dashboard'}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{language === 'en' ? 'Report an Item' : 'Tangaza Ikintu'}</h1>
          <p className="text-xs text-gray-500">
            {language === 'en' 
              ? 'Fill in the details to report a lost or found item'
              : 'Uzuze amakuru kugirango utangaze ikintu cyabuze cyangwa cyabonetse'
            }
          </p>
        </div>

        <div className="flex gap-3 mb-5">
          <button type="button" className={`px-4 py-3 rounded-lg text-sm font-medium flex-1 bg-gray-900 text-white`}>
            {language === 'en' ? 'I Lost Something' : 'Nabuze Ikintu'}
            <div className="text-[10px] opacity-70">
              {language === 'en' ? "Report an item you've lost" : 'Tangaza ikintu wabuze'}
            </div>
          </button>
          <Link to="/report/found" className="flex-1">
            <button type="button" className={`w-full px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-900`}>
              {language === 'en' ? 'I Found Something' : 'Nabonye Ikintu'}
              <div className="text-[10px] opacity-70">
                {language === 'en' ? "Report an item you've found" : 'Tangaza ikintu wabonye'}
              </div>
            </button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Item Title*' : 'Umutwe w\'Ikintu*'}
            </label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} required 
              placeholder={language === 'en' ? 'e.g., Black Leather Wallet' : 'Urugero: Wallet y\'Inzoya'} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Description*' : 'Ibisobanuro*'}
            </label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} required rows={4} 
              placeholder={language === 'en' 
                ? 'Provide detailed description including unique features, brand, color, etc.'
                : 'Tanga ibisobanuro byuzuye harimo ibyihariye, izina ry\'ikintu, ibara, n\'ibindi'
              } 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Category*' : 'Icyiciro*'}
            </label>
            <select value={category} onChange={(e)=>setCategory(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900">
              <option value="">{language === 'en' ? 'Select a category' : 'Hitamo icyiciro'}</option>
              <option value="Wallet">{language === 'en' ? 'Wallet' : 'Wallet'}</option>
              <option value="Phone">{language === 'en' ? 'Phone' : 'Telefoni'}</option>
              <option value="Documents">{language === 'en' ? 'Documents' : 'Inyandiko'}</option>
              <option value="Bags">{language === 'en' ? 'Bags' : 'Agafuka'}</option>
              <option value="Jewelry">{language === 'en' ? 'Jewelry' : 'Imigirwa'}</option>
              <option value="Keys">{language === 'en' ? 'Keys' : 'Ufunguzo'}</option>
              <option value="Other">{language === 'en' ? 'Other' : 'Ibindi'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Location*' : 'Ahantu*'}
            </label>
            <input value={location} onChange={(e)=>setLocation(e.target.value)} required 
              placeholder={language === 'en' ? 'e.g., Nyabugogo Bus Station' : 'Urugero: Sitasiyo ya Busi Nyabugogo'} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Date Lost*' : 'Itariki Yabuze*'}
            </label>
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'en' ? 'Photos' : 'Amashusho'}
            </label>
            <label className="w-full border-2 border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center text-sm text-gray-600 cursor-pointer hover:border-gray-400 transition-colors">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div className="text-2xl mb-2">⬆️</div>
              <div>{language === 'en' ? 'Click to upload or drag and drop' : 'Kanda kugirango wongereho cyangwa kurura'}</div>
              <div className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</div>
            </label>
            {photoPreview && (
              <div className="mt-2">
                <img src={photoPreview} alt="Preview" className="h-24 rounded-md object-cover" />
              </div>
            )}
          </div>

          <div className="bg-gray-100 text-gray-700 text-xs rounded-lg px-3 py-3">
            {language === 'en' 
              ? 'Platform Fee: 1,000 RWF will be charged when an item is successfully returned.'
              : 'Amafaranga y\'ikigo: 1,000 RWF azakurwa igihe ikintu cyagarutse neza.'
            }
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity">
            {language === 'en' ? 'Submit Report' : 'Ohereza Raporo'}
          </button>
        </form>
      </main>
      <Footer />
    </div>
  )
}

export default Lost
