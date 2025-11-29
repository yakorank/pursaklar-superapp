const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası (proje klasöründe)
const db = new sqlite3.Database(path.join(__dirname, 'pursaklar.db'));

db.serialize(() => {
  console.log('📦 Veritabanı yapılandırılıyor...');
  
  // Kategoriler tablosu
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  )`);
  
  // Hizmetler tablosu
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER DEFAULT 0,
    image_url TEXT,
    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
  )`);
  
  // Siparişler tablosu
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    service_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Varsayılan veriler (ilk kurulumda)
  db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (err) {
      console.error('Veritabanı hatası:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('📝 Varsayılan kategoriler ekleniyor...');
      
      const categories = [
        { id: 1, name: '🛒 Market', icon: '🏪', color: '#ff6b00', sort_order: 1 },
        { id: 2, name: '🍔 Yemek', icon: '🍕', color: '#ff4757', sort_order: 2 },
        { id: 3, name: '🏠 Emlak', icon: '🏠', color: '#3742fa', sort_order: 3 },
        { id: 4, name: '🔥 Canlı Mezat', icon: '🔨', color: '#2ed573', sort_order: 4 },
        { id: 5, name: '✂️ Güzellik', icon: '💇', color: '#a55eea', sort_order: 5 },
        { id: 6, name: '🏥 Sağlık', icon: '🏥', color: '#26de81', sort_order: 6 },
        { id: 7, name: '🛠️ Usta', icon: '🔧', color: '#778ca3', sort_order: 7 },
        { id: 8, name: '🍰 Pastane', icon: '🍰', color: '#fdcb6e', sort_order: 8 }
      ];
      
      const catStmt = db.prepare(
        "INSERT INTO categories (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)"
      );
      
      categories.forEach(cat => {
        catStmt.run(cat.id, cat.name, cat.icon, cat.color, cat.sort_order);
      });
      catStmt.finalize();
      
      // Örnek hizmetler
      const services = [
        { id: 1, category_id: 1, name: 'Süper Market', description: 'Günlük ihtiyaçlar, temel gıda', price: 0, image_url: 'https://picsum.photos/seed/market1/300/200.jpg' },
        { id: 2, category_id: 1, name: 'Manav', description: 'Taze sebze meyve', price: 0, image_url: 'https://picsum.photos/seed/manav1/300/200.jpg' },
        { id: 3, category_id: 2, name: 'Dönerci', description: 'Et döner, tavuk döner', price: 150, image_url: 'https://picsum.photos/seed/doner1/300/200.jpg' },
        { id: 4, category_id: 2, name: 'Pizzacı', description: 'Bol malzemos pizza', price: 200, image_url: 'https://picsum.photos/seed/pizza1/300/200.jpg' },
        { id: 5, category_id: 3, name: 'Satılık Daire', description: '2+1 100m² merkezi', price: 1500000, image_url: 'https://picsum.photos/seed/daire1/300/200.jpg' },
        { id: 6, category_id: 3, name: 'Kiralık Daire', description: '1+1 60m² eşyalı', price: 8000, image_url: 'https://picsum.photos/seed/kiralik1/300/200.jpg' },
        { id: 7, category_id: 4, name: 'Elektronik Mezat', description: 'İkinci el telefon', price: 0, image_url: 'https://picsum.photos/seed/mezat1/300/200.jpg' },
        { id: 8, category_id: 5, name: 'Erkek Kuaför', description: 'Saç, sakal traşı', price: 150, image_url: 'https://picsum.photos/seed/kuafor1/300/200.jpg' },
        { id: 9, category_id: 6, name: 'Eczane', description: 'Reçeteli ilaç', price: 0, image_url: 'https://picsum.photos/seed/eczane1/300/200.jpg' },
        { id: 10, category_id: 7, name: 'Elektrik Ustası', description: 'Acil elektrik', price: 500, image_url: 'https://picsum.photos/seed/usta1/300/200.jpg' },
        { id: 11, category_id: 8, name: 'Börekçi', description: 'Sıcak börek', price: 50, image_url: 'https://picsum.photos/seed/borek1/300/200.jpg' }
      ];
      
      const servStmt = db.prepare(
        "INSERT INTO services (id, category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?)"
      );
      
      services.forEach(s => {
        servStmt.run(s.id, s.category_id, s.name, s.description, s.price, s.image_url);
      });
      servStmt.finalize();
      
      console.log('✅ 8 kategori ve 11 hizmet eklendi');
    } else {
      console.log('✓ Kategoriler zaten mevcut');
    }
  });
});

module.exports = db;