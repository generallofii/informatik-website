function acceptCookies() {
    const popup = document.getElementById('cookiePopup');
    popup.classList.add('hidden');
    localStorage.setItem('cookieConsent', 'true');
}
window.onload = function() {
    if (localStorage.getItem('cookieConsent') === 'true') {
        document.getElementById('cookiePopup').style.display = 'none';
    }
};
