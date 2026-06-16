import { useState } from 'react'
import { signIn, registerUser, loginUser } from '../lib/api'

export default function AuthModal({ defaultTab, hoods, onSuccess, onClose }) {
  const [tab, setTab] = useState(defaultTab || 'login')
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [regName, setRegName] = useState('')
  const [regHood, setRegHood] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regErr, setRegErr] = useState('')

  const handleLogin = async () => {
    setLoginErr('')
    if (!loginPhone || !loginPassword) { setLoginErr('Phone and password required'); return }
    try {
      const user = await loginUser(loginPhone, loginPassword)
      onSuccess(user)
    } catch (e) { setLoginErr(e.message) }
  }

  const handleRegister = async () => {
    setRegErr('')
    if (!regName || !regHood || !regPhone || !regPassword) { setRegErr('All fields are required'); return }
    try {
      const user = await registerUser(regName, parseInt(regHood), regPhone, regPassword)
      onSuccess(user)
    } catch (e) { setRegErr(e.message) }
  }

  return (
    <div className="auth-modal-backdrop open" id="authModalBackdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>
        <h2>Welcome to AddisDR</h2>
        <p className="auth-sub">Sign in or create an account to rate and report businesses.</p>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {tab === 'login' ? (
          <div id="loginForm">
            <div className="auth-field">
              <label>Phone Number</label>
              <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="+251911000000" autoComplete="tel" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            {loginErr && <div className="auth-err">{loginErr}</div>}
            <button className="auth-btn" onClick={handleLogin}>Sign In</button>
          </div>
        ) : (
          <div id="registerForm">
            <div className="auth-field">
              <label>Full Name *</label>
              <input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Abebe Bikila" autoComplete="name" />
            </div>
            <div className="auth-field">
              <label>Neighbourhood *</label>
              <select value={regHood} onChange={e => setRegHood(e.target.value)}>
                <option value="">— select your hood —</option>
                {hoods.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <label>Phone Number *</label>
              <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+251911000000" autoComplete="tel" />
            </div>
            <div className="auth-field">
              <label>Password *</label>
              <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Choose a password (min 4 chars)" autoComplete="new-password" />
            </div>
            {regErr && <div className="auth-err">{regErr}</div>}
            <button className="auth-btn" onClick={handleRegister}>Create Account</button>
          </div>
        )}
      </div>
    </div>
  )
}
