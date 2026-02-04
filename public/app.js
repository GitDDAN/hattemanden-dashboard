// hattemanden.dk Dashboard - Frontend JavaScript

const API_BASE = '';

// State
let currentOrdersPage = 1;
let currentCustomersPage = 1;
let ordersData = [];
let reviewProducts = [];
let reviewDecisions = {};

// Sort state for Review table (PRD-05)
let reviewSortColumn = 'revenue';
let reviewSortDirection = 'desc';

// Sort state for Customers table (CUS-03)
let customersSortColumn = null;
let customersSortDirection = 'desc';
let customersData = [];

// Sort state for Orders table (15-01)
let ordersSortColumn = null;
let ordersSortDirection = 'desc';

// Pre-defined questions for Tab 7 - Prioritized questions for Kim
// UPDATED: Reduced to 3 critical questions only (many answered through research)
// See .planning/QUESTIONS-FOR-KIM.md for full context
const QUESTIONS = [
    // ============================================
    // 🔴 CRITICAL - The ONLY 3 questions we still need answers to
    // ============================================
    {
        id: 1,
        priority: "critical",
        question: "Hvad er den fysiske butiks årlige omsætning, og hvad er dine marginer?",
        question_en: "What is the physical store's annual revenue, and what are your margins?",
        why: "Vi har kun online data (361K DKK over 9 år). Vi har brug for: fysisk butiks ca. årlig omsætning, margin på Chapeau Clarque (du nævnte 'tynde marginer'), og generel margin på hatte (Høj/Medium/Lav). Dette hjælper os med at vide hvilke produkter der skal fremhæves.",
        why_en: "We only have online data (361K DKK over 9 years). We need: physical store approximate annual revenue, margin on Chapeau Clarque (you mentioned 'thin margins'), and general margin on hats (High/Medium/Low). This helps us know which products to feature."
    },
    {
        id: 2,
        priority: "critical",
        question: "Bekræft venligst hvilke produkter der skal fjernes (og om 8 grænse-produkter skal beholdes)?",
        question_en: "Please confirm which products to remove (and whether 8 borderline products should be kept)?",
        why: "Vi anbefaler at fjerne: Kjoler (6 produkter, 0 DKK salg), Hawai skjorter (7 produkter, 143 DKK salg), Smoking og Kjole og Hvidt. MEN skal disse beholdes som 'Tilbehør'? Butterfly (704 DKK), Handsker (1.050 DKK), Kjoleskjorte Boswell (5.032 DKK), Kjolevest Boswell (3.520 DKK).",
        why_en: "We recommend removing: Dresses (6 products, 0 DKK sales), Hawaiian shirts (7 products, 143 DKK sales), Tuxedo and Formal wear. BUT should these be kept as 'Accessories'? Bow Tie (704 DKK), Gloves (1,050 DKK), Dress Shirt Boswell (5,032 DKK), Dress Vest Boswell (3,520 DKK)."
    },
    {
        id: 3,
        priority: "critical",
        question: "Har du flere fotos eller historier om Svend Erik som vi ikke allerede har fundet?",
        question_en: "Do you have additional photos or stories about Svend Erik that we haven't found?",
        why: "Vi har fundet: TV Syd 'Kaffe med Kurt' video ✅, Website fotos af Pepino ✅, Hans forretningshistorie ✅. Det ville være godt at have: flere personlige fotos (yngre år, rejser, tidlig butik), fotos af butikkens interiør, eventuelle avisudklip vi ikke kender til.",
        why_en: "We found: TV Syd 'Kaffe med Kurt' video ✅, Website photos of Pepino ✅, His business story ✅. Nice to have: additional personal photos (younger years, travels, early shop), photos of the store interior, any press clippings we don't know about."
    }
];

// Pre-answered questions (research findings) - displayed as read-only for Kim's review
// These were originally questions but we found answers through our research
const ANSWERED_QUESTIONS = [
    // ============================================
    // BRAND ASSETS - FOUND
    // ============================================
    {
        id: 'a1',
        category: 'brand',
        category_da: 'Brand Assets',
        category_en: 'Brand Assets',
        question: "Har I TV Syd 'Kaffe med Kurt' videoen?",
        question_en: "Do you have the TV Syd 'Kaffe med Kurt' video?",
        answer: "JA - Fundet på TV Syd's hjemmeside",
        answer_en: "YES - Found on TV Syd website",
        source: "https://www.tvsyd.dk/kaffe-med-kurt/kaffe-med-kurt-hattemanden",
        source_label: "TV Syd website"
    },
    {
        id: 'a2',
        category: 'brand',
        category_da: 'Brand Assets',
        category_en: 'Brand Assets',
        question: "Har I fotos af Svend Erik 'Pepino'?",
        question_en: "Do you have photos of Svend Erik 'Pepino'?",
        answer: "JA - Flere billeder fundet i uploads (hattemanden-pepino.jpg, pepino-brun.jpg, etc.)",
        answer_en: "YES - Multiple photos found in site uploads (hattemanden-pepino.jpg, pepino-brun.jpg, etc.)",
        source: "hattemanden.dk/om-hattemanden/",
        source_label: "Website uploads"
    },
    {
        id: 'a3',
        category: 'brand',
        category_da: 'Brand Assets',
        category_en: 'Brand Assets',
        question: "Hvad er Pepinos historie/baggrund?",
        question_en: "What is Pepino's story/background?",
        answer: "Startede 2000, import fra Sydamerika/USA, udvidet til Italien/England 2003, damehatte 2010",
        answer_en: "Started 2000, South America/USA imports, expanded to Italy/England 2003, women's hats 2010",
        source: "hattemanden.dk/om-hattemanden/",
        source_label: "'Om Hattemanden' page"
    },
    // ============================================
    // PRODUCTS - CONFIRMED
    // ============================================
    {
        id: 'a4',
        category: 'products',
        category_da: 'Produkter',
        category_en: 'Products',
        question: "Hvilke produkter skal fjernes?",
        question_en: "Which products should be removed?",
        answer: "20 ikke-hat produkter identificeret (kjoler, Hawaii skjorter, festtøj)",
        answer_en: "20 non-hat items identified (dresses, Hawaiian shirts, formal wear)",
        source: "Dashboard produktanalyse",
        source_label: "Dashboard analysis"
    },
    {
        id: 'a5',
        category: 'products',
        category_da: 'Produkter',
        category_en: 'Products',
        question: "Skal Chapeau Clarque beholdes?",
        question_en: "Keep Chapeau Clarque?",
        answer: "JA - Top sælger med 62.440 DKK i salg!",
        answer_en: "YES - Top seller at 62,440 DKK!",
        source: "Salgsdata",
        source_label: "Sales data"
    },
    {
        id: 'a6',
        category: 'products',
        category_da: 'Produkter',
        category_en: 'Products',
        question: "Deltager I i festivaler?",
        question_en: "Festival participation?",
        answer: "JA - Festival Hatte omsætning ~50K DKK",
        answer_en: "YES - Festival Hatte revenue ~50K DKK",
        source: "Produktsalgsdata",
        source_label: "Product sales data"
    },
    // ============================================
    // TECHNICAL - DOCUMENTED
    // ============================================
    {
        id: 'a7',
        category: 'technical',
        category_da: 'Teknisk',
        category_en: 'Technical',
        question: "Hvad er forsendelsespriserne?",
        question_en: "What are the shipping rates?",
        answer: "45 / 70 / 200 DKK (3 niveauer baseret på størrelse/vægt)",
        answer_en: "45 / 70 / 200 DKK (3 tiers based on size/weight)",
        source: "WooCommerce indstillinger",
        source_label: "WooCommerce settings"
    },
    {
        id: 'a8',
        category: 'technical',
        category_da: 'Teknisk',
        category_en: 'Technical',
        question: "Hvilke betalingsmetoder bruges?",
        question_en: "What payment methods are used?",
        answer: "Reepay: Visa, Mastercard, Apple Pay, Google Pay",
        answer_en: "Reepay: Visa, Mastercard, Apple Pay, Google Pay",
        source: "Integration audit",
        source_label: "Integration audit"
    },
    {
        id: 'a9',
        category: 'technical',
        category_da: 'Teknisk',
        category_en: 'Technical',
        question: "Er MobilePay aktiveret?",
        question_en: "Is MobilePay enabled?",
        answer: "NEJ - ikke i øjeblikket (konkurrenter har det)",
        answer_en: "NO - not currently (competitors have it)",
        source: "Integration audit",
        source_label: "Integration audit"
    },
    // ============================================
    // DESIGN - CONFIRMED
    // ============================================
    {
        id: 'a10',
        category: 'design',
        category_da: 'Design',
        category_en: 'Design',
        question: "Hvad er den ønskede designretning?",
        question_en: "What is the desired design direction?",
        answer: "Klassisk, vintage, Peaky Blinders æstetik",
        answer_en: "Classic, vintage, Peaky Blinders aesthetic",
        source: "Kundemøde",
        source_label: "Client meeting"
    },
    {
        id: 'a11',
        category: 'design',
        category_da: 'Design',
        category_en: 'Design',
        question: "Fokus kun på hatte?",
        question_en: "Focus on hats only?",
        answer: "JA - fjern tøj, behold kun hatte og tilbehør",
        answer_en: "YES - remove clothing, keep only hats and accessories",
        source: "Kundemøde",
        source_label: "Client meeting"
    },
    {
        id: 'a12',
        category: 'design',
        category_da: 'Design',
        category_en: 'Design',
        question: "Facebook side?",
        question_en: "Facebook page?",
        answer: "facebook.com/hattemanden",
        answer_en: "facebook.com/hattemanden",
        source: "Verificeret",
        source_label: "Verified"
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check auth first
    const authRequired = await checkAuth();
    if (authRequired) {
        return; // Auth modal is shown, wait for login
    }

    initializeApp();
});

