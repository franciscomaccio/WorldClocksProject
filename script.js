// Supabase Configuration
const SUPABASE_URL = 'https://czjhlxnypntpbmxispox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6amhseG55cG50cGJteGlzcG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTA2MDQsImV4cCI6MjA4NzI2NjYwNH0.Vc_vxRE9LWohrKPQAGiBGP6w6Mj_pUMC63u40aWVl9E';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// UI Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');

// --- Auth Logic ---

// Switch Forms
document.getElementById('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    authMessage.textContent = 'Iniciando sesión...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        authMessage.textContent = error.message;
        authMessage.className = 'message error';
    } else {
        authMessage.textContent = '¡Bienvenido!';
        authMessage.className = 'message success';
    }
});

// Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    authMessage.textContent = 'Registrando...';

    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
        authMessage.textContent = error.message;
        authMessage.className = 'message error';
    } else {
        authMessage.textContent = 'Registro exitoso. Revisa tu email para confirmar tu cuenta.';
        authMessage.className = 'message success';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
});

// Auth State Observer
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        startClockUpdates();
        updateRates();
        fetchWeather();
    } else {
        appSection.style.display = 'none';
        authSection.style.display = 'block';
        stopClockUpdates();
    }
});

// --- Clock Logic ---

let clockInterval;

function updateClocks() {
    const now = new Date();

    // Argentina Time (UTC-3)
    const optionsAR = {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };
    const dateOptionsAR = {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long', day: 'numeric', month: 'long'
    };

    document.getElementById('time-ar').textContent = new Intl.DateTimeFormat('es-AR', optionsAR).format(now);
    document.getElementById('date-ar').textContent = new Intl.DateTimeFormat('es-AR', dateOptionsAR).format(now);

    // Thailand Time (UTC+7)
    const optionsTH = {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    };
    const dateOptionsTH = {
        timeZone: 'Asia/Bangkok',
        weekday: 'long', day: 'numeric', month: 'long'
    };

    document.getElementById('time-th').textContent = new Intl.DateTimeFormat('en-US', optionsTH).format(now);
    document.getElementById('date-th').textContent = new Intl.DateTimeFormat('en-US', dateOptionsTH).format(now);
}

function startClockUpdates() {
    updateClocks();
    clockInterval = setInterval(updateClocks, 1000);
}

function stopClockUpdates() {
    clearInterval(clockInterval);
}

// --- Enhancements Logic ---

const EXCHANGE_RATES = {
    ARS: 1390.49, // USD to ARS (Feb 2026 approx)
    THB: 31.04    // USD to THB (Feb 2026 approx)
};

const WEATHER_LINKS = {
    AR: 'https://weather.com/weather/today/l/Cordoba+Argentina?canonicalCityId=17e76c167b0dcba641f6e6259f63588961726759c836ec276e069c9b47e85c29',
    TH: 'https://weather.com/weather/today/l/Bangkok+Thailand?canonicalCityId=6e81498b30d3dce0e633d6796245f09627797e883e4a2e584cc1d8487b22a07c'
};

async function fetchWeather() {
    console.log('Fetching weather data...');
    // Córdoba, AR (-31.4135, -64.1811)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-31.41&longitude=-64.18&current_weather=true')
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) updateWeatherUI('ar', data.current_weather);
        })
        .catch(e => console.error('Error AR weather:', e));

    // Bangkok, TH (13.7563, 100.5018)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=13.75&longitude=100.51&current_weather=true')
        .then(res => res.json())
        .then(data => {
            if (data.current_weather) updateWeatherUI('th', data.current_weather);
        })
        .catch(e => console.error('Error TH weather:', e));
}

function updateWeatherUI(id, data) {
    const box = document.getElementById(`weather-${id}`);
    const iconEl = document.getElementById(`icon-${id}`);
    if (!box || !iconEl) return;

    const temp = Math.round(data.temperature);
    const code = data.weathercode;
    const isDay = data.is_day === 1;

    box.querySelector('.weather-temp').textContent = `${temp}°C`;
    box.querySelector('.weather-desc').textContent = getWeatherDesc(code);

    // Set background icon
    iconEl.textContent = getWeatherIcon(code, isDay);

    box.onclick = () => window.open(WEATHER_LINKS[id.toUpperCase()], '_blank');
}

function getWeatherIcon(code, isDay) {
    // Mapping codes to Emojis (simplified)
    if (code <= 1) return isDay ? '☀️' : '🌙'; // Clear
    if (code <= 3) return '☁️'; // Partly cloudy / Cloudy
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌦️'; // Showers
    if (code >= 95) return '⛈️'; // Storm
    return '✨';
}

function getWeatherDesc(code) {
    const codes = { 0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina', 51: 'Llovizna', 61: 'Lluvia ligera', 71: 'Nieve ligera', 95: 'Tormenta' };
    return codes[code] || 'Estable';
}

function initConverter() {
    const inputARS = document.getElementById('input-ars');
    const inputTHB = document.getElementById('input-thb');
    const rateAR = document.getElementById('rate-ar');
    const rateTH = document.getElementById('rate-th');

    rateAR.textContent = `USD/ARS: $${EXCHANGE_RATES.ARS.toLocaleString()}`;
    rateTH.textContent = `USD/THB: ฿${EXCHANGE_RATES.THB.toLocaleString()}`;

    inputARS.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        const usd = value / EXCHANGE_RATES.ARS;
        inputTHB.value = (usd * EXCHANGE_RATES.THB).toFixed(2);
    });

    inputTHB.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value) || 0;
        const usd = value / EXCHANGE_RATES.THB;
        inputARS.value = (usd * EXCHANGE_RATES.ARS).toFixed(2);
    });
}

async function updateRates() {
    console.log('Updating exchange rates...');
    // Initial UI with hardcoded rates
    initConverter();

    try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&symbols=THB');
        const data = await res.json();
        if (data.rates && data.rates.THB) {
            EXCHANGE_RATES.THB = data.rates.THB;
            document.getElementById('rate-th').textContent = `USD/THB: ฿${EXCHANGE_RATES.THB.toLocaleString()}`;
        }
    } catch (e) {
        console.warn('Error fetching rates from Frankfurter:', e);
    }
}

// --- Interaction effects ---
document.addEventListener('mousemove', (e) => {
    if (appSection.style.display === 'none') return;
    const cards = document.querySelectorAll('.clock-card');
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 20;

    cards.forEach(card => {
        card.style.transform = `translateY(${mouseY}px) rotateX(${-mouseY / 2}deg) rotateY(${mouseX / 2}deg)`;
    });
});

document.addEventListener('mouseleave', () => {
    const cards = document.querySelectorAll('.clock-card');
    cards.forEach(card => {
        card.style.transform = `translateY(0) rotateX(0) rotateY(0)`;
    });
});
