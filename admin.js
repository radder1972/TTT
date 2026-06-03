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

// Signature Pad & Notification Variables
let canvas = null;
let ctx = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let activeSignBookingId = null;
let activeNotifBookingId = null;
let activeNotifType = null;

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

    // Signature Pad Initialization
    canvas = document.getElementById('signature-canvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0f172a'; // slate 900
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Clear Signature button
        const btnClear = document.getElementById('btn-clear-signature');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const guide = document.getElementById('canvas-guide-text');
                if (guide) guide.style.display = 'block';
            });
        }

        // Save Signature button
        const btnSaveSig = document.getElementById('btn-save-signature');
        if (btnSaveSig) {
            btnSaveSig.addEventListener('click', saveSignature);
        }

        // Drawing logic
        const startDrawing = (x, y) => {
            isDrawing = true;
            [lastX, lastY] = [x, y];
            const guide = document.getElementById('canvas-guide-text');
            if (guide) guide.style.display = 'none';
        };

        const draw = (x, y) => {
            if (!isDrawing) return;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            [lastX, lastY] = [x, y];
        };

        const stopDrawing = () => {
            isDrawing = false;
        };

        // Mouse Events
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            startDrawing(e.clientX - rect.left, e.clientY - rect.top);
        });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            draw(e.clientX - rect.left, e.clientY - rect.top);
        });
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch Events for Mobile
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
                e.preventDefault();
            }
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const rect = canvas.getBoundingClientRect();
                const touch = e.touches[0];
                draw(touch.clientX - rect.left, touch.clientY - rect.top);
                e.preventDefault();
            }
        }, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
    }

    // Confirm Send Notification Event
    const btnConfirmSendNotif = document.getElementById('btn-confirm-send-notif');
    if (btnConfirmSendNotif) {
        btnConfirmSendNotif.addEventListener('click', confirmSendNotification);
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
            currentSessionUser = { email: "info@truetimethai.com" };
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
        if (email === "info@truetimethai.com" && password === "R@dd3r1972?12345") {
            localStorage.setItem('ttt_admin_auth', 'true');
            alert("Inloggen succesvol!");
            checkAuthSession();
        } else {
            alert("Foutief e-mailadres of wachtwoord! Probeer info@truetimethai.com / R@dd3r1972?12345");
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
let currentDetailBookingId = null;

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
                <td colspan="6" class="text-center text-muted">Geen boekingen gevonden die voldoen aan de criteria.</td>
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

        // Format accessories
        const extras = [];
        if (b.extra_sim === true || b.extra_sim === "Ja (+ ฿350 per stuk)") extras.push("SIM");
        if (b.extra_powerbank === true || b.extra_powerbank === "Ja (+ ฿175 per stuk)") extras.push("Powerbank");
        const extrasText = extras.length > 0 ? ` (+ ${extras.join(' & ')})` : '';

        // Table Row HTML - simplified to 6 columns
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
                    <span class="text-muted small">${extrasText || 'Geen extra\'s'}</span>
                </td>
                <td>
                    <strong>฿${parseInt(b.total_price_thb).toLocaleString()}</strong>
                </td>
                <td>
                    <span class="admin-status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td>
                    <button type="button" class="btn btn-xs btn-neon" onclick="openBookingDetails('${b.id}')" style="display: inline-flex; align-items: center; gap: 6px;">
                        Details
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 12px; height: 12px;">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml;
    
    // Auto-refresh details modal if it is currently open
    refreshBookingDetailsIfOpen();
}

function refreshBookingDetailsIfOpen() {
    const modal = document.getElementById('modal-booking-details');
    if (modal && modal.classList.contains('active') && currentDetailBookingId) {
        renderBookingDetails(currentDetailBookingId);
    }
}

window.openBookingDetails = function(bookingId) {
    currentDetailBookingId = bookingId;
    renderBookingDetails(bookingId);
    openAdminModal('modal-booking-details');
};

window.renderBookingDetails = function(bookingId) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) {
        closeAdminModal('modal-booking-details');
        return;
    }

    const modalBody = document.getElementById('booking-details-body');
    if (!modalBody) return;

    // Date formatting
    const periodText = `${formatDateString(booking.start_date)} t/m ${formatDateString(booking.end_date)}`;

    // Extras formatting
    const extras = [];
    if (booking.extra_sim === true || booking.extra_sim === "Ja (+ ฿350 per stuk)") extras.push("5G SIM-kaart");
    if (booking.extra_powerbank === true || booking.extra_powerbank === "Ja (+ ฿175 per stuk)") extras.push("Powerbank");
    const extrasText = extras.length > 0 ? extras.join(' & ') : 'Geen extra\'s';

    // Status pill & label
    let statusClass = 'badge-pending';
    let statusLabel = 'Gereserveerd / Betaald';
    if (booking.status === 'CONFIRMED') {
        statusClass = 'badge-confirmed';
        statusLabel = 'Betaald';
    } else if (booking.status === 'PICKED_UP') {
        statusClass = 'badge-active';
        statusLabel = 'Actief';
    } else if (booking.status === 'RETURNED') {
        statusClass = 'badge-completed';
        statusLabel = 'Ingeleverd';
    } else if (booking.status === 'CANCELLED') {
        statusClass = 'badge-cancelled';
        statusLabel = 'Geannuleerd';
    }

    // Devices assigned logic
    const assignedDevices = activeDevices.filter(d => d.assigned_booking_id === booking.id);
    let devicesHtml = '';
    
    // 1. Build list of currently assigned devices
    let assignedListHtml = '';
    if (assignedDevices.length > 0) {
        assignedListHtml = `
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
                ${assignedDevices.map(d => `
                    <span class="tag-device" style="position: relative; padding-right: 22px; display: inline-flex; align-items: center;">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 4px; width: 12px; height: 12px;"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        ${d.serial_number}
                        ${booking.status !== 'RETURNED' && booking.status !== 'CANCELLED' ? `
                            <span onclick="unassignSingleDevice('${d.id}')" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--thai-red); font-size: 0.75rem; font-weight: bold;" title="Koppeling verbreken">✕</span>
                        ` : ''}
                    </span>
                `).join('')}
            </div>
        `;
    } else {
        assignedListHtml = `<p class="text-muted small" style="margin-bottom: 8px;">Geen headsets gekoppeld</p>`;
    }

    // 2. Build dropdown selector if more headsets can be assigned
    let selectDropdownHtml = '';
    if ((booking.status === 'CONFIRMED' || booking.status === 'PICKED_UP') && assignedDevices.length < booking.earbud_count) {
        const availableDevices = activeDevices.filter(d => d.status === 'AVAILABLE');
        let selectOptions = `<option value="">Koppel een headset...</option>`;
        availableDevices.forEach(d => {
            selectOptions += `<option value="${d.id}">${d.serial_number}</option>`;
        });
        selectDropdownHtml = `
            <div>
                <select class="device-status-select" onchange="assignDeviceToBooking('${booking.id}', this.value)" style="width: 100%; max-width: 220px; height: 36px; padding: 6px 12px; font-size: 0.85rem;">
                    ${selectOptions}
                </select>
                <p class="text-muted small" style="margin-top: 4px; font-size: 0.75rem;">Koppel headset ${assignedDevices.length + 1} van ${booking.earbud_count}</p>
            </div>
        `;
    } else if (assignedDevices.length >= booking.earbud_count) {
        selectDropdownHtml = `<p class="text-green small" style="margin-top: 4px; font-weight: bold;">✓ Alle ${booking.earbud_count} headsets gekoppeld</p>`;
    }

    devicesHtml = `
        <div>
            ${assignedListHtml}
            ${selectDropdownHtml}
        </div>
    `;

    // Contract Status
    let contractHtml = '';
    if (booking.signature_data) {
        contractHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="contract-badge signed" style="display: inline-block; align-self: flex-start;">✓ Getekend</div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-xs btn-outline" style="padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;" onclick="viewSignedContract('${booking.id}')">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Contract Openen
                    </button>
                </div>
            </div>
        `;
    } else {
        contractHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="contract-badge unsigned" style="display: inline-block; align-self: flex-start;">Niet getekend</div>
                ${booking.status === 'CONFIRMED' || booking.status === 'PICKED_UP' ? `
                    <button type="button" class="btn btn-xs btn-neon" style="padding: 6px 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;" onclick="openSignaturePad('${booking.id}')">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Tekenen
                    </button>
                ` : '<span class="text-muted">-</span>'}
            </div>
        `;
    }

    // Actions button selector for standard update actions (In gebruik geven, Terugontvangen, etc.)
    let statusActionBtnHtml = '';
    if (booking.status === 'CONFIRMED') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-neon btn-block" style="height: 36px;" onclick="updateBookingStatus('${booking.id}', 'PICKED_UP')">In gebruik geven</button>`;
    } else if (booking.status === 'PICKED_UP') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-outline btn-block" style="height: 36px;" onclick="updateBookingStatus('${booking.id}', 'RETURNED')">Terugontvangen</button>`;
    } else if (booking.status !== 'CANCELLED' && booking.status !== 'RETURNED') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-outline btn-block" style="height: 36px; color: var(--thai-red); border-color: var(--thai-red);" onclick="updateBookingStatus('${booking.id}', 'CANCELLED')">Annuleren</button>`;
    } else {
        statusActionBtnHtml = `<span class="text-muted text-center block">Geen statusacties beschikbaar</span>`;
    }

    // Modal Layout HTML
    modalBody.innerHTML = `
        <div class="booking-details-grid">
            <!-- Left Side: Booking & Client Info -->
            <div class="booking-details-col">
                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Klantgegevens
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Naam:</th>
                            <td><strong>${booking.customer_name}</strong></td>
                        </tr>
                        <tr>
                            <th>E-mail:</th>
                            <td><a href="mailto:${booking.customer_email}" style="color: var(--neon-cyan); text-decoration: none;">${booking.customer_email}</a></td>
                        </tr>
                        <tr>
                            <th>Ophaallocatie:</th>
                            <td><span style="font-size: 0.9rem;">${formatLocationText(booking.pickup_location)}</span></td>
                        </tr>
                    </table>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        Huurdetails
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Periode:</th>
                            <td><span style="font-weight: 600;">${periodText}</span></td>
                        </tr>
                        <tr>
                            <th>Sets:</th>
                            <td><strong>${booking.earbud_count}x</strong> Timekettle W4 Pro</td>
                        </tr>
                        <tr>
                            <th>Extra's:</th>
                            <td><span class="text-muted">${extrasText}</span></td>
                        </tr>
                        <tr>
                            <th>Gekoppelde Sets:</th>
                            <td>${devicesHtml}</td>
                        </tr>
                    </table>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        Betaling
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Totaal:</th>
                            <td><strong style="color: var(--success); font-size: 1.15rem;">฿${parseInt(booking.total_price_thb).toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                            <th>Methode:</th>
                            <td>${booking.payment_method}</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td><span class="text-green" style="font-weight: bold;">✓ ${booking.payment_status}</span></td>
                        </tr>
                        <tr>
                            <th>Transactie-ID:</th>
                            <td><code style="font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; word-break: break-all;">${booking.transaction_id}</code></td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Right Side: Status, Deposit & Actions -->
            <div class="booking-details-col">
                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Status & Borg
                    </h5>
                    <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
                        <div class="form-group">
                            <label style="font-size: 0.85rem; color: var(--text-muted);">Snel Status Bijwerken:</label>
                            <div style="margin-top: 8px;">
                                ${statusActionBtnHtml}
                            </div>
                        </div>

                        <div class="form-group" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
                            <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 8px;">Borgbeheer:</label>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">Borg Type:</span>
                                    <select class="deposit-type-select" onchange="updateBookingDeposit('${booking.id}', 'deposit_type', this.value)" style="height: 30px; font-size: 0.85rem; padding: 2px 8px; width: 140px; margin: 0;">
                                        <option value="Cash THB" ${booking.deposit_type === 'Cash THB' || !booking.deposit_type ? 'selected' : ''}>Cash THB</option>
                                        <option value="Cash EUR/USD" ${booking.deposit_type === 'Cash EUR/USD' ? 'selected' : ''}>Cash EUR/USD</option>
                                        <option value="Paspoort" ${booking.deposit_type === 'Paspoort' ? 'selected' : ''}>Paspoort Kopie</option>
                                        <option value="Creditcard" ${booking.deposit_type === 'Creditcard' ? 'selected' : ''}>Creditcard Hold</option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 16px; align-items: center; margin-top: 4px;">
                                    <div class="deposit-checkbox-row" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                                        <input type="checkbox" id="det-dep-rec-${booking.id}" ${booking.deposit_received ? 'checked' : ''} onchange="updateBookingDeposit('${booking.id}', 'deposit_received', this.checked)">
                                        <label for="det-dep-rec-${booking.id}" style="font-size: 0.85rem; font-weight: 500;">Ontvangen</label>
                                    </div>
                                    <div class="deposit-checkbox-row" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                                        <input type="checkbox" id="det-dep-ret-${booking.id}" ${booking.deposit_returned ? 'checked' : ''} ${booking.deposit_received ? '' : 'disabled'} onchange="updateBookingDeposit('${booking.id}', 'deposit_returned', this.checked)">
                                        <label for="det-dep-ret-${booking.id}" style="font-size: 0.85rem; font-weight: 500;">Retour</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Huurcontract
                    </h5>
                    <div style="margin-top: 8px;">
                        ${contractHtml}
                    </div>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Operaties & Notificaties
                    </h5>
                    <div class="details-actions-panel" style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button type="button" class="btn btn-xs btn-outline" style="height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="sendPickupNotification('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            Ophaalbericht
                        </button>
                        <button type="button" class="btn btn-xs btn-outline" style="height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="sendReturnNotification('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Inleverbericht
                        </button>
                        <button type="button" class="btn btn-xs btn-outline" style="grid-column: span 2; height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="printBookingInvoice('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                            Factuur printen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

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

// Sync total stock setting with actual count of devices
async function syncTotalStockWithDevices() {
    const count = activeDevices.length;
    totalStock = count;
    
    // Update local storage
    localStorage.setItem('ttt_total_stock', count.toString());
    
    // Recalculate stats on dashboard
    calculateDashboardStats();
    
    // Update Supabase setting if not simulated
    if (!isSimulated && window.supabaseClient) {
        try {
            await supabaseClient
                .from('settings')
                .upsert({ key: 'total_stock', value: count.toString() });
        } catch (e) {
            console.error("Fout bij syncen van live totale voorraad:", e);
        }
    }
}

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
    await syncTotalStockWithDevices();
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
    const cleaning = activeDevices.filter(d => d.status === 'CLEANING').length;
    const maintenance = activeDevices.filter(d => d.status === 'MAINTENANCE').length;
    const totalCleaningAndMaintenance = cleaning + maintenance;

    if (totalWidget) totalWidget.textContent = total;
    if (availableWidget) availableWidget.textContent = available;
    if (rentedWidget) rentedWidget.textContent = rented;
    if (cleaningWidget) cleaningWidget.textContent = totalCleaningAndMaintenance;

    // Sidebar status indicators
    const sbTotal = document.getElementById('sb-total-devices');
    const sbAvailable = document.getElementById('sb-available-devices');
    const sbRented = document.getElementById('sb-rented-devices');
    const sbCleaning = document.getElementById('sb-cleaning-devices');
    const sbMaintenance = document.getElementById('sb-maintenance-devices');

    if (sbTotal) sbTotal.textContent = total;
    if (sbAvailable) sbAvailable.textContent = available;
    if (sbRented) sbRented.textContent = rented;
    if (sbCleaning) sbCleaning.textContent = cleaning;
    if (sbMaintenance) sbMaintenance.textContent = maintenance;
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

// Unassign a single device by its deviceId
window.unassignSingleDevice = async function(deviceId) {
    if (!confirm("Weet u zeker dat u deze headset-koppeling wilt verbreken?")) return;
    const timestamp = new Date().toISOString();

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        const dIndex = devices.findIndex(d => d.id === deviceId);
        if (dIndex !== -1) {
            devices[dIndex].assigned_booking_id = null;
            devices[dIndex].status = 'AVAILABLE';
            devices[dIndex].last_checked = timestamp;
            localStorage.setItem('ttt_devices', JSON.stringify(devices));
            alert("Koppeling verbroken. Headset is weer beschikbaar.");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('devices')
            .update({ assigned_booking_id: null, status: 'AVAILABLE', last_checked: timestamp })
            .eq('id', deviceId);

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

// ==========================================================================
// 6. Modal Popup Controls
// ==========================================================================
window.openAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// ==========================================================================
// 7. Signature Canvas Pad Drawing & Saving Logic
// ==========================================================================
window.openSignaturePad = function(bookingId) {
    activeSignBookingId = bookingId;
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    document.getElementById('sign-customer-name').textContent = booking.customer_name;
    document.getElementById('sign-customer-email').textContent = booking.customer_email;
    document.getElementById('sign-booking-id').textContent = booking.id;

    openAdminModal('modal-signature');
    
    // Setup canvas bounds
    setTimeout(() => {
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // Re-initialize context styles on resize/clear
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const guide = document.getElementById('canvas-guide-text');
            if (guide) guide.style.display = 'block';
        }
    }, 200);
};

window.saveSignature = async function() {
    if (!activeSignBookingId) return;
    
    const signatureDataUrl = canvas.toDataURL();
    const booking = activeBookings.find(b => b.id === activeSignBookingId);
    if (!booking) return;

    const saveBtn = document.getElementById('btn-save-signature');
    if (saveBtn) saveBtn.disabled = true;

    if (isSimulated) {
        booking.signature_data = signatureDataUrl;
        booking.signature_date = new Date().toISOString();
        if (booking.status === 'CONFIRMED') {
            booking.status = 'PICKED_UP';
            
            // Auto update devices status to RENTED
            const assignedDevices = activeDevices.filter(d => d.assigned_booking_id === booking.id);
            assignedDevices.forEach(d => {
                d.status = 'RENTED';
            });
            localStorage.setItem('ttt_devices', JSON.stringify(activeDevices));
        }
        
        const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
        let bookings = JSON.parse(bookingsStr);
        const idx = bookings.findIndex(b => b.id === activeSignBookingId);
        if (idx !== -1) {
            bookings[idx].signature_data = signatureDataUrl;
            bookings[idx].signature_date = booking.signature_date;
            bookings[idx].status = booking.status;
        }
        localStorage.setItem('ttt_bookings', JSON.stringify(bookings));
        
        alert("Huurcontract succesvol ondertekend en status gewijzigd naar Actief!");
        closeAdminModal('modal-signature');
        await loadDashboardData();
    } else {
        try {
            let updatePayload = {
                signature_data: signatureDataUrl,
                signature_date: new Date().toISOString()
            };
            if (booking.status === 'CONFIRMED') {
                updatePayload.status = 'PICKED_UP';
            }

            const { error } = await supabaseClient
                .from('bookings')
                .update(updatePayload)
                .eq('id', activeSignBookingId);

            if (error) {
                if (error.message.includes("column") || error.code === "P0002" || error.code === "42703") {
                    alert("Database-fout: De kolommen voor de handtekening ontbreken in de 'bookings' tabel. Schakelt tijdelijk over naar browseropslag. Run de SQL editor query!");
                    isSimulated = true;
                    await saveSignature();
                    return;
                } else {
                    alert("Fout bij opslaan handtekening: " + error.message);
                }
            } else {
                // Live assigned devices update to RENTED if confirmed
                if (booking.status === 'CONFIRMED') {
                    await supabaseClient
                        .from('devices')
                        .update({ status: 'RENTED' })
                        .eq('assigned_booking_id', activeSignBookingId);
                }
                alert("Huurcontract succesvol live ondertekend!");
                closeAdminModal('modal-signature');
                await loadDashboardData();
            }
        } catch (err) {
            console.error("Exception saving signature:", err);
            alert("Uitzondering bij opslaan handtekening.");
        }
    }
    if (saveBtn) saveBtn.disabled = false;
};

// ==========================================================================
// 8. View Contract & Print Layouts
// ==========================================================================
window.viewSignedContract = function(bookingId) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    document.getElementById('contract-cust-name').textContent = booking.customer_name;
    document.getElementById('contract-cust-email').textContent = booking.customer_email;
    document.getElementById('contract-booking-id').textContent = booking.id;
    document.getElementById('contract-period').textContent = `${formatDateString(booking.start_date)} t/m ${formatDateString(booking.end_date)}`;
    document.getElementById('contract-sets').textContent = `${booking.earbud_count}x W4 Pro`;
    document.getElementById('contract-deposit-type').textContent = booking.deposit_type || 'Cash THB';
    document.getElementById('contract-signature-img').src = booking.signature_data || '';
    document.getElementById('contract-signed-date').textContent = booking.signature_date ? new Date(booking.signature_date).toLocaleString('nl-NL') : '-';

    openAdminModal('modal-view-contract');
};

// ==========================================================================
// 9. Deposit Update Handlers
// ==========================================================================
window.updateBookingDeposit = async function(bookingId, field, value) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    booking[field] = value;

    // Reset return if received is unchecked
    if (field === 'deposit_received' && value === false) {
        booking.deposit_returned = false;
        const checkRet = document.getElementById(`dep-ret-${bookingId}`);
        if (checkRet) {
            checkRet.checked = false;
            checkRet.disabled = true;
        }
    } else if (field === 'deposit_received' && value === true) {
        const checkRet = document.getElementById(`dep-ret-${bookingId}`);
        if (checkRet) {
            checkRet.disabled = false;
        }
    }

    if (isSimulated) {
        const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
        let bookings = JSON.parse(bookingsStr);
        const idx = bookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) {
            bookings[idx][field] = value;
            if (field === 'deposit_received' && value === false) {
                bookings[idx].deposit_returned = false;
            }
        }
        localStorage.setItem('ttt_bookings', JSON.stringify(bookings));
        calculateDashboardStats();
    } else {
        try {
            let payload = { [field]: value };
            if (field === 'deposit_received' && value === false) {
                payload.deposit_returned = false;
            }
            
            const { error } = await supabaseClient
                .from('bookings')
                .update(payload)
                .eq('id', bookingId);
            
            if (error) {
                console.error("Fout bij bijwerken borggegevens in live database:", error.message);
                isSimulated = true;
                await updateBookingDeposit(bookingId, field, value);
            } else {
                calculateDashboardStats();
            }
        } catch (err) {
            console.error("Exception updating deposit:", err);
        }
    }
};

// ==========================================================================
// 10. Client Notification Gateways (Simulation)
// ==========================================================================
window.sendPickupNotification = function(bookingId) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    activeNotifBookingId = bookingId;
    activeNotifType = 'PICKUP';

    document.getElementById('notif-to').textContent = `${booking.customer_name} (${booking.customer_email})`;
    document.getElementById('notif-channels').textContent = "E-mail & SMS (Simulated)";
    document.getElementById('notif-subject').textContent = "Je True Time Thai W4 Pro AI-vertaaloordopjes liggen klaar!";
    
    const message = `Beste ${booking.customer_name},

