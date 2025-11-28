import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'
import { itemsSupabase, authSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'

export const sampleItems = {
    lost: [
      {
        id: '1',
        type: 'lost',
        itemName: 'Black Leather Wallet',
        description: 'Lost my black leather wallet containing ID card and bank cards. Last seen on Route 201 bus from Nyabugogo to Remera.',
        category: 'Wallet',
        location: 'Nyabugogo - Remera Route',
        date: '2025-10-18',
        photo: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80',
        userId: '2',
        userName: 'Marie Uwase',
        userPhone: '+250 788 234 567',
        reward: 5000,
        status: 'active',
        createdAt: new Date('2025-10-18').toISOString()
      },

      {
        id: '5',
        type: 'lost',
        itemName: 'Gold Wedding Ring',
        description: 'Lost my gold wedding ring with diamond. Has engraving "M&J Forever" inside. Extremely sentimental value.',
        category: 'Jewelry',
        location: 'Hotel des Mille Collines',
        date: '2025-10-16',
        photo: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
        userId: '6',
        userName: 'Jacqueline Mutoni',
        userPhone: '+250 788 678 901',
        reward: 50000,
        status: 'active',
        createdAt: new Date('2025-10-16').toISOString()
      },
      {
        id: '7',
        type: 'lost',
        itemName: 'Passport',
        description: 'Lost my Rwandan passport. Passport number: PC1234567. Last seen at Kigali International Airport.',
        category: 'Documents',
        location: 'Kigali International Airport',
        date: '2025-10-15',
        photo: 'https://images.unsplash.com/photo-1487637419635-a2a471ff5c7b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cGFzc3BvcnR8ZW58MHx8MHx8fDA%3D',
        userId: '8',
        userName: 'Grace Ishimwe',
        userPhone: '+250 788 890 123',
        reward: 20000,
        status: 'active',
        createdAt: new Date('2025-10-15').toISOString()
      }
    ],
    found: [
      {
        id: '2',
        type: 'found',
        itemName: 'iPhone 13 Pro',
        description: 'Found an iPhone 13 Pro in blue color at Kigali City Market. The phone is locked but has a custom case with initials "JK".',
        category: 'Phone',
        location: 'Kigali City Market',
        date: '2025-10-19',
        photo: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80',
        userId: '3',
        userName: 'Patrick Habimana',
        userPhone: '+250 788 345 678',
        commission: 15000,
        status: 'active',
        createdAt: new Date('2025-10-19').toISOString()
      },
      {
        id: '4',
        type: 'found',
        itemName: 'Blue Backpack with Laptop',
        description: 'Found a blue backpack containing a laptop and some textbooks at Kigali Public Library. Looking for the owner.',
        category: 'Bags',
        location: 'Kigali Public Library',
        date: '2025-10-20',
        photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        userId: '5',
        userName: 'Divine Mukamana',
        userPhone: '+250 788 567 890',
        commission: 20000,
        status: 'active',
        createdAt: new Date('2025-10-20').toISOString()
      },
      {
        id: '6',
        type: 'found',
        itemName: 'Set of Car Keys',
        description: 'Found a set of Toyota car keys with a red keychain near UTC Kigali. Has remote and house keys attached.',
        category: 'Keys',
        location: 'Kigali',
        date: '2025-10-21',
        photo: 'https://images.unsplash.com/photo-1687075430355-ed8df51c1670?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        userId: '7',
        userName: 'Eric Nsengimana',
        userPhone: '+250 788 789 012',
        commission: 8000,
        status: 'active',
        createdAt: new Date('2025-10-21').toISOString()
      },
      {
        id: '8',
        type: 'found',
        itemName: 'Pink Kids Backpack',
        description: 'Found a pink Disney-themed kids backpack at Nyarutarama playground. Contains school supplies and a lunchbox.',
        category: 'Bags',
        location: 'Nyarutarama Playground',
        date: '2025-10-20',
        photo: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80',
        userId: '9',
        userName: 'Sarah Umutoni',
        userPhone: '+250 788 901 234',
        commission: 5000,
        status: 'active',
        createdAt: new Date('2025-10-20').toISOString()
      }
    ]
  };
    

export default function search() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [itemType, setItemType] = useState('all') // 'all', 'lost', 'found'
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const navigate = useNavigate()

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

  const verifiedSet = useMemo(() => new Set(JSON.parse(localStorage.getItem('verifiedItemIds') || '[]')), [])
  const paidItemsSet = useMemo(() => new Set(JSON.parse(localStorage.getItem('paidItems') || '[]')), [])
  const [apiItems, setApiItems] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authSupabase.getCurrentUser()
        setIsAuthenticated(!!user)
        if (user) setCurrentUserId(user.id)
      } catch (err) {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])
  
  // Fetch approved claims from Supabase
  useEffect(() => {
    const fetchApprovedClaims = async () => {
      try {
        const { data, error } = await supabase
          .from('claims')
          .select('*')
          .eq('status', 'approved')
        if (!error && data) {
          setApprovedClaims(data)
        } else {
          // Fallback to localStorage
          const local = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
          setApprovedClaims(local)
        }
      } catch (err) {
        console.error('Failed to fetch approved claims', err)
        // Fallback to localStorage
        const local = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
        setApprovedClaims(local)
      }
    }
    fetchApprovedClaims()
  }, [])
  
  // Check if item is claimed
  const isItemClaimed = (item) => {
    if (!item) return false
    // Check item status - added 'claimed' status
    if (item.status === 'claimed' || item.status === 'returned' || item.status === 'verified') return true
    // Check if there's an approved claim for this item (anyone)
    if (approvedClaims.some(c => c.item_id === item.id || c.itemId === item.id)) return true
    // Check localStorage fallbacks
    if (paidItemsSet.has(item.id)) return true
    if (verifiedSet.has(item.id)) return true
    return false
  }

  const getApprovedClaimForItem = (item) => approvedClaims.find(c => (c.item_id === item.id || c.itemId === item.id) && c.status === 'approved')

  const isClaimedByCurrentUser = (item) => {
    if (!currentUserId) return false
    const claim = getApprovedClaimForItem(item)
    if (claim && (claim.claimant_id === currentUserId || claim.claimantId === currentUserId)) return true
    // Also check paid claims by user in localStorage
    const paidClaimsByUser = JSON.parse(localStorage.getItem('paidClaimsByUser') || '[]')
    if (paidClaimsByUser.some(pc => pc.itemId === item.id && pc.payerId === currentUserId)) return true
    return false
  }

  const isClaimedBySomeoneElse = (item) => {
    const claim = getApprovedClaimForItem(item)
    if (!claim) return false
    if (!currentUserId) return true
    return !(claim.claimant_id === currentUserId || claim.claimantId === currentUserId)
  }

  // Get phone number to display for an item
  const getItemPhone = useCallback((item) => {
    if (!item) return ''
    
    // Check if item is claimed (has approved claim)
    const approvedClaim = approvedClaims.find(c => {
      const itemIdMatch = (c.item_id === item.id || c.itemId === item.id)
      const itemNameMatch = c.item_name && item.itemName && 
        c.item_name.toLowerCase() === item.itemName.toLowerCase()
      const statusMatch = c.status === 'approved' || !c.status
      return (itemIdMatch || itemNameMatch) && statusMatch
    })
    
    if (approvedClaim) {
      // Show claimant's contact only to the claimant (and after payment)
      const claimantPhone = approvedClaim.claimant_phone || approvedClaim.phone || ''
      const claimantId = approvedClaim.claimant_id || approvedClaim.claimantId || null
      const paidClaimsByUser = JSON.parse(localStorage.getItem('paidClaimsByUser') || '[]')
      const userPaidThisClaim = !!(currentUserId && paidClaimsByUser.some(pc => pc.claimId === approvedClaim.id && pc.payerId === currentUserId))
      if (claimantId && claimantId === currentUserId) {
        if (userPaidThisClaim || paidItemsSet.has(item.id)) {
          return item.owner_phone || item.userPhone || claimantPhone || ''
        }
        return language === 'en' ? 'Contact hidden until payment is made' : 'Kontaki yihishe kugeza kwishyura'
      }
      // If the claim belongs to someone else, show 'Already claimed' placeholder
      return language === 'en' ? 'Already claimed' : 'Byakemuwe'
    }
    
    // Check if item status is claimed
    if (item.status === 'claimed') {
      return item.owner_phone || item.userPhone || ''
    }
    
    // For lost items, show phone only if paid or verified
    if (item.type === 'lost') {
      if (paidItemsSet.has(item.id) || verifiedSet.has(item.id)) {
        return item.userPhone || ''
      }
      return language === 'en' 
        ? 'Contact hidden until payment is made'
        : 'Kontaki yihishe kugeza kwishyura'
    }
    
    // For found items, always show phone
    return item.userPhone || ''
  }, [approvedClaims, paidItemsSet, verifiedSet, language])
  
  // Get all found items to match with lost items (API + local)
  const foundItems = useMemo(() => {
    const safeId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    const allLocalRaw = JSON.parse(localStorage.getItem('reportedItems') || '[]')
    const normalize = (item = {}) => {
      if (!item || typeof item !== 'object') {
        return {
          id: safeId(),
          type: 'found',
          itemName: '',
          description: '',
          category: 'Other',
          location: '',
          event_date: new Date().toISOString().slice(0, 10),
          userName: '',
          userPhone: '',
          reward: null,
          commission: null,
          status: 'active',
          photo: '',
          createdAt: new Date().toISOString()
        }
      }
      return {
        id: item.id || item._id || safeId(),
        type: item.type || 'found',
        itemName: item.item_name || item.itemName || '',
        description: item.description || '',
        category: item.category || 'Other',
        location: item.location || '',
        event_date: item.event_date || item.date || new Date().toISOString().slice(0, 10),
        userName: item.user_name || item.userName || '',
        userPhone: item.user_phone || item.userPhone || '',
        reward: item.reward ?? null,
        commission: item.commission ?? null,
        status: item.status || 'active',
        photo: item.photo || '',
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }
    }
    const allLocal = allLocalRaw.map(normalize)
    const fromLocalFound = allLocal.filter(item => item.type === 'found')
    const fromApiFound = apiItems.filter(item => item.type === 'found').map(normalize)
    return [...fromApiFound, ...fromLocalFound]
  }, [apiItems])

  // Get user-reported items from API + localStorage
  const reportedItems = useMemo(() => {
    const safeId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    const allLocalRaw = JSON.parse(localStorage.getItem('reportedItems') || '[]')
    const normalize = (item = {}) => {
      if (!item || typeof item !== 'object') {
        return {
          id: safeId(),
          type: 'lost',
          itemName: '',
          description: '',
          category: 'Other',
          location: '',
          date: new Date().toISOString(),
          photo: '',
          userId: '',
          userName: 'Anonymous',
          userPhone: '',
          reward: null,
          commission: null,
          status: 'active',
          createdAt: new Date().toISOString()
        }
      }
      return {
        id: item.id || item._id || safeId(),
        type: item.type || 'lost',
        itemName: item.item_name || item.itemName || '',
        description: item.description || '',
        category: item.category || 'Other',
        location: item.location || '',
        date: item.date || item.created_at || new Date().toISOString(),
        photo: item.photo || '',
        userId: item.user_id || '',
        userName: item.user_name || item.userName || 'Anonymous',
        userPhone: item.user_phone || item.userPhone || '',
        reward: item.reward ?? null,
        commission: item.commission ?? null,
        status: item.status || 'active',
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }
    }
    const apiNormalized = apiItems.map(normalize)
    const all = [...apiNormalized, ...allLocalRaw.map(normalize)]
    return all
  }, [apiItems])

  // Combine all items (sample + user-reported from API + local)
  const allItems = [...sampleItems.lost, ...sampleItems.found, ...reportedItems]

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await itemsSupabase.getItems()
        setApiItems(items || [])
      } catch (err) {
        console.error('Failed to fetch items from supabase', err)
      }
    }
    fetchItems()
  }, [])

  // Filter items based on search query, category, and type
  const filteredItems = allItems.filter(item => {
    if (!item || typeof item !== 'object') {
      return false
    }
    const itemNameLower = typeof item.itemName === 'string' ? item.itemName.toLowerCase() : ''
    const descriptionLower = typeof item.description === 'string' ? item.description.toLowerCase() : ''
    const locationLower = typeof item.location === 'string' ? item.location.toLowerCase() : ''
    const categoryLower = typeof item.category === 'string' ? item.category.toLowerCase() : ''
    const searchLower = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : ''
    const selectedCategoryLower = typeof selectedCategory === 'string' ? selectedCategory.toLowerCase() : ''

    const matchesSearch = searchQuery === '' ||
      itemNameLower.includes(searchLower) ||
      descriptionLower.includes(searchLower) ||
      locationLower.includes(searchLower)
    
    const matchesCategory = selectedCategory === '' ||
      categoryLower === selectedCategoryLower
    
    const matchesType = itemType === 'all' || item.type === itemType

    return matchesSearch && matchesCategory && matchesType
  })

  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? (
      <Navbar/>
      ) : (
        <header className="bg-white border-b border-gray-200">
          <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              <h1 className="text-lg font-semibold text-gray-900">Finders Fee</h1>
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {language === 'en' ? 'Login' : 'Injira'}
              </Link>
              <Link 
                to="/register"
                className="text-sm bg-black text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                {language === 'en' ? 'Register' : 'Kwiyandikisha'}
              </Link>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer outline-none"
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
              </select>
            </div>
          </nav>
        </header>
      )}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {isAuthenticated && (
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Dashboard' : 'Subira ku Dashboard'}
          </Link>
        </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          {language === 'en' ? 'Search Items' : 'Shakisha Ibintu'}
        </h1>
        
        {/* Search Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
          <div className="flex-1 max-w-2xl">
            <input 
              type="text" 
              id="searchInput" 
              placeholder={language === 'en' ? 'Search for items...' : 'Shakisha ibintu...'} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>
          <select 
            name="Categories" 
            id="categories"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors bg-white cursor-pointer"
          >
            <option value="">{language === 'en' ? 'All categories' : 'Ibyiciro Byose'}</option>
            <option value="wallet">{language === 'en' ? 'Wallet' : 'Wallet'}</option>
            <option value="documents">{language === 'en' ? 'Documents' : 'Inyandiko'}</option>
            <option value="jewelry">{language === 'en' ? 'Jewelry' : 'Imigirwa'}</option>
            <option value="phone">{language === 'en' ? 'Phone' : 'Telefoni'}</option>
            <option value="bags">{language === 'en' ? 'Bags' : 'Agafuka'}</option>
            <option value="keys">{language === 'en' ? 'Keys' : 'Ufunguzo'}</option>
          </select>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors bg-white cursor-pointer"
          >
            <option value="all">{language === 'en' ? 'All Items' : 'Ibintu Byose'}</option>
            <option value="lost">{language === 'en' ? 'Lost Items' : 'Ibintu Byabuze'}</option>
            <option value="found">{language === 'en' ? 'Found Items' : 'Ibintu Byabonetse'}</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center text-gray-600">
          {language === 'en' 
            ? `Found ${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`
            : `Byabonetse ${filteredItems.length} ${filteredItems.length !== 1 ? 'ibintu' : 'ikintu'}`
          }
        </div>

        {/* Items Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img 
                  src={item.photo} 
                  alt={item.itemName}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.type === 'lost' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'lost' 
                        ? (language === 'en' ? 'Lost' : 'Byabuze')
                        : (language === 'en' ? 'Found' : 'Byabonetse')
                      }
                    </span>
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.itemName}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    <p>📍 {item.location}</p>
                    <p>📅 {new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        {language === 'en' ? 'By:' : 'Na:'} {item.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getItemPhone(item)}
                      </p>
                    </div>
                    {item.reward && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {language === 'en' ? 'Reward:' : 'Igihembo:'} {item.reward.toLocaleString()} RWF
                        </p>
                      </div>
                    )}
                    {item.commission && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {language === 'en' ? 'Commission:' : 'Komisiyo:'} {item.commission.toLocaleString()} RWF
                        </p>
                      </div>
                    )}
                  </div>
                  {isClaimedByCurrentUser(item) ? (
                    <div className="w-full bg-green-100 text-green-700 py-2 px-4 rounded-lg font-medium text-sm text-center">
                      {language === 'en' ? 'Claimed (You)' : 'Wavuze (Wowe)'}
                    </div>
                  ) : isClaimedBySomeoneElse(item) ? (
                    <div className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-lg font-medium text-sm text-center">
                      {language === 'en' ? 'Already Claimed' : 'Byakemuwe'}
                    </div>
                  ) : isAuthenticated ? (
                    <button
                      onClick={() => {
                        navigate('/verify', { state: { itemId: item.id, itemName: item.itemName, ownerName: item.userName, photo: item.photo, type: item.type } })
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                    >
                      {language === 'en' ? 'Claim This Item' : 'Fata Iki Kintu'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm text-center block"
                    >
                      {language === 'en' ? 'Login to Claim' : 'Injira Kugirango Ufate'}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {language === 'en' 
                ? 'No items found. Try adjusting your search criteria.'
                : 'Nta bintu byabonetse. Gerageza guhindura ibisabwa byawe.'
              }
            </p>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  )
}
