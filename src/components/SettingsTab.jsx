import { useEffect, useState, useCallback } from 'react'
import { obsClient } from '../obsClient'
import { getSavedPin, setSavedPin } from './PinLock'

export default function SettingsTab({ viewOnly, setViewOnly, studioMode, setStudioMode }) {
  const [profiles, setProfiles] = useState({ profiles: [], currentProfileName: '' })
  const [collections, setCollections] = useState({ sceneCollections: [], currentSceneCollectionName: '' })
  const [stats, setStats] = useState(null)
  const [pin, setPin] = useState(getSavedPin())

  const load = useCallback(async () => {
    const [p, c, s] = await Promise.all([
      obsClient.getProfiles(),
      obsClient.getSceneCollections(),
      obsClient.getStats()
    ])
    setProfiles(p)
    setCollections(c)
    setStats(s)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => obsClient.getStats().then(setStats).catch(() => {}), 3000)
    return () => clearInterval(id)
  }, [load])

  async function toggleStudio() {
    const next = !studioMode
    await obsClient.setStudioModeEnabled(next)
    setStudioMode(next)
  }

  async function changeProfile(name) {
    await obsClient.setProfile(name)
    setProfiles((p) => ({ ...p, currentProfileName: name }))
  }

  async function changeCollection(name) {
    await obsClient.setSceneCollection(name)
    setCollections((c) => ({ ...c, currentSceneCollectionName: name }))
  }

  function savePin() {
    setSavedPin(pin)
  }

  return (
    <div>
      <div className="section-label">Studio Mode</div>
      <div className="row">
        <div className="row-name">Preview / Program separados</div>
        <button className={`icon-btn ${studioMode ? 'active' : ''}`} onClick={toggleStudio}>
          {studioMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>
        Perfil
      </div>
      <div className="row">
        <select
          className="settings-select"
          value={profiles.currentProfileName}
          onChange={(e) => changeProfile(e.target.value)}
        >
          {profiles.profiles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>
        Coleção de cenas
      </div>
      <div className="row">
        <select
          className="settings-select"
          value={collections.currentSceneCollectionName}
          onChange={(e) => changeCollection(e.target.value)}
        >
          {collections.sceneCollections.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>
        Modo visualização
      </div>
      <div className="row">
        <div className="row-name">Bloquear ações (só ver status)</div>
        <button className={`icon-btn ${viewOnly ? 'active' : ''}`} onClick={() => setViewOnly(!viewOnly)}>
          {viewOnly ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 18 }}>
        PIN de acesso ao app
      </div>
      <div className="add-btn-form">
        <input
          type="password"
          inputMode="numeric"
          placeholder="deixe vazio pra remover o PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button className="primary-btn" onClick={savePin}>
          {pin ? 'Salvar PIN' : 'Remover PIN'}
        </button>
      </div>

      {stats && (
        <>
          <div className="section-label" style={{ marginTop: 18 }}>
            Performance do OBS
          </div>
          <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <StatLine label="CPU" value={`${stats.cpuUsage.toFixed(1)}%`} />
            <StatLine label="FPS ativo" value={stats.activeFps.toFixed(1)} />
            <StatLine label="Frames renderizados perdidos" value={stats.renderSkippedFrames} />
            <StatLine label="Frames de saída perdidos" value={stats.outputSkippedFrames} />
            <StatLine label="Memória" value={`${Math.round(stats.memoryUsage)} MB`} />
          </div>
        </>
      )}
    </div>
  )
}

function StatLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}
