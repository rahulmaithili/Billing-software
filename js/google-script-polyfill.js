/**
 * Google Apps Script (google.script.run) Compatibility Polyfill with RBAC Protection
 */

(function() {
  window.google = window.google || {};
  window.google.script = window.google.script || {};

  window.google.script.run = new Proxy({}, {
    get(target, prop) {
      let successHandler = null;
      let failureHandler = null;

      const handler = {
        withSuccessHandler(fn) {
          successHandler = fn;
          return handler;
        },
        withFailureHandler(fn) {
          failureHandler = fn;
          return handler;
        }
      };

      return function(...args) {
        Promise.resolve().then(async () => {
          try {
            const result = await handleBackendCall(prop, args);
            if (typeof successHandler === 'function') {
              successHandler(result);
            }
          } catch (err) {
            console.error(`Polyfill Error in ${prop}:`, err);
            if (typeof failureHandler === 'function') {
              failureHandler(err);
            }
          }
        });
        return handler;
      };
    }
  });

  async function handleBackendCall(funcName, args) {
    const db = window.dbService;
    console.log(`[GoogleScriptPolyfill] Calling ${funcName} with args:`, args);

    // Block delete operations for non-Admin users
    if (funcName.toLowerCase().includes('delete')) {
      if (!window.canPerformAction('delete')) {
        throw new Error("Access Denied: Only Administrators can delete records.");
      }
    }

    // Block update operations if user cannot edit
    if (funcName.toLowerCase().includes('update') || funcName.toLowerCase().includes('save') || funcName.toLowerCase().includes('addnew')) {
      if (!window.canPerformAction('edit')) {
        throw new Error("Access Denied: Your current role is not authorized to edit records.");
      }
    }

    switch (funcName) {
      // --- Dashboard ---
      case 'dashGetDashboardData':
        return db.getDashboardMetrics();

      // --- Customers ---
      case 'custGetCustomers':
        return db.getCustomers();
      case 'custGetStates':
        return ['Maharashtra', 'Karnataka', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'Jharkhand'];
      case 'custGetCities':
        return ['Mumbai', 'Bengaluru', 'Ahmedabad', 'Delhi', 'Renukoot', 'Jamshedpur'];
      case 'custAddNewState':
      case 'custAddNewCity':
        return "success";
      case 'custGenerateCustomerId':
        return "CUST-" + Math.floor(100 + Math.random() * 900);
      case 'custAddNewCustomer':
      case 'customerAddNewCustomer':
        return db.addCustomer(args[0]);
      case 'custUpdateCustomer':
      case 'customerUpdateCustomer':
        return db.addCustomer(args[0]);
      case 'custDeleteCustomer':
      case 'customerDeleteCustomer':
        db.deleteCustomer(args[0]);
        return "success";

      // --- Suppliers ---
      case 'supGetSuppliers':
        return db.getSuppliers();
      case 'supGetStates':
        return ['Maharashtra', 'Karnataka', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'Jharkhand'];
      case 'supGetCities':
        return ['Mumbai', 'Bengaluru', 'Ahmedabad', 'Delhi', 'Renukoot', 'Jamshedpur'];
      case 'supAddNewState':
      case 'supAddNewCity':
        return "success";
      case 'supGenerateSupplierId':
        return "SUP-" + Math.floor(100 + Math.random() * 900);
      case 'supAddNewSupplier':
      case 'supplierAddNewSupplier':
        return db.addSupplier(args[0]);
      case 'supUpdateSupplier':
      case 'supplierUpdateSupplier':
        return db.addSupplier(args[0]);
      case 'supDeleteSupplier':
      case 'supplierDeleteSupplier':
        db.deleteSupplier(args[0]);
        return "success";

      // --- Inventory ---
      case 'itemGetInventoryItems':
        return db.getInventory();
      case 'itemGetTypes':
        return ['Raw Material', 'Electrical', 'Components', 'Plastics', 'Hardware'];
      case 'itemGetCategories':
        return ['Metals', 'Wiring', 'Bearings', 'Polymer', 'Fasteners'];
      case 'itemGetSubcategories':
        return ['Steel', 'Aluminum', 'Copper', 'Sheets', 'Screws'];
      case 'itemAddNewType':
      case 'itemAddNewCategory':
      case 'itemAddNewSubcategory':
        return "success";
      case 'itemGenerateInventoryId':
        return "P" + Math.floor(10000 + Math.random() * 90000);
      case 'itemAddNewInventoryItem':
        return db.addInventoryItem(args[0]);
      case 'itemUpdateInventoryItem':
        return db.addInventoryItem(args[0]);
      case 'itemDeleteInventoryItem':
        db.deleteInventoryItem(args[0]);
        return "success";

      // --- Sales ---
      case 'soGetAllSO':
      case 'soGetSalesOrders':
      case 'salesGetOrders':
        return db.getSales();
      case 'soGetCustomers':
        return db.getCustomers();
      case 'soGetInventoryItems':
        return db.getInventory();
      case 'soGenerateSOID':
        return "SO-" + Math.floor(1000 + Math.random() * 9000);
      case 'soGenerateSalesDetailID':
        return "SOD-" + Math.floor(10000 + Math.random() * 90000);
      case 'soGetSODetails':
        return db.getSales().filter(s => s.id === args[0]);
      case 'soSaveNewSO':
        return db.addSale(args[0]);
      case 'soUpdateSODetails':
        return db.addSale(args[0]);
      case 'soDeleteDetail':
        return "success";

      // --- Purchases ---
      case 'poGetPOs':
      case 'poGetPurchaseOrders':
      case 'purchasesGetOrders':
        return db.getPurchases();
      case 'poGetSuppliers':
        return db.getSuppliers();
      case 'poGetInventoryItems':
        return db.getInventory();
      case 'poGetPMTStatuses':
        return ['Paid', 'Pending', 'Partial', 'Overdue'];
      case 'poGetShippingStatuses':
        return ['Shipped', 'Delivered', 'Pending', 'In Transit'];
      case 'poAddNewPMTStatus':
      case 'poAddNewShippingStatus':
        return "success";
      case 'poGeneratePOID':
        return "PO-" + Math.floor(1000 + Math.random() * 9000);
      case 'poGetPODetails':
        return db.getPurchases().filter(p => p.id === args[0]);
      case 'poSaveNewPO':
        return db.addPurchase(args[0]);
      case 'poSavePODetails':
        return db.addPurchase(args[0]);

      // --- Receipts ---
      case 'rcGetAllReceipts':
      case 'rcGetReceipts':
        return db.getReceipts();
      case 'rcGetCustomers':
        return db.getCustomers();
      case 'rcGetSalesOrders':
        return db.getSales();
      case 'rcGetDimensions':
        return [];
      case 'rcGenerateTrxID':
        return "REC-" + Math.floor(100 + Math.random() * 900);
      case 'rcSaveNewReceipt':
      case 'rcUpdateReceipt':
        return db.addReceipt(args[0]);
      case 'rcDeleteReceipt':
        return "success";

      // --- Payments ---
      case 'ptGetAllPayments':
      case 'ptGetPayments':
        return db.getPayments();
      case 'ptGetSuppliers':
        return db.getSuppliers();
      case 'ptGetPO':
        return db.getPurchases();
      case 'ptGetDimensions':
        return [];
      case 'ptGenerateTrxID':
        return "PAY-" + Math.floor(100 + Math.random() * 900);
      case 'ptSaveNewPayment':
      case 'ptUpdatePayment':
        return db.addPayment(args[0]);
      case 'ptDeletePayment':
        return "success";

      default:
        console.warn(`[GoogleScriptPolyfill] Function ${funcName} not explicitly handled, returning empty array.`);
        return [];
    }
  }
})();
