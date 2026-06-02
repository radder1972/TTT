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

    let activeLang = localStorage.getItem('preferredLang') || 'nl';

    const translations = {
        nl: {
            nav_home: "Home",
            nav_pricing: "Tarieven",
            nav_booking: "Boeken",
            nav_hygiene: "Hygiëne & Info",
            nav_simulator: "AI Simulator",
            nav_contact: "Contact",
            nav_reviews: "Gebruikerservaringen",
            nav_terms: "Voorwaarden",
            quick_book: "Nu Huren",
            hero_badge: "<span class=\"flag-dot\"></span> Pattaya's Eerste Premium Vertaalservice",
            hero_title: "Breek de taalbarrière.<br><span class=\"text-gradient\">Ervaar Thailand in Real-Time.</span>",
            hero_lead: "Huur de **True Time Thai W4 Pro** AI-vertaaloordopjes in Pattaya. Communiceer moeiteloos en natuurlijk met gidsen, lokale ondernemers en bewoners. Zonder onhandig staren naar een telefoonscherm.",
            hero_cta_primary: "Reserveer W4 Pro",
            hero_cta_secondary: "Probeer de AI Simulator",
            hl_1_title: "102 Talen",
            hl_1_desc: "+14 Engelse accenten",
            hl_2_title: "Open-Oor Comfort",
            hl_2_desc: "100% hygiënisch & veilig",
            hl_3_title: "Real-Time Vertaling",
            hl_3_desc: "Met geavanceerde AI",
            hero_caption_1: "Een open oor design om rustig te genieten",
            hero_caption_2: "Wie helpt u de waarheid te ontdekken?",
            hero_caption_3: "Samen praten is samen genieten",
            tech_tag: "De Technologie",
            tech_title: "Waarom de True Time Thai W4 Pro?",
            tech_lead: "Ontwikkeld om natuurlijke, soepele communicatie mogelijk te maken in uitdagende omgevingen.",
            feat_1_title: "Open-Oor Hygiëne",
            feat_1_desc: "Geen in-ear contact. Het ergonomische open-oor ontwerp rust comfortabel over uw oorschelp. Dit maakt het uiterst hygiënisch, veilig en ideaal voor verhuur.",
            feat_2_title: "102 Talen & Accentondersteuning",
            feat_2_desc: "Spreek in uw eigen taal (bijv. Nederlands of Engels) en hoor direct Thais terug. De AI herkent 14 Engelse accenten (inclusief Thai English) en de True Time Thai W4 Pro past zich hier perfect op aan.",
            feat_3_title: "Pattaya Wind & Noise Reduction",
            feat_3_desc: "Of u nu op een drukke avondmarkt staat of in een open Songthaew (baht-bus) zit, de dual-mic ruisonderdrukking zorgt voor kristalheldere vertalingen.",
            feat_4_title: "12 Uur Actieve Accu",
            feat_4_desc: "Verken Pattaya de hele dag zonder stress. De oordopjes gaan tot 12 uur mee op een enkele lading en worden geleverd met een luxe laadcase.",
            lang_box_title: "Ondersteunde Talen & Accenten",
            lang_box_desc: "Zoek uw taal en ontdek hoe soepel de W4 Pro vertaalt naar het Thais.",
            lang_box_search: "Zoek op taal (bijv. Nederlands, Duits, Thai...)",
            sim_tag: "Ervaar Het Zelf",
            sim_title: "AI Vertaal Simulator",
            sim_lead: "Test hoe de True Time Thai W4 Pro in real-time gesprekken vertaalt in Pattaya. Kies een scenario en start de ervaring.",
            sim_scenarios_title: "Kies een Scenario",
            sim_sc_market_title: "Lanpho Naklua Vis-Markt",
            sim_sc_market_desc: "Zeevruchten bestellen en onderhandelen met een lokale vishandelaar.",
            sim_sc_taxi_title: "Taxi naar Walking Street",
            sim_sc_taxi_desc: "Een Songthaew chauffeur de weg uitleggen en de prijs afspreken.",
            sim_sc_resort_title: "Inchecken in Jomtien Resort",
            sim_sc_resort_desc: "Praten met de receptionist over hotelvoorzieningen en een borgsom.",
            sim_handsfree_badge: "🎧 Handsfree Modus Actief",
            book_tag: "Direct Reserveren",
            book_title: "True Time Thai W4 Pro Huren",
            book_lead: "Plan uw reis zorgeloos. Bereken uw prijs en reserveer direct uw AI-oordopjes voor ophalen of gratis bezorging in Pattaya.",
            form_title: "Boekingsgegevens",
            form_label_start: "Startdatum Huur",
            form_label_end: "Einddatum Huur",
            form_label_qty: "Aantal Sets W4 Pro",
            form_label_loc: "Ophaal & Inleverlocatie",
            form_opt_office: "True Time Thai Office - Beach Road Pattaya",
            form_opt_hotel: "Hotel Bezorging in Pattaya (Gratis)",
            form_label_extras: "Handige Extra's voor Pattaya",
            form_extra_sim_title: "5G SIM-kaart (+ ฿350 / €10)",
            form_extra_sim_desc: "Onbeperkt data voor real-time offline AI-vertaling en kaarten.",
            form_extra_pb_title: "Premium Powerbank (+ ฿175 / €5)",
            form_extra_pb_desc: "Altijd extra stroom onderweg voor uw telefoon en laadcase.",
            form_label_name: "Volledige Naam",
            form_placeholder_name: "Bijv. Jan de Vries",
            form_label_email: "E-mailadres",
            form_placeholder_email: "Bijv. jan@voorbeeld.nl",
            form_btn_submit: "Bevestig Huuraanvraag",
            receipt_title: "HUURINVOICE",
            receipt_period_label: "Huurperiode:",
            receipt_total_thb: "Totaal (THB):",
            receipt_total_eur: "Totaal (EUR schatting):",
            receipt_foot_1: "✓ Geen borg vereist bij creditcard-verificatie",
            receipt_foot_2: "✓ Gratis annuleren tot 24 uur voor aanvang",
            receipt_hygiene_badge: "🧼 UV-C Gedesinfecteerd",
            success_title: "Reservering Aangevraagd!",
            success_desc_1: "Bedankt voor uw boeking bij True Time Thai. Wij hebben een bevestigingsmail gestuurd naar ",
            success_desc_2: "Uw digitale ophaalbewijs en verdere instructies voor de gekozen locatie volgen spoedig.",
            success_btn_new: "Nieuwe Boeking",
            hyg_tag: "Veiligheid Eerst",
            hyg_title: "Strikt Hygiëneprotocol & Info",
            hyg_lead: "Wij begrijpen dat hygiëne cruciaal is bij het delen van technologie. Daarom hanteren wij medische reinigingsstandaarden.",
            hyg_step1_title: "UV-C Sterilisatie",
            hyg_step1_desc: "Elke oordopjesset en laadcase ondergaat een intensieve sterilisatie in onze industriële UV-C lichtkamers. Dit elimineert 99,9% van alle bacteriën en virussen.",
            hyg_step2_title: "Medische Reiniging",
            hyg_step2_desc: "De W4 Pro's worden handmatig gereinigd en ontsmet met biologisch afbreekbare, alcoholvrije medische desinfectiedoekjes die speciaal zijn ontworpen voor audiocomponenten.",
            hyg_step3_title: "Verzegeling & Inspectie",
            hyg_step3_desc: "Na een uitgebreide audiotest en batterijcheck wordt het pakket luchtdicht verzegeld in een biologische hygiëneverpakking. U verbreekt zelf de zegel bij ontvangst.",
            tab_comfort: "Comfort",
            tab_uvc: "UV-C Sterilisatie",
            tab_reiniging: "Reiniging",
            tab_pasvorm: "Pasvorm",
            tab_verzegeling: "Verzegeling",
            hyg_dynamic_title: "100% Vrijheid & Natuurlijk Geluid",
            hyg_dynamic_text: "<p>Ervaar de ultieme revolutie in audiogemak onder de Thaise zon. Omdat onze oordopjes <em>boven</em> uw gehoorkanaal zweven in plaats van erin, geniet u van uw favoriete muziek of real-time vertalingen zonder zweetophoping of druk. Ideaal voor actieve stranddagen in Jomtien en wandelingen door Pattaya!</p>",
            hyg_cap_1: "Comfortabel & hygiënisch dragen",
            hyg_cap_2: "Grondige medische desinfectie",
            hyg_cap_3: "Intensieve UV-C sterilisatie",
            hyg_cap_4: "Perfect passend open-oor design",
            hyg_cap_5: "100% hygiënische vacuüm-verzegeling",
            pricing_tag: "Transparante Prijzen",
            pricing_title: "Onze Tariefplannen",
            pricing_lead: "Kies het plan dat het beste bij uw verblijf in Thailand past. Geen verborgen kosten, geen ingewikkelde borgregelingen.",
            plan_1_title: "Dagverkenner",
            plan_1_sub: "Ideaal voor een dagje uit of excursie",
            plan_1_price_period: "/ dag (~ €6,75)",
            plan_1_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_1_feat_2: "✓ Inclusief oplaadcase & USB-kabel",
            plan_1_feat_3: "✓ 102 talen inbegrepen",
            plan_1_feat_4: "✓ Ophalen bij Pattaya Office",
            plan_1_feat_5: "✗ Geen weekkorting",
            plan_btn: "Selecteer Plan",
            plan_2_badge: "Meest Gekozen",
            plan_2_title: "Vakantieganger",
            plan_2_sub: "Perfect voor een vakantie in Pattaya",
            plan_2_price_period: "/ dag (~ €5,40)",
            plan_2_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_2_feat_2: "✓ Inclusief oplaadcase & USB-kabel",
            plan_2_feat_3: "✓ <strong>20% Korting</strong> vanaf 5 dagen",
            plan_2_feat_4: "✓ Gratis hotelbezorging in Pattaya",
            plan_2_feat_5: "✓ Meertalige helpdesk via WhatsApp",
            plan_3_title: "Zakenreiziger & Expat",
            plan_3_sub: "Voor langdurig verblijf of zakelijk succes",
            plan_3_price_period: "/ dag (~ €4,05)",
            plan_3_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_3_feat_2: "✓ Inclusief oplaadcase & USB-kabel",
            plan_3_feat_3: "✓ Speciale langetermijnprijs (+30 dagen)",
            plan_3_feat_4: "✓ VIP bezorging & Hotelbezorging",
            plan_3_feat_5: "✓ 24/7 Premium support",
            faq_tag: "Vragen?",
            faq_title: "Veelgestelde Vragen",
            faq_lead: "Heeft u twijfels of specifieke vragen? Hier vindt u de antwoorden.",
            reviews_tag: "Ervaringen",
            reviews_title: "Wat Onze Huurders Zeggen",
            reviews_lead: "Lees de onafhankelijke verhalen van reizigers en expats die Pattaya hebben verkend met de True Time Thai W4 Pro.",
            reviews_box_title: "Wat Onze Klanten Zeggen",
            rev_1_text: "\"Ik was eerst sceptisch over real-time vertaling, maar deze oordopjes zijn werkelijk fantastisch. Op de vismarkt in Naklua kon ik direct grappen maken en onderhandelen met de verkopers. Ze vonden het geweldig dat ik direct Thais terug sprak. Een absolute verrijking voor mijn vakantie!\"",
            rev_1_author: "Matthijs Radder",
            rev_1_details: "Toerist uit Rotterdam",
            rev_2_text: "\"Als expat in Jomtien spreek ik een klein beetje Thais, maar voor ingewikkelde gesprekken over huurcontracten of visumzaken liep ik altijd vast. De W4 Pro heeft me enorm geholpen. De vertaling is razendsnel en de dubbele microfoon filtert het verkeerslawaai prima. Heel erg blij mee!\"",
            rev_2_author: "Sarah Jenkins",
            rev_2_details: "Expat uit Birmingham, VK",
            rev_3_text: "\"Geweldige hygiëne! Dat was mijn grootste zorg, maar de oordopjes zaten luchtdicht verzegeld in de verpakking en roken superfris. Omdat ze over je oor hangen en niet in je oor gaan, zweet je ook niet onder de warme Thaise zon. De hotelbezorging in Pattaya was erg soepel geregeld.\"",
            rev_3_author: "Dieter Meyer",
            rev_3_details: "Zakenreiziger uit Frankfurt",
            rev_4_text: "\"Mijn partner en ik hebben twee sets gehuurd voor onze rondreis door Chonburi. Het delen van ervaringen met de lokale bevolking werd hierdoor zo intiem en bijzonder. We hebben fantastische eettentjes ontdekt waar geen woord Engels werd gesproken. Dit hadden we nooit willen missen!\"",
            rev_4_author: "Jan & Annelies",
            rev_4_details: "Reizigers uit Antwerpen",
            reviews_cta_title: "Uw eigen ervaring delen?",
            reviews_cta_desc: "Heeft u onlangs de True Time Thai oordopjes gehuurd en wilt u uw verhaal delen met toekomstige reizigers? Stuur ons uw review via WhatsApp en ontvang 10% korting op uw volgende huurperiode!",
            reviews_cta_btn: "Deel uw Ervaring op WhatsApp",
            terms_tag: "Duidelijkheid",
            terms_title: "Algemene Huurvoorwaarden",
            terms_lead: "Transparante regels voor een zorgeloze vertaalervaring. Geen kleine lettertjes, wel heldere afspraken.",
            terms_tab_1: "1. Ophalen & Inleveren",
            terms_tab_2: "2. Borg & Legitimatie",
            terms_tab_3: "3. Schade & Verzekering",
            terms_tab_4: "4. Annuleren & Wijzigen",
            contact_title: "Neem Contact Met Ons Op",
            contact_desc: "Heeft u specifieke vragen over uw boeking, langdurig huren of samenwerkingen? Stuur ons direct een bericht.",
            contact_label_name: "Naam",
            contact_placeholder_name: "Uw naam",
            contact_label_email: "E-mail",
            contact_placeholder_email: "Uw e-mailadres",
            contact_label_msg: "Bericht",
            contact_placeholder_msg: "Typ hier uw bericht...",
            contact_btn_submit: "Verstuur Bericht",
            contact_success: "✓ Uw bericht is succesvol verzonden! We reageren binnen 2 uur via WhatsApp of mail.",
            info_office_title: "Hoofdkantoor:",
            info_phone_title: "Telefoon / WhatsApp:",
            info_email_title: "E-mail:",
            info_hours_title: "Openingstijden:",
            info_hours_desc: "Dagelijks van 08:00 tot 22:00 uur (Pattaya Tijd)",
            contact_carousel_cap_1: "Onze winkel in Pattaya",
            contact_carousel_cap_2: "Direct afhalen bij ons kantoor aan Pattaya Beach Road",
            contact_carousel_cap_3: "Onze medewerkers staan voor u klaar",
            footer_copyright: "&copy; 2026 True Time Thai. Alle rechten voorbehouden.",
            footer_link_1: "Hygiënevoorwaarden",
            footer_link_2: "Huurvoorwaarden",
            footer_link_3: "Privacy Policy"
        },
        en: {
            nav_home: "Home",
            nav_pricing: "Pricing",
            nav_booking: "Book Now",
            nav_hygiene: "Hygiene & Info",
            nav_simulator: "AI Simulator",
            nav_contact: "Contact",
            nav_reviews: "Reviews",
            nav_terms: "Terms",
            quick_book: "Rent Now",
            hero_badge: "<span class=\"flag-dot\"></span> Pattaya's First Premium Translation Service",
            hero_title: "Break the language barrier.<br><span class=\"text-gradient\">Experience Thailand in Real-Time.</span>",
            hero_lead: "Rent the **True Time Thai W4 Pro** AI translation earbuds in Pattaya. Communicate effortlessly and naturally with guides, local business owners, and residents. Without awkwardly staring at a phone screen.",
            hero_cta_primary: "Reserve W4 Pro",
            hero_cta_secondary: "Try the AI Simulator",
            hl_1_title: "102 Languages",
            hl_1_desc: "+14 English accents",
            hl_2_title: "Open-Ear Comfort",
            hl_2_desc: "100% hygienic & safe",
            hl_3_title: "Real-Time Translation",
            hl_3_desc: "Powered by advanced AI",
            hero_caption_1: "An open ear design to enjoy in peace",
            hero_caption_2: "Who helps you to get true?",
            hero_caption_3: "Talking together is enjoying together",
            tech_tag: "The Technology",
            tech_title: "Why True Time Thai W4 Pro?",
            tech_lead: "Developed to enable natural, smooth communication in challenging environments.",
            feat_1_title: "Open-Ear Hygiene",
            feat_1_desc: "No in-ear contact. The ergonomic open-ear design rests comfortably over your auricle. This makes it highly hygienic, safe, and ideal for rental.",
            feat_2_title: "102 Languages & Accent Support",
            feat_2_desc: "Speak in your own language (e.g. Dutch or English) and hear Thai back immediately. The AI recognizes 14 English accents (including Thai English) and adapts perfectly.",
            feat_3_title: "Pattaya Wind & Noise Reduction",
            feat_3_desc: "Whether you are on a busy night market or sitting in an open Songthaew (baht bus), the dual-mic noise reduction ensures crystal clear translations.",
            feat_4_title: "12-Hour Active Battery",
            feat_4_desc: "Explore Pattaya all day without stress. The earbuds last up to 12 hours on a single charge and come with a luxury charging case.",
            lang_box_title: "Supported Languages & Accents",
            lang_box_desc: "Search for your language and see how smoothly the W4 Pro translates to Thai.",
            lang_box_search: "Search for language (e.g., English, German, Thai...)",
            sim_tag: "Try It Yourself",
            sim_title: "AI Translation Simulator",
            sim_lead: "Test how the True Time Thai W4 Pro translates in real-time conversations in Pattaya. Choose a scenario and start the experience.",
            sim_scenarios_title: "Choose a Scenario",
            sim_sc_market_title: "Lanpho Naklua Fish Market",
            sim_sc_market_desc: "Ordering seafood and negotiating with a local fishmonger.",
            sim_sc_taxi_title: "Taxi to Walking Street",
            sim_sc_taxi_desc: "Explaining the route to a Songthaew driver and agreeing on the price.",
            sim_sc_resort_title: "Check-in at Jomtien Resort",
            sim_sc_resort_desc: "Talking to the receptionist about hotel amenities and a deposit.",
            sim_handsfree_badge: "🎧 Hands-Free Mode Active",
            book_tag: "Book Directly",
            book_title: "Rent True Time Thai W4 Pro",
            book_lead: "Plan your trip worry-free. Calculate your price and reserve your AI earbuds directly for pickup or free delivery in Pattaya.",
            form_title: "Booking Details",
            form_label_start: "Rental Start Date",
            form_label_end: "Rental End Date",
            form_label_qty: "Number of W4 Pro Sets",
            form_label_loc: "Pick-up & Drop-off Location",
            form_opt_office: "True Time Thai Office - Beach Road Pattaya",
            form_opt_hotel: "Hotel Delivery in Pattaya (Free)",
            form_label_extras: "Handy Extras for Pattaya",
            form_extra_sim_title: "5G Local SIM Card (+ ฿350 / €10)",
            form_extra_sim_desc: "Unlimited data for real-time offline AI translation and maps.",
            form_extra_pb_title: "Premium Power Bank (+ ฿175 / €5)",
            form_extra_pb_desc: "Always have extra power on the go for your phone and charging case.",
            form_label_name: "Full Name",
            form_placeholder_name: "e.g., John Doe",
            form_label_email: "Email Address",
            form_placeholder_email: "e.g., john@example.com",
            form_btn_submit: "Confirm Rental Request",
            receipt_title: "RENTAL INVOICE",
            receipt_period_label: "Rental Period:",
            receipt_total_thb: "Total (THB):",
            receipt_total_eur: "Total (EUR estimate):",
            receipt_foot_1: "✓ No deposit required with credit card verification",
            receipt_foot_2: "✓ Free cancellation up to 24 hours before start",
            receipt_hygiene_badge: "🧼 UV-C Disinfected",
            success_title: "Booking Requested!",
            success_desc_1: "Thank you for booking with True Time Thai. We have sent a confirmation email to ",
            success_desc_2: "Your digital pick-up receipt and further instructions for the chosen location will follow soon.",
            success_btn_new: "New Booking",
            hyg_tag: "Safety First",
            hyg_title: "Strict Hygiene Protocol & Info",
            hyg_lead: "We understand that hygiene is crucial when sharing technology. That is why we maintain medical-grade cleaning standards.",
            hyg_step1_title: "UV-C Sterilization",
            hyg_step1_desc: "Every earbud set and charging case undergoes intensive sterilization in our industrial UV-C light chambers. This eliminates 99.9% of all bacteria and viruses.",
            hyg_step2_title: "Medical Cleaning",
            hyg_step2_desc: "The W4 Pros are manually cleaned and sanitized with biodegradable, alcohol-free medical disinfectant wipes designed specifically for audio components.",
            hyg_step3_title: "Sealing & Inspection",
            hyg_step3_desc: "After an extensive audio test and battery check, the package is airtight sealed in biological hygiene packaging. You break the seal yourself upon receipt.",
            tab_comfort: "Comfort",
            tab_uvc: "UV-C Sterilization",
            tab_reiniging: "Cleaning",
            tab_pasvorm: "Fit",
            tab_verzegeling: "Sealing",
            hyg_dynamic_title: "100% Freedom & Natural Sound",
            hyg_dynamic_text: "<p>Experience the ultimate revolution in audio comfort under the Thai sun. Because our earbuds hover <em>above</em> your ear canal instead of inside it, you enjoy your favorite music or real-time translations without sweat buildup or pressure. Ideal for active beach days in Jomtien and walks through Pattaya!</p>",
            hyg_cap_1: "Comfortable & hygienic wearing",
            hyg_cap_2: "Thorough medical disinfection",
            hyg_cap_3: "Intensive UV-C sterilization",
            hyg_cap_4: "Perfect fitting open-ear design",
            hyg_cap_5: "100% hygienic vacuum-sealing",
            pricing_tag: "Transparent Pricing",
            pricing_title: "Our Rental Plans",
            pricing_lead: "Choose the plan that best fits your stay in Thailand. No hidden costs, no complicated deposit schemes.",
            plan_1_title: "Day Explorer",
            plan_1_sub: "Ideal for a day out or excursion",
            plan_1_price_period: "/ day (~ €6.75)",
            plan_1_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_1_feat_2: "✓ Includes charging case & USB cable",
            plan_1_feat_3: "✓ 102 languages included",
            plan_1_feat_4: "✓ Pick up at Pattaya Office",
            plan_1_feat_5: "✗ No weekly discount",
            plan_btn: "Select Plan",
            plan_2_badge: "Most Popular",
            plan_2_title: "Holiday Maker",
            plan_2_sub: "Perfect for a holiday in Pattaya",
            plan_2_price_period: "/ day (~ €5.40)",
            plan_2_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_2_feat_2: "✓ Includes charging case & USB cable",
            plan_2_feat_3: "✓ <strong>20% Discount</strong> from 5 days",
            plan_2_feat_4: "✓ Free hotel delivery in Pattaya",
            plan_2_feat_5: "✓ Multilingual helpdesk via WhatsApp",
            plan_3_title: "Business & Expat",
            plan_3_sub: "For long-term stay or business success",
            plan_3_price_period: "/ day (~ €4.05)",
            plan_3_feat_1: "✓ 1x True Time Thai W4 Pro set",
            plan_3_feat_2: "✓ Includes charging case & USB cable",
            plan_3_feat_3: "✓ Special long-term rate (+30 days)",
            plan_3_feat_4: "✓ VIP delivery & Hotel delivery",
            plan_3_feat_5: "✓ 24/7 Premium support",
            faq_tag: "Questions?",
            faq_title: "Frequently Asked Questions",
            faq_lead: "Got questions? Find the answers right here.",
            reviews_tag: "Experiences",
            reviews_title: "What Renter's Say",
            reviews_lead: "Read independent stories from travelers and expats who explored Pattaya with the True Time Thai W4 Pro.",
            reviews_box_title: "What Our Customers Say",
            rev_1_text: "\"I was skeptical about real-time translation at first, but these earbuds are truly fantastic. At the Naklua fish market, I could immediately joke and negotiate with sellers. They loved that I spoke Thai back. An absolute highlight of my holiday!\"",
            rev_1_author: "Matthijs Radder",
            rev_1_details: "Tourist from Rotterdam",
            rev_2_text: "\"As an expat in Jomtien, I speak a bit of Thai, but for complicated conversations about lease contracts or visa matters, I always got stuck. The W4 Pro helped me immensely. The translation is super fast and the dual mic filters out traffic noise perfectly.\"",
            rev_2_author: "Sarah Jenkins",
            rev_2_details: "Expat from Birmingham, UK",
            rev_3_text: "\"Great hygiene! That was my biggest concern, but the earbuds were vacuum sealed in the packaging and smelled fresh. Because they hang over your ear and don't go inside, you don't sweat under the warm Thai sun. Delivery was very smooth.\"",
            rev_3_author: "Dieter Meyer",
            rev_3_details: "Business Traveler from Frankfurt",
            rev_4_text: "\"My partner and I rented two sets for our trip through Chonburi. Sharing experiences with locals became so intimate and special. We discovered fantastic local diners where not a word of English was spoken. Wouldn't have wanted to miss it!\"",
            rev_4_author: "Jan & Annelies",
            rev_4_details: "Travelers from Antwerp",
            reviews_cta_title: "Share your own experience?",
            reviews_cta_desc: "Did you recently rent True Time Thai earbuds and want to share your story? Send us your review on WhatsApp and get a 10% discount on your next rent!",
            reviews_cta_btn: "Share Experience on WhatsApp",
            terms_tag: "Clarity",
            terms_title: "General Rental Conditions",
            terms_lead: "Transparent rules for a worry-free translation experience. No fine print, just clear agreements.",
            terms_tab_1: "1. Pick-up & Return",
            terms_tab_2: "2. Deposit & ID",
            terms_tab_3: "3. Damage & Insurance",
            terms_tab_4: "4. Cancellation & Changes",
            contact_title: "Get In Touch With Us",
            contact_desc: "Do you have specific questions about bookings, long-term rentals, or partnerships? Message us directly.",
            contact_label_name: "Name",
            contact_placeholder_name: "Your name",
            contact_label_email: "Email",
            contact_placeholder_email: "Your email address",
            contact_label_msg: "Message",
            contact_placeholder_msg: "Type your message here...",
            contact_btn_submit: "Send Message",
            contact_success: "✓ Your message has been sent successfully! We reply within 2 hours via WhatsApp or email.",
            info_office_title: "Head Office:",
            info_phone_title: "Phone / WhatsApp:",
            info_email_title: "Email:",
            info_hours_title: "Opening Hours:",
            info_hours_desc: "Daily from 08:00 to 22:00 (Pattaya Time)",
            contact_carousel_cap_1: "Our shop in Pattaya",
            contact_carousel_cap_2: "Pick up directly at our office on Pattaya Beach Road",
            contact_carousel_cap_3: "Our team is ready for you",
            footer_copyright: "&copy; 2026 True Time Thai. All rights reserved.",
            footer_link_1: "Hygiene Policy",
            footer_link_2: "Rental Terms",
            footer_link_3: "Privacy Policy"
        },
        th: {
            nav_home: "หน้าแรก",
            nav_pricing: "อัตราค่าเช่า",
            nav_booking: "จองเลย",
            nav_hygiene: "สุขอนามัยและข้อมูล",
            nav_simulator: "เครื่องจำลอง AI",
            nav_contact: "ติดต่อเรา",
            nav_reviews: "รีวิวจากผู้ใช้",
            nav_terms: "เงื่อนไข",
            quick_book: "เช่าตอนนี้",
            hero_badge: "<span class=\"flag-dot\"></span> บริการเช่าเครื่องแปลภาษาพรีเมียมรายแรกในพัทยา",
            hero_title: "ก้าวข้ามทุกกำแพงภาษา<br><span class=\"text-gradient\">สัมผัสประสบการณ์เมืองไทยแบบเรียลไทม์</span>",
            hero_lead: "เช่าหูฟังแปลภาษา AI **True Time Thai W4 Pro** ในพัทยา สื่อสารอย่างเป็นธรรมชาติและราบรื่นกับไกด์ ผู้ประกอบการท้องถิ่น และชาวเมือง โดยไม่ต้องก้มมองหน้าจอโทรศัพท์",
            hero_cta_primary: "จอง W4 Pro",
            hero_cta_secondary: "ทดลองใช้เครื่องจำลอง AI",
            hl_1_title: "102 ภาษา",
            hl_1_desc: "+14 สำเนียงภาษาอังกฤษ",
            hl_2_title: "ใส่สบายแบบ Open-Ear",
            hl_2_desc: "ถูกสุขอนามัยและปลอดภัย 100%",
            hl_3_title: "แปลภาษาแบบเรียลไทม์",
            hl_3_desc: "ขับเคลื่อนด้วยระบบ AI ขั้นสูง",
            hero_caption_1: "ดีไซน์แบบเปิดหูเพื่อการพักผ่อนอย่างสบายใจ",
            hero_caption_2: "ใครที่จะช่วยคุณค้นหาความจริง?",
            hero_caption_3: "พูดคุยร่วมกัน สนุกร่วมกัน",
            tech_tag: "เทคโนโลยี",
            tech_title: "ทำไมต้องเลือก True Time Thai W4 Pro?",
            tech_lead: "พัฒนาขึ้นมาเพื่อการสื่อสารที่เป็นธรรมชาติและราบรื่นในสภาพแวดล้อมที่ท้าทาย",
            feat_1_title: "สุขอนามัยแบบ Open-Ear",
            feat_1_desc: "ไม่ต้องใส่เข้าไปในรูหู ดีไซน์ตามหลักสรีรศาสตร์จะแขวนอยู่เหนือใบหูของคุณอย่างพอดี ทำให้ถูกสุขอนามัย ปลอดภัย และเหมาะสำหรับบริการให้เช่าอย่างยิ่ง",
            feat_2_title: "รองรับ 102 ภาษาและสำเนียง",
            feat_2_desc: "พูดในภาษาของคุณเอง (เช่น ดัตช์ หรือ อังกฤษ) และฟังคำแปลเป็นภาษาไทยได้ทันที ระบบ AI สามารถจดจำสำเนียงภาษาอังกฤษได้ถึง 14 สำเนียง (รวมถึงภาษาอังกฤษสำเนียงไทย)",
            feat_3_title: "ระบบตัดเสียงรบกวนและลมในพัทยา",
            feat_3_desc: "ไม่ว่าคุณจะอยู่ท่ามกลางตลาดโต้รุ่งที่วุ่นวาย หรือนั่งอยู่บนรถสองแถวเปิดประทุน ระบบไมโครโฟนคู่ตัดเสียงรบกวนจะช่วยให้แปลภาษาได้อย่างคมชัด",
            feat_4_title: "แบตเตอรี่ใช้งานได้ยาวนาน 12 ชั่วโมง",
            feat_4_desc: "เที่ยวพัทยาได้ทั้งวันโดยไม่ต้องกังวล หูฟังใช้งานได้นานถึง 12 ชั่วโมงต่อการชาร์จหนึ่งครั้ง มาพร้อมเคสชาร์จสุดหรู",
            lang_box_title: "ภาษาและสำเนียงที่รองรับ",
            lang_box_desc: "ค้นหาภาษาของคุณเพื่อดูว่า W4 Pro แปลเป็นภาษาไทยได้ราบรื่นเพียงใด",
            lang_box_search: "ค้นหาภาษา (เช่น อังกฤษ, เยอรมัน, ไทย...)",
            sim_tag: "ทดลองสัมผัสด้วยตัวเอง",
            sim_title: "เครื่องจำลองการแปล AI",
            sim_lead: "ทดสอบการทำงานของ True Time Thai W4 Pro ในการแปลบทสนทนาแบบเรียลไทม์ในพัทยา เลือกสถานการณ์และเริ่มต้นใช้งาน",
            sim_scenarios_title: "เลือกสถานการณ์",
            sim_sc_market_title: "ตลาดลานโพธิ์นาเกลือ",
            sim_sc_market_desc: "สั่งอาหารทะเลและต่อรองราคากับพ่อค้าปลาในท้องถิ่น",
            sim_sc_taxi_title: "นั่งรถไปวอล์กกิ้งสตรีท",
            sim_sc_taxi_desc: "อธิบายเส้นทางและตกลงราคากับคนขับรถสองแถว",
            sim_sc_resort_title: "เช็คอินที่รีสอร์ทจอมเทียน",
            sim_sc_resort_desc: "พูดคุยกับพนักงานต้อนรับเกี่ยวกับสิ่งอำนวยความสะดวกและเงินประกัน",
            sim_handsfree_badge: "🎧 เปิดใช้งานโหมดแฮนด์ฟรี",
            book_tag: "จองโดยตรง",
            book_title: "เช่าหูฟัง True Time Thai W4 Pro",
            book_lead: "วางแผนการเดินทางของคุณอย่างไร้กังวล คำนวณราคาและจองหูฟัง AI ได้ทันทีเพื่อรับเครื่องด้วยตัวเองหรือรับบริการส่งฟรีในพัทยา",
            form_title: "ข้อมูลการจอง",
            form_label_start: "วันที่เริ่มต้นการเช่า",
            form_label_end: "วันที่สิ้นสุดการเช่า",
            form_label_qty: "จำนวนชุด W4 Pro",
            form_label_loc: "สถานที่รับและคืนเครื่อง",
            form_opt_office: "สำนักงาน True Time Thai - ถนนเลียบชายหาดพัทยา",
            form_opt_hotel: "บริการส่งที่โรงแรมในพัทยา (ฟรี)",
            form_label_extras: "ตัวเลือกเสริมสำหรับพัทยา",
            form_extra_sim_title: "ซิมการ์ดท้องถิ่น 5G (+ ฿350 / €10)",
            form_extra_sim_desc: "อินเทอร์เน็ตไม่จำกัดสำหรับการแปลภาษา AI แบบออฟไลน์เรียลไทม์และแผนที่",
            form_extra_pb_title: "พาวเวอร์แบงก์เกรดพรีเมียม (+ ฿175 / €5)",
            form_extra_pb_desc: "มีพลังงานสำรองเสมอสำหรับการใช้งานโทรศัพท์และเคสชาร์จขณะเดินทาง",
            form_label_name: "ชื่อ-นามสกุล",
            form_placeholder_name: "เช่น สมชาย ใจดี",
            form_label_email: "ที่อยู่อีเมล",
            form_placeholder_email: "เช่น somchai@example.com",
            form_btn_submit: "ยืนยันการขอเช่า",
            receipt_title: "ใบแจ้งหนี้ค่าเช่า",
            receipt_period_label: "ระยะเวลาเช่า:",
            receipt_total_thb: "ยอดรวม (THB):",
            receipt_total_eur: "ยอดรวม (ประมาณการ EUR):",
            receipt_foot_1: "✓ ไม่ต้องวางเงินประกันเมื่อตรวจสอบบัตรเครดิตแล้ว",
            receipt_foot_2: "✓ ยกเลิกฟรีสูงสุด 24 ชั่วโมงก่อนเริ่มต้นใช้งาน",
            receipt_hygiene_badge: "🧼 ผ่านการฆ่าเชื้อด้วย UV-C",
            success_title: "ส่งคำขอจองเรียบร้อยแล้ว!",
            success_desc_1: "ขอบคุณสำหรับการจองกับ True Time Thai ทางเราได้ส่งอีเมลยืนยันไปที่ ",
            success_desc_2: "ใบรับเครื่องดิจิทัลและคำแนะนำเพิ่มเติมสำหรับสถานที่ที่คุณเลือกจะถูกส่งให้คุณในไม่ช้า",
            success_btn_new: "ทำการจองใหม่",
            hyg_tag: "ความปลอดภัยต้องมาก่อน",
            hyg_title: "ข้อมูลและระเบียบการด้านสุขอนามัยที่เข้มงวด",
            hyg_lead: "เราเข้าใจดีว่าสุขอนามัยเป็นสิ่งสำคัญอย่างยิ่งในการใช้เทคโนโลยีร่วมกัน นั่นคือเหตุผลที่เราใช้มาตรฐานการทำความสะอาดระดับการแพทย์",
            hyg_step1_title: "การฆ่าเชื้อด้วย UV-C",
            hyg_step1_desc: "หูฟังและเคสชาร์จทุกชุดจะผ่านการฆ่าเชื้ออย่างเข้มข้นในตู้อบแสง UV-C ระดับอุตสาหกรรม ซึ่งจะช่วยกำจัดแบคทีเรียและไวรัสได้ถึง 99.9%",
            hyg_step2_title: "ทำความสะอาดระดับการแพทย์",
            hyg_step2_desc: "หูฟัง W4 Pro จะถูกเช็ดทำความสะอาดและฆ่าเชื้อด้วยมือ โดยใช้แผ่นเช็ดฆ่าเชื้อเกรดการแพทย์แบบไม่มีแอลกอฮอล์และย่อยสลายได้ทางชีวภาพซึ่งออกแบบมาเฉพาะสำหรับอุปกรณ์เสียง",
            hyg_step3_title: "การปิดผนึกและการตรวจสอบ",
            hyg_step3_desc: "หลังจากการทดสอบเสียงและตรวจสอบแบตเตอรี่อย่างละเอียด แพ็คเกจจะถูกปิดผนึกแบบสุญญากาศในบรรจุภัณฑ์เพื่อสุขอนามัย คุณจะเป็นผู้แกะซีลด้วยตัวเองเมื่อได้รับเครื่อง",
            tab_comfort: "ความสะดวกสบาย",
            tab_uvc: "การฆ่าเชื้อด้วย UV-C",
            tab_reiniging: "การทำความสะอาด",
            tab_pasvorm: "ความกระชับ",
            tab_verzegeling: "การปิดผนึก",
            hyg_dynamic_title: "อิสระ 100% และเสียงที่เป็นธรรมชาติ",
            hyg_dynamic_text: "<p>สัมผัสประสบการณ์ใหม่ของความสะดวกสบายทางเสียงภายใต้แสงแดดของเมืองไทย เนื่องจากหูฟังของเราลอยอยู่<em>เหนือ</em>รูหูของคุณแทนที่จะสอดเข้าไปข้างใน คุณจึงเพลิดเพลินกับเพลงโปรดหรือการแปลภาษาแบบเรียลไทม์ได้โดยไม่มีเหงื่อสะสมหรือแรงกดทับ เหมาะสำหรับวันทำกิจกรรมบนชายหาดจอมเทียนและเดินเล่นในพัทยา!</p>",
            hyg_cap_1: "สวมใส่สบายและถูกสุขอนามัย",
            hyg_cap_2: "ทำความสะอาดและฆ่าเชื้อเกรดการแพทย์อย่างทั่วถึง",
            hyg_cap_3: "การฆ่าเชื้อด้วย UV-C อย่างเข้มข้น",
            hyg_cap_4: "ดีไซน์แบบเปิดหูที่กระชับพอดี",
            hyg_cap_5: "การปิดผนึกสุญญากาศเพื่อสุขอนามัย 100%",
            pricing_tag: "ราคาที่โปร่งใส",
            pricing_title: "แผนบริการค่าเช่าของเรา",
            pricing_lead: "เลือกแผนการเช่าที่เหมาะสมที่สุดสำหรับทริปพัทยาของคุณ ไม่มีค่าใช้จ่ายแอบแฝง ไม่มีขั้นตอนการวางเงินมัดจำที่ยุ่งยาก",
            plan_1_title: "ผู้สำรวจรายวัน",
            plan_1_sub: "เหมาะสำหรับการออกทริปหรือทัศนศึกษาในหนึ่งวัน",
            plan_1_price_period: "/ วัน (~ €6.75)",
            plan_1_feat_1: "✓ หูฟัง True Time Thai W4 Pro 1 ชุด",
            plan_1_feat_2: "✓ เคสชาร์จและสาย USB ในตัว",
            plan_1_feat_3: "✓ รวมบริการแปล 102 ภาษา",
            plan_1_feat_4: "✓ รับเครื่องด้วยตัวเองที่สำนักงานพัทยา",
            plan_1_feat_5: "✗ ไม่มีส่วนลดรายสัปดาห์",
            plan_btn: "เลือกแผนนี้",
            plan_2_badge: "ยอดนิยม",
            plan_2_title: "ผู้ท่องเที่ยวพักผ่อน",
            plan_2_sub: "ลงตัวสำหรับการท่องเที่ยวพักผ่อนในพัทยา",
            plan_2_price_period: "/ วัน (~ €5.40)",
            plan_2_feat_1: "✓ หูฟัง True Time Thai W4 Pro 1 ชุด",
            plan_2_feat_2: "✓ เคสชาร์จและสาย USB ในตัว",
            plan_2_feat_3: "✓ <strong>ส่วนลด 20%</strong> เมื่อเช่า 5 วันขึ้นไป",
            plan_2_feat_4: "✓ บริการส่งถึงโรงแรมในพัทยาฟรี",
            plan_2_feat_5: "✓ บริการช่วยเหลือหลายภาษาผ่าน WhatsApp",
            plan_3_title: "นักธุรกิจและผู้อยู่อาศัย",
            plan_3_sub: "สำหรับการพำนักระยะยาวหรือความสำเร็จทางธุรกิจ",
            plan_3_price_period: "/ วัน (~ €4.05)",
            plan_3_feat_1: "✓ หูฟัง True Time Thai W4 Pro 1 ชุด",
            plan_3_feat_2: "✓ เคสชาร์จและสาย USB ในตัว",
            plan_3_feat_3: "✓ อัตราพิเศษระยะยาว (30 วันขึ้นไป)",
            plan_3_feat_4: "✓ บริการส่งระดับ VIP ถึงหน้าโรงแรม",
            plan_3_feat_5: "✓ บริการช่วยเหลือระดับพรีเมียมตลอด 24 ชั่วโมง",
            faq_tag: "คำถาม?",
            faq_title: "คำถามที่พบบ่อย",
            faq_lead: "มีคำถามข้อสงสัยใช่ไหม? ค้นหาคำตอบได้ที่นี่เลย",
            reviews_tag: "ประสบการณ์",
            reviews_title: "รีวิวจากผู้เช่าของเรา",
            reviews_lead: "อ่านเรื่องราวความคิดเห็นอิสระจากนักท่องเที่ยวและผู้พำนักที่ได้สำรวจพัทยาด้วย True Time Thai W4 Pro",
            reviews_box_title: "สิ่งที่ลูกค้าของเราบอกเล่า",
            rev_1_text: "\"ตอนแรกฉันค่อนข้างลังเลเกี่ยวกับการแปลภาษาแบบเรียลไทม์ แต่หูฟังนี้ยอดเยี่ยมมากจริงๆ ที่ตลาดปลาลานโพธิ์นาเกลือ ฉันสามารถปล่อยมุกและต่อรองราคากับพ่อค้าได้ทันที พวกเขาชอบมากที่ฉันโต้ตอบเป็นภาษาไทยได้ ถือเป็นไฮไลท์ของทริปเลย!\"",
            rev_1_author: "Matthijs Radder",
            rev_1_details: "นักท่องเที่ยวจากร็อตเตอร์ดัม",
            rev_2_text: "\"ในฐานะผู้อยู่อาศัยในจอมเทียน ฉันพูดภาษาไทยได้นิดหน่อย แต่เวลาต้องคุยเรื่องยากๆ เช่น สัญญาเช่าหรือเรื่องวีซ่า ฉันมักจะติดขัดเสมอ W4 Pro ช่วยฉันได้มาก แปลได้เร็วมากและไมโครโฟนคู่ตัดเสียงรบกวนรอบข้างได้ดีเยี่ยม\"",
            rev_2_author: "Sarah Jenkins",
            rev_2_details: "ผู้อยู่อาศัยจากเบอร์มิงแฮม สหราชอาณาจักร",
            rev_3_text: "\"เรื่องสุขอนามัยยอดเยี่ยมมาก! นั่นเป็นความกังวลที่ใหญ่ที่สุดของฉัน แต่หูฟังถูกปิดผนึกสุญญากาศมาในแพ็คเกจและสะอาดมาก เนื่องจากหูฟังเกี่ยวอยู่บนหูและไม่ได้สอดเข้าไปด้านใน คุณจึงไม่มีเหงื่อออกแม้ในวันที่อากาศร้อนของเมืองไทย บริการส่งก็ราบรื่นมาก\"",
            rev_3_author: "Dieter Meyer",
            rev_3_details: "นักเดินทางติดต่อธุรกิจจากแฟรงก์เฟิร์ต",
            rev_4_text: "\"ฉันกับแฟนเช่าหูฟังสองชุดสำหรับทริปท่องเที่ยวในชลบุรี การแชร์ประสบการณ์กับคนท้องถิ่นกลายเป็นเรื่องที่ใกล้ชิดและพิเศษมาก เราได้ค้นพบร้านอาหารท้องถิ่นที่ยอดเยี่ยมซึ่งไม่มีใครพูดภาษาอังกฤษได้เลย ทริปนี้คงไม่สมบูรณ์หากไม่มีหูฟังนี้\"",
            rev_4_author: "Jan & Annelies",
            rev_4_details: "นักท่องเที่ยวจากแอนต์เวิร์ป",
            reviews_cta_title: "ต้องการแบ่งปันประสบการณ์ของคุณไหม?",
            reviews_cta_desc: "หากคุณเพิ่งเช่าหูฟัง True Time Thai และต้องการแชร์เรื่องราวของคุณ ส่งรีวิวให้เราผ่าน WhatsApp และรับส่วนลด 10% สำหรับการเช่าครั้งต่อไป!",
            reviews_cta_btn: "แชร์ประสบการณ์ผ่าน WhatsApp",
            terms_tag: "ความชัดเจน",
            terms_title: "เงื่อนไขการเช่าทั่วไป",
            terms_lead: "กฎเกณฑ์ที่โปร่งใสเพื่อประสบการณ์การแปลที่ไร้กังวล ไม่มีข้อความซ่อนเร้น มีเพียงข้อตกลงที่ชัดเจน",
            terms_tab_1: "1. การรับและคืนเครื่อง",
            terms_tab_2: "2. เงินประกันและบัตรประชาชน",
            terms_tab_3: "3. ความเสียหายและการประกันภัย",
            terms_tab_4: "4. การยกเลิกและการเปลี่ยนแปลง",
            contact_title: "ติดต่อเรา",
            contact_desc: "หากคุณมีคำถามเฉพาะเกี่ยวกับการจอง การเช่าระยะยาว หรือการเป็นพันธมิตร ส่งข้อความหาเราได้โดยตรง",
            contact_label_name: "ชื่อ",
            contact_placeholder_name: "ชื่อของคุณ",
            contact_label_email: "อีเมล",
            contact_placeholder_email: "ที่อยู่อีเมลของคุณ",
            contact_label_msg: "ข้อความ",
            contact_placeholder_msg: "พิมพ์ข้อความของคุณที่นี่...",
            contact_btn_submit: "ส่งข้อความ",
            contact_success: "✓ ส่งข้อความของคุณเรียบร้อยแล้ว! เราจะตอบกลับภายใน 2 ชั่วโมงทาง WhatsApp หรืออีเมล",
            info_office_title: "สำนักงานใหญ่:",
            info_phone_title: "โทรศัพท์ / WhatsApp:",
            info_email_title: "อีเมล:",
            info_hours_title: "เวลาทำการ:",
            info_hours_desc: "ทุกวัน เวลา 08:00 ถึง 22:00 น. (เวลาประเทศไทย)",
            contact_carousel_cap_1: "ร้านของเราในพัทยา",
            contact_carousel_cap_2: "รับเครื่องโดยตรงที่สำนักงานของเราบนถนนเลียบชายหาดพัทยา",
            contact_carousel_cap_3: "ทีมงานของเราพร้อมให้บริการคุณ",
            footer_copyright: "&copy; 2026 True Time Thai. สงวนลิขสิทธิ์ทั้งหมด",
            footer_link_1: "นโยบายสุขอนามัย",
            footer_link_2: "เงื่อนไขการเช่า",
            footer_link_3: "นโยบายความเป็นส่วนตัว"
        }
    };

    const simTextTranslations = {
        nl: {
            startTip: "💡 Klik op \"Start Gesprek\" om het AI-vertaalgesprek te beginnen.",
            inProgress: "AI Vertaling in uitvoering...",
            touristSpeaking: "U bent aan het praten...",
            youTourist: "U (Toerist)",
            translationLabel: "AI Vertaling",
            localResponding: "Lokale partner antwoordt...",
            completed: "Gesprek succesvol afgerond! 🎉",
            chooseReset: "Kies een ander scenario of start opnieuw",
            startBtn: "Start Gesprek",
            resetBtn: "Reset"
        },
        en: {
            startTip: "💡 Click \"Start Conversation\" to begin the AI-translated chat.",
            inProgress: "AI Translation in progress...",
            touristSpeaking: "You are speaking...",
            youTourist: "You (Tourist)",
            translationLabel: "AI Translation",
            localResponding: "Local partner is responding...",
            completed: "Conversation completed successfully! 🎉",
            chooseReset: "Choose another scenario or start over",
            startBtn: "Start Conversation",
            resetBtn: "Reset"
        },
        th: {
            startTip: "💡 คลิก \"เริ่มสนทนา\" เพื่อเริ่มต้นการทดลองแปลภาษา AI",
            inProgress: "กำลังแปลภาษาผ่าน AI...",
            touristSpeaking: "นักท่องเที่ยวต้องการพูด...",
            youTourist: "นักท่องเที่ยว (ชาวต่างชาติ)",
            translationLabel: "คำแปล AI",
            localResponding: "คู่สนทนาคนไทยกำลังพูด...",
            completed: "เสร็จสิ้นบทสนทนาเรียบร้อยแล้ว! 🎉",
            chooseReset: "เลือกสถานการณ์อื่นหรือเริ่มใหม่",
            startBtn: "เริ่มสนทนา",
            resetBtn: "รีเซ็ต"
        }
    };

    function getSimText(key) {
        return simTextTranslations[activeLang][key] || key;
    }

    const marketNodesNL = {
        greet: {
            tourist: {
                text: "Hallo, hoeveel kost deze vis?",
                translation: "สวัสดีครับ ปลาตัวนี้ราคาเท่าไหร่ครับ (Sawatdee krap. Pla tua nee raka tao rai krap)"
            },
            local: {
                name: "Vishandelaar",
                text: "ปลาตัวนี้กิโลละสองร้อยบาทครับ (Pla tua nee kilo la song roi baht krap)",
                translation: "Deze vis kost tweehonderd baht per kilo."
            },
            choices: [
                { text: "Vraag om korting", nextNode: "discount" },
                { text: "Bestel een kilo", nextNode: "order" }
            ]
        },
        discount: {
            tourist: {
                text: "Kan ik korting krijgen als ik twee kilo neem?",
                translation: "ลดหน่อยได้ไหมครับถ้าซื้อสองกิโล (Lod noi dai mai krap tha bue song kilo)"
            },
            local: {
                name: "Vishandelaar",
                text: "ได้ครับ สองกิโลคิดให้สามร้อยห้าสิบบาทครับ (Dai krap. Song kilo kid hai sam roi ha sip baht krap)",
                translation: "Ja hoor, voor twee kilo maak ik er driehonderdvijftig baht van."
            },
            choices: [
                { text: "Koop twee kilo", nextNode: "order_two" },
                { text: "Niet mee akkoord gaan", nextNode: "decline" }
            ]
        },
        order: {
            tourist: {
                text: "Ik wil graag een kilo van deze vis.",
                translation: "ขอซื้อปลาตัวนี้หนึ่งกิโลครับ (Khor bue pla tua nee nung kilo krap)"
            },
            local: {
                name: "Vishandelaar",
                text: "ได้ครับ นี่ครับผม สองร้อยบาทครับ (Dai krap. Nee krap pom, song roi baht krap)",
                translation: "Natuurlijk. Hier is de vis. Dat is tweehonderd baht."
            },
            choices: [
                { text: "Betaal 200 baht", nextNode: "complete" }
            ]
        },
        order_two: {
            tourist: {
                text: "Super, doe maar twee kilo.",
                translation: "ตกลงครับ เอาสองกิโลครับ (Tok long krap. Ao song kilo krap)"
            },
            local: {
                name: "Vishandelaar",
                text: "เรียบร้อยครับ สองกิโล สามร้อยห้าสิบบาทครับ (Riap roi krap. Song kilo, sam roi ha sip baht krap)",
                translation: "Alstublieft. Twee kilo voor driehonderdvijftig baht."
            },
            choices: [
                { text: "Betaal 350 baht", nextNode: "complete" }
            ]
        },
        decline: {
            tourist: {
                text: "Dat is te duur voor mij, toch bedankt.",
                translation: "แพงไปหน่อยครับ ขอบคุณครับ (Phaeng pai noi krap. Khop khun krap)"
            },
            local: {
                name: "Vishandelaar",
                text: "ไม่เป็นไรครับผม โอกาสหน้าเชิญใหม่ครับ (Mai pen rai krap pom. O-kat na chern mai krap)",
                translation: "Geen probleem hoor. Fijne dag en tot de volgende keer!"
            },
            choices: []
        },
        complete: {
            tourist: {
                text: "Dank u wel!",
                translation: "ขอบคุณมากครับ (Khop khun mak krap)"
            },
            local: {
                name: "Vishandelaar",
                text: "ขอบคุณมากครับ ขอให้ทานให้อร่อยนะ! (Khop khun mak krap. Khor hai tan hai a-roi na!)",
                translation: "Dank u wel! Eet smakelijk van de vis!"
            },
            choices: []
        }
    };

    const marketNodesEN = {
        greet: {
            tourist: {
                text: "Hello, how much is this fish?",
                translation: "สวัสดีครับ ปลาตัวนี้ราคาเท่าไหร่ครับ (Sawatdee krap. Pla tua nee raka tao rai krap)"
            },
            local: {
                name: "Fishmonger",
                text: "ปลาตัวนี้กิโลละสองร้อยบาทครับ (Pla tua nee kilo la song roi baht krap)",
                translation: "This fish is two hundred baht per kilo."
            },
            choices: [
                { text: "Ask for a discount", nextNode: "discount" },
                { text: "Order one kilo", nextNode: "order" }
            ]
        },
        discount: {
            tourist: {
                text: "Can I get a discount if I buy two kilos?",
                translation: "ลดหน่อยได้ไหมครับถ้าซื้อสองกิโล (Lod noi dai mai krap tha bue song kilo)"
            },
            local: {
                name: "Fishmonger",
                text: "ได้ครับ สองกิโลคิดให้สามร้อยห้าสิบบาทครับ (Dai krap. Song kilo kid hai sam roi ha sip baht krap)",
                translation: "Sure, for two kilos I can make it three hundred and fifty baht."
            },
            choices: [
                { text: "Buy two kilos", nextNode: "order_two" },
                { text: "Decline", nextNode: "decline" }
            ]
        },
        order: {
            tourist: {
                text: "I would like one kilo of this fish, please.",
                translation: "ขอซื้อปลาตัวนี้หนึ่งกิโลครับ (Khor bue pla tua nee nung kilo krap)"
            },
            local: {
                name: "Fishmonger",
                text: "ได้ครับ นี่ครับผม สองร้อยบาทครับ (Dai krap. Nee krap pom, song roi baht krap)",
                translation: "Sure. Here you go. That's two hundred baht."
            },
            choices: [
                { text: "Pay 200 baht", nextNode: "complete" }
            ]
        },
        order_two: {
            tourist: {
                text: "Great, make it two kilos.",
                translation: "ตกลงครับ เอาสองกิโลครับ (Tok long krap. Ao song kilo krap)"
            },
            local: {
                name: "Fishmonger",
                text: "เรียบร้อยครับ สองกิโล สามร้อยห้าสิบบาทครับ (Riap roi krap. Song kilo, sam roi ha sip baht krap)",
                translation: "Here you go. Two kilos, three hundred and fifty baht."
            },
            choices: [
                { text: "Pay 350 baht", nextNode: "complete" }
            ]
        },
        decline: {
            tourist: {
                text: "That is too expensive for me, thank you though.",
                translation: "แพงไปหน่อยครับ ขอบคุณครับ (Phaeng pai noi krap. Khop khun krap)"
            },
            local: {
                name: "Fishmonger",
                text: "ไม่เป็นไรครับผม โอกาสหน้าเชิญใหม่ครับ (Mai pen rai krap pom. O-kat na chern mai krap)",
                translation: "No problem. Hope to see you again next time!"
            },
            choices: []
        },
        complete: {
            tourist: {
                text: "Thank you very much!",
                translation: "ขอบคุณมากครับ (Khop khun mak krap)"
            },
            local: {
                name: "Fishmonger",
                text: "ขอบคุณมากครับ ขอให้ทานให้อร่อยนะ! (Khop khun mak krap. Khor hai tan hai a-roi na!)",
                translation: "Thank you! Enjoy your meal!"
            },
            choices: []
        }
    };

    const taxiNodesNL = {
        greet: {
            tourist: {
                text: "Hallo, gaat u naar Walking Street?",
                translation: "สวัสดีครับ ไปถนนคนเดินวอล์คกิ้งสตรีทไหมครับ (Sawatdee krap. Pai thonon kon dern Walking Street mai krap)"
            },
            local: {
                name: "Chauffeur",
                text: "ไปครับ ขึ้นมาเลยครับผม คนละยี่สิบบาทครับ (Pai krap. Khun ma loey krap pom. Kon la yee sip baht krap)",
                translation: "Jazeker, stap maar in. Het is twintig baht per persoon."
            },
            choices: [
                { text: "Stap in en ga akkoord", nextNode: "complete" },
                { text: "Vraag of hij rechtstreeks gaat", nextNode: "direct" }
            ]
        },
        direct: {
            tourist: {
                text: "Rijdt u direct, of stopt u onderweg nog?",
                translation: "เหมาไปส่งตรงเลยไหมครับ หรือว่าจอดรับคนรายทางด้วย (Mao pai song trong loey mai krap? Ruer wa jod rab kon rai thang duay)"
            },
            local: {
                name: "Chauffeur",
                text: "ถ้าเหมาตรงไปเลย คิดสองร้อยบาทครับผม (Tha mao trong pai loey, kid song roi baht krap pom)",
                translation: "Als we rechtstreeks gaan zonder andere stops, kost het tweehonderd baht."
            },
            choices: [
                { text: "Akkoord, rijdt direct (200 baht)", nextNode: "complete_direct" },
                { text: "Nee, doe maar de normale rit (20 baht)", nextNode: "complete" }
            ]
        },
        complete: {
            tourist: {
                text: "Prima, we stappen in. Dank u.",
                translation: "ตกลงครับ ขึ้นรถเลยครับ ขอบคุณครับ (Tok long krap. Khun rod loey krap. Khop khun krap)"
            },
            local: {
                name: "Chauffeur",
                text: "ยินดีครับ ถึงแล้วจะบอกนะครับผม (Yindee krap. Thueng laew jaบอก na krap pom)",
                translation: "Graag gedaan. Ik geef een seintje als we er zijn."
            },
            choices: []
        },
        complete_direct: {
            tourist: {
                text: "Oké, 200 baht is goed. Breng ons er direct heen.",
                translation: "ตกลงครับ สองร้อยบาท ไปเลยครับ (Tok long krap. Song roi baht. Pai loey krap)"
            },
            local: {
                name: "Chauffeur",
                text: "ได้เลยครับ เดินทางด่วนตรงไปเลยครับผม (Dai loey krap. Dern thang duan trong pai loey krap pom)",
                translation: "Afgesproken! We vertrekken meteen rechtstreeks."
            },
            choices: []
        }
    };

    const taxiNodesEN = {
        greet: {
            tourist: {
                text: "Hello, are you going to Walking Street?",
                translation: "สวัสดีครับ ไปถนนคนเดินวอล์คกิ้งสตรีทไหมครับ (Sawatdee krap. Pai thonon kon dern Walking Street mai krap)"
            },
            local: {
                name: "Driver",
                text: "ไปครับ ขึ้นมาเลยครับผม คนละยี่สิบบาทครับ (Pai krap. Khun ma loey krap pom. Kon la yee sip baht krap)",
                translation: "Yes, get in. It is twenty baht per person."
            },
            choices: [
                { text: "Get in and agree", nextNode: "complete" },
                { text: "Ask if he goes directly", nextNode: "direct" }
            ]
        },
        direct: {
            tourist: {
                text: "Are you driving directly, or stopping along the way?",
                translation: "เหมาไปส่งตรงเลยไหมครับ หรือว่าจอดรับคนรายทางด้วย (Mao pai song trong loey mai krap? Ruer wa jod rab kon rai thang duay)"
            },
            local: {
                name: "Driver",
                text: "ถ้าเหมาตรงไปเลย คิดสองร้อยบาทครับผม (Tha mao trong pai loey, kid song roi baht krap pom)",
                translation: "If you want a private ride straight there, it is two hundred baht."
            },
            choices: [
                { text: "Agree to direct ride (200 baht)", nextNode: "complete_direct" },
                { text: "No, normal ride is fine (20 baht)", nextNode: "complete" }
            ]
        },
        complete: {
            tourist: {
                text: "Great, we'll get in. Thanks.",
                translation: "ตกลงครับ ขึ้นรถเลยครับ ขอบคุณครับ (Tok long krap. Khun rod loey krap. Khop khun krap)"
            },
            local: {
                name: "Driver",
                text: "ยินดีครับ ถึงแล้วจะบอกนะครับผม (Yindee krap. Thueng laew jaบอก na krap pom)",
                translation: "You're welcome. I'll let you know when we arrive."
            },
            choices: []
        },
        complete_direct: {
            tourist: {
                text: "Okay, 200 baht is fine. Take us straight there.",
                translation: "ตกลงครับ สองร้อยบาท ไปเลยครับ (Tok long krap. Song roi baht. Pai loey krap)"
            },
            local: {
                name: "Driver",
                text: "ได้เลยครับ เดินทางด่วนตรงไปเลยครับผม (Dai loey krap. Dern thang duan trong pai loey krap pom)",
                translation: "All right! Heading straight there immediately."
            },
            choices: []
        }
    };

    const resortNodesNL = {
        greet: {
            tourist: {
                text: "Hallo, ik wil graag inchecken onder de naam de Vries.",
                translation: "สวัสดีครับ ขอเช็คอินในชื่อ เดอ ฟรีส ครับ (Sawatdee krap. Khor check-in nai chue de Vries krap)"
            },
            local: {
                name: "Receptionist",
                text: "สวัสดีค่ะ ขอต้อนรับสู่รีสอร์ทค่ะ ขอหนังสือเดินทางเพื่อสแกนด้วยค่ะ (Sawatdee ka. Khor ton rab su resort ka. Khor nangsue dern thang phuer scan duay ka)",
                translation: "Hallo! Welkom bij het resort. Mag ik uw paspoort voor de scan?"
            },
            choices: [
                { text: "Geef paspoort", nextNode: "passport" }
            ]
        },
        passport: {
            tourist: {
                text: "Alstublieft, hier is mijn paspoort.",
                translation: "นี่ครับ หนังสือเดินทางของผม (Nee krap, nangsue dern thang khong pom)"
            },
            local: {
                name: "Receptionist",
                text: "ขอบคุณค่ะ ขออนุญาตเก็บเงินประกันคีย์การ์ดหนึ่งduizendบาทนะคะ ได้คืนตอนเช็คเอาท์ค่ะ (Khop khun ka. Khor anu-yatเก็บ ngerndeposit keycard nung phan baht na ka. Dai kuen torn check-out ka)",
                translation: "Dank u. Ik moet een borgsom van duizend baht vragen voor de kamersleutel. Deze krijgt u terug bij het uitchecken."
            },
            choices: [
                { text: "Betaal borg (1000 baht)", nextNode: "deposit" },
                { text: "Vraag naar ontbijt", nextNode: "breakfast" }
            ]
        },
        deposit: {
            tourist: {
                text: "Prima, hier is duizend baht borg.",
                translation: "ตกลงครับ นี่เงินประกันหนึ่งพันบาทครับ (Tok long krap. Nee ngern deposit nung phan baht krap)"
            },
            local: {
                name: "Receptionist",
                text: "ได้รับเรียบร้อยค่ะ นี่คีย์การ์ดห้องห้าศูนย์สองนะคะ ห้องอยู่ชั้นห้าค่ะ (Dai rab riap roi ka. Nee keycard hong ha-suan-song na ka. Hong yoo chan ha ka)",
                translation: "Dank u wel. Hier is de sleutelkaart voor kamer 502. Uw kamer bevindt zich op de vijfde verdieping."
            },
            choices: [
                { text: "Bedankt en ga naar kamer", nextNode: "complete" }
            ]
        },
        breakfast: {
            tourist: {
                text: "Is het ontbijt inbegrepen in de boeking?",
                translation: "ราคานี้รวมอาหารเช้าด้วยไหมครับ (Raka nee ruam a-han chao duay mai krap)"
            },
            local: {
                name: "Receptionist",
                text: "รวมเรียบร้อยค่ะ อาหารเช้าเริ่มเจ็ดโมงถึงสิบโมงเช้าที่ห้องอาหารริมหาดค่ะ (Ruam riap roi ka. A-han chao rerm jet mong thueng sip mong chao thee hong a-han rim had ka)",
                translation: "Ja, het ontbijt is inbegrepen. Het wordt geserveerd van 07:00 tot 10:00 uur in ons restaurant aan het strand."
            },
            choices: [
                { text: "Betaal borg en check in", nextNode: "deposit" }
            ]
        },
        complete: {
            tourist: {
                text: "Perfect, hartelijk dank voor de hulp!",
                translation: "ขอบคุณมากครับสำหรับความช่วยเหลือ (Khop khun mak krap sam-rab khwam chuay luer)"
            },
            local: {
                name: "Receptionist",
                text: "ด้วยความยินดีค่ะ ขอให้มีความสุขในการพักผ่อนนะคะ! (Duay khwam yin dee ka. Khor hai mee khwam suk nai kar pak phon na ka!)",
                translation: "Heel graag gedaan. Geniet van uw verblijf bij ons!"
            },
            choices: []
        }
    };

    const resortNodesEN = {
        greet: {
            tourist: {
                text: "Hello, I would like to check in under the name de Vries.",
                translation: "สวัสดีครับ ขอเช็คอินในชื่อ เดอ ฟรีส ครับ (Sawatdee krap. Khor check-in nai chue de Vries krap)"
            },
            local: {
                name: "Receptionist",
                text: "สวัสดีค่ะ ขอต้อนรับสู่รีสอร์ทค่ะ ขอหนังสือเดินทางเพื่อสแกนด้วยค่ะ (Sawatdee ka. Khor ton rab su resort ka. Khor nangsue dern thang phuer scan duay ka)",
                translation: "Hello! Welcome to our resort. May I have your passport to scan, please?"
            },
            choices: [
                { text: "Give passport", nextNode: "passport" }
            ]
        },
        passport: {
            tourist: {
                text: "Here is my passport.",
                translation: "นี่ครับ หนังสือเดินทางของผม (Nee krap, nangsue dern thang khong pom)"
            },
            local: {
                name: "Receptionist",
                text: "ขอบคุณค่ะ ขออนุญาตเก็บเงินประกันคีย์การ์ดหนึ่งพันบาทนะคะ ได้คืนตอนเช็คเอาท์ค่ะ (Khop khun ka. Khor anu-yatเก็บ ngerndeposit keycard nung phan baht na ka. Dai kuen torn check-out ka)",
                translation: "Thank you. I need to collect a keycard deposit of one thousand baht, which is fully refundable at check-out."
            },
            choices: [
                { text: "Pay deposit (1000 baht)", nextNode: "deposit" },
                { text: "Ask about breakfast", nextNode: "breakfast" }
            ]
        },
        deposit: {
            tourist: {
                text: "Sure, here is one thousand baht.",
                translation: "ตกลงครับ นี่เงินประกันหนึ่งพันบาทครับ (Tok long krap. Nee ngern deposit nung phan baht krap)"
            },
            local: {
                name: "Receptionist",
                text: "ได้รับเรียบร้อยค่ะ นี่คีย์การ์ดห้องห้าศูนย์สองนะคะ ห้องอยู่ชั้นห้าค่ะ (Dai rab riap roi ka. Nee keycard hong ha-suan-song na ka. Hong yoo chan ha ka)",
                translation: "Thank you. Here is your keycard for room 502. It's on the fifth floor."
            },
            choices: [
                { text: "Thank you, heading to room", nextNode: "complete" }
            ]
        },
        breakfast: {
            tourist: {
                text: "Is breakfast included in my room booking?",
                translation: "ราคานี้รวมอาหารเช้าด้วยไหมครับ (Raka nee ruam a-han chao duay mai krap)"
            },
            local: {
                name: "Receptionist",
                text: "รวมเรียบร้อยค่ะ อาหารเช้าเริ่มเจ็ดโมงถึงสิบโมงเช้าที่ห้องอาหารริมหาดค่ะ (Ruam riap roi ka. A-han chao rerm jet mong thueng sip mong chao thee hong a-han rim had ka)",
                translation: "Yes, it is included. Breakfast is served from 7:00 AM to 10:00 AM at the beachfront restaurant."
            },
            choices: [
                { text: "Pay deposit and check in", nextNode: "deposit" }
            ]
        },
        complete: {
            tourist: {
                text: "Perfect, thank you for your help!",
                translation: "ขอบคุณมากครับสำหรับความช่วยเหลือ (Khop khun mak krap sam-rab khwam chuay luer)"
            },
            local: {
                name: "Receptionist",
                text: "ด้วยความยินดีค่ะ ขอให้มีความสุขในการพักผ่อนนะคะ! (Duay khwam yin dee ka. Khor hai mee khwam suk nai kar pak phon na ka!)",
                translation: "You are very welcome. Have a wonderful stay with us!"
            },
            choices: []
        }
    };

    const marketNodesTH = {
        greet: {
            tourist: {
                text: "Hello, how much is this fish?",
                translation: "สวัสดีครับ ปลาตัวนี้ราคาเท่าไหร่ครับ (Sawatdee krap. Pla tua nee raka tao rai krap)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "ปลาตัวนี้กิโลละสองร้อยบาทครับ (Pla tua nee kilo la song roi baht krap)",
                translation: "ปลาตัวนี้ราคา 200 บาทต่อกิโลกรัม (This fish is two hundred baht per kilo.)"
            },
            choices: [
                { text: "ขอส่วนลด", nextNode: "discount" },
                { text: "สั่งซื้อ 1 กิโลกรัม", nextNode: "order" }
            ]
        },
        discount: {
            tourist: {
                text: "Can I get a discount if I buy two kilos?",
                translation: "ลดหน่อยได้ไหมครับถ้าซื้อสองกิโล (Lod noi dai mai krap tha bue song kilo)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "ได้ครับ สองกิโลคิดให้สามร้อยห้าสิบบาทครับ (Dai krap. Song kilo kid hai sam roi ha sip baht krap)",
                translation: "ได้ครับ สองกิโลคิดให้สามร้อยห้าสิบบาทครับ (Sure, for two kilos I can make it three hundred and fifty baht.)"
            },
            choices: [
                { text: "ซื้อสองกิโลกรัม", nextNode: "order_two" },
                { text: "ปฏิเสธ/ไม่ตกลง", nextNode: "decline" }
            ]
        },
        order: {
            tourist: {
                text: "I would like one kilo of this fish, please.",
                translation: "ขอซื้อปลาตัวนี้หนึ่งกิโลครับ (Khor bue pla tua nee nung kilo krap)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "ได้ครับ นี่ครับผม สองร้อยบาทครับ (Dai krap. Nee krap pom, song roi baht krap)",
                translation: "ได้ครับ นี่ครับผม สองร้อยบาทครับ (Sure. Here you go. That's two hundred baht.)"
            },
            choices: [
                { text: "จ่ายเงิน 200 บาท", nextNode: "complete" }
            ]
        },
        order_two: {
            tourist: {
                text: "Great, make it two kilos.",
                translation: "ตกลงครับ เอาสองกิโลครับ (Tok long krap. Ao song kilo krap)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "เรียบร้อยครับ สองกิโล สามร้อยห้าสิบบาทครับ (Riap roi krap. Song kilo, sam roi ha sip baht krap)",
                translation: "เรียบร้อยครับ สองกิโล สามร้อยห้าสิบบาทครับ (Here you go. Two kilos, three hundred and fifty baht.)"
            },
            choices: [
                { text: "จ่ายเงิน 350 บาท", nextNode: "complete" }
            ]
        },
        decline: {
            tourist: {
                text: "That is too expensive for me, thank you though.",
                translation: "แพงไปหน่อยครับ ขอบคุณครับ (Phaeng pai noi krap. Khop khun krap)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "ไม่เป็นไรครับผม โอกาสหน้าเชิญใหม่ครับ (Mai pen rai krap pom. O-kat na chern mai krap)",
                translation: "ไม่เป็นไรครับผม โอกาสหน้าเชิญใหม่ครับ (No problem. Hope to see you again next time!)"
            },
            choices: []
        },
        complete: {
            tourist: {
                text: "Thank you very much!",
                translation: "ขอบคุณมากครับ (Khop khun mak krap)"
            },
            local: {
                name: "พ่อค้าปลา",
                text: "ขอบคุณมากครับ ขอให้ทานให้อร่อยนะ! (Khop khun mak krap. Khor hai tan hai a-roi na!)",
                translation: "ขอบคุณมากครับ ขอให้ทานให้อร่อยนะ! (Thank you! Enjoy your meal!)"
            },
            choices: []
        }
    };

    const taxiNodesTH = {
        greet: {
            tourist: {
                text: "Hello, are you going to Walking Street?",
                translation: "สวัสดีครับ ไปถนนคนเดินวอล์คกิ้งสตรีทไหมครับ (Sawatdee krap. Pai thonon kon dern Walking Street mai krap)"
            },
            local: {
                name: "คนขับรถสองแถว",
                text: "ไปครับ ขึ้นมาเลยครับผม คนละยี่สิบบาทครับ (Pai krap. Khun ma loey krap pom. Kon la yee sip baht krap)",
                translation: "ไปครับ ขึ้นมาเลยครับผม คนละยี่สิบบาทครับ (Yes, get in. It is twenty baht per person.)"
            },
            choices: [
                { text: "ขึ้นรถและตกลงตามราคานี้", nextNode: "complete" },
                { text: "ถามว่าเขาไปส่งตรงเลยไหม (เหมา)", nextNode: "direct" }
            ]
        },
        direct: {
            tourist: {
                text: "Are you driving directly, or stopping along the way?",
                translation: "เหมาไปส่งตรงเลยไหมครับ หรือว่าจอดรับคนรายทางด้วย (Mao pai song trong loey mai krap? Ruer wa jod rab kon rai thang duay)"
            },
            local: {
                name: "คนขับรถสองแถว",
                text: "ถ้าเหมาตรงไปเลย คิดสองร้อยบาทครับผม (Tha mao trong pai loey, kid song roi baht krap pom)",
                translation: "ถ้าเหมาตรงไปเลย คิดสองร้อยบาทครับผม (If you want a private ride straight there, it is two hundred baht.)"
            },
            choices: [
                { text: "ตกลง เหมาไปส่งตรงเลย (200 บาท)", nextNode: "complete_direct" },
                { text: "ไม่เป็นไร ไปแบบธรรมดาก็ได้ (20 บาท)", nextNode: "complete" }
            ]
        },
        complete: {
            tourist: {
                text: "Great, we'll get in. Thanks.",
                translation: "ตกลงครับ ขึ้นรถเลยครับ ขอบคุณครับ (Tok long krap. Khun rod loey krap. Khop khun krap)"
            },
            local: {
                name: "คนขับรถสองแถว",
                text: "ยินดีครับ ถึงแล้วจะบอกนะครับผม (Yindee krap. Thueng laew jaบอก na krap pom)",
                translation: "ยินดีครับ ถึงแล้วจะบอกนะครับผม (You're welcome. I'll let you know when we arrive.)"
            },
            choices: []
        },
        complete_direct: {
            tourist: {
                text: "Okay, 200 baht is fine. Take us straight there.",
                translation: "ตกลงครับ สองร้อยบาท ไปเลยครับ (Tok long krap. Song roi baht. Pai loey krap)"
            },
            local: {
                name: "คนขับรถสองแถว",
                text: "ได้เลยครับ เดินทางด่วนตรงไปเลยครับผม (Dai loey krap. Dern thang duan trong pai loey krap pom)",
                translation: "ได้เลยครับ เดินทางด่วนตรงไปเลยครับผม (All right! Heading straight there immediately.)"
            },
            choices: []
        }
    };

    const resortNodesTH = {
        greet: {
            tourist: {
                text: "Hello, I would like to check in under the name de Vries.",
                translation: "สวัสดีครับ ขอเช็คอินในชื่อ เดอ ฟรีส ครับ (Sawatdee krap. Khor check-in nai chue de Vries krap)"
            },
            local: {
                name: "พนักงานต้อนรับ",
                text: "สวัสดีค่ะ ขอต้อนรับสู่รีสอร์ทค่ะ ขอหนังสือเดินทางเพื่อสแกนด้วยค่ะ (Sawatdee ka. Khor ton rab su resort ka. Khor nangsue dern thang phuer scan duay ka)",
                translation: "สวัสดีค่ะ ขอต้อนรับสู่รีสอร์ทค่ะ ขอหนังสือเดินทางเพื่อสแกนด้วยค่ะ (Hello! Welcome to our resort. May I have your passport to scan, please?)"
            },
            choices: [
                { text: "ยื่นหนังสือเดินทางให้", nextNode: "passport" }
            ]
        },
        passport: {
            tourist: {
                text: "Here is my passport.",
                translation: "นี่ครับ หนังสือเดินทางของผม (Nee krap, nangsue dern thang khong pom)"
            },
            local: {
                name: "พนักงานต้อนรับ",
                text: "ขอบคุณค่ะ ขออนุญาตเก็บเงินประกันคีย์การ์ดหนึ่งพันบาทนะคะ ได้คืนตอนเช็คเอาท์ค่ะ (Khop khun ka. Khor anu-yatเก็บ ngerndeposit keycard nung phan baht na ka. Dai kuen torn check-out ka)",
                translation: "ขอบคุณค่ะ ขออนุญาตเก็บเงินประกันคีย์การ์ดหนึ่งพันบาทนะคะ ได้คืนตอนเช็คเอาท์ค่ะ (Thank you. I need to collect a keycard deposit of one thousand baht, which is fully refundable at check-out.)"
            },
            choices: [
                { text: "จ่ายเงินประกัน (1,000 บาท)", nextNode: "deposit" },
                { text: "สอบถามเรื่องอาหารเช้า", nextNode: "breakfast" }
            ]
        },
        deposit: {
            tourist: {
                text: "Sure, here is one thousand baht.",
                translation: "ตกลงครับ นี่เงินประกันหนึ่งพันบาทครับ (Tok long krap. Nee ngern deposit nung phan baht krap)"
            },
            local: {
                name: "พนักงานต้อนรับ",
                text: "ได้รับเรียบร้อยค่ะ นี่คีย์การ์ดห้องห้าศูนย์สองนะคะ ห้องอยู่ชั้นห้าค่ะ (Dai rab riap roi ka. Nee keycard hong ha-suan-song na ka. Hong yoo chan ha ka)",
                translation: "ได้รับเรียบร้อยค่ะ นี่คีย์การ์ดห้องห้าศูนย์สองนะคะ ห้องอยู่ชั้นห้าค่ะ (Thank you. Here is your keycard for room 502. It's on the fifth floor.)"
            },
            choices: [
                { text: "ขอบคุณมากครับ กำลังจะไปที่ห้องพัก", nextNode: "complete" }
            ]
        },
        breakfast: {
            tourist: {
                text: "Is breakfast included in my room booking?",
                translation: "ราคานี้รวมอาหารเช้าด้วยไหมครับ (Is breakfast included in my room booking?)"
            },
            local: {
                name: "พนักงานต้อนรับ",
                text: "รวมเรียบร้อยค่ะ อาหารเช้าเริ่มเจ็ดโมงถึงสิบโมงเช้าที่ห้องอาหารริมหาดค่ะ (Ruam riap roi ka. A-han chao rerm jet mong thueng sip mong chao thee hong a-han rim had ka)",
                translation: "รวมเรียบร้อยค่ะ อาหารเช้าเริ่มเจ็ดโมงถึงสิบโมงเช้าที่ห้องอาหารริมหาดค่ะ (Yes, it is included. Breakfast is served from 7:00 AM to 10:00 AM at the beachfront restaurant.)"
            },
            choices: [
                { text: "จ่ายเงินประกันและทำการเช็คอิน", nextNode: "deposit" }
            ]
        },
        complete: {
            tourist: {
                text: "Perfect, thank you for your help!",
                translation: "ขอบคุณมากครับสำหรับความช่วยเหลือ (Perfect, thank you for your help!)"
            },
            local: {
                name: "พนักงานต้อนรับ",
                text: "ด้วยความยินดีค่ะ ขอให้มีความสุขในการพักผ่อนนะคะ! (Duay khwam yin dee ka. Khor hai mee khwam suk nai kar pak phon na ka!)",
                translation: "ด้วยความยินดีค่ะ ขอให้มีความสุขในการพักผ่อนนะคะ! (You are very welcome. Have a wonderful stay with us!)"
            },
            choices: []
        }
    };

    const multilingualScenarios = {
        nl: {
            market: { title: "Lanpho Naklua Vis-Markt", startNode: "greet", nodes: marketNodesNL },
            taxi: { title: "Taxi naar Walking Street", startNode: "greet", nodes: taxiNodesNL },
            resort: { title: "Inchecken in Jomtien Resort", startNode: "greet", nodes: resortNodesNL }
        },
        en: {
            market: { title: "Lanpho Naklua Fish Market", startNode: "greet", nodes: marketNodesEN },
            taxi: { title: "Taxi to Walking Street", startNode: "greet", nodes: taxiNodesEN },
            resort: { title: "Check-in at Jomtien Resort", startNode: "greet", nodes: resortNodesEN }
        },
        th: {
            market: { title: "ตลาดลานโพธิ์นาเกลือ", startNode: "greet", nodes: marketNodesTH },
            taxi: { title: "นั่งรถสองแถวไปวอล์กกิ้งสตรีท", startNode: "greet", nodes: taxiNodesTH },
            resort: { title: "เช็คอินรีสอร์ทที่จอมเทียน", startNode: "greet", nodes: resortNodesTH }
        }
    };

    const multilingualTestimonials = {
        nl: [
            { text: "Bellen en praten met de lokale bevolking was nog nooit zo makkelijk. De marktkooplui vonden het geweldig dat de oordopjes direct in het Thais vertaalden!", author: "Mark de Vries", role: "Toerist uit Utrecht" },
            { text: "Ideaal voor zakelijke besprekingen in Pattaya. Het open-oor ontwerp zit heel comfortabel en zweet niet onder de hete zon.", author: "Elena Rostova", role: "Expats in Chon Buri" },
            { text: "Mijn favoriete gadget tijdens mijn verblijf in Thailand. Super service van bezorging tot inlevering bij de hotelreceptie.", author: "Thomas van den Berg", role: "Rondreiziger" }
        ],
        en: [
            { text: "Calling and talking with locals has never been easier. The market vendors loved that the earbuds translated into Thai instantly!", author: "Mark de Vries", role: "Tourist from Utrecht" },
            { text: "Ideal for business discussions in Pattaya. The open-ear design is very comfortable and doesn't sweat under the hot sun.", author: "Elena Rostova", role: "Expat in Chon Buri" },
            { text: "My favorite gadget during my stay in Thailand. Superb service from delivery to drop-off at the hotel reception.", author: "Thomas van den Berg", role: "Backpacker" }
        ],
        th: [
            { text: "การติดต่อพูดคุยกับคนท้องถิ่นกลายเป็นเรื่องง่ายมาก พ่อค้าแม่ค้าในตลาดประทับใจมากที่หูฟังสามารถแปลเป็นภาษาไทยได้ทันที!", author: "Mark de Vries", role: "นักท่องเที่ยวจากอูเทรคต์" },
            { text: "เหมาะมากสำหรับการคุยธุรกิจในพัทยา ดีไซน์แบบเปิดหูทำให้ใส่สบายมากและไม่มีเหงื่อสะสมแม้ในสภาพอากาศร้อน", author: "Elena Rostova", role: "ผู้อยู่อาศัยในชลบุรี" },
            { text: "เป็นอุปกรณ์ที่ฉันชอบที่สุดระหว่างอยู่เมืองไทย บริการดีมากตั้งแต่การส่งเครื่องไปจนถึงการฝากคืนที่เคาน์เตอร์โรงแรม", author: "Thomas van den Berg", role: "นักเดินทางแบ็คแพ็คเกอร์" }
        ]
    };

    const multilingualFaqs = {
        nl: [
            { q: "Hoe werkt de True Time Thai W4 Pro?", a: "De oordopjes maken via Bluetooth verbinding met uw telefoon. Met de bijbehorende app en geavanceerde AI vertalen ze spraak in real-time. U draagt één oordopje en geeft de ander aan uw gesprekspartner (of gebruikt de handsfree modus via de luidspreker van uw telefoon)." },
            { q: "Heb ik een internetverbinding nodig?", a: "Ja, de AI heeft een internetverbinding nodig voor de vertaalservice. We bieden optioneel een lokale 5G SIM-kaart aan bij uw huurset, zodat u overal in Pattaya verzekerd bent van een snelle en stabiele verbinding." },
            { q: "Hoe zit het met hygiëne en schoonmaken?", a: "Hygiëne is onze hoogste prioriteit. Onze oordopjes hebben een open-ear ontwerp (geen in-ear contact). Na elke huurperiode steriliseren we de apparatuur met industriële UV-C lichtkamers en reinigen we ze handmatig met medische desinfectie. Elk pakket wordt vacuüm verzegeld geleverd." },
            { q: "Waar kan ik de oordopjes ophalen of laten bezorgen?", a: "U kunt de set ophalen bij ons kantoor aan Pattaya Beach Road. Daarnaast bieden we gratis bezorging en inlevering aan bij elk hotel of resort in Pattaya (inclusief Jomtien en Naklua). Laat de set bij vertrek simpelweg achter bij de hotelreceptie." }
        ],
        en: [
            { q: "How does the True Time Thai W4 Pro work?", a: "The earbuds connect to your phone via Bluetooth. With the companion app and advanced AI, they translate speech in real-time. You wear one earbud and give the other to your conversation partner (or use hands-free mode via your phone's speaker)." },
            { q: "Do I need an internet connection?", a: "Yes, the AI requires an internet connection for the translation service. We optionally offer a local 5G SIM card with your rental set, so you are assured of a fast and stable connection everywhere in Pattaya." },
            { q: "What about hygiene and cleaning?", a: "Hygiene is our top priority. Our earbuds feature an open-ear design (no in-ear contact). After each rental period, we sterilize the equipment with industrial UV-C light chambers and clean them manually with medical disinfectants. Every package is delivered vacuum-sealed." },
            { q: "Where can I pick up the earbuds or have them delivered?", a: "You can pick up the set at our office on Pattaya Beach Road. In addition, we offer free delivery and drop-off at any hotel or resort in Pattaya (including Jomtien and Naklua). Simply leave the set at the hotel reception upon departure." }
        ],
        th: [
            { q: "True Time Thai W4 Pro ทำงานอย่างไร?", a: "หูฟังจะเชื่อมต่อกับโทรศัพท์ของคุณผ่านบลูทูธ ด้วยแอปพลิเคชันและ AI ขั้นสูง จะช่วยแปลบทสนทนาได้แบบเรียลไทม์ คุณสามารถสวมหูฟังหนึ่งข้างและส่งอีกข้างให้คู่สนทนา (หรือใช้โหมดแฮนด์ฟรีผ่านลำโพงโทรศัพท์ได้)" },
            { q: "จำเป็นต้องใช้อินเทอร์เน็ตหรือไม่?", a: "ใช่ครับ ระบบแปลภาษา AI จำเป็นต้องใช้อินเทอร์เน็ตในการประมวลผล ทางเรามีบริการซิมการ์ด 5G ท้องถิ่นเป็นตัวเลือกเสริม เพื่อให้แน่ใจว่าคุณจะเชื่อมต่อได้อย่างรวดเร็วและเสถียรทุกที่ในพัทยา" },
            { q: "ความสะอาดและสุขอนามัยเป็นอย่างไร?", a: "เรื่องสุขอนามัยเป็นสิ่งที่เราให้ความสำคัญสูงสุด หูฟังของเราเป็นดีไซน์แบบเปิดหู (Open-Ear) ไม่ต้องสอดเข้าไปในรูหู หลังการเช่าทุกครั้ง เราจะอบฆ่าเชื้อด้วยแสง UV-C อุตสาหกรรม และเช็ดทำความสะอาดด้วยน้ำยาฆ่าเชื้อเกรดการแพทย์ บรรจุภัณฑ์จะถูกปิดผนึกสุญญากาศส่งถึงมือคุณ" },
            { q: "ฉันสามารถรับหรือส่งคืนหูฟังได้ที่ไหน?", a: "คุณสามารถรับเครื่องได้ที่สำนักงานของเราบนถนนเลียบชายหาดพัทยา นอกจากนี้เรายังมีบริการจัดส่งและรับคืนฟรีถึงโรงแรมหรือรีสอร์ททุกแห่งในพัทยา (รวมถึงจอมเทียนและนาเกลือ) เพียงฝากไว้ที่เคาน์เตอร์ต้อนรับของโรงแรมตอนเช็คเอาท์" }
        ]
    };

    const multilingualTermsData = {
        nl: {
            pickup: {
                title: "1. Ophalen & Inleveren van de Apparatuur",
                content: `<p>Bij het boeken selecteert u uw gewenste ophaal- en inleverlocatie. Wij bieden momenteel twee handige opties aan in Pattaya:</p><ul><li><strong>Pattaya Beach Road Office:</strong> Geopend van 08:00 tot 22:00 uur. Ons kantoor ligt centraal en is eenvoudig te bereiken.</li><li><strong>Gratis Hotelbezorging & Inlevering:</strong> Wij bezorgen de verzegelde sets gratis bij de receptie van uw hotel of resort in Pattaya (inclusief Jomtien en Naklua). U kunt de set bij vertrek simpelweg weer achterlaten bij de receptie.</li></ul><p><em>Let op:</em> De huurperiode gaat in op de afgesproken startdatum vanaf 08:00 uur en eindigt op de einddatum uiterlijk om 22:00 uur. Te laat inleveren zonder overleg brengt een toeslag van ฿250 per dag met zich mee.</p>`
            },
            deposit: {
                title: "2. Borg & Legitimatie",
                content: `<p>Bij True Time Thai geloven we in vertrouwen. Daarom vragen we geen contante borgsom voor de oordopjes.</p><ul><li><strong>Verificatie:</strong> We vragen wel om een kopie van uw paspoort en een geldige creditcard-verificatie bij het in ontvangst nemen van de set.</li><li><strong>Buiten Pattaya:</strong> Als u de apparatuur buiten de regio Pattaya/Chonburi wilt meenemen, neem dan vooraf contact met ons op via WhatsApp voor toestemming.</li></ul>`
            },
            insurance: {
                title: "3. Schade & Verzekering",
                content: `<p>U bent verantwoordelijk voor de gehuurde apparatuur tijdens de huurperiode. Bij verlies, diefstal of onherstelbare schade gelden de volgende afspraken:</p><ul><li><strong>Standaard eigen risico:</strong> Bij verlies of zware schade aan de W4 Pro set geldt een vergoeding tot maximaal ฿5.000 (€135).</li><li><strong>Optionele dekking:</strong> Voor slechts ฿50 per dag kunt u een schadeverzekering afsluiten die breuk en waterschade volledig dekt. Dit kan bij ontvangst van de set worden geregeld.</li></ul>`
            },
            cancellation: {
                title: "4. Annuleren & Wijzigen",
                content: `<p>Reisplannen kunnen veranderen. Wij zijn flexibel en rekenen geen annuleringskosten.</p><ul><li><strong>Annuleren:</strong> U kunt uw boeking tot 24 uur voor de afgesproken startdatum gratis annuleren via de link in uw bevestigingsmail of via WhatsApp.</li><li><strong>Wijzigen:</strong> Het verkorten of verlengen van uw huurperiode is altijd mogelijk op basis van beschikbaarheid. Neem simpelweg contact met ons op en we passen uw boeking direct aan.</li></ul>`
            }
        },
        en: {
            pickup: {
                title: "1. Pick-up & Return of Equipment",
                content: `<p>When booking, you select your desired pick-up and return location. We currently offer two convenient options in Pattaya:</p><ul><li><strong>Pattaya Beach Road Office:</strong> Open from 08:00 to 22:00. Our office is centrally located and easy to reach.</li><li><strong>Free Hotel Delivery & Drop-off:</strong> We deliver the sealed sets for free to the reception of your hotel or resort in Pattaya (including Jomtien and Naklua). You can simply leave the set at reception upon departure.</li></ul><p><em>Please note:</em> The rental period starts on the agreed date at 08:00 and ends on the end date by 22:00 at the latest. Returning late without notice incurs a surcharge of ฿250 per day.</p>`
            },
            deposit: {
                title: "2. Deposit & Identification",
                content: `<p>At True Time Thai, we believe in trust. That is why we do not require a cash deposit for the earbuds.</p><ul><li><strong>Verification:</strong> We do require a copy of your passport and valid credit card verification when receiving the set.</li><li><strong>Outside Pattaya:</strong> If you wish to take the equipment outside the Pattaya/Chonburi region, please contact us in advance via WhatsApp for authorization.</li></ul>`
            },
            insurance: {
                title: "3. Damage & Insurance",
                content: `<p>You are responsible for the rented equipment during the rental period. In case of loss, theft, or irreparable damage, the following agreements apply:</p><ul><li><strong>Standard Deductible:</strong> In case of loss or severe damage to the W4 Pro set, a fee of up to ฿5,000 (€135) applies.</li><li><strong>Optional Coverage:</strong> For just ฿50 per day, you can purchase damage insurance that fully covers accidental breakage and water damage. This can be arranged upon receipt of the set.</li></ul>`
            },
            cancellation: {
                title: "4. Cancellation & Changes",
                content: `<p>Travel plans can change. We are flexible and do not charge cancellation fees.</p><ul><li><strong>Cancellation:</strong> You can cancel your booking free of charge up to 24 hours before the start date via the link in your confirmation email or via WhatsApp.</li><li><strong>Changes:</strong> Shortening or extending your rental period is always possible based on availability. Simply contact us and we will adjust your booking immediately.</li></ul>`
            }
        },
        th: {
            pickup: {
                title: "1. การรับและคืนอุปกรณ์",
                content: `<p>เมื่อทำการจอง คุณสามารถเลือกสถานที่รับและคืนเครื่องได้ตามต้องการ โดยเรามีสองทางเลือกหลักในพัทยาดังนี้:</p><ul><li><strong>สำนักงานถนนเลียบชายหาดพัทยา:</strong> เปิดทำการเวลา 08:00 น. ถึง 22:00 น. สำนักงานของเราตั้งอยู่ใจกลางเมืองและเดินทางสะดวก</li><li><strong>บริการจัดส่งและคืนที่โรงแรมฟรี:</strong> เราจัดส่งชุดอุปกรณ์ที่ปิดผนึกสุญญากาศให้ฟรีถึงแผนกต้อนรับของโรงแรมหรือรีสอร์ทของคุณในพัทยา (รวมถึงจอมเทียนและนาเกลือ) และสามารถฝากคืนไว้ที่แผนกต้อนรับเมื่อเดินทางกลับ</li></ul><p><em>หมายเหตุ:</em> ระยะเวลาเช่าเริ่มต้นในวันที่ตกลงเวลา 08:00 น. และสิ้นสุดในวันสุดท้ายไม่เกิน 22:00 น. การส่งคืนล่าช้าโดยไม่มีการแจ้งล่วงหน้าจะมีค่าปรับ ฿250 ต่อวัน</p>`
            },
            deposit: {
                title: "2. เงินประกันและเอกสารยืนยันตัวตน",
                content: `<p>ที่ True Time Thai เราเชื่อมั่นในความไว้วางใจ จึงไม่มีการเรียกเก็บเงินมัดจำค่าเครื่องเป็นเงินสด</p><ul><li><strong>การยืนยันตัวตน:</strong> เราขอสำเนาหนังสือเดินทางและการยืนยันบัตรเครดิตที่ใช้งานได้เมื่อรับชุดอุปกรณ์</li><li><strong>นอกพื้นที่พัทยา:</strong> หากคุณต้องการนำอุปกรณ์ออกนอกพื้นที่พัทยา/ชลบุรี กรุณาติดต่อเราล่วงหน้าผ่าน WhatsApp เพื่อขออนุมัติ</li></ul>`
            },
            insurance: {
                title: "3. ความเสียหายและการประกันภัย",
                content: `<p>คุณต้องรับผิดชอบต่ออุปกรณ์ที่เช่าระหว่างระยะเวลาเช่า ในกรณีที่เกิดการสูญหาย ถูกโจรกรรม หรือความเสียหายที่แก้ไขไม่ได้ ข้อตกลงต่อไปนี้จะมีผลบังคับใช้:</p><ul><li><strong>ค่าความเสียหายส่วนแรกมาตรฐาน:</strong> ในกรณีสูญหายหรือเสียหายรุนแรงต่อชุด W4 Pro จะมีค่าธรรมเนียมชดเชยสูงสุด ฿5,000 (€135)</li><li><strong>ความคุ้มครองเสริม:</strong> เพียง ฿50 ต่อวัน คุณสามารถซื้อประกันความเสียหายเพื่อคุ้มครองกรณีแตกหักโดยอุบัติเหตุและภัยจากน้ำได้อย่างเต็มที่ โดยสามารถดำเนินการได้เมื่อได้รับเครื่อง</li></ul>`
            },
            cancellation: {
                title: "4. การยกเลิกและการเปลี่ยนแปลง",
                content: `<p>แผนการเดินทางสามารถเปลี่ยนแปลงได้เสมอ เรามีความยืดหยุ่นและไม่มีค่าธรรมเนียมการยกเลิก</p><ul><li><strong>การยกเลิก:</strong> คุณสามารถยกเลิกการจองได้ฟรีสูงสุด 24 ชั่วโมงก่อนวันเริ่มต้น ผ่านลิงก์ในอีเมลยืนยันหรือผ่าน WhatsApp</li><li><strong>การเปลี่ยนแปลง:</strong> คุณสามารถขยายเวลาหรือย่นระยะเวลาการเช่าได้ตลอดเวลาขึ้นอยู่กับจำนวนเครื่องที่ว่าง เพียงติดต่อเราและเราจะปรับปรุงการจองให้ทันที</li></ul>`
            }
        }
    };

    const multilingualHygieneContent = {
        nl: {
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
        },
        en: {
            "1": {
                title: "100% Freedom & Natural Sound",
                text: "Experience the ultimate revolution in audio comfort under the Thai sun. Because our earbuds hover <em>above</em> your ear canal instead of inside it, you enjoy your favorite music or real-time translations without sweat buildup or pressure. Ideal for active beach days in Jomtien and walks through Pattaya!"
            },
            "2": {
                title: "Manual Precision Cleaning",
                text: "In addition to our machine sterilization, all W4 Pros undergo an extensive manual cleaning. Our trained specialists disinfect every corner, crevice, and contact point with biodegradable, alcohol-free medical wipes certified specifically for audio equipment. Guaranteed lint- and bacteria-free!"
            },
            "3": {
                title: "Medical UV-C Light Disinfection",
                text: "Safety is our absolute priority at True Time Thai. Every earbud set and charging case undergoes an intensive sterilization cycle in our industrial UV-C light chambers. Within minutes, 99.9% of all bacteria, viruses, and microorganisms are completely eliminated. This ensures a clinically clean start!"
            },
            "4": {
                title: "Ergonomics That Feel Like Air",
                text: "Thanks to the flexible, lightweight earhook shape, the W4 Pro earbuds adapt instantly and naturally to the anatomy of your ear. You will quickly forget you are wearing them! Moreover, the open-ear design still allows you to hear the sounds around you, ensuring maximum safety in Pattaya's busy traffic."
            },
            "5": {
                title: "Hermetically Sealed For You",
                text: "After the earbuds pass our strict 5-point quality control, they are immediately vacuum sealed in biodegradable hygiene packaging. You are the very first to break the seal upon receipt at your resort. 100% guaranteed dust-free, bacteria-free, and fresher than fresh!"
            }
        },
        th: {
            "1": {
                title: "อิสระ 100% และเสียงที่เป็นธรรมชาติ",
                text: "สัมผัสสุดยอดการปฏิวัติความสะดวกสบายด้านเสียงภายใต้แสงแดดของเมืองไทย เนื่องจากหูฟังของเราลอยอยู่ <em>เหนือ</em> รูหูของคุณแทนที่จะเสียบเข้าไปข้างใน คุณจึงเพลิดเพลินกับเพลงโปรดหรือการแปลภาษาแบบเรียลไทม์ได้โดยไม่มีเหงื่อสะสมหรือแรงกดทับ เหมาะอย่างยิ่งสำหรับวันพักผ่อนบนชายหาดจอมเทียนและการเดินเล่นในพัทยา!"
            },
            "2": {
                title: "การทำความสะอาดด้วยมืออย่างละเอียดแม่นยำ",
                text: "นอกเหนือจากการฆ่าเชื้อด้วยเครื่องจักรแล้ว หูฟัง W4 Pro ทั้งหมดต้องผ่านการทำความสะอาดด้วยมืออย่างละเอียด ผู้เชี่ยวชาญที่ได้รับการฝึกฝนของเราจะฆ่าเชื้อทุกซอกทุกมุม รอยแยก และจุดสัมผัสด้วยแผ่นเช็ดทำความสะอาดเกรดการแพทย์แบบปราศจากแอลกอฮอล์และย่อยสลายได้ทางชีวภาพ ซึ่งได้รับการรับรองสำหรับอุปกรณ์เสียงโดยเฉพาะ รับประกันว่าปราศจากฝุ่นละอองและแบคทีเรีย!"
            },
            "3": {
                title: "การฆ่าเชื้อด้วยแสง UV-C เกรดการแพทย์",
                text: "ความปลอดภัยคือสิ่งสำคัญที่สุดที่ True Time Thai หูฟังและเคสชาร์จทุกชุดจะผ่านรอบการฆ่าเชื้ออย่างเข้มข้นในห้องอบแสง UV-C ระดับอุตสาหกรรม ภายในไม่กี่นาที แบคทีเรีย ไวรัส และจุลินทรีย์ 99.9% จะถูกกำจัดโดยสิ้นเชิง เพื่อให้มั่นใจว่าคุณจะได้รับการเริ่มต้นใช้งานที่สะอาดถูกสุขอนามัยในระดับคลินิก!"
            },
            "4": {
                title: "การออกแบบตามหลักสรีรศาสตร์ที่เบาราวกับอากาศ",
                text: "ด้วยรูปทรงที่เกี่ยวหูที่ยืดหยุ่นและมีน้ำหนักเบาเป็นพิเศษ หูฟัง W4 Pro จึงปรับเข้ากับสรีระใบหูของคุณได้อย่างเป็นธรรมชาติและทันที จนคุณอาจลืมไปเลยว่ากำลังสวมใส่อยู่! นอกจากนี้ ดีไซน์แบบเปิดหู (Open-Ear) ยังช่วยให้คุณได้ยินเสียงรอบข้างเพื่อความปลอดภัยสูงสุดในการเดินทางท่ามกลางการจราจรที่คับคั่งของพัทยา"
            },
            "5": {
                title: "ปิดผนึกสุญญากาศเพื่อคุณโดยเฉพาะ",
                text: "หลังจากหูฟังผ่านการตรวจสอบคุณภาพ 5 จุดอย่างเข้มงวด อุปกรณ์จะถูกปิดผนึกสุญญากาศทันทีในบรรจุภัณฑ์สุขอนามัยที่ย่อยสลายได้ทางชีวภาพ คุณจะเป็นคนแรกที่แกะซีลออกเมื่อได้รับอุปกรณ์ที่รีสอร์ทของคุณ รับประกันไร้ฝุ่น ไร้แบคทีเรีย 100% และสะอาดใหม่ที่สุด!"
            }
        }
    };

    let scenarios = multilingualScenarios[activeLang];
    let hygieneContent = multilingualHygieneContent[activeLang];
    let testimonials = multilingualTestimonials[activeLang];
    let faqs = multilingualFaqs[activeLang];
    let termsData = multilingualTermsData[activeLang];

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
                    <div class="msg-text">${getSimText('startTip')}</div>
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
            simChoices.innerHTML = `<span class="text-muted" style="font-size:0.85rem; padding: 10px;">${getSimText('inProgress')}</span>`;
        }

        // --- STEP 1: Tourist speaks ---
        if (simAiStatus) {
            simAiStatus.style.display = 'flex';
            if (simAiStatusText) simAiStatusText.textContent = getSimText('touristSpeaking');
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
                <div class="msg-meta">${getSimText('youTourist')}</div>
                <div class="msg-text">${node.tourist.text} <button class="btn-replay-speech btn-speak-main" title="🔊" type="button">🔊</button></div>
                <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="🔊" type="button">🔊</button> ${getSimText('translationLabel')}: "${node.tourist.translation}"</div>
            `;
            
            // Register Speech Replay button clicks
            touristBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                e.stopPropagation();
                speakText(node.tourist.text, activeLang === 'nl' ? 'nl' : 'en');
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

            // Speak tourist voice, then wait for it to end
            speakText(node.tourist.text, activeLang === 'nl' ? 'nl' : 'en', () => {
                // Tourist finished speaking. Wait 1.5s (natural pause) before starting local response
                setTimeout(() => {
                    if (simAiStatusText) simAiStatusText.textContent = getSimText('localResponding');
                    if (simAiStatus) simAiStatus.style.display = 'flex';
                    
                    // 1.5s delay for Local response translation processing
                    setTimeout(() => {
                        // Append Local speech bubble
                        const localBubble = document.createElement('div');
                        localBubble.className = "msg-bubble glass msg-local";
                        localBubble.innerHTML = `
                            <div class="msg-meta">${node.local.name}</div>
                            <div class="msg-text">${node.local.text} <button class="btn-replay-speech btn-speak-main" title="🔊" type="button">🔊</button></div>
                            <div class="msg-trans"><button class="btn-replay-speech btn-speak-trans" title="🔊" type="button">🔊</button> ${getSimText('translationLabel')}: "${node.local.translation}"</div>
                        `;

                        // Register Speech Replays for Local
                        localBubble.querySelector('.btn-speak-main').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.text, 'th');
                        });
                        localBubble.querySelector('.btn-speak-trans').addEventListener('click', (e) => {
                            e.stopPropagation();
                            speakText(node.local.translation, activeLang === 'nl' ? 'nl' : 'en');
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
        const isStart = simMessages && simMessages.innerHTML.includes('💡') || simMessages.innerHTML.includes('Kies een scenario');
        
        if (isStart) {
            const startBtn = document.createElement('button');
            startBtn.className = "btn btn-neon btn-sim-choice";
            startBtn.id = "simulator-next-btn";
            startBtn.textContent = getSimText('startBtn');
            startBtn.type = "button";
            startBtn.addEventListener('click', () => {
                playNodeTurn(scenarios[currentScenario].startNode);
            });
            simChoices.appendChild(startBtn);
            
            const resetBtn = document.createElement('button');
            resetBtn.className = "btn btn-outline";
            resetBtn.textContent = getSimText('resetBtn');
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
            endText.textContent = getSimText('completed');
            simChoices.appendChild(endText);

            const resetBtn = document.createElement('button');
            resetBtn.className = "btn btn-neon btn-sim-choice";
            resetBtn.textContent = getSimText('chooseReset');
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
        resetBtn.textContent = getSimText('resetBtn');
        resetBtn.type = "button";
        resetBtn.addEventListener('click', () => resetSimulator());
        simChoices.appendChild(resetBtn);
    }
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
            let selectText = 'Selecteer datums';
            let enterText = 'Voer geldige huurperiode in';
            if (activeLang === 'en') {
                selectText = 'Select dates';
                enterText = 'Enter a valid rental period';
            } else if (activeLang === 'th') {
                selectText = 'เลือกวันที่';
                enterText = 'ระบุระยะเวลาเช่าที่ถูกต้อง';
            }
            
            if (recDuration) recDuration.textContent = selectText;
            if (recItemsList) {
                recItemsList.innerHTML = `
                    <div class="receipt-row-item text-muted">
                        <span>${enterText}</span>
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
        let durationValText = "";
        if (activeLang === 'nl') {
            durationValText = `${days} ${days === 1 ? 'dag' : 'dagen'}`;
        } else if (activeLang === 'en') {
            durationValText = `${days} ${days === 1 ? 'day' : 'days'}`;
        } else {
            durationValText = `${days} วัน`;
        }
        if (recDuration) recDuration.textContent = durationValText;

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
            let labelRental = `Huur W4 Pro (${quantity}x set, ${days}d à ฿250):`;
            let labelSim = `5G SIM-kaart (${quantity}x flat):`;
            let labelPowerbank = `Premium Powerbank (${quantity}x flat):`;

            if (activeLang === 'en') {
                labelRental = `Rental W4 Pro (${quantity}x set, ${days}d @ ฿250):`;
                labelSim = `5G SIM Card (${quantity}x flat):`;
                labelPowerbank = `Premium Power Bank (${quantity}x flat):`;
            } else if (activeLang === 'th') {
                labelRental = `ค่าเช่า W4 Pro (${quantity} ชุด, ${days} วัน ละ ฿250):`;
                labelSim = `ซิมการ์ด 5G (${quantity} ชุด):`;
                labelPowerbank = `พาวเวอร์แบงก์เกรดพรีเมียม (${quantity} ชุด):`;
            }

            let itemsHtml = `
                <div class="receipt-row-item">
                    <span>${labelRental}</span>
                    <span>฿${rawRentalTotal}</span>
                </div>
            `;

            if (hasSim) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>${labelSim}</span>
                        <span>฿${simCost}</span>
                    </div>
                `;
            }

            if (hasPowerbank) {
                itemsHtml += `
                    <div class="receipt-row-item">
                        <span>${labelPowerbank}</span>
                        <span>฿${powerbankCost}</span>
                    </div>
                `;
            }

            recItemsList.innerHTML = itemsHtml;
        }

        // 5. Update discounts & totals
        if (discountAmount > 0) {
            if (recDiscountBox) {
                recDiscountBox.style.display = 'flex';
                const discLabelSpan = recDiscountBox.querySelector('span:first-child');
                if (discLabelSpan) {
                    if (activeLang === 'nl') {
                        discLabelSpan.textContent = discountPercent === 0.4 ? "Expats-korting (40%):" : "Weekkorting (20%):";
                    } else if (activeLang === 'en') {
                        discLabelSpan.textContent = discountPercent === 0.4 ? "Expat Discount (40%):" : "Weekly Discount (20%):";
                    } else {
                        discLabelSpan.textContent = discountPercent === 0.4 ? "ส่วนลดผู้พำนักระยะยาว (40%):" : "ส่วนลดรายสัปดาห์ (20%):";
                    }
                }
            }
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
    // Testimonials will be loaded dynamically

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
    // FAQs will be loaded dynamically

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

        // Uses global termsData

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

    function setLanguage(lang) {
        activeLang = lang;
        localStorage.setItem('preferredLang', lang);

        // Update switcher active states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Apply translations for all [data-i18n]
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Dynamic components update
        scenarios = multilingualScenarios[lang];
        testimonials = multilingualTestimonials[lang];
        faqs = multilingualFaqs[lang];
        termsData = multilingualTermsData[lang];
        hygieneContent = multilingualHygieneContent[lang];

        // Re-render components if functions exist
        if (typeof buildTestimonials === 'function') buildTestimonials();
        if (typeof buildFaqs === 'function') buildFaqs();
        if (typeof updatePricing === 'function') updatePricing();
        
        // Refresh active terms tab content
        const activeTermsBtn = document.querySelector('.terms-nav-btn.active');
        if (activeTermsBtn) {
            activeTermsBtn.click();
        }
        
        // Refresh hygiene tab content
        const activeHygieneTab = document.querySelector('.hygiene-tab.active');
        if (activeHygieneTab) {
            activeHygieneTab.click();
        }

        // Restart simulator in the new language
        if (typeof resetSimulator === 'function') {
            resetSimulator(currentScenario);
        }
    }

    // Connect language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedLang = e.currentTarget.getAttribute('data-lang');
            setLanguage(selectedLang);
        });
    });

    initHeaderScroll();
    initPolaroidStack();
    initHygienePolaroidStack();
    initTermsTabs();
    initContactCarousel();

    // Trigger initial language set on load
    setLanguage(activeLang);
});
