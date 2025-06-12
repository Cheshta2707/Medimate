// Global variables
let video = null;
let isVideoPlaying = true;
let isMuted = true;
let pendingRedirect = null;
let loginAttempts = 0;
const maxLoginAttempts = 3;

// Initialize the landing page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing page initialized');
    initializeVideo();
    setupEventListeners();
    setupScrollEffects();
    initializeHeroAnimation();
    checkUserSession();
    preloadResources();
    setupNavigationLinks();
    setupRippleEffects();
});

// Check if user is already logged in
function checkUserSession() {
    try {
        const currentUser = localStorage.getItem('medimate_current_user');
        if (currentUser) {
            const userData = JSON.parse(currentUser);
            console.log('User already logged in:', userData.firstName);
            
            // Update login button to show user name
            const loginBtn = document.querySelector('.login-btn span');
            if (loginBtn) {
                loginBtn.textContent = userData.firstName;
            }
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('medimate_current_user');
    }
}

// Initialize hero animation
function initializeHeroAnimation() {
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('is-visible');
        }
    }, 500);
}

// Initialize video functionality
function initializeVideo() {
    video = document.getElementById('background-video');
    
    if (video) {
        video.addEventListener('loadeddata', function() {
            video.classList.add('loaded');
        });
        
        video.addEventListener('error', function() {
            console.log('Video failed to load, using fallback background');
            const heroOverlay = document.querySelector('.hero-overlay');
            if (heroOverlay) {
                heroOverlay.style.background = 
                    'linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9))';
            }
        });
        
        // Pause video on mobile to save bandwidth
        if (window.innerWidth <= 768) {
            video.pause();
            isVideoPlaying = false;
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    try {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Modal close events
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('loginModal');
            if (event.target === modal) {
                closeLoginModal();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLoginModal();
            }
            
            // Enter key in login form
            if (e.key === 'Enter' && document.getElementById('loginModal').style.display === 'block') {
                e.preventDefault();
                const loginForm = document.getElementById('loginForm');
                if (loginForm) {
                    handleLogin(e);
                }
            }
        });
        
        // Scroll events with throttling
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(handleScroll, 10);
        });
        
        // Resize events
        window.addEventListener('resize', handleResize);
        
        // Form input events for real-time validation
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                clearFieldError('loginEmail');
                validateEmailField(this.value);
            });
            
            emailInput.addEventListener('blur', function() {
                validateEmailField(this.value);
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                clearFieldError('loginPassword');
            });
        }
        
        console.log('Event listeners set up successfully');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Handle "Start Your Journey" button click
function handleStartJourney() {
    const currentUser = localStorage.getItem('medimate_current_user');
    
    if (currentUser) {
        // User is already logged in, redirect directly
        redirectToMedicine();
    } else {
        // User not logged in, show login modal
        pendingRedirect = 'medicine';
        openLoginModal();
        showToast('Please log in to access your dashboard', 'info');
    }
}

// Handle "Get Started Free" button click
function handleGetStarted() {
    const currentUser = localStorage.getItem('medimate_current_user');
    
    if (currentUser) {
        // User is already logged in, redirect directly
        redirectToMedicine();
    } else {
        // User not logged in, show login modal
        pendingRedirect = 'medicine';
        openLoginModal();
        showToast('Please log in to get started', 'info');
    }
}

// Open login modal with animation
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (!modal) {
        console.error('Login modal not found');
        return;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Reset login attempts if modal is reopened
    if (loginAttempts >= maxLoginAttempts) {
        loginAttempts = 0;
        enableLoginForm();
    }
    
    // Focus on email input with delay for animation
    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.focus();
        }
    }, 400);
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    pendingRedirect = null;
    
    // Reset form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
        clearFormErrors();
    }
}

// Clear all form errors
function clearFormErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
        error.textContent = '';
    });
}

// Clear specific field error
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message');
        
        if (formGroup) formGroup.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
    }
}

// Show form error
function showFormError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    const formGroup = field.closest('.form-group');
    const errorElement = formGroup?.querySelector('.error-message');
    
    if (formGroup) formGroup.classList.add('error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    // Focus on the field with error
    field.focus();
}

// Validate email field in real-time
function validateEmailField(email) {
    if (email && !isValidEmail(email)) {
        showFormError('loginEmail', 'Please enter a valid email address');
        return false;
    }
    return true;
}