async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/check`);
        const data = await res.json();

        if (data.required && !sessionStorage.getItem('dashboard_authenticated')) {
            showAuthModal();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';

    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('authPassword').value;

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem('dashboard_authenticated', 'true');
                modal.style.display = 'none';
                initializeApp();
            } else {
                document.getElementById('authError').textContent = data.error || 'Forkert adgangskode';
                document.getElementById('authError').style.display = 'block';
            }
        } catch (error) {
            document.getElementById('authError').textContent = 'Forbindelsesfejl';
            document.getElementById('authError').style.display = 'block';
        }
    });
}

function initializeApp() {
    initTabs();
    initSortableHeaders();
    checkConnection();
    loadOverview();
    loadAuditData();

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    document.getElementById('orderDateTo').value = formatDateInput(today);
    document.getElementById('orderDateFrom').value = formatDateInput(thirtyDaysAgo);

    // Set default date for progress entry
    const entryDateInput = document.getElementById('entryDate');
    if (entryDateInput) {
        entryDateInput.value = formatDateInput(today);
    }

    // Set website-only toggle to ON by default
    const websiteOnlyToggle = document.getElementById('websiteOnlyToggle');
    if (websiteOnlyToggle) {
        websiteOnlyToggle.checked = true;
        toggleWebsiteOnlyView();
    }
}

// Tab switching
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;

            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

            // Load data for tab if needed
            if (tabId === 'orders' && document.querySelector('#ordersTable tbody').innerHTML === '') {
                loadOrders();
            } else if (tabId === 'customers' && document.querySelector('#customersTable tbody').innerHTML === '') {
                loadCustomers();
            } else if (tabId === 'review' && reviewProducts.length === 0) {
                loadProductReview();
            } else if (tabId === 'questions') {
                loadQuestions();
            } else if (tabId === 'project') {
                loadProject();
            }
        });
    });
}

// Initialize sortable table headers (PRD-05, PRD-07, CUS-03, 15-01)
function initSortableHeaders() {
    // Review table sortable headers
    document.querySelectorAll('#reviewTable .sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (reviewSortColumn === column) {
                reviewSortDirection = reviewSortDirection === 'desc' ? 'asc' : 'desc';
            } else {
                reviewSortColumn = column;
                reviewSortDirection = 'desc';
            }
            // Reset dropdown to let column-based sorting take precedence
            const dropdown = document.getElementById('reviewSortBy');
            if (dropdown) dropdown.value = column;
            updateSortIndicators('#reviewTable', column, reviewSortDirection);
            renderReviewProducts();
        });
    });

    // Set initial sort indicators
    updateSortIndicators('#reviewTable', reviewSortColumn, reviewSortDirection);

    // Customers table sortable headers (CUS-03)
    document.querySelectorAll('#customersTable .sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (customersSortColumn === column) {
                customersSortDirection = customersSortDirection === 'desc' ? 'asc' : 'desc';
            } else {
                customersSortColumn = column;
                customersSortDirection = 'desc';
            }
            updateSortIndicators('#customersTable', customersSortColumn, customersSortDirection);
            sortAndRenderCustomers();
        });
    });

    // Orders table sortable headers (15-01)
    document.querySelectorAll('#ordersTable .sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (ordersSortColumn === column) {
                ordersSortDirection = ordersSortDirection === 'desc' ? 'asc' : 'desc';
            } else {
                ordersSortColumn = column;
                ordersSortDirection = 'desc';
            }
            updateSortIndicators('#ordersTable', ordersSortColumn, ordersSortDirection);
            sortAndRenderOrders();
        });
    });
}

function updateSortIndicators(tableSelector, activeColumn, direction) {
    document.querySelectorAll(`${tableSelector} .sortable`).forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (!icon) return; // Skip if no sort-icon element found
        if (th.dataset.sort === activeColumn) {
            icon.textContent = direction === 'desc' ? '▼' : '▲';
            th.classList.add('sorted');
        } else {
            icon.textContent = '';
            th.classList.remove('sorted');
        }
    });
}

// Connection check
async function checkConnection() {
    const statusEl = document.getElementById('connectionStatus');
    try {
        const res = await fetch(`${API_BASE}/api/status`);
        const data = await res.json();

        if (data.connected) {
            statusEl.className = 'connection-status connected';
            const statusText = statusEl.querySelector('.status-text');
            statusText.textContent = currentLanguage === 'da' ? 'Forbundet' : 'Connected';
            statusText.setAttribute('data-da', 'Forbundet');
            statusText.setAttribute('data-en', 'Connected');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        statusEl.className = 'connection-status error';
        const errorMsg = currentLanguage === 'da' ? 'Fejl: ' : 'Error: ';
        statusEl.querySelector('.status-text').textContent = errorMsg + error.message;
    }
}

// Overview
async function loadOverview() {
    try {
        // Load reports (use audit data for revenue since WC reports defaults to today only)
        const [auditData, orderTotals, customerTotals, productTotals, recentOrders] = await Promise.all([
            fetch(`${API_BASE}/api/audit`).then(r => r.json()),
            fetch(`${API_BASE}/api/reports/orders/totals`).then(r => r.json()),
            fetch(`${API_BASE}/api/reports/customers/totals`).then(r => r.json()),
            fetch(`${API_BASE}/api/reports/products/totals`).then(r => r.json()),
            fetch(`${API_BASE}/api/orders?per_page=5`).then(r => r.json())
        ]);

        // Update metrics - use audit data for total revenue (historical)
        if (auditData && auditData.salesStats) {
            document.getElementById('totalRevenue').textContent = formatCurrency(auditData.salesStats.totalRevenue);

            // Render channel distribution chart
            if (auditData.salesStats.channelDistribution) {
                renderChannelDistribution(auditData.salesStats.channelDistribution);
            }
        }

        if (orderTotals) {
            const total = orderTotals.reduce((sum, s) => sum + s.total, 0);
            document.getElementById('totalOrders').textContent = formatNumber(total);
            renderOrderStatusChart(orderTotals);
        }

        if (customerTotals) {
            const total = customerTotals.reduce((sum, s) => sum + s.total, 0);
            document.getElementById('totalCustomers').textContent = formatNumber(total);
        }

        if (productTotals) {
            const total = productTotals.reduce((sum, s) => sum + s.total, 0);
            document.getElementById('totalProducts').textContent = formatNumber(total);
        }

        // Recent orders
        if (recentOrders.orders) {
            renderRecentOrders(recentOrders.orders);
        }
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

function renderChannelDistribution(channelData) {
    const container = document.getElementById('channelDistributionChart');
    const maxRevenue = Math.max(...channelData.channels.map(c => c.revenue));

    container.innerHTML = channelData.channels.map(c => {
        const pct = (c.revenue / maxRevenue * 100).toFixed(1);
        return `
            <div class="chart-bar">
                <div class="chart-label">${c.name}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill channel-bar" style="width: ${pct}%"></div>
                </div>
                <div class="chart-value">${formatCurrency(c.revenue)}</div>
            </div>
        `;
    }).join('');

    // Set insight text
    const insightEl = document.getElementById('channelInsight');
    if (insightEl && channelData.insight) {
        insightEl.textContent = channelData.insight;
    }
}

function renderOrderStatusChart(data) {
    const container = document.getElementById('orderStatusChart');
    const total = data.reduce((sum, s) => sum + s.total, 0);

    const statusLabels = {
        'pending': currentLanguage === 'da' ? 'Afventer' : 'Pending',
        'processing': currentLanguage === 'da' ? 'Behandles' : 'Processing',
        'on-hold': currentLanguage === 'da' ? 'Afventer' : 'On hold',
        'completed': currentLanguage === 'da' ? 'Gennemført' : 'Completed',
        'cancelled': currentLanguage === 'da' ? 'Annulleret' : 'Cancelled',
        'refunded': currentLanguage === 'da' ? 'Refunderet' : 'Refunded',
        'failed': currentLanguage === 'da' ? 'Fejlet' : 'Failed'
    };

    container.innerHTML = data
        .filter(s => s.total > 0)
        .sort((a, b) => b.total - a.total)
        .map(s => {
            const pct = (s.total / total * 100).toFixed(1);
            return `
                <div class="chart-bar">
                    <div class="chart-label">${statusLabels[s.slug] || s.name}</div>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${pct}%"></div>
                    </div>
                    <div class="chart-value">${s.total}</div>
                </div>
            `;
        }).join('');
}

function renderRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${formatDate(order.date_created)}</td>
            <td>${order.billing.first_name} ${order.billing.last_name}</td>
            <td><span class="status status-${order.status}">${getStatusLabel(order.status)}</span></td>
            <td>${formatCurrency(order.total)}</td>
        </tr>
    `).join('');
}

// ============================================
// TAB 6: PRODUCT REVIEW
// ============================================

async function loadProductReview() {
    const tbody = document.getElementById('reviewTableBody');
    const loadingText = currentLanguage === 'da' ? 'Indlæser produkter...' : 'Loading products...';
    tbody.innerHTML = `<tr><td colspan="9" class="loading">${loadingText}</td></tr>`;

    try {
        // Load inventory and decisions in parallel
        const [inventoryRes, decisionsRes] = await Promise.all([
            fetch(`${API_BASE}/api/inventory`),
            fetch(`${API_BASE}/api/decisions`)
        ]);

        const inventory = await inventoryRes.json();
        const decisionsData = await decisionsRes.json();

        reviewProducts = inventory.products || [];
        reviewDecisions = decisionsData.decisions || {};

        // Apply smart defaults
        reviewProducts.forEach(p => {
            if (!reviewDecisions[p.id]) {
                reviewDecisions[p.id] = { decision: getDefaultDecision(p) };
            }
        });

        // Populate category filter
        populateReviewCategoryFilter();

        // Render products
        renderReviewProducts();
        updateReviewSummary();

    } catch (error) {
        console.error('Error loading product review:', error);
        const errorText = currentLanguage === 'da'
            ? `Fejl: ${error.message}. Kør extract-products.js først.`
            : `Error: ${error.message}. Run extract-products.js first.`;
        tbody.innerHTML = `<tr><td colspan="9">${errorText}</td></tr>`;
    }
}

