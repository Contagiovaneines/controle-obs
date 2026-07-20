import { useCallback, useEffect, useRef, useState } from 'react'
import { obsClient } from './obsClient'
import ConnectScreen from './components/ConnectScreen'
import PinLock, { getSavedPin } from './components/PinLock'
import TopBar from './components/TopBar'
import TabBar from './components/TabBar'
import ScenesTab from './components/ScenesTab'
import SourcesTab from './components/SourcesTab'
import AudioTab from './components/AudioTab'
import StreamTab from './components/StreamTab'
import ButtonsTab from './components/ButtonsTab'
import SettingsTab from './components/SettingsTab'
import ToastStack, { useToasts } from './components/Toast'

const VIEW_ONLY_KEY = 'obs_view_only'

export default function App() {
  const [unlocked, setUnlocked] = useState(!getSavedPin())
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('scenes')
  const { toasts, push } = useToasts()

  const [scenes, setScenes] = useState([])
  const [currentScene, setCurrentScene] = useState('')
  const [previewScene, setPreviewScene] = useState('')
  const [inputs, setInputs] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [recording, setRecording] = useState(false)
  const [studioMode, setStudioMode] = useState(false)
  const [viewOnly, setViewOnly] = useState(localStorage.getItem(VIEW_ONLY_KEY) === '1')

  const lastConn = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectAttempt = useRef(0)

  useEffect(() => {
    localStorage.setItem(VIEW_ONLY_KEY, viewOnly ? '1' : '0')
  }, [viewOnly])

  const loadInitialState = useCallback(async () => {
    const { scenes: sceneList, currentProgramSceneName } = await obsClient.getScenes()
    setScenes(sceneList)
    setCurrentScene(currentProgramSceneName)

    const audioInputs = await obsClient.getInputs()
    setInputs(audioInputs)

    const s = await obsClient.getStreamStatus()
    setStreaming(s.outputActive)
    const r = await obsClient.getRecordStatus()
    setRecording(r.outputActive)

    const sm = await obsClient.getStudioModeEnabled()
    setStudioMode(sm)
    if (sm) {
      try {
        const p = await obsClient.getPreviewScene()
        setPreviewScene(p.sceneName)
      } catch {
        // sem preview scene definida ainda
      }
    }
  }, [])

  function wireEvents() {
    obsClient.on('CurrentProgramSceneChanged', (d) => setCurrentScene(d.sceneName))
    obsClient.on('CurrentPreviewSceneChanged', (d) => setPreviewScene(d.sceneName))
    obsClient.on('StudioModeStateChanged', (d) => setStudioMode(d.studioModeEnabled))
    obsClient.on('StreamStateChanged', (d) => setStreaming(d.outputActive))
    obsClient.on('RecordStateChanged', (d) => setRecording(d.outputActive))
    obsClient.on('ConnectionClosed', () => {
      setConnected(false)
      push('Conexão com o OBS perdida. Tentando reconectar...', 'error')
      scheduleReconnect()
    })
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer.current)
    if (!lastConn.current) return
    reconnectAttempt.current += 1
    const delay = Math.min(15000, 1500 * reconnectAttempt.current)
    reconnectTimer.current = setTimeout(async () => {
      try {
        await doConnect(lastConn.current, true)
      } catch {
        scheduleReconnect()
      }
    }, delay)
  }

  async function doConnect(conn, isRetry = false) {
    if (!isRetry) setConnecting(true)
    setError('')
    try {
      await obsClient.connect(conn.ip, conn.port, conn.password)
      await loadInitialState()
      setConnected(true)
      lastConn.current = conn
      reconnectAttempt.current = 0
      wireEvents()
      if (isRetry) push('Reconectado ao OBS', 'success')
    } catch (err) {
      const msg = err?.message || 'Não foi possível conectar. Confira IP, porta e senha.'
      setError(msg)
      if (isRetry) throw err
    } finally {
      if (!isRetry) setConnecting(false)
    }
  }

  async function handleDisconnect() {
    clearTimeout(reconnectTimer.current)
    lastConn.current = null
    await obsClient.disconnect()
    setConnected(false)
  }

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current)
      if (obsClient.connected) obsClient.disconnect()
    }
  }, [])

  if (!unlocked) {
    return (
      <div className="app">
        <PinLock onUnlock={() => setUnlocked(true)} />
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="app">
        <ToastStack toasts={toasts} />
        <ConnectScreen onConnect={(c) => doConnect(c)} connecting={connecting} error={error} />
      </div>
    )
  }

  return (
    <div className="app">
      <ToastStack toasts={toasts} />
      <TopBar
        connected={connected}
        streaming={streaming}
        recording={recording}
        onDisconnect={handleDisconnect}
      />
      {viewOnly && <div className="view-only-banner">MODO VISUALIZAÇÃO — ações bloqueadas</div>}
      <div className="content">
        {tab === 'scenes' && (
          <ScenesTab
            scenes={scenes}
            currentScene={currentScene}
            onChanged={setCurrentScene}
            viewOnly={viewOnly}
            studioMode={studioMode}
            previewScene={previewScene}
            onPreviewChanged={setPreviewScene}
          />
        )}
        {tab === 'sources' && <SourcesTab currentScene={currentScene} viewOnly={viewOnly} />}
        {tab === 'audio' && <AudioTab viewOnly={viewOnly} />}
        {tab === 'stream' && <StreamTab viewOnly={viewOnly} pushToast={push} />}
        {tab === 'buttons' && <ButtonsTab scenes={scenes} inputs={inputs} viewOnly={viewOnly} />}
        {tab === 'settings' && (
          <SettingsTab
            viewOnly={viewOnly}
            setViewOnly={setViewOnly}
            studioMode={studioMode}
            setStudioMode={setStudioMode}
          />
        )}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
