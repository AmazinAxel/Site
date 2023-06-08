/*
 * This script handles the contact form & theme switching.
 * Copyright (c) 2023 AmazinAxel (Alec) <amazinaxel.com>
 * This program is licensed under the GPLv3.
 */

doc = document.documentElement; // Document shorthand
mode = localStorage.getItem("mode"); // Get mode from device's local storage
mode = (mode === 'true'); // Convert to a boolean
headerGradientItem = document.styleSheets[0].cssRules[3]; // Get the headeritem gradient rule
// -- Dark mode == false < ~|~ > Light theme == true -- //
/* TODO: Make this more efficent by using a array with an item + value pair and loop through the array instead of this mess 
Or better yet, get all variables in the CSS file and apply them so then I can simply update the CSS file without updating this spaghetti code */

function lightMode() {
    doc.style.setProperty("--background-color", "#f4f8fb");
    doc.style.setProperty("--wrapper-shadow1", "#e0e0e0");
    doc.style.setProperty("--bright", "#fff");
    doc.style.setProperty("--border-highlight", "#ebebeb");
    doc.style.setProperty("--headeritem-gradient1", "#f4f4f4");
    doc.style.setProperty("--headeritem-gradient2", "#f6f6f6");
    doc.style.setProperty("--headeritem-Shadow", "#d1d1d1");
    doc.style.setProperty("--dark-gray", "#404040");
    doc.style.setProperty("--lighter-gray", "#707070");
    doc.style.setProperty("--very-light", "#efefef");
    doc.style.setProperty("--linkedCard-hover", "#d3d3d3");
    doc.style.setProperty("--complimentary", "#000");
    doc.style.setProperty("--footer-genDate", "#565656");
    doc.style.setProperty("--inset", "#f9f9f9");
    doc.style.setProperty("--inset-border", "#e7e7e7");
    doc.style.setProperty("--shadow", "#e3e3e3");
    doc.style.setProperty("--card", "#fff");
    doc.style.setProperty("--tooltip", "#f6f6f6");
    doc.style.setProperty("--progress", "");

    headerGradientItem.style.setProperty("--headeritem-gradient1", "#f4f4f4");
    headerGradientItem.style.setProperty("--headeritem-gradient2", "#f6f6f6");
}

function darkMode() {
    doc.style.setProperty("--background-color", "#1b1d1e");
    doc.style.setProperty("--wrapper-shadow1", "#070707");
    doc.style.setProperty("--bright", "#1d1d1d");
    doc.style.setProperty("--border-highlight", "#292929");
    doc.style.setProperty("--headeritem-gradient1", "#3f3e3e");
    doc.style.setProperty("--headeritem-gradient2", "#2e2e2e");
    doc.style.setProperty("--headeritem-Shadow", "#4d4c4c");
    doc.style.setProperty("--dark-gray", "#969696");
    doc.style.setProperty("--lighter-gray", "#757575");
    doc.style.setProperty("--very-light", "#0e0e0e");
    doc.style.setProperty("--linkedCard-hover", "#303030");
    doc.style.setProperty("--complimentary", "#fff");
    doc.style.setProperty("--footer-genDate", "#747474");
    doc.style.setProperty("--inset", "#202020");
    doc.style.setProperty("--inset-border", "#353535");
    doc.style.setProperty("--shadow", "#181818");
    doc.style.setProperty("--card", "#1f1f1f");
    doc.style.setProperty("--tooltip", "#2e2e2e");
    doc.style.setProperty("--progress", "#fff");

    headerGradientItem.style.setProperty("--headeritem-gradient1", "#3f3e3e");
    headerGradientItem.style.setProperty("--headeritem-gradient2", "#2e2e2e");
}

function setMode() { // Toggle between dark & light mode
    if (mode == true) { lightMode(); }
    else if (mode == false) { darkMode(); }
    // Else, use the default theme provided by the device

    localStorage.setItem("mode", mode); // Set current mode
    // Note: Ternary operator can't be used here because this is an "else:if else" statement, not an "if:else" statement
}


function updIcon() { if (mode == true) { modeToggle.src = '/icons/dark-mode.svg'; modeToggle.classList.remove('dark'); }
                     else { modeToggle.src = '/icons/light-mode.svg'; modeToggle.classList.add('dark'); }
}

function toggleMode() { mode = !mode; setMode(); updIcon(); }

setMode(); // Set mode immediately before page load to stop the flashing of the wrong theme
window.onload = function() { modeToggle = document.getElementById('modeToggleIcon'); updIcon(); }

/* Handle contact form submission */
submitContactForm = function(event) {
    event.preventDefault(); // Prevent reloading of page
    button = document.getElementById('submitFormBtn'); // Get button element
    button.innerHTML = 'Submitting Message...'; // Show confirmation text

    if (document.getElementById('errorMessage')) { // Remove previous error message (if any)
        errorMessage = document.getElementById('errorMessage'); // Get item
        errorMessage.classList.remove('animateIn'); // Animate out item
        setTimeout(function() { errorMessage.classList.add('animateOut'); }, 10); // Fix bug with animation
        setTimeout(function() { errorMessage.remove(); }, 400); // Completely remove the element after transition finished
    }

    form = document.getElementById('contactform'); // Get form element
    const data = new FormData(form); // Create formData to send
    const xhr = new XMLHttpRequest(); // Create HTTP request
    xhr.open('POST', 'contact'); // Open the HTTP request
    
    xhr.onload = function() { // Get the response
        if (xhr.status == 200) { button.innerHTML = 'Message Submitted!'; window.turnstile.reset(); } // Success!
        else { // There was an error, show a helpful error message
            button.innerHTML = 'Resubmit'; // Show error confirmation on button
            const errorMessage = document.createElement('div'); // Create error div
            errorMessage.id = 'errorMessage'; // Change ID for referral purposes
            errorMessage.classList.add('error', 'card', 'animateIn'); // Animate the card and add classes
            errorMessage.innerHTML = '<p><strong>Error ' + xhr.status + ':</strong> ' + xhr.responseText + '</p>'; // Create message
            form.insertBefore(errorMessage, form.firstChild); // Insert error message
            window.turnstile.reset(); // Reset Turnstile captcha
        }
    };
    xhr.send(data); // Send off the form data
}