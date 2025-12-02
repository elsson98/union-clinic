/**
 * United Clinic - Main JavaScript File
 * Contains all functionality for the website
 */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components based on current page
    setupUI();
});

/**
 * Sets up all UI components based on current page
 */
function setupUI() {
    // Note: Mobile menu setup is handled in includes.js

    // Get current page to load page-specific functionality
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Page-specific initializations
    if (currentPage === 'index.html' || currentPage === '') {
        setupHomePageFeatures();
    } else if (currentPage === 'calculator.html') {
        // Calculator page is already handled by the main calculator functions
    } else if (currentPage === 'contact.html') {
        setupContactForm();
    } else if (currentPage === 'faq.html') {
        setupFaqPage();
    } else if (currentPage === 'services.html') {
        // Any services page specific JS
    }
}

// Mobile menu and navigation are handled in includes.js

/**
 * Setup all home page specific features
 */
function setupHomePageFeatures() {
    // Set up testimonial slider
    setupTestimonialSlider();

    // Set up statistics animation
    setupStatisticsAnimation();
}

/**
 * Setup testimonial slider functionality
 */
function setupTestimonialSlider() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');

    if (!slides.length || !dots.length) return;

    function showSlide(n) {
        // Hide all slides
        slides.forEach(slide => {
            slide.style.display = 'none';
        });

        // Remove active class from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });

        // Show the current slide and activate its dot
        slides[n].style.display = 'block';
        dots[n].classList.add('active');
    }

    // Initialize slider
    showSlide(currentSlide);

    // Add click event to dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    // Auto-rotate slides every 5 seconds
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 5000);
}

/**
 * Set up statistics counter animation
 */
function setupStatisticsAnimation() {
    // Only run if statistics container exists
    const statisticsContainer = document.querySelector('.statistics-container');
    if (!statisticsContainer) return;

    // Use Intersection Observer to trigger animation when in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatistics();
                observer.unobserve(entry.target);
            }
        });
    }, {threshold: 0.5});

    observer.observe(statisticsContainer);
}

/**
 * Animate statistics counters
 */
function animateStatistics() {
    // Define target numbers
    const targets = {
        doctorsCount: 12,
        implantsCount: 5000,
        patientsCount: 10000,
        savingsCount: 70
    };

    // Animate each statistic
    for (const [id, target] of Object.entries(targets)) {
        const element = document.getElementById(id);
        if (element) {
            animateValue(id, 0, target, 2000);
        }
    }
}

/**
 * Animate a counter from start to end value
 */
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const suffix = id === 'savingsCount' ? '%' : '+';
    let startTimestamp = null;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + suffix;

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };

    window.requestAnimationFrame(step);
}

/**
 * Setup the contact form functionality
 */
function setupContactForm() {
    const serviceSelect = document.getElementById('service');
    const otherServiceGroup = document.getElementById('otherServiceGroup');

    // Show/hide "Other Service" field based on selection
    if (serviceSelect && otherServiceGroup) {
        serviceSelect.addEventListener('change', function () {
            if (this.value === 'altro') {
                otherServiceGroup.style.display = 'block';
            } else {
                otherServiceGroup.style.display = 'none';
            }
        });
    }

    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Simple validation
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;

            if (!name || !email || !phone) {
                alert('Per favore, compila tutti i campi obbligatori');
                return;
            }

            // Show success message
            alert(`Grazie per il tuo messaggio, ${name}! Ti contatteremo presto.`);

            // Reset form
            this.reset();
            if (otherServiceGroup) {
                otherServiceGroup.style.display = 'none';
            }
        });
    }
}

/**
 * Setup FAQ page accordion and category functionality
 */
function setupFaqPage() {
    // Set up accordion functionality
    setupAccordion();

    // Set up category tabs
    setupCategoryTabs();
}

/**
 * Sets up the accordion functionality for FAQ items
 */
function setupAccordion() {
    const accordionItems = document.querySelectorAll('.faq-question');

    accordionItems.forEach(item => {
        item.addEventListener('click', function () {
            const parent = this.parentElement;
            parent.classList.toggle('active');

            const answer = this.nextElementSibling;
            if (parent.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0px';
            }
        });
    });
}

/**
 * Sets up the category tab switching functionality
 */
function setupCategoryTabs() {
    const categoryButtons = document.querySelectorAll('.category-button');
    const categories = document.querySelectorAll('.faq-category');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Hide all categories
            categories.forEach(category => category.classList.remove('active'));

            // Show selected category
            const categoryId = this.getAttribute('data-category');
            document.getElementById(categoryId).classList.add('active');
        });
    });
}

/**
 * Search FAQ items
 */
function searchFaqs(searchTerm) {
    if (!searchTerm) {
        // If search is empty, restore original view
        document.querySelectorAll('.faq-category').forEach(cat => {
            cat.style.display = 'none';
        });
        document.querySelector('.faq-category.active').style.display = 'block';
        return;
    }

    searchTerm = searchTerm.toLowerCase();
    let found = false;

    // Show all categories for searching
    document.querySelectorAll('.faq-category').forEach(cat => {
        cat.style.display = 'block';
    });

    // Search through all questions and answers
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question h4').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
            item.classList.add('active');
            item.querySelector('.faq-answer').style.maxHeight = '500px';
            item.style.display = 'block';
            found = true;
        } else {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = '0px';
            item.style.display = 'none';
        }
    });

    // Show "not found" message if no matches
    const notFoundMessage = document.querySelector('.faq-not-found');
    if (notFoundMessage) {
        notFoundMessage.style.display = found ? 'none' : 'block';
    }
}