function getDefaultDecision(product) {
    // Chapeau Clarque (ID 177) - top product, always keep
    if (product.id === 177) return 'keep';

    // Flagged for removal (non-hat products)
    if (product.flaggedForRemoval) {
        if (product.totalRevenue === 0) return 'remove';
        if (product.totalRevenue > 0) return 'undecided';
    }

    // Hat products default to undecided
    return 'undecided';
}

function populateReviewCategoryFilter() {
    // Filter out empty/undefined categories (PRD-03)
    // Inventory data uses 'categories' array, flatten all product categories
    const allCategories = reviewProducts.flatMap(p =>
        Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : [])
    );
    const categories = [...new Set(allCategories)]
        .filter(c => c && c !== '' && c !== 'undefined' && c !== 'null' && c !== 'Uncategorized' && c !== 'Ukategoriseret')
        .sort();
    const select = document.getElementById('reviewCategoryFilter');
    select.innerHTML = '<option value="">Alle</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function filterReviewProducts() {
    renderReviewProducts();
    updateReviewSummary();
}

function renderReviewProducts() {
    const tbody = document.getElementById('reviewTableBody');

    // Get filter values
    const categoryFilter = document.getElementById('reviewCategoryFilter').value;
    const decisionFilter = document.getElementById('reviewDecisionFilter').value;
    const salesFilter = document.getElementById('reviewSalesFilter').value;
    const sortBy = document.getElementById('reviewSortBy').value;

    // Filter products
    let filtered = reviewProducts.filter(p => {
        // Handle both 'categories' array and 'category' string formats
        const productCategories = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
        if (categoryFilter && !productCategories.includes(categoryFilter)) return false;
        if (decisionFilter && reviewDecisions[p.id]?.decision !== decisionFilter) return false;
        if (salesFilter === 'has-sales' && p.unitsSold === 0) return false;
        if (salesFilter === 'no-sales' && p.unitsSold > 0) return false;
        return true;
    });

    // Sort products
    filtered = sortReviewProducts(filtered, sortBy);

    // Get top 10 by revenue for highlighting
    const top10Ids = new Set(
        [...reviewProducts]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10)
            .map(p => p.id)
    );

    // Render
    tbody.innerHTML = filtered.map(p => {
        const decision = reviewDecisions[p.id]?.decision || 'undecided';
        const rowClasses = [];

        // Visual cues
        if (p.unitsSold === 0) rowClasses.push('no-sales');
        if (top10Ids.has(p.id)) rowClasses.push('top-seller');

        // Tags/badges
        const tags = [];
        if (p.flaggedForRemoval) tags.push(`<span class="badge badge-ikke-hatte">${currentLanguage === 'da' ? 'Ikke hatte' : 'Non-hats'}</span>`);
        if (p.name.toLowerCase().includes('pepino')) tags.push(`<span class="badge badge-arv">${currentLanguage === 'da' ? 'Arv' : 'Legacy'}</span>`);
        if (top10Ids.has(p.id)) tags.push('<span class="badge badge-top">Top 10</span>');

        // Check for valid image URL (PRD-02) - use featuredImage field from inventory data
        const imageUrl = p.featuredImage || p.image || '';
        const hasValidImage = imageUrl && imageUrl !== '' && !imageUrl.includes('placeholder') && !imageUrl.includes('woocommerce-placeholder');

        // Get category - inventory data uses 'categories' array, not 'category' string
        const categoryDisplay = Array.isArray(p.categories) ? p.categories[0] : (p.category || '-');

        return `
            <tr class="product-row ${rowClasses.join(' ')}" data-id="${p.id}">
                <td>
                    ${hasValidImage
                        ? `<img src="${imageUrl}" class="product-image" alt="${p.name}" onerror="this.outerHTML='<div class=\\'product-image no-image\\'></div>'">`
                        : '<div class="product-image no-image"></div>'}
                </td>
                <td><strong>${p.name}</strong></td>
                <td>${categoryDisplay}</td>
                <td>${p.price ? formatCurrency(p.price) : '-'}</td>
                <td>${p.unitsSold}</td>
                <td><strong>${formatCurrency(p.totalRevenue)}</strong></td>
                <td>${p.lastSold ? p.lastSold : (p.unitsSold > 0 ? '-' : (currentLanguage === 'da' ? 'Aldrig' : 'Never'))}</td>
                <td>${tags.join(' ')}</td>
                <td>
                    <div class="decision-checkmarks">
                        <button class="check-btn check-keep ${decision === 'keep' ? 'active' : ''}"
                                onclick="toggleDecision(${p.id}, 'keep')" title="${currentLanguage === 'da' ? 'Behold' : 'Keep'}">
                            <span class="check-icon">✓</span>
                        </button>
                        <button class="check-btn check-remove ${decision === 'remove' ? 'active' : ''}"
                                onclick="toggleDecision(${p.id}, 'remove')" title="${currentLanguage === 'da' ? 'Fjern' : 'Remove'}">
                            <span class="check-icon">✗</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (filtered.length === 0) {
        const noMatchText = currentLanguage === 'da' ? 'Ingen produkter matcher filteret' : 'No products match the filter';
        tbody.innerHTML = `<tr><td colspan="9">${noMatchText}</td></tr>`;
    }
}

function sortReviewProducts(products, sortBy) {
    const sorted = [...products];
    // Fix: desc should be 1 (natural b-a order), asc should be -1 (inverted a-b order)
    const dir = reviewSortDirection === 'desc' ? 1 : -1;

    // Support both dropdown values and column-based sorting
    // Column-based sorting uses reviewSortColumn state variable
    const column = sortBy || reviewSortColumn;

    switch (column) {
        case 'revenue':
        case 'revenue-desc':
            return sorted.sort((a, b) => dir * (b.totalRevenue - a.totalRevenue));
        case 'units':
        case 'units-desc':
            return sorted.sort((a, b) => dir * (b.unitsSold - a.unitsSold));
        case 'name':
        case 'name-asc':
            return sorted.sort((a, b) => dir * a.name.localeCompare(b.name, 'da'));
        case 'price':
        case 'price-desc':
            return sorted.sort((a, b) => dir * ((b.price || 0) - (a.price || 0)));
        case 'last-sold':
            return sorted.sort((a, b) => {
                if (!a.lastSold) return 1;
                if (!b.lastSold) return -1;
                return dir * (new Date(b.lastSold) - new Date(a.lastSold));
            });
        default:
            return sorted;
    }
}

async function saveDecision(productId, decision) {
    // Update local state
    reviewDecisions[productId] = { decision, updatedAt: new Date().toISOString() };

    updateReviewSummary();

    // Save to server
    try {
        await fetch(`${API_BASE}/api/products/${productId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision })
        });
    } catch (error) {
        console.error('Error saving decision:', error);
    }

    // Also save to localStorage as backup
    localStorage.setItem('hattemanden_decisions', JSON.stringify(reviewDecisions));
}

// Toggle decision with checkmark buttons (PRD-01)
function toggleDecision(productId, action) {
    const current = reviewDecisions[productId]?.decision || 'undecided';
    const newDecision = current === action ? 'undecided' : action;

    // Update button states in DOM
    const row = document.querySelector(`tr[data-id="${productId}"]`);
    if (row) {
        row.querySelector('.check-keep').classList.toggle('active', newDecision === 'keep');
        row.querySelector('.check-remove').classList.toggle('active', newDecision === 'remove');
    }

    // Save the decision
    saveDecision(productId, newDecision);
}

function updateReviewSummary() {
    let total = 0, keep = 0, remove = 0, undecided = 0;
    let keepRevenue = 0, removeRevenue = 0;

    reviewProducts.forEach(p => {
        const decision = reviewDecisions[p.id]?.decision || 'undecided';
        total++;

        switch (decision) {
            case 'keep':
                keep++;
                keepRevenue += p.totalRevenue || 0;
                break;
            case 'remove':
                remove++;
                removeRevenue += p.totalRevenue || 0;
                break;
            default:
                undecided++;
        }
    });

    document.getElementById('reviewTotal').textContent = total;
    document.getElementById('reviewKeep').textContent = keep;
    document.getElementById('reviewRemove').textContent = remove;
    document.getElementById('reviewUndecided').textContent = undecided;
    document.getElementById('reviewKeepRevenue').textContent = formatCurrency(keepRevenue).replace(' DKK', '');
    document.getElementById('reviewRemoveRevenue').textContent = formatCurrency(removeRevenue).replace(' DKK', '');
}

