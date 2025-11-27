import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authSupabase } from '../utils/supabaseAPI'
import { authAPI } from '../utils/api'
import supabase from '../utils/supabaseClient'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check sessionStorage first (tab-specific user for presentations)
        let user = null
        const sessionUserStr = sessionStorage.getItem('activeUser')
        if (sessionUserStr) {
          try {
            user = JSON.parse(sessionUserStr)
            setIsAuthenticated(true)
          } catch (e) {
            // Invalid session user, check Supabase
          }
        }
        
        // If no tab-specific user, check Supabase session (shared across tabs)
        if (!user) {
          const supabaseUser = await authSupabase.getCurrentUser()
          if (supabaseUser) {
            user = supabaseUser
            setIsAuthenticated(true)
          }
        }
        
        // Also check authAPI.getCurrentUser() which handles both
        if (!user) {
          user = authAPI.getCurrentUser()
          if (user) {
            setIsAuthenticated(true)
          }
        }
        
        if (user) {
          // Check if admin role is required
          if (requireAdmin) {
            // Get user ID from either sessionStorage user or Supabase user
            const userId = user.id || user._id
            
            // Check role from profiles table
            let { data: profile, error } = await supabase
              .from('profiles')
              .select('role, id, email')
              .eq('id', userId)
              .maybeSingle()
            
            if (error || !profile) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('role, id, email')
                .eq('id', userId)
              
              if (profiles && profiles.length > 0) {
                profile = profiles[0]
              }
            }
            
            // Check if role is 'admin' (case-insensitive comparison)
            const role = profile?.role?.toLowerCase?.() || user?.user_metadata?.role?.toLowerCase?.() || ''
            if (role === 'admin') {
              setIsAdmin(true)
            }
          } else {
            setIsAdmin(true) // If admin not required, allow access
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


