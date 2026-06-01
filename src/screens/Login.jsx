import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

const AVATARS = ['🧑‍🚀', '🦊', '🐯', '🐼', '🦄', '🐲', '🤖', '👾', '🦁', '🐵', '🐶', '🐱']

export default function Login() {
  const { signup, login } = useApp()
  const [tab, setTab] = useState('signup')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const res = tab === 'signup' ? signup(name, password, avatar) : login(name, password)
    if (res.error) setError(res.error)
  }

  return (
    <div className="auth-wrap">
      <div className="brand">
        <div className="star">⭐</div>
        <h1>StockStars</h1>
        <p>Become a stock star! Trade real companies with pretend money.</p>
      </div>

      <div className="tabs">
        <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setError('') }}>
          Sign Up
        </button>
        <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError('') }}>
          Log In
        </button>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label>Username</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="pick a cool name" autoCapitalize="none" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="a secret password" />
        </div>

        {tab === 'signup' && (
          <div className="field">
            <label>Pick your avatar</label>
            <div className="avatar-pick">
              {AVATARS.map((a) => (
                <button type="button" key={a} className={avatar === a ? 'active' : ''} onClick={() => setAvatar(a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button className="btn" type="submit" style={{ marginTop: 6 }}>
          {tab === 'signup' ? 'Start with $1,000! 🚀' : 'Log In'}
        </button>
      </form>

      {tab === 'signup' && (
        <p className="muted center" style={{ fontSize: 13, marginTop: 16 }}>
          Everyone starts with $1,000 of pretend money to invest. No real money is used. 💜
        </p>
      )}
    </div>
  )
}