function exportDecisions() {
    const headers = ['ID', 'Produkt', 'Kategori', 'Pris', 'Solgt', 'Omsaetning', 'Beslutning'];
    const rows = reviewProducts.map(p => [
        p.id,
        `"${p.name}"`,
        p.category,
        p.price || 0,
        p.unitsSold,
        p.totalRevenue,
        reviewDecisions[p.id]?.decision || 'undecided'
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csv, 'produktbeslutninger.csv');
}

// ============================================
// TAB 7: QUESTIONS
// ============================================

async function loadQuestions() {
    const container = document.getElementById('questionsContainer');

    // Load saved answers
    let savedAnswers = {};
    try {
        const res = await fetch(`${API_BASE}/api/answers`);
        const data = await res.json();
        savedAnswers = data.answers || {};
    } catch (error) {
        // Fall back to localStorage
        const stored = localStorage.getItem('hattemanden_answers');
        if (stored) savedAnswers = JSON.parse(stored);
    }

    // Group questions by priority
    const priorityGroups = {
        critical: QUESTIONS.filter(q => q.priority === 'critical'),
        important: QUESTIONS.filter(q => q.priority === 'important'),
        nice: QUESTIONS.filter(q => q.priority === 'nice')
    };

    // Priority section config
    const priorityConfig = {
        critical: {
            icon: '🔴',
            labelDa: 'Kritisk',
            labelEn: 'Critical',
            descDa: 'Nødvendigt for at færdiggøre forslaget',
            descEn: 'Required to finalize the proposal'
        },
        important: {
            icon: '🟡',
            labelDa: 'Vigtigt',
            labelEn: 'Important',
            descDa: 'Forbedrer forslaget væsentligt',
            descEn: 'Significantly improves the proposal'
        },
        nice: {
            icon: '🟢',
            labelDa: 'Godt at vide',
            labelEn: 'Nice to Have',
            descDa: 'Forbedrer kvaliteten',
            descEn: 'Improves quality'
        }
    };

    // Render question card helper
    const renderQuestionCard = (q, savedAnswers) => {
        const answer = savedAnswers[q.id]?.answer || '';
        const hasAnswer = answer.trim().length > 0;
        const savedStatus = hasAnswer
            ? `<span class="status-saved" data-da="&#10003; Gemt" data-en="&#10003; Saved">&#10003; ${currentLanguage === 'en' ? 'Saved' : 'Gemt'}</span>`
            : '';
        const config = priorityConfig[q.priority];
        const priorityLabel = currentLanguage === 'en' ? config.labelEn : config.labelDa;

        return `
            <div class="card question-card ${hasAnswer ? 'answered' : ''}" data-id="${q.id}" data-priority="${q.priority}">
                <div class="question-number">${q.id}</div>
                <div class="question-content">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <p class="question-text" style="margin: 0; flex: 1;" data-da="${q.question}" data-en="${q.question_en}">${currentLanguage === 'en' ? q.question_en : q.question}</p>
                        <span class="question-priority ${q.priority}" data-da="${config.labelDa}" data-en="${config.labelEn}">${priorityLabel}</span>
                    </div>
                    <div class="question-why" onclick="toggleQuestionWhy(this)">
                        <span class="why-toggle" data-da="Hvorfor er dette vigtigt? &#9660;" data-en="Why is this important? &#9660;">${currentLanguage === 'en' ? 'Why is this important?' : 'Hvorfor er dette vigtigt?'} &#9660;</span>
                        <p class="why-content" style="display: none;" data-da="${q.why}" data-en="${q.why_en}">${currentLanguage === 'en' ? q.why_en : q.why}</p>
                    </div>
                    <textarea
                        class="question-textarea"
                        id="answer-${q.id}"
                        placeholder="${currentLanguage === 'en' ? 'Write your answer here...' : 'Skriv dit svar her...'}"
                        data-da-placeholder="Skriv dit svar her..."
                        data-en-placeholder="Write your answer here..."
                        rows="3"
                    >${answer}</textarea>
                    <div class="question-actions">
                        <button class="btn btn-small" onclick="saveAnswer(${q.id})" data-da="Gem svar" data-en="Save answer">${currentLanguage === 'en' ? 'Save answer' : 'Gem svar'}</button>
                        <span class="save-status" id="status-${q.id}">
                            ${savedStatus}
                        </span>
                    </div>
                </div>
            </div>
        `;
    };

    // Render section header helper
    const renderSectionHeader = (priority, count, answeredCount) => {
        const config = priorityConfig[priority];
        const label = currentLanguage === 'en' ? config.labelEn : config.labelDa;
        const desc = currentLanguage === 'en' ? config.descEn : config.descDa;
        const countText = currentLanguage === 'en'
            ? `${answeredCount}/${count} answered`
            : `${answeredCount}/${count} besvaret`;

        return `
            <div class="priority-section-header" data-priority="${priority}">
                <span class="priority-icon">${config.icon}</span>
                <h3 data-da="${config.labelDa}" data-en="${config.labelEn}">${label}</h3>
                <span style="color: var(--text-muted); font-size: var(--text-sm);" data-da="${config.descDa}" data-en="${config.descEn}">${desc}</span>
                <span class="priority-count" data-da="${answeredCount}/${count} besvaret" data-en="${answeredCount}/${count} answered">${countText}</span>
            </div>
        `;
    };

    // ============================================
    // SECTION 1: Already Answered Questions (Research Findings)
    // ============================================

    // Group answered questions by category
    const answeredCategories = {};
    ANSWERED_QUESTIONS.forEach(q => {
        if (!answeredCategories[q.category]) {
            answeredCategories[q.category] = {
                label_da: q.category_da,
                label_en: q.category_en,
                questions: []
            };
        }
        answeredCategories[q.category].questions.push(q);
    });

    // Render answered question card (read-only with source link)
    const renderAnsweredCard = (q) => {
        const question = currentLanguage === 'en' ? q.question_en : q.question;
        const answer = currentLanguage === 'en' ? q.answer_en : q.answer;
        const sourceLink = q.source.startsWith('http')
            ? `<a href="${q.source}" target="_blank" rel="noopener">${q.source_label}</a>`
            : `<span>${q.source_label}</span>`;

        return `
            <div class="answered-question-card" data-id="${q.id}">
                <div class="answered-question-row">
                    <span class="answered-check">✓</span>
                    <div class="answered-content">
                        <p class="answered-question">${question}</p>
                        <p class="answered-answer">${answer}</p>
                        <p class="answered-source">${currentLanguage === 'en' ? 'Source' : 'Kilde'}: ${sourceLink}</p>
                    </div>
                </div>
            </div>
        `;
    };

    // Build answered section HTML
    let answeredHtml = `
        <div class="card answered-questions-section collapsible-card">
            <div class="card-header collapsible-header" onclick="toggleQuestionsCollapsible(this)">
                <div class="answered-header-content">
                    <span class="answered-badge">✓ ${ANSWERED_QUESTIONS.length}</span>
                    <h2 data-da="Allerede Besvaret (Vores Research)" data-en="Already Answered (Our Research)">${currentLanguage === 'en' ? 'Already Answered (Our Research)' : 'Allerede Besvaret (Vores Research)'}</h2>
                </div>
                <span class="collapse-icon">▶</span>
            </div>
            <div class="collapsible-content" style="display: none;">
                <p class="answered-intro" data-da="Disse spørgsmål har vi allerede fundet svar på gennem vores research. Gennemgå venligst og ret os hvis noget er forkert." data-en="We found answers to these questions through our research. Please review and correct us if anything is wrong.">${currentLanguage === 'en' ? 'We found answers to these questions through our research. Please review and correct us if anything is wrong.' : 'Disse spørgsmål har vi allerede fundet svar på gennem vores research. Gennemgå venligst og ret os hvis noget er forkert.'}</p>
    `;

    // Add each category
    for (const [, data] of Object.entries(answeredCategories)) {
        const categoryLabel = currentLanguage === 'en' ? data.label_en : data.label_da;
        answeredHtml += `
            <div class="answered-category">
                <h3 class="answered-category-title">${categoryLabel}</h3>
                ${data.questions.map(q => renderAnsweredCard(q)).join('')}
            </div>
        `;
    }

    answeredHtml += `
            </div>
        </div>
    `;

    // ============================================
    // SECTION 2: Remaining Questions (Need Kim's Input)
    // ============================================

    // Build remaining questions HTML
    let remainingHtml = `
        <div class="card remaining-questions-section collapsible-card">
            <div class="card-header collapsible-header" onclick="toggleQuestionsCollapsible(this)">
                <div class="remaining-header-content">
                    <span class="remaining-badge">${QUESTIONS.length}</span>
                    <h2 data-da="Spørgsmål der Mangler Svar" data-en="Questions Needing Answers">${currentLanguage === 'en' ? 'Questions Needing Answers' : 'Spørgsmål der Mangler Svar'}</h2>
                </div>
                <span class="collapse-icon">▼</span>
            </div>
            <div class="collapsible-content">
    `;

    for (const [priority, questions] of Object.entries(priorityGroups)) {
        if (questions.length === 0) continue;

        const answeredCount = questions.filter(q => {
            const answer = savedAnswers[q.id]?.answer || '';
            return answer.trim().length > 0;
        }).length;

        remainingHtml += renderSectionHeader(priority, questions.length, answeredCount);
        remainingHtml += questions.map(q => renderQuestionCard(q, savedAnswers)).join('');
    }

    remainingHtml += `
            </div>
        </div>
    `;

    // Combine both sections
    container.innerHTML = answeredHtml + remainingHtml;

    // Update progress bar
    updateQuestionsProgress(savedAnswers);
}

// Toggle collapsible sections in Questions tab
function toggleQuestionsCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.innerHTML = '▼';
        header.classList.add('expanded');
    } else {
        content.style.display = 'none';
        icon.innerHTML = '▶';
        header.classList.remove('expanded');
    }
}

function toggleQuestionWhy(element) {
    const content = element.querySelector('.why-content');
    const toggle = element.querySelector('.why-toggle');
    const isOpen = content.style.display !== 'none';
    const labelDa = isOpen ? 'Hvorfor er dette vigtigt? &#9660;' : 'Hvorfor er dette vigtigt? &#9650;';
    const labelEn = isOpen ? 'Why is this important? &#9660;' : 'Why is this important? &#9650;';

    content.style.display = isOpen ? 'none' : 'block';
    toggle.innerHTML = currentLanguage === 'en' ? labelEn : labelDa;
    toggle.setAttribute('data-da', labelDa);
    toggle.setAttribute('data-en', labelEn);
}

