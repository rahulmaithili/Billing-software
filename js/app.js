/**
 * Main Application Logic & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadCurrentView();
});

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-item a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      switchView(page);
    });
  });
}

function switchView(pageId) {
  // Highlight nav item
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-item a[data-page="${pageId}"]`);
  if (activeLink) {
    activeLink.parentElement.classList.add('active');
  }

  // Update URL hash
  window.location.hash = pageId;

  // Render view
  renderView(pageId);
}

function loadCurrentView() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  switchView(hash);
}

function renderView(viewId) {
  const container = document.getElementById('view-container');
  if (!container) return;

  switch (viewId) {
    case 'dashboard':
      renderDashboardView(container);
      break;
    case 'inventory':
      renderInventoryView(container);
      break;
    case 'customers':
      renderCustomersView(container);
      break;
    case 'suppliers':
      renderSuppliersView(container);
      break;
    case 'sales':
      renderSalesView(container);
      break;
    case 'purchases':
      renderPurchasesView(container);
      break;
    case 'receipts':
      renderReceiptsView(container);
      break;
    case 'payments':
      renderPaymentsView(container);
      break;
    default:
      renderDashboardView(container);
  }
}

// --- Dashboard View ---
function renderDashboardView(container) {
  const m = window.dbService.getDashboardMetrics();

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="grid-kpi">
      <div class="glass-card kpi-card">
        <div class="kpi-info">
          <h4>Total Sales</h4>
          <div class="val">₹${m.totalSales.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-icon blue"><i class="fas fa-chart-line"></i></div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-info">
          <h4>Total Purchases</h4>
          <div class="val">₹${m.totalPurchases.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-icon amber"><i class="fas fa-shopping-bag"></i></div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-info">
          <h4>Net Profit</h4>
          <div class="val" style="color: ${m.netProfit >= 0 ? '#34d399' : '#f472b6'};">₹${m.netProfit.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-icon green"><i class="fas fa-wallet"></i></div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-info">
          <h4>Receivables</h4>
          <div class="val">₹${m.totalReceivable.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-icon cyan"><i class="fas fa-hand-holding-usd"></i></div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-info">
          <h4>Payables</h4>
          <div class="val">₹${m.totalPayable.toLocaleString('en-IN')}</div>
        </div>
        <div class="kpi-icon pink"><i class="fas fa-file-invoice-dollar"></i></div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid-charts">
      <div class="glass-card">
        <div class="chart-header">
          <h3>Sales vs Purchases Analytics</h3>
        </div>
        <canvas id="salesPurchasesChart" height="220"></canvas>
      </div>

      <div class="glass-card">
        <div class="chart-header">
          <h3>Top Sales Locations</h3>
        </div>
        <canvas id="locationChart" height="220"></canvas>
      </div>
    </div>
  `;

  // Initialize Chart.js
  setTimeout(() => {
    initDashboardCharts(m);
  }, 100);
}

function initDashboardCharts(m) {
  const ctx1 = document.getElementById('salesPurchasesChart');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Raw Material', 'Electrical', 'Components', 'Plastics'],
        datasets: [
          { label: 'Sales (₹)', data: [170000, 180000, 180000, 270000], backgroundColor: '#6366f1' },
          { label: 'Purchases (₹)', data: [325000, 270000, 150000, 90000], backgroundColor: '#f59e0b' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  const ctx2 = document.getElementById('locationChart');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Mumbai', 'Bengaluru', 'Ahmedabad', 'Delhi'],
        datasets: [{
          data: [170000, 180000, 180000, 270000],
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
      }
    });
  }
}

// --- Inventory View ---
function renderInventoryView(container) {
  const items = window.dbService.getInventory();

  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Inventory Catalogue & Stock</h2>
        <div class="search-box">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="inventorySearch" placeholder="Search inventory items..." onkeyup="filterInventoryTable()">
        </div>
        <button class="btn btn-primary" onclick="openAddInventoryModal()"><i class="fas fa-plus"></i> Add Item</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table" id="inventoryTable">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Purchased</th>
              <th>Sold</th>
              <th>Stock Remaining</th>
              <th>Reorder Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td><strong>${item.id}</strong></td>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.category}</td>
                <td>${item.purchasedQty}</td>
                <td>${item.soldQty}</td>
                <td><span style="font-weight: 700; color: ${item.remainingQty < item.reorderLevel ? '#f43f5e' : '#10b981'};">${item.remainingQty}</span></td>
                <td>
                  ${item.reorderRequired 
                    ? '<span class="badge-status" style="background: rgba(244,63,94,0.15); color: #f43f5e; border-color: rgba(244,63,94,0.3);"><span class="status-dot" style="background:#f43f5e; box-shadow: 0 0 10px #f43f5e;"></span> Reorder Needed</span>'
                    : '<span class="badge-status"><span class="status-dot"></span> In Stock</span>'
                  }
                </td>
                <td>
                  <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem('${item.id}')"><i class="fas fa-trash"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddInventoryModal() {
  showModal('Add New Inventory Item', `
    <form id="addInventoryForm" onsubmit="handleAddInventory(event)">
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" class="form-control" name="name" required placeholder="e.g. Stainless Steel Fasteners">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Item Type</label>
          <input type="text" class="form-control" name="type" required placeholder="Raw Material">
        </div>
        <div class="form-group">
          <label>Item Category</label>
          <input type="text" class="form-control" name="category" required placeholder="Hardware">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Initial Quantity</label>
          <input type="number" class="form-control" name="purchasedQty" value="100" required>
        </div>
        <div class="form-group">
          <label>Reorder Threshold</label>
          <input type="number" class="form-control" name="reorderLevel" value="25" required>
        </div>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Item</button>
      </div>
    </form>
  `);
}

function handleAddInventory(e) {
  e.preventDefault();
  const form = e.target;
  const item = {
    name: form.name.value,
    type: form.type.value,
    category: form.category.value,
    purchasedQty: Number(form.purchasedQty.value),
    soldQty: 0,
    reorderLevel: Number(form.reorderLevel.value)
  };
  window.dbService.addInventoryItem(item);
  closeModal();
  renderView('inventory');
}

function deleteInventoryItem(id) {
  if (confirm('Are you sure you want to delete item ' + id + '?')) {
    window.dbService.deleteInventoryItem(id);
    renderView('inventory');
  }
}

function filterInventoryTable() {
  const query = document.getElementById('inventorySearch').value.toLowerCase();
  const rows = document.querySelectorAll('#inventoryTable tbody tr');
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });
}

// --- Customers View ---
function renderCustomersView(container) {
  const custs = window.dbService.getCustomers();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Customer Directory & Receivables</h2>
        <button class="btn btn-primary" onclick="openAddCustomerModal()"><i class="fas fa-plus"></i> Add Customer</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Receivable (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${custs.map(c => `
              <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.name}</td>
                <td>${c.city}</td>
                <td>${c.state}</td>
                <td>${c.phone}</td>
                <td>${c.email}</td>
                <td><strong style="color:#22d3ee;">₹${Number(c.receivable).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddCustomerModal() {
  showModal('Add Customer Record', `
    <form onsubmit="handleAddCustomer(event)">
      <div class="form-group">
        <label>Customer Name</label>
        <input type="text" class="form-control" name="name" required placeholder="Company or Client Name">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>City</label>
          <input type="text" class="form-control" name="city" required placeholder="Mumbai">
        </div>
        <div class="form-group">
          <label>State</label>
          <input type="text" class="form-control" name="state" required placeholder="Maharashtra">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Phone</label>
          <input type="text" class="form-control" name="phone" required placeholder="+91 9800000000">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" name="email" required placeholder="client@company.com">
        </div>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Customer</button>
      </div>
    </form>
  `);
}

function handleAddCustomer(e) {
  e.preventDefault();
  const form = e.target;
  const cust = {
    name: form.name.value,
    city: form.city.value,
    state: form.state.value,
    phone: form.phone.value,
    email: form.email.value,
    receivable: 0
  };
  window.dbService.addCustomer(cust);
  closeModal();
  renderView('customers');
}

// --- Suppliers View ---
function renderSuppliersView(container) {
  const sups = window.dbService.getSuppliers();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Supplier Directory & Payables</h2>
        <button class="btn btn-primary" onclick="openAddSupplierModal()"><i class="fas fa-plus"></i> Add Supplier</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Supplier ID</th>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Phone</th>
              <th>Payable (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${sups.map(s => `
              <tr>
                <td><strong>${s.id}</strong></td>
                <td>${s.name}</td>
                <td>${s.city}</td>
                <td>${s.state}</td>
                <td>${s.phone}</td>
                <td><strong style="color:#f472b6;">₹${Number(s.payable).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddSupplierModal() {
  showModal('Add Supplier Record', `
    <form onsubmit="handleAddSupplier(event)">
      <div class="form-group">
        <label>Supplier Name</label>
        <input type="text" class="form-control" name="name" required placeholder="Vendor Company Name">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>City</label>
          <input type="text" class="form-control" name="city" required placeholder="Delhi">
        </div>
        <div class="form-group">
          <label>State</label>
          <input type="text" class="form-control" name="state" required placeholder="Delhi">
        </div>
      </div>
      <div class="form-group">
        <label>Phone</label>
        <input type="text" class="form-control" name="phone" required placeholder="+91 9900000000">
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Supplier</button>
      </div>
    </form>
  `);
}

function handleAddSupplier(e) {
  e.preventDefault();
  const form = e.target;
  const sup = {
    name: form.name.value,
    city: form.city.value,
    state: form.state.value,
    phone: form.phone.value,
    payable: 0
  };
  window.dbService.addSupplier(sup);
  closeModal();
  renderView('suppliers');
}

// --- Sales View ---
function renderSalesView(container) {
  const sales = window.dbService.getSales();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Sales Orders & Invoices</h2>
        <button class="btn btn-primary" onclick="openAddSaleModal()"><i class="fas fa-file-invoice"></i> Create Invoice</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Location</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Unit Price (₹)</th>
              <th>Total Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(s => `
              <tr>
                <td><strong>${s.id}</strong></td>
                <td>${s.soDate}</td>
                <td>${s.customerName}</td>
                <td>${s.city}, ${s.state}</td>
                <td>${s.itemType}</td>
                <td>${s.qty}</td>
                <td>₹${s.unitPrice}</td>
                <td><strong style="color:#34d399;">₹${Number(s.totalSalesPrice).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddSaleModal() {
  const custs = window.dbService.getCustomers();
  showModal('Create New Sales Order', `
    <form onsubmit="handleAddSale(event)">
      <div class="form-group">
        <label>Customer</label>
        <select class="form-control" name="customerName" required>
          ${custs.map(c => `<option value="${c.name}">${c.name} (${c.city})</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Item Type</label>
          <input type="text" class="form-control" name="itemType" required placeholder="Raw Material">
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" class="form-control" name="qty" required value="10">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Unit Price (₹)</label>
          <input type="number" class="form-control" name="unitPrice" required value="500">
        </div>
        <div class="form-group">
          <label>Order Date</label>
          <input type="date" class="form-control" name="soDate" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Generate Invoice</button>
      </div>
    </form>
  `);
}

function handleAddSale(e) {
  e.preventDefault();
  const form = e.target;
  const cust = window.dbService.getCustomers().find(c => c.name === form.customerName.value) || { city: 'Unknown', state: 'Unknown' };
  
  const sale = {
    customerName: form.customerName.value,
    city: cust.city,
    state: cust.state,
    itemType: form.itemType.value,
    qty: Number(form.qty.value),
    unitPrice: Number(form.unitPrice.value),
    soDate: form.soDate.value
  };
  window.dbService.addSale(sale);
  closeModal();
  renderView('sales');
}

// --- Purchases View ---
function renderPurchasesView(container) {
  const purchases = window.dbService.getPurchases();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Purchase Orders & Vendor Bills</h2>
        <button class="btn btn-primary" onclick="openAddPurchaseModal()"><i class="fas fa-cart-plus"></i> New Purchase Order</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>PO ID</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Unit Price (₹)</th>
              <th>Total Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${purchases.map(p => `
              <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.date}</td>
                <td>${p.supplierName}</td>
                <td>${p.itemType}</td>
                <td>${p.qty}</td>
                <td>₹${p.unitPrice}</td>
                <td><strong style="color:#fbbf24;">₹${Number(p.totalPurchasePrice).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddPurchaseModal() {
  const sups = window.dbService.getSuppliers();
  showModal('Create Purchase Order', `
    <form onsubmit="handleAddPurchase(event)">
      <div class="form-group">
        <label>Supplier</label>
        <select class="form-control" name="supplierName" required>
          ${sups.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Item Type / Category</label>
          <input type="text" class="form-control" name="itemType" required placeholder="Raw Material">
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" class="form-control" name="qty" required value="50">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Unit Price (₹)</label>
          <input type="number" class="form-control" name="unitPrice" required value="400">
        </div>
        <div class="form-group">
          <label>PO Date</label>
          <input type="date" class="form-control" name="date" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save PO</button>
      </div>
    </form>
  `);
}

function handleAddPurchase(e) {
  e.preventDefault();
  const form = e.target;
  const purch = {
    supplierName: form.supplierName.value,
    itemType: form.itemType.value,
    qty: Number(form.qty.value),
    unitPrice: Number(form.unitPrice.value),
    date: form.date.value
  };
  window.dbService.addPurchase(purch);
  closeModal();
  renderView('purchases');
}

// --- Receipts View ---
function renderReceiptsView(container) {
  const recs = window.dbService.getReceipts();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Customer Collection Receipts</h2>
        <button class="btn btn-primary" onclick="openAddReceiptModal()"><i class="fas fa-receipt"></i> Record Receipt</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment Method</th>
              <th>Amount Collected (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${recs.map(r => `
              <tr>
                <td><strong>${r.id}</strong></td>
                <td>${r.date}</td>
                <td>${r.customerName}</td>
                <td>${r.paymentMethod}</td>
                <td><strong style="color:#34d399;">₹${Number(r.amount).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddReceiptModal() {
  const custs = window.dbService.getCustomers();
  showModal('Record Customer Receipt', `
    <form onsubmit="handleAddReceipt(event)">
      <div class="form-group">
        <label>Customer</label>
        <select class="form-control" name="customerName" required>
          ${custs.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount (₹)</label>
          <input type="number" class="form-control" name="amount" required value="10000">
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select class="form-control" name="paymentMethod">
            <option>UPI</option>
            <option>Bank Transfer / NEFT</option>
            <option>Cheque</option>
            <option>Cash</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Receipt Date</label>
        <input type="date" class="form-control" name="date" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Record Payment</button>
      </div>
    </form>
  `);
}

function handleAddReceipt(e) {
  e.preventDefault();
  const form = e.target;
  const rec = {
    customerName: form.customerName.value,
    amount: Number(form.amount.value),
    paymentMethod: form.paymentMethod.value,
    date: form.date.value
  };
  window.dbService.addReceipt(rec);
  closeModal();
  renderView('receipts');
}

// --- Payments View ---
function renderPaymentsView(container) {
  const pays = window.dbService.getPayments();
  container.innerHTML = `
    <div class="glass-card">
      <div class="table-header-bar">
        <h2>Supplier Payment Vouchers</h2>
        <button class="btn btn-primary" onclick="openAddPaymentModal()"><i class="fas fa-money-check-alt"></i> Make Payment</button>
      </div>

      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Voucher ID</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Payment Method</th>
              <th>Amount Paid (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${pays.map(p => `
              <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.date}</td>
                <td>${p.supplierName}</td>
                <td>${p.paymentMethod}</td>
                <td><strong style="color:#f472b6;">₹${Number(p.amount).toLocaleString('en-IN')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddPaymentModal() {
  const sups = window.dbService.getSuppliers();
  showModal('Record Supplier Payment', `
    <form onsubmit="handleAddPayment(event)">
      <div class="form-group">
        <label>Supplier</label>
        <select class="form-control" name="supplierName" required>
          ${sups.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount (₹)</label>
          <input type="number" class="form-control" name="amount" required value="15000">
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select class="form-control" name="paymentMethod">
            <option>RTGS / NEFT</option>
            <option>UPI</option>
            <option>Cheque</option>
            <option>Cash</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Payment Date</label>
        <input type="date" class="form-control" name="date" value="${new Date().toISOString().split('T')[0]}" required>
      </div>
      <div style="display:flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Voucher</button>
      </div>
    </form>
  `);
}

function handleAddPayment(e) {
  e.preventDefault();
  const form = e.target;
  const pay = {
    supplierName: form.supplierName.value,
    amount: Number(form.amount.value),
    paymentMethod: form.paymentMethod.value,
    date: form.date.value
  };
  window.dbService.addPayment(pay);
  closeModal();
  renderView('payments');
}

// --- Modal Helper ---
function showModal(title, htmlContent) {
  let modal = document.getElementById('appModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'appModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">
        ${htmlContent}
      </div>
    </div>
  `;

  setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
  const modal = document.getElementById('appModal');
  if (modal) {
    modal.classList.remove('active');
  }
}
