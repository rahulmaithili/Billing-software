/**
 * Database Service Layer with Live Firebase Firestore Connection & Real-Time Sync
 */

const INITIAL_INVENTORY = [
  { id: "P10021", name: "Industrial Steel Rods 12mm", type: "Raw Material", category: "Metals", subcategory: "Steel", purchasedQty: 1000, soldQty: 650, remainingQty: 350, reorderLevel: 200, reorderRequired: false },
  { id: "P10022", name: "Aluminum Sheets 2mm", type: "Raw Material", category: "Metals", subcategory: "Aluminum", purchasedQty: 800, soldQty: 720, remainingQty: 80, reorderLevel: 150, reorderRequired: true },
  { id: "P10023", name: "Copper Wire Spool 100m", type: "Electrical", category: "Wiring", subcategory: "Copper", purchasedQty: 500, soldQty: 460, remainingQty: 40, reorderLevel: 100, reorderRequired: true },
  { id: "P10024", name: "Heavy Duty Ball Bearings", type: "Components", category: "Hardware", subcategory: "Bearings", purchasedQty: 1500, soldQty: 900, remainingQty: 600, reorderLevel: 300, reorderRequired: false },
  { id: "P10025", name: "Polycarbonate Transparent Sheets", type: "Plastics", category: "Polymer", subcategory: "Sheets", purchasedQty: 600, soldQty: 250, remainingQty: 350, reorderLevel: 100, reorderRequired: false },
  { id: "P10026", name: "Stainless Steel Hex Bolts M8", type: "Hardware", category: "Fasteners", subcategory: "Bolts", purchasedQty: 5000, soldQty: 4800, remainingQty: 200, reorderLevel: 1000, reorderRequired: true },
  { id: "P10027", name: "PVC Pressure Pipes 4 inch", type: "Plumbing", category: "Pipes", subcategory: "PVC", purchasedQty: 1200, soldQty: 850, remainingQty: 350, reorderLevel: 250, reorderRequired: false },
  { id: "P10028", name: "Industrial Safety Helmets", type: "Safety Gear", category: "PPE", subcategory: "Helmets", purchasedQty: 400, soldQty: 380, remainingQty: 20, reorderLevel: 50, reorderRequired: true }
];

const INITIAL_CUSTOMERS = [
  { id: "CUST-001", name: "Apex Builders Pvt Ltd", city: "Mumbai", state: "Maharashtra", phone: "+91 9820011223", email: "contact@apexbuilders.in", receivable: 170000 },
  { id: "CUST-002", name: "Vertex Tech Infra", city: "Bengaluru", state: "Karnataka", phone: "+91 9845033445", email: "billing@vertexinfra.com", receivable: 180000 },
  { id: "CUST-003", name: "Global Engineering Works", city: "Ahmedabad", state: "Gujarat", phone: "+91 9723044556", email: "info@globaleng.co.in", receivable: 180000 },
  { id: "CUST-004", name: "Sunrise Fabrication", city: "Delhi", state: "Delhi", phone: "+91 9910055667", email: "accounts@sunrisefab.com", receivable: 270000 },
  { id: "CUST-005", name: "Ultra Tech Constructions", city: "Pune", state: "Maharashtra", phone: "+91 9822066778", email: "orders@ultratechconst.in", receivable: 140000 },
  { id: "CUST-006", name: "L&T Infra Projects", city: "Chennai", state: "Tamil Nadu", phone: "+91 9444077889", email: "procurement@ltinfra.com", receivable: 120000 }
];

const INITIAL_SUPPLIERS = [
  { id: "SUP-001", name: "Tata Steel Logistics", city: "Jamshedpur", state: "Jharkhand", phone: "+91 9334011223", email: "sales@tatasteel.com", payable: 325000 },
  { id: "SUP-002", name: "Hindalco Aluminum Corp", city: "Renukoot", state: "Uttar Pradesh", phone: "+91 9415022334", email: "orders@hindalco.com", payable: 280000 },
  { id: "SUP-003", name: "Polycab Electricals", city: "Vadodara", state: "Gujarat", phone: "+91 9825033445", email: "support@polycab.com", payable: 270000 },
  { id: "SUP-004", name: "Supreme Plastics Ltd", city: "Mumbai", state: "Maharashtra", phone: "+91 9820088990", email: "dealer@supreme.co.in", payable: 150000 }
];

