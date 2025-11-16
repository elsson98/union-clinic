document.addEventListener('DOMContentLoaded', function () {
    // Load header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-include').innerHTML = data;
            setupMobileMenu();
            setActiveNavItem();
        })
        .catch(error => console.error('Error loading header:', error));

    // Load footer
    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-include').innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));
});

// Set active navigation item based on current page
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Remove active class from all nav items
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });

    // Set active class based on current page
    if (currentPage === 'index.html' || currentPage === '') {
        document.querySelector('.nav-menu a[href="index.html"]')?.classList.add('active');
    } else if (currentPage.includes('service')) {
        document.querySelector('.nav-menu a[href="services.html"]')?.classList.add('active');
    } else if (currentPage.includes('about')) {
        document.querySelector('.nav-menu a[href="about.html"]')?.classList.add('active');
    } else if (currentPage.includes('testimonial')) {
        document.querySelector('.nav-menu a[href="testimonials.html"]')?.classList.add('active');
    } else if (currentPage.includes('contact')) {
        document.querySelector('.nav-menu a[href="contact.html"]')?.classList.add('active');
    } else if (currentPage.includes('calculator')) {
        document.querySelector('.nav-menu a[href="calculator.html"]')?.classList.add('active');
    }

    // Also check for section IDs in the URL for sub-navigation
    const hash = window.location.hash;
    if (hash) {
        document.querySelectorAll('.dropdown-content a').forEach(link => {
            if (link.getAttribute('href').includes(hash)) {
                link.classList.add('active');
                // Also highlight the parent dropdown
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const parentLink = parentDropdown.querySelector('a');
                    if (parentLink) {
                        parentLink.classList.add('active');
                    }
                }
            }
        });
    }
}

// Setup mobile menu toggle
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}