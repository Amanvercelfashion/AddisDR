import BusinessCard from './BusinessCard'

export default function BusinessGrid({ businesses, onSelect, currentUser, onOpenAuth, activeCategory, activeHood }) {
  const list = Array.isArray(businesses) ? businesses : []
  const shown = list.slice(0, 20)
  const total = list.length

  let title = 'All Businesses'
  if (activeCategory !== 'all' && activeHood === 'all') title = activeCategory
  else if (activeCategory === 'all' && activeHood !== 'all') title = `Businesses in ${activeHood}`
  else if (activeCategory !== 'all' && activeHood !== 'all') title = `${activeCategory} in ${activeHood}`

  return (
    <>
      <div className="section-header">
        <h2 id="gridTitle">{title}</h2>
        <span className="result-count" id="resultCount">
          {total > 20 ? `Showing 20 of ${total} businesses` : `${total} business${total !== 1 ? 'es' : ''}`}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty-state" id="emptyState">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>No businesses found for this filter.</p>
        </div>
      ) : (
        <div className="business-grid" id="businessGrid">
          {shown.map(b => (
            <BusinessCard
              key={b.id}
              business={b}
              onSelect={onSelect}
              currentUser={currentUser}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}
    </>
  )
}
