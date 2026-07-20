import OBSWebSocket from 'obs-websocket-js'

// Wrapper único em volta do obs-websocket-js (protocolo v5).
// Centraliza conexão e expõe métodos prontos pros componentes.
class ObsClient {
  constructor() {
    this.obs = new OBSWebSocket()
    this.connected = false
  }

  async connect(ip, port, password) {
    const url = `ws://${ip}:${port}`
    await this.obs.connect(url, password || undefined)
    this.connected = true
  }

  async disconnect() {
    try {
      await this.obs.disconnect()
    } finally {
      this.connected = false
    }
  }

  on(event, handler) {
    this.obs.on(event, handler)
  }

  off(event, handler) {
    this.obs.off(event, handler)
  }

  // ---- Cenas ----
  async getScenes() {
    return this.obs.call('GetSceneList')
  }
  async setScene(sceneName) {
    return this.obs.call('SetCurrentProgramScene', { sceneName })
  }

  // ---- Sources da cena ----
  async getSceneItems(sceneName) {
    return this.obs.call('GetSceneItemList', { sceneName })
  }
  async setSceneItemEnabled(sceneName, sceneItemId, enabled) {
    return this.obs.call('SetSceneItemEnabled', {
      sceneName,
      sceneItemId,
      sceneItemEnabled: enabled
    })
  }

  // ---- Áudio ----
  async getInputs() {
    const { inputs } = await this.obs.call('GetInputList')
    // filtra pra pegar só entradas com áudio (evita listar fontes de imagem etc)
    const audioInputs = []
    for (const input of inputs) {
      try {
        await this.obs.call('GetInputMute', { inputName: input.inputName })
        audioInputs.push(input)
      } catch {
        // não é uma fonte de áudio, ignora
      }
    }
    return audioInputs
  }
  async getInputMute(inputName) {
    return this.obs.call('GetInputMute', { inputName })
  }
  async setInputMute(inputName, muted) {
    return this.obs.call('SetInputMute', { inputName, inputMuted: muted })
  }
  async getInputVolume(inputName) {
    return this.obs.call('GetInputVolume', { inputName })
  }
  async setInputVolume(inputName, volumeDb) {
    return this.obs.call('SetInputVolume', { inputName, inputVolumeDb: volumeDb })
  }

  // ---- Stream / Gravação ----
  async getStreamStatus() {
    return this.obs.call('GetStreamStatus')
  }
  async toggleStream() {
    return this.obs.call('ToggleStream')
  }
  async getRecordStatus() {
    return this.obs.call('GetRecordStatus')
  }
  async toggleRecord() {
    return this.obs.call('ToggleRecord')
  }
  async togglePauseRecord() {
    return this.obs.call('ToggleRecordPause')
  }

  // ---- Hotkeys (pra botões customizados) ----
  async getHotkeys() {
    const { hotkeys } = await this.obs.call('GetHotkeyList')
    return hotkeys
  }
  async triggerHotkey(hotkeyName) {
    return this.obs.call('TriggerHotkeyByName', { hotkeyName })
  }
}

export const obsClient = new ObsClient()
