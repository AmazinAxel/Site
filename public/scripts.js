/*
 * This script handles theme (light & dark mode) switching.
 * Copyright (c) 2023 AmazinAxel (Alec) <amazinaxel.com>
 * This program is licensed under the GPLv3.
 */

// Dark theme = true, light theme = false

const doc = document.documentElement; // Document shorthand
let mode = localStorage.getItem("mode"); // Get mode from device local storage
(mode === null) ? // Change theme based on device
    mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches: // If dark mode, change theme
    mode = (mode === 'true'); // Convert to boolean

function setMode() { // Toggle between dark & light mode
    (mode) ? doc.classList.remove('dark-mode'): doc.classList.add('dark-mode'); // Handle toggling
    localStorage.setItem("mode", mode); // Set current mode
}

function updIcon() { // Update the button icon
    if (mode == true) { modeToggle.src = '/icons/dark-mode.svg'; modeToggle.classList.remove('dark'); }
    else { modeToggle.src = '/icons/light-mode.svg'; modeToggle.classList.add('dark'); }
}

function toggleMode() { mode = !mode; setMode(); updIcon(); } // Toggle mode

setMode(); // Set mode immediately before page load to stop the flashing of the wrong theme
window.onload = function() { 
    modeToggle = document.getElementById('modeToggleIcon'); // Fix bug, add modeToggle shorthand
    document.getElementById('modeToggle').classList.remove('hidden'); // Show mode toggle button
    updIcon(); 
}