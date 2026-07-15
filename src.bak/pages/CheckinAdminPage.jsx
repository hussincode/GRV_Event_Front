import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../api'

const SCANNER_ELEMENT_ID = 'grv-qr-reader'

function ResultPanel({ result, onScanAnother }) {
  if (!result) return null
  const config = {
    success: { color: 'var(--success)', title: '✅ Check-in successful' },
    already_checked_in: { color: 'var(--warning)', title: '⚠️ Already checked in' },
    not_approved: { color: 'var(--destructive)', title: '❌ Ticket not approved' },
    invalid: { color: 'var(--destructive)', title: '❌ Invalid ticket' },
  }[result.result] || { color: 'var(--destructive)', title: '❌ Error' }

  return (
    <div className="card-surface" style={{ padding: '2rem', textAlign: 'center', marginTop: '1.5rem' }}>
      <h2 style={{ color: config.color }}>{config.title}</h2>
      {result.fullName && <p style={{ marginTop: '0.5rem' }}>{result.fullName}</p>}
      {result.checkedInAt && (
        <p className="hint">Checked in at: {new Date(result.checkedInAt).toLocaleString()}</p>
      )}
      <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={onScanAnother}>
        Scan another
      </button>
    </div>
  )
}

export default function CheckinAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const ticketFromUrl = searchParams.get('ticket')

  const [lookup, setLookup] = useState(null) // registration info for ticketFromUrl flow
  const [lookupError, setLookupError] = useState('')
  const [result, setResult] = useState(null)
  const [manualId, setManualId] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)

  // --- Direct-link flow: opened via /checkin-admin?ticket=XXXX (e.g. phone camera scan) ---
  useEffect(() => {
    if (!ticketFromUrl) return
    setLookupError('')
    setResult(null)
    api.checkinLookup(ticketFromUrl)
      .then((data) => {
        if (!data.found) setLookupError('Ticket not found.')
        else setLookup(data)
      })
      .catch((err) => setLookupError(err.message || 'Could not look up this ticket.'))
  }, [ticketFromUrl])

  async function confirmCheckin(ticketId) {
    try {
      const res = await api.checkin(ticketId)
      setResult(res)
      setLookup(null)
    } catch (err) {
      setLookupError(err.message || 'Could not process check-in.')
    }
  }

  // --- In-app camera scanner ---
  async function startScanner() {
    setScanning(true)
    setResult(null)
    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode(SCANNER_ELEMENT_ID)
        scannerRef.current = html5Qr
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            const ticketId = extractTicketId(decodedText)
            await stopScanner()
            processTicket(ticketId)
          },
          () => {}
        )
      } catch (err) {
        alert('Could not access camera: ' + (err.message || err))
        setScanning(false)
      }
    }, 50)
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      try { await scannerRef.current.clear() } catch { /* ignore */ }
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function processTicket(ticketId) {
    if (!ticketId) return
    try {
      const res = await api.checkin(ticketId)
      setResult(res)
    } catch (err) {
      setResult({ result: 'invalid', fullName: null })
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualId.trim()) return
    processTicket(manualId.trim())
    setManualId('')
  }

  function scanAnother() {
    setResult(null)
    setSearchParams({})
  }

  // --- Render: direct-link flow (has ?ticket=) ---
  if (ticketFromUrl && !result) {
    return (
      <div className="container-page" style={{ paddingBlock: '3rem', maxWidth: 480 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Check-in</h1>
        {lookupError && (
          <div className="card-surface" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--destructive)' }}>❌ {lookupError}</h2>
          </div>
        )}
        {lookup && (
          <div className="card-surface" style={{ padding: '2rem' }}>
            <h3>{lookup.fullName}</h3>
            <p className="hint">Ticket ID: {lookup.ticketId}</p>
            <p className="hint">Status: {lookup.status}</p>
            {lookup.checkedIn ? (
              <div style={{ marginTop: '1rem', color: 'var(--warning)' }}>
                ⚠️ Already checked in {lookup.checkedInAt ? `at ${new Date(lookup.checkedInAt).toLocaleString()}` : ''}
              </div>
            ) : lookup.status !== 'Approved' ? (
              <div style={{ marginTop: '1rem', color: 'var(--destructive)' }}>❌ This ticket is not approved.</div>
            ) : (
              <button className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => confirmCheckin(lookup.ticketId)}>
                Check-in
              </button>
            )}
          </div>
        )}
        {!lookup && !lookupError && <div className="fullscreen-msg"><span className="spinner" /></div>}
      </div>
    )
  }

  // --- Render: scanner / manual dashboard ---
  return (
    <div className="container-page" style={{ paddingBlock: '3rem', maxWidth: 480 }}>
      <h1 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>Check-in</h1>

      {result ? (
        <ResultPanel result={result} onScanAnother={scanAnother} />
      ) : (
        <>
          <div className="card-surface" style={{ padding: '1.5rem', textAlign: 'center' }}>
            {!scanning ? (
              <button className="btn-primary" onClick={startScanner} style={{ width: '100%' }}>
                📷 Scan QR Code
              </button>
            ) : (
              <>
                <div id={SCANNER_ELEMENT_ID} style={{ width: '100%' }} />
                <button className="btn-ghost" style={{ marginTop: '1rem' }} onClick={stopScanner}>Cancel</button>
              </>
            )}
          </div>

          <form onSubmit={handleManualSubmit} style={{ marginTop: '1.5rem' }}>
            <label>Or enter Ticket ID manually</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="GRV-2026-XXXXX" />
              <button className="btn-primary" type="submit">Go</button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

function extractTicketId(decodedText) {
  try {
    const url = new URL(decodedText)
    const fromParam = url.searchParams.get('ticket')
    if (fromParam) return fromParam
  } catch {
    // Not a URL — treat the decoded text as a raw ticket ID
  }
  return decodedText
}
