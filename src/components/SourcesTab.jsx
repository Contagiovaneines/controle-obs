import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'

const KIND_LABELS = {
  browser_source: 'Navegador (Browser Source)',
  text_gdiplus_v3: 'Texto',
  text_gdiplus_v2: 'Texto',
  text_ft2_source_v2: 'Texto',
  image_source: 'Imagem',
  color_source_v3: 'Cor sólida',
  color_source_v2: 'Cor sólida',
  ffmpeg_source: 'Mídia (vídeo/áudio)',
  slideshow: 'Apresentação de imagens',
  monitor_capture: 'Captura de tela',
  window_capture: 'Captura de janela',
  game_capture: 'Captura de jogo',
  dshow_input: 'Dispositivo de captura (webcam)',
  wasapi_input_capture: 'Microfone',
  wasapi_output_capture: 'Áudio do desktop'
}

export default function SourcesTab({ currentScene, viewOnly }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [transform, setTransform] = useState(null)
  const [filters, setFilters] = useState([])

  const [kinds, setKinds] = useState([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', kind: '', text: '', url: '' })

  const load = useCallback(async () => {
    if (!currentScene) return
    setLoading(true)
    try {
      const { sceneItems } = await obsClient.getSceneItems(currentScene)
      setItems(sceneItems.sort((a, b) => b.sceneItemId - a.sceneItemId))
    } finally {
      setLoading(false)
    }
  }, [currentScene])

  useEffect(() => {
    load()
    setExpanded(null)
    setTransform(null)
    setFilters([])
  }, [load])

  useEffect(() => {
    obsClient.getInputKinds().then(setKinds).catch(() => setKinds([]))
  }, [])

  async function toggle(item) {
    if (viewOnly) return
    const next = !item.sceneItemEnabled
    await obsClient.setSceneItemEnabled(currentScene, item.sceneItemId, next)
    setItems((prev) =>
      prev.map((i) => (i.sceneItemId === item.sceneItemId ? { ...i, sceneItemEnabled: next } : i))
    )
  }

  async function toggleExpand(item) {
    if (expanded === item.sceneItemId) {
      setExpanded(null)
      setTransform(null)
      setFilters([])
      return
    }
    setExpanded(item.sceneItemId)
    const [t, f] = await Promise.all([
      obsClient.getSceneItemTransform(currentScene, item.sceneItemId),
      obsClient.getSourceFilters(item.sourceName).catch(() => [])
    ])
    setTransform(t)
    setFilters(f)
  }

  function updateField(field, value) {
    setTransform((prev) => ({ ...prev, [field]: value }))
  }

  async function commitField(sceneItemId, field, value) {
    if (viewOnly) return
    await obsClient.setSceneItemTransform(currentScene, sceneItemId, { [field]: value })
  }

  async function toggleFilter(sourceName, filterName, enabled) {
    if (viewOnly) return
    const next = !enabled
    await obsClient.setFilterEnabled(sourceName, filterName, next)
    setFilters((prev) => prev.map((f) => (f.filterName === filterName ? { ...f, filterEnabled: next } : f)))
  }

  async function handleAddSource(e) {
    e.preventDefault()
    if (viewOnly || !form.name.trim() || !form.kind) return
    let settings = {}
    if (form.kind.startsWith('text')) settings = { text: form.text }
    else if (form.kind === 'browser_source') settings = { url: form.url || 'https://', width: 1280, height: 720 }
    await obsClient.createInput(currentScene, form.name.trim(), form.kind, settings)
    setForm({ name: '', kind: '', text: '', url: '' })
    setAdding(false)
    load()
  }

  const kindOptions = kinds.map((k) => ({ kind: k, label: KIND_LABELS[k] || k }))

  return (
    <div>
      <div className="section-label">Sources de "{currentScene}"</div>

      {!viewOnly &&
        (adding ? (
          <form className="add-btn-form" onSubmit={handleAddSource}>
            <input
              placeholder="Nome da fonte"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
              required
            >
              <option value="">Tipo de fonte...</option>
              {kindOptions.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
            {form.kind.startsWith('text') && (
              <input
                placeholder="Texto"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
              />
            )}
            {form.kind === 'browser_source' && (
              <input
                placeholder="URL (ex: https://...)"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            )}
            {form.kind && !form.kind.startsWith('text') && form.kind !== 'browser_source' && (
              <div className="empty-state" style={{ padding: 6, fontSize: 11 }}>
                Criada com configuração padrão — ajuste os detalhes no OBS.
              </div>
            )}
            <div className="action-row">
              <button className="pill-btn" type="button" onClick={() => setAdding(false)}>
                Cancelar
              </button>
              <button className="primary-btn" type="submit" style={{ flex: 1 }}>
                Criar fonte
              </button>
            </div>
          </form>
        ) : (
          <button className="pill-btn" style={{ width: '100%', marginBottom: 12 }} onClick={() => setAdding(true)}>
            + Nova fonte
          </button>
        ))}

      {loading && <div className="empty-state">Carregando sources...</div>}
      {!loading && !items.length && <div className="empty-state">Cena sem sources.</div>}

      {items.map((item) => (
        <div key={item.sceneItemId} className="source-block">
          <div className="row source-row">
            <div className="row-name">{item.sourceName}</div>
            <button className="icon-btn" onClick={() => toggleExpand(item)}>
              {expanded === item.sceneItemId ? '▴' : '▾'}
            </button>
            <button
              className={`icon-btn ${item.sceneItemEnabled ? 'active' : ''}`}
              onClick={() => toggle(item)}
            >
              {item.sceneItemEnabled ? '👁' : '—'}
            </button>
          </div>

          {expanded === item.sceneItemId && (
            <div className="transform-panel">
              {!transform ? (
                <div className="empty-state" style={{ padding: 12 }}>
                  Carregando...
                </div>
              ) : (
                <>
                  <TransformFields
                    transform={transform}
                    viewOnly={viewOnly}
                    onChange={updateField}
                    onCommit={(field, value) => commitField(item.sceneItemId, field, value)}
                  />
                  {filters.length > 0 && (
                    <>
                      <div className="section-label" style={{ marginTop: 14 }}>
                        Filtros
                      </div>
                      {filters.map((f) => (
                        <div className="row" key={f.filterName} style={{ marginBottom: 6 }}>
                          <div className="row-name">{f.filterName}</div>
                          <button
                            className={`icon-btn ${f.filterEnabled ? 'active' : ''}`}
                            onClick={() => toggleFilter(item.sourceName, f.filterName, f.filterEnabled)}
                          >
                            {f.filterEnabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TransformFields({ transform, viewOnly, onChange, onCommit }) {
  const fields = [
    { key: 'positionX', label: 'Posição X', step: 1 },
    { key: 'positionY', label: 'Posição Y', step: 1 },
    { key: 'scaleX', label: 'Escala X', step: 0.01 },
    { key: 'scaleY', label: 'Escala Y', step: 0.01 },
    { key: 'rotation', label: 'Rotação (°)', step: 1 }
  ]

  return (
    <div className="transform-grid">
      {fields.map((f) => (
        <label key={f.key} className="transform-field">
          <span>{f.label}</span>
          <input
            type="number"
            step={f.step}
            value={Math.round((transform[f.key] ?? 0) * 100) / 100}
            disabled={viewOnly}
            onChange={(e) => onChange(f.key, Number(e.target.value))}
            onBlur={(e) => onCommit(f.key, Number(e.target.value))}
          />
        </label>
      ))}
    </div>
  )
}
