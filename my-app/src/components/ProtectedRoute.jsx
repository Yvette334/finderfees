import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authSupabase } from '../utils/supabaseAPI'
import supabase from '../utils/supabaseClient'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authSupabase.getCurrentUser()
        if (user) {
          setIsAuthenticated(true)
          
          // Check if admin role is required
          if (requireAdmin) {
            // Check user role from profiles table
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single()
            
            if (!error && profile && profile.role === 'admin') {
              setIsAdmin(true)
            }
          } else {
            setIsAdmin(true) // If admin not required, set to true to allow access
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

