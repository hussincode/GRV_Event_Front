import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

function StatCard({ label, value, color }) {
  return (
    <div className="card-surface stat-card">
      <div className="num" style={color ? { color } : undefined}>{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Approved' ? 'badge-approved' : status === 'Rejected' ? 'badge-rejected' : 'badge-pending'
  return <span className={`badge ${cls}`}>{status}</span>
}

export default function AdminDashboardPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [regs, s] = await Promise.all([api.listRegistrations(), api.stats()])
      setRows(regs)
      setStats(s)
    } catch (err) {
      setError(err.message || 'Could not load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleApprove(id) {
    setBusyId(id)
    try {
      await api.approve(id)
      await load()
    } catch (err) {
      alert(err.message || 'Could not approve')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id) {
    setBusyId(id)
    try {
      await api.reject(id)
      await load()
    } catch (err) {
      alert(err.message || 'Could not reject')
    } finally {
      setBusyId(null)
    }
  }

  async function handleLogout() {
    await api.adminLogout().catch(() => {})
    navigate('/admin/login')
  }

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return r.fullName?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.status?.toLowerCase().includes(q)
  })

  return (
    <div className="container-page" style={{ paddingBlock: '2.5rem' }}>
      <div className="navbar">
        <h1 style={{ fontSize: '1.5rem' }}>GRV Admin Dashboard</h1>
        <div className="links">
          <button className="btn-ghost" onClick={() => navigate('/checkin-admin')}>Check-in</button>
          <button className="btn-ghost" onClick={load}>Refresh</button>
          <button className="btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--destructive)', marginBottom: '1rem' }}>{error}</div>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total Registrations" value={stats.total} />
          <StatCard label="Pending" value={stats.pending} color="#f0a83c" />
          <StatCard label="Approved" value={stats.approved} color="#43c778" />
          <StatCard label="Rejected" value={stats.rejected} color="#e0525a" />
          <StatCard label="Checked-in" value={stats.checkedIn} color="#5b9bf0" />
        </div>
      )}

      <input
        placeholder="Search by name, email, or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 360, marginBottom: '1.5rem' }}
      />

      <div className="card-surface" style={{ padding: '0.5rem 1rem', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Mobile</th><th>Status</th>
                <th>Ticket ID</th><th>Checked-in</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td data-label="Name">
                    <a href="#" onClick={(e) => { e.preventDefault(); setDetail(r) }} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                      {r.fullName}
                    </a>
                  </td>
                  <td data-label="Email">{r.email}</td>
                  <td data-label="Mobile">{r.mobileNumber}</td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td data-label="Ticket ID">{r.ticketId || '—'}</td>
                  <td data-label="Checked-in">
                    <span className={`badge ${r.checkedIn ? 'badge-yes' : 'badge-no'}`}>{r.checkedIn ? 'Yes' : 'No'}</span>
                  </td>
                  <td data-label="Actions">
                    {r.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-success" disabled={busyId === r.id} onClick={() => handleApprove(r.id)}>
                          {busyId === r.id ? '…' : 'Approve'}
                        </button>
                        <button className="btn-danger" disabled={busyId === r.id} onClick={() => handleReject(r.id)}>
                          {busyId === r.id ? '…' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>No registrations found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="card-surface" style={{ padding: '2rem', maxWidth: 480, width: '100%', background: '#1c1f30' }}>
            <h3 style={{ marginBottom: '1rem' }}>{detail.fullName}</h3>
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Mobile" value={detail.mobileNumber} />
            <DetailRow label="WhatsApp" value={detail.whatsappNumber} />
            <DetailRow label="Gender" value={detail.gender} />
            <DetailRow label="Age" value={detail.age} />
            <DetailRow label="Governorate" value={detail.governorate} />
            <DetailRow label="Educational Stage" value={detail.educationalStage} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Ticket ID" value={detail.ticketId || '—'} />
            <DetailRow label="Checked-in" value={detail.checkedIn ? `Yes (${detail.checkedInAt || ''})` : 'No'} />
            <button className="btn-ghost" style={{ marginTop: '1rem' }} onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
