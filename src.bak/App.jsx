import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RegistrationPage from './pages/RegistrationPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CheckinAdminPage from './pages/CheckinAdminPage'
import RequireAdmin from './components/RequireAdmin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegistrationPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboardPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/checkin-admin"
          element={
            <RequireAdmin>
              <CheckinAdminPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<div className="fullscreen-msg"><h1>404 — Page not found</h1></div>} />
      </Routes>
    </BrowserRouter>
  )
}
