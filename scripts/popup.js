function openPopup(buttonElement) {
    // 1. Grab the dynamic custom text from the data-text attribute of the clicked button
    const customText = buttonElement.getAttribute('data-text');
    
    // 2. Insert that text into the popup target container
    document.getElementById('popupText').textContent = customText;
    
    // 3. Add the class to make the popup visible
    document.getElementById('customPopup').classList.add('active');
}

function closePopup(event) {
    // Prevents closing behavior from accidentally misfiring on the inner content card
    if (event.target === event.currentTarget || event.target.classList.contains('popup-close') || event.target.tagName === 'BUTTON') {
        document.getElementById('customPopup').classList.remove('active');
    }
}
