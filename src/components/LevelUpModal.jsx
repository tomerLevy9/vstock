// Celebration shown when the player reaches a new level.
export default function LevelUpModal({ level, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal center" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 70 }}>{level.icon}</div>
        <div className="muted" style={{ fontWeight: 600, letterSpacing: 1 }}>LEVEL UP!</div>
        <h2 style={{ margin: '4px 0 10px' }}>You're a {level.name}!</h2>
        <div className="info-box" style={{ marginBottom: 16 }}>{level.congrats}</div>
        <button className="btn" onClick={onClose}>Woohoo! 🎉</button>
      </div>
    </div>
  )
}
