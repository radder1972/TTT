// ==========================================================================
// True Time Thai - Admin Dashboard Logic
// Supports both simulated LocalStorage database and live Supabase client.
// ==========================================================================

const SUPABASE_URL = "https://uuciegboqicihcanjqbh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2llZ2JvcWljaWhjYW5qcWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjI4NzcsImV4cCI6MjA5NTk5ODg3N30.-gA94kM_Vn0pMW3WThcMM3e2abCmGTuLSBa0BspJvNg"; // <-- PLAK HIER UW SUPABASE ANON KEY OM LIVE TE GAAN

let supabaseClient = null;
let isSimulated = true;
let activeDevices = [];
let currentView = 'bookings';

// 1. Initialize Database Connection
function initDatabase() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    
    if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim() !== "") {
        try {
            // Initialize Supabase Client
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSimulated = false;
            
            if (statusDot) {
                statusDot.className = "pulse-dot green";
            }
            if (statusText) {
                statusText.textContent = "Supabase Live Verbonden";
            }
            console.log("Supabase Client initialized successfully.");
        } catch (error) {
            console.error("Fout bij laden van Supabase client, fallback naar simulatie:", error);
            isSimulated = true;
        }
    } else {
        // Fallback simulated local storage
        isSimulated = true;
        if (statusDot) {
            statusDot.className = "pulse-dot orange";
        }
        if (statusText) {
            statusText.textContent = "Simulatiemodus (LocalStorage)";
        }
        console.log("Supabase Anon Key is leeg. Systeem draait in Simulatiemodus.");
        
        // Initialize dummy bookings inside LocalStorage if empty
        initDummyBookings();
        initDummyDevices();
    }
}

// 2. Simulated LocalStorage Database Setup
const DUMMY_BOOKINGS = [
    {
        id: "b1",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: "Jan de Vries",
        customer_email: "jan@voorbeeld.nl",
        start_date: "2026-06-03",
        end_date: "2026-06-06",
        earbud_count: 2,
        pickup_location: "True Time Thai Office - Beach Road Pattaya",
        extra_sim: true,
        extra_powerbank: false,
        total_price_thb: 2200,
        payment_method: "Creditcard (Simulated)",
        payment_status: "BETAALD",
        transaction_id: "TXN_A8F9K4L2P",
        status: "CONFIRMED"
    },
    {
        id: "b2",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: "Sophie Dubois",
        customer_email: "sophie@example.com",
        start_date: "2026-06-01",
        end_date: "2026-06-07",
        earbud_count: 1,
        pickup_location: "Hotel Bezorging in Pattaya (Gratis) - Hilton Pattaya",
        extra_sim: false,
        extra_powerbank: true,
        total_price_thb: 1675,
        payment_method: "PromptPay (Simulated)",
        payment_status: "BETAALD",
        transaction_id: "TXN_Q3W9E8R7T",
        status: "PICKED_UP"
    },
    {
        id: "b3",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: "John Smith",
        customer_email: "john.smith@gmail.com",
        start_date: "2026-05-25",
        end_date: "2026-05-30",
        earbud_count: 3,
        pickup_location: "True Time Thai Office - Beach Road Pattaya",
        extra_sim: true,
        extra_powerbank: true,
        total_price_thb: 5325,
        payment_method: "Creditcard (Simulated)",
        payment_status: "BETAALD",
        transaction_id: "TXN_Z1X2C3V4B",
        status: "RETURNED"
    }
];

function initDummyBookings() {
    if (!localStorage.getItem('ttt_bookings')) {
        localStorage.setItem('ttt_bookings', JSON.stringify(DUMMY_BOOKINGS));
    }
    if (!localStorage.getItem('ttt_total_stock')) {
        localStorage.setItem('ttt_total_stock', '30');
    }
}

function initDummyDevices() {
    if (!localStorage.getItem('ttt_devices')) {
        const dummyDevices = [];
        for (let i = 1; i <= 30; i++) {
            const numStr = String(i).padStart(3, '0');
            dummyDevices.push({
                id: `dev-${i}`,
                serial_number: `W4-${numStr}`,
                status: i === 5 ? 'RENTED' : (i === 12 ? 'CLEANING' : (i === 18 ? 'MAINTENANCE' : 'AVAILABLE')),
                notes: `Set W4-${numStr} - Standaard actieve set.`,
                assigned_booking_id: i === 5 ? 'b2' : null,
                last_checked: new Date().toISOString()
            });
        }
        localStorage.setItem('ttt_devices', JSON.stringify(dummyDevices));
    }
}

