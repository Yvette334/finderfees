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
            // First, check user metadata on Supabase auth (faster)
            const userRoleMeta = user?.user_metadata?.role || user?.user_metadata?.role?.toLowerCase?.()
            if (userRoleMeta && String(userRoleMeta).toLowerCase() === 'admin') {
              setIsAdmin(true)
              setLoading(false)
              return
            }
            // Check user role from profiles table
            // Try with single() first, if it fails try without single() (in case multiple rows)
            let { data: profile, error } = await supabase
              .from('profiles')
              .select('role, id, email')
              .eq('id', user.id)
              .maybeSingle()
            
            // If no profile found, try to get it without single()
            if (error || !profile) {
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('role, id, email')
                .eq('id', user.id)
              
              if (profiles && profiles.length > 0) {
                profile = profiles[0]
                error = null
              } else {
                error = profilesError || new Error('Profile not found')
              }
            }
            
            console.log('Admin check - User ID:', user.id)
            console.log('Admin check - Profile data:', profile)
            console.log('Admin check - Error:', error)
            console.log('Admin check - Role value:', profile?.role)
            
            if (error) {
              console.error('Failed to fetch profile for admin check:', error)
              console.error('Error details:', JSON.stringify(error, null, 2))
            }
            
            // Check if role is 'admin' (case-insensitive comparison) from profile table
            const role = profile?.role?.toLowerCase?.() || profile?.role || ''
            if (!error && profile && role === 'admin') {
              console.log('Admin role confirmed')
              setIsAdmin(true)
            } else {
              console.warn('Admin role check failed - role:', profile?.role, 'expected: admin')
              console.warn('Profile exists:', !!profile, 'Error:', error?.message)
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

