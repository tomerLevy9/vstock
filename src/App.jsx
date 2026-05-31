import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './screens/Login.jsx'
import Portfolio from './screens/Portfolio.jsx'
import Market from './screens/Market.jsx'
import StockDetail from './screens/StockDetail.jsx'
import History from './screens/History.jsx'
import Profile from './screens/Profile.jsx'

export default function App() {
  const { username } = useApp()
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(id)
  }, [toast])

  if (!username) return <Login />

  return (
    <>
      {toast && <div className="toast">{toast}</div>}
      <Layout>
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/market" element={<Market />} />
          <Route path="/stock/:ticker" element={<StockDetail onToast={setToast} />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </>
  )
}
