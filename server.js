const express = require('express');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ----- API ROUTES -----

// Tüm kategorileri getir
app.get('/api/categories', (req, res) => {
  db.all("SELECT * FROM categories ORDER BY sort_order", [], (err, rows) => {
    if (err) {
      console.error('Kategori hatası:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Belirli kategorinin hizmetlerini getir
app.get('/api/services/:categoryId', (req, res) => {
  const categoryId = req.params.categoryId;
  db.all("SELECT * FROM services WHERE category_id = ? ORDER BY name", [categoryId], (err, rows) => {
    if (err) {
      console.error('Hizmet hatası:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Sipariş oluştur
app.post('/api/orders', (req, res) => {
  const { serviceId, customer_name, customer_phone, address, notes } = req.body;
  
  // Validasyon
  if (!serviceId || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }
  
  // Telefon formatı kontrolü
  const phoneRegex = /^05[0-9]{9}$/;
  if (!phoneRegex.test(customer_phone)) {
    return res.status(400).json({ error: 'Geçerli telefon numarası girin (05XXXXXXXXX)' });
  }
  
  // Hizmet bilgisini al
  db.get("SELECT * FROM services WHERE id = ?", [serviceId], (err, service) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!service) {
      return res.status(404).json({ error: 'Hizmet bulunamadı' });
    }
    
    // Siparişi kaydet
    db.run(
      "INSERT INTO orders (service_id, service_name, customer_name, customer_phone, address, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [serviceId, service.name, customer_name, customer_phone, address || '', notes || ''],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ 
          success: true,
          message: 'Sipariş başarıyla alındı',
          orderId: this.lastID,
          serviceName: service.name
        });
      }
    );
  });
});

// Sipariş durumunu sorgula
app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  db.get("SELECT * FROM orders WHERE id = ?", [orderId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json(row);
  });
});

// Ana sayfayı servis et
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pursaklar Süper App çalışıyor`);
  console.log(`📱 Tarayıcıda: http://localhost:${PORT}`);
  console.log(`📱 Ağ üzerinden: http://${require('os').networkInterfaces().wlan0?.[0]?.address || 'localhost'}:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  db.close();
  process.exit(0);
});