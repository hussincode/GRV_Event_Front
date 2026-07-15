import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '../api'

export default function RequireAdmin({ children }) {
  const [status, setStatus] = useState('checking') // checking | ok | fail
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    api.adminMe()
      .then(() => { if (!cancelled) setStatus('ok') })
      .catch(() => { if (!cancelled) setStatus('fail') })
    return () => { cancelled = true }
  }, [])

  if (status === 'checking') {
    return (
      <div className="fullscreen-msg">
        <span className="spinner" />
      </div>
    )
  }

  if (status === 'fail') {
    const redirectTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?redirect=${redirectTo}`} replace />
  }

  return children
}
