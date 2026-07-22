/**
 * SHIV SHAKTI HP GAS AGENCY — Database Backend Initializer
 * Custom menu and sheet setup for the Enterprise Portal.
 */

// ── Color Constants ──────────────────────────────────────────────────────────
var C_DARK   = '#1e293b'; // slate-900 (Header BG)
var C_WHITE  = '#ffffff'; // White text
var C_BORDER = '#cbd5e1'; // slate-300

// ── Custom Menu ──────────────────────────────────────────────────────────────
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Shiv Shakti Portal')
      .addItem('Open Web App Portal', 'openWebAppDialog')
      .addSeparator()
      .addItem('Initialize Database Sheets', 'initializeSystem')
      .addItem('Load Demo Data', 'loadDemoData')
      .addItem('Clear / Reset All Data', 'clearAllData')
      .addSeparator()
      .addItem('Help & Instructions', 'showHelpInstructions')
      .addToUi();
  } catch (e) {
    // UI is not available in this context (e.g. executing as Web App)
  }
}

// ── Open Web App Dialog ──────────────────────────────────────────────────────
function openWebAppDialog() {
  var url = ScriptApp.getService().getUrl();
  var html;
  if (url && url.indexOf('/exec') !== -1) {
    html = '<b>Click the link below to open your Enterprise Portal:</b><br><br>' +
           '<a href="' + url + '" target="_blank" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 20px;text-decoration:none;font-weight:bold;border-radius:6px;font-family:sans-serif;">Open Web App Portal ➔</a><br><br>' +
           '<span style="font-size:11px;color:#64748b;font-family:sans-serif;">URL: ' + url + '</span>';
  } else {
    html = '<p style="font-family:sans-serif;font-size:13px;line-height:1.5;">' +
           '<b>Web App is not deployed yet!</b><br><br>' +
           'To deploy the Web App:<br>' +
           '1. In Apps Script, click <b>Deploy ➔ New deployment</b> (top right).<br>' +
           '2. Select <b>Web app</b> type.<br>' +
           '3. Set Who has access to <b>Anyone</b>.<br>' +
           '4. Click <b>Deploy</b>, authorize permissions, and refresh this sheet.' +
           '</p>';
  }
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450)
    .setHeight(180)
    .setTitle('Enterprise Portal Link');
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Shiv Shakti Gas Portal');
}

// ── Initialize Database Sheets ───────────────────────────────────────────────
function initializeSystem() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Initialize Database Sheets',
    'This will build the clean database tables needed for the Web App. Any existing sheets with these names will be cleared. Do you want to proceed?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  try {
    _runInitialization();
    ui.alert('Success', 'Database sheets initialized! You can now manage your data in the Web App.', ui.ButtonSet.OK);
  } catch(e) {
    ui.alert('Error: ' + e.message);
  }
}

