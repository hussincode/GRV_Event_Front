import React, { useState } from 'react'
import { api } from '../api'

const GOVERNORATES = [
  'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Port Said', 'Suez', 'Dakahlia', 'Sharqia',
  'Gharbia', 'Monufia', 'Beheira', 'Ismailia', 'Faiyum', 'Beni Suef', 'Minya', 'Asyut',
  'Sohag', 'Qena', 'Aswan', 'Luxor', 'Red Sea', 'New Valley', 'Matrouh', 'North Sinai',
  'South Sinai', 'Kafr El Sheikh', 'Damietta',
]

const EDUCATIONAL_STAGES = ['High School', 'University', 'Postgraduate', 'Working Professional', 'Other']

const initialForm = {
  fullName: '', email: '', mobileNumber: '', whatsappNumber: '',
  gender: '', age: '', governorate: '', educationalStageDropdown: '',
  educationalStageOther: '', consentMediaUsage: false,
}

export default function RegistrationPage() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.consentMediaUsage) {
      setError('You must agree to the media consent to register.')
      return
    }
    if (form.educationalStageDropdown === 'Other' && !form.educationalStageOther.trim()) {
      setError('Please specify your educational stage.')
      return
    }

    const educationalStage = form.educationalStageDropdown === 'Other'
      ? form.educationalStageOther.trim()
      : form.educationalStageDropdown

    setSubmitting(true)
    try {
      await api.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        mobileNumber: form.mobileNumber.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        gender: form.gender,
        age: Number(form.age),
        governorate: form.governorate,
        educationalStage,
        consentMediaUsage: true,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fullscreen-msg">
        <h1 style={{ color: 'var(--success)' }}>✅ Registration received!</h1>
        <p style={{ color: 'var(--muted-foreground)', maxWidth: 420 }}>
          Thank you for registering. Your submission is under review — once approved,
          your official ticket (with a QR code) will be sent to your email.
        </p>
      </div>
    )
  }

  return (
    <div className="container-page" style={{ paddingBlock: '3rem' }}>
      <div className="eyebrow">GRV × CIC</div>
      <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginTop: '0.75rem' }}>
        GRV Offline Event 2026 — Registration
      </h1>
      <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', maxWidth: 640 }}>
        Welcome to the registration form for the first offline event organized by GRV in
        collaboration with Canadian International College (CIC).
      </p>
      <p style={{ marginTop: '0.5rem' }}>📅 <strong>Date:</strong> 30 July 2026</p>
      <p className="hint" style={{ marginTop: '0.75rem' }}>
        Please fill out the form carefully. Your registration will be reviewed, and once
        approved, your official ticket will be sent to your email. Completing this form
        does not guarantee attendance.
      </p>

      <form onSubmit={handleSubmit} className="card-surface" style={{ padding: '2rem', marginTop: '2rem', maxWidth: 640 }}>
        <div className="field">
          <label>Full Name *</label>
          <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
        </div>

        <div className="field">
          <label>Email Address *</label>
          <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          <div className="hint">Please make sure your email address is correct, as your ticket will be sent to it.</div>
        </div>

        <div className="field">
          <label>Mobile Number *</label>
          <input required value={form.mobileNumber} onChange={(e) => update('mobileNumber', e.target.value)} />
        </div>

        <div className="field">
          <label>WhatsApp Number *</label>
          <input required value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} />
        </div>

        <div className="field">
          <label>Gender *</label>
          <select required value={form.gender} onChange={(e) => update('gender', e.target.value)}>
            <option value="" disabled>Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div className="field">
          <label>Age *</label>
          <input type="number" min="5" max="120" required value={form.age} onChange={(e) => update('age', e.target.value)} />
        </div>

        <div className="field">
          <label>Governorate *</label>
          <select required value={form.governorate} onChange={(e) => update('governorate', e.target.value)}>
            <option value="" disabled>Select governorate</option>
            {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Educational Stage *</label>
          <select required value={form.educationalStageDropdown} onChange={(e) => update('educationalStageDropdown', e.target.value)}>
            <option value="" disabled>Select educational stage</option>
            {EDUCATIONAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {form.educationalStageDropdown === 'Other' && (
          <div className="field">
            <label>Please specify:</label>
            <input required value={form.educationalStageOther} onChange={(e) => update('educationalStageOther', e.target.value)} />
          </div>
        )}

        <div className="field checkbox-row">
          <input
            type="checkbox"
            id="consent"
            checked={form.consentMediaUsage}
            onChange={(e) => update('consentMediaUsage', e.target.checked)}
          />
          <label htmlFor="consent" style={{ marginBottom: 0, fontWeight: 500 }}>
            I agree that photos and videos taken during the event may be used for media purposes. *
          </label>
        </div>

        {error && (
          <div style={{ color: 'var(--destructive)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
        )}

        <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? <span className="spinner" /> : null}
          {submitting ? 'Submitting…' : 'Submit Registration'}
        </button>
      </form>

      <footer style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--muted-foreground)',
        fontSize: '0.9rem',
        maxWidth: 640,
      }}>
        <p style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
          Need help? Contact us
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.25rem' }}>
          <a
            href="https://wa.me/201099951278"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#25D366',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            +201099951278
          </a>
          <a
            href="mailto:grvteam20@gmail.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--primary)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            grvteam20@gmail.com
          </a>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', opacity: 0.5 }}>
          © 2026 GRV × CIC. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
