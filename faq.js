/**
 * FAQ page functionality
 * Handles accordion toggling and category switching
 */

document.addEventListener('DOMContentLoaded', function () {
    // Set up accordion functionality
    setupAccordion();

    // Set up category tabs
    setupCategoryTabs();
});

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
 * Opens all FAQ items at once (for debugging or print view)
 */
function expandAllFaqs() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.classList.add('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    });
}

/**
 * Closes all FAQ items at once
 */
function collapseAllFaqs() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.classList.remove('active');
        const answer = item.querySelector('.faq-answer');
        answer.style.maxHeight = '0px';
    });
}

/**
 * Performs a search across all FAQ items
 * @param {string} searchTerm - The text to search for
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
            item.querySelector('.faq-answer').style.maxHeight = '500px'; // Arbitrary large value
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