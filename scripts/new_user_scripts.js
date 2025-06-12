document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const form = document.getElementById('registrationForm');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    const stepTitleElement = document.getElementById('stepTitle');
    const stepSubtitleElement = document.getElementById('stepSubtitle');
    const progressFill = document.getElementById('progressFill');
    const stepTextElement = document.getElementById('stepText');

    const toastContainer = document.getElementById('toastContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Form Fields (using IDs from your HTML)
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const dobInput = document.getElementById('dateOfBirth');
    const genderInput = document.getElementById('gender');
    const bloodTypeInput = document.getElementById('bloodType');
    const allergiesInput = document.getElementById('allergies');
    const emergencyContactInput = document.getElementById('emergencyContact');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const securityQuestionInput = document.getElementById('securityQuestion');
    const securityAnswerInput = document.getElementById('securityAnswer');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');

    const logoSection = document.querySelector('.logo-section');

    // --- State Variables ---
    let currentStep = 0;
    const totalSteps = steps.length;
    let registrationInProgress = false; // To prevent multiple submissions
    let autoSaveInterval;

    const stepDetails = [
        { title: "Personal Information", subtitle: "Enter your basic details to get started" },
        { title: "Physical Details", subtitle: "Provide us with your physical metrics" },
        { title: "Medical Information", subtitle: "Share some relevant medical history" },
        { title: "Security Setup", subtitle: "Secure your account and agree to terms" }
    ];

    const logoMessages = [
        "Welcome to MediMate!",
        "Your health journey starts here.",
        "We're glad to have you.",
        "Dedicated to your well-being.",
        "Stay healthy, stay happy!"
    ];
    let logoClickCount = 0;


    // --- Initialization ---
    function initializeForm() {
        setMaxDateForDOB();
        loadFormData(); // Load saved data first
        showStep(currentStep); // Then show the step (could be loaded step)
        updateButtonVisibility();
        updateProgress();
        addInputEventListeners();
        startAutoSave();

        // Warn user before leaving page if form has data
        window.addEventListener('beforeunload', (e) => {
            if (isFormDataPresent() && !registrationInProgress) {
                saveFormData(); // Save one last time
                e.preventDefault(); // Standard for most browsers
                e.returnValue = ''; // Required for some browsers
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        });
    }

    function setMaxDateForDOB() {
        const today = new Date();
        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        dobInput.max = eighteenYearsAgo.toISOString().split('T')[0];
    }

    // --- Step Management ---
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            step.classList.toggle('active', index === stepIndex);
        });
        currentStep = stepIndex;
        updateHeaderAndProgress();
        updateButtonVisibility();
        // Focus on the first input of the current step for accessibility
        const firstInput = steps[currentStep].querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) {
            firstInput.focus();
        }
    }

    function updateHeaderAndProgress() {
        if (stepDetails[currentStep]) {
            stepTitleElement.textContent = stepDetails[currentStep].title;
            stepSubtitleElement.textContent = stepDetails[currentStep].subtitle;
        }
        const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
        progressFill.style.width = `${progressPercentage}%`;
        stepTextElement.textContent = `Step ${currentStep + 1} of ${totalSteps}`;
    }

    function updateButtonVisibility() {
        prevBtn.classList.toggle('visible', currentStep > 0);
        nextBtn.style.display = currentStep < totalSteps - 1 ? 'inline-flex' : 'none';
        submitBtn.style.display = currentStep === totalSteps - 1 ? 'inline-flex' : 'none';
    }

    // --- Navigation ---
    window.nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                showStep(currentStep);
                saveFormData(); // Save progress when moving to next step
            }
        }
    };

    window.previousStep = () => {
        if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
        }
    };

    // --- Validation ---
    function validateStep(stepIndex) {
        clearAllErrors(steps[stepIndex]);
        let isValid = true;
        const currentStepFields = steps[stepIndex].querySelectorAll('[required], input[type="password"], input[type="email"], input[type="tel"], input[id="height"], input[id="weight"]');

        currentStepFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        return isValid;
    }

    function validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Basic required check
        if (field.hasAttribute('required') && !value && field.type !== 'checkbox') {
            isValid = false;
            errorMessage = `${getLabelText(field)} is required.`;
        } else if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
            isValid = false;
            errorMessage = `You must agree to the ${getLabelText(field)}.`;
        }

        // Specific validations
        if (isValid || value) { // Only run specific validation if basic passed or field has value
            switch (fieldId) {
                case 'firstName':
                case 'lastName':
                    if (value && !/^[a-zA-Z\s'-]+$/.test(value)) {
                        isValid = false; errorMessage = 'Please enter a valid name (letters, spaces, hyphens, apostrophes).';
                    } else if (value && value.length < 2) {
                        isValid = false; errorMessage = 'Name must be at least 2 characters.';
                    }
                    break;
                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        isValid = false; errorMessage = 'Please enter a valid email address.';
                    }
                    break;
                case 'phone':
                case 'emergencyContact':
                    if (value && !/^\+?[0-9\s-()]{7,20}$/.test(value)) {
                        isValid = false; errorMessage = 'Please enter a valid phone number (7-20 digits, can include +, -, (), spaces).';
                    }
                    break;
                case 'dateOfBirth':
                    if (value) {
                        const dob = new Date(value);
                        const today = new Date();
                        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                        if (dob > eighteenYearsAgo) {
                            isValid = false; errorMessage = 'You must be at least 18 years old.';
                        }
                    }
                    break;
                case 'height':
                    if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 50 || parseFloat(value) > 300)) {
                        isValid = false; errorMessage = 'Height must be a number between 50 and 300 cm.';
                    }
                    break;
                case 'weight':
                     if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 10 || parseFloat(value) > 500)) {
                        isValid = false; errorMessage = 'Weight must be a number between 10 and 500 kg.';
                    }
                    break;
                case 'password':
                    const passwordValidation = validatePassword(value);
                    if (!passwordValidation.isValid) {
                        isValid = false;
                        errorMessage = passwordValidation.message || 'Password does not meet all requirements.';
                    }
                    if (value !== confirmPasswordInput.value && confirmPasswordInput.value.trim() !== '') {
                       showError(confirmPasswordInput, "Passwords do not match."); // Also mark confirm if different
                    } else if (confirmPasswordInput.value.trim() !== '') {
                       clearError(confirmPasswordInput);
                    }
                    break;
                case 'confirmPassword':
                    if (value !== passwordInput.value) {
                        isValid = false; errorMessage = 'Passwords do not match.';
                    }
                    break;
            }
        }


        if (!isValid) {
            showError(field, errorMessage);
        } else {
            clearError(field);
        }
        return isValid;
    }

    function validatePassword(password) {
        const errors = [];
        const lengthReq = document.getElementById('lengthReq');
        const uppercaseReq = document.getElementById('uppercaseReq');
        const lowercaseReq = document.getElementById('lowercaseReq');
        const numberReq = document.getElementById('numberReq');

        let reqValid = password.length >= 8;
        updateRequirement(lengthReq, reqValid);
        if (!reqValid) errors.push("at least 8 characters");

        reqValid = /[A-Z]/.test(password);
        updateRequirement(uppercaseReq, reqValid);
        if (!reqValid) errors.push("one uppercase letter");

        reqValid = /[a-z]/.test(password);
        updateRequirement(lowercaseReq, reqValid);
        if (!reqValid) errors.push("one lowercase letter");

        reqValid = /[0-9]/.test(password);
        updateRequirement(numberReq, reqValid);
        if (!reqValid) errors.push("one number");

        if (errors.length > 0) {
            return { isValid: false, message: `Password must contain ${errors.join(', ')}.` };
        }
        return { isValid: true };
    }

    function updateRequirement(element, isValid) {
        const icon = element.querySelector('i');
        if (isValid) {
            element.classList.add('valid');
            element.classList.remove('invalid');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-check');
        } else {
            element.classList.add('invalid');
            element.classList.remove('valid');
            icon.classList.remove('fa-check');
            icon.classList.add('fa-times');
        }
    }

    function getLabelText(field) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        return label ? label.innerText.trim().replace(':', '') : field.placeholder || field.id;
    }

    function showError(field, message) {
        field.classList.add('error');
        const errorElement = document.getElementById(`${field.id}Error`) || field.closest('.form-group')?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    function clearError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}Error`) || field.closest('.form-group')?.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    function clearAllErrors(stepElement) {
        const errorMessages = stepElement.querySelectorAll('.error-message');
        errorMessages.forEach(msg => {
            msg.textContent = '';
            msg.style.display = 'none';
        });
        const errorInputs = stepElement.querySelectorAll('.error');
        errorInputs.forEach(input => input.classList.remove('error'));
    }


    // --- Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (registrationInProgress) return;

        if (validateStep(currentStep) && agreeTermsCheckbox.checked) {
            registrationInProgress = true;
            showLoading(true, "Creating your account...");

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            const formData = getFormData();
            const users = JSON.parse(localStorage.getItem('medimate_users')) || [];

            if (users.some(user => user.email === formData.email)) {
                showLoading(false);
                showToast('An account with this email already exists.', 'error');
                // Optionally, navigate to email field and focus
                showStep(0); // Assuming email is in step 0
                emailInput.focus();
                showError(emailInput, 'An account with this email already exists.');
                registrationInProgress = false;
                return;
            }
            
            formData.userId = generateUserId(); // Add a unique ID
            users.push(formData);
            localStorage.setItem('medimate_users', JSON.stringify(users));
            localStorage.setItem('medimate_currentUser', JSON.stringify({userId: formData.userId, email: formData.email, firstName: formData.firstName})); // Set session
            
            clearFormDataFromStorage(); // Clear registration form data
            
            showToast('Account created successfully! Redirecting...', 'success');
            
            // Fade out and redirect
            document.body.style.transition = 'opacity 0.5s ease-out';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                // Ensure path is correct
                window.location.href = 'medicine.html'; // Or your dashboard page
            }, 1000); // Wait for toast and fade

        } else if (!agreeTermsCheckbox.checked) {
            showError(agreeTermsCheckbox, 'You must agree to the Terms of Service and Privacy Policy.');
            showToast('Please agree to the terms and conditions.', 'warning');
        } else {
            showToast('Please correct the errors in the form.', 'error');
        }
    });

    function generateUserId() {
        return 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    }

    // --- Data Persistence (localStorage) ---
    function getFormData() {
        const data = {};
        const inputs = form.querySelectorAll('input:not([type="checkbox"]), select, textarea');
        inputs.forEach(input => {
            data[input.id] = input.value;
        });
        data[agreeTermsCheckbox.id] = agreeTermsCheckbox.checked;
        return data;
    }
    
    window.saveFormData = () => { // Make it globally accessible for onbeforeunload
        if (registrationInProgress) return; // Don't save if submission is happening
        const data = getFormData();
        data.currentStep = currentStep; // Save current step
        localStorage.setItem('medimate_registrationForm', JSON.stringify(data));
        // console.log('Form data saved');
    };

    function loadFormData() {
        const savedData = JSON.parse(localStorage.getItem('medimate_registrationForm'));
        if (savedData) {
            const inputs = form.querySelectorAll('input:not([type="checkbox"]), select, textarea');
            inputs.forEach(input => {
                if (savedData[input.id] !== undefined) {
                    input.value = savedData[input.id];
                }
            });
            if (savedData[agreeTermsCheckbox.id] !== undefined) {
                agreeTermsCheckbox.checked = savedData[agreeTermsCheckbox.id];
            }
            if (savedData.currentStep !== undefined && savedData.currentStep < totalSteps) {
                currentStep = parseInt(savedData.currentStep, 10);
            }
            // Re-validate password requirements if password field has loaded data
            if (passwordInput.value) {
                validatePassword(passwordInput.value);
            }
            // console.log('Form data loaded');
        }
    }
    
    function isFormDataPresent() {
        const data = getFormData();
        // Check if any significant field has data, excluding default select values or empty strings
        return Object.values(data).some(value => {
            if (typeof value === 'boolean') return value; // e.g., checkbox checked
            if (typeof value === 'string') return value.trim() !== '' && value !== 'Select Gender' && value !== 'Select Blood Group (Optional)' && value !== 'Choose a security question';
            return false;
        });
    }


    function clearFormDataFromStorage() {
        localStorage.removeItem('medimate_registrationForm');
    }

    function addInputEventListeners() {
        const allInputs = form.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                validateField(input); // Real-time validation on input
                if (input.id === 'password') {
                    validatePassword(input.value);
                }
                // Debounced save for performance
                clearTimeout(input.saveTimeout);
                input.saveTimeout = setTimeout(saveFormData, 500);
            });
            input.addEventListener('blur', () => { // Validate on blur as well
                validateField(input);
            });
        });
    }

    function startAutoSave() {
        autoSaveInterval = setInterval(() => {
            if (isFormDataPresent() && !registrationInProgress) { // Only save if there's data and not submitting
                saveFormData();
            }
        }, 30000); // Save every 30 seconds
    }


    // --- User Feedback (Toasts & Loading) ---
    function showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'error') iconClass = 'fas fa-times-circle';
        else if (type === 'warning') iconClass = 'fas fa-exclamation-triangle';

        toast.innerHTML = `
            <i class="toast-icon ${iconClass}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);

        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        });

        setTimeout(() => {
            if (toast.parentElement) { // Check if still in DOM
                toast.classList.add('toast-out');
                toast.addEventListener('animationend', () => toast.remove(), { once: true });
            }
        }, duration);
    }
    window.showToast = showToast; // Make it globally accessible for inline HTML calls if needed

    function showLoading(show, message = "Loading...") {
        if (show) {
            loadingOverlay.querySelector('p').textContent = message;
            loadingOverlay.classList.add('visible');
        } else {
            loadingOverlay.classList.remove('visible');
        }
    }

    // --- Interactive Elements ---
    window.togglePassword = (fieldId) => {
        const input = document.getElementById(fieldId);
        const icon = document.getElementById(`${fieldId}ToggleIcon`);
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };
    
    window.logoClicked = () => { // Make it globally accessible
        logoSection.classList.add('clicked');
        setTimeout(() => logoSection.classList.remove('clicked'), 300);

        showToast(logoMessages[logoClickCount % logoMessages.length], 'info', 2000);
        logoClickCount++;

        if (logoClickCount === 5) { // Easter egg
            showToast("You found an Easter egg! Keep up the healthy habits!", 'success', 3000);
        }
    };


    // --- Global Helper for Back Button in HTML ---
    // (goBack function is defined inline in HTML, but it can call saveFormData)

    // --- Initialize ---
    initializeForm();

}); // End DOMContentLoaded
