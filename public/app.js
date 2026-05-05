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
  localStorage.setItem('addisnet_user', JSON.stringify(user));
  currentUser = user;
}

function loadUser() {
  const stored = localStorage.getItem('addisnet_user');
  if (stored) {
    currentUser = JSON.parse(stored);
  }
}

function clearUser() {
  localStorage.removeItem('addisnet_user');
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
    alert('Please sign in to rate businesses');
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
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error);
  }
  
  return await res.json();
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
  <article class="tile" data-category="${b.category_name}" data-hood="${b.hood_name}" data-business-id="${b.id}">
    <img class="tile-image" src="${b.image_url}" alt="${b.name}" loading="lazy" />
    <div class="tile-body">
      <div class="tile-top">
        <h3 class="tile-name">${b.name}</h3>
        ${b.price_indicator ? `<span class="tile-price">${b.price_indicator}</span>` : ""}
      </div>
      <p class="tile-tag">${b.category_name} • ${b.hood_name}</p>
      <p class="tile-hook">${b.hook_text || ''}</p>
      <div class="tile-rating">
        ${renderStars(b.rating_avg)}
        <span class="rating-text">${b.rating_avg.toFixed(1)} (${b.rating_count})</span>
      </div>
      <div class="tile-actions">
        <a href="tel:${b.phone_number}" class="action-btn call">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Call
        </a>
        <a href="${b.website_link}" target="_blank" rel="noopener" class="action-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Website
        </a>
        <a href="${b.location_link}" target="_blank" rel="noopener" class="action-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          Location
        </a>
      </div>
    </div>
    <div class="tile-footer">
      <button class="report-btn" onclick="reportIssue(${b.id})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Report Issue
      </button>
    </div>
  </article>`;
}

function buildCarouselItem(p) {
  return `
  <div class="carousel-item" data-business-id="${p.business_id}" onclick="scrollToBusiness(${p.business_id})">
    <img src="${p.image_url}" alt="${p.title}" loading="lazy" />
    <div class="carousel-item-body">
      <p class="carousel-item-name">${p.title}</p>
      <p class="carousel-item-desc">${p.hook_text}</p>
      <p class="carousel-item-price">${p.exact_price}</p>
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

  grid.innerHTML = businesses.map(buildTile).join("");
  count.textContent = `${businesses.length} business${businesses.length !== 1 ? "es" : ""}`;

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
  const siHood = document.getElementById('siHood');
  
  catList.innerHTML = '<li data-value="all" class="active" role="option">All Categories</li>';
  categories.forEach(c => {
    catList.innerHTML += `<li data-value="${c.name}" role="option">${c.name}</li>`;
  });
  
  hoodList.innerHTML = '<li data-value="all" class="active" role="option">All Neighbourhoods</li>';
  hoods.forEach(h => {
    hoodList.innerHTML += `<li data-value="${h.name}" role="option">📍 ${h.name}</li>`;
  });
  
  // Populate sign-in dropdown
  hoods.forEach(h => {
    siHood.innerHTML += `<option value="${h.id}">${h.name}</option>`;
  });
}

/* ===== SCROLL TO BUSINESS ===== */
function scrollToBusiness(businessId) {
  const tile = document.querySelector(`[data-business-id="${businessId}"]`);
  if (tile) {
    tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
    tile.classList.add('highlight');
    setTimeout(() => tile.classList.remove('highlight'), 2000);
  }
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
const ITEM_WIDTH = 280 + 14;
let autoplayTimer = null;

function visibleCarouselItems() {
  const wrapper = document.querySelector(".carousel-track-wrapper");
  return Math.floor(wrapper.offsetWidth / ITEM_WIDTH);
}

function updateCarousel() {
  const track = document.getElementById("carouselTrack");
  const maxIndex = Math.max(0, featuredProducts.length - visibleCarouselItems());
  carouselIndex = Math.max(0, Math.min(carouselIndex, maxIndex));
  track.style.transform = `translateX(-${carouselIndex * ITEM_WIDTH}px)`;
}

function stepCarousel(dir) {
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

document.querySelector(".carousel-track-wrapper").addEventListener("mouseenter", stopAutoplay);
document.querySelector(".carousel-track-wrapper").addEventListener("mouseleave", startAutoplay);

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
  const reason = prompt('Please describe the issue:');
  if (!reason) return;
  
  try {
    await submitReport(id, reason);
    alert('Thank you for your report. Our team will review it shortly.');
  } catch (error) {
    alert('Failed to submit report. Please try again.');
  }
}

/* ===== SIGN IN FORM ===== */
document.getElementById("signInForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("siName").value.trim();
  const hoodId = document.getElementById("siHood").value;
  
  if (!name || !hoodId) {
    alert("Please fill in both fields.");
    return;
  }
  
  try {
    const user = await signIn(name, hoodId);
    saveUser(user);
    alert(`Welcome, ${user.display_name}! You're now signed in.`);
    e.target.reset();
    
    // Apply hood filter
    activeHood = user.hood_name;
    document.getElementById('hoodLabel').textContent = user.hood_name;
    renderGrid();
  } catch (error) {
    alert(error.message);
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
  await populateFilters();
  await renderGrid();
  await renderCarousel();
  initStickyFeatured();
  startAutoplay();
  window.addEventListener("resize", updateCarousel);
})();
