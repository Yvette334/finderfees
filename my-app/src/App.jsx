import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from "./auth/login"
import Register from "./auth/register"
import Home from './pages/Home'
import Search from './pages/Search'
import Verify from './pages/verify'
import Admin from './pages/admin'
import Dashboard from './pages/dashboard'
import Lost from './pages/lost'
import Found from './pages/found'
import Profile from './pages/profile'
import Reports from './pages/reports'
import Payment from './pages/payment'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/search" element={<Search />} />
      
      {/* Protected routes - require authentication */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/report/lost" 
        element={
          <ProtectedRoute>
            <Lost />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/report/found" 
        element={
          <ProtectedRoute>
            <Found />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/verify" 
        element={
          <ProtectedRoute>
            <Verify />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment" 
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes - require admin role */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Admin />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
