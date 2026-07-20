import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'

const MOVE_PATTERNS = {
  panLeft: /pan.*left|left.*pan/i,
  panRight: /pan.*right|right.*pan/i,
  tiltUp: /tilt.*up|up.*tilt/i,
  tiltDown: /tilt.*down|down.*tilt/i,
  zoomIn: /zoom.*(in|tele)|tele.*zoom/i,
  zoomOut: /zoom.*(out|wide)|wide.*zoom/i
}

export default function PtzTab({ viewOnly, pushToast }) {
  const [hotkeys, setHotkeys] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await obsClient.getHotkeys()
      setHotkeys(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function trigger(name) {
    if (viewOnly || !name) return
    try {
      await obsClient.triggerHotkey(name)
    } catch (err) {
      pushToast?.(err?.message || 'Não foi possível disparar o hotkey', 'error')
    }
  }

  if (loading) return <div className="empty-state">Procurando hotkeys de câmera...</div>

  const ptzHotkeys = hotkeys.filter((h) => /pan|tilt|zoom|ptz/i.test(h))
  const presetHotkeys = hotkeys.filter((h) => /preset/i.test(h) && !ptzHotkeys.includes(h))

  const find = (pattern) => ptzHotkeys.find((h) => pattern.test(h))
  const dpad = {
    panLeft: find(MOVE_PATTERNS.panLeft),
    panRight: find(MOVE_PATTERNS.panRight),
    tiltUp: find(MOVE_PATTERNS.tiltUp),
    tiltDown: find(MOVE_PATTERNS.tiltDown),
    zoomIn: find(MOVE_PATTERNS.zoomIn),
    zoomOut: find(MOVE_PATTERNS.zoomOut)
  }
  const matched = new Set(Object.values(dpad).filter(Boolean))
  const unmatched = ptzHotkeys.filter((h) => !matched.has(h))
  const hasDpad = Object.values(dpad).some(Boolean)

  if (!ptzHotkeys.length && !presetHotkeys.length) {
    return (
      <div>
        <div className="section-label">Câmera / PTZ</div>
        <div className="empty-state">
          Não encontrei nenhum hotkey com nome de pan/tilt/zoom/preset no OBS.
          Veja em Configurações → Hotkeys (no OBS) o nome exato dos atalhos do seu
          plugin de PTZ e crie um botão customizado na aba "Botões" apontando pra
          eles (tipo "Disparar hotkey").
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="section-label">Câmera / PTZ</div>
      <div className="empty-state" style={{ padding: '10px 12px', textAlign: 'left', marginBottom: 14 }}>
        Detecção automática pelo nome dos hotkeys no OBS — cada toque dispara um
        passo, não é movimento contínuo. Se algum botão não corresponder à ação
        certa, crie um botão customizado na aba "Botões" com o hotkey exato.
      </div>

      {hasDpad && (
        <>
          <div className="section-label">Movimento</div>
          <div className="ptz-dpad">
            <span />
            <button className="pill-btn ptz-btn" disabled={viewOnly || !dpad.tiltUp} onClick={() => trigger(dpad.tiltUp)}>
              ▲
            </button>
            <span />
            <button className="pill-btn ptz-btn" disabled={viewOnly || !dpad.panLeft} onClick={() => trigger(dpad.panLeft)}>
              ◀
            </button>
            <div className="ptz-center">●</div>
            <button className="pill-btn ptz-btn" disabled={viewOnly || !dpad.panRight} onClick={() => trigger(dpad.panRight)}>
              ▶
            </button>
            <span />
            <button className="pill-btn ptz-btn" disabled={viewOnly || !dpad.tiltDown} onClick={() => trigger(dpad.tiltDown)}>
              ▼
            </button>
            <span />
          </div>
        </>
      )}

      {(dpad.zoomIn || dpad.zoomOut) && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>
            Zoom
          </div>
          <div className="action-row">
            <button className="pill-btn" disabled={viewOnly || !dpad.zoomOut} onClick={() => trigger(dpad.zoomOut)}>
              − Zoom out
            </button>
            <button className="pill-btn" disabled={viewOnly || !dpad.zoomIn} onClick={() => trigger(dpad.zoomIn)}>
              + Zoom in
            </button>
          </div>
        </>
      )}

      {presetHotkeys.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>
            Presets
          </div>
          <div className="deck-grid">
            {presetHotkeys.map((h) => (
              <button key={h} className="deck-btn" disabled={viewOnly} onClick={() => trigger(h)}>
                {h}
              </button>
            ))}
          </div>
        </>
      )}

      {unmatched.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 16 }}>
            Outros hotkeys de câmera detectados
          </div>
          <div className="deck-grid">
            {unmatched.map((h) => (
              <button key={h} className="deck-btn" disabled={viewOnly} onClick={() => trigger(h)}>
                {h}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