// ── Core Initialization Logic ────────────────────────────────────────────────
function _runInitialization() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Create/format the database sheets
  var tables = {
    'GAS_PARTIES':  ['PartyID', 'Name', 'Mobile', 'Address', 'Email', 'CreatedAt'],
    'GAS_PRODUCTS': ['ProductID', 'Name', 'Rate', 'CreatedAt'],
    'GAS_DRIVERS':  ['DriverID', 'Name', 'Mobile', 'VehicleNo', 'CreatedAt'],
    'GAS_SALES':    ['ReceiptNo', 'Date', 'CustomerName', 'Mobile', 'Address', 'ProductID', 'ProductName', 
                     'CashQty', 'OnlineQty', 'TotalQty', 'Rate', 'Discount', 'ItemTotal', 'EmptyReturned', 'PendingEmpty', 
                     'InvoiceTotal', 'CashPaid', 'OnlinePaid', 'TotalPaid', 'BalanceDue', 'Denominations', 'CashToReturn', 'Notes', 'Driver', 'ConsumerNos'],
    'GAS_DRAFTS':   ['ReceiptNo', 'Date', 'CustomerName', 'Mobile', 'Address', 'ProductID', 'ProductName', 
                     'CashQty', 'OnlineQty', 'TotalQty', 'Rate', 'Discount', 'ItemTotal', 'EmptyReturned', 'PendingEmpty', 
                     'InvoiceTotal', 'CashPaid', 'OnlinePaid', 'TotalPaid', 'BalanceDue', 'Denominations', 'CashToReturn', 'Notes', 'Driver', 'ConsumerNos'],
    'GAS_RETURNS':  ['TxnNo', 'Date', 'CustomerName', 'Mobile', 'ProductID', 'ProductName', 'ReturnedQty', 'Notes'],
    'GAS_PRICE_HISTORY': ['HistoryID', 'ProductID', 'ProductName', 'OldRate', 'NewRate', 'ChangedAt']
  };
  
  for (var name in tables) {
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    
    // Reset format, contents, and unfreeze
    sh.setFrozenRows(0);
    sh.setFrozenColumns(0);
    try {
      sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
    } catch(e) {}
    sh.clearContents();
    sh.clearFormats();
    
    var cols = tables[name];
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    
    // Format headers
    var headerRange = sh.getRange(1, 1, 1, cols.length);
    headerRange.setBackground(C_DARK)
               .setFontColor(C_WHITE)
               .setFontWeight('bold')
               .setFontFamily('Arial')
               .setFontSize(10)
               .setHorizontalAlignment('center');
    
    sh.setRowHeight(1, 28);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setBorder(true, true, true, true, true, true, C_BORDER, SpreadsheetApp.BorderStyle.SOLID);
    sh.setFrozenRows(1);
  }
  
  // 1.5 Initialize GAS_COMPANY with the premium design
  var compSh = ss.getSheetByName('GAS_COMPANY');
  if (!compSh) compSh = ss.insertSheet('GAS_COMPANY');
  _initializeCompanySheet(compSh);
  
  // 2. Remove old design sheets (clean up if they exist)
  var oldSheets = ['Dashboard', 'DailyEntry', 'SalesDB', 'PartySales', 'CashCalc', 'Reports', 'Invoice', 'Settings', 'GAS_TRACKER'];
  oldSheets.forEach(function(oldName) {
    var oldSh = ss.getSheetByName(oldName);
    if (oldSh) {
      try {
        ss.deleteSheet(oldSh);
      } catch(e) {
        // Spreadsheet must have at least one visible sheet.
      }
    }
  });
}

