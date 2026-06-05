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
let categoriesList = [];
let productsList = [];
let customersList = [];

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
                statusText.textContent = "Supabase Live Connected";
            }
            console.log("Supabase Client initialized successfully.");
        } catch (error) {
            console.error("Error loading Supabase client, fallback to simulation:", error);
            isSimulated = true;
        }
    } else {
        // Fallback simulated local storage
        isSimulated = true;
        if (statusDot) {
            statusDot.className = "pulse-dot orange";
        }
        if (statusText) {
            statusText.textContent = "Simulation Mode (LocalStorage)";
        }
        console.log("Supabase Anon Key is empty. System is running in Simulation Mode.");
        
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
        customer_name: "John Doe",
        customer_email: "john.doe@example.com",
        start_date: "2026-06-03",
        end_date: "2026-06-06",
        earbud_count: 2,
        pickup_location: "True Time Thai Office - Beach Road Pattaya",
        extra_sim: true,
        extra_powerbank: false,
        total_price_thb: 2200,
        payment_method: "Credit Card (Simulated)",
        payment_status: "PAID",
        transaction_id: "TXN_A8F9K4L2P",
        status: "CONFIRMED"
    },
    {
        id: "b2",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: "Sophie Dubois",
        customer_email: "sophie.dubois@example.com",
        start_date: "2026-06-01",
        end_date: "2026-06-07",
        earbud_count: 1,
        pickup_location: "Free Hotel Delivery in Pattaya - Hilton Pattaya",
        extra_sim: false,
        extra_powerbank: true,
        total_price_thb: 1675,
        payment_method: "PromptPay (Simulated)",
        payment_status: "PAID",
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
        payment_method: "Credit Card (Simulated)",
        payment_status: "PAID",
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
    initDummyRelationalData();
}

