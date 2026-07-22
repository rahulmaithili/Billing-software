/**
 * Google Apps Script (google.script.run) Compatibility Polyfill for Shiv Shakti HP Gas Agency Portal
 */

(function() {
  window.google = window.google || {};
  window.google.script = window.google.script || {};

  class Runner {
    constructor(successHandler = null, failureHandler = null) {
      this._successHandler = successHandler;
      this._failureHandler = failureHandler;

      return new Proxy(this, {
        get(target, prop) {
          if (prop === 'withSuccessHandler') {
            return function(fn) {
              return new Runner(fn, target._failureHandler);
            };
          }
          if (prop === 'withFailureHandler') {
            return function(fn) {
              return new Runner(target._successHandler, fn);
            };
          }

          // Intercept backend function call
          return function(...args) {
            Promise.resolve().then(async () => {
              try {
                const result = await handleBackendCall(prop, args);
                if (typeof target._successHandler === 'function') {
                  target._successHandler(result);
                }
              } catch (err) {
                console.error(`Polyfill Error in ${prop}:`, err);
                if (typeof target._failureHandler === 'function') {
                  target._failureHandler(err);
                }
              }
            });
          };
        }
      });
    }
  }

  // Initialize the compatibility runner
  window.google.script.run = new Runner();

  async function handleBackendCall(funcName, args) {
    const db = window.dbService;
    console.log(`[GoogleScriptPolyfill] Calling ${funcName} with args:`, args);

    switch (funcName) {
      case 'apiGetAllData': {
        const company = db.getCompanyProfile();
        const products = db.getProducts();
        const drivers = db.getDrivers();
        const sales = db.getSales();
        const drafts = db.getDrafts();
        const returns = db.getReturns();
        const tracker = db.getDynamicTracker(sales, returns);
        const parties = db.getParties();
        const priceHistory = db.getPriceHistory();
        const users = db.getUsers();
        return {
          ok: true,
          company,
          products,
          drivers,
          sales,
          drafts,
          returns,
          tracker,
          parties,
          priceHistory,
          users
        };
      }

      case 'apiGetDashboardData': {
        const sales = db.getSales();
        const returns = db.getReturns();
        const tracker = db.getDynamicTracker(sales, returns);

        // Sum unique invoices to avoid double counting
        const uniqueInvs = {};
        sales.forEach(s => {
          uniqueInvs[s.receiptNo] = {
            invoiceTotal: s.invoiceTotal || 0,
            totalPaid: s.totalPaid || 0,
            balanceDue: s.balanceDue || 0
          };
        });

        let totalSales = 0;
        let totalPaid = 0;
        let totalDues = 0;
        Object.keys(uniqueInvs).forEach(k => {
          const inv = uniqueInvs[k];
          totalSales += inv.invoiceTotal;
          totalPaid += inv.totalPaid;
          totalDues += inv.balanceDue;
        });

        let pendingCyls = 0;
        tracker.forEach(t => {
          pendingCyls += Math.max(0, t.pendingQty);
        });

        const outstanding = tracker.filter(t => t.pendingQty > 0);
        const latestReturns = returns.slice(-10).reverse();

        const prodDues = {};
        tracker.forEach(t => {
          if (t.pendingQty > 0) {
            if (!prodDues[t.productName]) {
              prodDues[t.productName] = { pendingQty: 0, balanceDep: 0 };
            }
            prodDues[t.productName].pendingQty += t.pendingQty;
          }
        });

        return {
          ok: true,
          kpis: {
            totalSales,
            totalSecurity: totalPaid,
            pendingCyls,
            totalDues
          },
          outstanding,
          latestReturns,
          prodDues
        };
      }

      case 'apiGetParties':
        return { ok: true, parties: db.getParties() };

      case 'apiSaveParty': {
        const p = db.saveParty(args[0]);
        return { ok: true, id: p.id };
      }

      case 'apiDeleteParty':
        db.deleteParty(args[0]);
        return { ok: true };

      case 'apiGetDrivers':
        return { ok: true, drivers: db.getDrivers() };

      case 'apiSaveDriver': {
        const d = db.saveDriver(args[0]);
        return { ok: true, id: d.id };
      }

      case 'apiDeleteDriver':
        db.deleteDriver(args[0]);
        return { ok: true };

      case 'apiGetProducts':
        return { ok: true, products: db.getProducts() };

      case 'apiSaveProduct': {
        const p = db.saveProduct(args[0]);
        return { ok: true, id: p.id };
      }

      case 'apiDeleteProduct':
        db.deleteProduct(args[0]);
        return { ok: true };

      case 'apiGetPriceHistory':
        return { ok: true, history: db.getPriceHistory() };

      case 'apiGetSales':
        return { ok: true, sales: db.getSales() };

      case 'apiSaveSale': {
        const s = db.saveSale(args[0]);
        return { ok: true, receiptNo: s.receiptNo };
      }

      case 'apiDeleteSale':
        db.deleteSale(args[0]);
        return { ok: true };

      case 'apiGetDrafts':
        return { ok: true, drafts: db.getDrafts() };

      case 'apiSaveDraft': {
        const d = db.saveDraft(args[0]);
        return { ok: true, receiptNo: d.receiptNo };
      }

      case 'apiDeleteDraft':
        db.deleteDraft(args[0]);
        return { ok: true };

      case 'apiFinalizeDraft': {
        const s = db.saveSale(args[0]);
        db.deleteDraft(args[0].receiptNo);
        return { ok: true, receiptNo: s.receiptNo };
      }

      case 'apiGetReturns':
        return { ok: true, returns: db.getReturns() };

      case 'apiSaveReturn': {
        const r = db.saveReturn(args[0]);
        return { ok: true, txnNo: r.txnNo };
      }

      case 'apiUpdateReturn': {
        const r = db.saveReturn(args[0]);
        return { ok: true, txnNo: r.txnNo };
      }

      case 'apiDeleteReturn':
        db.deleteReturn(args[0]);
        return { ok: true };

      case 'apiGetCompanyProfile':
        return { ok: true, data: db.getCompanyProfile() };

      case 'apiSaveCompanyProfile':
        db.saveCompanyProfile(args[0]);
        return { ok: true };

      case 'apiResetDatabase':
        db.resetDatabase();
        return { ok: true };

      case 'apiSendEmail':
        // Mock success for email send
        return { ok: true };

      case 'apiGetReportData': {
        const params = args[0];
        const start = params.start ? new Date(params.start) : null;
        const end = params.end ? new Date(params.end) : null;
        const productName = params.productName || 'ALL';
        const partyName = params.partyName || 'ALL';
        const driverName = params.driverName || 'ALL';

        function inRange(dStr) {
          if (!dStr) return false;
          const parts = dStr.split('-');
          const dt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          dt.setHours(0, 0, 0, 0);

          if (start) {
            const s = new Date(start);
            s.setHours(0, 0, 0, 0);
            if (dt < s) return false;
          }
          if (end) {
            const e = new Date(end);
            e.setHours(23, 59, 59, 999);
            if (dt > e) return false;
          }
          return true;
        }

        const sales = db.getSales();
        const returns = db.getReturns();

        const salesRows = sales.filter(s => {
          const dMatch = inRange(s.date);
          const prodMatch = (productName === 'ALL' || s.productName === productName);
          const partyMatch = (partyName === 'ALL' || s.customerName === partyName);
          const driverMatch = (driverName === 'ALL' || s.driver === driverName);
          let consMatch = true;
          if (params.consumerNo) {
            const query = params.consumerNo.trim().toLowerCase();
            consMatch = (s.consumerNos || '').toLowerCase().includes(query);
          }
          return dMatch && prodMatch && partyMatch && driverMatch && consMatch;
        });

        const returnRows = returns.filter(r => {
          if (driverName !== 'ALL') return false;
          const dMatch = inRange(r.date);
          const prodMatch = (productName === 'ALL' || r.productName === productName);
          const partyMatch = (partyName === 'ALL' || r.customerName === partyName);
          return dMatch && prodMatch && partyMatch;
        });

        const salesByProd = {};
        salesRows.forEach(s => {
          const pn = s.productName || 'Unknown';
          if (!salesByProd[pn]) {
            salesByProd[pn] = { refillQty: 0, cashQty: 0, onlineQty: 0, refillRevenue: 0, totalRevenue: 0 };
          }
          salesByProd[pn].refillQty += (s.totalQty || 0);
          salesByProd[pn].cashQty += (s.cashQty || 0);
          salesByProd[pn].onlineQty += (s.onlineQty || 0);
          salesByProd[pn].refillRevenue += (s.itemTotal || 0);
          salesByProd[pn].totalRevenue += (s.itemTotal || 0);
        });

        const retByProd = {};
        returnRows.forEach(r => {
          const pn = r.productName || 'Unknown';
          if (!retByProd[pn]) {
            retByProd[pn] = { returnedQty: 0, totalRefund: 0 };
          }
          retByProd[pn].returnedQty += (r.returnedQty || 0);
        });

        const uniqueInvs = {};
        salesRows.forEach(s => {
          uniqueInvs[s.receiptNo] = {
            invoiceTotal: s.invoiceTotal || 0,
            cashPaid: s.cashPaid || 0,
            onlinePaid: s.onlinePaid || 0,
            totalPaid: s.totalPaid || 0,
            balanceDue: s.balanceDue || 0
          };
        });

        let totSales = 0, totCashPaid = 0, totOnlinePaid = 0, totPaid = 0, totDues = 0;
        Object.keys(uniqueInvs).forEach(k => {
          const inv = uniqueInvs[k];
          totSales += inv.invoiceTotal;
          totCashPaid += inv.cashPaid;
          totOnlinePaid += inv.onlinePaid;
          totPaid += inv.totalPaid;
          totDues += inv.balanceDue;
        });

        return {
          ok: true,
          summary: {
            totSales,
            totCashPaid,
            totOnlinePaid,
            totPaid,
            totDues,
            salesCount: Object.keys(uniqueInvs).length,
            returnCount: returnRows.length
          },
          salesByProd,
          retByProd,
          products: Object.keys(salesByProd).concat(Object.keys(retByProd)).filter((v, i, a) => a.indexOf(v) === i),
          filteredSales: salesRows
        };
      }

      case 'apiSaveUser': {
        const u = args[0];
        db.saveUser(u);
        return { ok: true };
      }

      case 'apiDeleteUser': {
        const username = args[0];
        db.deleteUser(username);
        return { ok: true };
      }

      case 'apiBackupToGoogleDrive': {
        const allData = {
          company: db.getCompanyProfile(),
          products: db.getProducts(),
          drivers: db.getDrivers(),
          sales: db.getSales(),
          drafts: db.getDrafts(),
          returns: db.getReturns(),
          parties: db.getParties(),
          priceHistory: db.getPriceHistory(),
          users: db.getUsers(),
          backupTimestamp: new Date().toISOString()
        };
        try {
          const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const formattedDate = new Date().toISOString().slice(0, 10);
          a.download = `ShivShaktiHPGas_Backup_${formattedDate}_${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return { ok: true };
        } catch (err) {
          console.error("Backup file download failed:", err);
          return { ok: false, error: err.message };
        }
      }

      default:
        console.warn(`[GoogleScriptPolyfill] Function ${funcName} not explicitly handled.`);
        return { ok: false, error: `Function ${funcName} not supported` };
    }
  }
})();
