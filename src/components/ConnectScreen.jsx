import { useState } from 'react'

export default function ConnectScreen({ onConnect, connecting, error }) {
  const [ip, setIp] = useState(localStorage.getItem('obs_ip') || '')
  const [port, setPort] = useState(localStorage.getItem('obs_port') || '4455')
  const [password, setPassword] = useState(localStorage.getItem('obs_password') || '')

  function submit(e) {
    e.preventDefault()
    localStorage.setItem('obs_ip', ip)
    localStorage.setItem('obs_port', port)
    localStorage.setItem('obs_password', password)
    onConnect(ip, port, password)
  }

  return (
    <div className="connect-screen">
      <div>
        <h1>OBS Remote</h1>
        <p className="hint">
          No OBS: Ferramentas → WebSocket Server Settings → habilite o servidor
          e copie a porta e a senha. O celular precisa estar na mesma Wi-Fi do PC.
        </p>
      </div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>IP do PC</label>
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.0.10"
            inputMode="decimal"
            required
          />
        </div>
        <div className="field">
          <label>Porta</label>
          <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="4455" required />
        </div>
        <div className="field">
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="(deixe em branco se desabilitou auth)"
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button className="primary-btn" type="submit" disabled={connecting}>
          {connecting ? 'Conectando...' : 'Conectar'}
        </button>
      </form>
    </div>
  )
}
