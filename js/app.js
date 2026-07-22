/**
 * Main Application Routing, Sidebar Controller & Role-Based Access Control (RBAC)
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

  // Reload current view with updated access restrictions
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

// Helper to check if current user can Edit or Delete
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

    // Execute scripts inside loaded view
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
          <div class="val" style="color: ${m.netProfit >= 0 ? '#1abc9c' : '#e74c3c'};">₹${m.netProfit.toLocaleString('en-IN')}</div>
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
          { label: 'Sales (₹)', data: [170000, 180000, 180000, 270000], backgroundColor: '#1abc9c' },
          { label: 'Purchases (₹)', data: [325000, 270000, 150000, 90000], backgroundColor: '#f39c12' }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#34495e' } } },
        scales: {
          x: { ticks: { color: '#7f8c8d' }, grid: { color: '#e0e0e0' } },
          y: { ticks: { color: '#7f8c8d' }, grid: { color: '#e0e0e0' } }
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
          backgroundColor: ['#1abc9c', '#3498db', '#f39c12', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { color: '#34495e' } } }
      }
    });
  }
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
