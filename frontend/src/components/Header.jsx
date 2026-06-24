import { useState } from 'react'
import ProductSearch from './ProductSearch'
import Logo from './Logo'

export default function Header({
  categories, hoods, activeCategory, activeHood,
  onCategoryChange, onHoodChange, currentUser, onSignOut, onOpenAuth, onBusinessSelect
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [hoodOpen, setHoodOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [hoodSearch, setHoodSearch] = useState('')

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const filteredHoods = hoods.filter(h =>
    h.name.toLowerCase().includes(hoodSearch.toLowerCase())
  )

  return (
    <>
      <header className="topbar" id="topbar">
        <div className="topbar-row1">
          <a href="/" className="logo" aria-label="AddisDR home">
            <Logo className="logo-img" />
          </a>

          <div className="product-search-wrap" id="productSearchBox">
            <ProductSearch onSelect={onBusinessSelect} />
          </div>

          <div className="topbar-filters">
            <div className="filter-group">
              <button
                className="filter-btn"
                aria-haspopup="listbox"
                aria-expanded={catOpen}
                onClick={() => { setCatOpen(!catOpen); setHoodOpen(false) }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                </svg>
                <span>{activeCategory === 'all' ? 'Category' : activeCategory}</span>
                <svg className="chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {catOpen && (
                <div className="dropdown-panel open" role="listbox">
                  <input type="text" className="dropdown-search" placeholder="Search category…" value={catSearch} onChange={e => setCatSearch(e.target.value)} />
                  <ul>
                    <li
                      className={activeCategory === 'all' ? 'active' : ''}
                      onClick={() => { onCategoryChange('all'); setCatOpen(false); setCatSearch('') }}
                    >All Categories</li>
                    {filteredCats.map(c => (
                      <li
                        key={c.id}
                        className={activeCategory === c.name ? 'active' : ''}
                        onClick={() => { onCategoryChange(c.name); setCatOpen(false); setCatSearch('') }}
                      >{c.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="filter-group">
              <button
                className="filter-btn"
                aria-haspopup="listbox"
                aria-expanded={hoodOpen}
                onClick={() => { setHoodOpen(!hoodOpen); setCatOpen(false) }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                <span>{activeHood === 'all' ? 'Neighbourhood' : activeHood}</span>
                <svg className="chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {hoodOpen && (
                <div className="dropdown-panel open" role="listbox">
                  <input type="text" className="dropdown-search" placeholder="Search neighbourhood…" value={hoodSearch} onChange={e => setHoodSearch(e.target.value)} />
                  <ul>
                    <li
                      className={activeHood === 'all' ? 'active' : ''}
                      onClick={() => { onHoodChange('all'); setHoodOpen(false); setHoodSearch('') }}
                    >All Neighbourhoods</li>
                    {filteredHoods.map(h => (
                      <li
                        key={h.id}
                        className={activeHood === h.name ? 'active' : ''}
                        onClick={() => { onHoodChange(h.name); setHoodOpen(false); setHoodSearch('') }}
                      >📍 {h.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div id="userPillWrap" style={{ flexShrink: 0 }}>
            {!currentUser ? (
              <button className="signin-btn" onClick={() => onOpenAuth('login')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Sign In
              </button>
            ) : (
              <button className="user-pill" onClick={onSignOut}>
                <span className="avatar">{currentUser.name?.charAt(0).toUpperCase()}</span>
                <span>{currentUser.display_name || currentUser.name}</span>
              </button>
            )}
          </div>

          <button
            className="hamburger"
            id="menuToggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav className={`side-menu ${menuOpen ? 'open' : ''}`} id="sideMenu" aria-hidden={!menuOpen}>
          <button className="menu-close" onClick={() => setMenuOpen(false)}>&times;</button>
          <ul>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact Us</a></li>
            {!currentUser ? (
              <li><a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onOpenAuth('login') }}>Sign In / Register</a></li>
            ) : (
              <>
                <li><span className="menu-user-name">👤 {currentUser.display_name || currentUser.name}</span></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onSignOut() }}>Sign Out</a></li>
              </>
            )}
            <li><a href="#digital-store" className="highlight-link">Get Your Digital Store</a></li>
          </ul>
        </nav>
        <div className={`menu-overlay ${menuOpen ? 'visible' : ''}`} onClick={() => setMenuOpen(false)}></div>
      </header>

      {catOpen && <div className="dropdown-backdrop" onClick={() => setCatOpen(false)} />}
      {hoodOpen && <div className="dropdown-backdrop" onClick={() => setHoodOpen(false)} />}
    </>
  )
}
