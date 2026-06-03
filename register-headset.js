// ==========================================================================
// True Time Thai - Headset Standalone Registration Logic
// Handles connecting to Supabase or simulating with LocalStorage fallback.
// Includes technician login authentication.
// ==========================================================================

const SUPABASE_URL = "https://uuciegboqicihcanjqbh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2llZ2JvcWljaWhjYW5qcWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjI4NzcsImV4cCI6MjA5NTk5ODg3N30.-gA94kM_Vn0pMW3WThcMM3e2abCmGTuLSBa0BspJvNg";

let supabaseClient = null;
let isSimulated = true;
let registeredDevices = [];

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    checkAuthSession();
    setupEventListeners();
});

// 1. Initialize Database Connection
function initDatabase() {
    const statusDot = document.getElementById('db-status-dot');
    const statusText = document.getElementById('db-status-text');
    
    if (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim() !== "") {
        try {
            // Initialize Supabase Client
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSimulated = false;
            
            if (statusDot) statusDot.className = "pulse-dot green";
            if (statusText) statusText.textContent = "Live Connected";
            console.log("Supabase Client initialized on headset registration page.");
        } catch (error) {
            console.error("Error loading Supabase client, falling back to simulation:", error);
            isSimulated = true;
            if (statusDot) statusDot.className = "pulse-dot orange";
            if (statusText) statusText.textContent = "Simulation Mode";
        }
    } else {
        isSimulated = true;
        if (statusDot) statusDot.className = "pulse-dot orange";
        if (statusText) statusText.textContent = "Simulation Mode";
        console.log("Running in local simulation mode.");
    }
}

// 2. Authentication Check
async function checkAuthSession() {
    const loginSection = document.getElementById('login-section');
    const registrationSection = document.getElementById('registration-section');
    const logoutWrapper = document.getElementById('header-logout-wrapper');

    if (isSimulated) {
        const isAuth = localStorage.getItem('ttt_admin_auth') === 'true';
        if (isAuth) {
            if (loginSection) loginSection.style.display = 'none';
            if (registrationSection) registrationSection.style.display = 'block';
            if (logoutWrapper) logoutWrapper.style.display = 'block';
            loadRecentDevices();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (registrationSection) registrationSection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    } else {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (data && data.session) {
                if (loginSection) loginSection.style.display = 'none';
                if (registrationSection) registrationSection.style.display = 'block';
                if (logoutWrapper) logoutWrapper.style.display = 'block';
                loadRecentDevices();
            } else {
                if (loginSection) loginSection.style.display = 'block';
                if (registrationSection) registrationSection.style.display = 'none';
                if (logoutWrapper) logoutWrapper.style.display = 'none';
            }
        } catch (err) {
            console.error("Auth session exception:", err);
            // Fallback to login view on error
            if (loginSection) loginSection.style.display = 'block';
            if (registrationSection) registrationSection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    }
}

// 3. Event Listeners Setup
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const registerForm = document.getElementById('register-device-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleAddDevice);
    }
}

// 4. Authentication Action Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('btn-login');

    if (loginBtn) loginBtn.disabled = true;

    if (isSimulated) {
        if (email === "info@truetimethai.com" && password === "R@dd3r1972?12345") {
            localStorage.setItem('ttt_admin_auth', 'true');
            alert("Login successful!");
            checkAuthSession();
        } else {
            alert("Incorrect email address or password! Try info@truetimethai.com / R@dd3r1972?12345");
        }
        if (loginBtn) loginBtn.disabled = false;
    } else {
        try {
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
        } catch (err) {
            alert("Connection error: " + err.message);
        } finally {
            if (loginBtn) loginBtn.disabled = false;
        }
    }
}

async function handleLogout() {
    if (isSimulated) {
        localStorage.setItem('ttt_admin_auth', 'false');
        checkAuthSession();
    } else {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                alert("Error logging out: " + error.message);
            }
            checkAuthSession();
        } catch (err) {
            console.error("Sign out exception:", err);
            checkAuthSession();
        }
    }
}

