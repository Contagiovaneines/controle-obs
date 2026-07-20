import { useEffect, useState, useCallback, useRef } from 'react'
import { obsClient } from '../obsClient'

const MONITOR_CYCLE = [
  'OBS_MONITORING_TYPE_NONE',
  'OBS_MONITORING_TYPE_MONITOR_ONLY',
  'OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT'
]
const MONITOR_LABEL = {
  OBS_MONITORING_TYPE_NONE: 'Monitor: off',
  OBS_MONITORING_TYPE_MONITOR_ONLY: 'Monitor: só ouvir',
  OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT: 'Monitor: ouvir + stream'
}

export default function AudioTab({ viewOnly }) {
  const [inputs, setInputs] = useState([])
  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState({})
  const inputNames = useRef(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const audioInputs = await obsClient.getInputs()
      const withState = await Promise.all(
        audioInputs.map(async (input) => {
          const [mute, vol, monitorType] = await Promise.all([
            obsClient.getInputMute(input.inputName),
            obsClient.getInputVolume(input.inputName),
            obsClient.getInputAudioMonitorType(input.inputName).catch(() => 'OBS_MONITORING_TYPE_NONE')
          ])
          return {
            name: input.inputName,
            muted: mute.inputMuted,
            db: Math.round(vol.inputVolumeDb),
            monitorType
          }
        })
      )
      setInputs(withState)
      inputNames.current = new Set(withState.map((i) => i.name))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // VU meter em tempo real via evento de alto volume do obs-websocket
  useEffect(() => {
    function onMeters(data) {
      setLevels((prev) => {
        const next = { ...prev }
        for (const item of data.inputs) {
          if (!inputNames.current.has(item.inputName)) continue
          const channel = item.inputLevelsMul?.[0]
          const peak = channel ? channel[0] : 0
          next[item.inputName] = Math.min(1, peak)
        }
        return next
      })
    }
    obsClient.on('InputVolumeMeters', onMeters)
    return () => obsClient.off('InputVolumeMeters', onMeters)
  }, [])

  async function toggleMute(input) {
    if (viewOnly) return
    const next = !input.muted
    await obsClient.setInputMute(input.name, next)
    setInputs((prev) => prev.map((i) => (i.name === input.name ? { ...i, muted: next } : i)))
  }

  async function changeVolume(input, db) {
    if (viewOnly) return
    setInputs((prev) => prev.map((i) => (i.name === input.name ? { ...i, db } : i)))
  }

  async function commitVolume(input, db) {
    if (viewOnly) return
    await obsClient.setInputVolume(input.name, db)
  }

  async function cycleMonitor(input) {
    if (viewOnly) return
    const idx = MONITOR_CYCLE.indexOf(input.monitorType)
    const next = MONITOR_CYCLE[(idx + 1) % MONITOR_CYCLE.length]
    await obsClient.setInputAudioMonitorType(input.name, next)
    setInputs((prev) => prev.map((i) => (i.name === input.name ? { ...i, monitorType: next } : i)))
  }

  if (loading) return <div className="empty-state">Carregando fontes de áudio...</div>
  if (!inputs.length) return <div className="empty-state">Nenhuma fonte de áudio encontrada.</div>

  return (
    <div>
      <div className="section-label">Mixer de áudio</div>
      {inputs.map((input) => (
        <div className="row audio-row" key={input.name}>
          <div className="audio-row-top">
            <div className="row-name">{input.name}</div>
            <button
              className={`icon-btn ${input.muted ? 'muted' : 'active'}`}
              onClick={() => toggleMute(input)}
            >
              {input.muted ? '🔇' : '🔊'}
            </button>
          </div>
          <div className="vu-track">
            <div
              className={`vu-fill ${levels[input.name] > 0.85 ? 'vu-hot' : ''}`}
              style={{ width: `${Math.round((levels[input.name] || 0) * 100)}%` }}
            />
          </div>
          <input
            type="range"
            min={-60}
            max={0}
            value={input.db}
            onChange={(e) => changeVolume(input, Number(e.target.value))}
            onMouseUp={(e) => commitVolume(input, Number(e.target.value))}
            onTouchEnd={(e) => commitVolume(input, Number(e.target.value))}
          />
          <div className="db-readout">{input.db} dB</div>
          <button className="pill-btn monitor-btn" onClick={() => cycleMonitor(input)}>
            {MONITOR_LABEL[input.monitorType] || 'Monitor: off'}
          </button>
        </div>
      ))}
    </div>
  )
}
