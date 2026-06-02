function acceptCookies() {
    const overlay = document.getElementById('cookieOverlay');
    
    // 1. Hide it immediately from the user's view
    overlay.classList.add('hidden');
    
    // 2. Save the preference so it stays gone on next visit
    localStorage.setItem('cookieConsent', 'true');
}

// 3. Check status when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('cookieOverlay');
    if (localStorage.getItem('cookieConsent') === 'true') {
        // If they already accepted, don't even show the overlay
        overlay.style.display = 'none';
    }
});