async function saveAnswer(questionId) {
    const textarea = document.getElementById(`answer-${questionId}`);
    const answer = textarea.value.trim();
    const statusEl = document.getElementById(`status-${questionId}`);
    const card = document.querySelector(`.question-card[data-id="${questionId}"]`);

    const savingText = currentLanguage === 'en' ? 'Saving...' : 'Gemmer...';
    statusEl.innerHTML = `<span class="status-saving" data-da="Gemmer..." data-en="Saving...">${savingText}</span>`;

    try {
        // Save to server
        await fetch(`${API_BASE}/api/questions/${questionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer })
        });

        const savedText = currentLanguage === 'en' ? '&#10003; Saved' : '&#10003; Gemt';
        statusEl.innerHTML = `<span class="status-saved" data-da="&#10003; Gemt" data-en="&#10003; Saved">${savedText}</span>`;

        // Update card styling
        if (answer.length > 0) {
            card.classList.add('answered');
        } else {
            card.classList.remove('answered');
        }

        // Update progress
        const answers = await fetch(`${API_BASE}/api/answers`).then(r => r.json());
        updateQuestionsProgress(answers.answers || {});

    } catch (error) {
        console.error('Error saving answer:', error);
        const errorText = currentLanguage === 'en' ? 'Error saving' : 'Fejl ved gem';
        statusEl.innerHTML = `<span class="status-error" data-da="Fejl ved gem" data-en="Error saving">${errorText}</span>`;

        // Save to localStorage as backup
        const stored = JSON.parse(localStorage.getItem('hattemanden_answers') || '{}');
        stored[questionId] = { answer };
        localStorage.setItem('hattemanden_answers', JSON.stringify(stored));
    }
}

function updateQuestionsProgress(answers) {
    const total = QUESTIONS.length;
    const answered = Object.values(answers).filter(a => a.answer && a.answer.trim().length > 0).length;
    const pct = (answered / total * 100).toFixed(0);

    document.getElementById('questionsAnswered').textContent = answered;
    document.getElementById('questionsTotal').textContent = total;
    document.getElementById('questionsProgressBar').style.width = `${pct}%`;
}

// ============================================
// TAB 8: PROJECT
// ============================================

async function loadProject() {
    try {
        const res = await fetch(`${API_BASE}/api/progress`);
        const data = await res.json();

        // Load milestones
        if (data.milestones) {
            Object.entries(data.milestones).forEach(([key, completed]) => {
                const checkbox = document.querySelector(`input[data-milestone="${key}"]`);
                if (checkbox) {
                    checkbox.checked = completed;
                }
            });
        }

        // Render progress log
        renderProgressLog(data.entries || []);

        // Set up milestone listeners
        document.querySelectorAll('input[data-milestone]').forEach(cb => {
            cb.addEventListener('change', () => toggleMilestone(cb.dataset.milestone, cb.checked));
        });

    } catch (error) {
        console.error('Error loading project:', error);
    }
}

function renderProgressLog(entries) {
    const container = document.getElementById('progressLog');

    if (entries.length === 0) {
        const emptyText = currentLanguage === 'da' ? 'Ingen poster endnu' : 'No entries yet';
        container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
        return;
    }

    container.innerHTML = entries.map(e => `
        <div class="log-entry log-category-${e.category}">
            <div class="log-date">${e.date}</div>
            <div class="log-category">${capitalizeFirst(e.category)}</div>
            <div class="log-text">${e.text}</div>
        </div>
    `).join('');
}

function toggleAddEntryForm() {
    const form = document.getElementById('addEntryForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function addProgressEntry() {
    const date = document.getElementById('entryDate').value;
    const category = document.getElementById('entryCategory').value;
    const text = document.getElementById('entryText').value.trim();

    if (!date || !category || !text) {
        alert(currentLanguage === 'da' ? 'Udfyld venligst alle felter' : 'Please fill in all fields');
        return;
    }

    try {
        await fetch(`${API_BASE}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, category, text })
        });

        // Clear form
        document.getElementById('entryText').value = '';
        document.getElementById('addEntryForm').style.display = 'none';

        // Reload log
        loadProject();

    } catch (error) {
        console.error('Error adding entry:', error);
        alert('Fejl ved gem af post');
    }
}

