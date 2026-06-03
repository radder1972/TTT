// ==========================================================================
// True Time Thai - Category Standalone Management Logic
// Handles connecting to Supabase or simulating with LocalStorage fallback.
// Includes technician session authentication.
// ==========================================================================

const SUPABASE_URL = "https://uuciegboqicihcanjqbh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2llZ2JvcWljaWhjYW5qcWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjI4NzcsImV4cCI6MjA5NTk5ODg3N30.-gA94kM_Vn0pMW3WThcMM3e2abCmGTuLSBa0BspJvNg";

let supabaseClient = null;
let isSimulated = true;
let categoriesList = [];

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
            console.log("Supabase Client initialized on manage-categories page.");
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
    const categorySection = document.getElementById('category-section');
    const logoutWrapper = document.getElementById('header-logout-wrapper');

    if (isSimulated) {
        const isAuth = localStorage.getItem('ttt_admin_auth') === 'true';
        if (isAuth) {
            if (loginSection) loginSection.style.display = 'none';
            if (categorySection) categorySection.style.display = 'block';
            if (logoutWrapper) logoutWrapper.style.display = 'block';
            await loadCategories();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (categorySection) categorySection.style.display = 'none';
            if (logoutWrapper) logoutWrapper.style.display = 'none';
        }
    } else {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (data && data.session) {
                if (loginSection) loginSection.style.display = 'none';
                if (categorySection) categorySection.style.display = 'block';
                if (logoutWrapper) logoutWrapper.style.display = 'block';
                await loadCategories();
            } else {
                if (loginSection) loginSection.style.display = 'block';
                if (categorySection) categorySection.style.display = 'none';
                if (logoutWrapper) logoutWrapper.style.display = 'none';
            }
        } catch (err) {
            console.error("Auth session exception:", err);
            if (loginSection) loginSection.style.display = 'block';
            if (categorySection) categorySection.style.display = 'none';
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

    const categoryForm = document.getElementById('add-category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
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

// 5. Load and Render Categories List
async function loadCategories() {
    if (isSimulated) {
        initDummyCategories();
        const catsStr = localStorage.getItem('ttt_categories') || '[]';
        categoriesList = JSON.parse(catsStr);
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
                renderCategoriesList();
            }
        } catch (e) {
            console.error("Exception loading categories live:", e);
        }
    }
}

function renderCategoriesList() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    
    if (categoriesList.length === 0) {
        list.innerHTML = '<li class="text-muted">No categories defined yet.</li>';
        return;
    }
    
    list.innerHTML = categoriesList.map(c => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <span style="color: #cbd5e1;">${c.name}</span>
            <span onclick="deleteCategory('${c.id}')" style="cursor: pointer; color: var(--thai-red); font-size: 0.85rem; font-weight: bold; padding: 2px 6px;" title="Delete category">✕</span>
        </li>
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

// 6. Submit Category
async function handleCategorySubmit(e) {
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
}

// 7. Delete Category
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
        await loadCategories();
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
                await loadCategories();
            }
        } catch (err) {
            alert("Exception deleting category: " + err.message);
        }
    }
};