// 3. Document Ready Listener
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    checkAuthSession();
    
    // Auth Forms Events
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Inventory Save Event
    const saveStockBtn = document.getElementById('btn-save-stock');
    if (saveStockBtn) {
        saveStockBtn.addEventListener('click', saveTotalStock);
    }

    // Filter & Search Events
    const searchInput = document.getElementById('booking-search');
    if (searchInput) {
        searchInput.addEventListener('input', renderBookingsTable);
    }

    const statusFilter = document.getElementById('booking-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', renderBookingsTable);
    }

    // Tab Navigation switching handlers
    const btnTabBookings = document.getElementById('btn-tab-bookings');
    const btnTabInventory = document.getElementById('btn-tab-inventory');
    if (btnTabBookings && btnTabInventory) {
        btnTabBookings.addEventListener('click', () => showView('bookings'));
        btnTabInventory.addEventListener('click', () => showView('inventory'));
    }

    // Device search & filters
    const deviceSearch = document.getElementById('device-search');
    if (deviceSearch) {
        deviceSearch.addEventListener('input', renderDevicesTable);
    }
    const deviceStatusFilter = document.getElementById('device-status-filter');
    if (deviceStatusFilter) {
        deviceStatusFilter.addEventListener('change', renderDevicesTable);
    }

    // Add Device Form Submission
    const addDeviceForm = document.getElementById('add-device-form');
    if (addDeviceForm) {
        addDeviceForm.addEventListener('submit', handleAddDevice);
    }
});

// 4. Session & Authentication logic
let currentSessionUser = null;

async function checkAuthSession() {
    const loginSection = document.getElementById('admin-login-section');
    const dashboardSection = document.getElementById('admin-dashboard-section');
    const logoutWrapper = document.getElementById('header-logout-wrapper');

    if (isSimulated) {
        const isLoggedIn = localStorage.getItem('ttt_admin_auth') === 'true';
        if (isLoggedIn) {
            currentSessionUser = { email: "admin@truetimethai.com" };
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';
            if (logoutWrapper) logoutWrapper.style.display = 'block';
            
            // Load dashboard data
            loadDashboardData();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    } else {
        // Supabase Live Auth Session check
        const { data, error } = await supabaseClient.auth.getSession();
        if (data && data.session) {
            currentSessionUser = data.session.user;
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';
            if (logoutWrapper) logoutWrapper.style.display = 'block';
            
            loadDashboardData();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('btn-login');

    if (loginBtn) loginBtn.disabled = true;

    if (isSimulated) {
        // Simulated Authentication
        if (email === "admin@truetimethai.com" && password === "pattaya2026") {
            localStorage.setItem('ttt_admin_auth', 'true');
            alert("Inloggen succesvol!");
            checkAuthSession();
        } else {
            alert("Foutief e-mailadres of wachtwoord! Probeer admin@truetimethai.com / pattaya2026");
        }
        if (loginBtn) loginBtn.disabled = false;
    } else {
        // Supabase Live Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert("Inloggen mislukt: " + error.message);
        } else {
            alert("Inloggen succesvol!");
            checkAuthSession();
        }
        if (loginBtn) loginBtn.disabled = false;
    }
}

async function handleLogout() {
    if (isSimulated) {
        localStorage.setItem('ttt_admin_auth', 'false');
        checkAuthSession();
    } else {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert("Fout bij uitloggen: " + error.message);
        }
        checkAuthSession();
    }
}

// 5. Data Loading & Operations
let activeBookings = [];
let totalStock = 30;

async function loadDashboardData() {
    // 1. Fetch total stock config
    await loadTotalStock();

    // 2. Fetch bookings list
    await loadBookings();
    
    // 3. Fetch devices list
    await loadDevices();
    
    // 4. Render Tables
    renderBookingsTable();
    renderDevicesTable();
}

async function loadTotalStock() {
    const stockInput = document.getElementById('input-total-stock');
    if (isSimulated) {
        const stockStr = localStorage.getItem('ttt_total_stock') || '30';
        totalStock = parseInt(stockStr);
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('value')
                .eq('key', 'total_stock')
                .single();
                
            if (data) {
                totalStock = parseInt(data.value);
            } else {
                totalStock = 30; // fallback default
            }
        } catch (error) {
            console.error("Fout bij ophalen voorraad uit Supabase:", error);
            totalStock = 30;
        }
    }
    if (stockInput) stockInput.value = totalStock;
}

