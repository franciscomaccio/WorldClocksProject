// Supabase Configuration
const SUPABASE_URL = 'https://czjhlxnypntpbmxispox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6amhseG55cG50cGJteGlzcG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTA2MDQsImV4cCI6MjA4NzI2NjYwNH0.Vc_vxRE9LWohrKPQAGiBGP6w6Mj_pUMC63u40aWVl9E';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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

    const { data, error } = await supabase.auth.signUp({ email, password });

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
    await supabase.auth.signOut();
});

// Auth State Observer
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        startClockUpdates();
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

// Interaction effects
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
