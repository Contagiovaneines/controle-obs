import { useEffect, useState } from 'react'
import { obsClient } from '../obsClient'

const STORAGE_KEY = 'obs_custom_buttons'

function loadButtons() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}
function saveButtons(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export default function ButtonsTab({ scenes, inputs }) {
  const [buttons, setButtons] = useState(loadButtons())
  const [adding, setAdding] = useState(false)
  const [hotkeys, setHotkeys] = useState([])
  const [form, setForm] = useState({ label: '', type: 'scene', target: '' })

  useEffect(() => {
    obsClient.getHotkeys().then(setHotkeys).catch(() => setHotkeys([]))
  }, [])

  function addButton(e) {
    e.preventDefault()
    if (!form.label || !form.target) return
    const next = [...buttons, { ...form, id: Date.now() }]
    setButtons(next)
    saveButtons(next)
    setForm({ label: '', type: 'scene', target: '' })
    setAdding(false)
  }

  function removeButton(id) {
    const next = buttons.filter((b) => b.id !== id)
    setButtons(next)
    saveButtons(next)
  }

  async function run(btn) {
    if (btn.type === 'scene') await obsClient.setScene(btn.target)
    if (btn.type === 'hotkey') await obsClient.triggerHotkey(btn.target)
    if (btn.type === 'mute') {
      const { inputMuted } = await obsClient.getInputMute(btn.target)
      await obsClient.setInputMute(btn.target, !inputMuted)
    }
  }

  return (
    <div>
      <div className="section-label">Botões customizados</div>

      {adding ? (
        <form className="add-btn-form" onSubmit={addButton}>
          <input
            placeholder="Nome do botão"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, target: '' })}
          >
            <option value="scene">Trocar cena</option>
            <option value="hotkey">Disparar hotkey</option>
            <option value="mute">Alternar mute</option>
          </select>
          <select
            value={form.target}
            onChange={(e) => setForm({ ...form, target: e.target.value })}
            required
          >
            <option value="">Selecione...</option>
            {form.type === 'scene' &&
              scenes.map((s) => (
                <option key={s.sceneName} value={s.sceneName}>
                  {s.sceneName}
                </option>
              ))}
            {form.type === 'hotkey' &&
              hotkeys.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            {form.type === 'mute' &&
              inputs.map((i) => (
                <option key={i.inputName} value={i.inputName}>
                  {i.inputName}
                </option>
              ))}
          </select>
          <div className="action-row">
            <button className="pill-btn" type="button" onClick={() => setAdding(false)}>
              Cancelar
            </button>
            <button className="primary-btn" type="submit" style={{ flex: 1 }}>
              Salvar
            </button>
          </div>
        </form>
      ) : (
        <button className="pill-btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => setAdding(true)}>
          + Novo botão
        </button>
      )}

      <div className="deck-grid">
        {buttons.map((btn) => (
          <div key={btn.id} style={{ position: 'relative' }}>
            <button className="deck-btn" onClick={() => run(btn)} style={{ width: '100%' }}>
              {btn.label}
            </button>
            <button
              onClick={() => removeButton(btn.id)}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 14,
                padding: 4
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {!buttons.length && !adding && (
        <div className="empty-state">Nenhum botão ainda. Crie atalhos pras suas ações mais usadas.</div>
      )}
    </div>
  )
}
