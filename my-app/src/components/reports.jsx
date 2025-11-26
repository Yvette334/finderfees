import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './navbar'
import Footer from './footer'

function Reports() {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')
  const [reportType, setReportType] = useState('all') // 'all', 'claims', 'items', 'users'

  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLanguage(e.detail || localStorage.getItem('language') || 'en')
    }
    window.addEventListener('languageChanged', handleLanguageChange)
    setLanguage(localStorage.getItem('language') || 'en')
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  const claims = useMemo(() => ({
    pending: JSON.parse(localStorage.getItem('pendingClaims') || '[]'),
    approved: JSON.parse(localStorage.getItem('approvedClaims') || '[]'),
    rejected: JSON.parse(localStorage.getItem('rejectedClaims') || '[]'),
  }), [])

  const reportedItems = useMemo(() => JSON.parse(localStorage.getItem('reportedItems') || '[]'), [])

  const allClaims = [...claims.pending, ...claims.approved, ...claims.rejected]
  const totalItems = reportedItems.length
  const totalClaims = allClaims.length
  const approvedCount = claims.approved.length
  const rejectedCount = claims.rejected.length
  const pendingCount = claims.pending.length

  const lostItems = reportedItems.filter(item => item.type === 'lost').length
  const foundItems = reportedItems.filter(item => item.type === 'found').length

  const getReportData = () => {
    switch (reportType) {
      case 'claims':
        return {
          title: language === 'en' ? 'Claims Report' : 'Raporo y\'Ibyifuzo',
          data: [
            { label: language === 'en' ? 'Total Claims' : 'Ibyifuzo Byose', value: totalClaims },
            { label: language === 'en' ? 'Approved' : 'Byemejwe', value: approvedCount },
            { label: language === 'en' ? 'Rejected' : 'Byanganywe', value: rejectedCount },
            { label: language === 'en' ? 'Pending' : 'Bitegereje', value: pendingCount },
          ]
        }
      case 'items':
        return {
          title: language === 'en' ? 'Items Report' : 'Raporo y\'Ibintu',
          data: [
            { label: language === 'en' ? 'Total Items' : 'Ibintu Byose', value: totalItems },
            { label: language === 'en' ? 'Lost Items' : 'Ibintu Byabuze', value: lostItems },
            { label: language === 'en' ? 'Found Items' : 'Ibintu Byabonetse', value: foundItems },
          ]
        }
      default:
        return {
          title: language === 'en' ? 'Activity Report' : 'Raporo y\'Imikorere',
          data: [
            { label: language === 'en' ? 'Total Items' : 'Ibintu Byose', value: totalItems },
            { label: language === 'en' ? 'Total Claims' : 'Ibyifuzo Byose', value: totalClaims },
            { label: language === 'en' ? 'Approved Claims' : 'Ibyifuzo Byemejwe', value: approvedCount },
            { label: language === 'en' ? 'Recovery Rate' : 'Ingano y\'Ibintu Byagarutse', value: `${totalItems > 0 ? Math.round((approvedCount / totalItems) * 100) : 0}%` },
          ]
        }
    }
  }

  const reportData = getReportData()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">
        <div className="mb-4">
          <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← {language === 'en' ? 'Back to Admin' : 'Subira ku Admin'}
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Activity Reports' : 'Raporo z\'Imikorere'}
          </h1>
          <p className="text-gray-600 mt-1">
            {language === 'en' ? 'View system statistics and activity' : 'Reba imibare y\'sisitemu n\'imikorere'}
          </p>
        </div>

        <div className="mb-6">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 bg-white"
          >
            <option value="all">{language === 'en' ? 'All Activity' : 'Imikorere Yose'}</option>
            <option value="claims">{language === 'en' ? 'Claims Report' : 'Raporo y\'Ibyifuzo'}</option>
            <option value="items">{language === 'en' ? 'Items Report' : 'Raporo y\'Ibintu'}</option>
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{reportData.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportData.data.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Recent Claims' : 'Ibyifuzo Buzima'}
            </h3>
            <div className="space-y-2">
              {allClaims.slice(0, 5).map(claim => (
                <div key={claim.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{claim.itemName}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    claim.approvedAt ? 'bg-green-100 text-green-700' :
                    claim.rejectedAt ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {claim.approvedAt 
                      ? (language === 'en' ? 'Approved' : 'Byemejwe')
                      : claim.rejectedAt
                      ? (language === 'en' ? 'Rejected' : 'Byanganywe')
                      : (language === 'en' ? 'Pending' : 'Bitegereje')
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'en' ? 'Recent Items' : 'Ibintu Bishya'}
            </h3>
            <div className="space-y-2">
              {reportedItems.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                  <span className="text-gray-700">{item.itemName}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type === 'lost' 
                      ? (language === 'en' ? 'Lost' : 'Byabuze')
                      : (language === 'en' ? 'Found' : 'Byabonetse')
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Reports

