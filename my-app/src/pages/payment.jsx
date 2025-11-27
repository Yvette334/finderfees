import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function Payment() {
  const location = useLocation()
  const navigate = useNavigate()
  const { claimId, itemName, amount, ownerName } = location.state || {}
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [paymentMethod, setPaymentMethod] = useState('mtn')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [phoneError, setPhoneError] = useState('')

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
      setPhoneNumber(value)
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

  const handlePayment = async (e) => {
    e.preventDefault()
    
    // Validate phone number
    if (phoneNumber.length !== 10) {
      setPhoneError(language === 'en' 
        ? 'Phone number must be exactly 10 digits' 
        : 'Numero ya telefoni igomba kuba inyuguti 10')
      return
    }

    setProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      // Mark this item as paid
      const paidItemIds = JSON.parse(localStorage.getItem('paidItemIds') || '[]')
      if (claimId && !paidItemIds.includes(claimId)) {
        paidItemIds.push(claimId)
        localStorage.setItem('paidItemIds', JSON.stringify(paidItemIds))
      }
      
      // Also mark the itemId as paid if we have it from approved claims
      const approvedClaims = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
      const claim = approvedClaims.find(c => c.id === claimId)
      if (claim && claim.itemId) {
        const paidItems = JSON.parse(localStorage.getItem('paidItems') || '[]')
        if (!paidItems.includes(claim.itemId)) {
          paidItems.push(claim.itemId)
          localStorage.setItem('paidItems', JSON.stringify(paidItems))
        }
      }
      
      setProcessing(false)
      setCompleted(true)
      // In real app, this would call payment API
    }, 2000)
  }

  if (!claimId) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 text-center">
          <p className="text-gray-600">
            {language === 'en' ? 'No payment information available' : 'Nta makuru y\'amafaranga aboneka'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg"
          >
            {language === 'en' ? 'Go to Dashboard' : 'Genda ku Dashboard'}
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Dashboard' : 'Subira ku Dashboard'}
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {language === 'en' ? 'Payment' : 'Kwishyura'}
        </h1>

        {!completed ? (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'en' ? 'Payment Details' : 'Amakuru y\'Ishyura'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'en' ? 'Item:' : 'Ikintu:'}</span>
                  <span className="font-medium text-gray-900">{itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{language === 'en' ? 'Platform Fee:' : 'Amafaranga y\'Ikigo:'}</span>
                  <span className="font-medium text-gray-900">1,000 RWF</span>
                </div>
                {amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{language === 'en' ? 'Reward to Founder:' : 'Igihembo k\'Umwubatsi:'}</span>
                    <span className="font-medium text-gray-900">{amount.toLocaleString()} RWF</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="font-semibold text-gray-900">
                    {language === 'en' ? 'Total:' : 'Byose:'}
                  </span>
                  <span className="font-bold text-lg text-gray-900">
                    {amount ? (amount + 1000).toLocaleString() : '1,000'} RWF
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Payment Method' : 'Uburyo bwo Kwishyura'}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mtn"
                      checked={paymentMethod === 'mtn'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">MTN Mobile Money</div>
                      <div className="text-sm text-gray-600">*182#</div>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-900 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="airtel"
                      checked={paymentMethod === 'airtel'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Airtel Money</div>
                      <div className="text-sm text-gray-600">*182#</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'en' ? 'Phone Number' : 'Numero ya Telefoni'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
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
                {!phoneError && phoneNumber.length > 0 && phoneNumber.length < 10 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'en' 
                      ? `${10 - phoneNumber.length} more digit${10 - phoneNumber.length > 1 ? 's' : ''} needed`
                      : `Hari inyuguti ${10 - phoneNumber.length} zisigaye`
                    }
                  </p>
                )}
              </div>

              {processing ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A9.001 9.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a9.003 9.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <p className="text-gray-600">
                    {language === 'en' ? 'Processing payment...' : 'Gukora kwishyura...'}
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  {language === 'en' ? 'Pay Now' : 'Kwishyura None'}
                </button>
              )}
            </form>
          </>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'en' ? 'Payment Successful!' : 'Kwishyura Byagenze Neza!'}
            </h2>
            <p className="text-gray-700 mb-6">
              {language === 'en' 
                ? 'Your payment has been processed successfully. You can now contact the founder to arrange item pickup.'
                : 'Kwishyura kwawe gukorwa neza. Ushobora gukoresha umwubatsi kugirango wemeze gufata ikintu.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/dashboard"
                className="bg-white border border-gray-300 hover:border-gray-500 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors text-center"
              >
                {language === 'en' ? 'Go to Dashboard' : 'Genda ku Dashboard'}
              </Link>
              <Link
                to="/messages"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-center"
              >
                {language === 'en' ? 'Contact Founder' : 'Koresha Umwubatsi'}
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default Payment

