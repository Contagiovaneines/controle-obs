import { useEffect, useRef, useState } from 'react'
import { obsClient } from '../obsClient'

export default function LivePreview({ currentScene, studioMode, previewScene, onClose }) {
  const [programImg, setProgramImg] = useState(null)
  const [previewImg, setPreviewImg] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    async function tick() {
      if (currentScene) {
        obsClient
          .getSceneScreenshot(currentScene, 640)
          .then(setProgramImg)
          .catch(() => {})
      }
      if (studioMode && previewScene) {
        obsClient
          .getSceneScreenshot(previewScene, 640)
          .then(setPreviewImg)
          .catch(() => {})
      }
    }
    tick()
    timer.current = setInterval(tick, 1000)
    return () => clearInterval(timer.current)
  }, [currentScene, studioMode, previewScene])

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-overlay-inner" onClick={(e) => e.stopPropagation()}>
        <div className="preview-overlay-header">
          <span>Preview ao vivo · atualiza ~1x/s, sem áudio</span>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={`preview-grid ${studioMode && previewScene ? 'split' : ''}`}>
          <div className="preview-cell">
            {studioMode && <span className="preview-tag program-tag-fixed">PROGRAM</span>}
            {programImg ? (
              <img className="preview-img" src={programImg} alt="Program" />
            ) : (
              <div className="deck-thumb deck-thumb-empty preview-img" />
            )}
          </div>
          {studioMode && previewScene && (
            <div className="preview-cell">
              <span className="preview-tag preview-tag-fixed">PREVIEW</span>
              {previewImg ? (
                <img className="preview-img" src={previewImg} alt="Preview" />
              ) : (
                <div className="deck-thumb deck-thumb-empty preview-img" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