async function saveTotalStock() {
    const stockInput = document.getElementById('input-total-stock');
    if (!stockInput) return;
    
    const newVal = parseInt(stockInput.value);
    if (isNaN(newVal) || newVal < 1) {
        alert("Voer een geldig getal in groter dan 0.");
        return;
    }

    const saveBtn = document.getElementById('btn-save-stock');
    if (saveBtn) saveBtn.disabled = true;

    if (isSimulated) {
        localStorage.setItem('ttt_total_stock', newVal.toString());
        totalStock = newVal;
        alert("Totale voorraad succesvol bijgewerkt in simulatie!");
        loadDashboardData();
    } else {
        const { error } = await supabaseClient
            .from('settings')
            .upsert({ key: 'total_stock', value: newVal.toString() });

        if (error) {
            alert("Fout bij opslaan van voorraad: " + error.message);
        } else {
            totalStock = newVal;
            alert("Totale voorraad succesvol live opgeslagen!");
            loadDashboardData();
        }
    }
    if (saveBtn) saveBtn.disabled = false;
}

async function loadBookings() {
    if (isSimulated) {
        const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
        activeBookings = JSON.parse(bookingsStr);
    } else {
        // Supabase Live select
        const { data, error } = await supabaseClient
            .from('bookings')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error("Fout bij ophalen boekingen:", error.message);
            activeBookings = [];
        } else {
            activeBookings = data || [];
        }
    }
    
    // Update stats widgets based on fetched bookings
    calculateDashboardStats();
}

function calculateDashboardStats() {
    // 1. Active rentals: Sum of earbuds currently in use (status: PICKED_UP)
    const activeRentals = activeBookings
        .filter(b => b.status === "PICKED_UP")
        .reduce((sum, b) => sum + parseInt(b.earbud_count), 0);
    
    const activeWidget = document.getElementById('stat-active-rentals');
    if (activeWidget) activeWidget.textContent = activeRentals;

    // 2. Today's pickups: Bookings starting today (or already active, or pending) and status: CONFIRMED
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPickupsCount = activeBookings
        .filter(b => b.start_date === todayStr && b.status === "CONFIRMED")
        .length;
        
    const pickupsWidget = document.getElementById('stat-today-pickups');
    if (pickupsWidget) pickupsWidget.textContent = todayPickupsCount;

    // 3. Total revenue: sum price of all bookings (excluding CANCELLED)
    const totalRev = activeBookings
        .filter(b => b.status !== "CANCELLED")
        .reduce((sum, b) => sum + parseInt(b.total_price_thb), 0);
        
    const revWidget = document.getElementById('stat-total-revenue');
    if (revWidget) revWidget.textContent = `฿${totalRev.toLocaleString()}`;

    // 4. Available W4 Pro sets now: totalStock - activeRentals
    const availableNow = totalStock - activeRentals;
    const availableWidget = document.getElementById('stat-available-now');
    if (availableWidget) availableWidget.textContent = `${availableNow} / ${totalStock}`;
}

