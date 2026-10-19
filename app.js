/* ==========================================================================
   ANEYK VASTHRA - BRAND DATA & STORE SYSTEM
   ========================================================================== */

const PRODUCTS = [
  {
    id: 'av-101',
    title: 'Kanjivaram Crimson Zari Silk Saree',
    category: 'sarees',
    fabric: 'Pure Silk',
    price: 18999,
    originalPrice: 24999,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    description: 'Woven with pure gold motif zari work along deep crimson silk background. Accompanied by a unstitched silk blouse piece.',
    sizes: ['Free Size'],
    featured: true
  },
  {
    id: 'av-102',
    title: 'Ivory & Gold Handloom Organza Saree',
    category: 'sarees',
    fabric: 'Organza',
    price: 8499,
    originalPrice: 11999,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
    description: 'Lightweight sheer organza featuring muted gold botanical embroidery along the borders. Perfect for day functions.',
    sizes: ['Free Size'],
    featured: true
  },
  {
    id: 'av-103',
    title: 'Champagne Beige Velvet Lehenga Set',
    category: 'lehengas',
    fabric: 'Velvet',
    price: 22499,
    originalPrice: 28999,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    description: 'Rich champagne velvet lehenga studded with dabka and sequin embroidery paired with a net dupatta.',
    sizes: ['S', 'M', 'L', 'XL'],
    featured: true
  },
  {
    id: 'av-104',
    title: 'Espresso Brown Chanderi Anarkali Suit',
    category: 'anarkalis',
    fabric: 'Chanderi',
    price: 6999,
    originalPrice: 8999,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=800',
    description: 'Classic floor-length Chanderi suit styled with gold gota-patti accents and soft organza dupatta.',
    sizes: ['S', 'M', 'L'],
    featured: true
  },
  {
    id: 'av-105',
    title: 'Muted Gold Banarasi Brocade Saree',
    category: 'sarees',
    fabric: 'Pure Silk',
    price: 14500,
    originalPrice: 19000,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800',
    description: 'Classic Banarasi brocade weave with intricate floral kadwa motifs across the body.',
    sizes: ['Free Size'],
    featured: false
  },
  {
    id: 'av-106',
    title: 'Deep Coffee Silk Georgette Anarkali',
    category: 'anarkalis',
    fabric: 'Georgette',
    price: 11200,
    originalPrice: 14000,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    description: 'Flowy georgette flared suit featuring subtle zardozi work around the neckline.',
    sizes: ['M', 'L', 'XL'],
    featured: false
  }
];

