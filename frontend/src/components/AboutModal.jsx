export default function AboutModal({ onClose }) {
  return (
    <div className="auth-modal-backdrop open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="about-modal">
        <button className="auth-close" onClick={onClose}>&times;</button>
        <h2>About AddisDR</h2>
        <div className="about-content">
          <p><em>Company profile text goes here — paste your Canva content and I'll add it.</em></p>
        </div>
      </div>
    </div>
  )
}
