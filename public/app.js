/* ===== CONFIG ===== */
const API_BASE = '/api';

/* ===== STATE ===== */
let activeCategory = 'all';
let activeHood = 'all';
let currentUser = null;
let businesses = [];
let featuredProducts = [];
let categories = [];
let hoods = [];

/* ===== LOCAL STORAGE ===== */
function saveUser(user) {
  localStorage.setItem('addisdr_user', JSON.stringify(user));
  currentUser = user;
}

function loadUser() {
  const stored = localStorage.getItem('addisdr_user');
  if (stored) {
    currentUser = JSON.parse(stored);
  }
}

function clearUser() {
  localStorage.removeItem('addisdr_user');
  currentUser = null;
}

/* ===== API CALLS ===== */
async function fetchBusinesses(category = 'all', hood = 'all') {
  const params = new URLSearchParams();
  if (category !== 'all') params.append('category', category);
  if (hood !== 'all') params.append('hood', hood);
  
  const res = await fetch(`${API_BASE}/businesses?${params}`);
  return await res.json();
}

async function fetchFeatured() {
  const res = await fetch(`${API_BASE}/featured`);
  return await res.json();
}

async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  return await res.json();
}

async function fetchHoods() {
  const res = await fetch(`${API_BASE}/hoods`);
  return await res.json();
}

async function submitRating(businessId, rating) {
  if (!currentUser) {
    openAuthModal();
    return null;
  }
  
  const res = await fetch(`${API_BASE}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: businessId,
      user_id: currentUser.id,
      rating
    })
  });
  
  return await res.json();
}

async function submitReport(businessId, reason) {
  if (!currentUser) {
    openAuthModal();
    return null;
  }
  
  const userName = currentUser ? currentUser.display_name : 'Anonymous';
  
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: businessId,
      user_name: userName,
      reason
    })
  });
  
  return await res.json();
}

async function signIn(name, hoodId) {
  const res = await fetch(`${API_BASE}/users/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, hood_id: hoodId })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
  return await res.json();
}

/* ===== AUTH MODAL ===== */
function openAuthModal(defaultTab) {
  document.getElementById('authModalBackdrop').classList.add('open');
  switchAuthTab(defaultTab || 'login');
  const sel = document.getElementById('regHood');
  if (sel.options.length <= 1 && hoods.length) {
    hoods.forEach(h => {
      const o = document.createElement('option');
      o.value = h.id; o.textContent = h.name;
      sel.appendChild(o);
    });
  }
}
function closeAuthModal() {
  document.getElementById('authModalBackdrop').classList.remove('open');
  document.getElementById('loginErr').textContent = '';
  document.getElementById('registerErr').textContent = '';
}
function switchAuthTab(tab) {
  document.getElementById('loginForm').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('registerForm').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}
document.getElementById('authModalBackdrop').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAuthModal();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const backdrop = document.getElementById('authModalBackdrop');
  if (!backdrop.classList.contains('open')) return;
  if (document.getElementById('loginForm').style.display !== 'none') doLogin();
  else doRegister();
});

async function doLogin() {
  const phone    = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;
  document.getElementById('loginErr').textContent = '';
  if (!phone || !password) { document.getElementById('loginErr').textContent = 'Phone and password required'; return; }
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('loginErr').textContent = data.error; return; }
    onSignedIn(data);
  } catch (_) { document.getElementById('loginErr').textContent = 'Network error'; }
}

async function doRegister() {
  const name     = document.getElementById('regName').value.trim();
  const hood_id  = document.getElementById('regHood').value;
  const phone    = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  document.getElementById('registerErr').textContent = '';
  if (!name || !hood_id || !phone || !password) {
    document.getElementById('registerErr').textContent = 'All fields are required'; return;
  }
  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, hood_id, phone, password })
    });
    const data = await res.json();
    if (!res.ok) { document.getElementById('registerErr').textContent = data.error; return; }
    onSignedIn(data);
  } catch (_) { document.getElementById('registerErr').textContent = 'Network error'; }
}

function onSignedIn(user) {
  saveUser(user);
  closeAuthModal();
  updateUserUI();
  renderGrid();
}

