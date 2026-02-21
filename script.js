// Supabase Configuration
const SUPABASE_URL = 'https://czjhlxnypntpbmxispox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6amhseG55cG50cGJteGlzcG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTA2MDQsImV4cCI6MjA4NzI2NjYwNH0.Vc_vxRE9LWohrKPQAGiBGP6w6Mj_pUMC63u40aWVl9E';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI Elements
const authS = document.getElementById('auth-section'), appS = document.getElementById('app-section');
const msg = document.getElementById('auth-message'), loginF = document.getElementById('login-form'), signupF = document.getElementById('signup-form');

// --- State ---
let userSettings = {
    origin: { name: "Córdoba", country: "Argentina", lat: -31.417, lon: -64.183, timezone: "America/Argentina/Buenos_Aires", currency: "ARS" },
    visit: { name: "Bangkok", country: "Thailand", lat: 13.756, lon: 100.501, timezone: "Asia/Bangkok", currency: "THB" }
};
let selOrigin = null, selVisit = null;
let RATES = { origin: 1390, visit: 31 };

// --- Auth Logic ---
document.getElementById('show-signup').onclick = e => { e.preventDefault(); loginF.style.display = 'none'; signupF.style.display = 'block'; };
document.getElementById('show-login').onclick = e => { e.preventDefault(); signupF.style.display = 'none'; loginF.style.display = 'block'; };

loginF.onsubmit = async e => {
    e.preventDefault();
    msg.innerText = 'Cargando...';
    const { error } = await sb.auth.signInWithPassword({ email: loginF[0].value, password: loginF[1].value });
    if (error) msg.innerText = error.message;
};

signupF.onsubmit = async e => {
    e.preventDefault();
    msg.innerText = 'Registrando...';
    const { error } = await sb.auth.signUp({ email: signupF[0].value, password: signupF[1].value });
    msg.innerText = error ? error.message : "Revisa tu email para confirmar.";
};

document.getElementById('logout-btn').onclick = () => sb.auth.signOut();

// --- DB Sync ---
async function syncSettings() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const { data } = await sb.from('user_locations').select('*').eq('user_id', user.id).single();
    if (data) {
        userSettings = { origin: data.origin, visit: data.visit };
    } else {
        await sb.from('user_locations').insert([{ user_id: user.id, origin: userSettings.origin, visit: userSettings.visit }]);
    }
    updateUI();
}

function updateUI() {
    document.querySelector('.ar .city').innerText = userSettings.origin.name;
    document.querySelector('.ar .location-tag').innerText = userSettings.origin.country || "Origen";
    document.querySelector('.th .city').innerText = userSettings.visit.name;
    document.querySelector('.th .location-tag').innerText = userSettings.visit.country || "Visita";

    document.getElementById('input-ars').placeholder = userSettings.origin.currency;
    document.getElementById('input-thb').placeholder = userSettings.visit.currency;
    refreshData();
}

// --- Settings Modal & Search ---
const modal = document.getElementById('settings-modal'), sBtn = document.getElementById('settings-btn');
sBtn.onclick = () => {
    modal.style.display = 'flex';
    document.getElementById('origin-search').value = userSettings.origin.name;
    document.getElementById('visit-search').value = userSettings.visit.name;
    selOrigin = userSettings.origin; selVisit = userSettings.visit;
};
document.getElementById('close-settings').onclick = () => modal.style.display = 'none';
document.getElementById('save-settings').onclick = async () => {
    const { data: { user } } = await sb.auth.getUser();
    await sb.from('user_locations').upsert({ user_id: user.id, origin: selOrigin, visit: selVisit, updated_at: new Date() });
    userSettings = { origin: selOrigin, visit: selVisit };
    modal.style.display = 'none';
    updateUI();
};

const CURRENCY_MAP = {
    "Argentina": "ARS", "Thailand": "THB", "Spain": "EUR", "United States": "USD", "Japan": "JPY",
    "United Kingdom": "GBP", "France": "EUR", "Germany": "EUR", "Italy": "EUR", "Brazil": "BRL",
    "Mexico": "MXN", "Canada": "CAD", "Australia": "AUD", "China": "CNY", "India": "INR"
};

