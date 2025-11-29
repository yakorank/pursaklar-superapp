// API URL
const API_URL = 'http://localhost:3000/api';

// Global state
let currentCategory = null;
let currentService = null;

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ SW registered'))
      .catch(err => console.log('❌ SW registration failed:', err));
  });
}

// PWA Install Prompt
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('📲 PWA yüklendi');
  }
  
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// Push Notification Permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('🔔 Bildirim izni verildi');
    }
  });
}

// Navigation Functions
function showPage(pageName) {
  // Tüm section'ları gizle
  document.querySelectorAll('section').forEach(section => {
    section.style.display = 'none';
  });
  
  // İstenen section'ı göster
  const targetSection = document.getElementById(pageName + '-section');
  if (targetSection) {
    targetSection.style.display = 'block';
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load Categories
async function loadCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error('Kategoriler alınamadı');
    
    const categories = await response.json();
    renderCategories(categories);
  } catch (error) {
    console.error('Kategori yükleme hatası:', error);
    document.getElementById('categories-grid').innerHTML = 
      '<div class="error">Kategoriler yüklenemedi. Lütfen sayfayı yenileyin.</div>';
  }
}

// Render Categories
function renderCategories(categories) {
  const grid = document.getElementById('categories-grid');
  grid.innerHTML = '';
  
  categories.forEach(category => {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.borderTopColor = category.color;
    card.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <div class="category-name">${category.name}</div>
    `;
    card.addEventListener('click', () => loadServices(category));
    grid.appendChild(card);
  });
}

// Load Services
async function loadServices(category) {
  currentCategory = category;
  showPage('services');
  document.getElementById('category-title').textContent = category.name;
  
  try {
    const response = await fetch(`${API_URL}/services/${category.id}`);
    if (!response.ok) throw new Error('Hizmetler alınamadı');
    
    const services = await response.json();
    renderServices(services);
  } catch (error) {
    console.error('Hizmet yükleme hatası:', error);
    document.getElementById('services-grid').innerHTML = 
      '<div class="error">Hizmetler yüklenemedi.</div>';
  }
}

// Render Services
function renderServices(services) {
  const grid = document.getElementById('services-grid');
  grid.innerHTML = '';
  
  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <img src="${service.image_url}" alt="${service.name}" loading="lazy">
      <div class="service-info">
        <h3>${service.name}</h3>
        <p>${service.description}</p>
        ${service.price > 0 ? `<div class="service-price">₺${service.price.toLocaleString()}</div>` : ''}
        <button class="order-btn" onclick="showOrderForm(${service.id}, '${service.name.replace(/'/g, "\\'")}')">
          Hemen Talep Et
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Show Order Form
function showOrderForm(serviceId, serviceName) {
  currentService = { id: serviceId, name: serviceName };
  showPage('order');
  
  const serviceInfoCard = document.getElementById('service-info');
  serviceInfoCard.innerHTML = `
    <h3>📋 ${serviceName}</h3>
    <p>Lütfen iletişim bilgilerinizi doldurun:</p>
  `;
  
  // Form reset
  document.getElementById('order-form').reset();
}

// Handle Order Form Submit
document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    serviceId: currentService.id,
    customer_name: document.getElementById('customer_name').value.trim(),
    customer_phone: document.getElementById('customer_phone').value.replace(/\s+/g, ''),
    address: document.getElementById('address').value.trim(),
    notes: document.getElementById('notes').value.trim()
  };
  
  // Form validation
  const phoneRegex = /^05[0-9]{9}$/;
  if (!phoneRegex.test(formData.customer_phone)) {
    alert('❌ Lütfen geçerli bir telefon numarası girin (05XXXXXXXXX)');
    return;
  }
  
  // Submit button disabled
  const submitBtn = e.target.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Gönderiliyor...';
  
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Success
      document.getElementById('order-id').textContent = result.orderId;
      showPage('success');
      
      // Send push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ Pursaklar Süper App', {
          body: `Sipariş #${result.orderId} alındı!`,
          icon: 'https://picsum.photos/seed/pursaklar-icon/192/192.jpg',
          badge: 'https://picsum.photos/seed/pursaklar-badge/72/72.jpg'
        });
      }
    } else {
      // Error
      alert(`❌ Hata: ${result.error}`);
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ Siparişi Tamamla';
    }
  } catch (error) {
    console.error('Sipariş hatası:', error);
    alert('❌ Bağlantı hatası! Sunucu çalışıyor mu?');
    submitBtn.disabled = false;
    submitBtn.textContent = '✅ Siparişi Tamamla';
  }
});

// Back Button Handlers
document.getElementById('back-btn').addEventListener('click', () => {
  showPage('categories');
});

document.getElementById('back-btn2').addEventListener('click', () => {
  showPage('services');
});

// Reset App
function resetApp() {
  showPage('categories');
  document.getElementById('order-form').reset();
  currentCategory = null;
  currentService = null;
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  showPage('categories');
});