/**
 * Database Service Layer with Live Firebase Firestore Connection & Real-Time Sync
 */

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
    const keys = ['app_parties', 'app_products', 'app_drivers', 'app_sales', 'app_drafts', 'app_returns', 'app_price_history', 'app_company'];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(key === 'app_company' ? {} : []));
      }
    });
  }

  async loadAllDataFromFirestore() {
    if (!this.firestore) return;
    try {
      console.log("Fetching live dataset from Firebase Firestore...");
      const collections = ['parties', 'products', 'drivers', 'sales', 'drafts', 'returns', 'price_history', 'company'];
      const storageKeys = {
        'parties': 'app_parties',
        'products': 'app_products',
        'drivers': 'app_drivers',
        'sales': 'app_sales',
        'drafts': 'app_drafts',
        'returns': 'app_returns',
        'price_history': 'app_price_history',
        'company': 'app_company'
      };

      for (const col of collections) {
        const snapshot = await this.firestore.collection(col).get();
        if (!snapshot.empty) {
          if (col === 'company') {
            let companyObj = {};
            snapshot.forEach(doc => {
              companyObj = doc.data();
            });
            this.saveData(storageKeys[col], companyObj);
          } else {
            const items = [];
            snapshot.forEach(doc => {
              items.push(doc.data());
            });
            this.saveData(storageKeys[col], items);
          }
          console.log(`Firestore Sync: Loaded data for ${col}`);
        }
      }

      // Re-trigger active view if refreshAll is available
      if (typeof window.refreshAll === 'function') {
        window.refreshAll(true);
      }
    } catch (err) {
      console.error("Firestore retrieval error:", err);
    }
  }

  getData(key) {
    if (key === 'app_company') {
      return JSON.parse(localStorage.getItem(key) || '{}');
    }
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

  // --- Parties ---
  getParties() { return this.getData('app_parties'); }
  saveParty(party) {
    const list = this.getParties();
    if (party.id) {
      const idx = list.findIndex(p => p.id === party.id);
      if (idx !== -1) {
        list[idx] = party;
      }
    } else {
      party.id = "PTY" + String(list.length + 1).padStart(3, '0');
      party.createdAt = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      list.push(party);
    }
    this.saveData('app_parties', list);
    this.syncToFirestore('parties', party.id, party);
    return party;
  }
  deleteParty(id) {
    let list = this.getParties();
    list = list.filter(item => item.id !== id);
    this.saveData('app_parties', list);
    this.deleteFromFirestore('parties', id);
  }

  // --- Drivers ---
  getDrivers() { return this.getData('app_drivers'); }
  saveDriver(driver) {
    const list = this.getDrivers();
    if (driver.id) {
      const idx = list.findIndex(d => d.id === driver.id);
      if (idx !== -1) {
        list[idx] = driver;
      }
    } else {
      driver.id = "DRV" + String(list.length + 1).padStart(3, '0');
      driver.createdAt = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      list.push(driver);
    }
    this.saveData('app_drivers', list);
    this.syncToFirestore('drivers', driver.id, driver);
    return driver;
  }
  deleteDriver(id) {
    let list = this.getDrivers();
    list = list.filter(item => item.id !== id);
    this.saveData('app_drivers', list);
    this.deleteFromFirestore('drivers', id);
  }

  // --- Products Catalog ---
  getProducts() { return this.getData('app_products'); }
  saveProduct(prod) {
    const list = this.getProducts();
    if (prod.id) {
      const idx = list.findIndex(p => p.id === prod.id);
      if (idx !== -1) {
        // Track price changes
        const oldRate = parseFloat(list[idx].refillRate) || 0;
        const newRate = parseFloat(prod.refillRate) || 0;
        if (oldRate !== newRate) {
          const histId = "HST" + Math.floor(Math.random() * 100000);
          const historyItem = {
            id: histId,
            productId: prod.id,
            productName: prod.name,
            oldRate: oldRate,
            newRate: newRate,
            changedAt: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
          };
          this.savePriceHistory(historyItem);
        }
        list[idx] = prod;
      }
    } else {
      prod.id = "PRD" + String(list.length + 1).padStart(3, '0');
      list.push(prod);
    }
    this.saveData('app_products', list);
    this.syncToFirestore('products', prod.id, prod);
    return prod;
  }
  deleteProduct(id) {
    let list = this.getProducts();
    list = list.filter(item => item.id !== id);
    this.saveData('app_products', list);
    this.deleteFromFirestore('products', id);
  }

  // --- Price History ---
  getPriceHistory() { return this.getData('app_price_history'); }
  savePriceHistory(item) {
    const list = this.getPriceHistory();
    list.unshift(item);
    this.saveData('app_price_history', list);
    this.syncToFirestore('price_history', item.id, item);
  }

  // --- Sales ---
  getSales() { return this.getData('app_sales'); }
  saveSale(sale) {
    const list = this.getSales();
    const isUpdate = sale.receiptNo && list.some(s => s.receiptNo === sale.receiptNo);
    
    if (isUpdate) {
      // Remove old records of this receipt number
      const filtered = list.filter(s => s.receiptNo !== sale.receiptNo);
      // Map to separate rows for items to mimic Spreadsheet append
      sale.items.forEach(item => {
        const row = {
          receiptNo: sale.receiptNo,
          date: sale.date.split('-').reverse().join('-'), // YYYY-MM-DD to DD-MM-YYYY
          customerName: sale.customerName,
          mobile: sale.mobile,
          address: sale.address,
          productId: item.productId,
          productName: item.productName,
          cashQty: item.cashQty,
          onlineQty: item.onlineQty,
          totalQty: item.cashQty + item.onlineQty,
          refillRate: item.rate,
          discount: item.discount,
          itemTotal: (item.cashQty + item.onlineQty) * item.rate - item.discount,
          emptyReturned: item.emptyReturned,
          pendingEmpty: (item.cashQty + item.onlineQty) - item.emptyReturned,
          invoiceTotal: sale.invoiceTotal,
          cashPaid: sale.cashPaid,
          onlinePaid: sale.onlinePaid,
          totalPaid: sale.totalPaid,
          balanceDue: sale.balanceDue,
          denominations: sale.denominations,
          cashToReturn: sale.cashToReturn,
          notes: sale.notes,
          driver: sale.driver,
          consumerNos: sale.consumerNos
        };
        filtered.push(row);
      });
      this.saveData('app_sales', filtered);
      this.syncToFirestore('sales', sale.receiptNo, sale);
    } else {
      const receiptNo = sale.receiptNo || "INV" + String(list.length + 1001);
      sale.receiptNo = receiptNo;
      sale.items.forEach(item => {
        const row = {
          receiptNo: receiptNo,
          date: sale.date.split('-').reverse().join('-'),
          customerName: sale.customerName,
          mobile: sale.mobile,
          address: sale.address,
          productId: item.productId,
          productName: item.productName,
          cashQty: item.cashQty,
          onlineQty: item.onlineQty,
          totalQty: item.cashQty + item.onlineQty,
          refillRate: item.rate,
          discount: item.discount,
          itemTotal: (item.cashQty + item.onlineQty) * item.rate - item.discount,
          emptyReturned: item.emptyReturned,
          pendingEmpty: (item.cashQty + item.onlineQty) - item.emptyReturned,
          invoiceTotal: sale.invoiceTotal,
          cashPaid: sale.cashPaid,
          onlinePaid: sale.onlinePaid,
          totalPaid: sale.totalPaid,
          balanceDue: sale.balanceDue,
          denominations: sale.denominations,
          cashToReturn: sale.cashToReturn,
          notes: sale.notes,
          driver: sale.driver,
          consumerNos: sale.consumerNos
        };
        list.push(row);
      });
      this.saveData('app_sales', list);
      this.syncToFirestore('sales', receiptNo, sale);
    }
    return sale;
  }
  deleteSale(rn) {
    let list = this.getSales();
    list = list.filter(item => item.receiptNo !== rn);
    this.saveData('app_sales', list);
    this.deleteFromFirestore('sales', rn);
  }

  // --- Drafts ---
  getDrafts() { return this.getData('app_drafts'); }
  saveDraft(draft) {
    const list = this.getDrafts();
    const receiptNo = draft.receiptNo || "DFT" + String(list.length + 101);
    draft.receiptNo = receiptNo;

    // Filter out old draft rows
    const filtered = list.filter(d => d.receiptNo !== receiptNo);
    draft.items.forEach(item => {
      const row = {
        receiptNo: receiptNo,
        date: draft.date.split('-').reverse().join('-'),
        customerName: draft.customerName,
        mobile: draft.mobile,
        address: draft.address,
        productId: item.productId,
        productName: item.productName,
        cashQty: item.cashQty,
        onlineQty: item.onlineQty,
        totalQty: item.cashQty + item.onlineQty,
        refillRate: item.rate,
        discount: item.discount,
        itemTotal: (item.cashQty + item.onlineQty) * item.rate - item.discount,
        emptyReturned: item.emptyReturned,
        pendingEmpty: (item.cashQty + item.onlineQty) - item.emptyReturned,
        invoiceTotal: draft.invoiceTotal,
        cashPaid: draft.cashPaid,
        onlinePaid: draft.onlinePaid,
        totalPaid: draft.totalPaid,
        balanceDue: draft.balanceDue,
        denominations: draft.denominations,
        cashToReturn: draft.cashToReturn,
        notes: draft.notes,
        driver: draft.driver,
        consumerNos: draft.consumerNos
      };
      filtered.push(row);
    });

    this.saveData('app_drafts', filtered);
    this.syncToFirestore('drafts', receiptNo, draft);
    return draft;
  }
  deleteDraft(rn) {
    let list = this.getDrafts();
    list = list.filter(item => item.receiptNo !== rn);
    this.saveData('app_drafts', list);
    this.deleteFromFirestore('drafts', rn);
  }

  // --- Returns ---
  getReturns() { return this.getData('app_returns'); }
  saveReturn(ret) {
    const list = this.getReturns();
    const txnNo = ret.txnNo || "RTN" + String(list.length + 101);
    ret.txnNo = txnNo;

    const filtered = list.filter(r => r.txnNo !== txnNo);
    ret.items.forEach(item => {
      const row = {
        txnNo: txnNo,
        date: ret.date.split('-').reverse().join('-'),
        customerName: ret.customerName,
        mobile: ret.mobile,
        productId: item.productId,
        productName: item.productName,
        returnedQty: item.returnedQty,
        notes: ret.notes
      };
      filtered.push(row);
    });

    this.saveData('app_returns', filtered);
    this.syncToFirestore('returns', txnNo, ret);
    return ret;
  }
  deleteReturn(txnNo) {
    let list = this.getReturns();
    list = list.filter(item => item.txnNo !== txnNo);
    this.saveData('app_returns', list);
    this.deleteFromFirestore('returns', txnNo);
  }

  // --- Company Settings ---
  getCompanyProfile() { return this.getData('app_company'); }
  saveCompanyProfile(profile) {
    this.saveData('app_company', profile);
    this.syncToFirestore('company', 'profile', profile);
    return profile;
  }

  // --- Dynamic Cylinder Tracker ---
  getDynamicTracker(sales, returns) {
    const trackMap = {};
    sales.forEach(s => {
      const key = s.customerName + "||" + s.productName;
      if (!trackMap[key]) {
        trackMap[key] = {
          customerName: s.customerName,
          mobile: s.mobile || '',
          productName: s.productName,
          productId: s.productId,
          givenQty: 0,
          returnedQty: 0,
          pendingQty: 0,
          balanceDep: 0
        };
      }
      trackMap[key].givenQty += Number(s.totalQty || 0);
      trackMap[key].returnedQty += Number(s.emptyReturned || 0);
    });

    returns.forEach(r => {
      const key = r.customerName + "||" + r.productName;
      if (!trackMap[key]) {
        trackMap[key] = {
          customerName: r.customerName,
          mobile: r.mobile || '',
          productName: r.productName,
          productId: r.productId,
          givenQty: 0,
          returnedQty: 0,
          pendingQty: 0,
          balanceDep: 0
        };
      }
      trackMap[key].returnedQty += Number(r.returnedQty || 0);
    });

    const tracker = [];
    Object.keys(trackMap).forEach(k => {
      const t = trackMap[k];
      t.pendingQty = t.givenQty - t.returnedQty;
      if (t.givenQty > 0 || t.returnedQty > 0) {
        tracker.push(t);
      }
    });
    return tracker;
  }

  // --- Clear Database ---
  resetDatabase() {
    this.saveData('app_sales', []);
    this.saveData('app_drafts', []);
    this.saveData('app_returns', []);
    if (this.firestore) {
      // Clear Firestore sales/drafts/returns collections
      ['sales', 'drafts', 'returns'].forEach(async col => {
        const snap = await this.firestore.collection(col).get();
        snap.forEach(doc => doc.ref.delete());
      });
    }
  }
}

window.dbService = new DBService();
