/**
 * SHIV SHAKTI HP GAS AGENCY — Enterprise Portal Backend
 * Google Apps Script server-side API
 * All functions called via google.script.run from the HTML frontend
 */

// ── Spreadsheet reference ────────────────────────────────────────────────────
function SS() { return SpreadsheetApp.getActiveSpreadsheet(); }

// Sheet name constants
var SH_SALES    = 'GAS_SALES';
var SH_DRAFTS   = 'GAS_DRAFTS';
var SH_RETURNS  = 'GAS_RETURNS';
var SH_PRODUCTS = 'GAS_PRODUCTS';
var SH_COMPANY  = 'GAS_COMPANY';
var SH_PARTIES  = 'GAS_PARTIES';
var SH_DRIVERS  = 'GAS_DRIVERS';
var SH_PRICE_HISTORY = 'GAS_PRICE_HISTORY';
var SH_USERS = 'GAS_USERS';

// ── doGet: serve the HTML page ────────────────────────────────────────────────
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Shiv Shakti HP Gas Agency — Enterprise Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── Sheet bootstrap ──────────────────────────────────────────────────────────
function _getOrCreate(name, headers) {
  var ss = SS();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setBackground('#1e293b').setFontColor('#ffffff')
      .setFontWeight('bold').setFontFamily('Arial').setFontSize(10);
    sh.setFrozenRows(1);
  }
  return sh;
}

function _ensureSheets() {
  _getOrCreate(SH_PARTIES,  ['PartyID','Name','Mobile','Address','Email','CreatedAt']);
  _getOrCreate(SH_PRODUCTS, ['ProductID','Name','Rate','CreatedAt']);
  _getOrCreate(SH_DRIVERS,  ['DriverID','Name','Mobile','VehicleNo','CreatedAt']);
  _getOrCreate(SH_SALES,    ['ReceiptNo','Date','CustomerName','Mobile','Address','ProductID','ProductName',
                              'CashQty','OnlineQty','TotalQty','Rate','Discount','ItemTotal','EmptyReturned','PendingEmpty',
                              'InvoiceTotal','CashPaid','OnlinePaid','TotalPaid','BalanceDue','Denominations','CashToReturn','Notes','Driver','ConsumerNos']);
  _getOrCreate(SH_DRAFTS,   ['ReceiptNo','Date','CustomerName','Mobile','Address','ProductID','ProductName',
                              'CashQty','OnlineQty','TotalQty','Rate','Discount','ItemTotal','EmptyReturned','PendingEmpty',
                              'InvoiceTotal','CashPaid','OnlinePaid','TotalPaid','BalanceDue','Denominations','CashToReturn','Notes','Driver','ConsumerNos']);
  _getOrCreate(SH_RETURNS,  ['TxnNo','Date','CustomerName','Mobile','ProductID','ProductName','ReturnedQty','Notes']);
  _getOrCreate(SH_COMPANY,  ['Key','Value']);
  _getOrCreate(SH_PRICE_HISTORY, ['HistoryID', 'ProductID', 'ProductName', 'OldRate', 'NewRate', 'ChangedAt']);
  var userSh = _getOrCreate(SH_USERS, ['Username','Password','Role','CreatedAt']);
  if (_rows(userSh).filter(function(r){ return r[0]; }).length === 0) {
    userSh.appendRow(['admin', 'adminpassword', 'Administrator', new Date().toISOString()]);
  }
  
  // Append ConsumerNos to existing sheets if missing
  var salesSh = SS().getSheetByName(SH_SALES);
  if (salesSh && salesSh.getLastColumn() < 25) {
    salesSh.getRange(1, 25).setValue('ConsumerNos')
      .setBackground('#1e293b').setFontColor('#ffffff')
      .setFontWeight('bold').setFontFamily('Arial').setFontSize(10);
  }
  var draftsSh = SS().getSheetByName(SH_DRAFTS);
  if (draftsSh && draftsSh.getLastColumn() < 25) {
    draftsSh.getRange(1, 25).setValue('ConsumerNos')
      .setBackground('#1e293b').setFontColor('#ffffff')
      .setFontWeight('bold').setFontFamily('Arial').setFontSize(10);
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────
function _rows(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

function _nextId(sh, prefix) {
  var lr = sh.getLastRow();
  if (lr < 2) return prefix + '001';
  var vals = sh.getRange(2, 1, lr - 1, 1).getValues().flat().filter(Boolean);
  var nums = vals.map(function(v){ return parseInt(String(v).replace(prefix,''))||0; });
  return prefix + String(Math.max.apply(null, nums.length ? nums : [0]) + 1).padStart(3, '0');
}

function _dateFmt(d) {
  if (!d) return '';
  try {
    return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'dd-MM-yyyy');
  } catch(e) { return String(d); }
}

// ════════════════════════════════════════════════════════════════
//  PARTIES DIRECTORY
// ════════════════════════════════════════════════════════════════

function apiGetParties() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_PARTIES);
    var rows = _rows(sh);
    var parties = rows.filter(function(r){ return r[0]; }).map(function(r){
      return { id: r[0], name: r[1]||'', mobile: r[2]||'', address: r[3]||'', email: r[4]||'', createdAt: _dateFmt(r[5]) };
    });
    return { ok: true, parties: parties };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveParty(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_PARTIES);
    if (data.id) {
      var rows = _rows(sh);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sh.getRange(i + 2, 1, 1, 6).setValues([[data.id, data.name, data.mobile||'', data.address||'', data.email||'', rows[i][5]]]);
          return { ok: true };
        }
      }
      return { ok: false, error: 'Party not found' };
    } else {
      var newId = _nextId(sh, 'PTY');
      sh.appendRow([newId, data.name, data.mobile||'', data.address||'', data.email||'', new Date()]);
      return { ok: true, id: newId };
    }
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiDeleteParty(id) {
  try {
    var sh = SS().getSheetByName(SH_PARTIES);
    var rows = _rows(sh);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) { sh.deleteRow(i + 2); return { ok: true }; }
    }
    return { ok: false, error: 'Not found' };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  DRIVERS DIRECTORY
