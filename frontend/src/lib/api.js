const API_URL = import.meta.env.VITE_API_URL || 'https://addis-dr-backend.vercel.app'

export async function fetchBusinesses(category = 'all', hood = 'all') {
  const params = new URLSearchParams()
  if (category !== 'all') params.append('category', category)
  if (hood !== 'all') params.append('hood', hood)
  const res = await fetch(`${API_URL}/businesses?${params}`)
  return res.json()
}

export async function fetchBusinessById(id) {
  const res = await fetch(`${API_URL}/businesses/${id}`)
  return res.json()
}

export async function fetchFeatured() {
  const res = await fetch(`${API_URL}/featured`)
  return res.json()
}

export async function fetchCategories() {
  const res = await fetch(`${API_URL}/categories`)
  return res.json()
}

export async function fetchHoods() {
  const res = await fetch(`${API_URL}/hoods`)
  return res.json()
}

export async function submitRating(businessId, userId, rating) {
  const res = await fetch(`${API_URL}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_id: businessId, user_id: userId, rating }),
  })
  return res.json()
}

export async function fetchUserRating(userId, businessId) {
  const res = await fetch(`${API_URL}/ratings/user/${userId}/business/${businessId}`)
  return res.json()
}

export async function submitReport(businessId, userName, reason) {
  const res = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_id: businessId, user_name: userName, reason }),
  })
  return res.json()
}

export async function signIn(name, hoodId) {
  const res = await fetch(`${API_URL}/users/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, hood_id: hoodId }),
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.error)
  }
  return res.json()
}

export async function registerUser(name, hoodId, phone, password) {
  const res = await fetch(`${API_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, hood_id: hoodId, phone, password }),
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.error)
  }
  return res.json()
}

export async function loginUser(phone, password) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.error)
  }
  return res.json()
}

export async function fetchUserById(id) {
  const res = await fetch(`${API_URL}/users/${id}`)
  return res.json()
}

export async function fetchProducts(businessId) {
  const res = await fetch(`${API_URL}/products?business_id=${businessId}`)
  return res.json()
}

export async function searchProducts(query) {
  const res = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`)
  return res.json()
}