const INITIAL_SALES = [
  { id: "SO-1001", soDate: "2026-07-01", customerName: "Apex Builders Pvt Ltd", city: "Mumbai", state: "Maharashtra", itemType: "Raw Material", qty: 200, unitPrice: 850, totalSalesPrice: 170000 },
  { id: "SO-1002", soDate: "2026-07-05", customerName: "Vertex Tech Infra", city: "Bengaluru", state: "Karnataka", itemType: "Electrical", qty: 150, unitPrice: 1200, totalSalesPrice: 180000 },
  { id: "SO-1003", soDate: "2026-07-10", customerName: "Global Engineering Works", city: "Ahmedabad", state: "Gujarat", itemType: "Components", qty: 400, unitPrice: 450, totalSalesPrice: 180000 },
  { id: "SO-1004", soDate: "2026-07-15", customerName: "Sunrise Fabrication", city: "Delhi", state: "Delhi", itemType: "Raw Material", qty: 300, unitPrice: 900, totalSalesPrice: 270000 },
  { id: "SO-1005", soDate: "2026-07-18", customerName: "Ultra Tech Constructions", city: "Pune", state: "Maharashtra", itemType: "Hardware", qty: 2000, unitPrice: 70, totalSalesPrice: 140000 },
  { id: "SO-1006", soDate: "2026-07-20", customerName: "L&T Infra Projects", city: "Chennai", state: "Tamil Nadu", itemType: "Plumbing", qty: 400, unitPrice: 300, totalSalesPrice: 120000 }
];

const INITIAL_PURCHASES = [
  { id: "PO-5001", date: "2026-06-20", supplierName: "Tata Steel Logistics", itemType: "Raw Material", qty: 500, unitPrice: 650, totalPurchasePrice: 325000, state: "Jharkhand" },
  { id: "PO-5002", date: "2026-06-25", supplierName: "Hindalco Aluminum Corp", itemType: "Raw Material", qty: 800, unitPrice: 350, totalPurchasePrice: 280000, state: "Uttar Pradesh" },
  { id: "PO-5003", date: "2026-07-02", supplierName: "Polycab Electricals", itemType: "Electrical", qty: 300, unitPrice: 900, totalPurchasePrice: 270000, state: "Gujarat" },
  { id: "PO-5004", date: "2026-07-12", supplierName: "Supreme Plastics Ltd", itemType: "Plastics", qty: 500, unitPrice: 300, totalPurchasePrice: 150000, state: "Maharashtra" }
];

const INITIAL_RECEIPTS = [
  { id: "REC-901", date: "2026-07-03", customerName: "Apex Builders Pvt Ltd", amount: 50000, paymentMethod: "NEFT / Bank Transfer" },
  { id: "REC-902", date: "2026-07-08", customerName: "Vertex Tech Infra", amount: 98000, paymentMethod: "UPI" },
  { id: "REC-903", date: "2026-07-14", customerName: "Sunrise Fabrication", amount: 150000, paymentMethod: "RTGS" }
];

const INITIAL_PAYMENTS = [
  { id: "PAY-801", date: "2026-07-04", supplierName: "Tata Steel Logistics", amount: 145000, paymentMethod: "RTGS" },
  { id: "PAY-802", date: "2026-07-11", supplierName: "Hindalco Aluminum Corp", amount: 185000, paymentMethod: "Bank Transfer" },
  { id: "PAY-803", date: "2026-07-16", supplierName: "Polycab Electricals", amount: 120000, paymentMethod: "NEFT" }
];

class DBService {
  constructor() {
    this.firestore = null;
    this.initLocalStorage();
    this.initFirebase();
  }

  initFirebase() {
    try {
      if (window.firebase && window.firebaseConfig) {
        if (!firebase.apps.length) {
          firebase.initializeApp(window.firebaseConfig);
        }
        this.firestore = firebase.firestore();
        console.log("Firebase Firestore initialized successfully.");
        this.loadAllDataFromFirestore();
      }
    } catch (err) {
      console.warn("Firebase fallback mode active:", err);
    }
  }