// ════════════════════════════════════════════════════════════════

function apiGetDrivers() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_DRIVERS);
    var rows = _rows(sh);
    var drivers = rows.filter(function(r){ return r[0]; }).map(function(r){
      return { id: r[0], name: r[1]||'', mobile: r[2]||'', vehicleNo: r[3]||'', createdAt: _dateFmt(r[4]) };
    });
    return { ok: true, drivers: drivers };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveDriver(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_DRIVERS);
    if (data.id) {
      var rows = _rows(sh);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sh.getRange(i + 2, 1, 1, 5).setValues([[data.id, data.name, data.mobile||'', data.vehicleNo||'', rows[i][4]]]);
          return { ok: true };
        }
      }
      return { ok: false, error: 'Driver not found' };
    } else {
      var newId = _nextId(sh, 'DRV');
      sh.appendRow([newId, data.name, data.mobile||'', data.vehicleNo||'', new Date()]);
      return { ok: true, id: newId };
    }
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiDeleteDriver(id) {
  try {
    var sh = SS().getSheetByName(SH_DRIVERS);
    var rows = _rows(sh);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) { sh.deleteRow(i + 2); return { ok: true }; }
    }
    return { ok: false, error: 'Not found' };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  COMPANY PROFILE
// ════════════════════════════════════════════════════════════════

function apiGetCompanyProfile() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_COMPANY);
    
    // Check if the sheet has the premium layout, else initialize it
    var lastRow = sh.getLastRow();
    var a1Val = sh.getRange('A1').getValue();
    if (String(a1Val).indexOf('COMPANY PROFILE CONFIGURATION') === -1 || lastRow < 14) {
      _initializeCompanySheet(sh);
    }
    
    var vals = sh.getRange(4, 1, 11, 4).getValues();
    var obj = {};
    vals.forEach(function(r) {
      var key = r[2]; // Column C
      var val = r[1]; // Column B
      if (key) obj[key] = val || '';
    });
    
    // defaults
    if (!obj.name)    obj.name    = 'Shiv Shakti HP Gas Agency';
    if (!obj.prefix)  obj.prefix  = 'SS';
    if (!obj.terms)   obj.terms   = 'Payment due within 7 days. Cylinder to be returned within 30 days.';
    return { ok: true, data: obj };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveCompanyProfile(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_COMPANY);
    
    var lastRow = sh.getLastRow();
    var a1Val = sh.getRange('A1').getValue();
    if (String(a1Val).indexOf('COMPANY PROFILE CONFIGURATION') === -1 || lastRow < 14) {
      _initializeCompanySheet(sh);
    }
    
    // Search the keys in Column C (rows 4 to 14) and update Column B
    var keys = sh.getRange(4, 3, 11, 1).getValues().flat();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (data[k] !== undefined) {
        sh.getRange(4 + i, 2).setValue(data[k] || '');
      }
    }
    
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════════

