/* ==========================================================================
   True Time Thai - Web Application Logic (app.js)
   Features: SPA Router, Simulator, Booking Engine, Testimonials, FAQ Accordion
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Supabase Connection & Configuration
    // ==========================================================================
    const SUPABASE_URL = "https://uuciegboqicihcanjqbh.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1Y2llZ2JvcWljaWhjYW5qcWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjI4NzcsImV4cCI6MjA5NTk5ODg3N30.-gA94kM_Vn0pMW3WThcMM3e2abCmGTuLSBa0BspJvNg"; // <-- PLAK HIER UW SUPABASE ANON KEY OM LIVE TE GAAN

    let supabaseClient = null;
    let isSimulated = true;

    function initDatabase() {
        if (typeof supabase !== 'undefined' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim() !== "") {
            try {
                supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                isSimulated = false;
                console.log("Supabase live client initialized successfully in app.js.");
            } catch (error) {
                console.error("Error initializing live Supabase client, fallback to simulation:", error);
                isSimulated = true;
            }
        } else {
            isSimulated = true;
            console.log("Supabase Anon Key is empty in app.js. System is running in Simulation Mode.");
        }
    }
    initDatabase();

    // Database helper functions
    async function fetchTotalStock() {
        if (isSimulated) {
            return parseInt(localStorage.getItem('ttt_total_stock') || '30');
        } else {
            try {
                const { data, error } = await supabaseClient
                    .from('settings')
                    .select('value')
                    .eq('key', 'total_stock')
                    .single();
                if (data && data.value) {
                    return parseInt(data.value);
                }
            } catch (e) {
                console.error("Error fetching total stock from Supabase:", e);
            }
            return 30; // default fallback
        }
    }

    async function fetchOverlappingBookings() {
        if (isSimulated) {
            const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
            return JSON.parse(bookingsStr);
        } else {
            try {
                const { data, error } = await supabaseClient
                    .from('rental_orders')
                    .select('*, rental_order_lines(quantity, product_id)')
                    .not('status', 'in', '("CANCELLED","RETURNED")');
                if (error) {
                    console.error("Error fetching active bookings:", error);
                    return [];
                }
                return (data || []).map(order => {
                    const line = (order.rental_order_lines || []).find(l => l.product_id === 'e1111111-1111-1111-1111-111111111111');
                    return {
                        ...order,
                        earbud_count: line ? parseInt(line.quantity) : 1
                    };
                });
            } catch (e) {
                console.error("Error fetching bookings from Supabase:", e);
                return [];
            }
        }
    }

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

    async function saveBookingToDatabase(paymentMethod, txnId, bookingData) {
        const earbudCount = parseInt(bookingData.quantity);
        const totalThb = typeof bookingData.total_thb === 'string'
            ? parseInt(bookingData.total_thb.replace(/[^0-9]/g, ''))
            : parseInt(bookingData.total_thb);
        
        const extraSim = bookingData.extra_sim === true || bookingData.extra_sim === "Yes (+ ฿350 each)";
        const extraPowerbank = bookingData.extra_powerbank === true || bookingData.extra_powerbank === "Yes (+ ฿175 each)";

        const record = {
            customer_name: bookingData.name,
            customer_email: bookingData.email,
            start_date: bookingData.start_date,
            end_date: bookingData.end_date,
            earbud_count: earbudCount,
            pickup_location: bookingData.pickup_location,
            extra_sim: extraSim,
            extra_powerbank: extraPowerbank,
            total_price_thb: totalThb,
            payment_method: paymentMethod,
            payment_status: "PAID",
            transaction_id: txnId,
            status: "CONFIRMED"
        };

        if (isSimulated) {
            // Save flat record cache for dashboard/reports simulation compatibility
            const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
            const bookings = JSON.parse(bookingsStr);
            record.id = 'b_' + Math.random().toString(36).substr(2, 9);
            record.created_at = new Date().toISOString();
            bookings.push(record);
            localStorage.setItem('ttt_bookings', JSON.stringify(bookings));

            // 1. Customer
            const customersStr = localStorage.getItem('ttt_customers') || '[]';
            const customers = JSON.parse(customersStr);
            let customer = customers.find(c => c.email === bookingData.email);
            if (!customer) {
                customer = {
                    id: 'c_' + Math.random().toString(36).substr(2, 9),
                    name: bookingData.name,
                    email: bookingData.email,
                    phone: null,
                    address: null,
                    city: null,
                    created_at: record.created_at
                };
                customers.push(customer);
                localStorage.setItem('ttt_customers', JSON.stringify(customers));
            }

            // 2. Order
            const ordersStr = localStorage.getItem('ttt_rental_orders') || '[]';
            const orders = JSON.parse(ordersStr);
            const newOrder = {
                id: record.id,
                customer_id: customer.id,
                start_date: bookingData.start_date,
                end_date: bookingData.end_date,
                total_price: totalThb,
                status: "CONFIRMED",
                payment_method: paymentMethod,
                payment_status: "PAID",
                transaction_id: txnId,
                pickup_location: bookingData.pickup_location,
                created_at: record.created_at
            };
            orders.push(newOrder);
            localStorage.setItem('ttt_rental_orders', JSON.stringify(orders));

            // 3. Order Lines
            const linesStr = localStorage.getItem('ttt_rental_order_lines') || '[]';
            const lines = JSON.parse(linesStr);
            lines.push({
                id: 'l_' + Math.random().toString(36).substr(2, 9),
                order_id: record.id,
                product_id: 'e1111111-1111-1111-1111-111111111111',
                quantity: earbudCount,
                agreed_price_per_day: 250
            });
            if (extraSim) {
                lines.push({
                    id: 'l_' + Math.random().toString(36).substr(2, 9),
                    order_id: record.id,
                    product_id: 'e2222222-2222-2222-2222-222222222222',
                    quantity: earbudCount,
                    agreed_price_per_day: 350
                });
            }
            if (extraPowerbank) {
                lines.push({
                    id: 'l_' + Math.random().toString(36).substr(2, 9),
                    order_id: record.id,
                    product_id: 'e3333333-3333-3333-3333-333333333333',
                    quantity: earbudCount,
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
                order_id: record.id,
                date: bookingData.start_date,
                total_amount: totalThb,
                vat: vatAmount,
                payment_status: 'paid'
            });
            localStorage.setItem('ttt_invoices', JSON.stringify(invoices));

            console.log("Booking saved to localStorage simulation relational tables:", record);
            return record.id;
        } else {
            try {
                // Relational database insertion flow
                // 1. Get or Create Customer
                let customerId = null;
                const { data: customerData, error: customerFetchError } = await supabaseClient
                    .from('customers')
                    .select('id')
                    .eq('email', bookingData.email)
                    .maybeSingle();

                if (customerFetchError) throw customerFetchError;

                if (customerData) {
                    customerId = customerData.id;
                } else {
                    const { data: newCust, error: custInsertError } = await supabaseClient
                        .from('customers')
                        .insert([{
                            name: bookingData.name,
                            email: bookingData.email,
                            phone: null,
                            address: null,
                            city: null
                        }])
                        .select('id')
                        .single();
                    if (custInsertError) throw custInsertError;
                    customerId = newCust.id;
                }

                // 2. Insert Order
                const orderRecord = {
                    customer_id: customerId,
                    start_date: bookingData.start_date,
                    end_date: bookingData.end_date,
                    total_price: totalThb,
                    status: "CONFIRMED",
                    payment_method: paymentMethod,
                    payment_status: "PAID",
                    transaction_id: txnId,
                    pickup_location: bookingData.pickup_location
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
                        quantity: earbudCount,
                        agreed_price_per_day: 250
                    }
                ];
                
                if (extraSim) {
                    orderLines.push({
                        order_id: orderId,
                        product_id: 'e2222222-2222-2222-2222-222222222222',
                        quantity: earbudCount,
                        agreed_price_per_day: 350
                    });
                }
                
                if (extraPowerbank) {
                    orderLines.push({
                        order_id: orderId,
                        product_id: 'e3333333-3333-3333-3333-333333333333',
                        quantity: earbudCount,
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
                    date: bookingData.start_date,
                    total_amount: totalThb,
                    vat: vatAmount,
                    payment_status: 'paid'
                };
                
                const { error: invoiceInsertError } = await supabaseClient
                    .from('invoices')
                    .insert([invoiceRecord]);
                if (invoiceInsertError) throw invoiceInsertError;

                console.log("Booking successfully completed in live relational database!");
                return orderId;
            } catch (error) {
                console.error("Error saving to live database:", error);
                throw error;
            }
        }
    }

    async function checkAvailability() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const earbudCountInput = document.getElementById('earbud-count');
        
        const startDate = startDateInput ? startDateInput.value : '';
        const endDate = endDateInput ? endDateInput.value : '';
        const quantity = parseInt(earbudCountInput ? earbudCountInput.value : 1);
        const availDot = document.getElementById('availability-dot');
        const availText = document.getElementById('availability-text');
        const submitBtn = document.getElementById('btn-submit-booking');

        if (!startDate || !endDate || isNaN(quantity)) {
            if (availText) availText.textContent = "Enter dates to check stock availability...";
            if (availDot) {
                availDot.className = "availability-dot";
                availDot.style.backgroundColor = "#ccc";
            }
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            if (availText) availText.textContent = "Please enter a valid rental period...";
            if (availDot) {
                availDot.className = "availability-dot";
                availDot.style.backgroundColor = "#ccc";
            }
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        if (availText) availText.textContent = "Checking availability...";
        if (availDot) {
            availDot.className = "availability-dot";
            availDot.style.backgroundColor = "#ffc107";
        }

        try {
            const totalStock = await fetchTotalStock();
            const bookings = await fetchOverlappingBookings();

            let maxOccupied = 0;
            let curr = new Date(start);
            while (curr < end) {
                const currStr = curr.toISOString().split('T')[0];
                let occupiedOnDay = 0;
                bookings.forEach(b => {
                    if (['PENDING', 'CONFIRMED', 'PICKED_UP'].includes(b.status)) {
                        if (b.start_date <= currStr && b.end_date > currStr) {
                            occupiedOnDay += parseInt(b.earbud_count || 1);
                        }
                    }
                });

                if (occupiedOnDay > maxOccupied) {
                    maxOccupied = occupiedOnDay;
                }
                curr.setDate(curr.getDate() + 1);
            }

            const available = totalStock - maxOccupied;
            if (available >= quantity) {
                if (availDot) {
                    availDot.className = "availability-dot bg-green";
                    availDot.style.backgroundColor = "";
                }
                if (availText) {
                    availText.textContent = `✓ ${available} sets available in this period.`;
                }
                if (submitBtn) submitBtn.disabled = false;
            } else {
                if (availDot) {
                    availDot.className = "availability-dot bg-red";
                    availDot.style.backgroundColor = "";
                }
                if (availText) {
                    if (available <= 0) {
                        availText.textContent = `✗ Sold out! No sets available from ${formatDateString(startDate)} to ${formatDateString(endDate)}.`;
                    } else {
                        availText.textContent = `✗ Insufficient stock! Only ${available} set(s) available.`;
                    }
                }
                if (submitBtn) submitBtn.disabled = true;
            }
        } catch (error) {
            console.error("Error checking availability:", error);
            if (availDot) {
                availDot.className = "availability-dot bg-green";
            }
            if (availText) {
                availText.textContent = "✓ Availability checked (Simulation)";
            }
            if (submitBtn) submitBtn.disabled = false;
        }
    }
    
    /* ==========================================================================
       1. CLIENT-SIDE ROUTER (SPA NAV)
       ========================================================================== */
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');
    const logoLink = document.getElementById('logo-link');
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');

    // Routing Function
    function navigateToSection(targetId) {
        const id = targetId.replace('#', '');
        
        // Hide all sections, show target
        sections.forEach(section => {
            if (section.id === id) {
                section.classList.add('section-active');
            } else {
                section.classList.remove('section-active');
            }
        });

        // Update active class on nav links
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile nav menu
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');

        // Scroll to top of window smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Hash change event listener
    window.addEventListener('hashchange', () => {
        if (window.location.hash) {
            navigateToSection(window.location.hash);
        }
    });

    // Initial load check
    if (window.location.hash) {
        navigateToSection(window.location.hash);
    } else {
        navigateToSection('#home');
    }

    // Direct link clicks
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.length > 1) {
                e.preventDefault();
                window.location.hash = href;
                navigateToSection(href);
            }
        });
    });

    // Mobile Navigation Toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });
    }


    /* ==========================================================================
       2. LANGUAGE SHOWCASE GRID
       ========================================================================== */
    const languages = [
        { name: "Nederlands (Dutch)", category: "West-Germaans", flag: "🇳🇱" },
        { name: "English (British)", category: "14 Engelse Accenten", flag: "🇬🇧" },
        { name: "English (American)", category: "14 Engelse Accenten", flag: "🇺🇸" },
        { name: "English (Australian)", category: "14 Engelse Accenten", flag: "🇦🇺" },
        { name: "English (Indian)", category: "14 Engelse Accenten", flag: "🇮🇳" },
        { name: "Thai English (Tinglish)", category: "14 Engelse Accenten", flag: "🇹🇭" },
        { name: "Thai (ไทย)", category: "Thais - Doeltaal", flag: "🇹🇭" },
        { name: "Deutsch (German)", category: "West-Germaans", flag: "🇩🇪" },
        { name: "Français (French)", category: "Romaans", flag: "🇫🇷" },
        { name: "Español (Spanish)", category: "Romaans", flag: "🇪🇸" },
        { name: "Italiano (Italian)", category: "Romaans", flag: "🇮🇹" },
        { name: "Português (Portuguese)", category: "Romaans", flag: "🇵🇹" },
        { name: "日本語 (Japanese)", category: "Oost-Aziatisch", flag: "🇯🇵" },
        { name: "한국어 (Korean)", category: "Oost-Aziatisch", flag: "🇰🇷" },
        { name: "简体中文 (Chinese Simplified)", category: "Oost-Aziatisch", flag: "🇨🇳" },
        { name: "Русский (Russian)", category: "Slavisch", flag: "🇷🇺" },
        { name: "العربية (Arabic)", category: "Semitisch", flag: "🇸🇦" },
        { name: "Bahasa Indonesia", category: "Austronesisch", flag: "🇮🇩" },
        { name: "Tiếng Việt (Vietnamese)", category: "Austroaziatisch", flag: "🇻🇳" },
        { name: "Türkçe (Turkish)", category: "Turks", flag: "🇹🇷" },
        { name: "Polski (Polish)", category: "Slavisch", flag: "🇵🇱" },
        { name: "Svenska (Swedish)", category: "Noord-Germaans", flag: "🇸🇪" }
    ];

    const languagesList = document.getElementById('languages-list');
    const langSearch = document.getElementById('lang-search');

    function renderLanguages(filterText = '') {
        if (!languagesList) return;
        languagesList.innerHTML = '';
        
        const filtered = languages.filter(lang => 
            lang.name.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            languagesList.innerHTML = '<p class="text-muted text-center" style="width:100%;">Geen talen gevonden...</p>';
            return;
        }

        filtered.forEach(lang => {
            const tag = document.createElement('span');
            tag.className = 'lang-tag';
            if (lang.name.includes('Thai')) {
                tag.classList.add('highlight-th');
            }
            tag.textContent = `${lang.flag} ${lang.name}`;
            languagesList.appendChild(tag);
        });
    }

    if (langSearch) {
        langSearch.addEventListener('input', (e) => {
            renderLanguages(e.target.value);
        });
    }

    // Initial language render
    renderLanguages();


    /* ==========================================================================
       3. INTERACTIVE TRANSLATION SIMULATOR
       ========================================================================== */
    // Speech Synthesis (TTS) State Configuration
    let simSoundEnabled = true;
    let currentSpeechUtterance = null;

    function stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        const statusBar = document.getElementById('simulator-ai-status');
        if (statusBar) {
            statusBar.classList.remove('playing-audio');
        }
    }

    function speakText(text, langCode, callback) {
        if (!simSoundEnabled || !window.speechSynthesis) {
            if (callback) callback();
            return;
        }

        stopSpeaking();

        // Strip phonetic helper parentheses for natural speech synthesis
        const textToSpeak = text.replace(/\s*\(.*?\)\s*/g, '');

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const voices = window.speechSynthesis.getVoices();
        let bestVoice = null;

        if (langCode === 'nl') {
            utterance.lang = 'nl-NL';
            bestVoice = voices.find(v => v.lang.startsWith('nl'));
        } else if (langCode === 'th') {
            utterance.lang = 'th-TH';
            bestVoice = voices.find(v => v.lang.startsWith('th'));
        } else {
            utterance.lang = 'en-US';
            bestVoice = voices.find(v => v.lang.startsWith('en'));
        }

        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            const statusBar = document.getElementById('simulator-ai-status');
            if (statusBar) {
                statusBar.classList.add('playing-audio');
            }
        };

        utterance.onend = () => {
            const statusBar = document.getElementById('simulator-ai-status');
            if (statusBar) {
                statusBar.classList.remove('playing-audio');
            }
            if (callback) callback();
        };

        utterance.onerror = () => {
            const statusBar = document.getElementById('simulator-ai-status');
            if (statusBar) {
                statusBar.classList.remove('playing-audio');
            }
            if (callback) callback();
        };

        currentSpeechUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    // Force voice list loading in Web Speech API
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

        const scenarios = {
        market: {
            title: "Conversation at Lanpho Naklua Fish Market",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Hello! How much do these tiger prawns cost per kilo?",
                        translation: "สวัสดีครับ กุ้งลายเสือพวกนี้กิโลละเท่าไหร่ครับ (Sawatdee krap, kung lai suea puak nee kilo la tao rai krap?)"
                    },
                    local: {
                        name: "P'Som (Fishmonger)",
                        text: "สวัสดีจ้า! กิโลละ 450 บาทจ้า ลดได้นิดหน่อยนะจ๊ะ เอาเท่าไหร่ดีจ๊ะ",
                        translation: "Hello! They cost 450 Baht per kilo. I can give a small discount. How much would you like?"
                    },
                    choices: [
                        { text: "Ask for a discount (2 kilos for 800 Baht)", nextNode: "negotiate_discount" },
                        { text: "Agree to the price (1 kilo)", nextNode: "agree_price" }
                    ]
                },
                negotiate_discount: {
                    tourist: {
                        text: "I would like two kilos. Can we make it 800 Baht for two kilos?",
                        translation: "ขอสองกิโลครับ ลดเหลือแปดร้อยบาทได้ไหมครับ (Kor song kilo krap. Lod luea paed roy baht dai mai krap?)"
                    },
                    local: {
                        name: "P'Som (Fishmonger)",
                        text: "โอเคจ้า คนหล่อ! ได้จ้า สองกิโล 800 บาท เดี๋ยวป้าแถมหอยแมลงภู่ให้ด้วยจ้า",
                        translation: "Okay handsome! Sure, two kilos for 800 Baht. I will throw in some free mussels too!"
                    },
                    choices: [
                        { text: "Thank her politely", nextNode: "thanks_happy" }
                    ]
                },
                agree_price: {
                    tourist: {
                        text: "That is a good price. I will take one kilo.",
                        translation: "ราคาดีครับ เอาหนึ่งกิโลครับ (Racha dee krap. Ao nueng kilo krap.)"
                    },
                    local: {
                        name: "P'Som (Fishmonger)",
                        text: "ได้เลยจ้า! เดี๋ยวป้าเลือกตัวโตๆ ให้เลยนะจ๊ะ รอสักครู่จ้า",
                        translation: "Sure! I will select some nice big ones for you. A moment please."
                    },
                    choices: [
                        { text: "Thank her", nextNode: "thanks_happy" }
                    ]
                },
                thanks_happy: {
                    tourist: {
                        text: "Great! Thank you very much for the excellent service!",
                        translation: "เยี่ยมเลยครับ ขอบคุณมากสำหรับบริการที่ดีเยี่ยมนะครับ (Yiem loey krap! Khop khun mak sam-rab bo-ri-kan tee dee yiem na krap.)"
                    },
                    local: {
                        name: "P'Som (Fishmonger)",
                        text: "ยินดีมากจ้า เที่ยวพัทยาให้สนุกนะจ๊ะ! (Yindee mak ja, thiew Pattaya hai sanook na ja!)",
                        translation: "You are very welcome, have fun in Pattaya!"
                    },
                    choices: []
                }
            }
        },
        taxi: {
            title: "Songthaew Ride to Walking Street",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Good evening, are you going to Walking Street?",
                        translation: "สวัสดีครับ ไปถนนคนเดินวอคกิ้งสตรีทไหมครับ (Sawatdee krap, pai tha-non khon dern Walking Street mai krap?)"
                    },
                    local: {
                        name: "Looong (Driver)",
                        text: "ไปครับ ขึ้นมาเลยครับ คนละ 20 บาทครับผม",
                        translation: "Yes, I am! Get in, it is 20 Baht per person."
                    },
                    choices: [
                        { text: "Hop in for 20 Baht per person", nextNode: "taxi_standard" },
                        { text: "Ask to be dropped off directly at the entrance (4 people)", nextNode: "taxi_direct" }
                    ]
                },
                taxi_standard: {
                    tourist: {
                        text: "Perfect, we will get in. 20 Baht is fine.",
                        translation: "ตกลงครับ ขึ้นรถเลย คนละยี่สิบบาทครับ (Tok-long krap, khuen rot loey, khon la yee-sip baht krap.)"
                    },
                    local: {
                        name: "Looong (Driver)",
                        text: "ดีครับ! เดี๋ยวผ่านถนนเลียบหาดแล้วจะจอดส่งที่สี่แยกข้างหน้านะครับ",
                        translation: "Great! We will drive along Beach Road and I will drop you off at the intersection nearby."
                    },
                    choices: [
                        { text: "Thank him upon arrival", nextNode: "taxi_arrive" }
                    ]
                },
                taxi_direct: {
                    tourist: {
                        text: "Wait, can you drop us off directly at the entrance? We are 4 people.",
                        translation: "เดี๋ยวครับ ช่วยไปส่งที่หน้าทางเข้าเลยได้ไหมครับ พวกเรามีกันสี่คน (Diew krap, chuay pai song tee nah tang khao loey dai mai krap? Puak rao mee kan see khon.)"
                    },
                    local: {
                        name: "Looong (Driver)",
                        text: "ถ้าเหมาไปส่งข้างหน้าเลย คิดเหมา 150 บาทละกันครับ สะดวกกว่า ไม่ต้องเดินไgel",
                        translation: "If you charter the bus to drop you off directly at the entrance, I will charge 150 Baht in total. It is more convenient and saves walking."
                    },
                    choices: [
                        { text: "Accept 150 Baht for the direct ride", nextNode: "taxi_direct_accept" },
                        { text: "Ride along for 20 Baht p.p. instead", nextNode: "taxi_standard" }
                    ]
                },
                taxi_direct_accept: {
                    tourist: {
                        text: "150 Baht is perfect. Let's go. Thank you!",
                        translation: "ร้อยห้าสิบบาทตกลงครับ ไปกันเลย ขอบคุณครับ (Roy ha-sip baht tok-long krap. Pai kan loey. Khop khun krap!)"
                    },
                    local: {
                        name: "Looong (Driver)",
                        text: "ได้เลยครับ! นั่งให้สบายเลย เดี๋ยวซิ่งไปส่งให้ถึงที่เลยครับ",
                        translation: "No problem! Have a comfortable seat, I'll drive you there directly."
                    },
                    choices: [
                        { text: "Thank him upon arrival", nextNode: "taxi_arrive" }
                    ]
                },
                taxi_arrive: {
                    tourist: {
                        text: "We are here! Thank you for the safe ride.",
                        translation: "ถึงแล้วครับ ขอบคุณที่ขับรถมาส่งอย่างปลอดภัยนะครับ (Thueng laew krap. Khop khun tee khap rot ma song yangปลอดภัย na krap.)"
                    },
                    local: {
                        name: "Looong (Driver)",
                        text: "เที่ยวให้สนุกนะครับ โชคดีครับ! (Thiew hai sanook na krap. Chok dee krap!)",
                        translation: "Have fun there and good luck!"
                    },
                    choices: []
                }
            }
        },
        resort: {
            title: "Checking in at Jomtien Bay Resort",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Hello, I would like to check in. My reservation is under the name of Jasper.",
                        translation: "สวัสดีครับ ขอเช็คอินครับ จองไว้ในชื่อ แจสเปอร์ ครับ (Sawatdee krap, kor check-in krap. Jong wai nai chue Jasper krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "สวัสดีค่ะ ยินดีต้อนรับค่ะ ขอเอกสารยืนยันการจองกับพาสปอร์ตด้วยนะคะ",
                        translation: "Hello, welcome! May I have your booking confirmation and passport, please?"
                    },
                    choices: [
                        { text: "Provide passport & booking confirmation", nextNode: "docs_provided" }
                    ]
                },
                docs_provided: {
                    tourist: {
                        text: "Here you go. Here are my passport and booking confirmation.",
                        translation: "นี่ครับ พาสปอร์ตกับใบจองครับ (Nee krap, passport kab bai jong krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ขอบคุณค่ะ จองห้องดีลักซ์ไว้ 5 คืนนะคะ รบกวนสอบถามว่าต้องการถามข้อมูลเพิ่มเติมเกี่ยวกับการเข้าพักไหมคะ",
                        translation: "Thank you. You booked a Deluxe room for 5 nights. Would you like any additional information about your stay?"
                    },
                    choices: [
                        { text: "Ask about breakfast & pool opening hours", nextNode: "pool_breakfast" },
                        { text: "Ask about Wi-Fi code & security deposit", nextNode: "wifi_deposit" }
                    ]
                },
                pool_breakfast: {
                    tourist: {
                        text: "Is breakfast included and what time does the pool open?",
                        translation: "รวมอาหารเช้าด้วยไหมครับ แล้วสระว่ายน้ำเปิดถึงกี่โมงครับ (Ruam ar-han chao duay mai krap? Laew sa-wai-nam perd tueng kee mong krap?)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "รวมอาหารเช้าเรียบร้อยค่ะ ทานได้ที่ห้องอาหารชั้นหนึ่ง ส่วนสระว่ายน้ำเปิดเจ็ดโมงเช้าถึงสี่ทุ่มค่ะ",
                        translation: "Yes, breakfast is included and is served in the restaurant on the first floor. The pool is open from 7:00 AM to 10:00 PM."
                    },
                    choices: [
                        { text: "Finish check-in", nextNode: "checkin_done" }
                    ]
                },
                wifi_deposit: {
                    tourist: {
                        text: "What is the Wi-Fi code and how does the security deposit work?",
                        translation: "รหัสไวไฟอะไรครับ แล้วต้องวางเงินมัดจำเท่าไหร่ครับ (Rahat wifi arai krap? Laew tong wang ngoen mat-jam tao rai krap?)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ไวไฟใช้ได้ฟรีทั่วทั้งรีสอร์ทค่ะ รหัสอยู่บนซองคีย์การ์ด ส่วนมัดจำคีย์การ์ด 1,000 บาทหรือสแกนบัตรเครดิตค่ะ",
                        translation: "Wi-Fi is free throughout the resort, the code is on your keycard envelope. The deposit is 1,000 Baht in cash or a credit card imprint."
                    },
                    choices: [
                        { text: "Finish check-in", nextNode: "checkin_done" }
                    ]
                },
                checkin_done: {
                    tourist: {
                        text: "Fantastic. Thank you very much for the clear explanation and the keys.",
                        translation: "ยอดเยี่ยมมาก ขอบคุณมากสำหรับคำอธิบายที่ชัดเจนและคีย์การ์ดนะครับ (Yod-yiem mak. Khop khun mak sam-rab kam ar-thi-bay tee chad-jen laew kab keycard na krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ยินดีค่ะ นี่ค่ะคีย์การ์ดห้อง 402 ขอให้พักผ่อนอย่างมีความสุขนะคะ! (Yindee ka. Nee ka keycard hong see-roy-song. Kor hai pak-phon yang mee khwam sook na ka!)",
                        translation: "You're welcome! Here is your keycard for room 402. Have a wonderful stay!"
                    },
                    choices: []
                }
            }
        }
    };

    let currentScenario = 'market';
    let currentNodeId = 'greet';
    let isTransitioning = false;

    const simMessages = document.getElementById('simulator-messages');
    const simTitleText = document.getElementById('simulator-title-text');
    const simChoices = document.getElementById('simulator-choices');
    const simAiStatus = document.getElementById('simulator-ai-status');
    const simAiStatusText = document.getElementById('simulator-ai-status-text');
    const simStatusIndicator = document.getElementById('simulator-status-indicator');
    const btnSimSound = document.getElementById('btn-sim-sound');
    const simSoundIcon = document.getElementById('sim-sound-icon');

    // Setup Scenario buttons
    const scenarioMarketBtn = document.getElementById('btn-scenario-market');
    const scenarioTaxiBtn = document.getElementById('btn-scenario-taxi');
    const scenarioResortBtn = document.getElementById('btn-scenario-resort');

    // Sound Toggle Manager
    if (btnSimSound && simSoundIcon) {
        btnSimSound.addEventListener('click', () => {
            simSoundEnabled = !simSoundEnabled;
            if (simSoundEnabled) {
                simSoundIcon.textContent = "🔊";
                btnSimSound.title = "Mute Sound";
            } else {
                simSoundIcon.textContent = "🔇";
                btnSimSound.title = "Unmute Sound";
                stopSpeaking();
            }
        });
    }

    function updateScenarioActiveState(activeId) {
        document.querySelectorAll('.scenario-card').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeId === 'market' && scenarioMarketBtn) scenarioMarketBtn.classList.add('active');
        if (activeId === 'taxi' && scenarioTaxiBtn) scenarioTaxiBtn.classList.add('active');
        if (activeId === 'resort' && scenarioResortBtn) scenarioResortBtn.classList.add('active');
    }

    function resetSimulator(scenarioId = currentScenario) {
        stopSpeaking();
        currentScenario = scenarioId;
        currentNodeId = scenarios[scenarioId].startNode;
        isTransitioning = false;
        
        updateScenarioActiveState(scenarioId);
        
        if (simTitleText) simTitleText.textContent = scenarios[scenarioId].title;
        if (simMessages) {
            simMessages.innerHTML = `
                <div class="msg-bubble glass msg-local" style="align-self: center; border-radius: var(--radius-md); text-align: center; max-width: 90%;">
                    <div class="msg-text">💡 Kies een scenario aan de linkerkant of klik op <strong>"Start Gesprek"</strong> om te beginnen!</div>
                </div>
            `;
        }
        
        if (simAiStatus) simAiStatus.style.display = 'none';
        if (simStatusIndicator) {
            simStatusIndicator.classList.remove('online');
            simStatusIndicator.classList.add('blinking');
        }

        renderChoices();
    }

    function playNodeTurn(nodeId) {
        if (isTransitioning) return;
        isTransitioning = true;

        const node = scenarios[currentScenario].nodes[nodeId];
        if (!node) return;

        // Hide buttons during voice input/translation simulation
        if (simChoices) {
            simChoices.innerHTML = '<span class="text-muted" style="font-size:0.85rem; padding: 10px;">Gesprek is bezig...</span>';
        }

        // --- STEP 1: Tourist speaks ---
        if (simAiStatus) {
            simAiStatus.style.display = 'flex';
            if (simAiStatusText) simAiStatusText.textContent = "You are speaking in English...";
        }
        if (simStatusIndicator) {
            simStatusIndicator.classList.remove('blinking');
            simStatusIndicator.classList.add('online');
        }

        // 1.2s delay for voice translation processing
        setTimeout(() => {
            // Append Tourist speech bubble
            const touristBubble = document.createElement('div');
            touristBubble.className = "msg-bubble glass msg-tourist";
            touristBubble.innerHTML = `
                <div class="msg-meta">You (Tourist)</div>
                <div class="msg-text">${node.tourist.text} <button class="btn-replay-speech btn-speak-main" title="Listen to original" type="button">🔊</button></div>
                <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="Listen to translation" type="button">🔊</button> Translation: "${node.tourist.translation}"</div>
            `;
            
            // Register Speech Replay button clicks
            touristBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                e.stopPropagation();
                speakText(node.tourist.text, 'en');
            });
            touristBubble.querySelector('.btn-speak-trans').addEventListener('click', (e) => {
                e.stopPropagation();
                speakText(node.tourist.translation, 'th');
            });

            if (simMessages) {
                // Clear initial tip on start
                if (nodeId === scenarios[currentScenario].startNode) {
                    simMessages.innerHTML = '';
                }
                simMessages.appendChild(touristBubble);
                simMessages.scrollTop = simMessages.scrollHeight;
            }

            // Speak tourist voice in English, then wait for it to end
            speakText(node.tourist.text, 'en', () => {
                // Tourist finished speaking. Wait 1.5s (natural pause) before starting local response
                setTimeout(() => {
                    if (simAiStatusText) simAiStatusText.textContent = "Local conversation partner is responding...";
                    if (simAiStatus) simAiStatus.style.display = 'flex';
                    
                    // 1.5s delay for Local response translation processing
                    setTimeout(() => {
                        // Append Local speech bubble
                        const localBubble = document.createElement('div');
                        localBubble.className = "msg-bubble glass msg-local";
                        localBubble.innerHTML = `
                            <div class="msg-meta">${node.local.name}</div>
                            <div class="msg-text">${node.local.text} <button class="btn-replay-speech btn-speak-main" title="Listen to original" type="button">🔊</button></div>
                            <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="Listen to translation" type="button">🔊</button> Translation: "${node.local.translation}"</div>
                        `;

                        // Register Speech Replays for Local
                        localBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.text, 'th');
                        });
                        localBubble.querySelector('.btn-speak-trans').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.translation, 'en');
                        });

                        if (simMessages) {
                            simMessages.appendChild(localBubble);
                            simMessages.scrollTop = simMessages.scrollHeight;
                        }

                        // Speak local voice in Thai, then wait for it to end
                        speakText(node.local.text, 'th', () => {
                            // Local finished speaking. Wait 1.0s (natural pause) before showing choices
                            setTimeout(() => {
                                if (simAiStatus) simAiStatus.style.display = 'none';
                                isTransitioning = false;
                                currentNodeId = nodeId;
                                renderChoices();
                            }, 1000);
                        });

                    }, 1500); // Local response delay

                }, 1500); // Pause between tourist and local speaking
            });

        }, 1200); // Tourist translation delay
    }

    function renderChoices() {
        if (!simChoices) return;
        simChoices.innerHTML = '';

        const node = scenarios[currentScenario].nodes[currentNodeId];
        const isStart = simMessages && simMessages.innerHTML.includes('💡');
        
        if (isStart) {
            const startBtn = document.createElement('button');
            startBtn.className = "btn btn-neon btn-sim-choice";
            startBtn.id = "simulator-next-btn";
            startBtn.textContent = "Start Gesprek";
            startBtn.type = "button";
            startBtn.addEventListener('click', () => {
                playNodeTurn(scenarios[currentScenario].startNode);
            });
            simChoices.appendChild(startBtn);
            
            const resetBtn = document.createElement('button');
            resetBtn.className = "btn btn-outline";
            resetBtn.textContent = "Reset";
            resetBtn.type = "button";
            resetBtn.addEventListener('click', () => resetSimulator());
            simChoices.appendChild(resetBtn);
            return;
        }

        if (!node || node.choices.length === 0) {
            // Reached conversation endpoint
            const endText = document.createElement('span');
            endText.className = "text-green font-bold";
            endText.style.fontSize = "0.95rem";
            endText.style.padding = "10px";
            endText.textContent = "✓ Gesprek voltooid!";
            simChoices.appendChild(endText);

            const resetBtn = document.createElement('button');
            resetBtn.className = "btn btn-neon btn-sim-choice";
            resetBtn.textContent = "Kies scenario (Reset)";
            resetBtn.type = "button";
            resetBtn.addEventListener('click', () => resetSimulator());
            simChoices.appendChild(resetBtn);
            return;
        }

        // Render decision branch choices buttons
        node.choices.forEach(choice => {
            const choiceBtn = document.createElement('button');
            choiceBtn.className = "btn btn-neon btn-sim-choice";
            choiceBtn.textContent = choice.text;
            choiceBtn.type = "button";
            choiceBtn.addEventListener('click', () => {
                playNodeTurn(choice.nextNode);
            });
            simChoices.appendChild(choiceBtn);
        });

        // Add Reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = "btn btn-outline";
        resetBtn.textContent = "Reset";
        resetBtn.type = "button";
        resetBtn.addEventListener('click', () => resetSimulator());
        simChoices.appendChild(resetBtn);
    }

    // Connect Scenario Sidebar buttons
    if (scenarioMarketBtn) {
        scenarioMarketBtn.addEventListener('click', () => resetSimulator('market'));
    }
    if (scenarioTaxiBtn) {
        scenarioTaxiBtn.addEventListener('click', () => resetSimulator('taxi'));
    }
    if (scenarioResortBtn) {
        scenarioResortBtn.addEventListener('click', () => resetSimulator('resort'));
    }


    // Initialize Simulator
    resetSimulator('market');


    /* ==========================================================================
       4. DYNAMIC RENTAL BOOKING ENGINE & PRICE CALCULATOR
       ========================================================================= */
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const earbudCountInput = document.getElementById('earbud-count');
    const extraSimCheckbox = document.getElementById('extra-sim');
    const extraPowerbankCheckbox = document.getElementById('extra-powerbank');
    
    // Quantity increment/decrement buttons
    const btnQtyDec = document.getElementById('btn-qty-dec');
    const btnQtyInc = document.getElementById('btn-qty-inc');

    // Outputs
    const recDuration = document.getElementById('rec-duration');
    const recItemsList = document.getElementById('receipt-items-list');
    const recDiscountBox = document.getElementById('receipt-discount-box');
    const recDiscount = document.getElementById('rec-discount');
    const recTotalThb = document.getElementById('rec-total-thb');
    const recTotalEur = document.getElementById('rec-total-eur');

    // Forms
    const rentalForm = document.getElementById('rental-form');
    const receiptBox = document.getElementById('receipt-box');
    const successCard = document.getElementById('booking-success-card');
    const successEmailSpan = document.getElementById('success-email');
    const btnNewBooking = document.getElementById('btn-new-booking');
    let activeBookingData = null;

    // Basic Pricing Config (THB)
    const DAILY_RATE = 250;
    const SIM_CARD_PRICE = 350; // Flat
    const POWERBANK_PRICE = 175; // Flat
    const EUR_EXCHANGE_RATE = 37.0; // 1 EUR = 37 THB

    // Set today and tomorrow as initial constraints
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];

    if (startDateInput) {
        startDateInput.value = formattedToday;
        startDateInput.min = formattedToday;
    }
    if (endDateInput) {
        endDateInput.value = formattedTomorrow;
        endDateInput.min = formattedTomorrow;
    }

    // Helper to calculate days
    function calculateDays() {
        if (!startDateInput || !endDateInput) return 0;
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    // Earbud Quantity Controls
    if (btnQtyDec) {
        btnQtyDec.addEventListener('click', () => {
            let val = parseInt(earbudCountInput.value);
            if (val > 1) {
                earbudCountInput.value = val - 1;
                updatePricing();
            }
        });
    }

    if (btnQtyInc) {
        btnQtyInc.addEventListener('click', () => {
            let val = parseInt(earbudCountInput.value);
            if (val < 10) {
                earbudCountInput.value = val + 1;
                updatePricing();
            }
        });
    }

    function updatePricing() {
        const days = calculateDays();
        const quantity = parseInt(earbudCountInput ? earbudCountInput.value : 1);
        
        if (days <= 0) {
            if (recDuration) recDuration.textContent = 'Select dates';
            if (recItemsList) {
                recItemsList.innerHTML = `
                    <div class="receipt-row-item text-muted">
                        <span>Enter valid rental period</span>
                        <span>-</span>
                    </div>
                `;
            }
            if (recDiscountBox) recDiscountBox.style.display = 'none';
            if (recTotalThb) recTotalThb.textContent = '฿0';
            if (recTotalEur) recTotalEur.textContent = '€0.00';
            return;
        }

        // 1. Duration text
        if (recDuration) recDuration.textContent = `${days} ${days === 1 ? 'day' : 'days'}`;

        // 2. Base Cost
        const baseCostPerDay = DAILY_RATE;
        let discountPercent = 0;

        // Apply discount policies
        if (days >= 30) {
            discountPercent = 0.40; // 40% discount for expats
        } else if (days >= 5) {
            discountPercent = 0.20; // 20% discount
        }

        const rawRentalTotal = baseCostPerDay * days * quantity;
        const discountAmount = Math.round(rawRentalTotal * discountPercent);
        const finalRentalTotal = rawRentalTotal - discountAmount;

        // 3. Extras
        const hasSim = extraSimCheckbox ? extraSimCheckbox.checked : false;
        const hasPowerbank = extraPowerbankCheckbox ? extraPowerbankCheckbox.checked : false;

        const simCost = hasSim ? (SIM_CARD_PRICE * quantity) : 0;
        const powerbankCost = hasPowerbank ? (POWERBANK_PRICE * quantity) : 0;

        const totalThb = finalRentalTotal + simCost + powerbankCost;
        const totalEur = totalThb / EUR_EXCHANGE_RATE;

        // 4. Update Sidebar list
        if (recItemsList) {
            let itemsHtml = `
                <div class="receipt-row-item">
                    <span>W4 Pro Rental (${quantity}x set, ${days}d @ ฿250):</span>
                    <span>฿${rawRentalTotal}</span>
                </div>
            `;

            if (hasSim) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>5G SIM Card (${quantity}x flat):</span>
                        <span>฿${simCost}</span>
                    </div>
                `;
            }

            if (hasPowerbank) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>Premium Power Bank (${quantity}x flat):</span>
                        <span>฿${powerbankCost}</span>
                    </div>
                `;
            }

            recItemsList.innerHTML = itemsHtml;
        }

        // 5. Update discounts & totals
        if (discountAmount > 0) {
            if (recDiscountBox) recDiscountBox.style.display = 'flex';
            if (recDiscount) recDiscount.textContent = `-฿${discountAmount} (${discountPercent * 100}%)`;
        } else {
            if (recDiscountBox) recDiscountBox.style.display = 'none';
        }

        if (recTotalThb) recTotalThb.textContent = `฿${totalThb}`;
        if (recTotalEur) recTotalEur.textContent = `€${totalEur.toFixed(2)}`;

        // Check availability in the background
        checkAvailability();
    }

    // Event listeners for fields
    if (startDateInput) {
        startDateInput.addEventListener('change', () => {
            // Force end date to be at least start date + 1
            const start = new Date(startDateInput.value);
            const nextDay = new Date(start);
            nextDay.setDate(start.getDate() + 1);
            const formattedNext = nextDay.toISOString().split('T')[0];
            
            if (endDateInput) {
                endDateInput.min = formattedNext;
                if (new Date(endDateInput.value) <= start) {
                    endDateInput.value = formattedNext;
                }
            }
            updatePricing();
        });
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', updatePricing);
    }
    if (extraSimCheckbox) {
        extraSimCheckbox.addEventListener('change', updatePricing);
    }
    if (extraPowerbankCheckbox) {
        extraPowerbankCheckbox.addEventListener('change', updatePricing);
    }

    // ==========================================================
    // HOTEL SELECTION MODAL SYSTEM
    // ==========================================================
    let selectedHotelName = '';
    const popularHotels = [
        "Hilton Pattaya",
        "Hard Rock Hotel Pattaya",
        "Dusit Thani Pattaya",
        "Centara Grand Mirage Beach Resort Pattaya",
        "Grande Centre Point Pattaya",
        "Siam @ Siam Design Hotel Pattaya",
        "Cape Dara Resort",
        "Royal Cliff Beach Hotel",
        "Avani Pattaya Resort",
        "Mercure Pattaya Ocean Resort",
        "Holiday Inn Pattaya",
        "Amari Pattaya",
        "InterContinental Pattaya Resort",
        "U Pattaya",
        "OZO North Pattaya",
        "Pattaya Discovery Beach Hotel",
        "Mera Mare Pattaya",
        "LK The Empress Pattaya",
        "Page 10 Hotel Pattaya",
        "Woodlands Hotel & Resort Pattaya",
        "Jomtien Palm Beach Hotel & Resort",
        "Rabbit Resort Pattaya",
        "Mytt Beach Hotel Pattaya",
        "Pullman Pattaya Hotel G",
        "D Varee Jomtien Beach Pattaya"
    ];

    const hotelModal = document.getElementById('hotel-search-modal');
    const hotelSearchInput = document.getElementById('hotel-search-input');
    const hotelResultsList = document.getElementById('hotel-results-list');
    const manualHotelGroup = document.getElementById('manual-hotel-group');
    const manualHotelInput = document.getElementById('manual-hotel-input');
    const btnConfirmHotel = document.getElementById('btn-confirm-hotel');
    const btnCancelHotel = document.getElementById('btn-cancel-hotel');
    const btnCloseHotelModal = document.getElementById('btn-close-hotel-modal');
    const pickupLocSelect = document.getElementById('pickup-loc');
    const hotelSelectionDisplay = document.getElementById('hotel-selection-display');
    const selectedHotelNameSpan = document.getElementById('selected-hotel-name');
    const btnChangeHotel = document.getElementById('btn-change-hotel');

    let tempSelectedHotel = '';
    let mapUpdateTimeout = null;

    function updateHotelMap(locationName, immediate = false) {
        const mapIframe = document.getElementById('hotel-map-iframe');
        if (!mapIframe) return;

        if (mapUpdateTimeout) clearTimeout(mapUpdateTimeout);

        const update = () => {
            const query = encodeURIComponent(locationName + (locationName.toLowerCase().includes('pattaya') ? '' : ' Pattaya'));
            mapIframe.src = `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
        };

        if (immediate) {
            update();
        } else {
            mapUpdateTimeout = setTimeout(update, 450); // Debounce typing
        }
    }

    function openHotelModal() {
        if (!hotelModal) return;
        tempSelectedHotel = selectedHotelName;
        if (hotelSearchInput) hotelSearchInput.value = '';
        if (manualHotelInput) manualHotelInput.value = '';
        if (manualHotelGroup) manualHotelGroup.style.display = 'none';
        
        renderHotelList('');
        
        // Initialize map to the selected hotel or default Pattaya
        if (tempSelectedHotel) {
            updateHotelMap(tempSelectedHotel, true);
        } else {
            updateHotelMap('Pattaya', true);
        }

        hotelModal.classList.add('active');
        if (hotelSearchInput) hotelSearchInput.focus();
    }

    function closeHotelModal(confirmed = false) {
        if (!hotelModal) return;
        hotelModal.classList.remove('active');
        
        if (confirmed) {
            selectedHotelName = tempSelectedHotel;
            if (selectedHotelNameSpan) selectedHotelNameSpan.textContent = selectedHotelName;
            if (hotelSelectionDisplay) hotelSelectionDisplay.style.display = 'flex';
        } else {
            // Cancelled
            if (!selectedHotelName) {
                // If no hotel was ever selected, revert select box to office pickup
                if (pickupLocSelect) pickupLocSelect.value = 'pattaya_office';
                if (hotelSelectionDisplay) hotelSelectionDisplay.style.display = 'none';
            }
        }
    }

    function renderHotelList(filterText = '') {
        if (!hotelResultsList) return;
        hotelResultsList.innerHTML = '';

        const filtered = popularHotels.filter(h => 
            h.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach(h => {
            const div = document.createElement('div');
            div.className = 'hotel-item';
            if (h === tempSelectedHotel) {
                div.classList.add('selected');
            }
            div.textContent = h;
            div.addEventListener('click', () => {
                document.querySelectorAll('.hotel-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                tempSelectedHotel = h;
                if (manualHotelGroup) manualHotelGroup.style.display = 'none';
                if (btnConfirmHotel) btnConfirmHotel.disabled = false;
                
                // Update map immediately on list item selection
                updateHotelMap(h, true);
            });
            hotelResultsList.appendChild(div);
        });

        // Add manual input option
        const manualOption = document.createElement('div');
        manualOption.className = 'hotel-item other-option';
        
        const isCustomHotel = tempSelectedHotel && !popularHotels.includes(tempSelectedHotel);
        if (isCustomHotel) {
            manualOption.classList.add('selected');
        }

        if (filterText.trim() !== '') {
            manualOption.textContent = `Use custom search: "${filterText}"`;
        } else {
            manualOption.textContent = "Other hotel... (type manually)";
        }

        manualOption.addEventListener('click', () => {
            document.querySelectorAll('.hotel-item').forEach(el => el.classList.remove('selected'));
            manualOption.classList.add('selected');
            if (manualHotelGroup) {
                manualHotelGroup.style.display = 'block';
                if (manualHotelInput) {
                    if (filterText.trim() !== '' && !isCustomHotel) {
                        manualHotelInput.value = filterText;
                    }
                    manualHotelInput.focus();
                    tempSelectedHotel = manualHotelInput.value.trim();
                    if (btnConfirmHotel) btnConfirmHotel.disabled = tempSelectedHotel === '';
                    
                    if (tempSelectedHotel) {
                        updateHotelMap(tempSelectedHotel, true);
                    } else {
                        updateHotelMap('Pattaya', true);
                    }
                }
            }
        });
        hotelResultsList.appendChild(manualOption);

        if (btnConfirmHotel) {
            btnConfirmHotel.disabled = tempSelectedHotel === '';
        }
    }

    if (hotelSearchInput) {
        hotelSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            renderHotelList(e.target.value);
            
            // Search in Google Maps live as they type to verify if it is found on the map
            if (query) {
                updateHotelMap(query);
            } else {
                updateHotelMap('Pattaya');
            }
        });

        // Prevent form submission on Enter
        hotelSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    }

    if (manualHotelInput) {
        manualHotelInput.addEventListener('input', (e) => {
            tempSelectedHotel = e.target.value.trim();
            if (btnConfirmHotel) {
                btnConfirmHotel.disabled = tempSelectedHotel === '';
            }
            if (tempSelectedHotel) {
                updateHotelMap(tempSelectedHotel);
            } else {
                updateHotelMap('Pattaya');
            }
        });
    }

    if (pickupLocSelect) {
        pickupLocSelect.addEventListener('change', () => {
            if (pickupLocSelect.value === 'hotel_delivery') {
                openHotelModal();
            } else {
                if (hotelSelectionDisplay) hotelSelectionDisplay.style.display = 'none';
            }
        });
    }

    if (btnChangeHotel) {
        btnChangeHotel.addEventListener('click', openHotelModal);
    }

    if (btnConfirmHotel) {
        btnConfirmHotel.addEventListener('click', () => {
            if (tempSelectedHotel) {
                closeHotelModal(true);
            }
        });
    }

    if (btnCancelHotel) {
        btnCancelHotel.addEventListener('click', () => closeHotelModal(false));
    }

    if (btnCloseHotelModal) {
        btnCloseHotelModal.addEventListener('click', () => closeHotelModal(false));
    }

    // Submit handler
    // Submit handler - Navigates to payment wizard
    if (rentalForm) {
        rentalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('cust-name') ? document.getElementById('cust-name').value : '';
            const email = document.getElementById('cust-email') ? document.getElementById('cust-email').value : '';
            const startDate = document.getElementById('start-date') ? document.getElementById('start-date').value : '';
            const endDate = document.getElementById('end-date') ? document.getElementById('end-date').value : '';
            const earbudCount = document.getElementById('earbud-count') ? document.getElementById('earbud-count').value : '1';
            
            const pickupLocSelect = document.getElementById('pickup-loc');
            let pickupLoc = pickupLocSelect ? pickupLocSelect.options[pickupLocSelect.selectedIndex].text : '';
            if (pickupLocSelect && pickupLocSelect.value === 'hotel_delivery') {
                pickupLoc = "Hotel Delivery: " + (selectedHotelName || 'Pattaya Hotel (unspecified)');
            }
            
            const hasSim = document.getElementById('extra-sim') ? document.getElementById('extra-sim').checked : false;
            const hasPowerbank = document.getElementById('extra-powerbank') ? document.getElementById('extra-powerbank').checked : false;
            
            // Read calculated totals from receipt DOM elements
            const durationText = document.getElementById('rec-duration') ? document.getElementById('rec-duration').textContent : '';
            const totalThb = document.getElementById('rec-total-thb') ? document.getElementById('rec-total-thb').textContent : '';
            const totalEur = document.getElementById('rec-total-eur') ? document.getElementById('rec-total-eur').textContent : '';
            
            // Store active data for payment steps
            activeBookingData = {
                name: name,
                email: email,
                start_date: startDate,
                end_date: endDate,
                quantity: earbudCount,
                pickup_location: pickupLoc,
                extra_sim: hasSim ? "Yes (+ ฿350 each)" : "No",
                extra_powerbank: hasPowerbank ? "Yes (+ ฿175 each)" : "No",
                duration: durationText,
                total_thb: totalThb,
                total_eur: totalEur
            };

            // Switch to payment step wizard
            if (rentalForm) rentalForm.style.display = 'none';
            
            const paymentStep = document.getElementById('payment-step');
            if (paymentStep) {
                paymentStep.style.display = 'block';
                // Copy total THB digits to payment panels
                const thbValueOnly = totalThb.replace(/[^0-9]/g, '');
                document.querySelectorAll('.pay-amount-placeholder').forEach(el => el.textContent = thbValueOnly);
            }
            
            // Scroll to the booking wizard top
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }

            // Default payment tab is Credit Card
            selectPaymentTab('card');
        });
    }

    // Submit final paid booking to database and FormSubmit.co
    function submitBooking(paymentMethod, txnId, bookingData) {
        const payCardBtn = document.getElementById('btn-pay-card');
        const cancelBtn = document.getElementById('btn-cancel-payment');
        
        let originalPayCardText = "";
        if (payCardBtn) {
            originalPayCardText = payCardBtn.textContent;
            payCardBtn.disabled = true;
            payCardBtn.textContent = "Processing...";
        }
        if (cancelBtn) cancelBtn.disabled = true;

        // Save to database first
        saveBookingToDatabase(paymentMethod, txnId, bookingData)
            .then(dbId => {
                const finalFormData = {
                    ...bookingData,
                    _subject: `🎉 Paid Booking from ${bookingData.name} (${paymentMethod})`,
                    _replyto: bookingData.email,
                    Payment_Status: `PAID via ${paymentMethod}`,
                    Transaction_ID: txnId,
                    Payment_Reference: `True Time Thai Pattaya - ${txnId}`,
                    Database_ID: dbId
                };

                return fetch("https://formsubmit.co/ajax/info@truetimethai.com", {
                    method: "POST",
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(finalFormData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network error sending booking confirmation");
                }
                return response.json();
            })
            .then(data => {
                // Visual success transition
                const paymentStep = document.getElementById('payment-step');
                const rentalForm = document.getElementById('rental-form');
                const successCard = document.getElementById('booking-success-card');
                const successEmailSpan = document.getElementById('success-email');
                const successTxnSpan = document.getElementById('success-transaction-id');
                const receiptPaidStamp = document.getElementById('receipt-paid-stamp');

                if (paymentStep) paymentStep.style.display = 'none';
                if (rentalForm) rentalForm.style.display = 'none';
                
                if (successCard) successCard.style.display = 'block';
                if (successEmailSpan) successEmailSpan.textContent = bookingData.email;
                if (successTxnSpan) successTxnSpan.textContent = txnId;

                // Populate receipt customer details
                const recClientName = document.getElementById('rec-client-name');
                const recClientEmail = document.getElementById('rec-client-email');
                const recClientTxid = document.getElementById('rec-client-txid');
                const recClientInfo = document.getElementById('receipt-client-info');

                if (recClientName) recClientName.textContent = bookingData.name;
                if (recClientEmail) recClientEmail.textContent = bookingData.email;
                if (recClientTxid) recClientTxid.textContent = txnId;
                if (recClientInfo) recClientInfo.style.display = 'block';

                // Stamp Receipt
                if (receiptPaidStamp) receiptPaidStamp.classList.add('visible');

                // Scroll to wizard section
                const bookingSection = document.getElementById('booking');
                if (bookingSection) {
                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error("Error processing booking:", error);
                alert("An error occurred while registering your payment. Please contact us via WhatsApp immediately with Transaction ID: " + txnId);
            })
            .finally(() => {
                if (payCardBtn) {
                    payCardBtn.disabled = false;
                    payCardBtn.textContent = originalPayCardText;
                }
                if (cancelBtn) cancelBtn.disabled = false;
                stopPromptPaySimulation();
            });
    }

    // Payment Tab Selector Logic
    function selectPaymentTab(tabName) {
        const tabCard = document.getElementById('tab-card');
        const tabPromptPay = document.getElementById('tab-promptpay');
        const panelCard = document.getElementById('card-payment-panel');
        const panelPromptPay = document.getElementById('promptpay-payment-panel');

        if (tabName === 'card') {
            if (tabCard) tabCard.classList.add('active');
            if (tabPromptPay) tabPromptPay.classList.remove('active');
            if (panelCard) panelCard.style.display = 'block';
            if (panelPromptPay) panelPromptPay.style.display = 'none';
            stopPromptPaySimulation();
        } else if (tabName === 'promptpay') {
            if (tabCard) tabCard.classList.remove('active');
            if (tabPromptPay) tabPromptPay.classList.add('active');
            if (panelCard) panelCard.style.display = 'none';
            if (panelPromptPay) panelPromptPay.style.display = 'block';
            if (activeBookingData) {
                startPromptPaySimulation(activeBookingData);
            }
        }
    }

    // PromptPay Simulation Logic
    let promptPayTimerInterval = null;
    let promptPaySimTimeout1 = null;
    let promptPaySimTimeout2 = null;

    // Set up payment events
    const tabCard = document.getElementById('tab-card');
    const tabPromptPay = document.getElementById('tab-promptpay');
    if (tabCard) {
        tabCard.addEventListener('click', () => selectPaymentTab('card'));
    }
    if (tabPromptPay) {
        tabPromptPay.addEventListener('click', () => selectPaymentTab('promptpay'));
    }

    // Card Input formatters & dynamic face updating
    const cardNumInput = document.getElementById('card-number');
    const cardHolderInput = document.getElementById('card-holder');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvvInput = document.getElementById('card-cvv');

    const cardInner = document.getElementById('card-inner');
    const cardNumberDisplay = document.getElementById('card-number-display');
    const cardHolderDisplay = document.getElementById('card-holder-display');
    const cardExpiryDisplay = document.getElementById('card-expiry-display');
    const cardCvvDisplay = document.getElementById('card-cvv-display');
    const cardBrandLogo = document.getElementById('card-brand-logo');

    if (cardNumInput) {
        cardNumInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 16) val = val.substring(0, 16);
            let formatted = '';
            for (let i = 0; i < val.length; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                formatted += val[i];
            }
            e.target.value = formatted;
            if (cardNumberDisplay) cardNumberDisplay.textContent = formatted || '•••• •••• •••• ••••';
            
            if (cardBrandLogo) {
                if (val.startsWith('4')) {
                    cardBrandLogo.textContent = 'VISA';
                } else if (val.startsWith('5')) {
                    cardBrandLogo.textContent = 'Mastercard';
                } else {
                    cardBrandLogo.textContent = 'CARD';
                }
            }
        });
    }

    if (cardHolderInput) {
        cardHolderInput.addEventListener('input', (e) => {
            let val = e.target.value;
            if (cardHolderDisplay) {
                cardHolderDisplay.textContent = val.toUpperCase() || 'NAAM KAARTHOUDER';
            }
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 4) val = val.substring(0, 4);
            let formatted = val;
            if (val.length > 2) {
                formatted = val.substring(0, 2) + '/' + val.substring(2);
            }
            e.target.value = formatted;
            if (cardExpiryDisplay) {
                cardExpiryDisplay.textContent = formatted || 'MM/JJ';
            }
        });
    }

    if (cardCvvInput) {
        cardCvvInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length > 3) val = val.substring(0, 3);
            e.target.value = val;
            if (cardCvvDisplay) {
                cardCvvDisplay.textContent = val || '•••';
            }
        });

        cardCvvInput.addEventListener('focus', () => {
            if (cardInner) cardInner.classList.add('flipped');
        });

        cardCvvInput.addEventListener('blur', () => {
            if (cardInner) cardInner.classList.remove('flipped');
        });
    }

    // Submit via credit card
    const payCardBtn = document.getElementById('btn-pay-card');
    if (payCardBtn) {
        payCardBtn.addEventListener('click', () => {
            const cardNumber = cardNumInput ? cardNumInput.value.replace(/\D/g, '') : '';
            const cardHolder = cardHolderInput ? cardHolderInput.value.trim() : '';
            const cardExpiry = cardExpiryInput ? cardExpiryInput.value.trim() : '';
            const cardCvv = cardCvvInput ? cardCvvInput.value.trim() : '';

            if (cardNumber.length < 15) {
                alert("Please enter a valid credit card number.");
                return;
            }
            if (cardHolder.length === 0) {
                alert("Please enter the cardholder's name.");
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                alert("Please enter a valid expiration date (MM/YY).");
                return;
            }
            if (cardCvv.length < 3) {
                alert("Please enter a valid CVV code.");
                return;
            }

            // Simulate card validation
            const originalText = payCardBtn.textContent;
            payCardBtn.disabled = true;
            payCardBtn.textContent = "Verifying card...";
            
            setTimeout(() => {
                const mockTxnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                submitBooking('Creditcard (Simulated)', mockTxnId, activeBookingData);
            }, 1800);
        });
    }

    // Cancel payment action
    const btnCancelPayment = document.getElementById('btn-cancel-payment');
    if (btnCancelPayment) {
        btnCancelPayment.addEventListener('click', () => {
            stopPromptPaySimulation();
            const paymentStep = document.getElementById('payment-step');
            if (paymentStep) paymentStep.style.display = 'none';
            if (rentalForm) rentalForm.style.display = 'block';
            
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    function startPromptPaySimulation(bookingData) {
        stopPromptPaySimulation();

        const timerDisplay = document.getElementById('pp-timer');
        const statusOverlay = document.getElementById('qr-status-overlay');
        const statusText = document.getElementById('qr-status-text');
        const statusMsg = document.getElementById('pp-status-msg');

        if (statusOverlay) statusOverlay.style.display = 'none';
        if (statusMsg) {
            statusMsg.innerHTML = '<span class="pp-pulse"></span> Waiting for scan by your banking app...';
        }

        let timeLeft = 5 * 60;
        if (timerDisplay) {
            timerDisplay.textContent = '05:00';
        }

        promptPayTimerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(promptPayTimerInterval);
                if (timerDisplay) timerDisplay.textContent = '00:00';
                alert('De betalingstijd is verstreken. Genereer een nieuwe QR-code.');
                return;
            }
            const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const secs = (timeLeft % 60).toString().padStart(2, '0');
            if (timerDisplay) {
                timerDisplay.textContent = `${mins}:${secs}`;
            }
        }, 1000);

        // Simulation Timeline:
        // After 1.5s, simulate scan detected
        promptPaySimTimeout1 = setTimeout(() => {
            if (statusOverlay) {
                statusOverlay.style.display = 'flex';
            }
            if (statusText) {
                statusText.textContent = "Payment received! Verifying...";
            }
            if (statusMsg) {
                statusMsg.textContent = "Payment received. Transaction is processing...";
            }

            // After 3.0s total, verify success & submit
            promptPaySimTimeout2 = setTimeout(() => {
                if (statusText) {
                    statusText.textContent = "Verification successful! Processing booking...";
                }
                const mockTxnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                submitBooking('PromptPay (Simulated)', mockTxnId, bookingData);
            }, 1500);

        }, 1500);
    }

    function stopPromptPaySimulation() {
        if (promptPayTimerInterval) clearInterval(promptPayTimerInterval);
        if (promptPaySimTimeout1) clearTimeout(promptPaySimTimeout1);
        if (promptPaySimTimeout2) clearTimeout(promptPaySimTimeout2);
    }

    // New Booking action
    if (btnNewBooking) {
        btnNewBooking.addEventListener('click', () => {
            // Reset wizard
            if (successCard) successCard.style.display = 'none';
            if (rentalForm) {
                rentalForm.reset();
                rentalForm.style.display = 'block';
            }
            if (receiptBox) receiptBox.style.display = 'block';
            
            // Reset payment step states
            const paymentStep = document.getElementById('payment-step');
            if (paymentStep) paymentStep.style.display = 'none';
            
            const receiptPaidStamp = document.getElementById('receipt-paid-stamp');
            if (receiptPaidStamp) receiptPaidStamp.classList.remove('visible');
            
            stopPromptPaySimulation();
            activeBookingData = null;
            
            // Clear payment inputs
            if (cardNumInput) cardNumInput.value = '';
            if (cardHolderInput) cardHolderInput.value = '';
            if (cardExpiryInput) cardExpiryInput.value = '';
            if (cardCvvInput) cardCvvInput.value = '';
            
            if (cardNumberDisplay) cardNumberDisplay.textContent = '•••• •••• •••• ••••';
            if (cardHolderDisplay) cardHolderDisplay.textContent = 'NAAM KAARTHOUDER';
            if (cardExpiryDisplay) cardExpiryDisplay.textContent = 'MM/JJ';
            if (cardCvvDisplay) cardCvvDisplay.textContent = '•••';
            if (cardBrandLogo) cardBrandLogo.textContent = 'VISA';

            // Clear receipt customer details
            const recClientName = document.getElementById('rec-client-name');
            const recClientEmail = document.getElementById('rec-client-email');
            const recClientTxid = document.getElementById('rec-client-txid');
            const recClientInfo = document.getElementById('receipt-client-info');
            
            if (recClientName) recClientName.textContent = '-';
            if (recClientEmail) recClientEmail.textContent = '-';
            if (recClientTxid) recClientTxid.textContent = '-';
            if (recClientInfo) recClientInfo.style.display = 'none';

            // Recalculate
            if (startDateInput) startDateInput.value = formattedToday;
            if (endDateInput) endDateInput.value = formattedTomorrow;
            if (earbudCountInput) earbudCountInput.value = '1';
            
            updatePricing();
        });
    }

    // Print Invoice Button Listener
    const btnPrintInvoice = document.getElementById('btn-print-invoice');
    if (btnPrintInvoice) {
        btnPrintInvoice.addEventListener('click', () => {
            window.print();
        });
    }

    // Select plan directly from pricing grid
    document.querySelectorAll('.select-plan-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const planDays = parseInt(this.getAttribute('data-days'));
            
            // Adjust form inputs
            const start = new Date();
            const end = new Date();
            end.setDate(start.getDate() + planDays);
            
            if (startDateInput) startDateInput.value = start.toISOString().split('T')[0];
            if (endDateInput) endDateInput.value = end.toISOString().split('T')[0];
            
            updatePricing();
        });
    });

    // Initial pricing computation
    updatePricing();


    /* ==========================================================================
       5. USER TESTIMONIALS SLIDER
       ========================================================================== */
    const testimonials = [
        {
            text: "The W4 Pro earbuds completely transformed my holiday in Pattaya. Instead of staring at my phone, I could look local merchants right in the eye and smile while communicating. The open-ear design is incredibly comfortable and feels super clean and fresh!",
            author: "Mark de Graaf",
            role: "Tourist from Utrecht, Netherlands"
        },
        {
            text: "As an expat living in Jomtien, I thought I knew Pattaya, but this service opened up conversations I could never have before. The W4 Pro translates amazingly fast and the hygienic sealing gave me instant confidence.",
            author: "Sarah Jenkins",
            role: "Expat from the United Kingdom"
        },
        {
            text: "Perfect service! I rented the earbuds with free hotel delivery in Pattaya. They were waiting for me at the reception in airtight packaging. The included 5G SIM card worked immediately. Highly recommended for every traveler!",
            author: "Dieter Meyer",
            role: "Business traveler from Germany"
        }
    ];

    const sliderContainer = document.getElementById('testimonial-slider');
    let currentSlide = 0;

    function buildTestimonials() {
        if (!sliderContainer) return;
        sliderContainer.innerHTML = '';

        testimonials.forEach((test, index) => {
            const card = document.createElement('div');
            card.className = `testimonial-card ${index === 0 ? 'active' : ''}`;
            card.innerHTML = `
                <p class="quote-text">"${test.text}"</p>
                <span class="quote-author">${test.author}</span>
                <span class="quote-role">${test.role}</span>
            `;
            sliderContainer.appendChild(card);
        });

        // Autoplay interval (6 seconds)
        setInterval(() => {
            const cards = sliderContainer.querySelectorAll('.testimonial-card');
            if (cards.length === 0) return;

            cards[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % cards.length;
            cards[currentSlide].classList.add('active');
        }, 6000);
    }

    buildTestimonials();


    /* ==========================================================================
       6. INTERACTIVE FAQ ACCORDION
       ========================================================================== */
    const faqs = [
        {
            q: "How does the rental service work in practice?",
            a: "It's very simple! You reserve the earbuds in advance via our platform. You can pick up the sets at our main office on Beach Road in Pattaya, or choose <strong>free delivery directly to your hotel or resort in Pattaya</strong>. For return, simply choose the location that suits you best."
        },
        {
            q: "Are the rented earbuds really hygienic and clean?",
            a: "Absolutely! Hygiene is our highest priority. Our True Time Thai W4 Pro earbuds feature a modern <strong>open-ear design</strong> that rests on the outer ear and does not enter the ear canal. After each use, the earbuds undergo an intensive cleaning cycle: cleaning with alcohol-free medical disinfectant wipes, <strong>sterilization in UV-C chambers</strong>, battery checks, and airtight sealing. You break the hygienic seal yourself."
        },
        {
            q: "Which languages are supported by the True Time Thai W4 Pro / Wifi Pro?",
            a: "The earbuds support real-time, bidirectional AI translation in <strong>102 languages and 14 different English accents</strong> (including British, American, Australian, Indian, and also Thai English / Tinglish). This allows you to speak in your own language (such as Dutch, German, or English) and your Thai conversation partner will hear Thai immediately, and vice versa!"
        },
        {
            q: "Do I need internet for the translations in Pattaya?",
            a: "Yes, for the most accurate, advanced AI translations, an internet connection is required. We highly recommend selecting our <strong>5G local SIM card option</strong> when booking (only ฿350 / €10 flat). This gives you unlimited high-speed data on your smartphone, enabling the Timekettle app to function flawlessly anywhere in Pattaya, both online and offline."
        },
        {
            q: "What happens if I damage or lose the earbuds?",
            a: "We understand that accidents can happen while traveling. Upon pickup, we verify your credit card. We offer an optional damage coverage for ฿50 per day, which fully covers you against accidental physical damage, water damage, or theft (with police report). Without insurance, the fee for loss or irreparable damage is a maximum of ฿4,500 per earbud."
        }
    ];

    const faqAccordionBox = document.getElementById('faq-accordion-box');

    function buildFaqs() {
        if (!faqAccordionBox) return;
        faqAccordionBox.innerHTML = '';

        faqs.forEach((faq, index) => {
            const item = document.createElement('div');
            item.className = 'faq-item glass';
            
            item.innerHTML = `
                <button class="faq-question" id="faq-q-${index}">${faq.q}</button>
                <div class="faq-answer" id="faq-a-${index}">
                    <div class="faq-answer-inner">${faq.a}</div>
                </div>
            `;
            
            faqAccordionBox.appendChild(item);

            // Accordion expand/collapse click logic
            const questionBtn = item.querySelector('.faq-question');
            const answerDiv = item.querySelector('.faq-answer');

            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other FAQ items
                faqAccordionBox.querySelectorAll('.faq-item').forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                });

                if (!isActive) {
                    item.classList.add('active');
                    answerDiv.style.maxHeight = answerDiv.scrollHeight + 'px';
                }
            });
        });
    }

    buildFaqs();


    /* ==========================================================================
       7. CONTACT FORM SUBMISSION
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');
    const contactSuccessMsg = document.getElementById('contact-success-msg');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contact-name') ? document.getElementById('contact-name').value : '';
            const email = document.getElementById('contact-email') ? document.getElementById('contact-email').value : '';
            const msg = document.getElementById('contact-msg') ? document.getElementById('contact-msg').value : '';
            
            const submitBtn = document.getElementById('btn-submit-contact');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Verstuur Bericht';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Verzenden...";
                submitBtn.style.opacity = '0.7';
            }
            
            const formData = {
                _subject: `✉️ Nieuw Contactbericht van ${name} - True Time Thai`,
                _replyto: email,
                Naam: name,
                E_mailadres: email,
                Bericht: msg
            };
            
            fetch("https://formsubmit.co/ajax/info@truetimethai.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network error while sending contact message");
                }
                return response.json();
            })
            .then(data => {
                if (contactSuccessMsg) {
                    contactSuccessMsg.style.display = 'block';
                    contactForm.reset();
                    
                    setTimeout(() => {
                        contactSuccessMsg.style.display = 'none';
                    }, 8000);
                }
            })
            .catch(error => {
                console.error("Contact sending error:", error);
                alert("Unfortunately, something went wrong while sending your message. Please check your internet connection or try again later.");
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    submitBtn.style.opacity = '1';
                }
            });
        });
    }

    /* ==========================================================================
       8. POLAROID STACK SHUFFLE EFFECT (HERO DECK) - DYNAMIC & ROBUST
       ========================================================================== */
    const initPolaroidStack = () => {
        const stack = document.getElementById('polaroid-deck');
        if (!stack) return;

        // Dynamically fetch all cards inside the deck
        let cards = Array.from(stack.querySelectorAll('.experience-visual-card'));
        if (cards.length === 0) return;

        let isShuffling = false;

        // Apply initial layout organically
        const applyInitialLayout = () => {
            const angles = [12, -8, 4, -6, 9];
            cards.forEach((card, index) => {
                const angle = angles[index % angles.length];
                card.style.transform = `rotate(${angle}deg)`;
                card.style.zIndex = (cards.length - index).toString();
            });
        };

        applyInitialLayout();

        const shuffle = () => {
            if (isShuffling || cards.length < 2) return;
            isShuffling = true;

            const isMobile = window.innerWidth <= 992;
            const topCard = cards[0];

            topCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
            topCard.style.transform = isMobile 
                ? 'translateY(-105%) rotate(15deg)' 
                : 'translateX(115%) rotate(25deg)';

            setTimeout(() => {
                cards.shift();
                cards.push(topCard);

                // Reset z-indexes dynamically
                cards.forEach((card, index) => {
                    card.style.zIndex = (cards.length - index).toString();
                });

                // Set new dynamic angles
                cards.forEach((card, index) => {
                    if (index === cards.length - 1) {
                        const bottomTilt = Math.floor(Math.random() * 8) - 12; // -12deg to -4deg
                        topCard.style.transform = isMobile 
                            ? `translateY(0) rotate(${bottomTilt}deg)` 
                            : `translateX(0) rotate(${bottomTilt}deg)`;
                    } else {
                        const tilt = Math.floor(Math.random() * 8) - 4; // -4deg to 4deg
                        card.style.transform = `rotate(${tilt}deg)`;
                    }
                });

                setTimeout(() => {
                    isShuffling = false;
                }, 400);
            }, 250);
        };

        stack.addEventListener('mouseenter', shuffle);
        stack.addEventListener('click', shuffle);
    };

    /* ==========================================================================
       9. FIXED HEADER SCROLL TRANSITION (DYNAMIC COLLAPSE)
       ========================================================================== */
    const initHeaderScroll = () => {
        const header = document.querySelector('.app-header');
        if (!header) return;
        
        const handleScroll = () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        // Run immediately to capture initial page scroll state
        handleScroll();
    };

    /* ==========================================================================
       10. HYGIENE POLAROID STACK SHUFFLE EFFECT (CAROUSEL) - DYNAMIC & ROBUST
       ========================================================================== */
    const initHygienePolaroidStack = () => {
        const stack = document.getElementById('hygiene-polaroid-deck');
        if (!stack) return;

        // Dynamically query all cards under the hygiene deck
        let cards = Array.from(stack.querySelectorAll('.hygiene-polaroid'));
        if (cards.length === 0) return;

        let isShuffling = false;

        // Highly persuasive & promotional text content for each category
        const hygieneContent = {
            "1": {
                title: "100% Freedom & Natural Sound",
                text: "Experience the ultimate revolution in audio convenience under the Thai sun. Because our earbuds float <em>above</em> your ear canal instead of inside it, you can enjoy your favorite music or real-time translations without sweat buildup or pressure. Ideal for active beach days in Jomtien and walks through Pattaya!"
            },
            "2": {
                title: "Precise Manual Cleaning",
                text: "In addition to our machine sterilization, all W4 Pros undergo an extensive manual cleaning process. Our trained specialists disinfect every corner, crevice, and contact point with biodegradable, alcohol-free medical wipes certified specifically for audio equipment. Guaranteed lint- and bacteria-free!"
            },
            "3": {
                title: "Medical UV-C Light Disinfection",
                text: "Safety is our absolute priority at True Time Thai. Every earbud set and charging case undergoes an intensive sterilization cycle in our industrial UV-C light chambers. Within minutes, 99.9% of all bacteria, viruses, and microorganisms are completely eliminated. This ensures you a clinically clean start!"
            },
            "4": {
                title: "Ergonomics That Feel Like Air",
                text: "Thanks to the flexible, lightweight earhook shape, the W4 Pro earbuds adapt immediately and naturally to the anatomy of your ear. You'll quickly forget you're wearing them! Moreover, the open-ear design still allows you to hear the ambient sounds around you, ensuring maximum safety in Pattaya's busy traffic."
            },
            "5": {
                title: "Hermetically Sealed for You",
                text: "After the earbuds pass our strict 5-point quality control, they are immediately vacuum-sealed in a biodegradable hygiene packaging. You are the very first to break the seal upon receipt at your resort. 100% guaranteed dust-free, bacteria-free, and fresher than fresh!"
            }
        };

        // Apply organic initial layout
        const applyInitialLayout = () => {
            const angles = [-4, 6, -10, 3, -7];
            cards.forEach((card, index) => {
                const angle = angles[index % angles.length];
                card.style.transform = `rotate(${angle}deg)`;
                card.style.zIndex = (cards.length - index).toString();
            });
        };

        applyInitialLayout();

        // Update the tab and left text area based on card target
        const updateContentAndTabs = (targetNum) => {
            const tabs = stack.parentElement.parentElement.querySelectorAll('.hygiene-tab');
            const contentArea = document.getElementById('hygiene-content-area');
            
            // Set active class
            tabs.forEach(t => {
                if (t.getAttribute('data-target') === targetNum.toString()) {
                    t.classList.add('active');
                } else {
                    t.classList.remove('active');
                }
            });

            // Animate content change
            if (contentArea) {
                contentArea.style.opacity = '0';
                contentArea.style.transition = 'opacity 0.25s ease';
                
                setTimeout(() => {
                    const data = hygieneContent[targetNum];
                    if (data) {
                        contentArea.querySelector('.dynamic-title').innerHTML = data.title;
                        contentArea.querySelector('.dynamic-text').innerHTML = `<p>${data.text}</p>`;
                    }
                    contentArea.style.opacity = '1';
                }, 200);
            }
        };

        // Bring a specific card dynamically to the top of the stack
        const bringToTop = (targetId) => {
            if (isShuffling) return;

            const targetIndex = cards.findIndex(card => card.id === targetId);
            if (targetIndex === -1 || targetIndex === 0) return; // Not found or already on top

            isShuffling = true;

            const isMobile = window.innerWidth <= 992;
            const targetCard = cards[targetIndex];

            // Slide out card smoothly
            targetCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
            targetCard.style.transform = isMobile 
                ? 'translateY(-105%) rotate(15deg)' 
                : 'translateX(115%) rotate(25deg)';

            setTimeout(() => {
                // Remove from current index and insert at front
                cards.splice(targetIndex, 1);
                cards.unshift(targetCard);

                // Reset z-indexes
                cards.forEach((card, index) => {
                    card.style.zIndex = (cards.length - index).toString();
                });

                // Apply new organic angles (make top card straight and focused)
                cards.forEach((card, index) => {
                    if (index === 0) {
                        card.style.transform = 'rotate(0deg) scale(1.03)';
                    } else {
                        const tilt = Math.floor(Math.random() * 12) - 6; // -6deg to 6deg
                        card.style.transform = `rotate(${tilt}deg)`;
                    }
                });

                setTimeout(() => {
                    isShuffling = false;
                }, 400);
            }, 250);
        };

        const shuffle = () => {
            if (isShuffling || cards.length < 2) return;
            isShuffling = true;

            const isMobile = window.innerWidth <= 992;
            const topCard = cards[0];

            topCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
            topCard.style.transform = isMobile 
                ? 'translateY(-105%) rotate(-15deg)' 
                : 'translateX(115%) rotate(15deg)';

            setTimeout(() => {
                cards.shift();
                cards.push(topCard);

                // Reset z-indexes dynamically
                cards.forEach((card, index) => {
                    card.style.zIndex = (cards.length - index).toString();
                });

                // Set new dynamic angles
                cards.forEach((card, index) => {
                    if (index === cards.length - 1) {
                        const bottomTilt = Math.floor(Math.random() * 8) - 10; // -10deg to -2deg
                        topCard.style.transform = isMobile 
                            ? `translateY(0) rotate(${bottomTilt}deg)` 
                            : `translateX(0) rotate(${bottomTilt}deg)`;
                    } else {
                        const tilt = Math.floor(Math.random() * 12) - 6; // -6deg to 6deg
                        card.style.transform = `rotate(${tilt}deg)`;
                    }
                });

                // Sync text and active tab with new top card
                const newTopNum = cards[0].id.replace('hygiene-polaroid-', '');
                updateContentAndTabs(newTopNum);

                setTimeout(() => {
                    isShuffling = false;
                }, 400);
            }, 250);
        };

        // Attach event listeners to tabs
        const tabs = stack.parentElement.parentElement.querySelectorAll('.hygiene-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetNum = e.target.getAttribute('data-target');
                updateContentAndTabs(targetNum);
                bringToTop(`hygiene-polaroid-${targetNum}`);
            });
        });

        stack.addEventListener('mouseenter', shuffle);
        stack.addEventListener('click', shuffle);
    };

    /* ==========================================================================
       11. INTERACTIVE TERMS & CONDITIONS TABS
       ========================================================================== */
    const initTermsTabs = () => {
        const termsNavBtns = document.querySelectorAll('.terms-nav-btn');
        const termsContentPanel = document.getElementById('terms-content-panel');
        if (!termsNavBtns || !termsContentPanel) return;

        const termsData = {
            pickup: {
                title: "1. Pickup & Return of Equipment",
                content: `
                    <p>When booking, you select your desired pickup and return location. We currently offer two convenient options in Pattaya:</p>
                    <ul>
                        <li><strong>Pattaya Beach Road Office:</strong> Open from 08:00 AM to 10:00 PM. Our office is centrally located and easy to reach.</li>
                        <li><strong>Free Hotel Delivery & Return:</strong> We deliver the sealed sets for free to the reception of your hotel or resort in Pattaya (including Jomtien and Naklua). You can simply leave the set at reception upon departure.</li>
                    </ul>
                    <p><em>Please note:</em> The rental period starts on the agreed start date from 08:00 AM and ends on the end date by 10:00 PM at the latest. Late returns without consultation will incur a surcharge of ฿250 per day.</p>
                `
            },
            deposit: {
                title: "2. Deposit, Payment & Identification",
                content: `
                    <p>We prefer clear and simple agreements without unnecessary hassle:</p>
                    <ul>
                        <li><strong>No Cash Deposit:</strong> With verification of a valid credit card (Visa or Mastercard) upon pickup or online booking, <strong>no cash deposit</strong> is required.</li>
                        <li><strong>Alternative Deposit:</strong> Don't have a credit card? No problem! You can also choose to leave a cash deposit of ฿3.000 (€80) per set, or leave a copy of your passport. Cash deposits are returned directly and in full upon return.</li>
                        <li><strong>Payment Methods:</strong> We accept online payments by Credit Card, PromptPay, and cash payments in THB or EUR upon delivery.</li>
                    </ul>
                `
            },
            insurance: {
                title: "3. Damage, Theft & Insurance",
                content: `
                    <p>Of course, something unexpected can always happen while traveling. We offer full transparency regarding damage and loss:</p>
                    <ul>
                        <li><strong>Optional Damage Coverage (+฿50 / €1.35 per day):</strong> This fully covers you (100%) against accidental physical damage, water damage, or theft (with police report). No deductible!</li>
                        <li><strong>Without Insurance:</strong> In case of loss, theft, or irreparable damage to the earbuds, you are liable for the replacement value. This is a maximum of ฿4,500 per earbud or charging case.</li>
                        <li><strong>Normal Wear and Tear:</strong> Small scratches or normal signs of use are covered under our service and will never be charged.</li>
                    </ul>
                `
            },
            cancellation: {
                title: "4. Cancellation, Modification & Extension",
                content: `
                    <p>Plans change, especially while traveling. We are the most flexible partner in Pattaya:</p>
                    <ul>
                        <li><strong>Free Cancellation:</strong> You can cancel your reservation completely free of charge up to 24 hours before the start date. You will receive your deposit back within 3 business days.</li>
                        <li><strong>Modifications:</strong> Want to shift your start date or adjust the pickup location? Just let us know via WhatsApp and we will adjust it for you free of charge.</li>
                        <li><strong>Extension:</strong> Enjoying the translation service so much that you want to keep the earbuds longer? Simply send us a WhatsApp message. If the sets are available, we will extend your contract immediately at the same low daily rate.</li>
                    </ul>
                `
            }
        };

        termsNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                const data = termsData[tabId];
                if (!data) return;

                // Toggle active button class
                termsNavBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Fade out, update content, fade in
                termsContentPanel.style.opacity = '0';
                setTimeout(() => {
                    termsContentPanel.innerHTML = `
                        <div class="terms-tab-panel active">
                            <h3>${data.title}</h3>
                            ${data.content}
                        </div>
                    `;
                    termsContentPanel.style.opacity = '1';
                }, 150);
            });
        });
    };

    // Contact Section Polaroid Carousel
    const initContactCarousel = () => {
        const carousel = document.getElementById('contact-polaroid-carousel');
        if (!carousel) return;

        const slides = carousel.querySelectorAll('.polaroid-slide');
        const prevBtn = document.getElementById('contact-carousel-prev');
        const nextBtn = document.getElementById('contact-carousel-next');
        const dots = document.querySelectorAll('#contact-carousel-dots .carousel-dot');

        if (slides.length <= 1) return;

        let currentIndex = 0;
        let autoPlayTimer = null;
        let isHoverTransitionLocked = false;
        let hoverLockTimeout = null;

        const showSlide = (index) => {
            // Lock hover transitions during any slide change to prevent accidental skips or loops
            isHoverTransitionLocked = true;
            if (hoverLockTimeout) clearTimeout(hoverLockTimeout);
            hoverLockTimeout = setTimeout(() => {
                isHoverTransitionLocked = false;
            }, 800); // 800ms cooldown (matches transition and hygiene stack duration)

            if (index < 0) {
                currentIndex = slides.length - 1;
            } else if (index >= slides.length) {
                currentIndex = 0;
            } else {
                currentIndex = index;
            }

            slides.forEach((slide, i) => {
                if (i === currentIndex) {
                    slide.classList.add('active');
                } else {
                    slide.classList.remove('active');
                }
            });

            dots.forEach((dot, i) => {
                if (i === currentIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };

        const nextSlide = () => {
            showSlide(currentIndex + 1);
        };

        const prevSlide = () => {
            showSlide(currentIndex - 1);
        };

        if (nextBtn) nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });

        if (prevBtn) prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });

        // Click or mouseenter on the Polaroid card itself to go to the next slide
        slides.forEach(slide => {
            const card = slide.querySelector('.polaroid-card');
            if (card) {
                card.addEventListener('click', () => {
                    nextSlide();
                    resetAutoPlay();
                });

                card.addEventListener('mouseenter', () => {
                    if (isHoverTransitionLocked) return;
                    nextSlide();
                    stopAutoPlay();
                });
            }
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                showSlide(index);
                resetAutoPlay();
            });
        });

        const startAutoPlay = () => {
            stopAutoPlay(); // Clean up existing timer first to avoid overlapping intervals
            autoPlayTimer = setInterval(nextSlide, 5000);
        };

        const stopAutoPlay = () => {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        };

        const resetAutoPlay = () => {
            stopAutoPlay();
            startAutoPlay();
        };

        startAutoPlay();

        carousel.addEventListener('mouseleave', () => {
            isHoverTransitionLocked = false;
            startAutoPlay();
        });
    };

    initHeaderScroll();
    initPolaroidStack();
    initHygienePolaroidStack();
    initTermsTabs();
    initContactCarousel();
});


