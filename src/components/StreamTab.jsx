import { useEffect, useState, useCallback, useRef } from 'react'
import { obsClient } from '../obsClient'

function formatTimecode(ms) {
  if (!ms) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function StreamTab({ viewOnly, pushToast }) {
  const [stream, setStream] = useState({ outputActive: false, outputDuration: 0, outputBytes: 0, outputSkippedFrames: 0, outputTotalFrames: 0 })
  const [record, setRecord] = useState({ outputActive: false, outputDuration: 0, outputPaused: false })
  const [replay, setReplay] = useState({ outputActive: false })
  const [kbps, setKbps] = useState(0)
  const lastBytes = useRef({ bytes: 0, t: Date.now() })

  const refresh = useCallback(async () => {
    const [s, r] = await Promise.all([obsClient.getStreamStatus(), obsClient.getRecordStatus()])
    setStream(s)
    setRecord(r)

    const now = Date.now()
    const dt = (now - lastBytes.current.t) / 1000
    if (dt > 0 && lastBytes.current.bytes) {
      const deltaBytes = s.outputBytes - lastBytes.current.bytes
      setKbps(Math.max(0, Math.round((deltaBytes * 8) / 1000 / dt)))
    }
    lastBytes.current = { bytes: s.outputBytes, t: now }

    try {
      const rb = await obsClient.getReplayBufferStatus()
      setReplay(rb)
    } catch {
      // replay buffer pode não estar configurado
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 1000)
    return () => clearInterval(id)
  }, [refresh])

  async function toggleStream() {
    if (viewOnly) return
    await obsClient.toggleStream()
    setTimeout(refresh, 300)
  }
  async function toggleRecord() {
    if (viewOnly) return
    await obsClient.toggleRecord()
    setTimeout(refresh, 300)
  }
  async function togglePause() {
    if (viewOnly) return
    await obsClient.togglePauseRecord()
    setTimeout(refresh, 300)
  }
  async function toggleReplay() {
    if (viewOnly) return
    if (replay.outputActive) await obsClient.stopReplayBuffer()
    else await obsClient.startReplayBuffer()
    setTimeout(refresh, 300)
  }
  async function saveReplay() {
    if (viewOnly) return
    await obsClient.saveReplayBuffer()
    pushToast?.('Replay salvo', 'success')
  }

  const droppedPct = stream.outputTotalFrames
    ? ((stream.outputSkippedFrames / stream.outputTotalFrames) * 100).toFixed(1)
    : '0.0'

  return (
    <div>
      <div className="section-label">Transmissão</div>
      <button className={`big-toggle stream ${stream.outputActive ? 'on' : ''}`} onClick={toggleStream}>
        <span className="timer">{formatTimecode(stream.outputDuration)}</span>
        <span className="sub">{stream.outputActive ? 'toque para parar a stream' : 'toque para iniciar a stream'}</span>
      </button>

      {stream.outputActive && (
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, marginBottom: 14 }}>
          <StatLine label="Bitrate" value={`${kbps} kbps`} />
          <StatLine label="Frames perdidos" value={`${stream.outputSkippedFrames} (${droppedPct}%)`} warn={Number(droppedPct) > 2} />
        </div>
      )}

      <div className="section-label" style={{ marginTop: 20 }}>
        Gravação
      </div>
      <button className={`big-toggle record ${record.outputActive ? 'on' : ''}`} onClick={toggleRecord}>
        <span className="timer">{formatTimecode(record.outputDuration)}</span>
        <span className="sub">
          {record.outputActive
            ? record.outputPaused
              ? 'gravação pausada'
              : 'toque para parar a gravação'
            : 'toque para iniciar a gravação'}
        </span>
      </button>

      {record.outputActive && (
        <div className="action-row" style={{ marginBottom: 20 }}>
          <button className="pill-btn" onClick={togglePause}>
            {record.outputPaused ? '▶ Retomar' : '⏸ Pausar'}
          </button>
        </div>
      )}

      <div className="section-label">Replay Buffer</div>
      <div className="action-row">
        <button className={`pill-btn ${replay.outputActive ? 'active-pill' : ''}`} onClick={toggleReplay}>
          {replay.outputActive ? 'Parar buffer' : 'Ativar buffer'}
        </button>
        <button className="pill-btn" onClick={saveReplay} disabled={!replay.outputActive}>
          💾 Salvar replay
        </button>
      </div>
    </div>
  )
}

function StatLine({ label, value, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: warn ? 'var(--accent-live)' : 'var(--text)' }}>{value}</span>
    </div>
  )
}