// 6. Rendering Bookings Table
function renderBookingsTable() {
    const tableBody = document.getElementById('bookings-table-body');
    if (!tableBody) return;

    const searchQuery = document.getElementById('booking-search') ? document.getElementById('booking-search').value.toLowerCase().trim() : '';
    const statusFilter = document.getElementById('booking-status-filter') ? document.getElementById('booking-status-filter').value : 'ALL';

    // Filter Bookings
    const filtered = activeBookings.filter(b => {
        const matchesSearch = b.customer_name.toLowerCase().includes(searchQuery) || b.customer_email.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted">Geen boekingen gevonden die voldoen aan de criteria.</td>
            </tr>
        `;
        return;
    }

    let rowsHtml = '';
    filtered.forEach(b => {
        // Date Formatting helper
        const periodText = `${formatDateString(b.start_date)} t/m ${formatDateString(b.end_date)}`;
        
        // Status pill classes
        let statusClass = 'badge-pending';
        let statusLabel = 'Gereserveerd';
        
        if (b.status === 'CONFIRMED') {
            statusClass = 'badge-confirmed';
            statusLabel = 'Betaald';
        } else if (b.status === 'PICKED_UP') {
            statusClass = 'badge-active';
            statusLabel = 'Actief';
        } else if (b.status === 'RETURNED') {
            statusClass = 'badge-completed';
            statusLabel = 'Ingeleverd';
        } else if (b.status === 'CANCELLED') {
            statusClass = 'badge-cancelled';
            statusLabel = 'Geannuleerd';
        }

        // Actions selector
        let actionsHtml = '';
        if (b.status === 'CONFIRMED') {
            actionsHtml = `<button type="button" class="btn btn-xs btn-neon" onclick="updateBookingStatus('${b.id}', 'PICKED_UP')">In gebruik geven</button>`;
        } else if (b.status === 'PICKED_UP') {
            actionsHtml = `<button type="button" class="btn btn-xs btn-outline" onclick="updateBookingStatus('${b.id}', 'RETURNED')">Terugontvangen</button>`;
        } else if (b.status !== 'CANCELLED' && b.status !== 'RETURNED') {
            actionsHtml = `<button type="button" class="btn btn-xs btn-outline" onclick="updateBookingStatus('${b.id}', 'CANCELLED')">Annuleren</button>`;
        } else {
            actionsHtml = `<span class="text-muted">-</span>`;
        }

        // Add Print Invoice button to actions
        const printBtnHtml = `<button type="button" class="btn btn-xs btn-outline btn-print-admin-icon" onclick="printBookingInvoice('${b.id}')" title="Print Factuur">
            <svg class="icon-brand" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
            </svg>
        </button>`;
        if (actionsHtml === `<span class="text-muted">-</span>`) {
            actionsHtml = printBtnHtml;
        } else {
            actionsHtml += printBtnHtml;
        }

        // Format accessories
        const extras = [];
        if (b.extra_sim === true || b.extra_sim === "Ja (+ ฿350 per stuk)") extras.push("SIM");
        if (b.extra_powerbank === true || b.extra_powerbank === "Ja (+ ฿175 per stuk)") extras.push("Powerbank");
        const extrasText = extras.length > 0 ? ` (+ ${extras.join(' & ')})` : '';

        // Device assignment formatting
        const assignedDevices = activeDevices.filter(d => d.assigned_booking_id === b.id);
        let deviceAssignedText = '';
        if (assignedDevices.length > 0) {
            deviceAssignedText = `<div class="assigned-devices-box" style="margin-top: 6px; font-size: 0.8rem; color: var(--neon-cyan); font-weight: 600;">
                🎧 ${assignedDevices.map(d => d.serial_number).join(', ')}
                ${b.status !== 'RETURNED' && b.status !== 'CANCELLED' ? `<span class="text-red" style="margin-left: 6px; cursor: pointer; font-size: 0.75rem;" onclick="unassignDeviceFromBooking('${b.id}')" title="Koppeling verbreken">✕</span>` : ''}
            </div>`;
        } else if (b.status === 'CONFIRMED' || b.status === 'PICKED_UP') {
            const availableDevices = activeDevices.filter(d => d.status === 'AVAILABLE');
            let selectOptions = `<option value="">Koppel set...</option>`;
            availableDevices.forEach(d => {
                selectOptions += `<option value="${d.id}">${d.serial_number}</option>`;
            });
            deviceAssignedText = `
                <div style="margin-top: 6px;">
                    <select class="device-status-select" onchange="assignDeviceToBooking('${b.id}', this.value)" style="padding: 2px 4px; font-size: 0.75rem; width: 100px; height: 24px; font-weight: 500;">
                        ${selectOptions}
                    </select>
                </div>
            `;
        }

        // Table Row HTML
        rowsHtml += `
            <tr>
                <td>
                    <strong>${b.customer_name}</strong><br>
                    <span class="text-muted small">${b.customer_email}</span>
                </td>
                <td>
                    <span class="small">${periodText}</span>
                </td>
                <td>
                    <strong>${b.earbud_count}x W4 Pro</strong><br>
                    <span class="text-muted small">${extrasText || 'Geen extras'}</span>
                    ${deviceAssignedText}
                </td>
                <td>
                    <strong>฿${b.total_price_thb}</strong><br>
                    <span class="text-muted small">${b.payment_method}</span>
                </td>
                <td>
                    <span class="small">${formatLocationText(b.pickup_location)}</span>
                </td>
                <td>
                    <span class="text-green small">✓ ${b.payment_status}</span><br>
                    <span class="text-muted small">${b.transaction_id}</span>
                </td>
                <td>
                    <span class="admin-status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;">
                        ${actionsHtml}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
}

// 7. Status Actions
window.updateBookingStatus = async function(id, newStatus) {
    if (!confirm(`Weet u zeker dat u de status van boeking ${id} wilt wijzigen?`)) {
        return;
    }

    if (isSimulated) {
        // Update LocalStorage bookings
        const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
        const bookings = JSON.parse(bookingsStr);
        
        const bIndex = bookings.findIndex(b => b.id === id);
        if (bIndex !== -1) {
            bookings[bIndex].status = newStatus;
            localStorage.setItem('ttt_bookings', JSON.stringify(bookings));
            if (newStatus === 'RETURNED') {
                await handleBookingReturnDevices(id);
            }
            alert("Status succesvol bijgewerkt!");
            loadDashboardData();
        }
    } else {
        // Update Supabase Database row
        const { error } = await supabaseClient
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert("Fout bij bijwerken status: " + error.message);
        } else {
            if (newStatus === 'RETURNED') {
                await handleBookingReturnDevices(id);
            }
            alert("Status succesvol live bijgewerkt!");
            loadDashboardData();
        }
    }
};

// 8. Helper formatters
function formatDateString(dateStr) {
    if (!dateStr) return '';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

function formatLocationText(locText) {
    if (!locText) return '';
    if (locText.includes("Office")) return "Kantoor Beach Road";
    if (locText.includes("Bezorging") || locText.includes("delivery")) return "Hotel Bezorging";
    return locText;
}

// 9. Print Invoice function for admins
window.printBookingInvoice = function(id) {
    const booking = activeBookings.find(b => b.id === id);
    if (!booking) {
        alert("Boeking niet gevonden!");
        return;
    }
    
    // Populate printable fields
    document.getElementById('print-invoice-id').textContent = booking.id;
    document.getElementById('print-invoice-period').textContent = `${formatDateString(booking.start_date)} t/m ${formatDateString(booking.end_date)}`;
    document.getElementById('print-cust-name').textContent = booking.customer_name;
    document.getElementById('print-cust-email').textContent = booking.customer_email;
    document.getElementById('print-pickup-loc').textContent = formatLocationText(booking.pickup_location);
    document.getElementById('print-total-thb').textContent = `฿${parseInt(booking.total_price_thb).toLocaleString()}`;
    document.getElementById('print-pay-method').textContent = booking.payment_method;
    document.getElementById('print-txn-id').textContent = booking.transaction_id;
    
    // Status styling and text
    const statusEl = document.getElementById('print-pay-status');
    if (booking.status === 'CANCELLED') {
        statusEl.textContent = 'GEANNULEERD';
        statusEl.style.color = '#dc3545';
    } else if (booking.status === 'RETURNED') {
        statusEl.textContent = 'INGELEVERD / COMPLEET';
        statusEl.style.color = '#007bff';
    } else if (booking.status === 'PICKED_UP') {
        statusEl.textContent = 'IN GEBRUIK (ACTIEF)';
        statusEl.style.color = '#ffc107';
    } else {
        statusEl.textContent = 'BETAALD / RESERVERING';
        statusEl.style.color = '#28a745';
    }
    
    // Populate items lists
    const itemsContainer = document.getElementById('print-invoice-items');
    const days = calculateDaysBetween(booking.start_date, booking.end_date);
    
    let itemsHtml = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>Huur W4 Pro AI oordopjes (${booking.earbud_count}x set, ${days}d):</span>
            <span>฿${(booking.earbud_count * 250 * days).toLocaleString()}</span>
        </div>
    `;
    
    if (booking.extra_sim === true || booking.extra_sim === "Ja (+ ฿350 per stuk)" || booking.extra_sim === "Ja (+ ?350 per stuk)") {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>5G Lokale SIM-kaart (${booking.earbud_count}x flat):</span>
                <span>฿${(booking.earbud_count * 350).toLocaleString()}</span>
            </div>
        `;
    }
    
    if (booking.extra_powerbank === true || booking.extra_powerbank === "Ja (+ ฿175 per stuk)" || booking.extra_powerbank === "Ja (+ ?175 per stuk)") {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>Premium Powerbank (${booking.earbud_count}x flat):</span>
                <span>฿${(booking.earbud_count * 175).toLocaleString()}</span>
            </div>
        `;
    }
    
    itemsContainer.innerHTML = itemsHtml;
    
    // Trigger printing
    window.print();
};

// Helper to calculate days in print view
function calculateDaysBetween(startStr, endStr) {
    try {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    } catch (e) {
        return 1;
    }
}

// ==========================================================================
// 10. DEVICE INVENTORY MANAGEMENT LOGIC
// ==========================================================================

// Tab views switching
window.showView = function(viewName) {
    currentView = viewName;
    const btnBookings = document.getElementById('btn-tab-bookings');
    const btnInventory = document.getElementById('btn-tab-inventory');
    const viewBookings = document.getElementById('view-bookings');
    const viewInventory = document.getElementById('view-inventory');

    if (viewName === 'bookings') {
        if (btnBookings) btnBookings.classList.add('active');
        if (btnInventory) btnInventory.classList.remove('active');
        if (viewBookings) viewBookings.style.display = 'block';
        if (viewInventory) viewInventory.style.display = 'none';
        loadDashboardData();
    } else if (viewName === 'inventory') {
        if (btnBookings) btnBookings.classList.remove('active');
        if (btnInventory) btnInventory.classList.add('active');
        if (viewBookings) viewBookings.style.display = 'none';
        if (viewInventory) viewInventory.style.display = 'block';
        loadDevices();
    }
};

// Fetch device list from Supabase or LocalStorage fallback
window.loadDevices = async function() {
    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        activeDevices = JSON.parse(devicesStr);
        if (activeDevices.length === 0) {
            localStorage.removeItem('ttt_devices');
            initDummyDevices();
            const freshDevicesStr = localStorage.getItem('ttt_devices') || '[]';
            activeDevices = JSON.parse(freshDevicesStr);
        }
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('devices')
                .select('*')
                .order('serial_number', { ascending: true });
            
            if (error) {
                console.error("Fout bij ophalen live devices uit Supabase, falling back to LocalStorage:", error.message);
                const devicesStr = localStorage.getItem('ttt_devices') || '[]';
                activeDevices = JSON.parse(devicesStr);
                if (activeDevices.length === 0) {
                    localStorage.removeItem('ttt_devices');
                    initDummyDevices();
                    const freshDevicesStr = localStorage.getItem('ttt_devices') || '[]';
                    activeDevices = JSON.parse(freshDevicesStr);
                }
            } else {
                activeDevices = data || [];
                if (activeDevices.length === 0) {
                    await seedLiveDevices();
                }
            }
        } catch (error) {
            console.error("Uitzondering bij ophalen devices:", error);
            const devicesStr = localStorage.getItem('ttt_devices') || '[]';
            activeDevices = JSON.parse(devicesStr);
        }
    }
    renderDevicesTable();
};

// Seed live Supabase table with default headsets W4-001 - W4-030
async function seedLiveDevices() {
    try {
        const dummyDevices = [];
        for (let i = 1; i <= 30; i++) {
            const numStr = String(i).padStart(3, '0');
            dummyDevices.push({
                serial_number: `W4-${numStr}`,
                status: 'AVAILABLE',
                notes: `Set W4-${numStr} - Standaard actieve set.`,
                last_checked: new Date().toISOString()
            });
        }
        const { data, error } = await supabaseClient
            .from('devices')
            .insert(dummyDevices)
            .select();
        if (!error && data) {
            activeDevices = data;
        }
    } catch (e) {
        console.error("Fout bij seeden live apparaten:", e);
    }
}

// Render inventory headsets list table
window.renderDevicesTable = function() {
    const tableBody = document.getElementById('devices-table-body');
    if (!tableBody) return;

    const searchQuery = document.getElementById('device-search') ? document.getElementById('device-search').value.toLowerCase().trim() : '';
    const statusFilter = document.getElementById('device-status-filter') ? document.getElementById('device-status-filter').value : 'ALL';

    const filtered = activeDevices.filter(d => {
        const matchesSearch = d.serial_number.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    calculateDeviceStats();

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">Geen headsets gevonden die voldoen aan de criteria.</td>
            </tr>
        `;
        return;
    }

    let rowsHtml = '';
    filtered.forEach(d => {
        let bookingText = '<span class="text-muted">-</span>';
        if (d.assigned_booking_id) {
            const booking = activeBookings.find(b => b.id === d.assigned_booking_id);
            if (booking) {
                bookingText = `<strong>${booking.customer_name}</strong><br><span class="text-muted small">${booking.customer_email}</span>`;
            } else {
                bookingText = `<span class="text-muted">Gekoppeld (ID: ${d.assigned_booking_id})</span>`;
            }
        }

        const lastCheckedFormatted = d.last_checked ? new Date(d.last_checked).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-';

        rowsHtml += `
            <tr id="dev-row-${d.id}">
                <td><strong>${d.serial_number}</strong></td>
                <td><span class="small">Timekettle W4 Pro</span></td>
                <td>
                    <select class="device-status-select status-${d.status}" onchange="updateDeviceStatus('${d.id}', this.value)">
                        <option value="AVAILABLE" ${d.status === 'AVAILABLE' ? 'selected' : ''}>Beschikbaar</option>
                        <option value="RENTED" ${d.status === 'RENTED' ? 'selected' : ''}>In Verhuur</option>
                        <option value="CLEANING" ${d.status === 'CLEANING' ? 'selected' : ''}>In Reiniging (UV-C)</option>
                        <option value="MAINTENANCE" ${d.status === 'MAINTENANCE' ? 'selected' : ''}>Onderhoud</option>
                    </select>
                </td>
                <td>${bookingText}</td>
                <td>
                    <input type="text" class="device-notes-input" value="${d.notes || ''}" onblur="updateDeviceNotes('${d.id}', this.value)" placeholder="Voeg opmerking toe...">
                </td>
                <td><span class="small">${lastCheckedFormatted}</span></td>
                <td>
                    <button type="button" class="btn btn-xs btn-outline btn-print-admin-icon" onclick="deleteDevice('${d.id}')" title="Headset Verwijderen" style="width: 28px; height: 28px; border-radius: 50%; color: var(--thai-red);">
                        <svg class="icon-brand" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
};

// Calculate and show device status counts
function calculateDeviceStats() {
    const totalWidget = document.getElementById('inv-stat-total');
    const availableWidget = document.getElementById('inv-stat-available');
    const rentedWidget = document.getElementById('inv-stat-rented');
    const cleaningWidget = document.getElementById('inv-stat-cleaning');

    const total = activeDevices.length;
    const available = activeDevices.filter(d => d.status === 'AVAILABLE').length;
    const rented = activeDevices.filter(d => d.status === 'RENTED').length;
    const cleaning = activeDevices.filter(d => d.status === 'CLEANING' || d.status === 'MAINTENANCE').length;

    if (totalWidget) totalWidget.textContent = total;
    if (availableWidget) availableWidget.textContent = available;
    if (rentedWidget) rentedWidget.textContent = rented;
    if (cleaningWidget) cleaningWidget.textContent = cleaning;
}

// Add device form submit handler
window.handleAddDevice = async function(e) {
    e.preventDefault();
    const serialInput = document.getElementById('input-device-serial');
    const notesInput = document.getElementById('input-device-notes');
    if (!serialInput) return;

    const serial = serialInput.value.trim().toUpperCase();
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!serial) {
        alert("Voer een geldig serienummer in.");
        return;
    }

    const exists = activeDevices.some(d => d.serial_number === serial);
    if (exists) {
        alert(`Serienummer ${serial} is al geregistreerd!`);
        return;
    }

    const newDevice = {
        serial_number: serial,
        status: 'AVAILABLE',
        notes: notes || `Set ${serial} - Handmatig geregistreerd.`,
        last_checked: new Date().toISOString()
    };

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        newDevice.id = `dev-${Date.now()}`;
        devices.push(newDevice);
        localStorage.setItem('ttt_devices', JSON.stringify(devices));
        alert("Headset succesvol toegevoegd in simulatie!");
        serialInput.value = '';
        if (notesInput) notesInput.value = '';
        await loadDevices();
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .insert([newDevice]);

        if (error) {
            alert("Fout bij registreren headset: " + error.message);
        } else {
            alert("Headset succesvol live geregistreerd!");
            serialInput.value = '';
            if (notesInput) notesInput.value = '';
            await loadDevices();
        }
    }
};

// Update device status dropdown select
window.updateDeviceStatus = async function(deviceId, newStatus) {
    const timestamp = new Date().toISOString();
    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        const dIndex = devices.findIndex(d => d.id === deviceId);
        if (dIndex !== -1) {
            devices[dIndex].status = newStatus;
            devices[dIndex].last_checked = timestamp;
            if (newStatus !== 'RENTED') {
                devices[dIndex].assigned_booking_id = null;
            }
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
            await loadDevices();
            renderBookingsTable();
        }
    } else {
        const updateObj = { status: newStatus, last_checked: timestamp };
        if (newStatus !== 'RENTED') {
            updateObj.assigned_booking_id = null;
        }
        const { error } = await supabaseClient
            .from('devices')
            .update(updateObj)
            .eq('id', deviceId);

        if (error) {
            alert("Fout bij bijwerken headsetstatus: " + error.message);
        } else {
            await loadDevices();
            renderBookingsTable();
        }
    }
};

// Update device notes input blur
window.updateDeviceNotes = async function(deviceId, newNotes) {
    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        const dIndex = devices.findIndex(d => d.id === deviceId);
        if (dIndex !== -1) {
            devices[dIndex].notes = newNotes;
            devices[dIndex].last_checked = new Date().toISOString();
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
            activeDevices = devices;
            calculateDeviceStats();
        }
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .update({ notes: newNotes, last_checked: new Date().toISOString() })
            .eq('id', deviceId);

        if (error) {
            console.error("Fout bij bijwerken opmerking in database:", error.message);
        } else {
            const dIndex = activeDevices.findIndex(d => d.id === deviceId);
            if (dIndex !== -1) {
                activeDevices[dIndex].notes = newNotes;
            }
        }
    }
};

// Delete device from list
window.deleteDevice = async function(deviceId) {
    const device = activeDevices.find(d => d.id === deviceId);
    if (!device) return;
    if (!confirm(`Weet u zeker dat u headset ${device.serial_number} wilt verwijderen?`)) {
        return;
    }

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        let devices = JSON.parse(devicesStr);
        devices = devices.filter(d => d.id !== deviceId);
        localStorage.setItem('ttt_devices', JSON.stringify(devices));
        alert("Headset verwijderd!");
        await loadDevices();
        renderBookingsTable();
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            alert("Fout bij verwijderen headset: " + error.message);
        } else {
            alert("Headset succesvol verwijderd!");
            await loadDevices();
            renderBookingsTable();
        }
    }
};

// Link a device to a booking (assign)
window.assignDeviceToBooking = async function(bookingId, deviceId) {
    if (!deviceId) return;
    const timestamp = new Date().toISOString();

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        const dIndex = devices.findIndex(d => d.id === deviceId);
        if (dIndex !== -1) {
            devices[dIndex].assigned_booking_id = bookingId;
            devices[dIndex].status = 'RENTED';
            devices[dIndex].last_checked = timestamp;
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
            
            const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
            const bookings = JSON.parse(bookingsStr);
            const bIndex = bookings.findIndex(b => b.id === bookingId);
            if (bIndex !== -1 && bookings[bIndex].status === 'CONFIRMED') {
                bookings[bIndex].status = 'PICKED_UP';
                localStorage.setItem('ttt_bookings', JSON.stringify(bookings));
            }
            
            alert("Headset succesvol gekoppeld en status gewijzigd naar Actief!");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .update({ assigned_booking_id: bookingId, status: 'RENTED', last_checked: timestamp })
            .eq('id', deviceId);

        if (error) {
            alert("Fout bij toewijzen headset: " + error.message);
        } else {
            const booking = activeBookings.find(b => b.id === bookingId);
            if (booking && booking.status === 'CONFIRMED') {
                await supabaseClient
                    .from('bookings')
                    .update({ status: 'PICKED_UP' })
                    .eq('id', bookingId);
            }
            alert("Headset succesvol live gekoppeld!");
            await loadDashboardData();
        }
    }
};

// Unassign device link
window.unassignDeviceFromBooking = async function(bookingId) {
    if (!confirm("Weet u zeker dat u de headset-koppeling met deze boeking wilt verbreken?")) return;
    const timestamp = new Date().toISOString();

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        let updated = false;
        devices.forEach(d => {
            if (d.assigned_booking_id === bookingId) {
                d.assigned_booking_id = null;
                d.status = 'AVAILABLE';
                d.last_checked = timestamp;
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
            alert("Koppeling verbroken. Headset is weer beschikbaar.");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .update({ assigned_booking_id: null, status: 'AVAILABLE', last_checked: timestamp })
            .eq('assigned_booking_id', bookingId);

        if (error) {
            alert("Fout bij ontkoppelen headset: " + error.message);
        } else {
            alert("Koppeling succesvol live verbroken.");
            await loadDashboardData();
        }
    }
};

// Automatically set devices status to CLEANING upon returning
async function handleBookingReturnDevices(bookingId) {
    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        let updated = false;
        devices.forEach(d => {
            if (d.assigned_booking_id === bookingId) {
                d.status = 'CLEANING';
                d.assigned_booking_id = null;
                d.last_checked = new Date().toISOString();
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
        }
    } else {
        try {
            const { error } = await supabaseClient
                .from('devices')
                .update({ status: 'CLEANING', assigned_booking_id: null, last_checked: new Date().toISOString() })
                .eq('assigned_booking_id', bookingId);
            if (error) {
                console.error("Fout bij automatisch bijwerken apparaatstatus in Supabase:", error.message);
            }
        } catch (e) {
            console.error("Uitzondering bij live bijwerken apparaatstatus:", e);
        }
    }
}
