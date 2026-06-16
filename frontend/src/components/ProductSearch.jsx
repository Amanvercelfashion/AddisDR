import { useState, useRef, useEffect } from 'react'
import { searchProducts } from '../lib/api'

export default function ProductSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      try {
        const items = await searchProducts(query)
        setResults(items)
        setOpen(true)
        setFocusedIdx(-1)
      } catch { setResults([]) }
    }, 280)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      const item = results[focusedIdx]
      if (item) { onSelect(item.business_id); setOpen(false); setQuery('') }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const highlight = (text, q) => {
    if (!q) return text
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
  }

  return (
    <>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        ref={inputRef}
        placeholder="Search products & services…"
        autoComplete="off"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {query && (
        <button className="product-search-clear" onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}>&times;</button>
      )}
      {open && results.length > 0 && (
        <ul className="product-search-results" role="listbox">
          {results.map((p, i) => (
            <li
              key={p.id}
              className={`psr-item ${i === focusedIdx ? 'focused' : ''}`}
              role="option"
              tabIndex={-1}
              onClick={() => { onSelect(p.business_id); setOpen(false); setQuery('') }}
            >
              {p.image_url
                ? <img className="psr-img" src={p.image_url} alt={p.name} loading="lazy" />
                : <div className="psr-img-placeholder">🛍</div>
              }
              <div className="psr-info">
                <p className="psr-name" dangerouslySetInnerHTML={{ __html: highlight(p.name, query) }} />
                <p className="psr-meta">
                  {p.business_name}{p.hood_name ? ` · ${p.hood_name}` : ''}
                  {p.description ? ` — ${p.description.slice(0, 50)}${p.description.length > 50 ? '…' : ''}` : ''}
                </p>
              </div>
              {p.price && <span className="psr-price">{p.price}</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