function doSignOut() {
  if (!confirm('Sign out?')) return;
  clearUser();
  updateUserUI();
  renderGrid();
}

function updateUserUI() {
  const signinBtn   = document.getElementById('signinBtn');
  const userPillBtn = document.getElementById('userPillBtn');
  const menuSignIn  = document.getElementById('menuSignInItem');
  const menuUser    = document.getElementById('menuUserItem');
  const menuSignOut = document.getElementById('menuSignOutItem');
  if (currentUser) {
    signinBtn.style.display   = 'none';
    userPillBtn.style.display = '';
    document.getElementById('userPillName').textContent = currentUser.display_name;
    document.getElementById('userAvatar').textContent   = currentUser.name.charAt(0).toUpperCase();
    if (menuSignIn)  menuSignIn.style.display  = 'none';
    if (menuUser)  { menuUser.style.display = ''; document.getElementById('menuUserName').textContent = '👤 ' + currentUser.display_name; }
    if (menuSignOut) menuSignOut.style.display = '';
  } else {
    signinBtn.style.display   = '';
    userPillBtn.style.display = 'none';
    if (menuSignIn)  menuSignIn.style.display  = '';
    if (menuUser)    menuUser.style.display    = 'none';
    if (menuSignOut) menuSignOut.style.display = 'none';
  }
}

/* ===== HELPERS ===== */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  let html = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="halfGrad"><stop offset="50%" stop-color="#f5a623"/><stop offset="50%" stop-color="#e5e7eb"/></linearGradient></defs></svg>';
  html += '<div class="stars">';
  for (let i = 0; i < full; i++) html += starSVG("filled");
  if (half) html += starSVG("half");
  for (let i = 0; i < empty; i++) html += starSVG("");
  html += "</div>";
  return html;
}

