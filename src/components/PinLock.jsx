import { useState } from 'react'

const PIN_KEY = 'obs_app_pin'

export function getSavedPin() {
  return localStorage.getItem(PIN_KEY) || ''
}
export function setSavedPin(pin) {
  if (pin) localStorage.setItem(PIN_KEY, pin)
  else localStorage.removeItem(PIN_KEY)
}

export default function PinLock({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const savedPin = getSavedPin()

  function submit(e) {
    e.preventDefault()
    if (value === savedPin) {
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="connect-screen">
      <div>
        <h1>Bloqueado</h1>
        <p className="hint">Digite o PIN pra acessar o controle do OBS.</p>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>PIN</label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(false)
            }}
          />
        </div>
        {error && <div className="error-msg">PIN incorreto.</div>}
        <button className="primary-btn" type="submit">
          Entrar
        </button>
      </form>
    </div>
  )
}
