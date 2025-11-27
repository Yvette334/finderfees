import './App.css'
import { Routes, Route } from 'react-router-dom'
import Login from "./auth/login"
import Register from "./auth/register"
import Home from './pages/Home'
import Search from './pages/search'
import Verify from './pages/verify'
import Admin from './pages/admin'
import Dashboard from './pages/dashboard'
import Lost from './pages/lost'
import Found from './pages/found'
import Profile from './pages/profile'
import Reports from './pages/reports'
import Payment from './pages/payment'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<Search />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/report/lost" element={<Lost />} />
      <Route path="/report/found" element={<Found />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/payment" element={<Payment />} />
    </Routes>
  )
}

export default App