function starSVG(cls) {
  return `<svg class="star ${cls}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;
}

function buildTile(b) {
  return `
  <article class="tile" data-category="${b.category_name}" data-hood="${b.hood_name}" data-business-id="${b.id}" onclick="openBusinessPage(${b.id})" style="cursor:pointer">
    <img class="tile-image" src="${b.image_url}" alt="${b.name}" loading="lazy" />
    <div class="tile-body">
      <div class="tile-top">
        <h3 class="tile-name">${b.name}</h3>
        ${b.price_indicator ? `<span class="tile-price">${b.price_indicator}</span>` : ""}
      </div>
      <p class="tile-tag">${b.category_name} • ${b.hood_name}</p>
      <p class="tile-hook">${b.hook_text || ''}</p>
      <div class="tile-rating" onclick="event.stopPropagation()">
        ${renderStars(b.rating_avg)}
        <span class="rating-text">${b.rating_avg.toFixed(1)} (${b.rating_count})</span>
        <button class="report-btn" onclick="event.stopPropagation(); reportIssue(${b.id})">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${currentUser ? 'Report' : '<span class="login-gate-msg">Report <button onclick="openAuthModal();event.stopPropagation()">Sign in</button></span>'}
        </button>
      </div>
      <div class="tile-actions" onclick="event.stopPropagation()">
        <a href="tel:${b.phone_number}" class="action-btn call" aria-label="Call">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
        <a href="${b.website_link}" target="_blank" rel="noopener" class="action-btn" aria-label="Website">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </a>
        <a href="${b.location_link}" target="_blank" rel="noopener" class="action-btn" aria-label="Location">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        </a>
        <button class="action-btn share-btn" aria-label="Share" onclick="shareBusiness(${b.id}, '${b.name.replace(/'/g, "\\'")}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
      </div>
    </div>
  </article>`;
}

function buildCarouselItem(p) {
  return `
  <div class="carousel-item" data-business-id="${p.business_id}" onclick="openBusinessPage(${p.business_id})" style="cursor:pointer">
    <img src="${p.image_url}" alt="${p.title}" loading="lazy" />
    <div class="carousel-item-body">
      <div class="carousel-item-top">
        <p class="carousel-item-name">${p.title}</p>
      </div>
      <p class="carousel-item-desc">${p.hook_text}</p>
      ${p.exact_price ? `<p class="carousel-item-price">${p.exact_price}</p>` : ''}
      <div class="carousel-item-meta">
        <span class="carousel-item-business">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          ${p.business_name}
        </span>
        <span class="carousel-item-location">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          ${p.location_text}
        </span>
      </div>
    </div>
  </div>`;
}

/* ===== RENDER ===== */
async function renderGrid() {
  const grid = document.getElementById("businessGrid");
  const empty = document.getElementById("emptyState");
  const count = document.getElementById("resultCount");
  const title = document.getElementById("gridTitle");

  businesses = await fetchBusinesses(activeCategory, activeHood);

  // If user is logged in and no hood filter is active, float their hood to the top
  if (currentUser && currentUser.hood_id && activeHood === 'all') {
    const userHoodName = hoods.find(h => h.id === currentUser.hood_id)?.name || '';
    businesses = [
      ...businesses.filter(b => b.hood_name === userHoodName),
      ...businesses.filter(b => b.hood_name !== userHoodName)
    ];
  }

  grid.innerHTML = businesses.slice(0, 20).map(buildTile).join("");
  const shown = Math.min(businesses.length, 20);
  count.textContent = businesses.length > 20
    ? `Showing ${shown} of ${businesses.length} businesses`
    : `${businesses.length} business${businesses.length !== 1 ? "es" : ""}`;

  const catName = activeCategory === 'all' ? 'All' : activeCategory;
  const hoodName = activeHood === 'all' ? 'All' : activeHood;

  if (activeCategory === "all" && activeHood === "all") {
    title.textContent = "All Businesses";
  } else if (activeCategory !== "all" && activeHood === "all") {
    title.textContent = catName;
  } else if (activeCategory === "all" && activeHood !== "all") {
    title.textContent = `Businesses in ${hoodName}`;
  } else {
    title.textContent = `${catName} in ${hoodName}`;
  }

  if (businesses.length === 0) {
    empty.hidden = false;
    grid.style.display = "none";
  } else {
    empty.hidden = true;
    grid.style.display = "";
  }
}

async function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  featuredProducts = await fetchFeatured();
  track.innerHTML = featuredProducts.map(buildCarouselItem).join("");
}

async function populateFilters() {
  categories = await fetchCategories();
  hoods = await fetchHoods();
  
  const catList = document.getElementById('catList');
  const hoodList = document.getElementById('hoodList');
  
  catList.innerHTML = '<li data-value="all" class="active" role="option">All Categories</li>';
  categories.forEach(c => {
    catList.innerHTML += `<li data-value="${c.name}" role="option">${c.name}</li>`;
  });
  
  hoodList.innerHTML = '<li data-value="all" class="active" role="option">All Neighbourhoods</li>';
  hoods.forEach(h => {
    hoodList.innerHTML += `<li data-value="${h.name}" role="option">📍 ${h.name}</li>`;
  });
}

/* ===== PRODUCT SEARCH ===== */
let searchDebounce = null;

function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function buildSearchResult(p, query) {
  const img = p.image_url
    ? `<img class="psr-img" src="${p.image_url}" alt="${p.name}" loading="lazy" />`
    : `<div class="psr-img-placeholder">🛍</div>`;
  return `
  <li class="psr-item" role="option" data-business-id="${p.business_id}" tabindex="-1">
    ${img}
    <div class="psr-info">
      <p class="psr-name">${highlight(p.name, query)}</p>
      <p class="psr-meta">
        ${p.business_name}${p.hood_name ? ' · ' + p.hood_name : ''}
        ${p.description ? ' — ' + p.description.slice(0, 50) + (p.description.length > 50 ? '…' : '') : ''}
      </p>
    </div>
    ${p.price ? `<span class="psr-price">${p.price}</span>` : ''}
  </li>`;
}

function initProductSearch() {
  const input = document.getElementById('productSearchInput');
  const results = document.getElementById('productSearchResults');
  const clearBtn = document.getElementById('productSearchClear');

  async function doSearch(q) {
    if (!q || q.length < 2) {
      results.hidden = true;
      results.innerHTML = '';
      clearBtn.hidden = !q;
      return;
    }
    clearBtn.hidden = false;

    const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(q)}`);
    const items = await res.json();

    if (items.length === 0) {
      results.innerHTML = `<li class="psr-empty">No products or services found for "<strong>${q}</strong>"</li>`;
    } else {
      results.innerHTML = items.map(p => buildSearchResult(p, q)).join('');
    }
    results.hidden = false;

    // Click on result → open business page
    results.querySelectorAll('.psr-item').forEach(li => {
      li.addEventListener('click', () => {
        const bizId = parseInt(li.dataset.businessId);
        results.hidden = true;
        input.value = '';
        clearBtn.hidden = true;
        openBusinessPage(bizId);
      });
    });
  }

  input.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => doSearch(input.value.trim()), 280);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    results.hidden = true;
    results.innerHTML = '';
    input.focus();
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = [...results.querySelectorAll('.psr-item')];
    const focused = results.querySelector('.psr-item.focused');
    const idx = items.indexOf(focused);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[idx + 1] || items[0];
      if (next) { focused?.classList.remove('focused'); next.classList.add('focused'); next.focus(); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = items[idx - 1] || items[items.length - 1];
      if (prev) { focused?.classList.remove('focused'); prev.classList.add('focused'); prev.focus(); }
    } else if (e.key === 'Escape') {
      results.hidden = true;
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#productSearchBox') && !e.target.closest('#productSearchResults')) {
      results.hidden = true;
    }
  });
}

