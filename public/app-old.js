/* ===== DATA ===== */
const businesses = [
  {
    id: 1,
    name: "Yod Abyssinia",
    category: "restaurants",
    hood: "bole",
    tag: "Restaurant • Bole",
    hook: "Traditional Ethiopian cuisine with live cultural shows nightly.",
    price: "$$",
    featuredPrice: "From 250 ETB",
    rating: 4.8,
    reviews: 312,
    phone: "+251911000001",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    featured: true,
  },
  {
    id: 2,
    name: "Shoa Supermarket",
    category: "grocery",
    hood: "megenagna",
    tag: "Grocery • Megenagna",
    hook: "Fresh produce, imported goods, and household essentials under one roof.",
    price: "Affordable",
    featuredPrice: "From 50 ETB",
    rating: 4.3,
    reviews: 189,
    phone: "+251911000002",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    featured: true,
  },
  {
    id: 3,
    name: "Selam Furniture",
    category: "furniture",
    hood: "kazanchis",
    tag: "Furniture • Kazanchis",
    hook: "Modern and classic furniture crafted locally with premium materials.",
    price: "From 3,500 ETB",
    rating: 4.5,
    reviews: 74,
    phone: "+251911000003",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    featured: false,
  },
  {
    id: 4,
    name: "Kenema Pharmacy",
    category: "pharmacy",
    hood: "bole",
    tag: "Pharmacy • Bole",
    hook: "24/7 pharmacy with licensed pharmacists and home delivery.",
    price: "Affordable",
    featuredPrice: "From 120 ETB",
    rating: 4.6,
    reviews: 221,
    phone: "+251911000004",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80",
    featured: true,
  },
  {
    id: 5,
    name: "Bethzatha Clinic",
    category: "clinics",
    hood: "piassa",
    tag: "Clinic • Piassa",
    hook: "General and specialist consultations with same-day appointments.",
    price: "From 500 ETB",
    rating: 4.7,
    reviews: 156,
    phone: "+251911000005",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
    featured: false,
  },
  {
    id: 6,
    name: "Desta Fashion House",
    category: "fashion",
    hood: "sarbet",
    tag: "Fashion • Sarbet",
    hook: "Contemporary Ethiopian fashion blending habesha and modern styles.",
    price: "$$",
    featuredPrice: "From 800 ETB",
    rating: 4.4,
    reviews: 98,
    phone: "+251911000006",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80",
    featured: true,
  },
  {
    id: 7,
    name: "Addis Tech Hub",
    category: "electronics",
    hood: "gerji",
    tag: "Electronics • Gerji",
    hook: "Laptops, phones, accessories and expert repair services.",
    price: "From 1,200 ETB",
    rating: 4.2,
    reviews: 143,
    phone: "+251911000007",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
    featured: false,
  },
  {
    id: 8,
    name: "Liya Beauty Spa",
    category: "beauty",
    hood: "bole",
    tag: "Beauty & Spa • Bole",
    hook: "Full-service salon and spa with natural Ethiopian beauty treatments.",
    price: "From 350 ETB",
    featuredPrice: "From 350 ETB",
    rating: 4.9,
    reviews: 267,
    phone: "+251911000008",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
    featured: true,
  },
  {
    id: 9,
    name: "Kaldi's Coffee",
    category: "bakery",
    hood: "megenagna",
    tag: "Bakery & Café • Megenagna",
    hook: "Ethiopia's beloved coffee chain — freshly roasted, always welcoming.",
    price: "Affordable",
    featuredPrice: "From 80 ETB",
    rating: 4.7,
    reviews: 504,
    phone: "+251911000009",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
    featured: true,
  },
  {
    id: 10,
    name: "Bole Auto Center",
    category: "auto",
    hood: "bole",
    tag: "Auto Services • Bole",
    hook: "Full mechanical service, car wash, and detailing by certified technicians.",
    price: "From 800 ETB",
    rating: 4.3,
    reviews: 88,
    phone: "+251911000010",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80",
    featured: false,
  },
  {
    id: 11,
    name: "Summit Grill",
    category: "restaurants",
    hood: "summit",
    tag: "Restaurant • Summit",
    hook: "Grilled meats and mezze platters with a rooftop view of the city.",
    price: "$$$",
    rating: 4.6,
    reviews: 201,
    phone: "+251911000011",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    featured: false,
  },
  {
    id: 12,
    name: "Ayat Fresh Market",
    category: "grocery",
    hood: "ayat",
    tag: "Grocery • Ayat",
    hook: "Farm-to-table fresh vegetables, fruits, and organic products daily.",
    price: "Affordable",
    rating: 4.1,
    reviews: 67,
    phone: "+251911000012",
    website: "https://example.com",
    location: "https://maps.google.com",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80",
    featured: false,
  },
];

