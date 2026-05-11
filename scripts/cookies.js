function acceptCookies() {
    const overlay = document.getElementById('cookieOverlay');
    overlay.classList.add('hidden');
    localStorage.setItem('cookieConsent', 'true');
}

// Check on load
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('cookieConsent') === 'true') {
        document.getElementById('cookieOverlay').style.display = 'none';
    }
});
