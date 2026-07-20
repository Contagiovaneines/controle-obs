import { useState } from 'react'

const CONN_KEY = 'obs_connections'

export function loadConnections() {
  try {
    return JSON.parse(localStorage.getItem(CONN_KEY)) || []
  } catch {
    return []
  }
}
function saveConnections(list) {
  localStorage.setItem(CONN_KEY, JSON.stringify(list))
}

export default function ConnectScreen({ onConnect, connecting, error }) {
  const [connections, setConnections] = useState(loadConnections())
  const [adding, setAdding] = useState(connections.length === 0)
  const [name, setName] = useState('')
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('4455')
  const [password, setPassword] = useState('')

  function saveNew(e) {
    e.preventDefault()
    const conn = { id: Date.now(), name: name || ip, ip, port, password }
    const next = [...connections, conn]
    setConnections(next)
    saveConnections(next)
    setAdding(false)
    onConnect(conn)
  }

  function removeConn(id) {
    const next = connections.filter((c) => c.id !== id)
    setConnections(next)
    saveConnections(next)
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

      {!adding && connections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {connections.map((c) => (
            <div className="row" key={c.id}>
              <div style={{ flex: 1 }}>
                <div className="row-name">{c.name}</div>
                <div className="db-readout" style={{ textAlign: 'left' }}>
                  {c.ip}:{c.port}
                </div>
              </div>
              <button className="pill-btn" onClick={() => onConnect(c)} disabled={connecting}>
                {connecting ? '...' : 'Conectar'}
              </button>
              <button className="icon-btn" onClick={() => removeConn(c.id)}>
                ✕
              </button>
            </div>
          ))}
          <button className="pill-btn" onClick={() => setAdding(true)}>
            + Adicionar outro PC
          </button>
        </div>
      )}

      {adding && (
        <form onSubmit={saveNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Nome (opcional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="PC do estúdio" />
          </div>
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
            {connecting ? 'Conectando...' : 'Salvar e conectar'}
          </button>
          {connections.length > 0 && (
            <button type="button" className="pill-btn" onClick={() => setAdding(false)}>
              Cancelar
            </button>
          )}
        </form>
      )}
      {error && !adding && <div className="error-msg">{error}</div>}
    </div>
  )
}