// Enhanced credential validation with better error handling
function validateLoginCredentials(email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('medimate_users') || '[]');
        
        if (!Array.isArray(users) || users.length === 0) {
            console.log('No users found in storage');
            return null;
        }
        
        const user = users.find(user => 
            user.email && 
            user.password && 
            user.email.toLowerCase().trim() === email.toLowerCase().trim() && 
            user.password === password
        );
        
        console.log('User validation result:', user ? 'Found' : 'Not found');
        return user || null;
    } catch (error) {
        console.error('Error validating credentials:', error);
        return null;
    }
}

// Disable login form after max attempts
function disableLoginForm() {
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i><span>Too Many Attempts</span>';
    }
    
    if (emailInput) emailInput.disabled = true;
    if (passwordInput) passwordInput.disabled = true;
    
    showToast('Too many failed attempts. Please refresh the page to try again.', 'error');
}

// Enable login form
function enableLoginForm() {
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Sign In</span>';
    }
    
    if (emailInput) emailInput.disabled = false;
    if (passwordInput) passwordInput.disabled = false;
}

// Enhanced login form submission handler
function handleLogin(e) {
    e.preventDefault();
    
    // Check if form is disabled
    if (loginAttempts >= maxLoginAttempts) {
        showToast('Too many failed attempts. Please refresh the page.', 'error');
        return;
    }
    
    clearFormErrors();
    
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const rememberMe = document.getElementById('rememberMe')?.checked;
    
    // Enhanced validation
    let hasErrors = false;
    
    if (!email) {
        showFormError('loginEmail', 'Email is required');
        hasErrors = true;
    } else if (!isValidEmail(email)) {
        showFormError('loginEmail', 'Please enter a valid email address');
        hasErrors = true;
    }
    
    if (!password) {
        showFormError('loginPassword', 'Password is required');
        hasErrors = true;
    } else if (password.length < 6) {
        showFormError('loginPassword', 'Password must be at least 6 characters');
        hasErrors = true;
    }
    
    if (hasErrors) {
        return;
    }
    
    // Show loading
    showLoading();
    
    // Simulate login process with enhanced validation
    setTimeout(() => {
        const user = validateLoginCredentials(email, password);
        
        if (user) {
            // Successful login
            loginAttempts = 0; // Reset attempts on success
            
            const sessionData = {
                ...user,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe,
                sessionId: generateSessionId()
            };
            
            // Store user session
            localStorage.setItem('medimate_current_user', JSON.stringify(sessionData));
            
            hideLoading();
            closeLoginModal();
            showToast('Login successful! Welcome back!', 'success');
            
            // Update UI to show logged in state
            updateUIForLoggedInUser(user);
            
            setTimeout(() => {
                if (pendingRedirect === 'medicine') {
                    redirectToMedicine();
                } else {
                    // Default redirect
                    redirectToMedicine();
                }
            }, 1500);
        } else {
            // Failed login
            loginAttempts++;
            hideLoading();
            
            if (loginAttempts >= maxLoginAttempts) {
                disableLoginForm();
            } else {
                const remainingAttempts = maxLoginAttempts - loginAttempts;
                showFormError('loginPassword', `Invalid email or password. ${remainingAttempts} attempts remaining.`);
                showToast(`Invalid credentials. ${remainingAttempts} attempts remaining.`, 'error');
            }
        }
    }, 2000);
}

// Generate session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && user.firstName) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i><span>${user.firstName}</span>`;
        loginBtn.onclick = () => redirectToMedicine();
    }
}

// Enhanced redirect to medicine page with verification
function redirectToMedicine() {
    const currentUser = localStorage.getItem('medimate_current_user');
    
    if (!currentUser) {
        showToast('Please log in first', 'error');
        openLoginModal();
        return;
    }
    
    try {
        const userData = JSON.parse(currentUser);
        if (!userData.userId || !userData.email) {
            throw new Error('Invalid user data');
        }
        
        showToast('Redirecting to dashboard...', 'success');
        
        // Add fade-out animation
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            // Use replace to prevent back button issues
            window.location.replace('medicine.html');
        }, 500);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('medimate_current_user');
        showToast('Session error. Please log in again.', 'error');
        openLoginModal();
    }
}

