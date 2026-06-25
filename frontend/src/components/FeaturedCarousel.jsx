import { useRef, useEffect, useState } from 'react'

export default function FeaturedCarousel({ items, onSelect }) {
  const trackRef = useRef(null)
  const carouselRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [hidden, setHidden] = useState(false)
  const timerRef = useRef(null)
  const touchStartRef = useRef(0)
  const itemWidth = 280 + 14

  const stepRef = useRef(null)

  const isMobile = () => window.innerWidth <= 640

  const visibleCount = () => {
    if (isMobile()) return 1
    if (!trackRef.current) return 3
    return Math.max(1, Math.floor(trackRef.current.offsetWidth / itemWidth))
  }

  const maxIndex = Math.max(0, items.length - visibleCount())

  useEffect(() => {
    if (isMobile()) return
    setIndex(i => Math.max(0, Math.min(i, maxIndex)))
  }, [items.length, maxIndex])

  useEffect(() => {
    const footer = document.getElementById('siteFooter')
    if (!footer) return
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const step = (dir) => {
    if (isMobile()) {
      const wrapper = trackRef.current
      if (!wrapper) return
      const itemW = window.innerWidth
      const maxScroll = wrapper.scrollWidth - itemW
      let next = wrapper.scrollLeft + dir * itemW
      if (next > maxScroll + 1) next = 0
      if (next < -1) next = maxScroll
      wrapper.scrollTo({ left: next, behavior: 'smooth' })
      return
    }
    setIndex(i => {
      let next = i + dir
      if (next > maxIndex) next = 0
      if (next < 0) next = maxIndex
      return next
    })
  }

  stepRef.current = step

  const startAutoplay = () => {
    stopAutoplay()
    timerRef.current = setInterval(() => stepRef.current(1), 3000)
  }

  const stopAutoplay = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => {
    startAutoplay()
    return () => stopAutoplay()
  }, [])

  if (!items || !Array.isArray(items) || items.length === 0) return null

  return (
    <>
      <div className={`featured-sticky${hidden ? ' hidden' : ''}`} id="featuredSticky" ref={carouselRef}>
        <div className="featured-sticky-inner">
          <button className="carousel-btn" onClick={() => { step(-1); startAutoplay() }} aria-label="Previous">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="carousel-track-wrapper"
            ref={trackRef}
            onMouseEnter={stopAutoplay}
            onMouseLeave={startAutoplay}
            onTouchStart={e => { touchStartRef.current = e.changedTouches[0].clientX; stopAutoplay() }}
            onTouchEnd={e => {
              const diff = touchStartRef.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 30) step(diff > 0 ? 1 : -1)
              startAutoplay()
            }}
          >
            <div className="carousel-track" id="carouselTrack" style={isMobile() ? {} : { transform: `translateX(-${index * itemWidth}px)` }}>
              {items.map(p => (
                <div key={p.id} className="carousel-item" onClick={() => onSelect(p.business_id)} style={{ cursor: 'pointer' }}>
                  <img src={p.image_url} alt={p.title} loading="lazy" />
                  <div className="carousel-item-body">
                    <div className="carousel-item-top">
                      <p className="carousel-item-name">{p.title}</p>
                    </div>
                    <p className="carousel-item-desc">{p.hook_text}</p>
                    {p.exact_price && <p className="carousel-item-price">{p.exact_price}</p>}
                    <div className="carousel-item-meta">
                      <span className="carousel-item-business">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        {p.business_name}
                      </span>
                      <span className="carousel-item-location">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                        </svg>
                        {p.location_text}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="carousel-btn" onClick={() => { step(1); startAutoplay() }} aria-label="Next">
            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
          </button>
        </div>
      </div>
      <div className="featured-spacer" id="featuredSpacer"></div>
    </>
  )
}
