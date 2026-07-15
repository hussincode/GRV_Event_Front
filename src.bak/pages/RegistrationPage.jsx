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
    </div>
  )
}