// Enhanced email validation
function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email.trim());
}

// Toggle password visibility
function toggleLoginPassword() {
    const passwordInput = document.getElementById('loginPassword');
    const toggleIcon = document.getElementById('loginPasswordToggleIcon');
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

// Enhanced scroll effects with Intersection Observer
function setupScrollEffects() {
    if (!('IntersectionObserver' in window)) {
        // Fallback for older browsers
        document.querySelectorAll('.fade-in-element').forEach(el => {
            el.classList.add('is-visible');
        });
        return;
    }
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const fadeInElements = document.querySelectorAll('.fade-in-element');
    fadeInElements.forEach((element, index) => {
        setTimeout(() => {
            observer.observe(element);
        }, index * 50);
    });
}

// Scroll to features section
function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        const offsetTop = featuresSection.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// Enhanced handle scroll with performance optimization
let ticking = false;

function handleScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrolled = window.pageYOffset;
            const nav = document.querySelector('.main-nav');
            
            if (nav) {
                if (scrolled > 100) {
                    nav.style.background = 'rgba(255, 255, 255, 0.98)';
                    nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
                    nav.style.backdropFilter = 'blur(20px)';
                } else {
                    nav.style.background = 'rgba(255, 255, 255, 0.95)';
                    nav.style.boxShadow = 'none';
                    nav.style.backdropFilter = 'blur(10px)';
                }
            }
            
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                const opacity = Math.max(0, 1 - scrolled / 400);
                scrollIndicator.style.opacity = opacity;
            }
            
            ticking = false;
        });
        ticking = true;
    }
}

// Handle resize events
function handleResize() {
    if (window.innerWidth <= 768 && video && isVideoPlaying) {
        video.pause();
        isVideoPlaying = false;
    }
}

// Mobile menu toggle with animation
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const toggleIcon = document.querySelector('.mobile-menu-toggle');
    
    if (!navLinks || !toggleIcon) return;
    
    const isOpen = navLinks.style.display === 'flex';
    
    if (isOpen) {
        navLinks.style.display = 'none';
        toggleIcon.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'white';
        navLinks.style.padding = '1rem';
        navLinks.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        navLinks.style.borderRadius = '0 0 10px 10px';
        navLinks.style.zIndex = '1001';
        toggleIcon.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Enhanced toast notification with better positioning
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    }, 100);
    
    // Auto remove
    const duration = type === 'success' ? 5000 : 4000;
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, duration);
}

// Smooth scroll to any section by ID
function smoothScrollTo(sectionId, offset = 80) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - offset;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
        return true;
    }
    return false;
}

// Enhanced navigation link handling
function setupNavigationLinks() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            if (smoothScrollTo(targetId)) {
                // Close mobile menu if open
                const navLinksContainer = document.querySelector('.nav-links');
                const toggleIcon = document.querySelector('.mobile-menu-toggle');
                
                if (navLinksContainer && toggleIcon && 
                    navLinksContainer.style.display === 'flex' && 
                    window.innerWidth <= 768) {
                    navLinksContainer.style.display = 'none';
                    toggleIcon.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            }
        });
    });
}

// Setup ripple effects for buttons
function setupRippleEffects() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Preload critical resources
function preloadResources() {
    const resources = [
        { href: 'medicine.html', as: 'document' },
        { href: 'new_user.html', as: 'document' }
    ];
    
    resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource.href;
        if (resource.as) link.as = resource.as;
        document.head.appendChild(link);
    });
}

// Logout function (if user is logged in)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('medimate_current_user');
        showToast('Logged out successfully!', 'success');
        
        // Reset login button
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Login</span>';
            loginBtn.onclick = openLoginModal;
        }
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Uncaught error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Handle online/offline status
window.addEventListener('online', function() {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', function() {
    showToast('You are offline. Some features may not work.', 'warning');
});

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}

// Service worker registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export functions for global access
window.handleStartJourney = handleStartJourney;
window.handleGetStarted = handleGetStarted;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;
window.toggleLoginPassword = toggleLoginPassword;
window.toggleMobileMenu = toggleMobileMenu;
window.scrollToFeatures = scrollToFeatures;
window.logout = logout;

console.log('Landing page JavaScript loaded successfully');