  initLocalStorage() {
    // Only initialize with empty placeholder arrays if no data exists
    const keys = ['app_inventory', 'app_customers', 'app_suppliers', 'app_sales', 'app_purchases', 'app_receipts', 'app_payments'];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }

  async loadAllDataFromFirestore() {
    if (!this.firestore) return;
    try {
      console.log("Fetching live dataset from Firebase Firestore...");
      const collections = ['inventory', 'customers', 'suppliers', 'sales', 'purchases', 'receipts', 'payments'];
      const storageKeys = {
        'inventory': 'app_inventory',
        'customers': 'app_customers',
        'suppliers': 'app_suppliers',
        'sales': 'app_sales',
        'purchases': 'app_purchases',
        'receipts': 'app_receipts',
        'payments': 'app_payments'
      };

      for (const col of collections) {
        const snapshot = await this.firestore.collection(col).get();
        if (!snapshot.empty) {
          const items = [];
          snapshot.forEach(doc => {
            items.push(doc.data());
          });
          this.saveData(storageKeys[col], items);
          console.log(`Firestore Sync: Loaded ${items.length} items for ${col}`);
        } else {
          // If Firestore collection is empty, populate it with rich initial demo dataset
          const initialData = this.getInitialDataForCollection(col);
          this.saveData(storageKeys[col], initialData);
          for (const item of initialData) {
            await this.firestore.collection(col).doc(item.id).set(item);
          }
          console.log(`Firestore Seeded: Populated ${col} with default demo data.`);
        }
      }

      // Re-trigger active view to render the fetched firestore data instantly
      if (window.location && typeof window.renderView === 'function') {
        const currentHash = window.location.hash.replace('#', '') || 'dashboard';
        window.renderView(currentHash);
      }
    } catch (err) {
      console.error("Firestore retrieval error:", err);
    }
  }

  getInitialDataForCollection(col) {
    if (col === 'inventory') return INITIAL_INVENTORY;
    if (col === 'customers') return INITIAL_CUSTOMERS;
    if (col === 'suppliers') return INITIAL_SUPPLIERS;
    if (col === 'sales') return INITIAL_SALES;
    if (col === 'purchases') return INITIAL_PURCHASES;
    if (col === 'receipts') return INITIAL_RECEIPTS;
    if (col === 'payments') return INITIAL_PAYMENTS;
    return [];
  }

