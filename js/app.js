/**
 * Main Application Routing, Sidebar Controller & Dashboard Renderer
 */

window.currentRole = localStorage.getItem('user_role') || 'Administrator';
window.currentUserName = 'Rahul Maithili';

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initRoleSwitcher();
  loadCurrentView();
  applyRolePermissions();
});

// --- Sidebar Open/Close Toggle ---
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainWrapper = document.querySelector('.main-wrapper');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('collapsed');
    mainWrapper.classList.toggle('expanded');
  }
}

// --- Navigation ---
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-item a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      if (isPageAllowedForRole(page)) {
        switchView(page);
      } else {
        showToast(`Access Denied: Your role (${window.currentRole}) is not authorized to view ${page.toUpperCase()}.`, 'error');
      }
    });
  });
}

function switchView(pageId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-item a[data-page="${pageId}"]`);
  if (activeLink) {
    activeLink.parentElement.classList.add('active');
  }

  window.location.hash = pageId;
  renderView(pageId);
}

function loadCurrentView() {
  const hash = window.location.hash.replace('#', '') || 'dashboard';
  switchView(hash);
}

// --- Role-Based Access Control (RBAC) ---
function initRoleSwitcher() {
  const select = document.getElementById('topRoleSelect');
  if (select) {
    select.value = window.currentRole;
    select.addEventListener('change', (e) => {
      switchRole(e.target.value);
    });
  }
}

function switchRole(newRole) {
  window.currentRole = newRole;
  localStorage.setItem('user_role', newRole);
  
  if (newRole === 'Administrator') window.currentUserName = 'Rahul Maithili (Admin)';
  else if (newRole === 'Billing Manager') window.currentUserName = 'Anita Sharma (Billing Manager)';
  else if (newRole === 'Inventory Clerk') window.currentUserName = 'Vikram Singh (Inventory Clerk)';
  else window.currentUserName = 'Suresh Patel (Accountant)';

  showToast(`Switched active user to: ${window.currentUserName}`, 'info');
  applyRolePermissions();

  const currentHash = window.location.hash.replace('#', '') || 'dashboard';
  if (!isPageAllowedForRole(currentHash)) {
    switchView('dashboard');
  } else {
    renderView(currentHash);
  }
}

function isPageAllowedForRole(page) {
  const role = window.currentRole;
  if (role === 'Administrator') return true;

  const permissions = {
    'Billing Manager': ['dashboard', 'sales', 'receipts', 'customers', 'reports'],
    'Inventory Clerk': ['dashboard', 'inventory', 'purchases', 'suppliers'],
    'Accountant': ['dashboard', 'reports', 'receipts', 'payments', 'customers', 'suppliers']
  };

  const allowedPages = permissions[role] || ['dashboard'];
  return allowedPages.includes(page);
}

function applyRolePermissions() {
  const role = window.currentRole;
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const page = link.getAttribute('data-page');
    if (!isPageAllowedForRole(page)) {
      item.classList.add('disabled');
      item.style.opacity = '0.35';
    } else {
      item.classList.remove('disabled');
      item.style.opacity = '1';
    }
  });

  const roleBadge = document.getElementById('roleBadgeDisplay');
  if (roleBadge) {
    roleBadge.innerText = `${window.currentRole} Access`;
  }
}

window.canPerformAction = function(actionType) {
  const role = window.currentRole;
  if (role === 'Administrator') return true;

  if (actionType === 'delete') {
    showToast(`Permission Denied: Only Administrators are authorized to DELETE records.`, 'error');
    return false;
  }

  if (actionType === 'edit') {
    if (role === 'Accountant') {
      showToast(`Permission Denied: Accountants are in Read-Only mode.`, 'error');
      return false;
    }
    return true;
  }

  return true;
};

// --- View Loader ---
async function renderView(viewId) {
  const container = document.getElementById('view-container');
  if (!container) return;

  if (viewId === 'dashboard') {
    renderDashboardView(container);
    return;
  }

  try {
    const response = await fetch(`${viewId}.html`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body ? doc.body.innerHTML : html;

    container.innerHTML = bodyContent;

    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

  } catch (err) {
    console.warn(`Could not load ${viewId}.html template, rendering fallback UI:`, err);
    renderFallbackView(container, viewId);
  }
}

// --- Dashboard View Matching Original Apps Script Screenshot ---
function renderDashboardView(container) {
  const m = window.dbService.getDashboardMetrics();

  container.innerHTML = `
    <!-- Header -->
    <div class="dash-header-section">
      <h1>Dashboard</h1>
      <p>Key trends and business insights</p>
    </div>

    <!-- 7 KPI Row -->
    <div class="dash-kpi-row">
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-chart-line"></i> Total Sales</div>
        <div class="dash-kpi-val">₹${m.totalSales.toLocaleString('en-IN')}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-shopping-cart"></i> Total Purchases</div>
        <div class="dash-kpi-val">₹${m.totalPurchases.toLocaleString('en-IN')}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-dollar-sign"></i> Net Profit</div>
        <div class="dash-kpi-val" style="color: ${m.netProfit >= 0 ? '#1abc9c' : '#e74c3c'};">₹${m.netProfit.toLocaleString('en-IN')}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-file-invoice"></i> Total Receivable</div>
        <div class="dash-kpi-val">₹${m.totalReceivable.toLocaleString('en-IN')}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-book"></i> Total Payable</div>
        <div class="dash-kpi-val">₹${m.totalPayable.toLocaleString('en-IN')}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-map-marker-alt"></i> Top Sales Location</div>
        <div class="dash-kpi-val" style="font-size: 0.95rem;">${m.topLocation}</div>
      </div>
      <div class="dash-kpi-card">
        <div class="dash-kpi-title"><i class="fas fa-crown"></i> Top Selling Item</div>
        <div class="dash-kpi-val" style="font-size: 0.95rem;">${m.topItem}</div>
      </div>
    </div>

    <!-- 3-Column Charts Grid -->
    <div class="dash-charts-grid">
      <!-- Left Column -->
      <div class="dash-col">
        <div class="dash-card">
          <div class="dash-card-title">Sales Trend</div>
          <div id="chartSalesTrend" style="min-height: 220px;"></div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="dash-card">
            <div class="dash-card-title">Sales By Location</div>
            <div id="chartSalesByLocation" style="min-height: 180px;"></div>
          </div>
          <div class="dash-card">
            <div class="dash-card-title">Sales By Category</div>
            <div id="chartSalesByCategory" style="min-height: 180px;"></div>
          </div>
        </div>
      </div>

      <!-- Middle Column (Tall) -->
      <div class="dash-col">
        <div class="dash-card tall">
          <div class="dash-card-title">Top 10 Customers</div>
          <div id="chartTopCustomers" style="min-height: 460px;"></div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="dash-col">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="dash-card">
            <div class="dash-card-title">Purchase By Location</div>
            <div id="chartPurchaseByLocation" style="min-height: 180px;"></div>
          </div>
          <div class="dash-card">
            <div class="dash-card-title">Purchase By Category</div>
            <div id="chartPurchaseByCategory" style="min-height: 180px;"></div>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-card-title">Sales By City</div>
          <div id="chartSalesByCity" style="min-height: 220px;"></div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initDashboardApexCharts(m);
  }, 100);
}

