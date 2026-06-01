/* ==========================================================================
   True Time Thai - Web Application Logic (app.js)
   Features: SPA Router, Simulator, Booking Engine, Testimonials, FAQ Accordion
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
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
    const scenarios = {
        market: {
            title: "Gesprek op de Lanpho Naklua Markt",
            steps: [
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Hallo! Hoeveel kosten deze tijgergarnalen per kilo?",
                    translation: "สวัสดีครับ กุ้งลายเสือพวกนี้กิโลละเท่าไหร่ครับ (Sawatdee krap, kung lai suea puak nee kilo la tao rai krap?)"
                },
                {
                    speaker: "local",
                    name: "P'Som (Vishandelaar)",
                    text: "สวัสดีจ้า! กิloละ 450 บาทจ้า ลดได้นิดหน่อยนะจ๊ะ เอาเท่าไหร่ดีจ๊ะ",
                    translation: "Hallo! Ze kosten 450 Baht per kilo. Ik kan een beetje korting geven. Hoeveel wil je hebben?"
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Ik wil graag twee kilo hebben. Kunnen we er 800 Baht van maken voor twee kilo?",
                    translation: "ขอสองกิโลครับ ลดเหลือแปดร้อยบาทได้ไหมครับ (Kor song kilo krap. Lod luea paed roy baht dai mai krap?)"
                },
                {
                    speaker: "local",
                    name: "P'Som (Vishandelaar)",
                    text: "โอเคจ้า คนหล่อ! ได้จ้า สองกิโล 800 บาท เดี๋ยวป้าแถมหอยแมลงภู่ให้ด้วยจ้า",
                    translation: "Oké knappe man! Dat is goed, twee kilo voor 800 Baht. Ik doe er gratis wat mosselen bij!"
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Geweldig! Heel erg bedankt voor de uitstekende service!",
                    translation: "เยี่ยมเลยครับ ขอบคุณมากสำหรับบริการที่ดีเยี่ยมนะครับ (Yiem loey krap! Khop khun mak sam-rab bo-ri-kan tee dee yiem na krap.)"
                }
            ]
        },
        taxi: {
            title: "Songthaew Rit naar Walking Street",
            steps: [
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Goedenavond, gaat u naar Walking Street?",
                    translation: "สวัสดีครับ ไปถนนคนเดินวอคกิ้งสตรีทไหมครับ (Sawatdee krap, pai tha-non khon dern Walking Street mai krap?)"
                },
                {
                    speaker: "local",
                    name: "Looong (Chauffeur)",
                    text: "ไปครับ ขึ้นมาเลยครับ คนละ 20 บาทครับผม",
                    translation: "Ja, ik ga! Stap maar in, het is 20 Baht per persoon."
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Wacht, kunt u ons rechtstreeks bij de ingang afzetten? We zijn met 4 personen.",
                    translation: "เดี๋ยวครับ ช่วยไปส่งที่หน้าทางเข้าเลยได้ไหมครับ พวกเรามีกันสี่คน (Diew krap, chuay pai song tee nah tang khao loey dai mai krap? Puak rao mee kan see khon.)"
                },
                {
                    speaker: "local",
                    name: "Looong (Chauffeur)",
                    text: "ถ้าเหมาไปส่งข้างหน้าเลย คิดเหมา 150 บาทละกันครับ สะดวกกว่า ไม่ต้องเดินไกล",
                    translation: "Als je de hele bus huurt om direct voor de ingang afgezet te worden, reken ik 150 Baht in totaal. Dat is comfortabeler en scheelt lopen."
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "150 Baht is perfect. Laten we gaan. Dank u wel!",
                    translation: "ร้อยห้าสิบบาทตกลงครับ ไปกันเลย ขอบคุณครับ (Roy ha-sip baht tok-long krap. Pai kan loey. Khop khun krap!)"
                }
            ]
        },
        resort: {
            title: "Inchecken bij Jomtien Bay Resort",
            steps: [
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Hallo, ik wil graag inchecken. Mijn reservering staat op naam van Matthijs.",
                    translation: "สวัสดีครับ ขอเช็คอินครับ จองไว้ในชื่อ แมทธิว ครับ (Sawatdee krap, kor check-in krap. Jong wai nai chue Matthieu krap.)"
                },
                {
                    speaker: "local",
                    name: "Kwan (Receptionist)",
                    text: "สวัสดีค่ะ ยินดีต้อนรับค่ะ ขอเอกสารยืนยันการจองกับพาสปอร์ตด้วยนะคะ",
                    translation: "Hallo, welkom! Mag ik uw boekingsbevestiging en uw paspoort alstublieft?"
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Alstublieft. Is het ontbijt inbegrepen en hoe laat is het zwembad geopend?",
                    translation: "นี่ครับ รวมอาหารเช้าด้วยไหมครับ แล้วสระว่ายน้ำเปิดถึงกี่โมงครับ (Nee krap. Ruam ar-han chao duay mai krap? Laew sa-wai-nam perd tueng kee mong krap?)"
                },
                {
                    speaker: "local",
                    name: "Kwan (Receptionist)",
                    text: "รวมอาหารเช้าเรียบร้อยค่ะ ทานได้ที่ห้องอาหารชั้นหนึ่ง ส่วนสระว่ายน้ำเปิดเจ็ดโมงเช้าถึงสี่ทุ่มค่ะ",
                    translation: "Ja, ontbijt is inbegrepen en wordt geserveerd in het restaurant op de eerste verdieping. Het zwembad is open van 07:00 tot 22:00 uur."
                },
                {
                    speaker: "tourist",
                    name: "Jij (Toerist)",
                    text: "Fantastisch. Hartelijk dank voor de heldere uitleg.",
                    translation: "ยอดเยี่ยมมาก ขอบคุณมากสำหรับคำอธิบายที่ชัดเจนนะครับ (Yod-yiem mak. Khop khun mak sam-rab kam ar-thi-bay tee chad-jen na krap.)"
                }
            ]
        }
    };

    let currentScenario = 'market';
    let currentStep = 0;

    const simMessages = document.getElementById('simulator-messages');
    const simTitleText = document.getElementById('simulator-title-text');
    const simNextBtn = document.getElementById('simulator-next-btn');
    const simResetBtn = document.getElementById('simulator-reset-btn');
    const simAiStatus = document.getElementById('simulator-ai-status');
    const simStatusIndicator = document.getElementById('simulator-status-indicator');

    // Setup Scenario buttons
    const scenarioMarketBtn = document.getElementById('btn-scenario-market');
    const scenarioTaxiBtn = document.getElementById('btn-scenario-taxi');
    const scenarioResortBtn = document.getElementById('btn-scenario-resort');

    function updateScenarioActiveState(activeId) {
        document.querySelectorAll('.scenario-card').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeId === 'market' && scenarioMarketBtn) scenarioMarketBtn.classList.add('active');
        if (activeId === 'taxi' && scenarioTaxiBtn) scenarioTaxiBtn.classList.add('active');
        if (activeId === 'resort' && scenarioResortBtn) scenarioResortBtn.classList.add('active');
    }

    function resetSimulator(scenarioId = currentScenario) {
        currentScenario = scenarioId;
        currentStep = 0;
        updateScenarioActiveState(scenarioId);
        
        if (simTitleText) simTitleText.textContent = scenarios[scenarioId].title;
        if (simMessages) {
            simMessages.innerHTML = `
                <div class="msg-bubble glass msg-local" style="align-self: center; border-radius: var(--radius-md); text-align: center;">
                    <div class="msg-text">💡 Klik op <strong>"Start Gesprek"</strong> om het AI-oordopjes gesprek te simuleren!</div>
                </div>
            `;
        }
        if (simNextBtn) {
            simNextBtn.textContent = "Start Gesprek";
            simNextBtn.disabled = false;
        }
        if (simAiStatus) simAiStatus.style.display = 'none';
        if (simStatusIndicator) {
            simStatusIndicator.classList.remove('online');
            simStatusIndicator.classList.add('blinking');
        }
    }

    function playNextStep() {
        const scenario = scenarios[currentScenario];
        const stepData = scenario.steps[currentStep];
        
        if (!stepData) return;

        // Change next button to show thinking
        if (simNextBtn) simNextBtn.disabled = true;
        if (simAiStatus) simAiStatus.style.display = 'flex';
        if (simStatusIndicator) {
            simStatusIndicator.classList.remove('blinking');
            simStatusIndicator.classList.add('online');
        }

        // Simulate translation delay of 1.2 seconds
        setTimeout(() => {
            if (currentStep === 0 && simMessages) {
                // Clear the greeting tip
                simMessages.innerHTML = '';
            }

            if (simAiStatus) simAiStatus.style.display = 'none';

            // Create message bubble
            const bubble = document.createElement('div');
            bubble.className = `msg-bubble glass ${stepData.speaker === 'tourist' ? 'msg-tourist' : 'msg-local'}`;
            
            bubble.innerHTML = `
                <div class="msg-meta">${stepData.name}</div>
                <div class="msg-text">${stepData.text}</div>
                <div class="msg-trans">🔊 Vertaling: "${stepData.translation}"</div>
            `;

            if (simMessages) {
                simMessages.appendChild(bubble);
                // Scroll to bottom
                simMessages.scrollTop = simMessages.scrollHeight;
            }

            currentStep++;

            if (simNextBtn) {
                simNextBtn.disabled = false;
                if (currentStep < scenario.steps.length) {
                    simNextBtn.textContent = "Volgende Zin";
                } else {
                    simNextBtn.textContent = "Gesprek Voltooid";
                    simNextBtn.disabled = true;
                }
            }
        }, 1200);
    }

    // Attach Event Listeners
    if (simNextBtn) {
        simNextBtn.addEventListener('click', () => {
            const scenario = scenarios[currentScenario];
            if (currentStep < scenario.steps.length) {
                playNextStep();
            }
        });
    }

    if (simResetBtn) {
        simResetBtn.addEventListener('click', () => {
            resetSimulator();
        });
    }

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
            
            const submitBtn = document.getElementById('btn-submit-booking');
            const originalBtnText = submitBtn ? submitBtn.textContent : 'Bevestig Huuraanvraag';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Verzenden... een moment a.u.b.";
                submitBtn.style.opacity = '0.7';
            }
            
            const formData = {
                _subject: `🎉 Nieuwe Boekingsaanvraag van ${name} - True Time Thai`,
                _replyto: email,
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
            
            fetch("https://formsubmit.co/ajax/matthias.radder@gmail.com", {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Netwerkfout bij verzenden van formulier");
                }
                return response.json();
            })
            .then(data => {
                // Perform Visual Switch to success layout
                if (rentalForm) rentalForm.style.display = 'none';
                if (receiptBox) receiptBox.style.display = 'none';
                
                if (successCard) successCard.style.display = 'block';
                if (successEmailSpan) successEmailSpan.textContent = email;
                
                // Scroll to the wizard section top
                const bookingSection = document.getElementById('booking');
                if (bookingSection) {
                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                }
            })
            .catch(error => {
                console.error("Verzendfout:", error);
                alert("Er is helaas iets misgegaan bij het verzenden van uw reservering. Controleer uw internetverbinding of neem contact met ons op via WhatsApp!");
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

    if (btnNewBooking) {
        btnNewBooking.addEventListener('click', () => {
            // Reset wizard
            if (successCard) successCard.style.display = 'none';
            if (rentalForm) {
                rentalForm.reset();
                rentalForm.style.display = 'block';
            }
            if (receiptBox) receiptBox.style.display = 'block';
            
            // Recalculate
            if (startDateInput) startDateInput.value = formattedToday;
            if (endDateInput) endDateInput.value = formattedTomorrow;
            if (earbudCountInput) earbudCountInput.value = '1';
            
            updatePricing();
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
            text: "Perfecte service! Ik had de oordopjes gehuurd met airport pickup in Bangkok. Ze lagen keurig voor me klaar in een luchtdichte verpakking. De meegeleverde 5G simkaart werkte direct. Absolute aanrader voor iedere reiziger!",
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
            a: "Het is heel eenvoudig! U reserveert de oordopjes vooraf via ons platform. U kunt de sets ophalen op onze stand op Bangkok Suvarnabhumi Airport (BKK), op ons hoofdkantoor aan Beach Road in Pattaya, of u kiest voor <strong>gratis bezorging direct bij uw hotel of resort in Pattaya</strong>. Bij het inleveren kiest u simpelweg weer de locatie die u het beste uitkomt."
        },
        {
            q: "Zijn de gehuurde oordopjes wel echt hygiënisch en schoon?",
            a: "Absoluut! Hygiëne is onze hoogste prioriteit. Onze True Time Thai W4 Pro oordopjes hebben een modern <strong>open-oor ontwerp</strong> dat op de oorschelp rust en het gehoorkanaal niet binnendringt. Na elk gebruik ondergaan de oordopjes een intensieve reinigingscyclus: reiniging met alcoholvrije medische desinfectiedoekjes, <strong>sterilisatie in UV-C kamers</strong>, batterijcontrole en luchtdichte verzegeling. U verbreekt zelf de hygiëneverzegeling."
        },
        {
            q: "Welke talen worden ondersteund door de True Time Thai W4 Pro?",
            a: "De oordopjes ondersteunen real-time, bidirectionele AI-vertaling in <strong>102 talen en 14 verschillende Engelse accenten</strong> (inclusief Brits, Amerikaans, Australisch, Indiaas, etc.). Hierdoor kunt u spreken in uw eigen taal (zoals Nederlands, Duits of Engels) en hoort uw Thaise gesprekspartner direct Thais, en omgekeerd!"
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
            
            fetch("https://formsubmit.co/ajax/matthias.radder@gmail.com", {
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
       8. POLAROID STACK SHUFFLE EFFECT
       ========================================================================== */
    const initPolaroidStack = () => {
        const stack = document.getElementById('polaroid-deck');
        if (!stack) return;

        const card1 = document.getElementById('polaroid-card-1');
        const card2 = document.getElementById('polaroid-card-2');
        const card3 = document.getElementById('polaroid-card-3');
        if (!card1 || !card2 || !card3) return;

        let isShuffling = false;
        
        // Order of cards from top to bottom (initially: 1, 2, 3)
        let cards = [card1, card2, card3];

        // Initial positions and styles
        card1.style.transform = 'rotate(12deg)';
        card1.style.zIndex = '3';
        card2.style.transform = 'rotate(-8deg)';
        card2.style.zIndex = '2';
        card3.style.transform = 'rotate(4deg)';
        card3.style.zIndex = '1';

        stack.addEventListener('mouseenter', () => {
            if (isShuffling) return;
            isShuffling = true;

            const isMobile = window.innerWidth <= 992;
            
            // Top card is always cards[0]
            const topCard = cards[0];

            // Slide top card out dynamically (upwards on mobile, rightwards on desktop)
            topCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
            topCard.style.transform = isMobile 
                ? 'translateY(-105%) rotate(15deg)' 
                : 'translateX(115%) rotate(25deg)';

            // Swap z-index and tilt angles when card is completely clear (250ms)
            setTimeout(() => {
                // Update our tracker array: shift top card to the bottom
                cards.shift();
                cards.push(topCard);

                // Set new z-indexes:
                cards[0].style.zIndex = '3';
                cards[1].style.zIndex = '2';
                cards[2].style.zIndex = '1';

                // Recalculate natural, randomized angles for a physical feel
                const topTilt = Math.floor(Math.random() * 8) + 6; // 6deg to 14deg
                const middleTilt = Math.floor(Math.random() * 8) - 8; // -8deg to 0deg
                const bottomTilt = Math.floor(Math.random() * 8) - 12; // -12deg to -4deg

                // Apply angles
                cards[0].style.transform = `rotate(${topTilt}deg)`;
                cards[1].style.transform = `rotate(${middleTilt}deg)`;
                
                // Return original top card (now bottom card at cards[2]) to stack
                topCard.style.transform = isMobile 
                    ? `translateY(0) rotate(${bottomTilt}deg)` 
                    : `translateX(0) rotate(${bottomTilt}deg)`;

                // Shuffling completes after the card returns and settles
                setTimeout(() => {
                    isShuffling = false;
                }, 400);
            }, 250);
        });
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

    initHeaderScroll();
    initPolaroidStack();
});
