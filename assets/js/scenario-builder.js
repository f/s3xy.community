// Scenario Builder JavaScript
(function() {
    'use strict';
    
    // Elements
    const openBuilderBtn = document.getElementById('open-scenario-builder');
    const builderModal = document.getElementById('scenario-builder-modal');
    const featureSelectorModal = document.getElementById('feature-selector-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const previewJsonBtn = document.getElementById('preview-json');
    const createIssueBtn = document.getElementById('create-issue');
    const jsonPreview = document.getElementById('json-preview');
    const jsonOutput = document.getElementById('json-output');
    const featureSearch = document.getElementById('feature-search');
    
    // State
    let currentStepElement = null;
    let stepIdCounter = 0;
    
    // Open/Close Modal
    if (openBuilderBtn) {
        openBuilderBtn.addEventListener('click', () => {
            builderModal.classList.add('active');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            builderModal.classList.remove('active');
        });
    }
    
    // Close feature selector
    document.querySelectorAll('.close-feature-selector').forEach(btn => {
        btn.addEventListener('click', () => {
            featureSelectorModal.classList.remove('active');
        });
    });
    
    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target === builderModal) {
            builderModal.classList.remove('active');
        }
        if (e.target === featureSelectorModal) {
            featureSelectorModal.classList.remove('active');
        }
    });
    
    // Add Step Buttons
    document.querySelectorAll('.add-step-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pressType = e.target.dataset.press;
            addStep(pressType);
        });
    });
    
    // Add Step Function
    function addStep(pressType) {
        const stepsList = document.querySelector(`.steps-builder[data-press="${pressType}"] .steps-list`);
        const stepId = `step-${stepIdCounter++}`;
        
        const stepHtml = `
            <div class="step-item" data-step-id="${stepId}">
                <div class="step-type">
                    <button class="step-type-btn active" data-type="feature">Feature</button>
                    <button class="step-type-btn" data-type="delay">Delay</button>
                </div>
                <div class="step-content">
                    <div class="step-feature-content">
                        <input type="text" class="step-feature-name" placeholder="Click to select feature" readonly data-feature="">
                        <input type="text" class="step-note-input" placeholder="Optional note">
                    </div>
                    <div class="step-delay-content hidden">
                        <input type="number" class="step-delay-input" min="1" max="10" value="1">
                        <span>seconds</span>
                    </div>
                </div>
                <button class="remove-step">&times;</button>
            </div>
        `;
        
        stepsList.insertAdjacentHTML('beforeend', stepHtml);
        
        // Add event listeners to new step
        const stepElement = stepsList.querySelector(`[data-step-id="${stepId}"]`);
        setupStepEventListeners(stepElement);
    }
    
    // Setup Step Event Listeners
    function setupStepEventListeners(stepElement) {
        // Type toggle
        stepElement.querySelectorAll('.step-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const stepItem = e.target.closest('.step-item');
                
                // Update active button
                stepItem.querySelectorAll('.step-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Toggle content
                if (type === 'feature') {
                    stepItem.querySelector('.step-feature-content').classList.remove('hidden');
                    stepItem.querySelector('.step-delay-content').classList.add('hidden');
                } else {
                    stepItem.querySelector('.step-feature-content').classList.add('hidden');
                    stepItem.querySelector('.step-delay-content').classList.remove('hidden');
                }
            });
        });
        
        // Feature selector
        stepElement.querySelector('.step-feature-name').addEventListener('click', (e) => {
            currentStepElement = e.target;
            featureSelectorModal.classList.add('active');
        });
        
        // Remove step
        stepElement.querySelector('.remove-step').addEventListener('click', (e) => {
            e.target.closest('.step-item').remove();
        });
    }
    
    // Feature Selection
    document.querySelectorAll('.feature-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (currentStepElement) {
                const featureName = e.target.dataset.feature;
                currentStepElement.value = featureName;
                currentStepElement.dataset.feature = featureName;
                featureSelectorModal.classList.remove('active');
                currentStepElement = null;
            }
        });
    });
    
    // Feature Search
    if (featureSearch) {
        featureSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            document.querySelectorAll('.feature-option').forEach(option => {
                const featureName = option.dataset.feature.toLowerCase();
                const shouldShow = featureName.includes(searchTerm);
                option.style.display = shouldShow ? 'block' : 'none';
            });
            
            // Hide empty categories
            document.querySelectorAll('.feature-category').forEach(category => {
                const hasVisible = Array.from(category.querySelectorAll('.feature-option'))
                    .some(opt => opt.style.display !== 'none');
                category.style.display = hasVisible ? 'block' : 'none';
            });
        });
    }
    
    // Build JSON
    function buildScenarioJson() {
        const name = document.getElementById('scenario-name').value.trim();
        const description = document.getElementById('scenario-description').value.trim();
        const author = document.getElementById('scenario-author').value.trim();
        
        // Get selected models
        const models = [];
        document.querySelectorAll('.model-checkboxes input:checked').forEach(cb => {
            models.push(cb.value);
        });
        
        // Build actions
        const actions = {};
        
        ['single_press', 'double_press', 'long_press'].forEach(pressType => {
            const actionName = document.querySelector(`.action-name[data-press="${pressType}"]`).value.trim();
            const actionDesc = document.querySelector(`.action-description[data-press="${pressType}"]`).value.trim();
            const steps = [];
            
            document.querySelectorAll(`.steps-builder[data-press="${pressType}"] .step-item`).forEach(stepItem => {
                const isFeature = stepItem.querySelector('.step-type-btn.active').dataset.type === 'feature';
                
                if (isFeature) {
                    const featureName = stepItem.querySelector('.step-feature-name').value.trim();
                    const note = stepItem.querySelector('.step-note-input').value.trim();
                    
                    if (featureName) {
                        const step = { feature: featureName };
                        if (note) step.note = note;
                        steps.push(step);
                    }
                } else {
                    const delay = parseInt(stepItem.querySelector('.step-delay-input').value) || 1;
                    steps.push({ delay: delay });
                }
            });
            
            if (actionName || steps.length > 0) {
                actions[pressType] = {
                    name: actionName || `${pressType.replace('_', ' ')} action`,
                    description: actionDesc,
                    steps: steps
                };
            }
        });
        
        // Generate ID
        const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        return {
            id: id || 'new-scenario',
            name: name || 'New Scenario',
            description: description || 'A custom button scenario',
            author: author || 'anonymous',
            models: models.length > 0 ? models : ['S', '3', 'X', 'Y'],
            actions: actions
        };
    }
    
    // Preview JSON
    if (previewJsonBtn) {
        previewJsonBtn.addEventListener('click', () => {
            const scenario = buildScenarioJson();
            jsonOutput.textContent = JSON.stringify(scenario, null, 2);
            jsonPreview.classList.remove('hidden');
        });
    }
    
    // Create GitHub Issue
    if (createIssueBtn) {
        createIssueBtn.addEventListener('click', () => {
            const scenario = buildScenarioJson();
            
            // Validate required fields
            if (!scenario.name || scenario.name === 'New Scenario') {
                alert('Please enter a scenario name');
                return;
            }
            
            if (!scenario.author || scenario.author === 'anonymous') {
                alert('Please enter your GitHub username');
                return;
            }
            
            if (!scenario.description || scenario.description === 'A custom button scenario') {
                alert('Please enter a description');
                return;
            }
            
            // Check if any actions have steps
            const hasSteps = Object.values(scenario.actions).some(action => action.steps.length > 0);
            if (!hasSteps) {
                alert('Please add at least one step to your scenario');
                return;
            }
            
            // Build issue content
            const issueTitle = `(feat) ${scenario.name}`;
            const issueBody = `## Scenario Description
${scenario.description}

## Author
@${scenario.author}

## Supported Models
${scenario.models.map(m => `- Model ${m}`).join('\n')}

## Scenario Data
\`\`\`json
${JSON.stringify(scenario, null, 2)}
\`\`\`

---
*This scenario was created using the S3XY Community scenario builder.*
`;
            
            // Create GitHub issue URL
            const params = new URLSearchParams({
                title: issueTitle,
                body: issueBody,
                labels: 'new-scenario'
            });
            
            const issueUrl = `https://github.com/f/s3xy.community/issues/new?${params.toString()}`;
            
            // Open in new tab
            window.open(issueUrl, '_blank');
        });
    }
    
    // Add missing hidden class styles
    const style = document.createElement('style');
    style.textContent = `
        .step-feature-content.hidden,
        .step-delay-content.hidden {
            display: none !important;
        }
        .step-delay-content {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }
    `;
    document.head.appendChild(style);
})();