function setupSearch(inpId, resId, type) {
    const inp = document.getElementById(inpId), res = document.getElementById(resId);
    let t;
    inp.oninput = e => {
        clearTimeout(t);
        if (e.target.value.length < 3) { res.style.display = 'none'; return; }
        t = setTimeout(async () => {
            const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${e.target.value}&count=5&language=es&format=json`);
            const d = await r.json();
            res.innerHTML = '';
            (d.results || []).forEach(i => {
                const v = document.createElement('div'); v.className = 'search-item';
                v.innerHTML = `${i.name} <span class="country">${i.country || ''}</span>`;
                v.onclick = () => {
                    const country = i.country || "";
                    const loc = {
                        name: i.name,
                        country: country,
                        lat: i.latitude,
                        lon: i.longitude,
                        timezone: i.timezone,
                        currency: CURRENCY_MAP[country] || 'USD'
                    };
                    if (type === 'origin') selOrigin = loc; else selVisit = loc;
                    inp.value = i.name; res.style.display = 'none';
                };
                res.appendChild(v);
            });
            res.style.display = 'block';
        }, 300);
    };
}
setupSearch('origin-search', 'origin-results', 'origin');
setupSearch('visit-search', 'visit-results', 'visit');

// --- Clocks & Data ---
let timer;

function refreshData() {
    fetchW('ar', userSettings.origin.lat, userSettings.origin.lon);
    fetchW('th', userSettings.visit.lat, userSettings.visit.lon);

    // Fetch rates for both
    fetchRate('origin', userSettings.origin.currency);
    fetchRate('visit', userSettings.visit.currency);
}

function fetchRate(type, symbol) {
    if (symbol === 'USD') {
        RATES[type] = 1;
        updateConvUI();
        return;
    }
    fetch(`https://api.frankfurter.app/latest?from=USD&symbols=${symbol}`)
        .then(r => r.json())
        .then(d => {
            if (d.rates && d.rates[symbol]) {
                RATES[type] = d.rates[symbol];
                updateConvUI();
            }
        }).catch(() => { });
}

function updateConvUI() {
    document.getElementById('rate-ar').innerText = `USD/${userSettings.origin.currency}: ${RATES.origin}`;
    document.getElementById('rate-th').innerText = `USD/${userSettings.visit.currency}: ${RATES.visit}`;
}

function fetchW(id, lat, lon) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(r => r.json()).then(d => {
            const b = document.getElementById('weather-' + id), i = document.getElementById('icon-' + id);
            b.querySelector('.weather-temp').innerText = Math.round(d.current_weather.temperature) + '°C';
            const codes = { 0: 'Despejado', 1: 'Despejado', 2: 'Nublado', 3: 'Nublado', 45: 'Niebla', 51: 'Llovizna', 61: 'Lluvia', 95: 'Tormenta' };
            b.querySelector('.weather-desc').innerText = codes[d.current_weather.weathercode] || 'Estable';
            i.innerText = getI(d.current_weather.weathercode, d.current_weather.is_day === 1);
            const loc = id === 'ar' ? userSettings.origin : userSettings.visit;
            b.onclick = () => window.open(`https://weather.com/es-US/tiempo/hoy/l/${loc.lat},${loc.lon}`, '_blank');
        }).catch(() => { });
}

function getI(c, d) {
    if (c <= 1) return d ? '☀️' : '🌙'; if (c <= 3) return '☁️'; if (c >= 45 && c <= 48) return '🌫️';
    if (c >= 51 && c <= 67) return '🌧️'; if (c >= 95) return '⛈️'; return '✨';
}

const iA = document.getElementById('input-ars'), iT = document.getElementById('input-thb');
iA.oninput = e => iT.value = ((parseFloat(e.target.value) || 0) / RATES.origin * RATES.visit).toFixed(2);
iT.oninput = e => iA.value = ((parseFloat(e.target.value) || 0) / RATES.visit * RATES.origin).toFixed(2);

function update() {
    const now = new Date();
    const f = (tz, l) => new Intl.DateTimeFormat(l, { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const fd = (tz, l) => new Intl.DateTimeFormat(l, { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(now);
    document.getElementById('time-ar').innerText = f(userSettings.origin.timezone, 'es-AR');
    document.getElementById('date-ar').innerText = fd(userSettings.origin.timezone, 'es-AR');
    document.getElementById('time-th').innerText = f(userSettings.visit.timezone, 'en-US');
    document.getElementById('date-th').innerText = fd(userSettings.visit.timezone, 'en-US');
}

sb.auth.onAuthStateChange((ev, sess) => {
    if (sess) { authS.style.display = 'none'; appS.style.display = 'block'; syncSettings(); update(); timer = setInterval(update, 1000); }
    else { appS.style.display = 'none'; authS.style.display = 'block'; clearInterval(timer); }
});

document.addEventListener('mousemove', e => {
    if (appS.style.display === 'none') return;
    const x = (e.clientX / window.innerWidth - 0.5) * 15, y = (e.clientY / window.innerHeight - 0.5) * 15;
    document.querySelectorAll('.clock-card').forEach(c => c.style.transform = `translateY(${y}px) rotateX(${-y / 2}deg) rotateY(${x / 2}deg)`);
});