// 5. Load Recent Headsets
async function loadRecentDevices() {
    const tableBody = document.getElementById('recent-registrations-body');
    if (!tableBody) return;

    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        registeredDevices = JSON.parse(devicesStr);
        // Sort by last_checked descending or simulated time
        registeredDevices.sort((a, b) => new Date(b.last_checked) - new Date(a.last_checked));
        renderRecentDevicesTable(registeredDevices.slice(0, 5));
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('inventory')
                .select('*')
                .order('last_checked', { ascending: false })
                .limit(5);

            if (error) {
                console.error("Error loading recent devices:", error.message);
                tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 12px;">Error loading recent devices.</td></tr>`;
            } else {
                renderRecentDevicesTable(data || []);
            }
        } catch (err) {
            console.error("Exception loading recent devices:", err);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 12px;">Exception loading devices.</td></tr>`;
        }
    }
}

// Render Table
function renderRecentDevicesTable(devices) {
    const tableBody = document.getElementById('recent-registrations-body');
    if (!tableBody) return;

    if (devices.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 12px;">No registered headsets found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = devices.map(d => {
        const dateStr = d.last_checked ? new Date(d.last_checked).toLocaleString() : '-';
        let statusBadge = '';
        if (d.status === 'AVAILABLE') statusBadge = `<span class="badge-status status-confirmed">Available</span>`;
        else if (d.status === 'RENTED') statusBadge = `<span class="badge-status status-pickedup">Rented</span>`;
        else if (d.status === 'CLEANING') statusBadge = `<span class="badge-status status-pending" style="background: var(--thai-gold-glow); color: var(--thai-gold); border-color: var(--thai-gold);">Cleaning</span>`;
        else if (d.status === 'MAINTENANCE') statusBadge = `<span class="badge-status status-cancelled">Maintenance</span>`;
        else statusBadge = `<span class="badge-status">${d.status}</span>`;

        return `
            <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: var(--thai-blue);">${d.serial_number}</td>
                <td style="padding: 8px 12px;">${statusBadge}</td>
                <td style="padding: 8px 12px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${d.notes || ''}">${d.notes || '-'}</td>
                <td style="padding: 8px 12px; color: var(--text-muted); font-size: 0.75rem;">${dateStr}</td>
            </tr>
        `;
    }).join('');
}

// 6. Add Headset Submission
async function handleAddDevice(e) {
    e.preventDefault();
    const serialInput = document.getElementById('input-device-serial');
    const notesInput = document.getElementById('input-device-notes');
    if (!serialInput) return;
    
    const serial = serialInput.value.trim();
    const notes = notesInput ? notesInput.value.trim() : '';
    
    if (!serial) {
        alert("Please enter a serial number!");
        return;
    }
    
    // Check if serial already exists (local query or check before inserting)
    let exists = false;
    if (isSimulated) {
        const devicesStr = localStorage.getItem('ttt_devices') || '[]';
        const devices = JSON.parse(devicesStr);
        exists = devices.some(d => d.serial_number.toLowerCase() === serial.toLowerCase());
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('inventory')
                .select('id')
                .eq('serial_number', serial);
            if (data && data.length > 0) exists = true;
        } catch (err) {
            console.error("Error verifying serial unique check live:", err);
        }
    }

    if (exists) {
        alert(`Serial number ${serial} is already registered!`);
        return;
    }
    
    const newDevice = {
        serial_number: serial,
        product_id: 'e1111111-1111-1111-1111-111111111111', // Timekettle W4 Pro AI Translation Earbuds
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
        
        // Update local settings (total stock) if needed
        let totalStock = devices.length;
        // In simulation, we can sync stock settings too
        
        alert("Headset successfully registered in simulation!");
        serialInput.value = '';
        if (notesInput) notesInput.value = '';
        loadRecentDevices();
    } else {
        try {
            // Live Supabase connection insert
            const { data, error } = await supabaseClient
                .from('inventory')
                .insert([newDevice]);
                
            if (error) {
                alert("Error registering headset: " + error.message);
            } else {
                alert("Headset successfully registered live!");
                serialInput.value = '';
                if (notesInput) notesInput.value = '';
                
                // Sync settings stock in background
                try {
                    const { count } = await supabaseClient
                        .from('inventory')
                        .select('*', { count: 'exact', head: true });
                    
                    if (count) {
                        await supabaseClient
                            .from('settings')
                            .upsert({ key: 'total_stock', value: count.toString() });
                    }
                } catch (stockErr) {
                    console.error("Could not sync total_stock in settings table:", stockErr);
                }
                
                loadRecentDevices();
            }
        } catch (err) {
            console.error("Exception registering device live:", err);
            alert("Error registering headset: " + err.message);
        }
    }
}