/* ===== FEATURED PRODUCTS ===== */
// Each entry is a product — not a business.
// business = where to find it, hood = neighbourhood, location = maps link.
const featuredProducts = [
  {
    id: "p1",
    name: "Doro Wat Platter",
    description: "Slow-cooked spiced chicken in rich berbere sauce, served with injera.",
    price: "280 ETB",
    image: "https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400&q=80",
    business: "Yod Abyssinia",
    hood: "Bole",
    location: "https://maps.google.com",
  },
  {
    id: "p2",
    name: "Fresh Avocado Juice",
    description: "Thick blended avocado with a hint of honey — a Addis classic.",
    price: "85 ETB",
    image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80",
    business: "Shoa Supermarket",
    hood: "Megenagna",
    location: "https://maps.google.com",
  },
  {
    id: "p3",
    name: "Macchiato",
    description: "Ethiopia's signature espresso topped with a cloud of steamed milk.",
    price: "55 ETB",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80",
    business: "Kaldi's Coffee",
    hood: "Megenagna",
    location: "https://maps.google.com",
  },
  {
    id: "p4",
    name: "Habesha Dress (Netela)",
    description: "Hand-woven traditional cotton dress with embroidered border detail.",
    price: "1,200 ETB",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4f7b?w=400&q=80",
    business: "Desta Fashion House",
    hood: "Sarbet",
    location: "https://maps.google.com",
  },
  {
    id: "p5",
    name: "Deep Tissue Massage",
    description: "60-minute full-body massage using natural Ethiopian oils.",
    price: "450 ETB",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
    business: "Liya Beauty Spa",
    hood: "Bole",
    location: "https://maps.google.com",
  },
  {
    id: "p6",
    name: "Paracetamol 500mg (20 tabs)",
    description: "Standard pain relief tablets, licensed and quality-checked.",
    price: "35 ETB",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
    business: "Kenema Pharmacy",
    hood: "Bole",
    location: "https://maps.google.com",
  },
  {
    id: "p7",
    name: "Tibs (Mixed Meat)",
    description: "Sautéed beef and lamb with rosemary, jalapeño, and onion.",
    price: "320 ETB",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80",
    business: "Summit Grill",
    hood: "Summit",
    location: "https://maps.google.com",
  },
  {
    id: "p8",
    name: "Croissant & Coffee Combo",
    description: "Buttery croissant paired with a freshly pulled espresso shot.",
    price: "120 ETB",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
    business: "Kaldi's Coffee",
    hood: "Megenagna",
    location: "https://maps.google.com",
  },
];

