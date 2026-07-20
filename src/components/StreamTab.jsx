import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'

function formatTimecode(ms) {
  if (!ms) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function StreamTab() {
  const [stream, setStream] = useState({ outputActive: false, outputDuration: 0 })
  const [record, setRecord] = useState({ outputActive: false, outputDuration: 0, outputPaused: false })

  const refresh = useCallback(async () => {
    const [s, r] = await Promise.all([obsClient.getStreamStatus(), obsClient.getRecordStatus()])
    setStream(s)
    setRecord(r)
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 1000)
    return () => clearInterval(id)
  }, [refresh])

  async function toggleStream() {
    await obsClient.toggleStream()
    setTimeout(refresh, 300)
  }
  async function toggleRecord() {
    await obsClient.toggleRecord()
    setTimeout(refresh, 300)
  }
  async function togglePause() {
    await obsClient.togglePauseRecord()
    setTimeout(refresh, 300)
  }

  return (
    <div>
      <div className="section-label">Transmissão</div>
      <button className={`big-toggle stream ${stream.outputActive ? 'on' : ''}`} onClick={toggleStream}>
        <span className="timer">{formatTimecode(stream.outputDuration)}</span>
        <span className="sub">{stream.outputActive ? 'toque para parar a stream' : 'toque para iniciar a stream'}</span>
      </button>

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
        <div className="action-row">
          <button className="pill-btn" onClick={togglePause}>
            {record.outputPaused ? '▶ Retomar' : '⏸ Pausar'}
          </button>
        </div>
      )}
    </div>
  )
}
