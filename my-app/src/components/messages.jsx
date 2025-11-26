import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from './navbar'
import Footer from './footer'

function Messages() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  // Get conversations from approved claims
  const approvedClaims = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
  const userName = localStorage.getItem('userName') || ''
  const userPhone = localStorage.getItem('userPhone') || ''

  const filterMine = (list) => {
    if (userPhone) return list.filter(c => c.phone === userPhone)
    if (userName) return list.filter(c => c.fullName === userName)
    return []
  }

  const myApproved = filterMine(approvedClaims)

  // Create conversations from approved claims
  const conversations = myApproved.map(claim => ({
    id: claim.id,
    itemName: claim.itemName,
    ownerName: claim.ownerName,
    ownerPhone: claim.ownerPhone || '',
    lastMessage: language === 'en' 
      ? `Your claim for "${claim.itemName}" has been approved. Contact the founder to arrange pickup.`
      : `Icyifuzo cyawe cya "${claim.itemName}" cyemejwe. Koresha kontaki y'umwubatsi kugirango wemeze gufata.`,
    timestamp: claim.approvedAt
  }))

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    
    // In a real app, this would send to backend
    // For now, just clear the message
    setMessage('')
    alert(language === 'en' 
      ? 'Message sent! (This is a demo - messages are not stored)'
      : 'Ubutumwa bwoherejwe! (Iki ni demo - amabutumwa ntabikwa)'
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Dashboard' : 'Subira ku Dashboard'}
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Messages' : 'Amatangazo'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'en' ? 'Communicate with item owners and finders' : 'Koresha na babyifite ibintu n\'ababonetse'}
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-600 text-lg mb-2">
              {language === 'en' ? 'No conversations yet' : 'Nta makoresha'}
            </p>
            <p className="text-gray-500 text-sm">
              {language === 'en' 
                ? 'You will see conversations here once your claims are approved.'
                : 'Uzabona makoresha hano igihe icyifuzo cyawe cyemejwe.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">
                  {language === 'en' ? 'Conversations' : 'Makoresha'}
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{conv.itemName}</div>
                    <div className="text-sm text-gray-600 mb-1">
                      {language === 'en' ? 'With:' : 'Na:'} {conv.ownerName}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-1">{conv.lastMessage}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col h-[600px]">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.itemName}</h3>
                        <p className="text-sm text-gray-600">
                          {language === 'en' ? 'Contact:' : 'Kontaki:'} {selectedConversation.ownerName} — {selectedConversation.ownerPhone}
                        </p>
                      </div>
                      <Link
                        to="/payment"
                        state={{
                          claimId: selectedConversation.id,
                          itemName: selectedConversation.itemName,
                          ownerName: selectedConversation.ownerName
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {language === 'en' ? 'Pay Now' : 'Kwishyura None'}
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm text-gray-700">{selectedConversation.lastMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedConversation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={language === 'en' ? 'Type a message...' : 'Andika ubutumwa...'}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                      />
                      <button
                        type="submit"
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                        {language === 'en' ? 'Send' : 'Ohereza'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  {language === 'en' ? 'Select a conversation to start messaging' : 'Hitamo makoresha kugirango utangire koresha'}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default Messages