// ── Initialize Company Sheet (Premium Design) ────────────────────────────────
function _initializeCompanySheet(sh) {
  // Detect and preserve existing key-values if upgrading
  var existing = {};
  try {
    var a1Val = sh.getRange('A1').getValue();
    if (a1Val === 'Key' && sh.getLastRow() > 1) {
      var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
      rows.forEach(function(r) {
        if (r[0]) existing[r[0]] = r[1];
      });
    } else if (a1Val.indexOf('COMPANY PROFILE CONFIGURATION') !== -1) {
      // Already premium, read from layout to keep edits
      var lastRow = sh.getLastRow();
      var numRows = Math.min(11, lastRow - 3);
      if (numRows > 0) {
        var rows = sh.getRange(4, 1, numRows, 4).getValues();
        rows.forEach(function(r) {
          if (r[2]) existing[r[2]] = r[1];
        });
      }
    }
  } catch(e) {}

  sh.clearContents();
  sh.clearFormats();
  try {
    sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  } catch(e) {}
  
  // Set dimensions
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 300);
  sh.setColumnWidth(3, 120);
  sh.setColumnWidth(4, 350);
  
  // Title Banner
  sh.getRange('A1:D1').merge()
    .setValue('SHIV SHAKTI HP GAS AGENCY — COMPANY PROFILE CONFIGURATION')
    .setBackground('#1e293b') // slate-900
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 40);
  
  // Subtitle/Instructions
  sh.getRange('A2:D2').merge()
    .setValue('Instructions: Edit settings in Column B (Setting Value) only. Do NOT modify Column C (Internal Key).')
    .setBackground('#f8fafc') // slate-50
    .setFontColor('#64748b') // slate-500
    .setFontSize(9)
    .setFontStyle('italic')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(2, 24);
  
  // Headers
  var headers = ['Setting Name', 'Setting Value (EDITABLE)', 'Internal Key', 'Description'];
  sh.getRange('A3:D3').setValues([headers])
    .setBackground('#334155') // slate-700
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(3, 28);
  
  // Rows data
  var rows = [
    ['Company Name',        existing['name'] !== undefined ? existing['name'] : 'Shiv Shakti HP Gas Agency',                                                'name',   'The registered agency name shown on invoice headers.'],
    ['GSTIN / Tax ID',      existing['gst'] !== undefined ? existing['gst'] : 'Not Set',                                                                 'gst',    'The GST registration number of the agency.'],
    ['Address Line 1',      existing['addr1'] !== undefined ? existing['addr1'] : '123 Main Street',                                                         'addr1',  'Primary office address line.'],
    ['Address Line 2',      existing['addr2'] !== undefined ? existing['addr2'] : 'Sector 5, Near Plaza',                                                    'addr2',  'Secondary address line/locality.'],
    ['City & State',        existing['city'] !== undefined ? existing['city'] : 'Patna, Bihar',                                                            'city',   'City, State, and Postal Code.'],
    ['Contact Phone',       existing['phone'] !== undefined ? existing['phone'] : '9876543210',                                                              'phone',  'Contact number printed on invoices and used for WhatsApp.'],
    ['Contact Email',       existing['email'] !== undefined ? existing['email'] : 'shivshakti.gas@gmail.com',                                                'email',  'Registered email address for sending slips and reports.'],
    ['Invoice Prefix',      existing['prefix'] !== undefined ? existing['prefix'] : 'SS',                                                                      'prefix', 'Unique letter prefix for sales receipt IDs (e.g., SS001).'],
    ['UPI ID for Payments', existing['upi'] !== undefined ? existing['upi'] : 'shivshakti@upi',                                                          'upi',    'UPI address for payment QR codes.'],
    ['Terms & Conditions',  existing['terms'] !== undefined ? existing['terms'] : 'Payment due within 7 days. Cylinder to be returned within 30 days.',      'terms',  'Terms and notes printed at the bottom of invoices.'],
    ['Company Logo',        existing['logo'] !== undefined ? existing['logo'] : '',                                                                        'logo',   'Base64 encoded logo image shown on invoices and receipts.']
  ];
  
  sh.getRange(4, 1, 11, 4).setValues(rows);
  
  // Styling rows
  var borderRange = sh.getRange(3, 1, 12, 4);
  borderRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
  
  // Font formatting
  var dataRange = sh.getRange(4, 1, 11, 4);
  dataRange.setFontFamily('Arial').setFontSize(10).setVerticalAlignment('middle');
  
  // Setting Names (Col A) - Left align, bold labels
  sh.getRange(4, 1, 11, 1).setFontWeight('bold').setHorizontalAlignment('left').setBackground('#f1f5f9');
  
  // Values (Col B) - Light blue background for editability indication
  sh.getRange(4, 2, 11, 1).setBackground('#f0f9ff').setHorizontalAlignment('left');
  
  // Keys (Col C) - Centered, grey text, smaller
  sh.getRange(4, 3, 11, 1).setFontColor('#94a3b8').setHorizontalAlignment('center').setFontSize(9);
  
  // Descriptions (Col D) - Left align, grey text
  sh.getRange(4, 4, 11, 1).setFontColor('#475569').setHorizontalAlignment('left');
  
  for (var r = 4; r <= 14; r++) {
    sh.setRowHeight(r, 26);
  }
}

