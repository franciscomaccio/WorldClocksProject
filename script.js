function updateClocks() {
    const now = new Date();

    // Argentina Time (UTC-3)
    const optionsAR = {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    const dateOptionsAR = {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    };

    const timeAR = new Intl.DateTimeFormat('es-AR', optionsAR).format(now);
    const dateAR = new Intl.DateTimeFormat('es-AR', dateOptionsAR).format(now);

    document.getElementById('time-ar').textContent = timeAR;
    document.getElementById('date-ar').textContent = dateAR;

    // Thailand Time (UTC+7)
    const optionsTH = {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const dateOptionsTH = {
        timeZone: 'Asia/Bangkok',
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    };

    const timeTH = new Intl.DateTimeFormat('en-US', optionsTH).format(now);
    const dateTH = new Intl.DateTimeFormat('en-US', dateOptionsTH).format(now);

    document.getElementById('time-th').textContent = timeTH;
    document.getElementById('date-th').textContent = dateTH;
}

// Update every second
setInterval(updateClocks, 1000);

// Initial call
updateClocks();

// Subtle parallax effect on mouse move
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.clock-card');
    const mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
    const mouseY = (e.clientY / window.innerHeight - 0.5) * 20;

    cards.forEach(card => {
        card.style.transform = `translateY(${mouseY}px) rotateX(${-mouseY/2}deg) rotateY(${mouseX/2}deg)`;
    });
});

document.addEventListener('mouseleave', () => {
    const cards = document.querySelectorAll('.clock-card');
    cards.forEach(card => {
        card.style.transform = `translateY(0) rotateX(0) rotateY(0)`;
    });
});