function initDummyRelationalData() {
    if (!localStorage.getItem('ttt_categories')) {
        const categories = [
            { id: 'c1111111-1111-1111-1111-111111111111', name: 'Translation Equipment' },
            { id: 'c2222222-2222-2222-2222-222222222222', name: 'Accessories' }
        ];
        localStorage.setItem('ttt_categories', JSON.stringify(categories));
    }
    if (!localStorage.getItem('ttt_products')) {
        const products = [
            { id: 'e1111111-1111-1111-1111-111111111111', category_id: 'c1111111-1111-1111-1111-111111111111', name: 'Timekettle W4 Pro AI Translation Earbuds', description: 'Premium AI translation earbuds with open-ear comfort and active noise cancellation.', base_rate: 250.00, type: 'serialized' },
            { id: 'e2222222-2222-2222-2222-222222222222', category_id: 'c2222222-2222-2222-2222-222222222222', name: '5G Local SIM Card', description: 'Local SIM card with unlimited 5G data.', base_rate: 350.00, type: 'bulk' },
            { id: 'e3333333-3333-3333-3333-333333333333', category_id: 'c2222222-2222-2222-2222-222222222222', name: 'Premium Power Bank', description: 'High-capacity power bank for charging on the go.', base_rate: 175.00, type: 'bulk' }
        ];
        localStorage.setItem('ttt_products', JSON.stringify(products));
    }
    if (!localStorage.getItem('ttt_customers')) {
        const customers = [
            { id: 'cust-1', name: 'John Doe', email: 'john.doe@example.com', phone: '+66 81 111 2222', city: 'Pattaya', address: 'Hilton Pattaya, Room 1402' },
            { id: 'cust-2', name: 'Sophie Dubois', email: 'sophie.dubois@example.com', phone: '+66 82 222 3333', city: 'Pattaya', address: 'Mövenpick Siam Hotel, Room 804' }
        ];
        localStorage.setItem('ttt_customers', JSON.stringify(customers));
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
                notes: `Set W4-${numStr} - Standard active set.`,
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
    const btnTabProducts = document.getElementById('btn-tab-products');
    const btnTabCustomers = document.getElementById('btn-tab-customers');
    if (btnTabBookings) btnTabBookings.addEventListener('click', () => showView('bookings'));
    if (btnTabInventory) btnTabInventory.addEventListener('click', () => showView('inventory'));
    if (btnTabProducts) btnTabProducts.addEventListener('click', () => showView('products'));
    if (btnTabCustomers) btnTabCustomers.addEventListener('click', () => showView('customers'));

    // Products & Categories filters/submits
    const productSearch = document.getElementById('product-search');
    if (productSearch) productSearch.addEventListener('input', renderProductsTable);

    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) addCategoryForm.addEventListener('submit', handleAddCategory);

    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) addProductForm.addEventListener('submit', handleAddProduct);

    const btnCancelProductEdit = document.getElementById('btn-cancel-product-edit');
    if (btnCancelProductEdit) btnCancelProductEdit.addEventListener('click', cancelProductEdit);

    // Customers filters/submits
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) customerSearch.addEventListener('input', renderCustomersTable);

    const addCustomerForm = document.getElementById('add-customer-form');
    if (addCustomerForm) addCustomerForm.addEventListener('submit', handleAddCustomer);

    const btnCancelCustomerEdit = document.getElementById('btn-cancel-customer-edit');
    if (btnCancelCustomerEdit) btnCancelCustomerEdit.addEventListener('click', cancelCustomerEdit);

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

    // Add Booking Form Submission
    const addBookingForm = document.getElementById('add-booking-form');
    if (addBookingForm) {
        addBookingForm.addEventListener('submit', handleAddBooking);
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
            alert("Login successful!");
            checkAuthSession();
        } else {
            alert("Incorrect email address or password! Try info@truetimethai.com / R@dd3r1972?12345");
        }
        if (loginBtn) loginBtn.disabled = false;
    } else {
        // Supabase Live Auth
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert("Login failed: " + error.message);
        } else {
            alert("Login successful!");
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
            alert("Error logging out: " + error.message);
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
            console.error("Error fetching stock from Supabase:", error);
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
        alert("Please enter a valid number greater than 0.");
        return;
    }

    const saveBtn = document.getElementById('btn-save-stock');
    if (saveBtn) saveBtn.disabled = true;

    if (isSimulated) {
        localStorage.setItem('ttt_total_stock', newVal.toString());
        totalStock = newVal;
        alert("Total stock successfully updated in simulation!");
        loadDashboardData();
    } else {
        const { error } = await supabaseClient
            .from('settings')
            .upsert({ key: 'total_stock', value: newVal.toString() });

        if (error) {
            alert("Error saving stock: " + error.message);
        } else {
            totalStock = newVal;
            alert("Total stock successfully saved live!");
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
        // Supabase Live relational select
        try {
            const { data, error } = await supabaseClient
                .from('rental_orders')
                .select('*, customers(name, email, phone), rental_order_lines(quantity, product_id)')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error.message);
                activeBookings = [];
            } else {
                activeBookings = (data || []).map(order => {
                    const customer = order.customers || {};
                    const headsetLine = (order.rental_order_lines || []).find(l => l.product_id === 'e1111111-1111-1111-1111-111111111111');
                    const simLine = (order.rental_order_lines || []).find(l => l.product_id === 'e2222222-2222-2222-2222-222222222222');
                    const powerbankLine = (order.rental_order_lines || []).find(l => l.product_id === 'e3333333-3333-3333-3333-333333333333');
                    
                    return {
                        id: order.id,
                        customer_name: customer.name || 'Unknown',
                        customer_email: customer.email || '',
                        customer_phone: customer.phone || '',
                        start_date: order.start_date,
                        end_date: order.end_date,
                        pickup_location: order.pickup_location,
                        status: order.status,
                        total_price_thb: order.total_price,
                        payment_method: order.payment_method,
                        payment_status: order.payment_status,
                        transaction_id: order.transaction_id,
                        deposit_type: order.deposit_type,
                        deposit_received: order.deposit_received,
                        deposit_returned: order.deposit_returned,
                        signature_data: order.signature_data,
                        signature_date: order.signed_date,
                        notes: order.notes,
                        earbud_count: headsetLine ? parseInt(headsetLine.quantity) : 1,
                        extra_sim: simLine ? true : false,
                        extra_powerbank: powerbankLine ? true : false,
                        created_at: order.created_at
                    };
                });
            }
        } catch (e) {
            console.error("Exception fetching live orders:", e);
            activeBookings = [];
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
    if (revWidget) revWidget.textContent = `à¸¿${totalRev.toLocaleString()}`;

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

    // Sort Bookings
    let sortedBookings = [...filtered];
    const state = sortStates['bookings'];
    if (state && state.column) {
        sortedBookings = sortData(sortedBookings, state.column, state.direction);
    }

    if (sortedBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">No bookings found matching the criteria.</td>
            </tr>
        `;
        updateSortIndicators('bookings');
        return;
    }

    let rowsHtml = '';
    sortedBookings.forEach(b => {
        // Date Formatting helper
        const periodText = `${formatDateString(b.start_date)} to ${formatDateString(b.end_date)}`;
        
        // Status pill classes
        let statusClass = 'badge-pending';
        let statusLabel = 'Reserved';
        
        if (b.status === 'CONFIRMED') {
            statusClass = 'badge-confirmed';
            statusLabel = 'Paid';
        } else if (b.status === 'PICKED_UP') {
            statusClass = 'badge-active';
            statusLabel = 'Active';
        } else if (b.status === 'RETURNED') {
            statusClass = 'badge-completed';
            statusLabel = 'Returned';
        } else if (b.status === 'CANCELLED') {
            statusClass = 'badge-cancelled';
            statusLabel = 'Cancelled';
        }

        // Format accessories
        const extras = [];
        if (b.extra_sim === true || b.extra_sim === "Yes (+ à¸¿350 each)" || b.extra_sim === "Ja (+ à¸¿350 per stuk)") extras.push("SIM");
        if (b.extra_powerbank === true || b.extra_powerbank === "Yes (+ à¸¿175 each)" || b.extra_powerbank === "Ja (+ à¸¿175 per stuk)") extras.push("Powerbank");
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
                    <span class="text-muted small">${extrasText || 'No extras'}</span>
                </td>
                <td>
                    <strong>à¸¿${parseInt(b.total_price_thb).toLocaleString()}</strong>
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
    updateSortIndicators('bookings');
    
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
    const periodText = `${formatDateString(booking.start_date)} to ${formatDateString(booking.end_date)}`;

    // Extras formatting
    const extras = [];
    if (booking.extra_sim === true || booking.extra_sim === "Ja (+ à¸¿350 per stuk)" || booking.extra_sim === "Yes (+ à¸¿350 each)") extras.push("5G SIM Card");
    if (booking.extra_powerbank === true || booking.extra_powerbank === "Ja (+ à¸¿175 per stuk)" || booking.extra_powerbank === "Yes (+ à¸¿175 each)") extras.push("Power Bank");
    const extrasText = extras.length > 0 ? extras.join(' & ') : 'No extras';

    // Status pill & label
    let statusClass = 'badge-pending';
    let statusLabel = 'Reserved / Paid';
    if (booking.status === 'CONFIRMED') {
        statusClass = 'badge-confirmed';
        statusLabel = 'Paid';
    } else if (booking.status === 'PICKED_UP') {
        statusClass = 'badge-active';
        statusLabel = 'Active';
    } else if (booking.status === 'RETURNED') {
        statusClass = 'badge-completed';
        statusLabel = 'Returned';
    } else if (booking.status === 'CANCELLED') {
        statusClass = 'badge-cancelled';
        statusLabel = 'Cancelled';
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
                            <span onclick="unassignSingleDevice('${d.id}')" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--thai-red); font-size: 0.75rem; font-weight: bold;" title="Unlink headset">âœ•</span>
                        ` : ''}
                    </span>
                `).join('')}
            </div>
        `;
    } else {
        assignedListHtml = `<p class="text-muted small" style="margin-bottom: 8px;">No headsets linked</p>`;
    }

    // 2. Build dropdown selector if more headsets can be assigned
    let selectDropdownHtml = '';
    if ((booking.status === 'CONFIRMED' || booking.status === 'PICKED_UP') && assignedDevices.length < booking.earbud_count) {
        const availableDevices = activeDevices.filter(d => d.status === 'AVAILABLE');
        let selectOptions = `<option value="">Link a headset...</option>`;
        availableDevices.forEach(d => {
            selectOptions += `<option value="${d.id}">${d.serial_number}</option>`;
        });
        selectDropdownHtml = `
            <div>
                <select class="device-status-select" onchange="assignDeviceToBooking('${booking.id}', this.value)" style="width: 100%; max-width: 220px; height: 36px; padding: 6px 12px; font-size: 0.85rem;">
                    ${selectOptions}
                </select>
                <p class="text-muted small" style="margin-top: 4px; font-size: 0.75rem;">Link headset ${assignedDevices.length + 1} of ${booking.earbud_count}</p>
            </div>
        `;
    } else if (assignedDevices.length >= booking.earbud_count) {
        selectDropdownHtml = `<p class="text-green small" style="margin-top: 4px; font-weight: bold;">âœ“ All ${booking.earbud_count} headsets linked</p>`;
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
                <div class="contract-badge signed" style="display: inline-block; align-self: flex-start;">âœ“ Signed</div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-xs btn-outline" style="padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;" onclick="viewSignedContract('${booking.id}')">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Open Contract
                    </button>
                </div>
            </div>
        `;
    } else {
        contractHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div class="contract-badge unsigned" style="display: inline-block; align-self: flex-start;">Not signed</div>
                ${booking.status === 'CONFIRMED' || booking.status === 'PICKED_UP' ? `
                    <button type="button" class="btn btn-xs btn-neon" style="padding: 6px 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;" onclick="openSignaturePad('${booking.id}')">
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Sign
                    </button>
                ` : '<span class="text-muted">-</span>'}
            </div>
        `;
    }

    // Actions button selector for standard update actions (In gebruik geven, Terugontvangen, etc.)
    let statusActionBtnHtml = '';
    if (booking.status === 'CONFIRMED') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-neon btn-block" style="height: 36px;" onclick="updateBookingStatus('${booking.id}', 'PICKED_UP')">Hand over (Active)</button>`;
    } else if (booking.status === 'PICKED_UP') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-outline btn-block" style="height: 36px;" onclick="updateBookingStatus('${booking.id}', 'RETURNED')">Receive back</button>`;
    } else if (booking.status !== 'CANCELLED' && booking.status !== 'RETURNED') {
        statusActionBtnHtml = `<button type="button" class="btn btn-sm btn-outline btn-block" style="height: 36px; color: var(--thai-red); border-color: var(--thai-red);" onclick="updateBookingStatus('${booking.id}', 'CANCELLED')">Cancel</button>`;
    } else {
        statusActionBtnHtml = `<span class="text-muted text-center block">No status actions available</span>`;
    }

    // Modal Layout HTML
    modalBody.innerHTML = `
        <div class="booking-details-grid">
            <!-- Left Side: Booking & Client Info -->
            <div class="booking-details-col">
                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        Customer Details
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Name:</th>
                            <td><strong>${booking.customer_name}</strong></td>
                        </tr>
                        <tr>
                            <th>Email:</th>
                            <td><a href="mailto:${booking.customer_email}" style="color: var(--neon-cyan); text-decoration: none;">${booking.customer_email}</a></td>
                        </tr>
                        <tr>
                            <th>Pickup Location:</th>
                            <td><span style="font-size: 0.9rem;">${formatLocationText(booking.pickup_location)}</span></td>
                        </tr>
                    </table>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        Rental Details
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Period:</th>
                            <td><span style="font-weight: 600;">${periodText}</span></td>
                        </tr>
                        <tr>
                            <th>Sets:</th>
                            <td><strong>${booking.earbud_count}x</strong> Timekettle W4 Pro</td>
                        </tr>
                        <tr>
                            <th>Extras:</th>
                            <td><span class="text-muted">${extrasText}</span></td>
                        </tr>
                        <tr>
                            <th>Linked Sets:</th>
                            <td>${devicesHtml}</td>
                        </tr>
                    </table>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        Payment
                    </h5>
                    <table class="details-table">
                        <tr>
                            <th>Total:</th>
                            <td><strong style="color: var(--success); font-size: 1.15rem;">à¸¿${parseInt(booking.total_price_thb).toLocaleString()}</strong></td>
                        </tr>
                        <tr>
                            <th>Method:</th>
                            <td>${booking.payment_method}</td>
                        </tr>
                        <tr>
                            <th>Status:</th>
                            <td><span class="text-green" style="font-weight: bold;">âœ“ ${booking.payment_status}</span></td>
                        </tr>
                        <tr>
                            <th>Transaction ID:</th>
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
                        Status & Deposit
                    </h5>
                    <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
                        <div class="form-group">
                            <label style="font-size: 0.85rem; color: var(--text-muted);">Quick Status Update:</label>
                            <div style="margin-top: 8px;">
                                ${statusActionBtnHtml}
                            </div>
                        </div>

                        <div class="form-group" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
                            <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 8px;">Deposit Management:</label>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">Deposit Type:</span>
                                    <select class="deposit-type-select" onchange="updateBookingDeposit('${booking.id}', 'deposit_type', this.value)" style="height: 30px; font-size: 0.85rem; padding: 2px 8px; width: 140px; margin: 0;">
                                        <option value="Cash THB" ${booking.deposit_type === 'Cash THB' || !booking.deposit_type ? 'selected' : ''}>Cash THB</option>
                                        <option value="Cash EUR/USD" ${booking.deposit_type === 'Cash EUR/USD' ? 'selected' : ''}>Cash EUR/USD</option>
                                        <option value="Paspoort" ${booking.deposit_type === 'Paspoort' ? 'selected' : ''}>Passport Copy</option>
                                        <option value="Creditcard" ${booking.deposit_type === 'Creditcard' ? 'selected' : ''}>Creditcard Hold</option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 16px; align-items: center; margin-top: 4px;">
                                    <div class="deposit-checkbox-row" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                                        <input type="checkbox" id="det-dep-rec-${booking.id}" ${booking.deposit_received ? 'checked' : ''} onchange="updateBookingDeposit('${booking.id}', 'deposit_received', this.checked)">
                                        <label for="det-dep-rec-${booking.id}" style="font-size: 0.85rem; font-weight: 500;">Received</label>
                                    </div>
                                    <div class="deposit-checkbox-row" style="margin: 0; display: flex; align-items: center; gap: 6px;">
                                        <input type="checkbox" id="det-dep-ret-${booking.id}" ${booking.deposit_returned ? 'checked' : ''} ${booking.deposit_received ? '' : 'disabled'} onchange="updateBookingDeposit('${booking.id}', 'deposit_returned', this.checked)">
                                        <label for="det-dep-ret-${booking.id}" style="font-size: 0.85rem; font-weight: 500;">Returned</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Rental Agreement
                    </h5>
                    <div style="margin-top: 8px;">
                        ${contractHtml}
                    </div>
                </div>

                <div class="details-section">
                    <h5>
                        <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Operations & Notifications
                    </h5>
                    <div class="details-actions-panel" style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button type="button" class="btn btn-xs btn-outline" style="height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="sendPickupNotification('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        Pickup Message
                        </button>
                        <button type="button" class="btn btn-xs btn-outline" style="height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="sendReturnNotification('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Return Message
                        </button>
                        <button type="button" class="btn btn-xs btn-outline" style="grid-column: span 2; height: 36px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="printBookingInvoice('${booking.id}')">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 0;"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Print Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// 7. Status Actions
window.updateBookingStatus = async function(id, newStatus) {
    if (!confirm(`Are you sure you want to change the status of booking ${id}?`)) {
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
            
            // Also update simulated rental_orders table
            const ordersStr = localStorage.getItem('ttt_rental_orders') || '[]';
            const orders = JSON.parse(ordersStr);
            const oIdx = orders.findIndex(o => o.id === id);
            if (oIdx !== -1) {
                orders[oIdx].status = newStatus;
                localStorage.setItem('ttt_rental_orders', JSON.stringify(orders));
            }

            if (newStatus === 'RETURNED') {
                await handleBookingReturnDevices(id);
            }
            alert("Status successfully updated!");
            loadDashboardData();
        }
    } else {
        // Update Supabase Database row
        const { error } = await supabaseClient
            .from('rental_orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert("Error updating status: " + error.message);
        } else {
            if (newStatus === 'RETURNED') {
                await handleBookingReturnDevices(id);
            }
            alert("Status successfully updated live!");
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
    if (locText.includes("Office")) return "Beach Road Office";
    if (locText.includes("Bezorging") || locText.includes("delivery") || locText.includes("Delivery")) return "Hotel Delivery";
    return locText;
}

// 9. Print Invoice function for admins
window.printBookingInvoice = function(id) {
    const booking = activeBookings.find(b => b.id === id);
    if (!booking) {
        alert("Booking not found!");
        return;
    }
    
    // Populate printable fields
    document.getElementById('print-invoice-id').textContent = booking.id;
    document.getElementById('print-invoice-period').textContent = `${formatDateString(booking.start_date)} to ${formatDateString(booking.end_date)}`;
    document.getElementById('print-cust-name').textContent = booking.customer_name;
    document.getElementById('print-cust-email').textContent = booking.customer_email;
    document.getElementById('print-pickup-loc').textContent = formatLocationText(booking.pickup_location);
    document.getElementById('print-total-thb').textContent = `à¸¿${parseInt(booking.total_price_thb).toLocaleString()}`;
    document.getElementById('print-pay-method').textContent = booking.payment_method;
    document.getElementById('print-txn-id').textContent = booking.transaction_id;
    
    // Status styling and text
    const statusEl = document.getElementById('print-pay-status');
    if (booking.status === 'CANCELLED') {
        statusEl.textContent = 'CANCELLED';
        statusEl.style.color = '#dc3545';
    } else if (booking.status === 'RETURNED') {
        statusEl.textContent = 'RETURNED / COMPLETED';
        statusEl.style.color = '#007bff';
    } else if (booking.status === 'PICKED_UP') {
        statusEl.textContent = 'IN USE (ACTIVE)';
        statusEl.style.color = '#ffc107';
    } else {
        statusEl.textContent = 'PAID / RESERVATION';
        statusEl.style.color = '#28a745';
    }
    
    // Populate items lists
    const itemsContainer = document.getElementById('print-invoice-items');
    const days = calculateDaysBetween(booking.start_date, booking.end_date);
    
    let itemsHtml = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>W4 Pro AI Translation Earbuds Rental (${booking.earbud_count}x set, ${days}d):</span>
            <span>à¸¿${(booking.earbud_count * 250 * days).toLocaleString()}</span>
        </div>
    `;
    
    if (booking.extra_sim === true || booking.extra_sim === "Yes (+ à¸¿350 each)" || booking.extra_sim === "Ja (+ à¸¿350 per stuk)") {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>5G Local SIM Card (${booking.earbud_count}x flat):</span>
                <span>à¸¿${(booking.earbud_count * 350).toLocaleString()}</span>
            </div>
        `;
    }
    
    if (booking.extra_powerbank === true || booking.extra_powerbank === "Yes (+ à¸¿175 each)" || booking.extra_powerbank === "Ja (+ à¸¿175 per stuk)") {
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span>Premium Power Bank (${booking.earbud_count}x flat):</span>
                <span>à¸¿${(booking.earbud_count * 175).toLocaleString()}</span>
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
    const btnProducts = document.getElementById('btn-tab-products');
    const btnCustomers = document.getElementById('btn-tab-customers');

    const viewBookings = document.getElementById('view-bookings');
    const viewInventory = document.getElementById('view-inventory');
    const viewProducts = document.getElementById('view-products');
    const viewCustomers = document.getElementById('view-customers');

    // Reset active tabs
    if (btnBookings) btnBookings.classList.remove('active');
    if (btnInventory) btnInventory.classList.remove('active');
    if (btnProducts) btnProducts.classList.remove('active');
    if (btnCustomers) btnCustomers.classList.remove('active');

    // Hide all views
    if (viewBookings) viewBookings.style.display = 'none';
    if (viewInventory) viewInventory.style.display = 'none';
    if (viewProducts) viewProducts.style.display = 'none';
    if (viewCustomers) viewCustomers.style.display = 'none';

    if (viewName === 'bookings') {
        if (btnBookings) btnBookings.classList.add('active');
        if (viewBookings) viewBookings.style.display = 'block';
        loadDashboardData();
    } else if (viewName === 'inventory') {
        if (btnInventory) btnInventory.classList.add('active');
        if (viewInventory) viewInventory.style.display = 'block';
        loadDevices();
    } else if (viewName === 'products') {
        if (btnProducts) btnProducts.classList.add('active');
        if (viewProducts) viewProducts.style.display = 'block';
        loadProductsAndCategories();
    } else if (viewName === 'customers') {
        if (btnCustomers) btnCustomers.classList.add('active');
        if (viewCustomers) viewCustomers.style.display = 'block';
        loadCustomersData();
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
            console.error("Error syncing live total stock:", e);
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
                .from('inventory')
                .select('*')
                .order('serial_number', { ascending: true });
            
            if (error) {
                console.error("Error fetching live devices from Supabase, falling back to LocalStorage:", error.message);
                const devicesStr = localStorage.getItem('ttt_devices') || '[]';
                activeDevices = JSON.parse(devicesStr);
                if (activeDevices.length === 0) {
                    localStorage.removeItem('ttt_devices');
                    initDummyDevices();
                    const freshDevicesStr = localStorage.getItem('ttt_devices') || '[]';
                    activeDevices = JSON.parse(freshDevicesStr);
                }
            } else {
                activeDevices = (data || []).map(d => ({
                    ...d,
                    assigned_booking_id: d.assigned_order_id
                }));
                if (activeDevices.length === 0) {
                    await seedLiveDevices();
                }
            }
        } catch (error) {
            console.error("Exception fetching devices:", error);
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
                product_id: 'e1111111-1111-1111-1111-111111111111',
                serial_number: `W4-${numStr}`,
                status: 'AVAILABLE',
                notes: `Set W4-${numStr} - Standard active set.`,
                last_checked: new Date().toISOString()
            });
        }
        const { data, error } = await supabaseClient
            .from('inventory')
            .insert(dummyDevices)
            .select();
        if (!error && data) {
            activeDevices = (data || []).map(d => ({
                ...d,
                assigned_booking_id: d.assigned_order_id
            }));
        }
    } catch (e) {
        console.error("Error seeding live devices:", e);
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

    // Sort Devices
    let sortedDevices = [...filtered];
    const state = sortStates['devices'];
    if (state && state.column) {
        sortedDevices = sortData(sortedDevices, state.column, state.direction);
    }

    if (sortedDevices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">No headsets found matching the criteria.</td>
            </tr>
        `;
        updateSortIndicators('devices');
        return;
    }

    let rowsHtml = '';
    sortedDevices.forEach(d => {
        let bookingText = '<span class="text-muted">-</span>';
        if (d.assigned_booking_id) {
            const booking = activeBookings.find(b => b.id === d.assigned_booking_id);
            if (booking) {
                bookingText = `<strong>${booking.customer_name}</strong><br><span class="text-muted small">${booking.customer_email}</span>`;
            } else {
                bookingText = `<span class="text-muted">Assigned (ID: ${d.assigned_booking_id})</span>`;
            }
        }

        const lastCheckedFormatted = d.last_checked ? new Date(d.last_checked).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-';

        rowsHtml += `
            <tr id="dev-row-${d.id}">
                <td><strong>${d.serial_number}</strong></td>
                <td><span class="small">Timekettle W4 Pro</span></td>
                <td>
                    <select class="device-status-select status-${d.status}" onchange="updateDeviceStatus('${d.id}', this.value)">
                        <option value="AVAILABLE" ${d.status === 'AVAILABLE' ? 'selected' : ''}>Available</option>
                        <option value="RENTED" ${d.status === 'RENTED' ? 'selected' : ''}>Rented</option>
                        <option value="CLEANING" ${d.status === 'CLEANING' ? 'selected' : ''}>In Cleaning (UV-C)</option>
                        <option value="MAINTENANCE" ${d.status === 'MAINTENANCE' ? 'selected' : ''}>Maintenance</option>
                    </select>
                </td>
                <td>${bookingText}</td>
                <td>
                    <input type="text" class="device-notes-input" value="${d.notes || ''}" onblur="updateDeviceNotes('${d.id}', this.value)" placeholder="Add a note...">
                </td>
                <td><span class="small">${lastCheckedFormatted}</span></td>
                <td>
                    <button type="button" class="btn btn-xs btn-outline btn-print-admin-icon" onclick="deleteDevice('${d.id}')" title="Remove Headset" style="width: 28px; height: 28px; border-radius: 50%; color: var(--thai-red);">
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
    updateSortIndicators('devices');
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
        alert("Please enter a valid serial number.");
        return;
    }

    const exists = activeDevices.some(d => d.serial_number === serial);
    if (exists) {
        alert(`Serial number ${serial} is already registered!`);
        return;
    }

    const newDevice = {
        product_id: 'e1111111-1111-1111-1111-111111111111',
        serial_number: serial,
        status: 'AVAILABLE',
        notes: notes || `Set ${serial} - Manually registered.`,
        last_checked: new Date().toISOString()
    };

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        newDevice.id = `dev-${Date.now()}`;
        devices.push(newDevice);
        localStorage.setItem('ttt_devices', JSON.stringify(devices));
        alert("Headset successfully added in simulation!");
        serialInput.value = '';
        if (notesInput) notesInput.value = '';
        await loadDevices();
    } else {
        const { error } = await supabaseClient
            .from('inventory')
            .insert([newDevice]);

        if (error) {
            alert("Error registering headset: " + error.message);
        } else {
            alert("Headset successfully registered live!");
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
            updateObj.assigned_order_id = null;
        }
        const { error } = await supabaseClient
            .from('inventory')
            .update(updateObj)
            .eq('id', deviceId);

        if (error) {
            alert("Error updating headset status: " + error.message);
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
            .from('inventory')
            .update({ notes: newNotes, last_checked: new Date().toISOString() })
            .eq('id', deviceId);

        if (error) {
            console.error("Error updating note in database:", error.message);
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
    if (!confirm(`Are you sure you want to remove headset ${device.serial_number}?`)) {
        return;
    }

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        let devices = JSON.parse(devicesStr);
        devices = devices.filter(d => d.id !== deviceId);
        localStorage.setItem('ttt_devices', JSON.stringify(devices));
        alert("Headset removed!");
        await loadDevices();
        renderBookingsTable();
    } else {
        const { error } = await supabaseClient
            .from('inventory')
            .delete()
            .eq('id', deviceId);

        if (error) {
            alert("Error removing headset: " + error.message);
        } else {
            alert("Headset successfully removed!");
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
            
            alert("Headset successfully linked and status changed to Active!");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('inventory')
            .update({ assigned_order_id: bookingId, status: 'RENTED', last_checked: timestamp })
            .eq('id', deviceId);

        if (error) {
            alert("Error assigning headset: " + error.message);
        } else {
            const booking = activeBookings.find(b => b.id === bookingId);
            if (booking && booking.status === 'CONFIRMED') {
                await supabaseClient
                    .from('rental_orders')
                    .update({ status: 'PICKED_UP' })
                    .eq('id', bookingId);
            }
            alert("Headset successfully linked live!");
            await loadDashboardData();
        }
    }
};

// Unassign device link
window.unassignDeviceFromBooking = async function(bookingId) {
    if (!confirm("Are you sure you want to unlink the headset from this booking?")) return;
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
            alert("Connection unlinked. Headset is available again.");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('inventory')
            .update({ assigned_order_id: null, status: 'AVAILABLE', last_checked: timestamp })
            .eq('assigned_order_id', bookingId);

        if (error) {
            alert("Error unlinking headset: " + error.message);
        } else {
            alert("Connection successfully unlinked live.");
            await loadDashboardData();
        }
    }
};

// Unassign a single device by its deviceId
window.unassignSingleDevice = async function(deviceId) {
    if (!confirm("Are you sure you want to unlink this headset?")) return;
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
            alert("Connection unlinked. Headset is available again.");
            await loadDashboardData();
        }
    } else {
        const { error } = await supabaseClient
            .from('inventory')
            .update({ assigned_order_id: null, status: 'AVAILABLE', last_checked: timestamp })
            .eq('id', deviceId);

        if (error) {
            alert("Error unlinking headset: " + error.message);
        } else {
            alert("Connection successfully unlinked live.");
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
                .from('inventory')
                .update({ status: 'CLEANING', assigned_order_id: null, last_checked: new Date().toISOString() })
                .eq('assigned_order_id', bookingId);
            if (error) {
                console.error("Error updating device status automatically in Supabase:", error.message);
            }
        } catch (e) {
            console.error("Exception updating device status live:", e);
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
        
        alert("Rental contract signed successfully and status changed to Active!");
        closeAdminModal('modal-signature');
        await loadDashboardData();
    } else {
        try {
            let updatePayload = {
                signature_data: signatureDataUrl,
                signed_date: new Date().toISOString()
            };
            if (booking.status === 'CONFIRMED') {
                updatePayload.status = 'PICKED_UP';
            }

            const { error } = await supabaseClient
                .from('rental_orders')
                .update(updatePayload)
                .eq('id', activeSignBookingId);

            if (error) {
                if (error.message.includes("column") || error.code === "P0002" || error.code === "42703") {
                    alert("Database error: Signature columns are missing in 'rental_orders' table. Temporarily switching to browser storage.");
                    isSimulated = true;
                    await saveSignature();
                    return;
                } else {
                    alert("Error saving signature: " + error.message);
                }
            } else {
                // Live assigned devices update to RENTED if confirmed
                if (booking.status === 'CONFIRMED') {
                    await supabaseClient
                        .from('inventory')
                        .update({ status: 'RENTED' })
                        .eq('assigned_order_id', activeSignBookingId);
                }
                alert("Rental contract signed successfully live!");
                closeAdminModal('modal-signature');
                await loadDashboardData();
            }
        } catch (err) {
            console.error("Exception saving signature:", err);
            alert("Exception occurred while saving signature.");
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
    document.getElementById('contract-period').textContent = `${formatDateString(booking.start_date)} to ${formatDateString(booking.end_date)}`;
    document.getElementById('contract-sets').textContent = `${booking.earbud_count}x W4 Pro`;
    document.getElementById('contract-deposit-type').textContent = booking.deposit_type || 'Cash THB';
    document.getElementById('contract-signature-img').src = booking.signature_data || '';
    document.getElementById('contract-signed-date').textContent = booking.signature_date ? new Date(booking.signature_date).toLocaleString('en-US') : '-';

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
                .from('rental_orders')
                .update(payload)
                .eq('id', bookingId);
            
            if (error) {
                console.error("Error updating deposit data in live database, falling back to LocalStorage:", error.message);
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
    document.getElementById('notif-channels').textContent = "Email & SMS (Simulated)";
    document.getElementById('notif-subject').textContent = "Your True Time Thai W4 Pro AI Translation Earbuds are ready!";
    
    const message = `Dear ${booking.customer_name},

Your booking for the True Time Thai W4 Pro AI Translation Earbuds is starting soon!

ðŸ“ Pickup Location: ${formatLocationText(booking.pickup_location)}
ðŸ“… Start Date: ${formatDateString(booking.start_date)}
ðŸŽ§ Number of Sets: ${booking.earbud_count}

We look forward to welcoming you and helping you experience a hassle-free journey in Pattaya! Please remember to bring a security deposit of 1,000 THB (or a copy of your passport).

Best regards,
The True Time Thai Team`;

    document.getElementById('notif-body').textContent = message;
    openAdminModal('modal-notification-preview');
};

window.sendReturnNotification = function(bookingId) {
    const booking = activeBookings.find(b => b.id === bookingId);
    if (!booking) return;

    activeNotifBookingId = bookingId;
    activeNotifType = 'RETURN';

    document.getElementById('notif-to').textContent = `${booking.customer_name} (${booking.customer_email})`;
    document.getElementById('notif-channels').textContent = "Email & SMS (Simulated)";
    document.getElementById('notif-subject').textContent = "Important reminder: return your translation earbuds";
    
    const message = `Dear ${booking.customer_name},

We hope you had a fantastic time using the True Time Thai translation earbuds!

This is a friendly reminder that your rental period ends on ${formatDateString(booking.end_date)}. Please return the equipment (earbuds, charging case, power bank, and charging cables) on time to avoid additional charges.

ðŸ“ Return Location: ${formatLocationText(booking.pickup_location)}
ðŸ“… End Date: ${formatDateString(booking.end_date)}

See you soon for the return!

Best regards,
The True Time Thai Team`;

    document.getElementById('notif-body').textContent = message;
    openAdminModal('modal-notification-preview');
};

window.confirmSendNotification = function() {
    closeAdminModal('modal-notification-preview');
    alert("Message successfully sent via simulated email & SMS gateway!");
};

// ==========================================================================
// 11. PRODUCTS, CATEGORIES, AND CUSTOMERS MANAGEMENT
// ==========================================================================
async function loadProductsAndCategories() {
    await loadCategories();
    await loadProducts();
}

async function loadCategories() {
    if (isSimulated) {
        initDummyRelationalData();
        const catsStr = localStorage.getItem('ttt_categories') || '[]';
        categoriesList = JSON.parse(catsStr);
        renderCategoriesDropdown();
        renderCategoriesList();
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('name', { ascending: true });
            if (error) {
                console.error("Error loading categories:", error.message);
            } else {
                categoriesList = data || [];
                renderCategoriesDropdown();
                renderCategoriesList();
            }
        } catch (e) {
            console.error("Exception loading categories live:", e);
        }
    }
}

async function loadProducts() {
    if (isSimulated) {
        initDummyRelationalData();
        const prodsStr = localStorage.getItem('ttt_products') || '[]';
        productsList = JSON.parse(prodsStr);
        renderProductsTable();
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select(`
                    id, category_id, name, description, base_rate, type,
                    categories (name)
                `)
                .order('name', { ascending: true });
            if (error) {
                console.error("Error loading products:", error.message);
            } else {
                productsList = data || [];
                renderProductsTable();
            }
        } catch (e) {
            console.error("Exception loading products live:", e);
        }
    }
}

async function loadCustomersData() {
    if (isSimulated) {
        initDummyRelationalData();
        const custsStr = localStorage.getItem('ttt_customers') || '[]';
        customersList = JSON.parse(custsStr);
        renderCustomersTable();
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('customers')
                .select('*')
                .order('name', { ascending: true });
            if (error) {
                console.error("Error loading customers:", error.message);
            } else {
                customersList = data || [];
                renderCustomersTable();
            }
        } catch (e) {
            console.error("Exception loading customers live:", e);
        }
    }
}

function renderCategoriesDropdown() {
    const select = document.getElementById('select-product-category');
    if (!select) return;
    
    if (categoriesList.length === 0) {
        select.innerHTML = '<option value="">No categories available...</option>';
        return;
    }
    
    select.innerHTML = categoriesList.map(c => `
        <option value="${c.id}">${c.name}</option>
    `).join('');
}

function renderCategoriesList() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    
    if (categoriesList.length === 0) {
        list.innerHTML = '<li>No categories defined yet.</li>';
        return;
    }
    
    list.innerHTML = categoriesList.map(c => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.03);">
            <span>${c.name}</span>
            <span onclick="deleteCategory('${c.id}')" style="cursor: pointer; color: var(--thai-red); font-size: 0.75rem; font-weight: bold; margin-left: 10px;" title="Delete category">✕</span>
        </li>
    `).join('');
}

function renderProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    const searchVal = document.getElementById('product-search') ? document.getElementById('product-search').value.toLowerCase().trim() : '';
    
    const filtered = productsList.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchVal);
        const descMatch = (p.description || '').toLowerCase().includes(searchVal);
        const catName = p.categories ? p.categories.name : '';
        const catMatch = catName.toLowerCase().includes(searchVal);
        return nameMatch || descMatch || catMatch;
    });

    // Sort Products
    let sortedProducts = [...filtered];
    const state = sortStates['products'];
    if (state && state.column) {
        sortedProducts = sortData(sortedProducts, state.column, state.direction);
    }
    
    if (sortedProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 16px;">No products found.</td></tr>`;
        updateSortIndicators('products');
        return;
    }
    
    tableBody.innerHTML = sortedProducts.map(p => {
        let catName = '-';
        if (p.categories) {
            catName = p.categories.name;
        } else if (p.category_id) {
            const cat = categoriesList.find(c => c.id === p.category_id);
            if (cat) catName = cat.name;
        }
        
        return `
            <tr>
                <td style="font-weight: bold; color: var(--thai-blue);">${p.name}</td>
                <td><span class="badge-status status-confirmed" style="background: rgba(18, 44, 84, 0.05); color: var(--thai-blue); border-color: rgba(18, 44, 84, 0.15);">${catName}</span></td>
                <td>฿${parseFloat(p.base_rate).toFixed(2)}</td>
                <td><span class="badge-status" style="font-size: 0.75rem; padding: 2px 6px;">${p.type}</span></td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.description || ''}">${p.description || '-'}</td>
                <td>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" class="btn btn-xs btn-outline" onclick="editProduct('${p.id}')">Edit</button>
                        <button type="button" class="btn btn-xs btn-outline" style="color: var(--thai-red); border-color: rgba(208, 42, 42, 0.2);" onclick="deleteProduct('${p.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    updateSortIndicators('products');
}

function renderCustomersTable() {
    const tableBody = document.getElementById('customers-table-body');
    if (!tableBody) return;
    
    const searchVal = document.getElementById('customer-search') ? document.getElementById('customer-search').value.toLowerCase().trim() : '';
    
    const filtered = customersList.filter(c => {
        const nameMatch = c.name.toLowerCase().includes(searchVal);
        const emailMatch = c.email.toLowerCase().includes(searchVal);
        const cityMatch = (c.city || '').toLowerCase().includes(searchVal);
        const phoneMatch = (c.phone || '').toLowerCase().includes(searchVal);
        return nameMatch || emailMatch || cityMatch || phoneMatch;
    });

    // Sort Customers
    let sortedCustomers = [...filtered];
    const state = sortStates['customers'];
    if (state && state.column) {
        sortedCustomers = sortData(sortedCustomers, state.column, state.direction);
    }
    
    if (sortedCustomers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 16px;">No customers found.</td></tr>`;
        updateSortIndicators('customers');
        return;
    }
    
    tableBody.innerHTML = sortedCustomers.map(c => `
        <tr>
            <td style="font-weight: bold; color: var(--thai-blue);">${c.name}</td>
            <td style="font-size: 0.8rem;">${c.email}</td>
            <td>${c.phone || '-'}</td>
            <td>${c.city || '-'}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.address || ''}">${c.address || '-'}</td>
            <td>
                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-xs btn-outline" onclick="editCustomer('${c.id}')">Edit</button>
                    <button type="button" class="btn btn-xs btn-outline" style="color: var(--thai-red); border-color: rgba(208, 42, 42, 0.2);" onclick="deleteCustomer('${c.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
    updateSortIndicators('customers');
}

// Category Submission
window.handleAddCategory = async function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('input-category-name');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) return;
    
    // Check duplicates
    const exists = categoriesList.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert(`Category "${name}" already exists!`);
        return;
    }
    
    const newCat = {
        name: name
    };
    
    if (isSimulated) {
        newCat.id = `cat-${Date.now()}`;
        const cats = JSON.parse(localStorage.getItem('ttt_categories') || '[]');
        cats.push(newCat);
        localStorage.setItem('ttt_categories', JSON.stringify(cats));
        alert("Category successfully created in simulation!");
        nameInput.value = '';
        await loadCategories();
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .insert([newCat])
                .select();
            if (error) {
                alert("Error adding category: " + error.message);
            } else {
                alert("Category successfully created live!");
                nameInput.value = '';
                await loadCategories();
            }
        } catch (err) {
            alert("Exception adding category: " + err.message);
        }
    }
};

window.deleteCategory = async function(id) {
    if (id === 'c1111111-1111-1111-1111-111111111111' || id === 'c2222222-2222-2222-2222-222222222222') {
        alert("Cannot delete standard system categories!");
        return;
    }
    
    if (!confirm("Are you sure you want to delete this category? Products in this category may be unlinked.")) return;
    
    if (isSimulated) {
        let cats = JSON.parse(localStorage.getItem('ttt_categories') || '[]');
        cats = cats.filter(c => c.id !== id);
        localStorage.setItem('ttt_categories', JSON.stringify(cats));
        
        // Unlink categories in products
        let prods = JSON.parse(localStorage.getItem('ttt_products') || '[]');
        prods = prods.map(p => p.category_id === id ? { ...p, category_id: null } : p);
        localStorage.setItem('ttt_products', JSON.stringify(prods));
        
        alert("Category deleted successfully in simulation!");
        await loadProductsAndCategories();
    } else {
        try {
            const { error } = await supabaseClient
                .from('categories')
                .delete()
                .eq('id', id);
            if (error) {
                alert("Error deleting category: " + error.message);
            } else {
                alert("Category deleted successfully live!");
                await loadProductsAndCategories();
            }
        } catch (err) {
            alert("Exception deleting category: " + err.message);
        }
    }
};

// Product Submission (Add or Edit)
window.openProductModal = function() {
    cancelProductEdit();
    openAdminModal('modal-product-form');
};

window.closeProductModal = function() {
    closeAdminModal('modal-product-form');
};

window.openCategoriesModal = function() {
    const nameInput = document.getElementById('input-category-name');
    if (nameInput) nameInput.value = '';
    renderCategoriesList();
    openAdminModal('modal-categories-form');
};

window.closeCategoriesModal = function() {
    closeAdminModal('modal-categories-form');
};

window.handleAddProduct = async function(e) {
    e.preventDefault();
    const idInput = document.getElementById('input-product-id');
    const nameInput = document.getElementById('input-product-name');
    const catSelect = document.getElementById('select-product-category');
    const rateInput = document.getElementById('input-product-rate');
    const typeSelect = document.getElementById('select-product-type');
    const descInput = document.getElementById('input-product-description');
    
    if (!nameInput || !catSelect || !rateInput || !typeSelect || !descInput) return;
    
    const id = idInput.value;
    const name = nameInput.value.trim();
    const category_id = catSelect.value;
    const base_rate = parseFloat(rateInput.value);
    const type = typeSelect.value;
    const description = descInput.value.trim();
    
    if (!name || !category_id || isNaN(base_rate)) {
        alert("Please fill in all required fields!");
        return;
    }
    
    const productData = {
        name,
        category_id,
        base_rate,
        type,
        description
    };
    
    if (id) {
        // Editing existing product
        if (isSimulated) {
            const prods = JSON.parse(localStorage.getItem('ttt_products') || '[]');
            const idx = prods.findIndex(p => p.id === id);
            if (idx !== -1) {
                prods[idx] = { ...prods[idx], ...productData };
                localStorage.setItem('ttt_products', JSON.stringify(prods));
                alert("Product updated successfully in simulation!");
                cancelProductEdit();
                closeProductModal();
                await loadProducts();
            }
        } else {
            try {
                const { error } = await supabaseClient
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                if (error) {
                    alert("Error updating product: " + error.message);
                } else {
                    alert("Product updated successfully live!");
                    cancelProductEdit();
                    closeProductModal();
                    await loadProducts();
                }
            } catch (err) {
                alert("Exception updating product: " + err.message);
            }
        }
    } else {
        // Adding new product
        // Duplicate check
        const exists = productsList.some(p => p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            alert(`Product name "${name}" is already registered!`);
            return;
        }
        
        if (isSimulated) {
            productData.id = `prod-${Date.now()}`;
            const prods = JSON.parse(localStorage.getItem('ttt_products') || '[]');
            prods.push(productData);
            localStorage.setItem('ttt_products', JSON.stringify(prods));
            alert("Product created successfully in simulation!");
            nameInput.value = '';
            rateInput.value = '';
            descInput.value = '';
            closeProductModal();
            await loadProducts();
        } else {
            try {
                const { error } = await supabaseClient
                    .from('products')
                    .insert([productData]);
                if (error) {
                    alert("Error adding product: " + error.message);
                } else {
                    alert("Product created successfully live!");
                    nameInput.value = '';
                    rateInput.value = '';
                    descInput.value = '';
                    closeProductModal();
                    await loadProducts();
                }
            } catch (err) {
                alert("Exception adding product: " + err.message);
            }
        }
    }
};

window.editProduct = function(id) {
    const product = productsList.find(p => p.id === id);
    if (!product) return;
    
    // Populate form fields
    const idInput = document.getElementById('input-product-id');
    const nameInput = document.getElementById('input-product-name');
    const catSelect = document.getElementById('select-product-category');
    const rateInput = document.getElementById('input-product-rate');
    const typeSelect = document.getElementById('select-product-type');
    const descInput = document.getElementById('input-product-description');
    
    if (idInput) idInput.value = product.id;
    if (nameInput) nameInput.value = product.name;
    if (catSelect) catSelect.value = product.category_id || '';
    if (rateInput) rateInput.value = product.base_rate;
    if (typeSelect) typeSelect.value = product.type;
    if (descInput) descInput.value = product.description || '';
    
    const formTitle = document.getElementById('product-form-title');
    const formDesc = document.getElementById('product-form-desc');
    if (formTitle) formTitle.textContent = "Edit Product";
    if (formDesc) formDesc.textContent = "Update this product's details.";
    
    openAdminModal('modal-product-form');
};

window.cancelProductEdit = function() {
    const idInput = document.getElementById('input-product-id');
    const nameInput = document.getElementById('input-product-name');
    const rateInput = document.getElementById('input-product-rate');
    const descInput = document.getElementById('input-product-description');
    
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (rateInput) rateInput.value = '';
    if (descInput) descInput.value = '';
    
    const formTitle = document.getElementById('product-form-title');
    const formDesc = document.getElementById('product-form-desc');
    
    if (formTitle) formTitle.textContent = "Add New Product";
    if (formDesc) formDesc.textContent = "Add a rental item to the catalog.";
};

window.deleteProduct = async function(id) {
    if (id === 'e1111111-1111-1111-1111-111111111111') {
        alert("Cannot delete primary W4 Pro Earbuds system product!");
        return;
    }
    
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    if (isSimulated) {
        let prods = JSON.parse(localStorage.getItem('ttt_products') || '[]');
        prods = prods.filter(p => p.id !== id);
        localStorage.setItem('ttt_products', JSON.stringify(prods));
        alert("Product deleted in simulation!");
        await loadProducts();
    } else {
        try {
            const { error } = await supabaseClient
                .from('products')
                .delete()
                .eq('id', id);
            if (error) {
                alert("Error deleting product: " + error.message);
            } else {
                alert("Product deleted live!");
                await loadProducts();
            }
        } catch (err) {
            alert("Exception deleting product: " + err.message);
        }
    }
};

// Customer Submission (Add or Edit)
window.openCustomerAddModal = function() {
    cancelCustomerEdit();
    openAdminModal('modal-customer-form');
};

window.closeCustomerModal = function() {
    cancelCustomerEdit();
    closeAdminModal('modal-customer-form');
};

window.handleAddCustomer = async function(e) {
    e.preventDefault();
    const idInput = document.getElementById('input-customer-id');
    const nameInput = document.getElementById('input-customer-name');
    const emailInput = document.getElementById('input-customer-email');
    const phoneInput = document.getElementById('input-customer-phone');
    const cityInput = document.getElementById('input-customer-city');
    const addressInput = document.getElementById('input-customer-address');
    
    if (!nameInput || !emailInput || !phoneInput || !cityInput || !addressInput) return;
    
    const id = idInput.value;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const city = cityInput.value.trim();
    const address = addressInput.value.trim();
    
    if (!name || !email) {
        alert("Please fill in required fields (Name & Email)!");
        return;
    }
    
    const customerData = {
        name,
        email,
        phone,
        city,
        address
    };
    
    if (id) {
        // Editing customer
        if (isSimulated) {
            const custs = JSON.parse(localStorage.getItem('ttt_customers') || '[]');
            const idx = custs.findIndex(c => c.id === id);
            if (idx !== -1) {
                custs[idx] = { ...custs[idx], ...customerData };
                localStorage.setItem('ttt_customers', JSON.stringify(custs));
                alert("Customer updated in simulation!");
                closeCustomerModal();
                await loadCustomersData();
            }
        } else {
            try {
                const { error } = await supabaseClient
                    .from('customers')
                    .update(customerData)
                    .eq('id', id);
                if (error) {
                    alert("Error updating customer: " + error.message);
                } else {
                    alert("Customer updated live!");
                    closeCustomerModal();
                    await loadCustomersData();
                }
            } catch (err) {
                alert("Exception updating customer: " + err.message);
            }
        }
    } else {
        // Adding customer
        // Duplicate check on email
        const exists = customersList.some(c => c.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            alert(`Customer email "${email}" already registered!`);
            return;
        }
        
        if (isSimulated) {
            customerData.id = `cust-${Date.now()}`;
            customerData.created_at = new Date().toISOString();
            const custs = JSON.parse(localStorage.getItem('ttt_customers') || '[]');
            custs.push(customerData);
            localStorage.setItem('ttt_customers', JSON.stringify(custs));
            alert("Customer registered in simulation!");
            closeCustomerModal();
            await loadCustomersData();
        } else {
            try {
                const { error } = await supabaseClient
                    .from('customers')
                    .insert([customerData]);
                if (error) {
                    alert("Error adding customer: " + error.message);
                } else {
                    alert("Customer registered live!");
                    closeCustomerModal();
                    await loadCustomersData();
                }
            } catch (err) {
                alert("Exception adding customer: " + err.message);
            }
        }
    }
};

window.editCustomer = function(id) {
    const customer = customersList.find(c => c.id === id);
    if (!customer) return;
    
    document.getElementById('input-customer-id').value = customer.id;
    document.getElementById('input-customer-name').value = customer.name;
    document.getElementById('input-customer-email').value = customer.email;
    document.getElementById('input-customer-phone').value = customer.phone || '';
    document.getElementById('input-customer-city').value = customer.city || '';
    document.getElementById('input-customer-address').value = customer.address || '';
    
    document.getElementById('customer-form-title').textContent = "Edit Customer";
    document.getElementById('customer-form-desc').textContent = "Update this customer details.";
    
    const cancelBtn = document.getElementById('btn-cancel-customer-edit');
    if (cancelBtn) cancelBtn.style.display = 'block';
    
    openAdminModal('modal-customer-form');
};

window.cancelCustomerEdit = function() {
    document.getElementById('input-customer-id').value = '';
    document.getElementById('input-customer-name').value = '';
    document.getElementById('input-customer-email').value = '';
    document.getElementById('input-customer-phone').value = '';
    document.getElementById('input-customer-city').value = '';
    document.getElementById('input-customer-address').value = '';
    
    document.getElementById('customer-form-title').textContent = "Add New Customer";
    document.getElementById('customer-form-desc').textContent = "Register or edit a customer profile.";
    
    const cancelBtn = document.getElementById('btn-cancel-customer-edit');
    if (cancelBtn) cancelBtn.style.display = 'none';
};

window.deleteCustomer = async function(id) {
    if (!confirm("Are you sure you want to delete this customer record?")) return;
    
    if (isSimulated) {
        let custs = JSON.parse(localStorage.getItem('ttt_customers') || '[]');
        custs = custs.filter(c => c.id !== id);
        localStorage.setItem('ttt_customers', JSON.stringify(custs));
        alert("Customer deleted in simulation!");
        await loadCustomersData();
    } else {
        try {
            const { error } = await supabaseClient
                .from('customers')
                .delete()
                .eq('id', id);
            if (error) {
                alert("Error deleting customer: " + error.message + " (It may be referenced by existing bookings)");
            } else {
                alert("Customer deleted live!");
                await loadCustomersData();
            }
        } catch (err) {
            alert("Exception deleting customer: " + err.message);
        }
    }
};

// ==========================================================================
// Sortable Tables Extension
// ==========================================================================

window.sortStates = {
    bookings: { column: 'start_date', direction: 'desc' },
    devices: { column: 'serial_number', direction: 'asc' },
    products: { column: 'name', direction: 'asc' },
    customers: { column: 'name', direction: 'asc' }
};

window.sortData = function(array, sortKey, direction) {
    return [...array].sort((a, b) => {
        let valA, valB;
        
        // Custom key getters
        if (sortKey === 'total_price_thb') {
            valA = parseFloat(a.total_price_thb) || 0;
            valB = parseFloat(b.total_price_thb) || 0;
        } else if (sortKey === 'assigned_booking_name') {
            const getBookingName = (d) => {
                if (!d.assigned_booking_id) return '';
                const booking = activeBookings.find(bk => bk.id === d.assigned_booking_id);
                return booking ? booking.customer_name.toLowerCase() : '';
            };
            valA = getBookingName(a);
            valB = getBookingName(b);
        } else if (sortKey === 'last_checked') {
            valA = a.last_checked ? new Date(a.last_checked).getTime() : 0;
            valB = b.last_checked ? new Date(b.last_checked).getTime() : 0;
        } else if (sortKey === 'category_name') {
            const getCatName = (p) => {
                if (p.categories) return p.categories.name.toLowerCase();
                if (p.category_id) {
                    const cat = categoriesList.find(c => c.id === p.category_id);
                    return cat ? cat.name.toLowerCase() : '';
                }
                return '';
            };
            valA = getCatName(a);
            valB = getCatName(b);
        } else if (sortKey === 'base_rate') {
            valA = parseFloat(a.base_rate) || 0;
            valB = parseFloat(b.base_rate) || 0;
        } else {
            // General property lookup
            valA = a[sortKey];
            valB = b[sortKey];
        }
        
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        
        // If string, compare case-insensitively
        if (typeof valA === 'string' && typeof valB === 'string') {
            return direction === 'asc' 
                ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
                : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
        }
        
        // Default comparison
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};

window.handleSort = function(tableId, sortKey) {
    const state = sortStates[tableId];
    if (!state) return;
    
    if (state.column === sortKey) {
        state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.column = sortKey;
        state.direction = 'asc';
    }
    
    if (tableId === 'bookings') {
        renderBookingsTable();
    } else if (tableId === 'devices') {
        renderDevicesTable();
    } else if (tableId === 'products') {
        renderProductsTable();
    } else if (tableId === 'customers') {
        renderCustomersTable();
    }
};

window.updateSortIndicators = function(tableId) {
    const state = sortStates[tableId];
    if (!state) return;
    
    let container;
    if (tableId === 'bookings') container = document.getElementById('view-bookings');
    else if (tableId === 'devices') container = document.getElementById('view-inventory');
    else if (tableId === 'products') container = document.getElementById('view-products');
    else if (tableId === 'customers') container = document.getElementById('view-customers');
    
    if (!container) return;
    
    const icons = container.querySelectorAll('.sort-icon');
    icons.forEach(icon => {
        const id = icon.id || '';
        const fieldName = id.replace(`sort-icon-${tableId}-`, '');
        if (fieldName === state.column) {
            icon.textContent = state.direction === 'asc' ? ' ▲' : ' ▼';
            icon.style.color = 'var(--neon-cyan)';
            icon.style.opacity = '1';
        } else {
            icon.textContent = ' ↕';
            icon.style.color = 'var(--text-muted)';
            icon.style.opacity = '0.35';
        }
    });
};

// ==========================================================================
// Bookings Creation Extension
// ==========================================================================

window.openBookingAddModal = function() {
    // Reset form fields
    const form = document.getElementById('add-booking-form');
    if (form) form.reset();
    
    // Set default dates
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];
    
    const startInput = document.getElementById('input-booking-start');
    const endInput = document.getElementById('input-booking-end');
    if (startInput) {
        startInput.value = formattedToday;
        startInput.min = formattedToday;
    }
    if (endInput) {
        endInput.value = formattedTomorrow;
        endInput.min = formattedTomorrow;
    }
    
    const hotelGroup = document.getElementById('group-booking-hotel');
    if (hotelGroup) hotelGroup.style.display = 'none';

    openAdminModal('modal-booking-form');
};

window.closeBookingAddModal = function() {
    closeAdminModal('modal-booking-form');
};

window.toggleBookingHotelField = function() {
    const pickupSelect = document.getElementById('select-booking-pickup');
    const hotelGroup = document.getElementById('group-booking-hotel');
    const hotelInput = document.getElementById('input-booking-hotel');
    if (pickupSelect && hotelGroup) {
        if (pickupSelect.value === 'hotel_delivery') {
            hotelGroup.style.display = 'block';
            if (hotelInput) hotelInput.required = true;
        } else {
            hotelGroup.style.display = 'none';
            if (hotelInput) {
                hotelInput.required = false;
                hotelInput.value = '';
            }
        }
    }
};

window.handleAddBooking = async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('input-booking-name').value.trim();
    const email = document.getElementById('input-booking-email').value.trim();
    const phone = document.getElementById('input-booking-phone').value.trim();
    const earbuds = parseInt(document.getElementById('input-booking-earbuds').value) || 1;
    const start_date = document.getElementById('input-booking-start').value;
    const end_date = document.getElementById('input-booking-end').value;
    const pickup_loc = document.getElementById('select-booking-pickup').value;
    const hotel_name = document.getElementById('input-booking-hotel').value.trim();
    const hasSim = document.getElementById('checkbox-booking-sim').checked;
    const hasPowerbank = document.getElementById('checkbox-booking-powerbank').checked;

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end <= start) {
        alert("End date must be after start date.");
        return;
    }

    const diffTime = end - start;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate total price
    const baseCostPerDay = 250; // DAILY_RATE
    let discountPercent = 0;
    if (days >= 30) {
        discountPercent = 0.40;
    } else if (days >= 5) {
        discountPercent = 0.20;
    }

    const rawRentalTotal = baseCostPerDay * days * earbuds;
    const discountAmount = Math.round(rawRentalTotal * discountPercent);
    const finalRentalTotal = rawRentalTotal - discountAmount;

    const simCost = hasSim ? (350 * earbuds) : 0;
    const powerbankCost = hasPowerbank ? (175 * earbuds) : 0;
    const totalThb = finalRentalTotal + simCost + powerbankCost;

    const pickupLocationText = pickup_loc === 'hotel_delivery' ? `Hotel Delivery: ${hotel_name}` : 'True Time Thai Office (Pattaya)';

    // New Booking ID
    const newBookingId = 'b_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    if (isSimulated) {
        // Flat bookings array (dashboard uses this)
        const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
        const bookings = JSON.parse(bookingsStr);
        const simRecord = {
            id: newBookingId,
            customer_name: name,
            customer_email: email,
            customer_phone: phone || '',
            start_date: start_date,
            end_date: end_date,
            pickup_location: pickupLocationText,
            status: 'CONFIRMED',
            total_price_thb: totalThb,
            earbud_count: earbuds,
            extra_sim: hasSim ? 'Yes' : 'No',
            extra_powerbank: hasPowerbank ? 'Yes' : 'No',
            created_at: timestamp
        };
        bookings.push(simRecord);
        localStorage.setItem('ttt_bookings', JSON.stringify(bookings));

        // Relational Simulation
        // 1. Customer
        const customersStr = localStorage.getItem('ttt_customers') || '[]';
        const customers = JSON.parse(customersStr);
        let customer = customers.find(c => c.email === email);
        if (!customer) {
            customer = {
                id: 'c_' + Math.random().toString(36).substr(2, 9),
                name: name,
                email: email,
                phone: phone || null,
                address: null,
                city: null,
                created_at: timestamp
            };
            customers.push(customer);
            localStorage.setItem('ttt_customers', JSON.stringify(customers));
        }

        // 2. Order
        const ordersStr = localStorage.getItem('ttt_rental_orders') || '[]';
        const orders = JSON.parse(ordersStr);
        orders.push({
            id: newBookingId,
            customer_id: customer.id,
            start_date: start_date,
            end_date: end_date,
            total_price: totalThb,
            status: "CONFIRMED",
            payment_method: 'Cash',
            payment_status: "PAID",
            transaction_id: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            pickup_location: pickupLocationText,
            created_at: timestamp
        });
        localStorage.setItem('ttt_rental_orders', JSON.stringify(orders));

        // 3. Order Lines
        const linesStr = localStorage.getItem('ttt_rental_order_lines') || '[]';
        const lines = JSON.parse(linesStr);
        lines.push({
            id: 'l_' + Math.random().toString(36).substr(2, 9),
            order_id: newBookingId,
            product_id: 'e1111111-1111-1111-1111-111111111111',
            quantity: earbuds,
            agreed_price_per_day: 250
        });
        if (hasSim) {
            lines.push({
                id: 'l_' + Math.random().toString(36).substr(2, 9),
                order_id: newBookingId,
                product_id: 'e2222222-2222-2222-2222-222222222222',
                quantity: earbuds,
                agreed_price_per_day: 350
            });
        }
        if (hasPowerbank) {
            lines.push({
                id: 'l_' + Math.random().toString(36).substr(2, 9),
                order_id: newBookingId,
                product_id: 'e3333333-3333-3333-3333-333333333333',
                quantity: earbuds,
                agreed_price_per_day: 175
            });
        }
        localStorage.setItem('ttt_rental_order_lines', JSON.stringify(lines));

        // 4. Invoice
        const invoicesStr = localStorage.getItem('ttt_invoices') || '[]';
        const invoices = JSON.parse(invoicesStr);
        const vatAmount = Math.round(totalThb - (totalThb / 1.07));
        invoices.push({
            id: 'i_' + Math.random().toString(36).substr(2, 9),
            order_id: newBookingId,
            date: start_date,
            total_amount: totalThb,
            vat: vatAmount,
            payment_status: 'paid'
        });
        localStorage.setItem('ttt_invoices', JSON.stringify(invoices));

        alert("Booking successfully created in simulation!");
        closeBookingAddModal();
        await loadBookings();
        await loadCustomersData();
    } else {
        try {
            // Live relational DB insertion flow
            // 1. Get or Create Customer
            let customerId = null;
            const { data: customerData, error: customerFetchError } = await supabaseClient
                .from('customers')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (customerFetchError) throw customerFetchError;

            if (customerData) {
                customerId = customerData.id;
            } else {
                const { data: newCust, error: custInsertError } = await supabaseClient
                    .from('customers')
                    .insert([{
                        name: name,
                        email: email,
                        phone: phone || null,
                        address: null,
                        city: null
                    }])
                    .select('id')
                    .single();
                if (custInsertError) throw custInsertError;
                customerId = newCust.id;
            }

            // 2. Insert Order
            const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const orderRecord = {
                customer_id: customerId,
                start_date: start_date,
                end_date: end_date,
                total_price: totalThb,
                status: "CONFIRMED",
                payment_method: 'Cash',
                payment_status: "PAID",
                transaction_id: txnId,
                pickup_location: pickupLocationText
            };
            
            const { data: newOrder, error: orderInsertError } = await supabaseClient
                .from('rental_orders')
                .insert([orderRecord])
                .select('id')
                .single();
            if (orderInsertError) throw orderInsertError;
            const orderId = newOrder.id;

            // 3. Insert Order Lines
            const orderLines = [
                {
                    order_id: orderId,
                    product_id: 'e1111111-1111-1111-1111-111111111111',
                    quantity: earbuds,
                    agreed_price_per_day: 250
                }
            ];
            
            if (hasSim) {
                orderLines.push({
                    order_id: orderId,
                    product_id: 'e2222222-2222-2222-2222-222222222222',
                    quantity: earbuds,
                    agreed_price_per_day: 350
                });
            }
            
            if (hasPowerbank) {
                orderLines.push({
                    order_id: orderId,
                    product_id: 'e3333333-3333-3333-3333-333333333333',
                    quantity: earbuds,
                    agreed_price_per_day: 175
                });
            }
            
            const { error: linesInsertError } = await supabaseClient
                .from('rental_order_lines')
                .insert(orderLines);
            if (linesInsertError) throw linesInsertError;

            // 4. Insert Invoice
            const vatAmount = Math.round(totalThb - (totalThb / 1.07));
            const invoiceRecord = {
                order_id: orderId,
                total_amount: totalThb,
                vat: vatAmount,
                payment_status: 'paid'
            };
            const { error: invoiceInsertError } = await supabaseClient
                .from('invoices')
                .insert([invoiceRecord]);
            if (invoiceInsertError) throw invoiceInsertError;

            alert("Booking successfully created live!");
            closeBookingAddModal();
            await loadBookings();
            await loadCustomersData();
        } catch (err) {
            console.error("Exception creating booking live:", err);
            alert("Error creating booking: " + err.message);
        }
    }
};

