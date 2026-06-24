import { useState, useEffect } from 'react'
import { fetchBusinessById, fetchBusinesses, fetchProducts, submitRating, fetchUserRating, submitReport } from '../lib/api'

function renderStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  let html = ''
  for (let i = 0; i < full; i++) html += `<svg class="star filled" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
  if (half) html += `<svg class="star half" viewBox="0 0 24 24"><defs><linearGradient id="h-${rating}"><stop offset="50%" stop-color="#f5a623"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="url(#h-${rating})"/></svg>`
  for (let i = 0; i < empty; i++) html += `<svg class="star" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
  return html
}

export default function BusinessPage({ businessId, onClose, currentUser, onOpenAuth, onBusinessSelect }) {
  const [biz, setBiz] = useState(null)
  const [products, setProducts] = useState([])
  const [others, setOthers] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) return
    setLoading(true)
    Promise.all([
      fetchBusinessById(businessId),
      fetchProducts(businessId),
      fetchBusinesses(),
    ]).then(([b, p, all]) => {
      setBiz(b)
      setProducts(p)
      setOthers(all.filter(o => o.id !== businessId))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [businessId])

  useEffect(() => {
    if (!currentUser || !businessId) return
    fetchUserRating(currentUser.id, businessId)
      .then(r => setUserRating(r.rating || 0))
      .catch(() => {})
  }, [currentUser, businessId])

  const handleRate = async (val) => {
    if (!currentUser) { onOpenAuth(); return }
    try {
      const result = await submitRating(businessId, currentUser.id, val)
      if (result.success) {
        setUserRating(val)
        setBiz(prev => prev ? {
          ...prev,
          rating_avg: result.rating_avg,
          rating_count: result.rating_count,
        } : prev)
      }
    } catch {}
  }

  const handleReport = async () => {
    if (!currentUser) { onOpenAuth(); return }
    const reason = prompt('Please describe the issue:')
    if (!reason) return
    try {
      await submitReport(businessId, currentUser.display_name || currentUser.name, reason)
      alert('Thank you for your report.')
    } catch { alert('Failed to submit report.') }
  }

  if (!businessId) return null

  return (
    <div className="biz-page open" id="bizPage" aria-hidden="false">
      <div className="biz-main" id="bizMain">
        <div className="biz-back-bar">
          <button className="biz-back-btn" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to all businesses
          </button>
        </div>

        {loading ? (
          <div className="biz-loading">Loading…</div>
        ) : biz ? (
          <>
            <img className="biz-hero-img" id="bizHeroImg" src={biz.image_url || ''} alt={biz.name} />
            <div className="biz-info">
              <div className="biz-info-top">
                <h1 className="biz-name" id="bizName">{biz.name}</h1>
                {biz.price_indicator && <span className="biz-price-badge" id="bizPriceBadge">{biz.price_indicator}</span>}
              </div>
              <p className="biz-tag" id="bizTag">{biz.category_name} • {biz.hood_name}</p>
              <p className="biz-hook" id="bizHook">{biz.hook_text || ''}</p>
              <div className="biz-rating-row" id="bizRatingRow" dangerouslySetInnerHTML={{
                __html: `
                  ${renderStars(biz.rating_avg)}
                  <span class="biz-rating-num">${biz.rating_avg.toFixed(1)}</span>
                  <span class="biz-rating-count">(${biz.rating_count} ratings)</span>
                `
              }} />
              <div className="biz-rate-section" id="bizRateSection">
                <span className="biz-rate-label">Rate this business:</span>
                <div className="biz-rate-stars" id="bizRateStars">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      className={`biz-rate-star ${v <= userRating ? 'active' : ''}`}
                      onClick={() => handleRate(v)}
                    >★</button>
                  ))}
                </div>
              </div>
              <div className="biz-actions" id="bizActions">
                {biz.business_type === 'product' ? (
                  <a href={biz.website_link || '#'} target={biz.website_link ? '_blank' : '_self'} rel="noopener" className="biz-action-btn cta-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Choose & Order
                  </a>
                ) : (
                  <a href={biz.website_link || '#'} target={biz.website_link ? '_blank' : '_self'} rel="noopener" className="biz-action-btn cta-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    Reserve Now
                  </a>
                )}
                {biz.location_link && (
                  <a href={biz.location_link} target="_blank" rel="noopener" className="biz-action-btn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    Location
                  </a>
                )}
                <button className="biz-action-btn share-btn" onClick={() => shareBusiness(biz)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </button>
              </div>
              <div className="biz-address-section">
                <h3 className="biz-address-title">Address & Contact</h3>
                {biz.hood_name && (
                  <div className="biz-contact-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    <span>{biz.hood_name}</span>
                  </div>
                )}
                {biz.phone_number && (
                  <div className="biz-contact-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <a href={`tel:${biz.phone_number}`} className="biz-contact-link">{biz.phone_number}</a>
                  </div>
                )}
              </div>
              <div className="biz-report-row">
                <button className="biz-report-btn" onClick={handleReport}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Report Issue
                </button>
              </div>
            </div>
            <div className="biz-divider"></div>
            <div className="biz-products-section">
              <h2 className="biz-products-title">Products & Services</h2>
              <div className="biz-products-grid" id="bizProductsGrid">
                {products.length === 0 ? (
                  <p className="biz-products-empty">No products or services listed yet.</p>
                ) : (
                  products.map(p => (
                    <div key={p.id} className="biz-product-card">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} loading="lazy" />
                        : <div className="biz-product-card-img-placeholder">🛍</div>
                      }
                      <div className="biz-product-card-body">
                        <p className="biz-product-card-name">{p.name}</p>
                        {p.description && <p className="biz-product-card-desc">{p.description}</p>}
                        {p.price && <p className="biz-product-card-price">{p.price}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="biz-products-empty">Business not found.</p>
        )}
      </div>

      <div className="biz-sidebar" id="bizSidebar">
        <p className="biz-sidebar-title">Other Businesses</p>
        {others.slice(0, 10).map(b => (
          <div key={b.id} className="biz-sidebar-item" onClick={() => onBusinessSelect(b.id)}>
            <img className="biz-sidebar-img" src={b.image_url || ''} alt={b.name} loading="lazy" />
            <div className="biz-sidebar-info">
              <p className="biz-sidebar-name">{b.name}</p>
              <p className="biz-sidebar-tag">{b.category_name} • {b.hood_name}</p>
            </div>
            <span className="biz-sidebar-rating">★ {b.rating_avg.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function toSlug(name) {
  return name.toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function shareBusiness(biz) {
  const slug = toSlug(biz.name)
  const shareUrl = `${location.origin}/?business=${slug}`
  if (navigator.share) {
    try {
      await navigator.share({ title: `${biz.name} — AddisDR`, text: `Check out ${biz.name} on AddisDR`, url: shareUrl })
      return
    } catch (e) { if (e.name === 'AbortError') return }
  }
  try {
    await navigator.clipboard.writeText(shareUrl)
    alert('Link copied to clipboard!')
  } catch { prompt('Copy this link to share:', shareUrl) }
}
