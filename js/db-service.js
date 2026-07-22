/**
 * Database Service Layer
 * Supports both Firebase Firestore and Local Storage / Mock DB Mode for instant preview.
 */

const INITIAL_INVENTORY = [
  { id: "P10021", name: "Industrial Steel Rods", type: "Raw Material", category: "Metals", subcategory: "Steel", purchasedQty: 500, soldQty: 350, remainingQty: 150, reorderLevel: 200, reorderRequired: true },
  { id: "P10022", name: "Aluminum Sheets 2mm", type: "Raw Material", category: "Metals", subcategory: "Aluminum", purchasedQty: 800, soldQty: 400, remainingQty: 400, reorderLevel: 150, reorderRequired: false },
  { id: "P10023", name: "Copper Wire Spool", type: "Electrical", category: "Wiring", subcategory: "Copper", purchasedQty: 300, soldQty: 280, remainingQty: 20, reorderLevel: 50, reorderRequired: true },
  { id: "P10024", name: "Heavy Duty Bearings", type: "Components", category: "Hardware", subcategory: "Bearings", purchasedQty: 1000, soldQty: 600, remainingQty: 400, reorderLevel: 250, reorderRequired: false },
  { id: "P10025", name: "Polycarbonate Sheets", type: "Plastics", category: "Polymer", subcategory: "Sheets", purchasedQty: 450, soldQty: 150, remainingQty: 300, reorderLevel: 100, reorderRequired: false }
];

const INITIAL_CUSTOMERS = [
  { id: "CUST-001", name: "Apex Builders Pvt Ltd", city: "Mumbai", state: "Maharashtra", phone: "+91 9820011223", email: "contact@apexbuilders.in", receivable: 145000 },
  { id: "CUST-002", name: "Vertex Tech Infra", city: "Bengaluru", state: "Karnataka", phone: "+91 9845033445", email: "billing@vertexinfra.com", receivable: 82000 },
  { id: "CUST-003", name: "Global Engineering Works", city: "Ahmedabad", state: "Gujarat", phone: "+91 9723044556", email: "info@globaleng.co.in", receivable: 0 },
  { id: "CUST-004", name: "Sunrise Fabrication", city: "Delhi", state: "Delhi", phone: "+91 9910055667", email: "accounts@sunrisefab.com", receivable: 215000 }
];

const INITIAL_SUPPLIERS = [
  { id: "SUP-001", name: "Tata Steel Logistics", city: "Jamshedpur", state: "Jharkhand", phone: "+91 9334011223", email: "sales@tatasteel.com", payable: 180000 },
  { id: "SUP-002", name: "Hindalco Aluminum Corp", city: "Renukoot", state: "Uttar Pradesh", phone: "+91 9415022334", email: "orders@hindalco.com", payable: 95000 },
  { id: "SUP-003", name: "Polycab Electricals", city: "Vadodara", state: "Gujarat", phone: "+91 9825033445", email: "support@polycab.com", payable: 42000 }
];

const INITIAL_SALES = [
  { id: "SO-1001", soDate: "2026-07-01", customerName: "Apex Builders Pvt Ltd", city: "Mumbai", state: "Maharashtra", itemType: "Raw Material", qty: 200, unitPrice: 850, totalSalesPrice: 170000 },
  { id: "SO-1002", soDate: "2026-07-05", customerName: "Vertex Tech Infra", city: "Bengaluru", state: "Karnataka", itemType: "Electrical", qty: 150, unitPrice: 1200, totalSalesPrice: 180000 },
  { id: "SO-1003", soDate: "2026-07-10", customerName: "Global Engineering Works", city: "Ahmedabad", state: "Gujarat", itemType: "Components", qty: 400, unitPrice: 450, totalSalesPrice: 180000 },
  { id: "SO-1004", soDate: "2026-07-15", customerName: "Sunrise Fabrication", city: "Delhi", state: "Delhi", itemType: "Raw Material", qty: 300, unitPrice: 900, totalSalesPrice: 270000 }
];

const INITIAL_PURCHASES = [
  { id: "PO-5001", date: "2026-06-20", supplierName: "Tata Steel Logistics", itemType: "Raw Material", qty: 500, unitPrice: 650, totalPurchasePrice: 325000, state: "Jharkhand" },
  { id: "PO-5002", date: "2026-06-25", supplierName: "Hindalco Aluminum Corp", itemType: "Raw Material", qty: 800, unitPrice: 350, totalPurchasePrice: 280000, state: "Uttar Pradesh" },
  { id: "PO-5003", date: "2026-07-02", supplierName: "Polycab Electricals", itemType: "Electrical", qty: 300, unitPrice: 900, totalPurchasePrice: 270000, state: "Gujarat" }
];

