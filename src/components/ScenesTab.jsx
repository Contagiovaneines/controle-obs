import { obsClient } from '../obsClient'

export default function ScenesTab({ scenes, currentScene, onChanged }) {
  async function selectScene(name) {
    if (name === currentScene) return
    await obsClient.setScene(name)
    onChanged(name)
  }

  if (!scenes.length) {
    return <div className="empty-state">Nenhuma cena encontrada.</div>
  }

  return (
    <div>
      <div className="section-label">Cenas · {scenes.length}</div>
      <div className="deck-grid">
        {scenes.map((scene) => (
          <button
            key={scene.sceneName}
            className={`deck-btn ${scene.sceneName === currentScene ? 'active' : ''}`}
            onClick={() => selectScene(scene.sceneName)}
          >
            <span className="led" />
            {scene.sceneName}
          </button>
        ))}
      </div>
    </div>
  )
}
