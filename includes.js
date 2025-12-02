document.addEventListener('DOMContentLoaded', function () {
    ensureFavicon();

    // Load header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-include').innerHTML = data;
            setupMobileMenu();
            setActiveNavItem();
            setupHideNavOnScroll();
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

// Ensure favicon is set to our icon for all pages
function ensureFavicon() {
    document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());

    const icons = [
        { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg?v=3' },
        { rel: 'shortcut icon', type: 'image/svg+xml', href: 'favicon.svg?v=3' },
        { rel: 'icon', type: 'image/png', sizes: '64x51', href: 'favicon.png?v=3' }
    ];

    icons.forEach(icon => {
        const link = document.createElement('link');
        Object.entries(icon).forEach(([key, value]) => link.setAttribute(key, value));
        document.head.appendChild(link);
    });
}

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

// Hide navbar on scroll down (mobile only)
function setupHideNavOnScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = window.scrollY;
    let ticking = false;

    const update = () => {
        const current = window.scrollY;
        const isMobile = window.innerWidth <= 768;
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (!isMobile) {
            navbar.classList.remove('hide');
            lastScroll = current;
            ticking = false;
            return;
        }

        // Collapse open mobile menu when user starts scrolling
        if (navMenu?.classList.contains('active')) {
            navMenu.classList.remove('active');
            hamburger?.classList.remove('active');
        }

        if (current > lastScroll + 5 && current > 80) {
            navbar.classList.add('hide');
        } else {
            navbar.classList.remove('hide');
        }

        lastScroll = current;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    });

    window.addEventListener('resize', update);
}