async function toggleMilestone(milestone, completed) {
    try {
        await fetch(`${API_BASE}/api/progress/milestone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ milestone, completed })
        });
    } catch (error) {
        console.error('Error updating milestone:', error);
    }
}

// Collapsible sections
function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.innerHTML = '&#9660;';
        header.classList.add('expanded');
    } else {
        content.style.display = 'none';
        icon.innerHTML = '&#9654;';
        header.classList.remove('expanded');
    }
}

// Expand all proposal sections
function expandAllSections() {
    const proposalSection = document.getElementById('proposal');
    const headers = proposalSection.querySelectorAll('.collapsible-header');

    headers.forEach(header => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');
        if (content && content.classList.contains('collapsible-content')) {
            content.style.display = 'block';
            if (icon) icon.innerHTML = '&#9660;';
            header.classList.add('expanded');
        }
    });
}

// Collapse all proposal sections
function collapseAllSections() {
    const proposalSection = document.getElementById('proposal');
    const headers = proposalSection.querySelectorAll('.collapsible-header');

    headers.forEach(header => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.collapse-icon');
        if (content && content.classList.contains('collapsible-content')) {
            content.style.display = 'none';
            if (icon) icon.innerHTML = '&#9654;';
            header.classList.remove('expanded');
        }
    });
}

// Orders
async function loadOrders(page = 1) {
    currentOrdersPage = page;
    const tbody = document.querySelector('#ordersTable tbody');
    const loadingOrdersText = currentLanguage === 'da' ? 'Indlæser ordrer...' : 'Loading orders...';
    tbody.innerHTML = `<tr><td colspan="8" class="loading">${loadingOrdersText}</td></tr>`;

    try {
        const params = new URLSearchParams({
            per_page: 20,
            page: page
        });

        const dateFrom = document.getElementById('orderDateFrom').value;
        const dateTo = document.getElementById('orderDateTo').value;
        const status = document.getElementById('orderStatusFilter').value;

        if (dateFrom) params.append('after', new Date(dateFrom).toISOString());
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59);
            params.append('before', toDate.toISOString());
        }
        if (status) params.append('status', status);

        const res = await fetch(`${API_BASE}/api/orders?${params}`);
        const data = await res.json();

        ordersData = data.orders;
        document.getElementById('ordersCount').textContent = data.total;

        // Render orders table (uses renderOrdersTable for sorting support)
        renderOrdersTable();

        renderPagination('ordersPagination', data.total, data.totalPages, page, loadOrders);
    } catch (error) {
        const errorPrefix = currentLanguage === 'da' ? 'Fejl' : 'Error';
        tbody.innerHTML = `<tr><td colspan="8">${errorPrefix}: ${error.message}</td></tr>`;
    }
}

// Render orders table (15-01)
function renderOrdersTable() {
    const tbody = document.querySelector('#ordersTable tbody');

    tbody.innerHTML = ordersData.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${formatDate(order.date_created)}</td>
            <td>${order.billing.first_name} ${order.billing.last_name}</td>
            <td>${order.billing.email}</td>
            <td><span class="status status-${order.status}">${getStatusLabel(order.status)}</span></td>
            <td>${order.payment_method_title || '-'}</td>
            <td><strong>${formatCurrency(order.total)}</strong></td>
            <td><button class="btn btn-small btn-secondary" onclick="showOrderDetail(${order.id})">${currentLanguage === 'da' ? 'Vis' : 'View'}</button></td>
        </tr>
    `).join('');
}

// Sort and render orders (15-01)
function sortAndRenderOrders() {
    if (!ordersSortColumn || ordersData.length === 0) {
        renderOrdersTable();
        return;
    }

    const sorted = [...ordersData].sort((a, b) => {
        let aVal, bVal;

        switch (ordersSortColumn) {
            case 'id':
                aVal = a.id;
                bVal = b.id;
                break;
            case 'date':
                aVal = new Date(a.date_created || 0);
                bVal = new Date(b.date_created || 0);
                break;
            case 'customer':
                aVal = `${a.billing.first_name} ${a.billing.last_name}`.toLowerCase();
                bVal = `${b.billing.first_name} ${b.billing.last_name}`.toLowerCase();
                break;
            case 'status':
                aVal = (a.status || '').toLowerCase();
                bVal = (b.status || '').toLowerCase();
                break;
            case 'total':
                aVal = parseFloat(a.total) || 0;
                bVal = parseFloat(b.total) || 0;
                break;
            default:
                return 0;
        }

        // Handle string comparison
        if (typeof aVal === 'string') {
            const cmp = aVal.localeCompare(bVal);
            return ordersSortDirection === 'desc' ? -cmp : cmp;
        }

        // Handle numeric/date comparison
        if (ordersSortDirection === 'desc') {
            return bVal - aVal;
        }
        return aVal - bVal;
    });

    ordersData = sorted;
    renderOrdersTable();
}

async function showOrderDetail(orderId) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderModalContent');
    const loadingOrderText = currentLanguage === 'da' ? 'Indlæser ordre...' : 'Loading order...';
    content.innerHTML = `<div class="loading">${loadingOrderText}</div>`;
    modal.classList.add('active');

    try {
        const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
        const order = await res.json();

        // Translations for order modal
        const t = {
            order: currentLanguage === 'da' ? 'Ordre' : 'Order',
            orderInfo: currentLanguage === 'da' ? 'Ordre Info' : 'Order Info',
            date: currentLanguage === 'da' ? 'Dato' : 'Date',
            payment: currentLanguage === 'da' ? 'Betaling' : 'Payment',
            customer: currentLanguage === 'da' ? 'Kunde' : 'Customer',
            name: currentLanguage === 'da' ? 'Navn' : 'Name',
            phone: currentLanguage === 'da' ? 'Telefon' : 'Phone',
            address: currentLanguage === 'da' ? 'Adresse' : 'Address',
            products: currentLanguage === 'da' ? 'Produkter' : 'Products',
            totals: currentLanguage === 'da' ? 'Totaler' : 'Totals',
            shipping: currentLanguage === 'da' ? 'Fragt' : 'Shipping'
        };

        content.innerHTML = `
            <h2>${t.order} #${order.id}</h2>

            <div class="modal-section">
                <h3>${t.orderInfo}</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="info-label">Status</span>
                        <span class="status status-${order.status}">${getStatusLabel(order.status)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.date}</span>
                        <span class="info-value">${formatDateTime(order.date_created)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.payment}</span>
                        <span class="info-value">${order.payment_method_title || '-'}</span>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>${t.customer}</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="info-label">${t.name}</span>
                        <span class="info-value">${order.billing.first_name} ${order.billing.last_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${order.billing.email}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.phone}</span>
                        <span class="info-value">${order.billing.phone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.address}</span>
                        <span class="info-value">${order.billing.address_1}, ${order.billing.postcode} ${order.billing.city}</span>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>${t.products}</h3>
                <div class="order-items">
                    ${order.line_items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>${formatCurrency(item.total)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="modal-section">
                <h3>${t.totals}</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="info-label">Subtotal</span>
                        <span class="info-value">${formatCurrency(order.line_items.reduce((sum, i) => sum + parseFloat(i.subtotal), 0))}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.shipping}</span>
                        <span class="info-value">${formatCurrency(order.shipping_total)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label"><strong>Total</strong></span>
                        <span class="info-value"><strong>${formatCurrency(order.total)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        const errorPrefix = currentLanguage === 'da' ? 'Fejl' : 'Error';
        content.innerHTML = `<p>${errorPrefix}: ${error.message}</p>`;
    }
}

function exportOrders() {
    if (!ordersData.length) {
        alert(currentLanguage === 'da' ? 'Ingen ordrer at eksportere' : 'No orders to export');
        return;
    }

    const headers = currentLanguage === 'da'
        ? ['Ordre', 'Dato', 'Kunde', 'Email', 'Status', 'Betaling', 'Total']
        : ['Order', 'Date', 'Customer', 'Email', 'Status', 'Payment', 'Total'];
    const rows = ordersData.map(o => [
        o.id,
        formatDate(o.date_created),
        `${o.billing.first_name} ${o.billing.last_name}`,
        o.billing.email,
        o.status,
        o.payment_method_title || '',
        o.total
    ]);

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csv, 'ordrer.csv');
}

// Customers
async function loadCustomers(page = 1) {
    currentCustomersPage = page;
    const tbody = document.querySelector('#customersTable tbody');
    const loadingCustomersText = currentLanguage === 'da' ? 'Indlæser kunder...' : 'Loading customers...';
    tbody.innerHTML = `<tr><td colspan="7" class="loading">${loadingCustomersText}</td></tr>`;

    try {
        const params = new URLSearchParams({
            per_page: 20,
            page: page
        });

        const search = document.getElementById('customerSearch').value;
        if (search) params.append('search', search);

        const res = await fetch(`${API_BASE}/api/customers?${params}`);
        const data = await res.json();

        document.getElementById('customersCount').textContent = data.total;

        // Fetch orders for ALL customers to get accurate order counts and last purchase dates
        // WooCommerce orders_count field is often unreliable (0 for guest-then-registered customers)
        // Pass email to also find guest orders placed with the same email
        const orderPromises = data.customers.map(c => {
            const emailParam = c.email ? `?email=${encodeURIComponent(c.email)}` : '';
            return fetch(`${API_BASE}/api/customers/${c.id}/orders${emailParam}`)
                .then(r => {
                    if (!r.ok) {
                        console.warn(`Failed to fetch orders for customer ${c.id}: ${r.status}`);
                        return { orders: [] };
                    }
                    return r.json();
                })
                .then(ordersData => {
                    const orders = ordersData.orders || [];
                    const total = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
                    // Get most recent order date
                    const lastPurchase = orders.length > 0
                        ? orders.reduce((latest, o) => {
                            const orderDate = new Date(o.date_created);
                            return orderDate > latest ? orderDate : latest;
                        }, new Date(0))
                        : null;
                    return {
                        customerId: c.id,
                        ordersCount: orders.length,
                        total: total,
                        lastPurchase: lastPurchase
                    };
                })
                .catch(err => {
                    console.warn(`Error fetching orders for customer ${c.id}:`, err);
                    return { customerId: c.id, ordersCount: 0, total: 0, lastPurchase: null };
                });
        });

        const orderResults = await Promise.all(orderPromises);
        const resultsMap = {};
        orderResults.forEach(r => { resultsMap[r.customerId] = r; });

        // Update customers with calculated order counts, totals, and last purchase dates
        data.customers.forEach(c => {
            const result = resultsMap[c.id];
            if (result) {
                // Use fetched order count (more accurate than API's orders_count)
                c.orders_count = result.ordersCount;
                // Only override total if the customer had zero total_spent
                if (!c.total_spent || parseFloat(c.total_spent) === 0) {
                    c.calculated_total = result.total;
                }
                c.last_purchase = result.lastPurchase;
            }
        });

        // Store data for sorting (CUS-03)
        customersData = data.customers;

        // Render customers (uses sortAndRenderCustomers for sorting support)
        renderCustomersTable();

        if (data.customers.length === 0) {
            const tbody = document.querySelector('#customersTable tbody');
            const noCustomersText = currentLanguage === 'da' ? 'Ingen kunder fundet' : 'No customers found';
            tbody.innerHTML = `<tr><td colspan="7">${noCustomersText}</td></tr>`;
        }

        renderPagination('customersPagination', data.total, data.totalPages, page, loadCustomers);
    } catch (error) {
        const errorPrefix = currentLanguage === 'da' ? 'Fejl' : 'Error';
        tbody.innerHTML = `<tr><td colspan="7">${errorPrefix}: ${error.message}</td></tr>`;
    }
}

// Render customers table (CUS-03)
function renderCustomersTable() {
    const tbody = document.querySelector('#customersTable tbody');

    tbody.innerHTML = customersData.map(customer => {
        const orderCount = customer.orders_count || 0;
        const totalSpent = customer.calculated_total || customer.total_spent || 0;
        const orderBadgeClass = orderCount > 0 ? 'order-count-badge' : 'order-count-badge zero-orders';
        const lastPurchase = customer.last_purchase ? formatDate(customer.last_purchase) : '-';

        const ordersWord = currentLanguage === 'da' ? 'ordrer' : 'orders';
        const viewHint = currentLanguage === 'da' ? 'Klik for ordrer →' : 'Click for orders →';

        return `
            <tr class="customer-row clickable" onclick="showCustomerDetail(${customer.id})" data-customer-id="${customer.id}">
                <td>
                    <strong>${customer.first_name} ${customer.last_name}</strong>
                </td>
                <td>${customer.email}</td>
                <td><span class="${orderBadgeClass}">${orderCount} ${ordersWord}</span></td>
                <td><strong>${formatCurrency(totalSpent)}</strong></td>
                <td>${formatDate(customer.date_created)}</td>
                <td>${lastPurchase}</td>
                <td><span class="view-orders-hint">${viewHint}</span></td>
            </tr>
        `;
    }).join('');
}

// Sort and render customers (CUS-03)
function sortAndRenderCustomers() {
    if (!customersSortColumn || customersData.length === 0) {
        renderCustomersTable();
        return;
    }

    const sorted = [...customersData].sort((a, b) => {
        let aVal, bVal;

        switch (customersSortColumn) {
            case 'name':
                aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
                bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
                break;
            case 'email':
                aVal = (a.email || '').toLowerCase();
                bVal = (b.email || '').toLowerCase();
                break;
            case 'orders':
                aVal = a.orders_count || 0;
                bVal = b.orders_count || 0;
                break;
            case 'total':
                aVal = a.calculated_total || parseFloat(a.total_spent) || 0;
                bVal = b.calculated_total || parseFloat(b.total_spent) || 0;
                break;
            case 'registered':
                aVal = new Date(a.date_created || 0);
                bVal = new Date(b.date_created || 0);
                break;
            case 'last_purchase':
                aVal = a.last_purchase ? new Date(a.last_purchase) : new Date(0);
                bVal = b.last_purchase ? new Date(b.last_purchase) : new Date(0);
                break;
            default:
                return 0;
        }

        // Handle string comparison
        if (typeof aVal === 'string') {
            const cmp = aVal.localeCompare(bVal);
            return customersSortDirection === 'desc' ? -cmp : cmp;
        }

        // Handle numeric/date comparison
        if (customersSortDirection === 'desc') {
            return bVal - aVal;
        }
        return aVal - bVal;
    });

    customersData = sorted;
    renderCustomersTable();
}

async function showCustomerDetail(customerId) {
    const modal = document.getElementById('customerModal');
    const content = document.getElementById('customerModalContent');
    const loadingCustomerText = currentLanguage === 'da' ? 'Indlæser kunde...' : 'Loading customer...';
    content.innerHTML = `<div class="loading">${loadingCustomerText}</div>`;
    modal.classList.add('active');

    try {
        const [customerRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/api/customers/${customerId}`).then(r => r.json()),
            fetch(`${API_BASE}/api/customers/${customerId}/orders`).then(r => r.json())
        ]);

        // CUS-01: Use actual fetched orders count, not potentially stale API count
        const actualOrderCount = ordersRes.orders ? ordersRes.orders.length : 0;
        // Calculate total from actual orders if available
        const calculatedTotal = ordersRes.orders
            ? ordersRes.orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0)
            : (customerRes.total_spent || 0);

        // Translations for customer modal
        const t = {
            contact: currentLanguage === 'da' ? 'Kontakt' : 'Contact',
            registered: currentLanguage === 'da' ? 'Registreret' : 'Registered',
            statistics: currentLanguage === 'da' ? 'Statistik' : 'Statistics',
            orders: currentLanguage === 'da' ? 'Ordrer' : 'Orders',
            totalPurchased: currentLanguage === 'da' ? 'Total Købt' : 'Total Purchased',
            orderHistory: currentLanguage === 'da' ? 'Ordrehistorik' : 'Order History',
            order: currentLanguage === 'da' ? 'Ordre' : 'Order',
            date: currentLanguage === 'da' ? 'Dato' : 'Date',
            noOrdersYet: currentLanguage === 'da' ? 'Ingen ordrer endnu' : 'No orders yet'
        };

        content.innerHTML = `
            <h2>${customerRes.first_name} ${customerRes.last_name}</h2>

            <div class="modal-section">
                <h3>${t.contact}</h3>
                <div class="info-list">
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">${customerRes.email}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${t.registered}</span>
                        <span class="info-value">${formatDate(customerRes.date_created)}</span>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>${t.statistics}</h3>
                <div class="metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="metric-card">
                        <div class="metric-value">${actualOrderCount}</div>
                        <div class="metric-label">${t.orders}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${formatCurrency(calculatedTotal)}</div>
                        <div class="metric-label">${t.totalPurchased}</div>
                    </div>
                </div>
            </div>

            <div class="modal-section">
                <h3>${t.orderHistory}</h3>
                ${ordersRes.orders && ordersRes.orders.length ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>${t.order}</th>
                                <th>${t.date}</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersRes.orders.map(o => `
                                <tr>
                                    <td>#${o.id}</td>
                                    <td>${formatDate(o.date_created)}</td>
                                    <td><span class="status status-${o.status}">${getStatusLabel(o.status)}</span></td>
                                    <td>${formatCurrency(o.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `<p>${t.noOrdersYet}</p>`}
            </div>
        `;
    } catch (error) {
        const errorPrefix = currentLanguage === 'da' ? 'Fejl' : 'Error';
        content.innerHTML = `<p>${errorPrefix}: ${error.message}</p>`;
    }
}

// Audit data
async function loadAuditData() {
    try {
        const res = await fetch(`${API_BASE}/api/audit`);
        const data = await res.json();

        // Quick Reference Metrics
        if (data.quickReference) {
            const qrEl = document.getElementById('quickReferenceGrid');
            const qr = data.quickReference;
            qrEl.innerHTML = `
                <div class="metric-card small">
                    <div class="metric-value">${qr.products.count}</div>
                    <div class="metric-label">Produkter</div>
                    <div class="metric-detail">${qr.products.breakdown}</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.productVariations}</div>
                    <div class="metric-label">Varianter</div>
                    <div class="metric-detail">Total SKUs: ${qr.totalSKUs}</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.orders.count}</div>
                    <div class="metric-label">Ordrer</div>
                    <div class="metric-detail">${qr.orders.span}</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.users.total}</div>
                    <div class="metric-label">Brugere</div>
                    <div class="metric-detail">${qr.users.breakdown}</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.databaseTables}</div>
                    <div class="metric-label">DB Tabeller</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.mediaFiles}</div>
                    <div class="metric-label">Mediefiler</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.urlRedirects}</div>
                    <div class="metric-label">Redirects</div>
                </div>
                <div class="metric-card small">
                    <div class="metric-value">${qr.productCategories}</div>
                    <div class="metric-label">Kategorier</div>
                </div>
            `;
        }

        // Platform info
        const platformEl = document.getElementById('platformInfo');
        platformEl.innerHTML = Object.entries(data.platform).map(([key, value]) => `
            <div class="info-item">
                <span class="info-label">${capitalizeFirst(key)}</span>
                <span class="info-value">${value}</span>
            </div>
        `).join('');

        // Scores (updated to match realistic assessment)
        const scoresEl = document.getElementById('scoresGrid');
        const getScoreClass = (score) => score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'needs-work';
        scoresEl.innerHTML = `
            <div class="score-item">
                <div class="score-value ${getScoreClass(data.scores.overall)}">${data.scores.overall}</div>
                <div class="score-label" data-da="Samlet" data-en="Overall">Samlet</div>
            </div>
            <div class="score-item">
                <div class="score-value ${getScoreClass(data.scores.technicalSEO)}">${data.scores.technicalSEO}</div>
                <div class="score-label" data-da="Teknisk SEO" data-en="Technical SEO">Teknisk SEO</div>
            </div>
            <div class="score-item">
                <div class="score-value ${getScoreClass(data.scores.performance)}">${data.scores.performance}</div>
                <div class="score-label" data-da="Ydeevne" data-en="Performance">Ydeevne</div>
            </div>
            <div class="score-item">
                <div class="score-value ${getScoreClass(data.scores.security)}">${data.scores.security}</div>
                <div class="score-label" data-da="Sikkerhed" data-en="Security">Sikkerhed</div>
            </div>
        `;

        // Sales Statistics
        if (data.salesStats) {
            const statsEl = document.getElementById('salesStatsGrid');
            const ss = data.salesStats;
            statsEl.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${formatCurrency(ss.totalRevenue)}</div>
                    <div class="stat-label">Total Omsaetning</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ss.totalCompletedOrders}</div>
                    <div class="stat-label">Afsluttede Ordrer</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatCurrency(ss.averageOrderValue)}</div>
                    <div class="stat-label">Gns. Ordrevaerdi</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ss.uniqueCustomers}</div>
                    <div class="stat-label">Unikke Kunder</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${ss.repeatCustomerRate}%</div>
                    <div class="stat-label">Tilbagevendende</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${formatCurrency(ss.averageCLV)}</div>
                    <div class="stat-label">Gns. Kundevaerdi</div>
                </div>
            `;

            // Revenue by year chart
            const chartEl = document.getElementById('revenueByYearChart');
            if (ss.revenueByYear && ss.revenueByYear.length > 0) {
                const maxRevenue = Math.max(...ss.revenueByYear.map(y => y.revenue));
                chartEl.innerHTML = `
                    <h3 style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">Omsaetning per Ar</h3>
                    ${ss.revenueByYear.map(y => {
                        const pct = (y.revenue / maxRevenue * 100).toFixed(1);
                        return `
                            <div class="chart-bar">
                                <div class="chart-label">${y.year}</div>
                                <div class="chart-bar-bg">
                                    <div class="chart-bar-fill" style="width: ${pct}%"></div>
                                </div>
                                <div class="chart-value">${formatCurrency(y.revenue)}</div>
                            </div>
                        `;
                    }).join('')}
                `;
            }

            // Top 10 products by revenue
            if (ss.topProductsByRevenue && ss.topProductsByRevenue.length > 0) {
                const topProductsEl = document.querySelector('#topProductsTable tbody');
                topProductsEl.innerHTML = ss.topProductsByRevenue.map(p => `
                    <tr>
                        <td><strong>${p.rank}</strong></td>
                        <td>${p.name}</td>
                        <td><strong>${formatCurrency(p.revenue)}</strong></td>
                        <td>${p.pctOfTotal}%</td>
                    </tr>
                `).join('');
            }
        }

        // What's Wrong - Problems Section
        if (data.keyFindings && data.keyFindings.problems) {
            const problemsEl = document.getElementById('problemsList');
            const severityLabels = {
                high: { da: 'Høj', en: 'High' },
                medium: { da: 'Medium', en: 'Medium' },
                low: { da: 'Lav', en: 'Low' }
            };
            problemsEl.innerHTML = data.keyFindings.problems.map(p => {
                const category = currentLanguage === 'da' ? p.category_da : p.category_en;
                const issue = currentLanguage === 'da' ? p.issue : p.issue_en;
                const detail = currentLanguage === 'da' ? p.detail : p.detail_en;
                const severityLabel = severityLabels[p.severity][currentLanguage];
                return `
                    <div class="problem-item severity-${p.severity}">
                        <div class="problem-header">
                            <span class="problem-category">${category}</span>
                            <span class="problem-severity ${p.severity}">${severityLabel}</span>
                        </div>
                        <div class="problem-issue">${issue}</div>
                        <div class="problem-detail">${detail}</div>
                    </div>
                `;
            }).join('');
        }

        // Key Findings - Positive
        if (data.keyFindings && data.keyFindings.positive) {
            const posEl = document.getElementById('positiveFindings');
            posEl.innerHTML = data.keyFindings.positive.map(f => `
                <div class="finding-item positive">
                    <span class="finding-icon">&#10003;</span>
                    <span>${f}</span>
                </div>
            `).join('');
        }

        // Key Findings - Technical
        if (data.keyFindings && data.keyFindings.technical) {
            const techEl = document.getElementById('technicalFindings');
            techEl.innerHTML = data.keyFindings.technical.map(f => `
                <div class="finding-item technical">
                    <div class="finding-title">${f.finding}</div>
                    <div class="finding-impact">${f.impact}</div>
                </div>
            `).join('');
        }

        // Plugins (expanded with author)
        const pluginsEl = document.querySelector('#pluginsTable tbody');
        pluginsEl.innerHTML = data.plugins.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.version}</td>
                <td>${p.author || '-'}</td>
                <td><span class="classification classification-${p.classification}">${p.classification}</span></td>
            </tr>
        `).join('');

        // Recommendations (expanded with details)
        const recsEl = document.getElementById('recommendations');
        recsEl.innerHTML = data.recommendations.map(r => `
            <div class="recommendation">
                <span class="recommendation-priority ${r.priority.toLowerCase()}">${r.priority}</span>
                <div class="recommendation-content">
                    <div class="recommendation-item">${r.item}</div>
                    ${r.details ? `<div class="recommendation-details">${r.details}</div>` : ''}
                </div>
            </div>
        `).join('');

        // Migration status
        document.getElementById('migrationStatus').textContent = data.migrationReadiness;

        // Migration details
        if (data.migrationDetails) {
            const mdEl = document.getElementById('migrationDetails');
            const md = data.migrationDetails;
            mdEl.innerHTML = `
                <div class="migration-section">
                    <h4>Data til Migrering</h4>
                    <ul>
                        ${md.dataToMigrate.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                </div>
                <div class="migration-section">
                    <h4>Kritiske Integrationer</h4>
                    <ul>
                        ${md.criticalIntegrations.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
                <div class="migration-section">
                    <h4>Anbefalede Trin for Migrering</h4>
                    <ol>
                        ${md.preMigrationSteps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading audit data:', error);
    }
}

// Helpers
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' DKK';
}

