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
                console.error("Fout bij initialiseren live Supabase client, fallback naar simulatie:", error);
                isSimulated = true;
            }
        } else {
            isSimulated = true;
            console.log("Supabase Anon Key is leeg in app.js. Systeem draait in Simulatiemodus.");
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
                    .from('bookings')
                    .select('*')
                    .not('status', 'in', '("CANCELLED","RETURNED")');
                if (error) {
                    console.error("Error fetching active bookings:", error);
                    return [];
                }
                return data || [];
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
        const earbudCount = parseInt(bookingData.Aantal_Sets_W4_Pro);
        const totalThb = parseInt(bookingData.Totaal_Bedrag_THB.replace(/[^0-9]/g, ''));
        
        const extraSim = bookingData.Inclusief_5G_SIM_Kaart === "Ja (+ ฿350 per stuk)" || bookingData.Inclusief_5G_SIM_Kaart === true;
        const extraPowerbank = bookingData.Inclusief_Powerbank === "Ja (+ ฿175 per stuk)" || bookingData.Inclusief_Powerbank === true;

        const record = {
            customer_name: bookingData.Naam,
            customer_email: bookingData.E_mailadres,
            start_date: bookingData.Startdatum,
            end_date: bookingData.Einddatum,
            earbud_count: earbudCount,
            pickup_location: bookingData.Ophaal_en_Inleverlocatie,
            extra_sim: extraSim,
            extra_powerbank: extraPowerbank,
            total_price_thb: totalThb,
            payment_method: paymentMethod,
            payment_status: "BETAALD",
            transaction_id: txnId,
            status: "CONFIRMED"
        };

        if (isSimulated) {
            const bookingsStr = localStorage.getItem('ttt_bookings') || '[]';
            const bookings = JSON.parse(bookingsStr);
            record.id = 'b_' + Math.random().toString(36).substr(2, 9);
            record.created_at = new Date().toISOString();
            bookings.push(record);
            localStorage.setItem('ttt_bookings', JSON.stringify(bookings));
            console.log("Booking saved to localStorage simulation:", record);
            return record.id;
        } else {
            try {
                const { data, error } = await supabaseClient
                    .from('bookings')
                    .insert([record])
                    .select();
                
                if (error) {
                    throw error;
                }
                console.log("Booking saved to Supabase live:", data);
                return data && data[0] ? data[0].id : txnId;
            } catch (error) {
                console.error("Fout bij opslaan in Supabase database:", error);
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
            if (availText) availText.textContent = "Voer datums in om de voorraad te controleren...";
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
            if (availText) availText.textContent = "Voer een geldige huurperiode in...";
            if (availDot) {
                availDot.className = "availability-dot";
                availDot.style.backgroundColor = "#ccc";
            }
            if (submitBtn) submitBtn.disabled = true;
            return;
        }

        if (availText) availText.textContent = "Beschikbaarheid controleren...";
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
                    availText.textContent = `✓ ${available} sets beschikbaar in deze periode.`;
                }
                if (submitBtn) submitBtn.disabled = false;
            } else {
                if (availDot) {
                    availDot.className = "availability-dot bg-red";
                    availDot.style.backgroundColor = "";
                }
                if (availText) {
                    if (available <= 0) {
                        availText.textContent = `✗ Uitverkocht! Geen sets beschikbaar van ${formatDateString(startDate)} t/m ${formatDateString(endDate)}.`;
                    } else {
                        availText.textContent = `✗ Onvoldoende voorraad! Nog slechts ${available} set(s) beschikbaar.`;
                    }
                }
                if (submitBtn) submitBtn.disabled = true;
            }
        } catch (error) {
            console.error("Fout bij controleren beschikbaarheid:", error);
            if (availDot) {
                availDot.className = "availability-dot bg-green";
            }
            if (availText) {
                availText.textContent = "✓ Beschikbaarheid gecontroleerd (Simulatie)";
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
            title: "Gesprek op de Lanpho Naklua Markt",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Hallo! Hoeveel kosten deze tijgergarnalen per kilo?",
                        translation: "สวัสดีครับ กุ้งลายเสือพวกนี้กิโลละเท่าไหร่ครับ (Sawatdee krap, kung lai suea puak nee kilo la tao rai krap?)"
                    },
                    local: {
                        name: "P'Som (Vishandelaar)",
                        text: "สวัสดีจ้า! กิโลละ 450 บาทจ้า ลดได้นิดหน่อยนะจ๊ะ เอาเท่าไหร่ดีจ๊ะ",
                        translation: "Hallo! Ze kosten 450 Baht per kilo. Ik kan een beetje korting geven. Hoeveel wil je hebben?"
                    },
                    choices: [
                        { text: "Vraag om korting (2 kilo voor 800 Baht)", nextNode: "negotiate_discount" },
                        { text: "Ga akkoord met de prijs (1 kilo)", nextNode: "agree_price" }
                    ]
                },
                negotiate_discount: {
                    tourist: {
                        text: "Ik wil graag twee kilo hebben. Kunnen we er 800 Baht van maken voor twee kilo?",
                        translation: "ขอสองกิโลครับ ลดเหลือแปดร้อยบาทได้ไหมครับ (Kor song kilo krap. Lod luea paed roy baht dai mai krap?)"
                    },
                    local: {
                        name: "P'Som (Vishandelaar)",
                        text: "โอเคจ้า คนหล่อ! ได้จ้า สองกิโล 800 บาท เดี๋ยวป้าแถมหอยแมลงภู่ให้ด้วยจ้า",
                        translation: "Oké knappe man! Dat is goed, twee kilo voor 800 Baht. Ik doe er gratis wat mosselen bij!"
                    },
                    choices: [
                        { text: "Bedank haar vriendelijk", nextNode: "thanks_happy" }
                    ]
                },
                agree_price: {
                    tourist: {
                        text: "Dat is een prima prijs. Ik neem één kilo van je over.",
                        translation: "ราคาดีครับ เอาหนึ่งกิโลครับ (Racha dee krap. Ao nueng kilo krap.)"
                    },
                    local: {
                        name: "P'Som (Vishandelaar)",
                        text: "ได้เลยจ้า! เดี๋ยวป้าเลือกตัวโตๆ ให้เลยนะจ๊ะ รอสักครู่จ้า",
                        translation: "Natuurlijk! Ik zal een paar mooie grote voor je uitkiezen. Een momentje geduld alstublieft."
                    },
                    choices: [
                        { text: "Bedank haar", nextNode: "thanks_happy" }
                    ]
                },
                thanks_happy: {
                    tourist: {
                        text: "Geweldig! Heel erg bedankt voor de uitstekende service!",
                        translation: "เยี่ยมเลยครับ ขอบคุณมากสำหรับบริการที่ดีเยี่ยมนะครับ (Yiem loey krap! Khop khun mak sam-rab bo-ri-kan tee dee yiem na krap.)"
                    },
                    local: {
                        name: "P'Som (Vishandelaar)",
                        text: "ยินดีมากจ้า เที่ยวพัทยาให้สนุกนะจ๊ะ! (Yindee mak ja, thiew Pattaya hai sanook na ja!)",
                        translation: "Heel graag gedaan, veel plezier in Pattaya!"
                    },
                    choices: [] // End node
                }
            }
        },
        taxi: {
            title: "Songthaew Rit naar Walking Street",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Goedenavond, gaat u naar Walking Street?",
                        translation: "สวัสดีครับ ไปถนนคนเดินวอคกิ้งสตรีทไหมครับ (Sawatdee krap, pai tha-non khon dern Walking Street mai krap?)"
                    },
                    local: {
                        name: "Looong (Chauffeur)",
                        text: "ไปครับ ขึ้นมาเลยครับ คนละ 20 บาทครับผม",
                        translation: "Ja, ik ga! Stap maar in, het is 20 Baht per persoon."
                    },
                    choices: [
                        { text: "Stap in voor 20 Baht per persoon", nextNode: "taxi_standard" },
                        { text: "Vraag om direct bij de ingang afgezet te worden (4 personen)", nextNode: "taxi_direct" }
                    ]
                },
                taxi_standard: {
                    tourist: {
                        text: "Perfect, we stappen in. 20 Baht is prima.",
                        translation: "ตกลงครับ ขึ้นรถเลย คนละยี่สิบบาทครับ (Tok-long krap, khuen rot loey, khon la yee-sip baht krap.)"
                    },
                    local: {
                        name: "Looong (Chauffeur)",
                        text: "ดีครับ! เดี๋ยวผ่านถนนเลียบหาดแล้วจะจอดส่งที่สี่แยกข้างหน้านะครับ",
                        translation: "Mooi! We rijden langs Beach Road en ik zet je af bij de kruising hier vlakbij."
                    },
                    choices: [
                        { text: "Bedank hem bij aankomst", nextNode: "taxi_arrive" }
                    ]
                },
                taxi_direct: {
                    tourist: {
                        text: "Wacht, kunt u ons rechtstreeks bij de ingang afzetten? We zijn met 4 personen.",
                        translation: "เดี๋ยวครับ ช่วยไปส่งที่หน้าทางเข้าเลยได้ไหมครับ พวกเรามีกันสี่คน (Diew krap, chuay pai song tee nah tang khao loey dai mai krap? Puak rao mee kan see khon.)"
                    },
                    local: {
                        name: "Looong (Chauffeur)",
                        text: "ถ้าเหมาไปส่งข้างหน้าเลย คิดเหมา 150 บาทละกันครับ สะดวกกว่า ไม่ต้องเดินไกล",
                        translation: "Als je de hele bus huurt om direct voor de ingang afgezet te worden, reken ik 150 Baht in totaal. Dat is comfortabeler en scheelt lopen."
                    },
                    choices: [
                        { text: "Accepteer 150 Baht voor directe rit", nextNode: "taxi_direct_accept" },
                        { text: "Rijd toch mee voor 20 Baht p.p.", nextNode: "taxi_standard" }
                    ]
                },
                taxi_direct_accept: {
                    tourist: {
                        text: "150 Baht is perfect. Laten we gaan. Dank u wel!",
                        translation: "ร้อยห้าสิบบาทตกลงครับ ไปกันเลย ขอบคุณครับ (Roy ha-sip baht tok-long krap. Pai kan loey. Khop khun krap!)"
                    },
                    local: {
                        name: "Looong (Chauffeur)",
                        text: "ได้เลยครับ! นั่งให้สบายเลย เดี๋ยวซิ่งไปส่งให้ถึงที่เลยครับ",
                        translation: "Geen probleem! Ga lekker zitten, ik breng je er direct naartoe."
                    },
                    choices: [
                        { text: "Bedank hem bij aankomst", nextNode: "taxi_arrive" }
                    ]
                },
                taxi_arrive: {
                    tourist: {
                        text: "We zijn er! Dank u wel voor de veilige rit.",
                        translation: "ถึงแล้วครับ ขอบคุณที่ขับรถมาส่งอย่างปลอดภัยนะครับ (Thueng laew krap. Khop khun tee khap rot ma song yangปลอดภัย na krap.)"
                    },
                    local: {
                        name: "Looong (Chauffeur)",
                        text: "เที่ยวให้สนุกนะครับ โชคดีครับ! (Thiew hai sanook na krap. Chok dee krap!)",
                        translation: "Veel plezier daar en succes!"
                    },
                    choices: []
                }
            }
        },
        resort: {
            title: "Inchecken bij Jomtien Bay Resort",
            startNode: "greet",
            nodes: {
                greet: {
                    tourist: {
                        text: "Hallo, ik wil graag inchecken. Mijn reservering staat op naam van Matthijs.",
                        translation: "สวัสดีครับ ขอเช็คอินครับ จองไว้ในชื่อ แมทธิว ครับ (Sawatdee krap, kor check-in krap. Jong wai nai chue Matthieu krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "สวัสดีค่ะ ยินดีต้อนรับค่ะ ขอเอกสารยืนยันการจองกับพาสปอร์ตด้วยนะคะ",
                        translation: "Hallo, welkom! Mag ik uw boekingsbevestiging en uw paspoort alstublieft?"
                    },
                    choices: [
                        { text: "Overhandig paspoort & Boekingsbewijs", nextNode: "docs_provided" }
                    ]
                },
                docs_provided: {
                    tourist: {
                        text: "Alstublieft. Hier zijn mijn paspoort en boekingsbewijs.",
                        translation: "นี่ครับ พาสปอร์ตกับใบจองครับ (Nee krap, passport kab bai jong krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ขอบคุณค่ะ จองห้องดีลักซ์ไว้ 5 คืนนะคะ รบกวนสอบถามว่าต้องการถามข้อมูลเพิ่มเติมเกี่ยวกับการเข้าพักไหมคะ",
                        translation: "Dank u wel. U heeft een Deluxe kamer geboekt voor 5 nachten. Wilt u nog specifieke informatie over uw verblijf?"
                    },
                    choices: [
                        { text: "Vraag naar ontbijt & Openingstijden zwembad", nextNode: "pool_breakfast" },
                        { text: "Vraag naar wifi-code & Borgsom", nextNode: "wifi_deposit" }
                    ]
                },
                pool_breakfast: {
                    tourist: {
                        text: "Is het ontbijt inbegrepen en hoe laat is het zwembad geopend?",
                        translation: "รวมอาหารเช้าด้วยไหมครับ แล้วสระว่ายน้ำเปิดถึงกี่โมงครับ (Ruam ar-han chao duay mai krap? Laew sa-wai-nam perd tueng kee mong krap?)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "รวมอาหารเช้าเรียบร้อยค่ะ ทานได้ที่ห้องอาหารชั้นหนึ่ง ส่วนสระว่ายน้ำเปิดเจ็ดโมงเช้าถึงสี่ทุ่มค่ะ",
                        translation: "Ja, ontbijt is inbegrepen en wordt geserveerd in het restaurant op de eerste verdieping. Het zwembad is open van 07:00 tot 22:00 uur."
                    },
                    choices: [
                        { text: "Rond check-in af", nextNode: "checkin_done" }
                    ]
                },
                wifi_deposit: {
                    tourist: {
                        text: "Wat is de wifi-code en hoe zit het met de borgsom?",
                        translation: "รหัสไวไฟอะไรครับ แล้วต้องวางเงินมัดจำเท่าไหร่ครับ (Rahat wifi arai krap? Laew tong wang ngoen mat-jam tao rai krap?)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ไวไฟใช้ได้ฟรีทั่วทั้งรีสอร์ทค่ะ รหัสอยู่บนซองคีย์การ์ด ส่วนมัดจำคีย์การ์ด 1,000 บาทหรือสแกนบัตรเครดิตค่ะ",
                        translation: "Wifi is gratis in het hele resort, de code staat op uw sleutelkaart-envelop. De borg is 1.000 Baht in contanten of een creditcard-afdruk."
                    },
                    choices: [
                        { text: "Rond check-in af", nextNode: "checkin_done" }
                    ]
                },
                checkin_done: {
                    tourist: {
                        text: "Fantastisch. Hartelijk dank voor de heldere uitleg en de sleutels.",
                        translation: "ยอดเยี่ยมมาก ขอบคุณมากสำหรับคำอธิบายที่ชัดเจนและคีย์การ์ดนะครับ (Yod-yiem mak. Khop khun mak sam-rab kam ar-thi-bay tee chad-jen laew kab keycard na krap.)"
                    },
                    local: {
                        name: "Kwan (Receptionist)",
                        text: "ยินดีค่ะ นี่ค่ะคีย์การ์ดห้อง 402 ขอให้พักผ่อนอย่างมีความสุขนะคะ! (Yindee ka. Nee ka keycard hong see-roy-song. Kor hai pak-phon yang mee khwam sook na ka!)",
                        translation: "Graag gedaan! Hier is uw sleutelkaart voor kamer 402. Een heel fijn verblijf gewenst!"
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
                btnSimSound.title = "Geluid Dempen";
            } else {
                simSoundIcon.textContent = "🔇";
                btnSimSound.title = "Geluid Inschakelen";
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
            if (simAiStatusText) simAiStatusText.textContent = "U praat in het Nederlands...";
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
                <div class="msg-meta">Jij (Toerist)</div>
                <div class="msg-text">${node.tourist.text} <button class="btn-replay-speech btn-speak-main" title="Beluister origineel" type="button">🔊</button></div>
                <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="Beluister vertaling" type="button">🔊</button> Vertaling: "${node.tourist.translation}"</div>
            `;
            
            // Register Speech Replay button clicks
            touristBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                e.stopPropagation();
                speakText(node.tourist.text, 'nl');
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

            // Speak tourist voice in Dutch, then wait for it to end
            speakText(node.tourist.text, 'nl', () => {
                // Tourist finished speaking. Wait 1.5s (natural pause) before starting local response
                setTimeout(() => {
                    if (simAiStatusText) simAiStatusText.textContent = "Lokale gesprekspartner antwoordt...";
                    if (simAiStatus) simAiStatus.style.display = 'flex';
                    
                    // 1.5s delay for Local response translation processing
                    setTimeout(() => {
                        // Append Local speech bubble
                        const localBubble = document.createElement('div');
                        localBubble.className = "msg-bubble glass msg-local";
                        localBubble.innerHTML = `
                            <div class="msg-meta">${node.local.name}</div>
                            <div class="msg-text">${node.local.text} <button class="btn-replay-speech btn-speak-main" title="Beluister origineel" type="button">🔊</button></div>
                            <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="Beluister vertaling" type="button">🔊</button> Vertaling: "${node.local.translation}"</div>
                        `;

                        // Register Speech Replays for Local
                        localBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.text, 'th');
                        });
                        localBubble.querySelector('.btn-speak-trans').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.translation, 'nl');
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
            if (recDuration) recDuration.textContent = 'Selecteer datums';
            if (recItemsList) {
                recItemsList.innerHTML = `
                    <div class="receipt-row-item text-muted">
                        <span>Voer geldige huurperiode in</span>
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
        if (recDuration) recDuration.textContent = `${days} ${days === 1 ? 'dag' : 'dagen'}`;

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
                    <span>Huur W4 Pro (${quantity}x set, ${days}d à ฿250):</span>
                    <span>฿${rawRentalTotal}</span>
                </div>
            `;

            if (hasSim) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>5G SIM-kaart (${quantity}x flat):</span>
                        <span>฿${simCost}</span>
                    </div>
                `;
            }

            if (hasPowerbank) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>Premium Powerbank (${quantity}x flat):</span>
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
            const pickupLoc = pickupLocSelect ? pickupLocSelect.options[pickupLocSelect.selectedIndex].text : '';
            
            const hasSim = document.getElementById('extra-sim') ? document.getElementById('extra-sim').checked : false;
            const hasPowerbank = document.getElementById('extra-powerbank') ? document.getElementById('extra-powerbank').checked : false;
            
            // Read calculated totals from receipt DOM elements
            const durationText = document.getElementById('rec-duration') ? document.getElementById('rec-duration').textContent : '';
            const totalThb = document.getElementById('rec-total-thb') ? document.getElementById('rec-total-thb').textContent : '';
            const totalEur = document.getElementById('rec-total-eur') ? document.getElementById('rec-total-eur').textContent : '';
            
            // Store active data for payment steps
            activeBookingData = {
                Naam: name,
                E_mailadres: email,
                Startdatum: startDate,
                Einddatum: endDate,
                Aantal_Sets_W4_Pro: earbudCount,
                Ophaal_en_Inleverlocatie: pickupLoc,
                Inclusief_5G_SIM_Kaart: hasSim ? "Ja (+ ฿350 per stuk)" : "Nee",
                Inclusief_Powerbank: hasPowerbank ? "Ja (+ ฿175 per stuk)" : "Nee",
                Huurperiode: durationText,
                Totaal_Bedrag_THB: totalThb,
                Totaal_Bedrag_EUR: totalEur
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
            payCardBtn.textContent = "Verwerken...";
        }
        if (cancelBtn) cancelBtn.disabled = true;

        // Save to database first
        saveBookingToDatabase(paymentMethod, txnId, bookingData)
            .then(dbId => {
                const finalFormData = {
                    ...bookingData,
                    _subject: `🎉 Betaalde Boeking van ${bookingData.Naam} (${paymentMethod})`,
                    _replyto: bookingData.E_mailadres,
                    Betalingsstatus: `BETAALD via ${paymentMethod}`,
                    Transactie_ID: txnId,
                    Betalingskenmerk: `True Time Thai Pattaya - ${txnId}`,
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
                    throw new Error("Netwerkfout bij verzenden van betalingsbevestiging");
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
                if (successEmailSpan) successEmailSpan.textContent = bookingData.E_mailadres;
                if (successTxnSpan) successTxnSpan.textContent = txnId;

                // Populate receipt customer details
                const recClientName = document.getElementById('rec-client-name');
                const recClientEmail = document.getElementById('rec-client-email');
                const recClientTxid = document.getElementById('rec-client-txid');
                const recClientInfo = document.getElementById('receipt-client-info');

                if (recClientName) recClientName.textContent = bookingData.Naam;
                if (recClientEmail) recClientEmail.textContent = bookingData.E_mailadres;
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
                console.error("Fout bij afhandelen boeking:", error);
                alert("Er is helaas een fout opgetreden bij het registreren van uw betaling. Neem direct contact op via WhatsApp met transactie-ID: " + txnId);
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
                alert("Voer een geldig creditcardnummer in.");
                return;
            }
            if (cardHolder.length === 0) {
                alert("Voer de naam van de kaarthouder in.");
                return;
            }
            if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                alert("Voer een geldige vervaldatum in (MM/JJ).");
                return;
            }
            if (cardCvv.length < 3) {
                alert("Voer een geldige CVV code in.");
                return;
            }

            // Simulate card validation
            const originalText = payCardBtn.textContent;
            payCardBtn.disabled = true;
            payCardBtn.textContent = "Kaart verifiëren...";
            
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
            statusMsg.innerHTML = '<span class="pp-pulse"></span> Wachten op scan door uw bankieren-app...';
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
                statusText.textContent = "Betaling ontvangen! Verifiëren...";
            }
            if (statusMsg) {
                statusMsg.textContent = "Betaling ontvangen. Transactie wordt verwerkt...";
            }

            // After 3.0s total, verify success & submit
            promptPaySimTimeout2 = setTimeout(() => {
                if (statusText) {
                    statusText.textContent = "Verificatie succesvol! Boeking verwerken...";
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
            text: "De W4 Pro oordopjes veranderden mijn vakantie in Pattaya volledig. In plaats van staren naar mijn telefoon kon ik visboeren recht in de ogen kijken en lachen terwijl we onderhandelden. Het open-oor ontwerp zit heerlijk en voelt super fris en schoon aan!",
            author: "Mark de Graaf",
            role: "Toerist uit Utrecht, Nederland"
        },
        {
            text: "Als expat die in Jomtien woont, dacht ik dat ik Pattaya wel kende, maar deze service gaf me toegang tot gesprekken die ik nooit eerder kon voeren. De W4 Pro vertaalt verbazingwekkend snel en de hygiëneverzegeling gaf me direct vertrouwen.",
            author: "Sarah Jenkins",
            role: "Expat uit het Verenigd Koninkrijk"
        },
        {
            text: "Perfecte service! Ik had de oordopjes gehuurd met gratis hotelbezorging in Pattaya. Ze lagen keurig op me te wachten bij de receptie in een luchtdichte verpakking. De meegeleverde 5G simkaart werkte direct. Absolute aanrader voor iedere reiziger!",
            author: "Dieter Meyer",
            role: "Zakenreiziger uit Duitsland"
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
            q: "Hoe werkt de huurservice in de praktijk?",
            a: "Het is heel eenvoudig! U reserveert de oordopjes vooraf via ons platform. U kunt de sets ophalen op ons hoofdkantoor aan Beach Road in Pattaya, of u kiest voor <strong>gratis bezorging direct bij uw hotel of resort in Pattaya</strong>. Bij het inleveren kiest u simpelweg weer de locatie die u het beste uitkomt."
        },
        {
            q: "Zijn de gehuurde oordopjes wel echt hygiënisch en schoon?",
            a: "Absoluut! Hygiëne is onze hoogste prioriteit. Onze True Time Thai W4 Pro oordopjes hebben een modern <strong>open-oor ontwerp</strong> dat op de oorschelp rust en het gehoorkanaal niet binnendringt. Na elk gebruik ondergaan de oordopjes een intensieve reinigingscyclus: reiniging met alcoholvrije medische desinfectiedoekjes, <strong>sterilisatie in UV-C kamers</strong>, batterijcontrole en luchtdichte verzegeling. U verbreekt zelf de hygiëneverzegeling."
        },
        {
            q: "Welke talen worden ondersteund door de True Time Thai W4 Pro / Wifi Pro?",
            a: "De oordopjes ondersteunen real-time, bidirectionele AI-vertaling in <strong>102 talen en 14 verschillende Engelse accenten</strong> (inclusief Brits, Amerikaans, Australisch, Indiaas en tevens Thai English / Tinglish). Hierdoor kunt u spreken in uw eigen taal (zoals Nederlands, Duits of Engels) en hoort uw Thaise gesprekspartner direct Thais, en omgekeerd!"
        },
        {
            q: "Heb ik internet nodig voor de vertalingen in Pattaya?",
            a: "Ja, voor de meest nauwkeurige, geavanceerde AI-vertalingen is een internetverbinding vereist. We raden sterk aan om bij het boeken onze <strong>5G lokale SIM-kaart optie</strong> te selecteren (slechts ฿350 / €10flat). Hiermee heeft u onbeperkt high-speed data op uw smartphone waarmee de Timekettle-app vlekkeloos en overal in Pattaya offline en online functioneert."
        },
        {
            q: "Wat gebeurt er als ik de oordopjes beschadig of verlies?",
            a: "We begrijpen dat er tijdens het reizen ongelukjes kunnen gebeuren. Bij het ophalen verifiëren we uw creditcard. We bieden een optionele schadeverzekering voor ฿50 per dag aan waarmee u volledig bent gedekt tegen onopzettelijke schade of diefstal (met politierapport). Zonder verzekering zijn de kosten bij verlies of onherstelbare schade maximaal ฿4.500 per oordopje."
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
                    throw new Error("Netwerkfout bij verzenden van contactbericht");
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
                console.error("Contact verzendfout:", error);
                alert("Er is helaas iets misgegaan bij het verzenden van uw bericht. Controleer uw internetverbinding of probeer het later opnieuw.");
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
                title: "100% Vrijheid & Natuurlijk Geluid",
                text: "Ervaar de ultieme revolutie in audiogemak onder de Thaise zon. Omdat onze oordopjes <em>boven</em> uw gehoorkanaal zweven in plaats van erin, geniet u van uw favoriete muziek of real-time vertalingen zonder zweetophoping of druk. Ideaal voor actieve stranddagen in Jomtien en wandelingen door Pattaya!"
            },
            "2": {
                title: "Handmatige Precisie-reiniging",
                text: "Naast onze machinale sterilisatie ondergaan alle W4 Pro's een uitgebreide handmatige reinigingsbeurt. Onze getrainde specialisten desinfecteren elk hoekje, gleufje en contactpunt met biologisch afbreekbare, alcoholvrije medische doekjes die speciaal zijn gecertificeerd voor audio-apparatuur. Gegarandeerd pluis- en bacterievrij!"
            },
            "3": {
                title: "Medische UV-C Lichtdesinfectie",
                text: "Veiligheid is onze absolute prioriteit bij True Time Thai. Elk oordopjesset en oplaadcase ondergaat een intensieve sterilisatiecyclus in onze industriële UV-C lichtkamers. Binnen enkele minuten wordt 99.9% van alle bacteriën, virussen en micro-organismen volledig geëlimineerd. Zo bent u verzekerd van een klinisch schone start!"
            },
            "4": {
                title: "Ergonomie Die Aanvoelt Als Lucht",
                text: "Dankzij de flexibele, vederlichte oorhaakvorm passen de W4 Pro oordopjes zich onmiddellijk en natuurlijk aan de anatomie van uw oor aan. U vergeet al snel dat u ze draagt! Bovendien hoort u door het open-oor design nog steeds de geluiden om u heen, wat zorgt voor maximale veiligheid in het drukke Pattayaanse verkeer."
            },
            "5": {
                title: "Hermetisch Verzegeld Voor U",
                text: "Nadat de oordopjes onze strenge 5-punts kwaliteitscontrole hebben doorlopen, worden ze direct vacuüm verzegeld in een biologisch afbreekbare hygiëneverpakking. U bent de allereerste die de zegel verbreekt bij ontvangst in uw resort. 100% gegarandeerd stofvrij, bacterievrij en verser dan vers!"
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
                title: "1. Ophalen & Inleveren van de Apparatuur",
                content: `
                    <p>Bij het boeken selecteert u uw gewenste ophaal- en inleverlocatie. Wij bieden momenteel twee handige opties aan in Pattaya:</p>
                    <ul>
                        <li><strong>Pattaya Beach Road Office:</strong> Geopend van 08:00 tot 22:00 uur. Ons kantoor ligt centraal en is eenvoudig te bereiken.</li>
                        <li><strong>Gratis Hotelbezorging & Inlevering:</strong> Wij bezorgen de verzegelde sets gratis bij de receptie van uw hotel of resort in Pattaya (inclusief Jomtien en Naklua). U kunt de set bij vertrek simpelweg weer achterlaten bij de receptie.</li>
                    </ul>
                    <p><em>Let op:</em> De huurperiode gaat in op de afgesproken startdatum vanaf 08:00 uur en eindigt op de einddatum uiterlijk om 22:00 uur. Te laat inleveren zonder overleg brengt een toeslag van ฿250 per dag met zich mee.</p>
                `
            },
            deposit: {
                title: "2. Borg, Betaling & Legitimatie",
                content: `
                    <p>Wij houden van heldere en eenvoudige afspraken zonder onnodige rompslomp:</p>
                    <ul>
                        <li><strong>Geen Contante Borg:</strong> Bij verificatie van een geldige creditcard (Visa of Mastercard) bij ophalen of online boeken is <strong>geen contante borg</strong> vereist.</li>
                        <li><strong>Alternatieve Borg:</strong> Beschikt u niet over een creditcard? Geen probleem! U kunt er ook voor kiezen om een contante borg van ฿3.000 (€80) per set te deponeren, of een kopie van uw paspoort achter te laten. Contante borg krijgt u bij inlevering direct en volledig terug.</li>
                        <li><strong>Betalingswijzen:</strong> Wij accepteren online betalingen met Creditcard, PromptPay en contante betaling in THB of EUR bij overdracht.</li>
                    </ul>
                `
            },
            insurance: {
                title: "3. Schade, Diefstal & Verzekering",
                content: `
                    <p>Tijdens het reizen kan er natuurlijk altijd iets onverwachts gebeuren. Wij bieden volledige transparantie over schade en verlies:</p>
                    <ul>
                        <li><strong>Optionele Schadedekking (+฿50 / €1.35 per dag):</strong> Hiermee bent u volledig (100%) gedekt tegen onopzettelijke fysieke schade, waterschade of diefstal (met politierapport). Geen eigen risico!</li>
                        <li><strong>Zonder Verzekering:</strong> Bij verlies, diefstal of onherstelbare schade aan de oordopjes bent u aansprakelijk voor de vervangingswaarde. Deze bedraagt maximaal ฿4.500 per oordopje of laadcase.</li>
                        <li><strong>Normale Slijtage:</strong> Kleine krasjes of normale gebruikssporen vallen uiteraard onder onze service en hier worden nooit kosten voor in rekening gebracht.</li>
                    </ul>
                `
            },
            cancellation: {
                title: "4. Annuleren, Wijzigen & Verlengen",
                content: `
                    <p>Plannen veranderen, zeker tijdens een reis. Wij zijn de meest flexibele partner in Pattaya:</p>
                    <ul>
                        <li><strong>Gratis Annuleren:</strong> U kunt uw reservering tot 24 uur voor de startdatum volledig gratis annuleren. U ontvangt uw eventuele aanbetaling binnen 3 werkdagen terug.</li>
                        <li><strong>Tussentijds Wijzigen:</strong> Wilt u de startdatum verschuiven of de ophaallocatie aanpassen? Laat het ons weten via WhatsApp en we passen het kosteloos voor u aan.</li>
                        <li><strong>Verlengen:</strong> Bevalt de vertaalservice zo goed dat u de oordopjes langer wilt houden? Stuur ons simpelweg een WhatsApp-bericht. Indien de sets beschikbaar zijn, verlengen we uw contract direct tegen hetzelfde voordelige dagtarief.</li>
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

        const showSlide = (index) => {
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

        // Click on the Polaroid card itself to go to the next slide
        slides.forEach(slide => {
            const card = slide.querySelector('.polaroid-card');
            if (card) {
                card.addEventListener('click', () => {
                    nextSlide();
                    resetAutoPlay();
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

        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
    };

    initHeaderScroll();
    initPolaroidStack();
    initHygienePolaroidStack();
    initTermsTabs();
    initContactCarousel();
});
