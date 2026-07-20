export default function TopBar({ connected, streaming, recording, onDisconnect, onOpenPreview }) {
  return (
    <div className="topbar">
      <h1>OBS Remote</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        {streaming && (
          <div className="status-pill live">
            <span className="status-dot" /> AO VIVO
          </div>
        )}
        {recording && (
          <div className="status-pill live" style={{ color: '#f5a623' }}>
            <span className="status-dot" style={{ background: '#f5a623', boxShadow: '0 0 6px #f5a623' }} /> REC
          </div>
        )}
        <button className="status-pill" onClick={onOpenPreview} style={{ border: '1px solid var(--border)' }}>
          👁 preview
        </button>
        <button
          className={`status-pill ${connected ? 'on' : ''}`}
          onClick={onDisconnect}
          style={{ border: 'none' }}
        >
          <span className="status-dot" /> {connected ? 'conectado' : 'offline'}
        </button>
      </div>
    </div>
  )
}
