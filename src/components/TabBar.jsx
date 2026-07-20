const TABS = [
  { id: 'scenes', label: 'Cenas' },
  { id: 'sources', label: 'Sources' },
  { id: 'audio', label: 'Áudio' },
  { id: 'stream', label: 'Stream' },
  { id: 'buttons', label: 'Botões' }
]

export default function TabBar({ active, onChange }) {
  return (
    <div className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={active === tab.id ? 'active' : ''}
          onClick={() => onChange(tab.id)}
        >
          <span className="dot" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
