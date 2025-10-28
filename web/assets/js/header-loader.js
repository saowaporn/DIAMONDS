/**
 * Universal Header Loader and Mobile Navigation
 * This script handles header loading and mobile navigation for all pages
 */

// Function to load header for pages that use fetch
function loadHeader() {
  const headerElement = document.getElementById('header');
  if (headerElement && !headerElement.querySelector('nav')) {
    fetch("./Part/Header.html")
      .then(response => response.text())
      .then(data => {
        headerElement.innerHTML = data;
        // Initialize mobile navigation after header is loaded
        if (typeof initMobileNavigation === 'function') {
          initMobileNavigation();
        }
      })
      .catch(error => {
        console.error('Error loading header:', error);
      });
  }
}

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  // Try to load header if needed
  loadHeader();
  
  // Initialize mobile navigation if header already exists (for inline headers)
  setTimeout(() => {
    if (typeof initMobileNavigation === 'function') {
      initMobileNavigation();
    }
  }, 100);
});

// Export for global use
window.loadHeader = loadHeader;