function formatNumber(num) {
    return parseInt(num).toLocaleString('da-DK');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('da-DK');
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('da-DK');
}

function formatDateInput(date) {
    return date.toISOString().split('T')[0];
}

function getStatusLabel(status) {
    const labels = {
        'pending': currentLanguage === 'da' ? 'Afventer' : 'Pending',
        'processing': currentLanguage === 'da' ? 'Behandles' : 'Processing',
        'on-hold': currentLanguage === 'da' ? 'Afventer' : 'On hold',
        'completed': currentLanguage === 'da' ? 'Gennemført' : 'Completed',
        'cancelled': currentLanguage === 'da' ? 'Annulleret' : 'Cancelled',
        'refunded': currentLanguage === 'da' ? 'Refunderet' : 'Refunded',
        'failed': currentLanguage === 'da' ? 'Fejlet' : 'Failed'
    };
    return labels[status] || status;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderPagination(containerId, total, totalPages, currentPage, loadFunction) {
    const container = document.getElementById(containerId);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const prevText = currentLanguage === 'da' ? '← Forrige' : '← Previous';
    const nextText = currentLanguage === 'da' ? 'Næste →' : 'Next →';

    let html = '';

    // Previous
    html += `<button ${currentPage === 1 ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage - 1})">${prevText}</button>`;

    // Page numbers
    const maxPages = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
        start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="${loadFunction.name}(${i})">${i}</button>`;
    }

    // Next
    html += `<button ${currentPage >= totalPages ? 'disabled' : ''} onclick="${loadFunction.name}(${currentPage + 1})">${nextText}</button>`;

    container.innerHTML = html;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function downloadCSV(csv, filename) {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============================================
// TILBUD (PROPOSAL) TAB FUNCTIONS
// ============================================

// Revenue data for the proposal chart
const PROPOSAL_REVENUE_DATA = [
    { year: '2017', revenue: 19752 },
    { year: '2018', revenue: 70409 },
    { year: '2019', revenue: 94412, peak: true },
    { year: '2020', revenue: 76454 },
    { year: '2021', revenue: 27882 },
    { year: '2022', revenue: 27519 },
    { year: '2023', revenue: 6163 },
    { year: '2024', revenue: 3669 },
    { year: '2025', revenue: 29584 },
    { year: '2026', revenue: 5265, note: 'til dato' }
];

// Render the revenue chart in the proposal section
function renderProposalRevenueChart() {
    const container = document.getElementById('proposalRevenueChart');
    if (!container) return;

    const maxRevenue = Math.max(...PROPOSAL_REVENUE_DATA.map(d => d.revenue));

    container.innerHTML = PROPOSAL_REVENUE_DATA.map(d => {
        const pct = (d.revenue / maxRevenue * 100).toFixed(1);
        const isPeak = d.peak ? ' peak' : '';
        const noteText = d.note ? ` (${d.note})` : '';

        return `
            <div class="revenue-bar-row">
                <div class="revenue-year">${d.year}${noteText}</div>
                <div class="revenue-bar-bg">
                    <div class="revenue-bar-fill${isPeak}" style="width: ${pct}%"></div>
                </div>
                <div class="revenue-amount">${formatCurrency(d.revenue)}</div>
            </div>
        `;
    }).join('');
}

// Initialize proposal tab content
function initProposalTab() {
    renderProposalRevenueChart();
}

// Toggle between all channels and website-only view
function toggleWebsiteOnlyView() {
    const toggle = document.getElementById('websiteOnlyToggle');
    const isWebsiteOnly = toggle.checked;

    // Toggle stats grids
    const allChannelStats = document.getElementById('allChannelStats');
    const websiteOnlyStats = document.getElementById('websiteOnlyStats');

    if (allChannelStats && websiteOnlyStats) {
        allChannelStats.style.display = isWebsiteOnly ? 'none' : 'grid';
        websiteOnlyStats.style.display = isWebsiteOnly ? 'grid' : 'none';
    }

    // Toggle offline channel rows
    const offlineChannels = document.querySelectorAll('.offline-channel');
    offlineChannels.forEach(el => {
        el.style.display = isWebsiteOnly ? 'none' : 'flex';
    });

    // Update channel section title when in website-only mode
    const channelSection = document.getElementById('channelSection');
    if (channelSection) {
        const title = channelSection.querySelector('h3');
        if (title) {
            if (isWebsiteOnly) {
                title.setAttribute('data-da', 'Webshop omsætning pr. år');
                title.setAttribute('data-en', 'Webshop revenue per year');
                title.textContent = currentLanguage === 'en' ? 'Webshop revenue per year' : 'Webshop omsætning pr. år';
            } else {
                title.setAttribute('data-da', 'Omsætning pr. kanal (estimeret)');
                title.setAttribute('data-en', 'Revenue by channel (estimated)');
                title.textContent = currentLanguage === 'en' ? 'Revenue by channel (estimated)' : 'Omsætning pr. kanal (estimeret)';
            }
        }
    }

    // Rescale website bar when in website-only mode
    const onlineChannel = document.querySelector('.online-channel .channel-bar-fill');
    if (onlineChannel) {
        onlineChannel.style.width = isWebsiteOnly ? '100%' : '7%';
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    // This runs after auth check, but we need to render the chart
    // when the proposal tab is visible
    setTimeout(initProposalTab, 500);
});

// Switch to a specific tab programmatically
function switchToTab(tabId) {
    const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (tab) {
        tab.click();
    }
}

// Print/export proposal as PDF
function printProposal() {
    // Hide non-proposal content for printing
    const allSections = document.querySelectorAll('.tab-content');
    const proposalSection = document.getElementById('proposal');

    // Store original display states
    allSections.forEach(section => {
        if (section !== proposalSection) {
            section.dataset.originalDisplay = section.style.display;
            section.style.display = 'none';
        }
    });

    // Ensure proposal is visible
    proposalSection.classList.add('active');
    proposalSection.style.display = 'block';

    // Store original collapsible states and expand all for printing
    const collapsibleContents = proposalSection.querySelectorAll('.collapsible-content');
    const originalStates = [];
    collapsibleContents.forEach((content, index) => {
        originalStates[index] = content.style.display;
        content.style.display = 'block';
    });

    // Trigger print
    window.print();

    // Restore original states (print dialog is modal, so this runs after)
    setTimeout(() => {
        allSections.forEach(section => {
            if (section !== proposalSection && section.dataset.originalDisplay !== undefined) {
                section.style.display = section.dataset.originalDisplay;
            }
        });
        // Restore collapsible states
        collapsibleContents.forEach((content, index) => {
            content.style.display = originalStates[index];
        });
    }, 100);
}

// Enter key for search
document.getElementById('customerSearch')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadCustomers();
});

document.getElementById('productSearch')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadProducts();
});

// ============================================
// TRANSLATION SYSTEM (Global)
// ============================================

let currentLanguage = localStorage.getItem('hattemanden_language') || 'da'; // Default to Danish, persist choice

// Global language toggle function
function toggleLanguage() {
    currentLanguage = currentLanguage === 'da' ? 'en' : 'da';
    localStorage.setItem('hattemanden_language', currentLanguage);
    applyGlobalTranslations();
    updateLanguageToggleButton();
    refreshDynamicContent();
}

// Refresh dynamically generated content when language changes
function refreshDynamicContent() {
    // Refresh overview charts if they have content
    const orderStatusChart = document.getElementById('orderStatusChart');
    if (orderStatusChart && orderStatusChart.innerHTML) {
        loadOverview();
    }

    // Refresh review table if products are loaded
    if (reviewProducts.length > 0) {
        renderReviewProducts();
        updateReviewSummary();
    }

    // Refresh orders table if orders are loaded
    if (ordersData.length > 0) {
        renderOrdersTable();
    }

    // Refresh customers table if customers are loaded
    if (customersData.length > 0) {
        renderCustomersTable();
    }

    // Re-render pagination buttons for orders and customers
    const ordersPagination = document.getElementById('ordersPagination');
    const customersPagination = document.getElementById('customersPagination');
    if (ordersPagination && ordersPagination.innerHTML) {
        // Get current page info and re-render (we'll need to track this separately)
    }
}

// Legacy function for backward compatibility
function toggleProposalLanguage() {
    toggleLanguage();
}

// Update the language toggle button display
function updateLanguageToggleButton() {
    const globalToggle = document.getElementById('globalLangToggle');
    if (globalToggle) {
        const langText = globalToggle.querySelector('.lang-text');
        if (langText) {
            langText.textContent = currentLanguage === 'da' ? 'EN' : 'DA';
        }
        globalToggle.title = currentLanguage === 'da' ? 'Switch to English' : 'Skift til dansk';
    }
}

// Apply translations globally across the entire dashboard
function applyGlobalTranslations() {
    // Find ALL elements with data-da and data-en attributes across the entire document
    const translatableElements = document.querySelectorAll('[data-da][data-en]');

    translatableElements.forEach(el => {
        const translation = el.getAttribute(`data-${currentLanguage}`);
        if (translation) {
            // Check if translation contains HTML
            if (translation.includes('<') && translation.includes('>')) {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });

    // Handle placeholders for input fields
    const inputsWithPlaceholders = document.querySelectorAll('[data-da-placeholder][data-en-placeholder]');
    inputsWithPlaceholders.forEach(el => {
        const placeholder = el.getAttribute(`data-${currentLanguage}-placeholder`);
        if (placeholder) {
            el.placeholder = placeholder;
        }
    });

    // Handle select option translations
    const selectOptions = document.querySelectorAll('select option[data-da][data-en]');
    selectOptions.forEach(option => {
        const translation = option.getAttribute(`data-${currentLanguage}`);
        if (translation) {
            option.textContent = translation;
        }
    });

    // Add visual feedback
    document.body.classList.add('lang-transition');
    setTimeout(() => document.body.classList.remove('lang-transition'), 300);

    // Update connection status text if needed
    const statusText = document.querySelector('.connection-status .status-text');
    if (statusText) {
        const currentText = statusText.textContent;
        if (currentText === 'Forbundet' || currentText === 'Connected') {
            statusText.textContent = currentLanguage === 'da' ? 'Forbundet' : 'Connected';
        } else if (currentText.includes('Forbinder') || currentText.includes('Connecting')) {
            statusText.textContent = currentLanguage === 'da' ? 'Forbinder...' : 'Connecting...';
        }
    }
}

// Legacy function for backward compatibility
function applyTranslations() {
    applyGlobalTranslations();
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved language preference
    applyGlobalTranslations();
    updateLanguageToggleButton();
    // Apply saved theme preference
    initTheme();
});

// ============================================
// THEME SYSTEM (Light/Dark Mode)
// ============================================

let currentTheme = localStorage.getItem('hattemanden_theme') || 'dark'; // Default to dark

// Initialize theme on page load
function initTheme() {
    const savedTheme = localStorage.getItem('hattemanden_theme') || 'dark';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
}

// Toggle between light and dark theme
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('hattemanden_theme', currentTheme);
    applyTheme(currentTheme);
}

// Apply theme to the page
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }

    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0a0b');
    }

    // Update color-scheme meta
    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
        metaColorScheme.setAttribute('content', theme);
    }

    // Update theme toggle button title
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.title = theme === 'dark'
            ? (currentLanguage === 'da' ? 'Skift til lyst tema' : 'Switch to light theme')
            : (currentLanguage === 'da' ? 'Skift til mørkt tema' : 'Switch to dark theme');
    }
}