/* ===== BUSINESS PAGE ===== */
let currentBizId = null;

async function openBusinessPage(businessId) {
  const db_biz = businesses.length
    ? businesses
    : await fetchBusinesses();

  // Find the business — if not in current filtered list, fetch all
  let biz = db_biz.find(b => b.id === businessId);
  if (!biz) {
    const res = await fetch(`${API_BASE}/businesses/${businessId}`);
    biz = await res.json();
  }
  if (!biz || biz.error) return;

  currentBizId = businessId;

  // Populate hero
  const heroImg = document.getElementById('bizHeroImg');
  heroImg.src = biz.image_url || '';
  heroImg.alt = biz.name;

  document.getElementById('bizName').textContent = biz.name;

  const badge = document.getElementById('bizPriceBadge');
  badge.textContent = biz.price_indicator || '';
  badge.style.display = biz.price_indicator ? '' : 'none';

  document.getElementById('bizTag').textContent = `${biz.category_name} • ${biz.hood_name}`;
  document.getElementById('bizHook').textContent = biz.hook_text || '';

  // Rating display
  const ratingRow = document.getElementById('bizRatingRow');
  ratingRow.innerHTML = `
    ${renderStars(biz.rating_avg)}
    <span class="biz-rating-num">${biz.rating_avg.toFixed(1)}</span>
    <span class="biz-rating-count">(${biz.rating_count} ratings)</span>
  `;

  // Rate stars — highlight if user already rated
  const rateStars = document.querySelectorAll('.biz-rate-star');
  let userRating = 0;
  if (currentUser) {
    try {
      const rRes = await fetch(`${API_BASE}/ratings/user/${currentUser.id}/business/${businessId}`);
      const rData = await rRes.json();
      userRating = rData.rating || 0;
    } catch (_) {}
  }
  rateStars.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.val) <= userRating);
  });

  // Action buttons
  document.getElementById('bizActions').innerHTML = `
    <a href="tel:${biz.phone_number}" class="biz-action-btn call">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Call
    </a>
    ${biz.website_link ? `<a href="${biz.website_link}" target="_blank" rel="noopener" class="biz-action-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      Website
    </a>` : ''}
    ${biz.location_link ? `<a href="${biz.location_link}" target="_blank" rel="noopener" class="biz-action-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
      Location
    </a>` : ''}
    <button class="biz-action-btn share-btn" onclick="shareBusiness(${biz.id}, '${biz.name.replace(/'/g, "\\'")}')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      Share
    </button>
  `;

  // Report button
  document.getElementById('bizReportBtn').onclick = () => reportIssue(businessId);
  document.getElementById('bizReportBtn').innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ${currentUser ? 'Report Issue' : '<span class="login-gate-msg">Report <button onclick="openAuthModal();event.stopPropagation()">Sign in</button></span>'}
  `;

  // Products
  const pGrid = document.getElementById('bizProductsGrid');
  pGrid.innerHTML = '<p class="biz-products-empty">Loading…</p>';
  try {
    const pRes = await fetch(`${API_BASE}/products?business_id=${businessId}`);
    const products_list = await pRes.json();
    if (products_list.length === 0) {
      pGrid.innerHTML = '<p class="biz-products-empty">No products or services listed yet.</p>';
    } else {
      pGrid.innerHTML = products_list.map(p => `
        <div class="biz-product-card">
          ${p.image_url
            ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" />`
            : `<div class="biz-product-card-img-placeholder">🛍</div>`}
          <div class="biz-product-card-body">
            <p class="biz-product-card-name">${p.name}</p>
            ${p.description ? `<p class="biz-product-card-desc">${p.description}</p>` : ''}
            ${p.price ? `<p class="biz-product-card-price">${p.price}</p>` : ''}
          </div>
        </div>
      `).join('');
    }
  } catch (_) {
    pGrid.innerHTML = '<p class="biz-products-empty">Could not load products.</p>';
  }

  // Sidebar — all businesses except current
  const allBiz = await fetchBusinesses();
  const sidebar = document.getElementById('bizSidebar');
  const others = allBiz.filter(b => b.id !== businessId);
  sidebar.innerHTML = `<p class="biz-sidebar-title">Other Businesses</p>` +
    others.map(b => `
      <div class="biz-sidebar-item" data-id="${b.id}">
        <img class="biz-sidebar-img" src="${b.image_url || ''}" alt="${b.name}" loading="lazy" />
        <div class="biz-sidebar-info">
          <p class="biz-sidebar-name">${b.name}</p>
          <p class="biz-sidebar-tag">${b.category_name} • ${b.hood_name}</p>
        </div>
        <span class="biz-sidebar-rating">★ ${b.rating_avg.toFixed(1)}</span>
      </div>
    `).join('');

  sidebar.querySelectorAll('.biz-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      openBusinessPage(parseInt(item.dataset.id));
      document.getElementById('bizMain').scrollTop = 0;
    });
  });

  // Open the page
  const page = document.getElementById('bizPage');
  page.classList.add('open');
  page.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Update URL with slug (no separate page, same SPA)
  history.replaceState({ businessId }, '', `/?business=${toSlug(biz.name)}`);
}

function closeBusinessPage() {
  const page = document.getElementById('bizPage');
  page.classList.remove('open');
  page.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentBizId = null;
  // Remove the query param
  history.replaceState({}, '', '/');
}

// Back button
document.getElementById('bizBackBtn').addEventListener('click', closeBusinessPage);

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('bizPage').classList.contains('open')) {
    closeBusinessPage();
  }
});

// Rate stars interaction
document.getElementById('bizRateStars').addEventListener('click', async (e) => {
  const btn = e.target.closest('.biz-rate-star');
  if (!btn) return;
  if (!currentUser) {
    openAuthModal();
    return;
  }
  const val = parseInt(btn.dataset.val);
  const result = await submitRating(currentBizId, val);
  if (result && result.success) {
    document.querySelectorAll('.biz-rate-star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val);
    });
    // Update rating display
    document.getElementById('bizRatingRow').innerHTML = `
      ${renderStars(result.rating_avg)}
      <span class="biz-rating-num">${result.rating_avg.toFixed(1)}</span>
      <span class="biz-rating-count">(${result.rating_count} ratings)</span>
    `;
  }
});

/* ===== SCROLL TO BUSINESS (now opens the page) ===== */
function scrollToBusiness(businessId) {
  openBusinessPage(businessId);
}

/* ===== DROPDOWN LOGIC ===== */
function setupDropdown(btnId, panelId, searchId, listId, onSelect) {
  const btn = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  const search = document.getElementById(searchId);
  const list = document.getElementById(listId);

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.contains("open");
    closeAllDropdowns();
    if (!isOpen) {
      panel.classList.add("open");
      btn.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      search.focus();
    }
  });

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    list.querySelectorAll("li").forEach(li => {
      li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  list.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    list.querySelectorAll("li").forEach(el => el.classList.remove("active"));
    li.classList.add("active");
    const label = li.textContent.replace(/^[^\w]+/, "").trim();
    btn.querySelector("span").textContent = label;
    onSelect(li.dataset.value);
    closeAllDropdowns();
    search.value = "";
    list.querySelectorAll("li").forEach(el => el.style.display = "");
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-panel").forEach(p => p.classList.remove("open"));
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.classList.remove("open");
    b.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", closeAllDropdowns);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAllDropdowns(); });

/* ===== HAMBURGER MENU ===== */
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

function openMenu() {
  sideMenu.classList.add("open");
  menuOverlay.classList.add("visible");
  menuToggle.classList.add("open");
  menuToggle.setAttribute("aria-expanded", "true");
  sideMenu.setAttribute("aria-hidden", "false");
}
function closeMenu() {
  sideMenu.classList.remove("open");
  menuOverlay.classList.remove("visible");
  menuToggle.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  sideMenu.setAttribute("aria-hidden", "true");
}

menuToggle.addEventListener("click", () => {
  sideMenu.classList.contains("open") ? closeMenu() : openMenu();
});
menuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);
sideMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));

/* ===== CAROUSEL ===== */
let carouselIndex = 0;
const ITEM_WIDTH = 280 + 14; // desktop: item width + gap
let autoplayTimer = null;
let touchStartX = 0;

function isMobileCarousel() {
  return window.innerWidth <= 640;
}

function visibleCarouselItems() {
  if (isMobileCarousel()) return 1;
  const wrapper = document.querySelector(".carousel-track-wrapper");
  return Math.max(1, Math.floor(wrapper.offsetWidth / ITEM_WIDTH));
}

function updateCarousel() {
  // On mobile, scroll-snap handles everything — never touch transform
  if (isMobileCarousel()) return;
  const track = document.getElementById("carouselTrack");
  const maxIndex = Math.max(0, featuredProducts.length - visibleCarouselItems());
  carouselIndex = Math.max(0, Math.min(carouselIndex, maxIndex));
  track.style.transform = `translateX(-${carouselIndex * ITEM_WIDTH}px)`;
}

function stepCarousel(dir) {
  const wrapper = document.querySelector(".carousel-track-wrapper");

  if (isMobileCarousel()) {
    // Scroll by exactly one viewport-width slot; snap points do the rest
    const itemW = window.innerWidth;
    const maxScroll = wrapper.scrollWidth - itemW;
    let next = wrapper.scrollLeft + dir * itemW;
    // wrap around
    if (next > maxScroll + 1) next = 0;
    if (next < -1) next = maxScroll;
    wrapper.scrollTo({ left: next, behavior: 'smooth' });
    return;
  }

  const maxIndex = Math.max(0, featuredProducts.length - visibleCarouselItems());
  carouselIndex += dir;
  if (carouselIndex > maxIndex) carouselIndex = 0;
  if (carouselIndex < 0) carouselIndex = maxIndex;
  updateCarousel();
}

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => stepCarousel(1), 3000);
}

function stopAutoplay() {
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
}

document.getElementById("carouselNext").addEventListener("click", () => {
  stepCarousel(1);
  startAutoplay();
});
document.getElementById("carouselPrev").addEventListener("click", () => {
  stepCarousel(-1);
  startAutoplay();
});

const carouselWrapper = document.querySelector(".carousel-track-wrapper");

// Desktop: pause autoplay on hover
carouselWrapper.addEventListener("mouseenter", stopAutoplay);
carouselWrapper.addEventListener("mouseleave", startAutoplay);

// Touch: record start position and pause autoplay
carouselWrapper.addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].clientX;
  stopAutoplay();
}, { passive: true });

// Touch end: if it was a fast flick (not a slow drag the snap already caught),
// nudge one step in the swipe direction
carouselWrapper.addEventListener("touchend", (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 30) {
    stepCarousel(diff > 0 ? 1 : -1);
  }
  startAutoplay();
}, { passive: true });

// Desktop resize: recalculate translateX offset
window.addEventListener("resize", () => {
  if (!isMobileCarousel()) updateCarousel();
});

/* ===== STICKY FEATURED BAR ===== */
function initStickyFeatured() {
  const sticky = document.getElementById("featuredSticky");
  const spacer = document.getElementById("featuredSpacer");
  const footer = document.getElementById("siteFooter");

  function syncSpacer() {
    spacer.style.height = sticky.offsetHeight + "px";
  }
  syncSpacer();
  window.addEventListener("resize", syncSpacer);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sticky.classList.add("hidden");
        } else {
          sticky.classList.remove("hidden");
        }
      });
    },
    { threshold: 0.01 }
  );

  observer.observe(footer);
}

/* ===== REPORT ISSUE ===== */
async function reportIssue(id) {
  if (!currentUser) {
    openAuthModal();
    return;
  }
  const reason = prompt('Please describe the issue:');
  if (!reason) return;
  
  try {
    await submitReport(id, reason);
    alert('Thank you for your report. Our team will review it shortly.');
  } catch (error) {
    alert('Failed to submit report. Please try again.');
  }
}

/* ===== SLUG HELPER ===== */
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')           // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
}

/* ===== SHARE BUSINESS ===== */
async function shareBusiness(businessId, businessName) {
  const slug = toSlug(businessName);
  const shareUrl = `${location.origin}/?business=${slug}`;
  const shareData = {
    title: `${businessName} — AddisDR`,
    text: `Check out ${businessName} on AddisDR, Addis Ababa's local business directory.`,
    url: shareUrl
  };

  // Use native Web Share API if available (mobile / modern browsers)
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  // Fallback: copy link to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard!');
  } catch (_) {
    prompt('Copy this link to share:', shareUrl);
  }
}