const INITIAL_RECEIPTS = [
  { id: "REC-901", date: "2026-07-03", customerName: "Apex Builders Pvt Ltd", amount: 25000, paymentMethod: "NEFT / Bank Transfer" },
  { id: "REC-902", date: "2026-07-08", customerName: "Vertex Tech Infra", amount: 98000, paymentMethod: "UPI" }
];

const INITIAL_PAYMENTS = [
  { id: "PAY-801", date: "2026-07-04", supplierName: "Tata Steel Logistics", amount: 145000, paymentMethod: "RTGS" },
  { id: "PAY-802", date: "2026-07-11", supplierName: "Hindalco Aluminum Corp", amount: 185000, paymentMethod: "Bank Transfer" }
];

class DBService {
  constructor() {
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (!localStorage.getItem('app_inventory')) {
      localStorage.setItem('app_inventory', JSON.stringify(INITIAL_INVENTORY));
    }
    if (!localStorage.getItem('app_customers')) {
      localStorage.setItem('app_customers', JSON.stringify(INITIAL_CUSTOMERS));
    }
    if (!localStorage.getItem('app_suppliers')) {
      localStorage.setItem('app_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
    }
    if (!localStorage.getItem('app_sales')) {
      localStorage.setItem('app_sales', JSON.stringify(INITIAL_SALES));
    }
    if (!localStorage.getItem('app_purchases')) {
      localStorage.setItem('app_purchases', JSON.stringify(INITIAL_PURCHASES));
    }
    if (!localStorage.getItem('app_receipts')) {
      localStorage.setItem('app_receipts', JSON.stringify(INITIAL_RECEIPTS));
    }
    if (!localStorage.getItem('app_payments')) {
      localStorage.setItem('app_payments', JSON.stringify(INITIAL_PAYMENTS));
    }
  }

  // Generic getter
  getData(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  // Generic setter
  saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
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
    return item;
  }
  deleteInventoryItem(id) {
    let list = this.getInventory();
    list = list.filter(item => item.id !== id);
    this.saveData('app_inventory', list);
  }

  // --- Customers ---
  getCustomers() { return this.getData('app_customers'); }
  addCustomer(cust) {
    const list = this.getCustomers();
    cust.id = cust.id || "CUST-" + Math.floor(100 + Math.random() * 900);
    cust.receivable = Number(cust.receivable || 0);
    list.unshift(cust);
    this.saveData('app_customers', list);
    return cust;
  }

  // --- Suppliers ---
  getSuppliers() { return this.getData('app_suppliers'); }
  addSupplier(sup) {
    const list = this.getSuppliers();
    sup.id = sup.id || "SUP-" + Math.floor(100 + Math.random() * 900);
    sup.payable = Number(sup.payable || 0);
    list.unshift(sup);
    this.saveData('app_suppliers', list);
    return sup;
  }

  // --- Sales ---
  getSales() { return this.getData('app_sales'); }
  addSale(sale) {
    const list = this.getSales();
    sale.id = sale.id || "SO-" + Math.floor(1000 + Math.random() * 9000);
    sale.totalSalesPrice = Number(sale.qty || 0) * Number(sale.unitPrice || 0);
    list.unshift(sale);
    this.saveData('app_sales', list);
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
    return purch;
  }

  // --- Receipts ---
  getReceipts() { return this.getData('app_receipts'); }
  addReceipt(rec) {
    const list = this.getReceipts();
    rec.id = rec.id || "REC-" + Math.floor(100 + Math.random() * 900);
    list.unshift(rec);
    this.saveData('app_receipts', list);
    return rec;
  }

  // --- Payments ---
  getPayments() { return this.getData('app_payments'); }
  addPayment(pay) {
    const list = this.getPayments();
    pay.id = pay.id || "PAY-" + Math.floor(100 + Math.random() * 900);
    list.unshift(pay);
    this.saveData('app_payments', list);
    return pay;
  }

  // --- Dashboard Metrics Calculation ---
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

    // Location & Top items
    const salesByCity = {};
    sales.forEach(r => {
      const city = r.city || 'Unknown';
      salesByCity[city] = (salesByCity[city] || 0) + Number(r.totalSalesPrice || 0);
    });
    const topLocation = Object.entries(salesByCity).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const salesByItem = {};
    sales.forEach(r => {
      const item = r.itemType || 'Unknown';
      salesByItem[item] = (salesByItem[item] || 0) + Number(r.totalSalesPrice || 0);
    });
    const topItem = Object.entries(salesByItem).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

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