Je boeking voor de True Time Thai W4 Pro AI-vertaaloordopjes gaat binnenkort van start!

📍 Ophaallocatie: ${formatLocationText(booking.pickup_location)}
📅 Startdatum: ${formatDateString(booking.start_date)}
🎧 Aantal sets: ${booking.earbud_count}

We kijken ernaar uit om je te verwelkomen en je te helpen met een zorgeloze vertaalervaring in Pattaya! Vergeet niet om een borg van 1000 THB (of paspoortkopie) mee te nemen.

Met vriendelijke groet,
Het True Time Thai Team`;

    document.getElementById('notif-body').textContent = message;
    openAdminModal('modal-notification-preview');
};

window.sendReturnNotification = function(bookingId) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    activeNotifBookingId = bookingId;
    activeNotifType = 'RETURN';

    document.getElementById('notif-to').textContent = `${booking.customer_name} (${booking.customer_email})`;
    document.getElementById('notif-channels').textContent = "E-mail & SMS (Simulated)";
    document.getElementById('notif-subject').textContent = "Belangrijke herinnering: inleveren oordopjes";
    
    const message = `Beste ${booking.customer_name},

We hopen dat je een fantastische tijd hebt gehad met de True Time Thai vertaaloordopjes!

Dit is een herinnering dat je huurperiode eindigt op ${formatDateString(booking.end_date)}. We verzoeken je vriendelijk om de apparatuur (oordopjes, powerbank en oplaadkabels) tijdig te retourneren om extra kosten te voorkomen.

📍 Inleverlocatie: ${formatLocationText(booking.pickup_location)}
📅 Einddatum: ${formatDateString(booking.end_date)}

Tot snel voor de inname!

Met vriendelijke groet,
Het True Time Thai Team`;

    document.getElementById('notif-body').textContent = message;
    openAdminModal('modal-notification-preview');
};

window.confirmSendNotification = function() {
    closeAdminModal('modal-notification-preview');
    alert("Bericht succesvol verzonden via gesimuleerde e-mail- en SMS-gateway!");
};