  getData(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  syncToFirestore(collectionName, docId, data) {
    if (this.firestore) {
      this.firestore.collection(collectionName).doc(docId).set(data, { merge: true })
        .catch(err => console.warn(`Firestore sync error on ${collectionName}:`, err));
    }
  }

  deleteFromFirestore(collectionName, docId) {
    if (this.firestore) {
      this.firestore.collection(collectionName).doc(docId).delete()
        .catch(err => console.warn(`Firestore delete error on ${collectionName}:`, err));
    }
  }

  // --- Inventory ---
  getInventory() { return this.getData('app_inventory'); }
  addInventoryItem(item) {
    const list = this.getInventory();
    item.id = item.id || "P" + Math.floor(10000 + Math.random() * 90000);
    item.purchasedQty = Number(item.purchasedQty || 0);
    item.soldQty = Number(item.soldQty || 0);
    item.remainingQty = item.purchasedQty - item.soldQty;
    item.reorderRequired = item.remainingQty < (Number(item.reorderLevel) || 0);
    list.unshift(item);
    this.saveData('app_inventory', list);
    this.syncToFirestore('inventory', item.id, item);
    return item;
  }
  deleteInventoryItem(id) {
    let list = this.getInventory();
    list = list.filter(item => item.id !== id);
    this.saveData('app_inventory', list);
    this.deleteFromFirestore('inventory', id);
  }

  // --- Customers ---
  getCustomers() { return this.getData('app_customers'); }
  addCustomer(cust) {
    const list = this.getCustomers();
    cust.id = cust.id || "CUST-" + Math.floor(100 + Math.random() * 900);
    cust.receivable = Number(cust.receivable || 0);
    list.unshift(cust);
    this.saveData('app_customers', list);
    this.syncToFirestore('customers', cust.id, cust);
    return cust;
  }
  deleteCustomer(id) {
    let list = this.getCustomers();
    list = list.filter(item => item.id !== id);
    this.saveData('app_customers', list);
    this.deleteFromFirestore('customers', id);
  }

  // --- Suppliers ---
  getSuppliers() { return this.getData('app_suppliers'); }
  addSupplier(sup) {
    const list = this.getSuppliers();
    sup.id = sup.id || "SUP-" + Math.floor(100 + Math.random() * 900);
    sup.payable = Number(sup.payable || 0);
    list.unshift(sup);
    this.saveData('app_suppliers', list);
    this.syncToFirestore('suppliers', sup.id, sup);
    return sup;
  }
  deleteSupplier(id) {
    let list = this.getSuppliers();
    list = list.filter(item => item.id !== id);
    this.saveData('app_suppliers', list);
    this.deleteFromFirestore('suppliers', id);
  }

  // --- Sales ---
  getSales() { return this.getData('app_sales'); }
  addSale(sale) {
    const list = this.getSales();
    sale.id = sale.id || "SO-" + Math.floor(1000 + Math.random() * 9000);
    sale.totalSalesPrice = Number(sale.qty || 0) * Number(sale.unitPrice || 0);
    list.unshift(sale);
    this.saveData('app_sales', list);
    this.syncToFirestore('sales', sale.id, sale);
    return sale;
  }

  // --- Purchases ---
  getPurchases() { return this.getData('app_purchases'); }
  addPurchase(purch) {
    const list = this.getPurchases();
    purch.id = purch.id || "PO-" + Math.floor(1000 + Math.random() * 9000);
    purch.totalPurchasePrice = Number(purch.qty || 0) * Number(purch.unitPrice || 0);
    list.unshift(purch);
    this.saveData('app_purchases', list);
    this.syncToFirestore('purchases', purch.id, purch);
    return purch;
  }

  // --- Receipts ---
  getReceipts() { return this.getData('app_receipts'); }
  addReceipt(rec) {
    const list = this.getReceipts();
    rec.id = rec.id || "REC-" + Math.floor(100 + Math.random() * 900);
    list.unshift(rec);
    this.saveData('app_receipts', list);
    this.syncToFirestore('receipts', rec.id, rec);
    return rec;
  }

  // --- Payments ---
  getPayments() { return this.getData('app_payments'); }
  addPayment(pay) {
    const list = this.getPayments();
    pay.id = pay.id || "PAY-" + Math.floor(100 + Math.random() * 900);
    list.unshift(pay);
    this.saveData('app_payments', list);
    this.syncToFirestore('payments', pay.id, pay);
    return pay;
  }

  // --- Dashboard Metrics ---
  getDashboardMetrics() {
    const sales = this.getSales();
    const purchases = this.getPurchases();
    const customers = this.getCustomers();
    const suppliers = this.getSuppliers();

    const totalSales = sales.reduce((sum, r) => sum + Number(r.totalSalesPrice || 0), 0);
    const totalPurchases = purchases.reduce((sum, r) => sum + Number(r.totalPurchasePrice || 0), 0);
    const netProfit = totalSales - totalPurchases;

    const totalReceivable = customers.reduce((sum, r) => sum + Number(r.receivable || 0), 0);
    const totalPayable = suppliers.reduce((sum, r) => sum + Number(r.payable || 0), 0);

    const salesByCity = {};
    sales.forEach(r => {
      const city = r.city || 'Unknown';
      salesByCity[city] = (salesByCity[city] || 0) + Number(r.totalSalesPrice || 0);
    });
    const topLocation = Object.entries(salesByCity).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Delhi';

    const salesByItem = {};
    sales.forEach(r => {
      const item = r.itemType || 'Unknown';
      salesByItem[item] = (salesByItem[item] || 0) + Number(r.totalSalesPrice || 0);
    });
    const topItem = Object.entries(salesByItem).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Raw Material';

    return {
      totalSales,
      totalPurchases,
      netProfit,
      totalReceivable,
      totalPayable,
      topLocation,
      topItem,
      sales,
      purchases,
      customers,
      suppliers
    };
  }
}

window.dbService = new DBService();
export default window.dbService;
