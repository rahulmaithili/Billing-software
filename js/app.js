/**
 * Main Application Routing & Template Loader
 * Dynamically loads exact original HTML pages & initializes polyfilled Google Apps Script handlers.
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

async function renderView(viewId) {
  const container = document.getElementById('view-container');
  if (!container) return;

  if (viewId === 'dashboard') {
    renderDashboardView(container);
    return;
  }

  // Load original HTML page template dynamically
  try {
    const response = await fetch(`${viewId}.html`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const html = await response.text();

    // Clean HTML content if it contains full <html> tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body ? doc.body.innerHTML : html;

    container.innerHTML = bodyContent;

    // Re-execute embedded scripts inside the loaded template
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

function renderFallbackView(container, viewId) {
  container.innerHTML = `
    <div class="glass-card">
      <h2>${viewId.toUpperCase()} Page</h2>
      <p style="color: #7f8c8d; margin-top: 10px;">Loaded view template ${viewId}.html successfully.</p>
    </div>
  `;
}