function apiGetProducts() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_PRODUCTS);
    var rows = _rows(sh);
    var products = rows.filter(function(r){ return r[0]; }).map(function(r){
      return { id: r[0], name: r[1]||'', refillRate: r[2]||0, depositRate: 0, createdAt: _dateFmt(r[3]) };
    });
    return { ok: true, products: products };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveProduct(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_PRODUCTS);
    if (data.id) {
      var rows = _rows(sh);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          var oldRate = parseFloat(rows[i][2]) || 0;
          var newRate = parseFloat(data.refillRate) || 0;
          if (oldRate !== newRate) {
            var shHist = SS().getSheetByName(SH_PRICE_HISTORY);
            var newHistId = _nextId(shHist, 'HST');
            shHist.appendRow([newHistId, data.id, data.name, oldRate, newRate, new Date()]);
          }
          sh.getRange(i + 2, 1, 1, 4).setValues([[data.id, data.name, newRate, rows[i][3]]]);
          return { ok: true };
        }
      }
      return { ok: false, error: 'Product not found' };
    } else {
      var newId = _nextId(sh, 'PRD');
      sh.appendRow([newId, data.name, data.refillRate||0, new Date()]);
      return { ok: true, id: newId };
    }
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiDeleteProduct(id) {
  try {
    var sh = SS().getSheetByName(SH_PRODUCTS);
    var rows = _rows(sh);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === id) { sh.deleteRow(i + 2); return { ok: true }; }
    }
    return { ok: false, error: 'Not found' };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiGetPriceHistory() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_PRICE_HISTORY);
    var rows = _rows(sh);
    var history = rows.filter(function(r){ return r[0]; }).map(function(r){
      return {
        id: r[0],
        productId: r[1],
        productName: r[2],
        oldRate: parseFloat(r[3]) || 0,
        newRate: parseFloat(r[4]) || 0,
        changedAt: _dateFmt(r[5])
      };
    });
    history.reverse();
    return { ok: true, history: history };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  SALES (Finalized)
// ════════════════════════════════════════════════════════════════

