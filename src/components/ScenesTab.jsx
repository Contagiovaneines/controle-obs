import { useEffect, useState, useCallback, useRef } from 'react'
import { obsClient } from '../obsClient'

const FAV_KEY = 'obs_favorite_scenes'
function loadFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) || []
  } catch {
    return []
  }
}
function saveFavs(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list))
}

export default function ScenesTab({ scenes, currentScene, onChanged, viewOnly, studioMode, previewScene, onPreviewChanged }) {
  const [favorites, setFavorites] = useState(loadFavs())
  const [thumbs, setThumbs] = useState({})
  const [transitions, setTransitions] = useState({ transitions: [], currentSceneTransitionName: '' })
  const [duration, setDuration] = useState(300)
  const thumbTimer = useRef(null)

  const loadThumb = useCallback(async (name) => {
    try {
      const data = await obsClient.getSceneScreenshot(name, 240)
      setThumbs((prev) => ({ ...prev, [name]: data }))
    } catch {
      // fonte pode não suportar screenshot ainda, ignora
    }
  }, [])

  // Carrega miniatura de todas as cenas uma vez, e atualiza a ativa periodicamente
  useEffect(() => {
    scenes.forEach((s) => loadThumb(s.sceneName))
  }, [scenes, loadThumb])

  useEffect(() => {
    if (!currentScene) return
    loadThumb(currentScene)
    clearInterval(thumbTimer.current)
    thumbTimer.current = setInterval(() => loadThumb(currentScene), 4000)
    return () => clearInterval(thumbTimer.current)
  }, [currentScene, loadThumb])

  useEffect(() => {
    obsClient
      .getTransitions()
      .then((t) => {
        setTransitions(t)
        if (t.transitionDuration) setDuration(t.transitionDuration)
      })
      .catch(() => {})
  }, [])

  async function selectScene(name) {
    if (viewOnly) return
    if (studioMode) {
      if (name === previewScene) return
      await obsClient.setPreviewScene(name)
      onPreviewChanged(name)
      return
    }
    if (name === currentScene) return
    await obsClient.setScene(name)
    onChanged(name)
  }

  async function triggerTransition() {
    if (viewOnly) return
    await obsClient.triggerStudioTransition()
  }

  function toggleFav(e, name) {
    e.stopPropagation()
    const next = favorites.includes(name) ? favorites.filter((f) => f !== name) : [...favorites, name]
    setFavorites(next)
    saveFavs(next)
  }

  async function changeTransition(name) {
    await obsClient.setTransition(name)
    setTransitions((t) => ({ ...t, currentSceneTransitionName: name }))
  }

  async function changeDuration(ms) {
    setDuration(ms)
    await obsClient.setTransitionDuration(ms)
  }

  if (!scenes.length) {
    return <div className="empty-state">Nenhuma cena encontrada.</div>
  }

  const sorted = [...scenes].sort((a, b) => {
    const favA = favorites.includes(a.sceneName) ? 0 : 1
    const favB = favorites.includes(b.sceneName) ? 0 : 1
    return favA - favB
  })

  return (
    <div>
      {transitions.transitions.length > 0 && (
        <>
          <div className="section-label">Transição</div>
          <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <select
              className="settings-select"
              value={transitions.currentSceneTransitionName}
              onChange={(e) => changeTransition(e.target.value)}
              disabled={viewOnly}
            >
              {transitions.transitions.map((t) => (
                <option key={t.transitionName} value={t.transitionName}>
                  {t.transitionName}
                </option>
              ))}
            </select>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={duration}
              onChange={(e) => changeDuration(Number(e.target.value))}
              disabled={viewOnly}
            />
            <div className="db-readout">{duration} ms</div>
          </div>
        </>
      )}

      {studioMode && (
        <button className="big-toggle stream on transition-btn" onClick={triggerTransition}>
          <span className="sub" style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>
            ▶ Transicionar preview → program
          </span>
        </button>
      )}

      <div className="section-label" style={{ marginTop: 14 }}>
        Cenas · {scenes.length}
        {studioMode && <span style={{ marginLeft: 8, color: 'var(--accent-select)' }}>● preview</span>}
        {studioMode && <span style={{ marginLeft: 8, color: 'var(--accent-live)' }}>● program</span>}
      </div>
      <div className="deck-grid">
        {sorted.map((scene) => {
          const isProgram = scene.sceneName === currentScene
          const isPreview = studioMode && scene.sceneName === previewScene
          return (
            <button
              key={scene.sceneName}
              className={`deck-btn preview-btn ${!studioMode && isProgram ? 'active' : ''} ${isPreview ? 'preview-active' : ''}`}
              onClick={() => selectScene(scene.sceneName)}
            >
              {thumbs[scene.sceneName] ? (
                <img className="deck-thumb" src={thumbs[scene.sceneName]} alt="" />
              ) : (
                <div className="deck-thumb deck-thumb-empty" />
              )}
              {studioMode && isProgram && <span className="program-tag">PROGRAM</span>}
              <span className="led" />
              <span
                className={`star ${favorites.includes(scene.sceneName) ? 'starred' : ''}`}
                onClick={(e) => toggleFav(e, scene.sceneName)}
              >
                ★
              </span>
              <span className="deck-label">{scene.sceneName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
