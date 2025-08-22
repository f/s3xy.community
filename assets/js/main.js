// Main JavaScript for Awesome S3XY Buttons
(function() {
    'use strict';

    // DOM Elements
    const searchInput = document.getElementById('search');
    const modelFilter = document.getElementById('model-filter');
    const deviceFilter = document.getElementById('device-filter');
    const categoryFilter = document.getElementById('category-filter');

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const customScenarioCards = document.querySelectorAll('.custom-scenario-card');
    const featureCards = document.querySelectorAll('.feature-card');
    const categorySections = document.querySelectorAll('.category-section');

    // State
    let currentTab = 'scenarios';
    let filters = {
        search: '',
        model: '',
        device: '',
        category: ''
    };

    // Initialize
    function init() {
        attachEventListeners();
        updateStats();
    }

    // Event Listeners
    function attachEventListeners() {
        // Tab Navigation
        tabButtons.forEach(btn => {
            btn.addEventListener('click', handleTabChange);
        });

        // Search
        if (searchInput) {
            searchInput.addEventListener('input', debounce(handleSearch, 300));
        }

        // Filters
        if (modelFilter) {
            modelFilter.addEventListener('change', handleModelFilter);
        }
        
        if (deviceFilter) {
            deviceFilter.addEventListener('change', handleDeviceFilter);
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', handleCategoryFilter);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // Tab Change Handler
    function handleTabChange(e) {
        const targetTab = e.currentTarget.dataset.tab;
        if (targetTab === currentTab) return;

        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show/hide tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // Update current tab
        currentTab = targetTab;

        // Update search placeholder
        if (searchInput) {
            searchInput.placeholder = targetTab === 'scenarios' 
                ? 'Search scenarios...' 
                : 'Search features...';
        }

        // Update filter visibility
        updateFilterVisibility();
        
        // Clear and reapply filters
        applyFilters();
    }

    // Update filter visibility based on current tab
    function updateFilterVisibility() {
        const filterContainer = document.querySelector('.filter-container');
        if (currentTab === 'scenarios') {
            // Hide all filters for scenarios tab
            if (filterContainer) {
                filterContainer.classList.add('hidden');
            }
        } else {
            // Show filters for features tab
            if (filterContainer) {
                filterContainer.classList.remove('hidden');
            }
        }
    }

    // Search Handler
    function handleSearch(e) {
        filters.search = e.target.value.toLowerCase();
        applyFilters();
    }

    // Model Filter Handler
    function handleModelFilter(e) {
        filters.model = e.target.value.toLowerCase();
        applyFilters();
    }

    // Device Filter Handler
    function handleDeviceFilter(e) {
        filters.device = e.target.value;
        applyFilters();
    }

    // Category Filter Handler
    function handleCategoryFilter(e) {
        filters.category = e.target.value;
        applyFilters();
    }



    // Apply Filters
    function applyFilters() {
        let visibleCount = 0;
        const visibleCategories = new Set();

        if (currentTab === 'scenarios') {
            // Filter custom scenarios
            customScenarioCards.forEach(card => {
                const shouldShow = passesScenarioFilters(card);
                
                if (shouldShow) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });
        } else {
            // Filter features
            featureCards.forEach(card => {
                const shouldShow = passesFeatureFilters(card);
                
                if (shouldShow) {
                    card.classList.remove('hidden');
                    visibleCount++;
                    visibleCategories.add(card.dataset.category);
                } else {
                    card.classList.add('hidden');
                }
            });

            // Hide empty categories in features tab
            categorySections.forEach(section => {
                const categoryName = section.dataset.category;
                if (visibleCategories.has(categoryName)) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        }

        // Update visible count
        updateVisibleCount(visibleCount);
    }

    // Check if scenario card passes filters
    function passesScenarioFilters(card) {
        // Search filter
        if (filters.search) {
            const name = card.dataset.name || '';
            const description = card.querySelector('.scenario-description')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase()).join(' ');
            
            if (!name.includes(filters.search) && 
                !description.includes(filters.search) && 
                !tags.includes(filters.search)) {
                return false;
            }
        }

        // Model filter
        if (filters.model) {
            const modelBadges = Array.from(card.querySelectorAll('.model-badge'));
            // Extract just the model letter/number from the filter value
            const filterModelType = filters.model.replace('model ', '').split(' ')[0];
            const hasModel = modelBadges.some(badge => 
                badge.textContent.toLowerCase().includes(filterModelType.toLowerCase())
            );
            if (!hasModel) {
                return false;
            }
        }

        return true;
    }

    // Check if feature card passes all filters
    function passesFeatureFilters(card) {
        // Search filter
        if (filters.search) {
            const name = card.dataset.name || '';
            const notes = card.querySelector('.feature-notes')?.textContent.toLowerCase() || '';
            if (!name.includes(filters.search) && !notes.includes(filters.search)) {
                return false;
            }
        }

        // Model filter
        if (filters.model) {
            const modelsData = card.dataset.models || '';
            if (!modelsData.includes(filters.model.toLowerCase())) {
                return false;
            }
        }

        // Device filter
        if (filters.device) {
            const deviceCount = parseInt(card.dataset[filters.device] || '0');
            if (deviceCount === 0) {
                return false;
            }
        }

        // Category filter
        if (filters.category && card.dataset.category !== filters.category) {
            return false;
        }

        return true;
    }

    // Update visible count
    function updateVisibleCount(count) {
        if (currentTab === 'scenarios') {
            const total = customScenarioCards.length;
            // Update scenario count display if needed
        } else {
            const totalElement = document.getElementById('total-features');
            if (totalElement) {
                const total = featureCards.length;
                if (count < total) {
                    totalElement.textContent = `${count} / ${total}`;
                    totalElement.style.color = 'var(--accent-warning)';
                } else {
                    totalElement.textContent = total;
                    totalElement.style.color = 'var(--accent-primary)';
                }
            }
        }
    }

    // Update stats
    function updateStats() {
        const totalFeatures = document.querySelectorAll('.feature-card').length;
        const totalFeaturesElement = document.getElementById('total-features');
        if (totalFeaturesElement) {
            totalFeaturesElement.textContent = totalFeatures;
        }
        
        // Initialize filter visibility
        updateFilterVisibility();
    }

    // Keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + F - Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput?.focus();
        }

        // Escape - Clear search
        if (e.key === 'Escape') {
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                filters.search = '';
                applyFilters();
            }
        }


    }

    // Utility: Debounce
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Copy scenario ID to clipboard
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('scenario-id')) {
            const id = e.target.textContent;
            navigator.clipboard.writeText(id).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = 'Copied!';
                e.target.style.color = 'var(--accent-success)';
                
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.style.color = '';
                }, 1500);
            });
        }
    });

    // Smooth scroll to category
    document.addEventListener('click', function(e) {
        if (e.target.closest('.category-title')) {
            e.target.closest('.category-title').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