// Price calculator functionality
let selectedServices = [];
let priceMap = {
    'pulizia': {name: 'Pulizia del tartaro', price: 25},
    'sbiancamento': {name: 'Sbiancamento professionale', price: 150},
    'otturazione1': {name: 'Otturazione grado 1', price: 30},
    'otturazione2': {name: 'Otturazione grado 2', price: 40},
    'otturazione3': {name: 'Otturazione grado 3', price: 70},
    'coronaZ': {name: 'Corona in zirconio', price: 150},
    'coronaMP': {name: 'Corona in metallo-porcellana', price: 100},
    'faccetteC': {name: 'Faccette in composito', price: 80},
    'faccetteE': {name: 'Faccette EMax', price: 200},
    'impianti': {name: 'Impianti', price: 300},
    'rialzo': {name: 'Rialzo del seno mascellare', price: 400},
    'mascherina': {name: 'Mascherina ortodontica', price: 1200},
    'ortodonzia': {name: 'Trattamento ortodontico', price: 1500},
    'innesto': {name: 'Innesto osseo', price: 250},
    'estrazione': {name: 'Estrazione denti 18, 28, 38, 48', price: 100},
    'trapianto-dhi': {name: 'Trapianto capelli DHI', price: 1800},
    'trapianto-fue': {name: 'Trapianto capelli FUE', price: 1500},
    'prp': {name: 'PRP', price: 100}
};

function addService() {
    const serviceDropdown = document.getElementById('service-dropdown');
    if (!serviceDropdown) return; // Exit if element doesn't exist

    const serviceId = serviceDropdown.value;

    if (serviceId) {
        selectedServices.push(serviceId);
        updateServicesList();
        updateTotalPrice();
        serviceDropdown.value = '';
    }
}

function removeService(index) {
    selectedServices.splice(index, 1);
    updateServicesList();
    updateTotalPrice();
}

function updateServicesList() {
    const servicesList = document.getElementById('services-list');
    if (!servicesList) return; // Exit if element doesn't exist

    if (selectedServices.length === 0) {
        servicesList.innerHTML = '<p>Nessun servizio selezionato</p>';
        return;
    }

    let html = '';
    selectedServices.forEach((serviceId, index) => {
        const service = priceMap[serviceId];
        html += `
            <div class="service-item">
                <span>${service.name} - ${service.price}€</span>
                <button onclick="removeService(${index})">Rimuovi</button>
            </div>
        `;
    });

    servicesList.innerHTML = html;
}

function updateTotalPrice() {
    const totalPriceElement = document.getElementById('total-price');
    if (!totalPriceElement) return; // Exit if element doesn't exist

    const totalPrice = selectedServices.reduce((total, serviceId) => {
        return total + priceMap[serviceId].price;
    }, 0);

    totalPriceElement.innerHTML = `Totale: ${totalPrice}€`;
}

// Calculator estimate functions
function clearAll() {
    selectedServices = [];
    updateServicesList();
    updateTotalPrice();
}

function saveEstimate() {
    const estimateResult = document.getElementById('estimate-result');
    const estimateContent = document.getElementById('estimate-content');

    if (!estimateResult || !estimateContent) return;

    if (selectedServices.length === 0) {
        alert('Aggiungi almeno un servizio al preventivo.');
        return;
    }

    // Generate estimate content
    let html = `
        <div class="estimate-header">
            <h4>United Clinic - Preventivo</h4>
            <p>Data: ${new Date().toLocaleDateString()}</p>
        </div>
        <table class="estimate-table">
            <thead>
                <tr>
                    <th>Servizio</th>
                    <th>Prezzo</th>
                </tr>
            </thead>
            <tbody>
    `;

    selectedServices.forEach(serviceId => {
        const service = priceMap[serviceId];
        html += `
            <tr>
                <td>${service.name}</td>
                <td>${service.price}€</td>
            </tr>
        `;
    });

    const totalPrice = selectedServices.reduce((total, serviceId) => {
        return total + priceMap[serviceId].price;
    }, 0);

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <th>Totale</th>
                    <th>${totalPrice}€</th>
                </tr>
            </tfoot>
        </table>
        <div class="estimate-footer">
            <p><strong>Nota:</strong> Questo preventivo è valido per 30 giorni. I prezzi potrebbero variare in base alla valutazione clinica individuale.</p>
            <p>Per maggiori informazioni, contattaci al: +355676751515 o via email: info@unionclinic.al</p>
        </div>
    `;

    estimateContent.innerHTML = html;
    estimateResult.style.display = 'block';

    // Scroll to estimate
    estimateResult.scrollIntoView({behavior: 'smooth'});
}

function printEstimate() {
    const estimateContent = document.getElementById('estimate-content');
    if (!estimateContent) return;

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preventivo - United Clinic</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .estimate-header { text-align: center; margin-bottom: 20px; }
                .estimate-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .estimate-table th, .estimate-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .estimate-table th { background-color: #f2f2f2; }
                .estimate-footer { margin-top: 30px; font-size: 0.9em; color: #666; }
            </style>
        </head>
        <body>
            ${estimateContent.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function emailEstimate() {
    const email = prompt('Inserisci il tuo indirizzo email per ricevere il preventivo:', '');

    if (email && email.includes('@')) {
        alert(`Grazie! Il preventivo è stato inviato a ${email}. Controlla la tua casella di posta.`);
    } else if (email) {
        alert('Per favore, inserisci un indirizzo email valido.');
        emailEstimate();
    }
}