function apiGetSales() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_SALES);
    var rows = _rows(sh);
    var sales = rows.filter(function(r){ return r[0]; }).map(function(r){
      return {
        receiptNo:     r[0],  date:          _dateFmt(r[1]),
        customerName:  r[2],  mobile:        r[3]||'',  address:       r[4]||'',
        productId:     r[5],  productName:   r[6],
        cashQty:       r[7]||0, onlineQty:   r[8]||0,  totalQty:      r[9]||0,
        refillRate:    r[10]||0, discount:   r[11]||0, itemTotal:     r[12]||0,
        emptyReturned: r[13]||0, pendingEmpty:r[14]||0,
        invoiceTotal:  r[15]||0, cashPaid:      r[16]||0,
        onlinePaid:    r[17]||0, totalPaid:     r[18]||0,
        balanceDue:    r[19]||0, paymentStatus: (r[19]||0) <= 0.05 ? 'Paid' : 'Pending',
        denominations: r[20]||'', cashToReturn:r[21]||0, notes: r[22]||'',
        driver:        r[23]||'', consumerNos:  r[24]||''
      };
    });
    return { ok: true, sales: sales };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveSale(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_SALES);
    var dateVal = data.date ? new Date(data.date) : new Date();
    var rcptNo = data.receiptNo;
    
    // Check if it was a draft (starts with DFT). If so, we generate a final receipt ID
    if (rcptNo && rcptNo.indexOf('DFT') === 0) {
      rcptNo = null; // Re-generate clean final receipt number
    }
    
    if (rcptNo) {
      // If updating, delete existing items first
      var tempRows = _rows(sh);
      for (var i = tempRows.length - 1; i >= 0; i--) {
        if (tempRows[i][0] === rcptNo) {
          sh.deleteRow(i + 2);
        }
      }
    } else {
      var cp = apiGetCompanyProfile();
      var prefix = (cp.ok && cp.data.prefix) ? cp.data.prefix : 'SS';
      rcptNo = _nextId(sh, prefix);
    }
    
    var rowsToAppend = [];
    var invoiceTotal = parseFloat(data.invoiceTotal) || 0;
    var cashPaid     = parseFloat(data.cashPaid)     || 0;
    var onlinePaid   = parseFloat(data.onlinePaid)   || 0;
    var totalPaid    = cashPaid + onlinePaid;
    var balanceDue   = invoiceTotal - totalPaid;
    
    data.items.forEach(function(item) {
      var cQty  = parseFloat(item.cashQty) || 0;
      var oQty  = parseFloat(item.onlineQty) || 0;
      var tQty  = cQty + oQty;
      var rate  = parseFloat(item.rate) || 0;
      var disc  = parseFloat(item.discount) || 0;
      var total = (tQty * rate) - disc;
      var ret   = parseFloat(item.emptyReturned) || 0;
      var pend  = tQty - ret;
      
      rowsToAppend.push([
        rcptNo, dateVal, data.customerName, data.mobile || '', data.address || '',
        item.productId, item.productName, cQty, oQty, tQty,
        rate, disc, total, ret, pend,
        invoiceTotal, cashPaid, onlinePaid, totalPaid, balanceDue,
        data.denominations || '', parseFloat(data.cashToReturn) || 0, data.notes || '',
        data.driver || '', data.consumerNos || ''
      ]);
    });
    
    if (rowsToAppend.length > 0) {
      var nextRow = sh.getLastRow() + 1;
      sh.getRange(nextRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      sh.getRange(nextRow, 2, rowsToAppend.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    
    return { ok: true, receiptNo: rcptNo };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiDeleteSale(receiptNo) {
  try {
    var sh = SS().getSheetByName(SH_SALES);
    var rows = _rows(sh);
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] === receiptNo) { sh.deleteRow(i + 2); }
    }
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  DRAFT SALES (Unfinalized)
// ════════════════════════════════════════════════════════════════

function apiGetDrafts() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_DRAFTS);
    var rows = _rows(sh);
    var drafts = rows.filter(function(r){ return r[0]; }).map(function(r){
      return {
        receiptNo:     r[0],  date:          _dateFmt(r[1]),
        customerName:  r[2],  mobile:        r[3]||'',  address:       r[4]||'',
        productId:     r[5],  productName:   r[6],
        cashQty:       r[7]||0, onlineQty:   r[8]||0,  totalQty:      r[9]||0,
        refillRate:    r[10]||0, discount:   r[11]||0, itemTotal:     r[12]||0,
        emptyReturned: r[13]||0, pendingEmpty:r[14]||0,
        invoiceTotal:  r[15]||0, cashPaid:      r[16]||0,
        onlinePaid:    r[17]||0, totalPaid:     r[18]||0,
        balanceDue:    r[19]||0, denominations: r[20]||'', cashToReturn:r[21]||0, notes: r[22]||'',
        driver:        r[23]||'', consumerNos:  r[24]||''
      };
    });
    return { ok: true, drafts: drafts };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveDraft(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_DRAFTS);
    var dateVal = data.date ? new Date(data.date) : new Date();
    var rcptNo = data.receiptNo;
    
    if (rcptNo) {
      var tempRows = _rows(sh);
      for (var i = tempRows.length - 1; i >= 0; i--) {
        if (tempRows[i][0] === rcptNo) {
          sh.deleteRow(i + 2);
        }
      }
    } else {
      rcptNo = _nextId(sh, 'DFT');
    }
    
    var rowsToAppend = [];
    var invoiceTotal = parseFloat(data.invoiceTotal) || 0;
    var cashPaid     = parseFloat(data.cashPaid)     || 0;
    var onlinePaid   = parseFloat(data.onlinePaid)   || 0;
    var totalPaid    = cashPaid + onlinePaid;
    var balanceDue   = invoiceTotal - totalPaid;
    
    data.items.forEach(function(item) {
      var cQty  = parseFloat(item.cashQty) || 0;
      var oQty  = parseFloat(item.onlineQty) || 0;
      var tQty  = cQty + oQty;
      var rate  = parseFloat(item.rate) || 0;
      var disc  = parseFloat(item.discount) || 0;
      var total = (tQty * rate) - disc;
      var ret   = parseFloat(item.emptyReturned) || 0;
      var pend  = tQty - ret;
      
      rowsToAppend.push([
        rcptNo, dateVal, data.customerName, data.mobile || '', data.address || '',
        item.productId, item.productName, cQty, oQty, tQty,
        rate, disc, total, ret, pend,
        invoiceTotal, cashPaid, onlinePaid, totalPaid, balanceDue,
        data.denominations || '', parseFloat(data.cashToReturn) || 0, data.notes || '',
        data.driver || '', data.consumerNos || ''
      ]);
    });
    
    if (rowsToAppend.length > 0) {
      var nextRow = sh.getLastRow() + 1;
      sh.getRange(nextRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      sh.getRange(nextRow, 2, rowsToAppend.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    
    return { ok: true, receiptNo: rcptNo };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiFinalizeDraft(data) {
  try {
    _ensureSheets();
    
    // Save draft details to GAS_SALES
    var finalResult = apiSaveSale(data);
    if (!finalResult.ok) return finalResult;
    
    // Delete draft from GAS_DRAFTS
    if (data.receiptNo && data.receiptNo.indexOf('DFT') === 0) {
      apiDeleteDraft(data.receiptNo);
    }
    
    return { ok: true, receiptNo: finalResult.receiptNo };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiDeleteDraft(receiptNo) {
  try {
    var sh = SS().getSheetByName(SH_DRAFTS);
    var rows = _rows(sh);
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] === receiptNo) { sh.deleteRow(i + 2); }
    }
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  CYLINDER RETURNS (Standalone returns)
// ════════════════════════════════════════════════════════════════

function apiGetReturns() {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_RETURNS);
    var rows = _rows(sh);
    var returns = rows.filter(function(r){ return r[0]; }).map(function(r){
      return {
        txnNo:         r[0],  date:          _dateFmt(r[1]),
        customerName:  r[2],  mobile:        r[3]||'',
        productId:     r[4],  productName:   r[5],
        returnedQty:   r[6]||0, notes:       r[7]||''
      };
    });
    return { ok: true, returns: returns };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiSaveReturn(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_RETURNS);
    var txnNo = _nextId(sh, 'RTN');
    var dateVal = data.date ? new Date(data.date) : new Date();
    
    var rows = [];
    data.items.forEach(function(item) {
      var qty = parseInt(item.returnedQty) || 0;
      if (qty > 0) {
        rows.push([
          txnNo, dateVal, data.customerName, data.mobile || '',
          item.productId, item.productName, qty, data.notes || ''
        ]);
      }
    });
    
    if (rows.length > 0) {
      var nextRow = sh.getLastRow() + 1;
      sh.getRange(nextRow, 1, rows.length, rows[0].length).setValues(rows);
      sh.getRange(nextRow, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    
    return { ok: true, txnNo: txnNo };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiUpdateReturn(data) {
  try {
    _ensureSheets();
    var sh = SS().getSheetByName(SH_RETURNS);
    var txnNo = data.txnNo;
    if (!txnNo) return { ok: false, error: 'Transaction ID is required for updating.' };
    
    var rows = _rows(sh);
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] === txnNo) { sh.deleteRow(i + 2); }
    }
    
    var dateVal = data.date ? new Date(data.date) : new Date();
    var newRows = [];
    data.items.forEach(function(item) {
      var qty = parseInt(item.returnedQty) || 0;
      if (qty > 0) {
        newRows.push([
          txnNo, dateVal, data.customerName, data.mobile || '',
          item.productId, item.productName, qty, data.notes || ''
        ]);
      }
    });
    
    if (newRows.length > 0) {
      var nextRow = sh.getLastRow() + 1;
      sh.getRange(nextRow, 1, newRows.length, newRows[0].length).setValues(newRows);
      sh.getRange(nextRow, 2, newRows.length, 1).setNumberFormat('yyyy-mm-dd');
    }
    
    return { ok: true, txnNo: txnNo };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  DYNAMIC CYLINDER TRACKER (running calculator)
// ════════════════════════════════════════════════════════════════

function _getDynamicTracker(sales, returns) {
  var trackMap = {}; // key: customerName + "||" + productName
  
  sales.forEach(function(s) {
    var key = s.customerName + "||" + s.productName;
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
    trackMap[key].givenQty += (s.totalQty || 0);
    trackMap[key].returnedQty += (s.emptyReturned || 0);
  });
  
  returns.forEach(function(r) {
    var key = r.customerName + "||" + r.productName;
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
    trackMap[key].returnedQty += (r.returnedQty || 0);
  });
  
  var tracker = [];
  Object.keys(trackMap).forEach(function(k) {
    var t = trackMap[k];
    t.pendingQty = t.givenQty - t.returnedQty;
    if (t.givenQty > 0 || t.returnedQty > 0) {
      tracker.push(t);
    }
  });
  
  return tracker;
}

function apiDeleteReturn(txnNo) {
  try {
    var sh = SS().getSheetByName(SH_RETURNS);
    var rows = _rows(sh);
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] === txnNo) { sh.deleteRow(i + 2); }
    }
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD AGGREGATES
// ════════════════════════════════════════════════════════════════

function apiGetDashboardData() {
  try {
    _ensureSheets();
    var allData = apiGetAllData();
    if (!allData.ok) return allData;
    
    var sales = allData.sales;
    var returns = allData.returns;
    var tracker = allData.tracker;
    
    // Sum unique invoices to avoid double counting multi-item transactions
    var uniqueInvs = {};
    sales.forEach(function(s) {
      uniqueInvs[s.receiptNo] = {
        invoiceTotal: s.invoiceTotal || 0,
        totalPaid: s.totalPaid || 0,
        balanceDue: s.balanceDue || 0
      };
    });
    
    var totalSales = 0;
    var totalPaid = 0;
    var totalDues = 0;
    Object.keys(uniqueInvs).forEach(function(k) {
      var inv = uniqueInvs[k];
      totalSales += inv.invoiceTotal;
      totalPaid += inv.totalPaid;
      totalDues += inv.balanceDue;
    });
    
    var pendingCyls = 0;
    tracker.forEach(function(t) {
      pendingCyls += Math.max(0, t.pendingQty);
    });
    
    var outstanding = tracker.filter(function(t) { return t.pendingQty > 0; });
    var latestReturns = returns.slice(-10).reverse();
    
    var prodDues = {};
    tracker.forEach(function(t) {
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
        totalSales:    totalSales,
        totalSecurity: totalPaid,
        pendingCyls:   pendingCyls,
        totalDues:     totalDues
      },
      outstanding:   outstanding,
      latestReturns: latestReturns,
      prodDues:      prodDues
    };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  REPORTS (Supports Dates, Products, Vendors & Drivers Filters)
// ════════════════════════════════════════════════════════════════

function apiGetReportData(params) {
  try {
    _ensureSheets();
    var start       = params.start ? new Date(params.start) : null;
    var end         = params.end ? new Date(params.end) : null;
    var productName = params.productName || 'ALL';
    var partyName   = params.partyName || 'ALL';
    var driverName  = params.driverName || 'ALL';
    
    function inRange(d) {
      if (!d) return false;
      var dt = new Date(d); dt.setHours(0,0,0,0);
      if (start) { var s=new Date(start); s.setHours(0,0,0,0); if(dt<s) return false; }
      if (end)   { var e=new Date(end);   e.setHours(23,59,59,999); if(dt>e) return false; }
      return true;
    }
    
    var allData = apiGetAllData();
    
    // Filter sales based on parameters
    var salesRows = allData.sales.filter(function(s) {
      var p = s.date.split('-');
      var d = new Date(p[2], p[1]-1, p[0]);
      var dMatch = inRange(d);
      var prodMatch = (productName === 'ALL' || s.productName === productName);
      var partyMatch = (partyName === 'ALL' || s.customerName === partyName);
      var driverMatch = (driverName === 'ALL' || s.driver === driverName);
      
      var consMatch = true;
      if (params.consumerNo) {
        var query = params.consumerNo.trim().toLowerCase();
        var searchIn = (s.consumerNos || '').toLowerCase();
        consMatch = searchIn.indexOf(query) !== -1;
      }
      return dMatch && prodMatch && partyMatch && driverMatch && consMatch;
    });
    
    // Filter returns based on parameters (no driver filter here as returns are not assigned drivers)
    var returnRows = [];
    if (!params.consumerNo) {
      returnRows = allData.returns.filter(function(r) {
        if (driverName !== 'ALL') return false; // returns don't have driver logged, so skip if filtering by driver
        var p = r.date.split('-');
        var d = new Date(p[2], p[1]-1, p[0]);
        var dMatch = inRange(d);
        var prodMatch = (productName === 'ALL' || r.productName === productName);
        var partyMatch = (partyName === 'ALL' || r.customerName === partyName);
        return dMatch && prodMatch && partyMatch;
      });
    }
    
    // Product-wise breakdown
    var salesByProd = {};
    salesRows.forEach(function(s) {
      var pn = s.productName || 'Unknown';
      if (!salesByProd[pn]) {
        salesByProd[pn] = { refillQty: 0, cashQty: 0, onlineQty: 0, refillRevenue: 0, totalRevenue: 0 };
      }
      salesByProd[pn].refillQty     += (s.totalQty || 0);
      salesByProd[pn].cashQty       += (s.cashQty || 0);
      salesByProd[pn].onlineQty     += (s.onlineQty || 0);
      salesByProd[pn].refillRevenue += (s.itemTotal || 0);
      salesByProd[pn].totalRevenue  += (s.itemTotal || 0);
    });
    
    var retByProd = {};
    returnRows.forEach(function(r) {
      var pn = r.productName || 'Unknown';
      if (!retByProd[pn]) {
        retByProd[pn] = { returnedQty: 0, totalRefund: 0 };
      }
      retByProd[pn].returnedQty += (r.returnedQty || 0);
    });
    
    // Unique invoices for payment aggregates
    var uniqueInvs = {};
    salesRows.forEach(function(s) {
      uniqueInvs[s.receiptNo] = {
        invoiceTotal: s.invoiceTotal || 0,
        cashPaid:     s.cashPaid || 0,
        onlinePaid:   s.onlinePaid || 0,
        totalPaid:    s.totalPaid || 0,
        balanceDue:   s.balanceDue || 0
      };
    });
    
    var totSales = 0, totCashPaid = 0, totOnlinePaid = 0, totPaid = 0, totDues = 0;
    Object.keys(uniqueInvs).forEach(function(k) {
      var inv = uniqueInvs[k];
      totSales      += inv.invoiceTotal;
      totCashPaid   += inv.cashPaid;
      totOnlinePaid += inv.onlinePaid;
      totPaid       += inv.totalPaid;
      totDues       += inv.balanceDue;
    });
    
    return {
      ok: true,
      summary: {
        totSales: totSales,
        totCashPaid: totCashPaid,
        totOnlinePaid: totOnlinePaid,
        totPaid: totPaid,
        totDues: totDues,
        salesCount: Object.keys(uniqueInvs).length,
        returnCount: returnRows.length
      },
      salesByProd: salesByProd,
      retByProd:   retByProd,
      products:    Object.keys(salesByProd).concat(Object.keys(retByProd)).filter(function(v,i,a){ return a.indexOf(v)===i; }),
      filteredSales: salesRows
    };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  SYSTEM UTILITY
// ════════════════════════════════════════════════════════════════

function apiResetDatabase() {
  try {
    [SH_SALES, SH_DRAFTS, SH_RETURNS].forEach(function(name){
      var sh = SS().getSheetByName(name);
      if (sh && sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent();
    });
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function apiInitializeSheets() {
  try { _ensureSheets(); return { ok: true }; }
  catch(e) { return { ok: false, error: e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  GMAIL MESSAGING
// ════════════════════════════════════════════════════════════════

function apiSendEmail(params) {
  try {
    var to = params.to;
    var subject = params.subject;
    var bodyText = params.bodyText;
    
    if (!to) return { ok: false, error: 'Recipient email address is required.' };
    
    // Format HTML email with premium agency branding
    var htmlBody = 
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">' +
        '<div style="background-color: #1e293b; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">' +
          '<h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 0.5px;">SHIV SHAKTI HP GAS AGENCY</h2>' +
        '</div>' +
        '<div style="padding: 20px; color: #334155; line-height: 1.6;">' +
          '<pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; margin: 0; color: #334155;">' + bodyText + '</pre>' +
        '</div>' +
        '<div style="background-color: #f8fafc; padding: 12px; border-radius: 0 0 6px 6px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">' +
          'This is an automated transaction slip/reminder from Shiv Shakti Portal.<br>For queries, contact us at our registered mobile number.' +
        '</div>' +
      '</div>';
      
    GmailApp.sendEmail(to, subject, '', {
      htmlBody: htmlBody
    });
    
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// ════════════════════════════════════════════════════════════════
//  COMBINED DATA LOADER
// ════════════════════════════════════════════════════════════════

function apiGetAllData() {
  try {
    _ensureSheets();
    var ss = SS();
    
    // Parties
    var partySh = ss.getSheetByName(SH_PARTIES);
    var parties = _rows(partySh).filter(function(r){ return r[0]; }).map(function(r){
      return { id: r[0], name: r[1]||'', mobile: r[2]||'', address: r[3]||'', email: r[4]||'' };
    });
    
    // Drivers
    var driverSh = ss.getSheetByName(SH_DRIVERS);
    var drivers = _rows(driverSh).filter(function(r){ return r[0]; }).map(function(r){
      return { id: r[0], name: r[1]||'', mobile: r[2]||'', vehicleNo: r[3]||'' };
    });
    
    // Company
    var compResult = apiGetCompanyProfile();
    var company = compResult.ok ? compResult.data : {
      name: 'Shiv Shakti HP Gas Agency',
      prefix: 'SS',
      terms: 'Payment due within 7 days. Cylinder to be returned within 30 days.'
    };
    
    // Products
    var prodSh = ss.getSheetByName(SH_PRODUCTS);
    var products = _rows(prodSh).filter(function(r){ return r[0]; }).map(function(r){
      return { id:r[0], name:r[1]||'', refillRate:r[2]||0, depositRate: 0 };
    });
    
    // Sales (Finalized)
    var salesSh = ss.getSheetByName(SH_SALES);
    var sales = _rows(salesSh).filter(function(r){ return r[0]; }).map(function(r){
      return {
        receiptNo:r[0], date:_dateFmt(r[1]), customerName:r[2], mobile:r[3]||'', address:r[4]||'',
        productId:r[5], productName:r[6], cashQty:r[7]||0, onlineQty:r[8]||0, totalQty:r[9]||0,
        refillRate:r[10]||0, discount:r[11]||0, itemTotal:r[12]||0, emptyReturned:r[13]||0, pendingEmpty:r[14]||0,
        invoiceTotal:r[15]||0, cashPaid:r[16]||0, onlinePaid:r[17]||0, totalPaid:r[18]||0,
        balanceDue:r[19]||0, paymentStatus: (r[19]||0) <= 0.05 ? 'Paid' : 'Pending',
        denominations:r[20]||'', cashToReturn:r[21]||0, notes:r[22]||'', driver:r[23]||'', consumerNos:r[24]||''
      };
    });
    
    // Drafts (Unfinalized)
    var draftSh = ss.getSheetByName(SH_DRAFTS);
    var drafts = _rows(draftSh).filter(function(r){ return r[0]; }).map(function(r){
      return {
        receiptNo:r[0], date:_dateFmt(r[1]), customerName:r[2], mobile:r[3]||'', address:r[4]||'',
        productId:r[5], productName:r[6], cashQty:r[7]||0, onlineQty:r[8]||0, totalQty:r[9]||0,
        refillRate:r[10]||0, discount:r[11]||0, itemTotal:r[12]||0, emptyReturned:r[13]||0, pendingEmpty:r[14]||0,
        invoiceTotal:r[15]||0, cashPaid:r[16]||0, onlinePaid:r[17]||0, totalPaid:r[18]||0,
        balanceDue:r[19]||0, denominations:r[20]||'', cashToReturn:r[21]||0, notes:r[22]||'', driver:r[23]||'', consumerNos:r[24]||''
      };
    });
    
    // Returns
    var retSh = ss.getSheetByName(SH_RETURNS);
    var returns = _rows(retSh).filter(function(r){ return r[0]; }).map(function(r){
      return {
        txnNo:r[0], date:_dateFmt(r[1]), customerName:r[2], mobile:r[3]||'',
        productId:r[4], productName:r[5], returnedQty:r[6]||0, notes:r[7]||''
      };
    });
    
    // Calculate dynamic tracker
    var tracker = _getDynamicTracker(sales, returns);
    
    // Load price history
    var priceHistoryResult = apiGetPriceHistory();
    var priceHistory = priceHistoryResult.ok ? priceHistoryResult.history : [];
    
    // Users
    var userSh = ss.getSheetByName(SH_USERS);
    var users = _rows(userSh).filter(function(r){ return r[0]; }).map(function(r){
      return { username: r[0], password: r[1]||'', role: r[2]||'', createdAt: _dateFmt(r[3]) };
    });
    
    return { ok:true, company:company, products:products, drivers:drivers, sales:sales, drafts:drafts, returns:returns, tracker:tracker, parties:parties, priceHistory:priceHistory, users:users };
  } catch(e) { return { ok:false, error:e.message }; }
}

// ════════════════════════════════════════════════════════════════
//  PORTAL USER MANAGEMENT ENDPOINTS
// ════════════════════════════════════════════════════════════════
function apiSaveUser(u) {
  try {
    _ensureSheets();
    var ss = SS();
    var sh = ss.getSheetByName(SH_USERS);
    var rows = _rows(sh);
    
    var foundIndex = -1;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === u.username) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex !== -1) {
      sh.getRange(foundIndex + 2, 2).setValue(u.password);
      sh.getRange(foundIndex + 2, 3).setValue(u.role);
    } else {
      sh.appendRow([u.username, u.password, u.role, new Date().toISOString()]);
    }
    return { ok: true };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

function apiDeleteUser(username) {
  try {
    _ensureSheets();
    var ss = SS();
    var sh = ss.getSheetByName(SH_USERS);
    var rows = _rows(sh);
    
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === username) {
        sh.deleteRow(i + 2);
        return { ok: true };
      }
    }
    return { ok: false, error: 'User ' + username + ' not found.' };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}
