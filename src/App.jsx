import { useCallback, useEffect, useState } from 'react'
import { obsClient } from './obsClient'
import ConnectScreen from './components/ConnectScreen'
import TopBar from './components/TopBar'
import TabBar from './components/TabBar'
import ScenesTab from './components/ScenesTab'
import SourcesTab from './components/SourcesTab'
import AudioTab from './components/AudioTab'
import StreamTab from './components/StreamTab'
import ButtonsTab from './components/ButtonsTab'

export default function App() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('scenes')

  const [scenes, setScenes] = useState([])
  const [currentScene, setCurrentScene] = useState('')
  const [inputs, setInputs] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [recording, setRecording] = useState(false)

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
  }, [])

  async function handleConnect(ip, port, password) {
    setConnecting(true)
    setError('')
    try {
      await obsClient.connect(ip, port, password)
      await loadInitialState()
      setConnected(true)

      obsClient.on('CurrentProgramSceneChanged', (d) => setCurrentScene(d.sceneName))
      obsClient.on('StreamStateChanged', (d) => setStreaming(d.outputActive))
      obsClient.on('RecordStateChanged', (d) => setRecording(d.outputActive))
      obsClient.on('ConnectionClosed', () => {
        setConnected(false)
      })
    } catch (err) {
      setError(err?.message || 'Não foi possível conectar. Confira IP, porta e senha.')
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    await obsClient.disconnect()
    setConnected(false)
  }

  useEffect(() => {
    return () => {
      if (obsClient.connected) obsClient.disconnect()
    }
  }, [])

  if (!connected) {
    return (
      <div className="app">
        <ConnectScreen onConnect={handleConnect} connecting={connecting} error={error} />
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar
        connected={connected}
        streaming={streaming}
        recording={recording}
        onDisconnect={handleDisconnect}
      />
      <div className="content">
        {tab === 'scenes' && (
          <ScenesTab scenes={scenes} currentScene={currentScene} onChanged={setCurrentScene} />
        )}
        {tab === 'sources' && <SourcesTab currentScene={currentScene} />}
        {tab === 'audio' && <AudioTab />}
        {tab === 'stream' && <StreamTab />}
        {tab === 'buttons' && <ButtonsTab scenes={scenes} inputs={inputs} />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
