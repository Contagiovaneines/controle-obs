import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'

export default function AudioTab() {
  const [inputs, setInputs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const audioInputs = await obsClient.getInputs()
      const withState = await Promise.all(
        audioInputs.map(async (input) => {
          const [mute, vol] = await Promise.all([
            obsClient.getInputMute(input.inputName),
            obsClient.getInputVolume(input.inputName)
          ])
          return {
            name: input.inputName,
            muted: mute.inputMuted,
            db: Math.round(vol.inputVolumeDb)
          }
        })
      )
      setInputs(withState)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleMute(input) {
    const next = !input.muted
    await obsClient.setInputMute(input.name, next)
    setInputs((prev) => prev.map((i) => (i.name === input.name ? { ...i, muted: next } : i)))
  }

  async function changeVolume(input, db) {
    setInputs((prev) => prev.map((i) => (i.name === input.name ? { ...i, db } : i)))
  }

  async function commitVolume(input, db) {
    await obsClient.setInputVolume(input.name, db)
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
        </div>
      ))}
    </div>
  )
}