function initDashboardApexCharts(m) {
  if (typeof ApexCharts === 'undefined') return;

  // 1. Sales Trend
  new ApexCharts(document.querySelector("#chartSalesTrend"), {
    series: [{ name: "Sales (₹)", data: [120000, 150000, 180000, 220000, 270000, 310000] }],
    chart: { type: 'area', height: 210, toolbar: { show: false } },
    colors: ['#1abc9c'],
    stroke: { curve: 'smooth', width: 2 },
    fill: { opacity: 0.2 },
    xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }
  }).render();

  // 2. Sales By Location
  new ApexCharts(document.querySelector("#chartSalesByLocation"), {
    series: [40, 25, 20, 15],
    chart: { type: 'donut', height: 180 },
    labels: ['Mumbai', 'Bengaluru', 'Ahmedabad', 'Delhi'],
    colors: ['#1abc9c', '#3498db', '#f39c12', '#e74c3c'],
    legend: { show: false }
  }).render();

  // 3. Sales By Category
  new ApexCharts(document.querySelector("#chartSalesByCategory"), {
    series: [45, 30, 15, 10],
    chart: { type: 'pie', height: 180 },
    labels: ['Raw Material', 'Electrical', 'Components', 'Plastics'],
    colors: ['#3498db', '#1abc9c', '#f39c12', '#9b59b6'],
    legend: { show: false }
  }).render();

  // 4. Top 10 Customers (Tall Card)
  new ApexCharts(document.querySelector("#chartTopCustomers"), {
    series: [{ name: "Revenue (₹)", data: [270000, 180000, 180000, 170000, 140000, 120000, 95000, 80000, 65000, 45000] }],
    chart: { type: 'bar', height: 460, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    colors: ['#2c3e50'],
    xaxis: { categories: ['Sunrise Fab', 'Vertex Tech', 'Global Eng', 'Apex Builders', 'Ultra Tech', 'L&T Infra', 'Godrej', 'Tata Motors', 'Mahindra', 'Reliance'] }
  }).render();

  // 5. Purchase By Location
  new ApexCharts(document.querySelector("#chartPurchaseByLocation"), {
    series: [50, 30, 20],
    chart: { type: 'donut', height: 180 },
    labels: ['Jharkhand', 'UP', 'Gujarat'],
    colors: ['#f39c12', '#3498db', '#1abc9c'],
    legend: { show: false }
  }).render();

  // 6. Purchase By Category
  new ApexCharts(document.querySelector("#chartPurchaseByCategory"), {
    series: [{ name: "Purchases", data: [325000, 280000, 270000] }],
    chart: { type: 'bar', height: 180, toolbar: { show: false } },
    colors: ['#e74c3c'],
    xaxis: { categories: ['Raw Material', 'Electrical', 'Components'] }
  }).render();

  // 7. Sales By City
  new ApexCharts(document.querySelector("#chartSalesByCity"), {
    series: [{
      data: [
        { x: 'Mumbai', y: 170000 },
        { x: 'Bengaluru', y: 180000 },
        { x: 'Ahmedabad', y: 180000 },
        { x: 'Delhi', y: 270000 }
      ]
    }],
    chart: { type: 'treemap', height: 210, toolbar: { show: false } },
    colors: ['#1abc9c', '#3498db', '#f39c12', '#9b59b6']
  }).render();
}

// --- Toast System ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-msg ${type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'success')}`;
  toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

window.showToast = showToast;
