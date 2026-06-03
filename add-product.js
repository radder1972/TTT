// ==========================================================================
// True Time Thai - Product Standalone Add / Edit Logic
// Handles connecting to Supabase or simulating with LocalStorage fallback.
// Includes technician session authentication.
// ==========================================================================

const SUPABASE_URL = "https://uuciegboqicihcanjqbh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2llZ2JvcWljaWhjYW5qcWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjI4NzcsImV4cCI6MjA5NTk5ODg3N30.-gA94kM_Vn0pMW3WThcMM3e2abCmGTuLSBa0BspJvNg";

let supabaseClient = null;
let isSimulated = true;
let categoriesList = [];
let productsList = [];

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
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSimulated = false;
            
            if (statusDot) statusDot.className = "pulse-dot green";
            if (statusText) statusText.textContent = "Live Connected";
            console.log("Supabase Client initialized on add-product page.");
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
    const productSection = document.getElementById('product-section');
    const logoutWrapper = document.getElementById('header-logout-wrapper');

    if (isSimulated) {
        const isAuth = localStorage.getItem('ttt_admin_auth') === 'true';
        if (isAuth) {
            if (loginSection) loginSection.style.display = 'none';
            if (productSection) productSection.style.display = 'block';
            if (logoutWrapper) logoutWrapper.style.display = 'block';
            await loadPageData();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (productSection) productSection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    } else {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (data && data.session) {
                if (loginSection) loginSection.style.display = 'none';
                if (productSection) productSection.style.display = 'block';
                if (logoutWrapper) logoutWrapper.style.display = 'block';
                await loadPageData();
            } else {
                if (loginSection) loginSection.style.display = 'block';
                if (productSection) productSection.style.display = 'none';
                if (logoutWrapper) logoutWrapper.style.display = 'none';
            }
        } catch (err) {
            console.error("Auth session exception:", err);
            if (loginSection) loginSection.style.display = 'block';
            if (productSection) productSection.style.display = 'none';
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

    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
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

// 5. Load Categories & Product for Edit
async function loadPageData() {
    await loadCategories();
    await loadProducts();
    
    // Check if Edit Mode
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        const product = productsList.find(p => p.id === productId);
        if (product) {
            document.getElementById('input-product-id').value = product.id;
            document.getElementById('input-product-name').value = product.name;
            document.getElementById('select-product-category').value = product.category_id || '';
            document.getElementById('input-product-rate').value = product.base_rate;
            document.getElementById('select-product-type').value = product.type;
            document.getElementById('input-product-description').value = product.description || '';
            
            document.getElementById('product-form-title').textContent = "Edit Product";
            document.getElementById('product-form-desc').textContent = "Update this product details.";
        } else {
            console.warn("Product ID not found: " + productId);
        }
    }
}

async function loadCategories() {
    if (isSimulated) {
        initDummyCategories();
        const catsStr = localStorage.getItem('ttt_categories') || '[]';
        categoriesList = JSON.parse(catsStr);
        renderCategoriesDropdown();
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
            }
        } catch (e) {
            console.error("Exception loading categories live:", e);
        }
    }
}

async function loadProducts() {
    if (isSimulated) {
        const prodsStr = localStorage.getItem('ttt_products') || '[]';
        productsList = JSON.parse(prodsStr);
    } else {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('*');
            if (error) {
                console.error("Error loading products:", error.message);
            } else {
                productsList = data || [];
            }
        } catch (e) {
            console.error("Exception loading products live:", e);
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

function initDummyCategories() {
    if (!localStorage.getItem('ttt_categories')) {
        const dummyCats = [
            { id: "c1111111-1111-1111-1111-111111111111", name: "AI Translation Wearables" },
            { id: "c2222222-2222-2222-2222-222222222222", name: "Rental Add-ons (SIM, Charger)" }
        ];
        localStorage.setItem('ttt_categories', JSON.stringify(dummyCats));
    }
}

// 6. Submit Product
async function handleProductSubmit(e) {
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
                window.location.href = "admin.html";
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
                    window.location.href = "admin.html";
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
            window.location.href = "admin.html";
        } else {
            try {
                const { error } = await supabaseClient
                    .from('products')
                    .insert([productData]);
                if (error) {
                    alert("Error adding product: " + error.message);
                } else {
                    alert("Product created successfully live!");
                    window.location.href = "admin.html";
                }
            } catch (err) {
                alert("Exception adding product: " + err.message);
            }
        }
    }
}