class AneykStore {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('av_cart')) || [];
    this.wishlist = JSON.parse(localStorage.getItem('av_wishlist')) || [];
    this.selectedCategory = 'all';
    this.selectedSizes = [];
    this.selectedFabrics = [];
    this.maxPrice = 25000;
    this.searchQuery = '';
    this.selectedSizeForModal = null;
    
    this.init();
  }

  init() {
    this.updateBadges();
    this.renderHomeFeatured();
    this.renderCatalog();
  }

  // --- NAVIGATION ---
  showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('d-none'));
    const target = document.getElementById(`page${pageId.charAt(0).toUpperCase() + pageId.slice(1)}`);
    if (target) target.classList.remove('d-none');
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- HOME PAGE RENDER ---
  renderHomeFeatured() {
    const grid = document.getElementById('homeFeaturedGrid');
    if (!grid) return;
    
    const featured = PRODUCTS.filter(p => p.featured);
    grid.innerHTML = featured.map(p => this.createProductCardHtml(p)).join('');
  }

  // --- CATALOG & FILTERS ---
  filterCategory(cat) {
    this.selectedCategory = cat;
    const radio = document.querySelector(`input[name="catFilter"][value="${cat}"]`);
    if (radio) radio.checked = true;
    this.applyFilters();
  }

  updatePriceLabel(val) {
    this.maxPrice = Number(val);
    document.getElementById('priceValue').innerText = `₹${this.maxPrice.toLocaleString('en-IN')}`;
  }

  toggleSizeFilter(btn, size) {
    btn.classList.toggle('selected');
    if (this.selectedSizes.includes(size)) {
      this.selectedSizes = this.selectedSizes.filter(s => s !== size);
    } else {
      this.selectedSizes.push(size);
    }
    this.applyFilters();
  }

  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    if (this.searchQuery.length > 0) {
      this.showPage('shop');
    }
    this.applyFilters();
  }

  resetFilters() {
    this.selectedCategory = 'all';
    this.selectedSizes = [];
    this.selectedFabrics = [];
    this.maxPrice = 25000;
    this.searchQuery = '';
    
    document.querySelector('input[name="catFilter"][value="all"]').checked = true;
    document.getElementById('priceRange').value = 25000;
    document.getElementById('priceValue').innerText = '₹25,000';
    document.querySelectorAll('.fabric-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.size-pill').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('searchInput').value = '';

    this.applyFilters();
  }

  applyFilters() {
    // Read Fabric Checkboxes
    const fabricCbs = document.querySelectorAll('.fabric-checkbox:checked');
    this.selectedFabrics = Array.from(fabricCbs).map(cb => cb.value);

    // Read Sort Option
    const sortVal = document.getElementById('sortSelect')?.value || 'popular';

    let filtered = PRODUCTS.filter(p => {
      // Category Match
      if (this.selectedCategory !== 'all' && p.category !== this.selectedCategory) return false;
      // Price Match
      if (p.price > this.maxPrice) return false;
      // Fabric Match
      if (this.selectedFabrics.length > 0 && !this.selectedFabrics.includes(p.fabric)) return false;
      // Size Match
      if (this.selectedSizes.length > 0 && !p.sizes.some(s => this.selectedSizes.includes(s))) return false;
      // Search Match
      if (this.searchQuery && !p.title.toLowerCase().includes(this.searchQuery)) return false;
      return true;
    });

    // Sorting
    if (sortVal === 'low-high') filtered.sort((a, b) => a.price - b.price);
    if (sortVal === 'high-low') filtered.sort((a, b) => b.price - a.price);

    this.renderCatalog(filtered);
  }

  renderCatalog(items = PRODUCTS) {
    const grid = document.getElementById('catalogProductGrid');
    const countEl = document.getElementById('productCount');
    if (!grid) return;

    if (countEl) countEl.innerText = `${items.length} items found`;

    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <i class="fa-solid fa-magnifying-glass" style="font-size:2rem; color:var(--muted-gold); margin-bottom:1rem;"></i>
        <h3>No products found</h3>
        <p style="font-size:0.85rem; color:#666;">Try adjusting your filters or search terms.</p>
      </div>`;
      return;
    }

    grid.innerHTML = items.map(p => this.createProductCardHtml(p)).join('');
  }

  createProductCardHtml(p) {
    const isWished = this.wishlist.includes(p.id);
    const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

    return `
      <div class="product-card">
        <button class="wishlist-btn ${isWished ? 'active' : ''}" onclick="app.toggleWishlist('${p.id}', event)">
          <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
        <div class="product-img-wrap" onclick="app.openProductModal('${p.id}')">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </div>
        <div class="product-info" onclick="app.openProductModal('${p.id}')">
          <span class="product-category">${p.fabric}</span>
          <h4 class="product-title">${p.title}</h4>
          <div class="product-price-row">
            <span class="current-price">₹${p.price.toLocaleString('en-IN')}</span>
            <span class="original-price">₹${p.originalPrice.toLocaleString('en-IN')}</span>
            <span class="discount-tag">${discount}% OFF</span>
          </div>
        </div>
      </div>
    `;
  }

  // --- PRODUCT DETAIL MODAL (PDP) ---
  openProductModal(id) {
    const product = PRODUCTS.find(p => p.id === id);
    if (!product) return;

    this.selectedSizeForModal = product.sizes[0];
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    const modalContent = document.getElementById('modalProductContent');
    modalContent.innerHTML = `
      <div>
        <img src="${product.image}" alt="${product.title}" class="modal-img">
      </div>
      <div class="modal-details">
        <span style="text-transform:uppercase; font-size:0.75rem; letter-spacing:2px; color:var(--muted-gold); font-weight:600;">
          ${product.fabric} • Handcrafted
        </span>
        <h2 style="font-family:var(--font-heading); font-size:1.8rem; margin:0.5rem 0; color:var(--espresso);">
          ${product.title}
        </h2>
        
        <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:1.5rem;">
          <span style="font-size:1.5rem; font-weight:700;">₹${product.price.toLocaleString('en-IN')}</span>
          <span style="text-decoration:line-through; color:#888;">₹${product.originalPrice.toLocaleString('en-IN')}</span>
          <span style="color:#2e7d32; font-weight:600; font-size:0.9rem;">${discount}% OFF</span>
        </div>

        <p style="font-size:0.9rem; color:var(--deep-coffee); line-height:1.6; margin-bottom:1.5rem;">
          ${product.description}
        </p>

        <div style="margin-bottom:1.5rem;">
          <label style="font-size:0.8rem; font-weight:600; text-transform:uppercase; display:block; margin-bottom:8px;">
            Select Size
          </label>
          <div style="display:flex; gap:8px;">
            ${product.sizes.map(s => `
              <button class="size-pill ${s === this.selectedSizeForModal ? 'selected' : ''}" 
                onclick="app.selectModalSize(this, '${s}')">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- Pincode Checker -->
        <div style="background-color:var(--soft-cream); padding:1rem; border-radius:4px; margin-bottom:1.5rem;">
          <label style="font-size:0.8rem; font-weight:600; display:block; margin-bottom:6px;">Delivery Check</label>
          <div style="display:flex; gap:8px;">
            <input type="text" id="pincodeCheck" placeholder="Enter 6-digit pincode" maxlength="6" style="padding:6px; border:1px solid var(--champagne-beige); border-radius:2px; width:160px;">
            <button class="btn btn-secondary btn-sm" onclick="app.checkPincode()">Check</button>
          </div>
          <div id="pincodeResult" style="font-size:0.78rem; margin-top:6px;"></div>
        </div>

        <div style="display:flex; gap:1rem;">
          <button class="btn btn-primary" style="flex:1;" onclick="app.addToCart('${product.id}')">
            <i class="fa-solid fa-bag-shopping"></i> Add To Bag
          </button>
        </div>
      </div>
    `;

    document.getElementById('productModal').classList.add('open');
  }

  closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
  }

  selectModalSize(btn, size) {
    document.querySelectorAll('#modalProductContent .size-pill').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedSizeForModal = size;
  }

  checkPincode() {
    const val = document.getElementById('pincodeCheck').value;
    const res = document.getElementById('pincodeResult');
    if (val.length === 6 && !isNaN(val)) {
      res.innerHTML = `<span style="color:green;"><i class="fa-solid fa-truck"></i> Standard Express Delivery available by 3-4 days</span>`;
    } else {
      res.innerHTML = `<span style="color:red;">Please enter a valid 6-digit Indian Pincode</span>`;
    }
  }

  // --- CART MANAGEMENT ---
  addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const size = this.selectedSizeForModal || product.sizes[0];
    const existingIndex = this.cart.findIndex(item => item.id === productId && item.size === size);

    if (existingIndex > -1) {
      this.cart[existingIndex].qty += 1;
    } else {
      this.cart.push({ ...product, size, qty: 1 });
    }

    this.saveCart();
    this.closeProductModal();
    this.toggleCartDrawer(true);
  }

  updateCartQty(index, change) {
    this.cart[index].qty += change;
    if (this.cart[index].qty <= 0) {
      this.cart.splice(index, 1);
    }
    this.saveCart();
  }

  saveCart() {
    localStorage.setItem('av_cart', JSON.stringify(this.cart));
    this.updateBadges();
    this.renderCartDrawer();
  }

  toggleCartDrawer(forceOpen = false) {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (forceOpen || !drawer.classList.contains('open')) {
      this.renderCartDrawer();
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  }

  renderCartDrawer() {
    const container = document.getElementById('cartDrawerItems');
    const subtotalEl = document.getElementById('cartDrawerSubtotal');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:3rem 1rem; color:#777;">
        <i class="fa-solid fa-bag-shopping" style="font-size:2rem; margin-bottom:1rem;"></i>
        <p>Your shopping bag is currently empty.</p>
      </div>`;
      subtotalEl.innerText = '₹0';
      return;
    }

    let subtotal = 0;
    container.innerHTML = this.cart.map((item, idx) => {
      subtotal += item.price * item.qty;
      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-size">Size: ${item.size}</div>
            <div style="font-weight:700; margin-top:2px;">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="app.updateCartQty(${idx}, -1)">-</button>
              <span>${item.qty}</span>
              <button class="qty-btn" onclick="app.updateCartQty(${idx}, 1)">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    subtotalEl.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
  }

  // --- WISHLIST MANAGEMENT ---
  toggleWishlist(productId, e) {
    if (e) e.stopPropagation();
    
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter(id => id !== productId);
    } else {
      this.wishlist.push(productId);
    }

    localStorage.setItem('av_wishlist', JSON.stringify(this.wishlist));
    this.updateBadges();
    this.renderHomeFeatured();
    this.applyFilters();
  }

  toggleWishlistDrawer() {
    const drawer = document.getElementById('wishlistDrawer');
    const overlay = document.getElementById('wishlistOverlay');
    if (!drawer.classList.contains('open')) {
      this.renderWishlistDrawer();
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  }

  renderWishlistDrawer() {
    const container = document.getElementById('wishlistDrawerItems');
    if (!container) return;

    if (this.wishlist.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:3rem 1rem; color:#777;">
        <i class="fa-regular fa-heart" style="font-size:2rem; margin-bottom:1rem;"></i>
        <p>No saved items in your wishlist.</p>
      </div>`;
      return;
    }

    const wishedProducts = PRODUCTS.filter(p => this.wishlist.includes(p.id));
    container.innerHTML = wishedProducts.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div style="font-weight:700; margin-top:2px;">₹${item.price.toLocaleString('en-IN')}</div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <button class="btn btn-primary btn-sm" onclick="app.openProductModal('${item.id}'); app.toggleWishlistDrawer();">View</button>
            <button class="btn btn-secondary btn-sm" onclick="app.toggleWishlist('${item.id}')">Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateBadges() {
    const cartCount = this.cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartBadge').innerText = cartCount;
    document.getElementById('wishlistBadge').innerText = this.wishlist.length;
  }

  // --- CHECKOUT PROCESS ---
  goToCheckout() {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    this.toggleCartDrawer(false);
    this.showPage('checkout');
    this.renderCheckoutSummary();
  }

  renderCheckoutSummary() {
    const itemsContainer = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('chkSubtotal');
    const totalEl = document.getElementById('chkGrandTotal');

    let subtotal = 0;
    itemsContainer.innerHTML = this.cart.map(item => {
      subtotal += item.price * item.qty;
      return `
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:6px;">
          <span>${item.title} (x${item.qty})</span>
          <span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
        </div>
      `;
    }).join('');

    const codFee = document.querySelector('input[name="payMethod"]:checked')?.value === 'COD' ? 99 : 0;

    subtotalEl.innerText = `₹${subtotal.toLocaleString('en-IN')}`;
    totalEl.innerText = `₹${(subtotal + codFee).toLocaleString('en-IN')}`;
  }

  handleAddressSubmit(e) {
    e.preventDefault();
    document.getElementById('addressForm').classList.add('d-none');
    document.getElementById('paymentSection').classList.remove('d-none');
    document.getElementById('step1Indicator').classList.remove('active');
    document.getElementById('step2Indicator').classList.add('active');
  }

  backToAddress() {
    document.getElementById('addressForm').classList.remove('d-none');
    document.getElementById('paymentSection').classList.add('d-none');
    document.getElementById('step1Indicator').classList.add('active');
    document.getElementById('step2Indicator').classList.remove('active');
  }

  togglePaymentDetails(type) {
    document.getElementById('upiDetails').classList.toggle('d-none', type !== 'upi');
    document.getElementById('cardDetails').classList.toggle('d-none', type !== 'card');
    document.getElementById('codFeeRow').classList.toggle('d-none', type !== 'cod');
    this.renderCheckoutSummary();
  }

  processPayment() {
    const orderId = 'AV-' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('successOrderId').innerText = orderId;

    // Clear Cart
    this.cart = [];
    this.saveCart();

    this.showPage('orderSuccess');
  }
}

// Initialize Application
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new AneykStore();
});