/* ===== TOAST NOTIFICATION ===== */
function showToast(message) {
  let toast = document.getElementById('shareToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shareToast';
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

/* ===== HANDLE DIRECT /?business=slug URL ===== */
async function handleDirectUrl() {
  const params = new URLSearchParams(location.search);
  const param = params.get('business');
  if (!param) return;

  // Support both legacy numeric IDs and new slugs
  if (!isNaN(param)) {
    openBusinessPage(parseInt(param));
    return;
  }

  // Slug lookup — fetch all businesses and match by slug
  const all = await fetchBusinesses();
  const match = all.find(b => toSlug(b.name) === param);
  if (match) openBusinessPage(match.id);
}

// Handle browser back/forward
window.addEventListener('popstate', async () => {
  const params = new URLSearchParams(location.search);
  const param = params.get('business');
  if (param) {
    if (!isNaN(param)) {
      openBusinessPage(parseInt(param));
    } else {
      const all = await fetchBusinesses();
      const match = all.find(b => toSlug(b.name) === param);
      if (match) openBusinessPage(match.id);
    }
  } else {
    const page = document.getElementById('bizPage');
    if (page.classList.contains('open')) {
      page.classList.remove('open');
      page.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      currentBizId = null;
    }
  }
});

/* ===== INIT ===== */
loadUser();

setupDropdown("catBtn", "catPanel", "catSearch", "catList", (val) => {
  activeCategory = val;
  renderGrid();
});
setupDropdown("hoodBtn", "hoodPanel", "hoodSearch", "hoodList", (val) => {
  activeHood = val;
  renderGrid();
});

(async function init() {
  // Validate stored session against the server — clears stale localStorage
  // sessions that exist locally but not in the current database (e.g. after a
  // DB reset or when switching between local and deployed environments).
  if (currentUser) {
    try {
      const res = await fetch(`${API_BASE}/users/${currentUser.id}`);
      if (!res.ok) {
        // User no longer exists in this DB — clear the stale session
        clearUser();
        updateUserUI();
      }
    } catch (_) {
      // Network error — keep the session, don't penalise offline use
    }
  }

  await populateFilters();
  await renderGrid();
  await renderCarousel();
  initStickyFeatured();
  initProductSearch();
  startAutoplay();
  window.addEventListener("resize", updateCarousel);
  handleDirectUrl();
})();
