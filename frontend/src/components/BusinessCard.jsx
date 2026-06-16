import { useState } from 'react'
import { submitReport } from '../lib/api'

function renderStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  let html = ''
  for (let i = 0; i < full; i++) html += `<svg class="star filled" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
  if (half) html += `<svg class="star half" viewBox="0 0 24 24"><defs><linearGradient id="halfGrad-${rating}"><stop offset="50%" stop-color="#f5a623"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#halfGrad-${rating})"/></svg>`
  for (let i = 0; i < empty; i++) html += `<svg class="star" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
  return html
}

export default function BusinessCard({ business: b, onSelect, currentUser, onOpenAuth }) {
  const [reporting, setReporting] = useState(false)

  const handleReport = async (e) => {
    e.stopPropagation()
    if (!currentUser) { onOpenAuth(); return }
    const reason = prompt('Please describe the issue:')
    if (!reason) return
    setReporting(true)
    try {
      await submitReport(b.id, currentUser.display_name || currentUser.name, reason)
      alert('Thank you for your report.')
    } catch { alert('Failed to submit report.') }
    setReporting(false)
  }

  return (
    <article
      className="tile"
      data-category={b.category_name}
      data-hood={b.hood_name}
      onClick={() => onSelect(b.id)}
      style={{ cursor: 'pointer' }}
    >
      <img className="tile-image" src={b.image_url} alt={b.name} loading="lazy" />
      <div className="tile-body">
        <div className="tile-top">
          <h3 className="tile-name">{b.name}</h3>
          {b.price_indicator && <span className="tile-price">{b.price_indicator}</span>}
        </div>
        <p className="tile-tag">{b.category_name} • {b.hood_name}</p>
        <p className="tile-hook">{b.hook_text || ''}</p>
        <div className="tile-rating" onClick={e => e.stopPropagation()}>
          <div className="stars" dangerouslySetInnerHTML={{ __html: renderStars(b.rating_avg) }} />
          <span className="rating-text">{b.rating_avg.toFixed(1)} ({b.rating_count})</span>
          <button className="report-btn" onClick={handleReport} disabled={reporting}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {currentUser ? 'Report' : <span className="login-gate-msg">Report <button onClick={(e) => { e.stopPropagation(); onOpenAuth() }}>Sign in</button></span>}
          </button>
        </div>
        <div className="tile-actions" onClick={e => e.stopPropagation()}>
          {b.phone_number && (
            <a href={`tel:${b.phone_number}`} className="action-btn call" aria-label="Call">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </a>
          )}
          {b.website_link && (
            <a href={b.website_link} target="_blank" rel="noopener" className="action-btn" aria-label="Website">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </a>
          )}
          {b.location_link && (
            <a href={b.location_link} target="_blank" rel="noopener" className="action-btn" aria-label="Location">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
              </svg>
            </a>
          )}
          <button className="action-btn share-btn" aria-label="Share" onClick={() => shareBusiness(b)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

function toSlug(name) {
  return name.toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function shareBusiness(b) {
  const slug = toSlug(b.name)
  const shareUrl = `${location.origin}/?business=${slug}`
  const shareData = {
    title: `${b.name} — AddisDR`,
    text: `Check out ${b.name} on AddisDR, Addis Ababa's local business directory.`,
    url: shareUrl,
  }
  if (navigator.share) {
    try { await navigator.share(shareData); return } catch (e) { if (e.name === 'AbortError') return }
  }
  try {
    await navigator.clipboard.writeText(shareUrl)
    showToast('Link copied to clipboard!')
  } catch { prompt('Copy this link to share:', shareUrl) }
}

function showToast(msg) {
  let toast = document.getElementById('shareToast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'shareToast'
    toast.className = 'share-toast'
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.classList.add('visible')
  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800)
}
