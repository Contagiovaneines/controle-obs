import OBSWebSocket, { EventSubscription } from 'obs-websocket-js'

// Wrapper único em volta do obs-websocket-js (protocolo v5).
// Centraliza conexão e expõe métodos prontos pros componentes.
class ObsClient {
  constructor() {
    this.obs = new OBSWebSocket()
    this.connected = false
  }

  async connect(ip, port, password) {
    const url = `ws://${ip}:${port}`
    // All | InputVolumeMeters -> precisa incluir o all default + o high-volume event
    // pra receber os níveis de VU meter em tempo real.
    await this.obs.connect(url, password || undefined, {
      eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters
    })
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
  async setPreviewScene(sceneName) {
    return this.obs.call('SetCurrentPreviewScene', { sceneName })
  }
  async getSceneScreenshot(sourceName, width = 240) {
    const { imageData } = await this.obs.call('GetSourceScreenshot', {
      sourceName,
      imageFormat: 'jpg',
      imageWidth: width,
      imageCompressionQuality: 60
    })
    return imageData
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

  // ---- Replay Buffer ----
  async getReplayBufferStatus() {
    return this.obs.call('GetReplayBufferStatus')
  }
  async startReplayBuffer() {
    return this.obs.call('StartReplayBuffer')
  }
  async stopReplayBuffer() {
    return this.obs.call('StopReplayBuffer')
  }
  async saveReplayBuffer() {
    return this.obs.call('SaveReplayBuffer')
  }

  // ---- Studio Mode / Transições ----
  async getStudioModeEnabled() {
    const { studioModeEnabled } = await this.obs.call('GetStudioModeEnabled')
    return studioModeEnabled
  }
  async setStudioModeEnabled(enabled) {
    return this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled })
  }
  async triggerStudioModeTransition() {
    return this.obs.call('TriggerStudioModeTransition')
  }
  async getTransitionList() {
    return this.obs.call('GetSceneTransitionList')
  }
  async setCurrentTransition(transitionName) {
    return this.obs.call('SetCurrentSceneTransition', { transitionName })
  }
  async setTransitionDuration(durationMs) {
    return this.obs.call('SetCurrentSceneTransitionDuration', { transitionDuration: durationMs })
  }

  // ---- Perfis / Coleções de cena ----
  async getProfileList() {
    return this.obs.call('GetProfileList')
  }
  async setProfile(profileName) {
    return this.obs.call('SetCurrentProfile', { profileName })
  }
  async getSceneCollectionList() {
    return this.obs.call('GetSceneCollectionList')
  }
  async setSceneCollection(sceneCollectionName) {
    return this.obs.call('SetCurrentSceneCollection', { sceneCollectionName })
  }

  // ---- Hotkeys (pra botões customizados) ----
  async getHotkeys() {
    const { hotkeys } = await this.obs.call('GetHotkeyList')
    return hotkeys
  }
  async triggerHotkey(hotkeyName) {
    return this.obs.call('TriggerHotkeyByName', { hotkeyName })
  }

  // ---- Preview / screenshot de cena ----
  async getSceneScreenshot(sceneName, width = 320) {
    const { imageData } = await this.obs.call('GetSourceScreenshot', {
      sourceName: sceneName,
      imageFormat: 'jpg',
      imageWidth: width,
      imageCompressionQuality: 60
    })
    return imageData
  }

  // ---- Transições ----
  async getTransitions() {
    return this.obs.call('GetSceneTransitionList')
  }
  async setTransition(transitionName) {
    return this.obs.call('SetCurrentSceneTransition', { transitionName })
  }
  async setTransitionDuration(transitionDuration) {
    return this.obs.call('SetCurrentSceneTransitionDuration', { transitionDuration })
  }

  // ---- Studio Mode ----
  async getStudioModeEnabled() {
    const { studioModeEnabled } = await this.obs.call('GetStudioModeEnabled')
    return studioModeEnabled
  }
  async setStudioModeEnabled(enabled) {
    return this.obs.call('SetStudioModeEnabled', { studioModeEnabled: enabled })
  }
  async getPreviewScene() {
    return this.obs.call('GetCurrentPreviewScene')
  }
  async setPreviewScene(sceneName) {
    return this.obs.call('SetCurrentPreviewScene', { sceneName })
  }
  async triggerStudioTransition() {
    return this.obs.call('TriggerStudioModeTransition')
  }

  // ---- Replay Buffer ----
  async getReplayBufferStatus() {
    return this.obs.call('GetReplayBufferStatus')
  }
  async startReplayBuffer() {
    return this.obs.call('StartReplayBuffer')
  }
  async stopReplayBuffer() {
    return this.obs.call('StopReplayBuffer')
  }
  async saveReplayBuffer() {
    return this.obs.call('SaveReplayBuffer')
  }

  // ---- Perfis e coleções de cena ----
  async getSceneCollections() {
    return this.obs.call('GetSceneCollectionList')
  }
  async setSceneCollection(sceneCollectionName) {
    return this.obs.call('SetCurrentSceneCollection', { sceneCollectionName })
  }
  async getProfiles() {
    return this.obs.call('GetProfileList')
  }
  async setProfile(profileName) {
    return this.obs.call('SetCurrentProfile', { profileName })
  }

  // ---- Stats gerais (performance) ----
  async getStats() {
    return this.obs.call('GetStats')
  }
}

export const obsClient = new ObsClient()
