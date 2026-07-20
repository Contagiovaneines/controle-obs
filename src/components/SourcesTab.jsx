import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'

export default function SourcesTab({ currentScene }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

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
  }, [load])

  async function toggle(item) {
    const next = !item.sceneItemEnabled
    await obsClient.setSceneItemEnabled(currentScene, item.sceneItemId, next)
    setItems((prev) =>
      prev.map((i) => (i.sceneItemId === item.sceneItemId ? { ...i, sceneItemEnabled: next } : i))
    )
  }

  if (loading) return <div className="empty-state">Carregando sources...</div>
  if (!items.length) return <div className="empty-state">Cena sem sources.</div>

  return (
    <div>
      <div className="section-label">Sources de "{currentScene}"</div>
      {items.map((item) => (
        <div className="row" key={item.sceneItemId}>
          <div className="row-name">{item.sourceName}</div>
          <button
            className={`icon-btn ${item.sceneItemEnabled ? 'active' : ''}`}
            onClick={() => toggle(item)}
          >
            {item.sceneItemEnabled ? '👁' : '—'}
          </button>
        </div>
      ))}
    </div>
  )
}
