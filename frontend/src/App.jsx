import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'
import Categories from './pages/Categories'
import Documents from './pages/Documents'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="transactions" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
        <Route path="clients" element={<ErrorBoundary><Clients /></ErrorBoundary>} />
        <Route path="invoices" element={<ErrorBoundary><Invoices /></ErrorBoundary>} />
        <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
        <Route path="categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
        <Route path="documents" element={<ErrorBoundary><Documents /></ErrorBoundary>} />
      </Route>
    </Routes>
  )
}