// ── Load Demo Data ───────────────────────────────────────────────────────────
function loadDemoData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Load Demo Data',
    'This will clear all current data and load sample database entries for testing. Do you want to proceed?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;
  
  try {
    // 1. Ensure sheets exist and are reset
    _runInitialization();
    
    // 2. Load Parties (with Email)
    var partySh = ss.getSheetByName('GAS_PARTIES');
    partySh.appendRow(['PTY001', 'Ramesh Commercial Kitchen', '9876543210', '123 Main Street, Sector 5', 'ramesh.kitchen@gmail.com', new Date()]);
    partySh.appendRow(['PTY002', 'Highway Dhaba & Restaurant', '9812345678', 'Highway NH-8, Mile 45', 'highway.dhaba@gmail.com', new Date()]);
    partySh.appendRow(['PTY003', 'Hotel Taj Deluxe', '9998887776', 'Station Road, Near Plaza', 'taj.deluxe@gmail.com', new Date()]);
    
    // 3. Load Products
    var prodSh = ss.getSheetByName('GAS_PRODUCTS');
    prodSh.appendRow(['PRD001', '19 Kg Commercial LPG', 1850, new Date()]);
    prodSh.appendRow(['PRD002', '47.5 Kg Industrial LPG', 4500, new Date()]);
    prodSh.appendRow(['PRD003', '5 Kg Small Gas Cylinder', 550, new Date()]);
    
    // 4. Load Drivers
    var driverSh = ss.getSheetByName('GAS_DRIVERS');
    driverSh.appendRow(['DRV001', 'Ram Singh', '9876501234', 'BR-06-G-4321', new Date()]);
    driverSh.appendRow(['DRV002', 'Shyam Lal', '9876505678', 'BR-06-H-8765', new Date()]);
    
    // 5. Load Sales (Finalized)
    var salesSh = ss.getSheetByName('GAS_SALES');
    var d1 = new Date(); d1.setDate(d1.getDate() - 5);
    var d2 = new Date(); d2.setDate(d2.getDate() - 2);
    
    // Invoice 1 (SS001)
    salesSh.appendRow([
      'SS001', d1, 'Ramesh Commercial Kitchen', '9876543210', '123 Main Street, Sector 5',
      'PRD001', '19 Kg Commercial LPG', 5, 0, 5, 1850, 100, 9150, 3, 2,
      10250, 10250, 0, 10250, 0, '500:20,100:2,50:1', 0, 'First test delivery', 'Ram Singh'
    ]);
    salesSh.appendRow([
      'SS001', d1, 'Ramesh Commercial Kitchen', '9876543210', '123 Main Street, Sector 5',
      'PRD003', '5 Kg Small Gas Cylinder', 2, 0, 2, 550, 0, 1100, 2, 0,
      10250, 10250, 0, 10250, 0, '500:20,100:2,50:1', 0, 'First test delivery', 'Ram Singh'
    ]);
    
    // Invoice 2 (SS002)
    salesSh.appendRow([
      'SS002', d2, 'Highway Dhaba & Restaurant', '9812345678', 'Highway NH-8, Mile 45',
      'PRD002', '47.5 Kg Industrial LPG', 0, 2, 2, 4500, 200, 8800, 0, 2,
      8800, 0, 5000, 5000, 3800, '', 0, 'Balance pending payment', 'Shyam Lal'
    ]);
    
    // 6. Load Returns (Standalone return)
    var retSh = ss.getSheetByName('GAS_RETURNS');
    retSh.appendRow([
      'RTN001', new Date(), 'Ramesh Commercial Kitchen', '9876543210',
      'PRD001', '19 Kg Commercial LPG', 2, 'Returned remaining 2 empties from SS001'
    ]);
    
    // 7. Load Draft (Draft Invoice)
    var draftSh = ss.getSheetByName('GAS_DRAFTS');
    var d3 = new Date();
    draftSh.appendRow([
      'DFT001', d3, 'Hotel Taj Deluxe', '9998887776', 'Station Road, Near Plaza',
      'PRD001', '19 Kg Commercial LPG', 3, 0, 3, 1850, 50, 5500, 1, 2,
      5500, 0, 0, 0, 5500, '', 0, 'Temporary draft - waiting for verification', 'Ram Singh'
    ]);
    
    ui.alert('Success', 'Demo data loaded successfully! Open your Web App to see the dashboard, drafts list, and reports.', ui.ButtonSet.OK);
  } catch(e) {
    ui.alert('Error loading demo data: ' + e.message);
  }
}

// ── Clear / Reset All Data ──────────────────────────────────────────────────
function clearAllData() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Clear / Reset All Data',
    'WARNING: This will delete ALL data (Parties, Products, Drivers, Sales, Drafts, and Returns) and start completely fresh. Are you absolutely sure?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;
  
  try {
    _runInitialization();
    ui.alert('Success', 'All database sheets have been reset and cleared!', ui.ButtonSet.OK);
  } catch(e) {
    ui.alert('Error clearing data: ' + e.message);
  }
}

// ── Help & Instructions ─────────────────────────────────────────────────────
function showHelpInstructions() {
  var html = '<h3>Shiv Shakti Gas Enterprise Portal Instructions</h3>' +
             '<p style="font-family:sans-serif;font-size:13px;line-height:1.5;color:#334155;">' +
             '1. <b>Deploy the Web App</b>: Go to Extensions ➔ Apps Script, click Deploy ➔ New Deployment, select Web app, set access to Anyone, and Deploy.<br><br>' +
             '2. <b>Open Portal</b>: In Google Sheets, click <b>Shiv Shakti Portal ➔ Open Web App Portal</b> to launch the web app.<br><br>' +
             '3. <b>Manage Parties</b>: Go to the Manage Parties page in the Web App to add your commercial customers (with email).<br><br>' +
             '4. <b>Sales, Drafts & Returns</b>: Use the Web App to log cylinder sales, manage drafts, track discounts, track empty returns, share via WhatsApp/Gmail, and view reports.' +
             '</p>';
             
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450)
    .setHeight(300)
    .setTitle('System Help');
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Help & Instructions');
}