/* ===== STATE ===== */
let activeCategory = "all";
let activeHood = "all";

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
  <article class="tile" data-category="${b.category}" data-hood="${b.hood}">
    <img class="tile-image" src="${b.image}" alt="${b.name}" loading="lazy" />
    <div class="tile-body">
      <div class="tile-top">
        <h3 class="tile-name">${b.name}</h3>
        ${b.price ? `<span class="tile-price">${b.price}</span>` : ""}
      </div>
      <p class="tile-tag">${b.tag}</p>
      <p class="tile-hook">${b.hook}</p>
      <div class="tile-rating">
        ${renderStars(b.rating)}
        <span class="rating-text">${b.rating} (${b.reviews})</span>
      </div>
      <div class="tile-actions">
        <a href="tel:${b.phone}" class="action-btn call">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Call
        </a>
        <a href="${b.website}" target="_blank" rel="noopener" class="action-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Website
        </a>
        <a href="${b.location}" target="_blank" rel="noopener" class="action-btn">
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
  <div class="carousel-item">
    <img src="${p.image}" alt="${p.name}" loading="lazy" />
    <div class="carousel-item-body">
      <p class="carousel-item-name">${p.name}</p>
      <p class="carousel-item-desc">${p.description}</p>
      <p class="carousel-item-price">${p.price}</p>
      <div class="carousel-item-meta">
        <span class="carousel-item-business">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          ${p.business}
        </span>
        <a href="${p.location}" target="_blank" rel="noopener" class="carousel-item-location">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          ${p.hood}
        </a>
      </div>
    </div>
  </div>`;
}

/* ===== RENDER ===== */
function renderGrid() {
  const grid = document.getElementById("businessGrid");
  const empty = document.getElementById("emptyState");
  const count = document.getElementById("resultCount");
  const title = document.getElementById("gridTitle");

  const filtered = businesses.filter(b => {
    const catMatch = activeCategory === "all" || b.category === activeCategory;
    const hoodMatch = activeHood === "all" || b.hood === activeHood;
    return catMatch && hoodMatch;
  });

  grid.innerHTML = filtered.map(buildTile).join("");
  count.textContent = `${filtered.length} business${filtered.length !== 1 ? "es" : ""}`;

  const catEl = document.querySelector(`#catList li[data-value="${activeCategory}"]`);
  const hoodEl = document.querySelector(`#hoodList li[data-value="${activeHood}"]`);
  const catName = catEl ? catEl.textContent.replace(/^[^\w]+/, "").trim() : "All";
  const hoodName = hoodEl ? hoodEl.textContent.replace(/^[^\w]+/, "").trim() : "All";

  if (activeCategory === "all" && activeHood === "all") {
    title.textContent = "All Businesses";
  } else if (activeCategory !== "all" && activeHood === "all") {
    title.textContent = catName;
  } else if (activeCategory === "all" && activeHood !== "all") {
    title.textContent = `Businesses in ${hoodName}`;
  } else {
    title.textContent = `${catName} in ${hoodName}`;
  }

  if (filtered.length === 0) {
    empty.hidden = false;
    grid.style.display = "none";
  } else {
    empty.hidden = true;
    grid.style.display = "";
  }
}

function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  track.innerHTML = featuredProducts.map(buildCarouselItem).join("");
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
const ITEM_WIDTH = 280 + 14; // item flex-basis + gap
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
  // wrap around
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
  // restart timer so manual click doesn't cause a double-jump
  startAutoplay();
});
document.getElementById("carouselPrev").addEventListener("click", () => {
  stepCarousel(-1);
  startAutoplay();
});

// Pause on hover, resume on leave
document.querySelector(".carousel-track-wrapper").addEventListener("mouseenter", stopAutoplay);
document.querySelector(".carousel-track-wrapper").addEventListener("mouseleave", startAutoplay);

/* ===== STICKY FEATURED BAR — hide when footer "Stay in the loop" is visible ===== */
function initStickyFeatured() {
  const sticky = document.getElementById("featuredSticky");
  const spacer = document.getElementById("featuredSpacer");
  const footer = document.getElementById("siteFooter");

  // Match spacer height to actual sticky bar height
  function syncSpacer() {
    spacer.style.height = sticky.offsetHeight + "px";
  }
  syncSpacer();
  window.addEventListener("resize", syncSpacer);

  // Watch the footer — when it enters the viewport, slide the bar away
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
    { threshold: 0.01 } // trigger as soon as 1px of footer is visible
  );

  observer.observe(footer);
}

/* ===== REPORT ISSUE ===== */
function reportIssue(id) {
  const b = businesses.find(x => x.id === id);
  if (b) alert(`Thank you for your report on "${b.name}". Our team will review it shortly.`);
}

/* ===== SIGN IN FORM ===== */
document.getElementById("signInForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("siName").value.trim();
  const hood = document.getElementById("siHood").value;
  if (!name || !hood) { alert("Please fill in both fields."); return; }
  alert(`Welcome, ${name} from ${hood}! You're now signed in.`);
  e.target.reset();
});

/* ===== INIT ===== */
setupDropdown("catBtn", "catPanel", "catSearch", "catList", (val) => {
  activeCategory = val;
  renderGrid();
});
setupDropdown("hoodBtn", "hoodPanel", "hoodSearch", "hoodList", (val) => {
  activeHood = val;
  renderGrid();
});

renderGrid();
renderCarousel();
initStickyFeatured();
startAutoplay();
window.addEventListener("resize", updateCarousel);
