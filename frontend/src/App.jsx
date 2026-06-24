import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import BusinessGrid from './components/BusinessGrid'
import BusinessPage from './components/BusinessPage'
import FeaturedCarousel from './components/FeaturedCarousel'
import AuthModal from './components/AuthModal'
import AboutModal from './components/AboutModal'
import Footer from './components/Footer'
import { fetchBusinesses, fetchCategories, fetchHoods, fetchFeatured } from './lib/api'

function toSlug(name) {
  return name.toLowerCase().replace(/[''`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function App() {
  const [categories, setCategories] = useState([])
  const [hoods, setHoods] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [featured, setFeatured] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeHood, setActiveHood] = useState('all')
  const [currentUser, setCurrentUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [aboutOpen, setAboutOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('addisdr_user')
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchUserById(currentUser.id).then(u => {
        if (!u || u.error) {
          localStorage.removeItem('addisdr_user')
          setCurrentUser(null)
        }
      }).catch(() => {})
    }
  }, [currentUser?.id])

  const fetchUserById = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  }, [])

  const loadData = useCallback(async (category, hood) => {
    const results = await Promise.allSettled([
      fetchBusinesses(category, hood),
      fetchCategories(),
      fetchHoods(),
      fetchFeatured(),
    ])
    const [biz, cats, hds, feat] = results.map(r => r.status === 'fulfilled' ? r.value : [])
    const catsArr = Array.isArray(cats) ? cats : []
    const hdsArr = Array.isArray(hds) ? hds : []
    setCategories(catsArr)
    setHoods(hdsArr)
    setFeatured(Array.isArray(feat) ? feat : [])

    const bizData = Array.isArray(biz) ? biz : []
    if (currentUser && currentUser.hood_id && hood === 'all') {
      const userHood = hdsArr.find(h => h.id === currentUser.hood_id)?.name || ''
      bizData.sort((a, b) => {
        if (a.hood_name === userHood && b.hood_name !== userHood) return -1
        if (a.hood_name !== userHood && b.hood_name === userHood) return 1
        return 0
      })
    }
    setBusinesses(bizData)
  }, [currentUser])

  useEffect(() => {
    loadData(activeCategory, activeHood)
  }, [activeCategory, activeHood, loadData])

  const handleCategoryChange = (val) => {
    setActiveCategory(val)
  }

  const handleHoodChange = (val) => {
    setActiveHood(val)
  }

  const handleSignOut = () => {
    localStorage.removeItem('addisdr_user')
    setCurrentUser(null)
  }

  const handleAuthSuccess = (user) => {
    localStorage.setItem('addisdr_user', JSON.stringify(user))
    setCurrentUser(user)
    setAuthOpen(false)
  }

  const openAuth = (tab) => {
    setAuthTab(tab || 'login')
    setAuthOpen(true)
  }

  // Handle direct URL with ?business=slug
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const param = params.get('business')
    if (param) {
      fetchBusinesses().then(all => {
        if (!isNaN(param)) {
          setSelectedBusiness(parseInt(param))
        } else {
          const match = all.find(b => toSlug(b.name) === param)
          if (match) setSelectedBusiness(match.id)
        }
      })
    }
  }, [])

  useEffect(() => {
    const handlePopState = async () => {
      const params = new URLSearchParams(location.search)
      const param = params.get('business')
      if (param) {
        const all = await fetchBusinesses()
        if (!isNaN(param)) {
          setSelectedBusiness(parseInt(param))
        } else {
          const match = all.find(b => toSlug(b.name) === param)
          if (match) setSelectedBusiness(match.id)
        }
      } else {
        setSelectedBusiness(null)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const openBusinessPage = (id) => {
    setSelectedBusiness(id)
    const biz = businesses.find(b => b.id === id)
    if (biz) {
      history.replaceState({ businessId: id }, '', `/?business=${toSlug(biz.name)}`)
    }
  }

  const closeBusinessPage = () => {
    setSelectedBusiness(null)
    history.replaceState({}, '', '/')
  }

  return (
    <div className="app">
      <Header
        categories={categories}
        hoods={hoods}
        activeCategory={activeCategory}
        activeHood={activeHood}
        onCategoryChange={handleCategoryChange}
        onHoodChange={handleHoodChange}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenAuth={openAuth}
        onBusinessSelect={openBusinessPage}
        onOpenAbout={() => setAboutOpen(true)}
        />

      <main className="main-content">
        <BusinessGrid
          businesses={businesses}
          onSelect={openBusinessPage}
          currentUser={currentUser}
          onOpenAuth={openAuth}
          activeCategory={activeCategory}
          activeHood={activeHood}
        />
      </main>

      {selectedBusiness && (
        <BusinessPage
          businessId={selectedBusiness}
          onClose={closeBusinessPage}
          currentUser={currentUser}
          onOpenAuth={openAuth}
          onBusinessSelect={openBusinessPage}
          onOpenAbout={() => setAboutOpen(true)}
        />
      )}

      <FeaturedCarousel
        items={featured}
        onSelect={openBusinessPage}
      />

      <Footer />

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {authOpen && (
        <AuthModal
          defaultTab={authTab}
          hoods={hoods}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  )
}
