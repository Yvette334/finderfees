import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import Footer from '../components/footer'

function Admin() {
  const [pendingClaims, setPendingClaims] = useState([])
  const [approvedClaims, setApprovedClaims] = useState([])
  const [rejectedClaims, setRejectedClaims] = useState([])
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

  useEffect(() => {
    const storedPending = JSON.parse(localStorage.getItem('pendingClaims') || '[]')
    const storedApproved = JSON.parse(localStorage.getItem('approvedClaims') || '[]')
    const storedRejected = JSON.parse(localStorage.getItem('rejectedClaims') || '[]')
    setPendingClaims(storedPending)
    setApprovedClaims(storedApproved)
    setRejectedClaims(storedRejected)
  }, [])

  const persist = (nextPending, nextApproved, nextRejected, nextVerifiedIds) => {
    localStorage.setItem('pendingClaims', JSON.stringify(nextPending))
    localStorage.setItem('approvedClaims', JSON.stringify(nextApproved))
    localStorage.setItem('rejectedClaims', JSON.stringify(nextRejected))
    if (nextVerifiedIds) {
      localStorage.setItem('verifiedItemIds', JSON.stringify(nextVerifiedIds))
    }
  }

  const handleApprove = (claimId) => {
    const claim = pendingClaims.find(c => c.id === claimId)
    if (!claim) return
    const nextPending = pendingClaims.filter(c => c.id !== claimId)
    const nextApproved = [{ ...claim, approvedAt: new Date().toISOString() }, ...approvedClaims]
    const verifiedIds = new Set(JSON.parse(localStorage.getItem('verifiedItemIds') || '[]'))
    verifiedIds.add(claim.itemId)
    setPendingClaims(nextPending)
    setApprovedClaims(nextApproved)
    persist(nextPending, nextApproved, rejectedClaims, Array.from(verifiedIds))
  }

  const handleReject = (claimId) => {
    const claim = pendingClaims.find(c => c.id === claimId)
    if (!claim) return
    const nextPending = pendingClaims.filter(c => c.id !== claimId)
    const nextRejected = [{ ...claim, rejectedAt: new Date().toISOString() }, ...rejectedClaims]
    setPendingClaims(nextPending)
    setRejectedClaims(nextRejected)
    persist(nextPending, approvedClaims, nextRejected)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="mb-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Home' : 'Subira ku Nzu'}
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Admin Verification' : 'Gukemura kwa Admin'}
          </h1>
          <Link
            to="/reports"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {language === 'en' ? 'View Reports' : 'Reba Raporo'}
          </Link>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {language === 'en' ? 'Pending Claims' : 'Ibyifuzo Bitegereje'}
            </h2>
            <span className="text-sm text-gray-500">
              {pendingClaims.length} {language === 'en' ? 'pending' : 'bitegereje'}
            </span>
          </div>
          {pendingClaims.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              {language === 'en' ? 'No claims awaiting verification.' : 'Nta byifuzo bitegereje ukemura.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingClaims.map(claim => (
                <div key={claim.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {claim.photo ? (
                    <img src={claim.photo} alt={claim.itemName} className="w-full h-40 object-cover" />
                  ) : null}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{claim.itemName}</h3>
                      <span className="text-xs text-gray-500">#{claim.itemId}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{claim.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      <p>
                        {language === 'en' ? 'Claimant:' : 'Uwiyifuza:'} <span className="font-medium text-gray-900">{claim.fullName}</span> — {claim.phone}
                      </p>
                      {claim.ownerName ? (
                        <p>{language === 'en' ? 'Founder:' : 'Umwubatsi:'} {claim.ownerName}</p>
                      ) : null}
                      <p>{language === 'en' ? 'Submitted:' : 'Byoherejwe:'} {new Date(claim.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleReject(claim.id)} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-lg text-sm font-medium">
                        {language === 'en' ? 'Reject' : 'Wanga'}
                      </button>
                      <button onClick={() => handleApprove(claim.id)} className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2 rounded-lg text-sm font-medium">
                        {language === 'en' ? 'Approve' : 'Emeza'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {language === 'en' ? 'Recently Approved' : 'Byemejwe Buzima'}
          </h2>
          {approvedClaims.length === 0 ? (
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'No approved claims.' : 'Nta byifuzo byemejwe.'}
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700">
              {approvedClaims.slice(0, 6).map(c => (
                <li key={c.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="truncate">{c.itemName} • {c.fullName}</span>
                  <span className="text-gray-500">{new Date(c.approvedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            {language === 'en' ? 'Recently Rejected' : 'Byanganywe Buzima'}
          </h2>
          {rejectedClaims.length === 0 ? (
            <p className="text-sm text-gray-500">
              {language === 'en' ? 'No rejected claims.' : 'Nta byifuzo byanganywe.'}
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700">
              {rejectedClaims.slice(0, 6).map(c => (
                <li key={c.id} className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="truncate">{c.itemName} • {c.fullName}</span>
                  <span className="text-gray-500">{new Date(c.rejectedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Admin
