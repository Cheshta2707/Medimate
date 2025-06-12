// Modern JavaScript for MediMate Healthcare Application

// Application State Management
class MediMateApp {
    constructor() {
        this.medicines = [];
        this.notificationsEnabled = false;
        this.currentTab = 'dashboard';
        this.searchTimeout = null;
        this.init();
    }

    // Initialize the application
    init() {
        this.loadStoredData();
        this.setupEventListeners();
        this.updateTimeOfDay();
        this.updateDashboard();
        this.startTimeUpdates();
        this.checkNotificationPermission();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Form submission
        const medicineForm = document.getElementById('medicineForm');
        if (medicineForm) {
            medicineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addMedicine();
            });
        }

        // Frequency change handler
        const frequencySelect = document.getElementById('frequency');
        if (frequencySelect) {
            frequencySelect.addEventListener('change', () => {
                this.updateTimeSlots();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('medicineSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchMedicine();
                }
            });
        }

        // Toggle notifications
        const toggleBtn = document.getElementById('toggleNotifications');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleNotifications();
            });
        }

        // Quick add FAB
        const quickAddBtn = document.getElementById('quickAddBtn');
        if (quickAddBtn) {
            quickAddBtn.addEventListener('click', () => {
                this.switchTab('schedule');
                setTimeout(() => {
                    document.getElementById('medicineName')?.focus();
                }, 300);
            });
        }

        // Collapse form
        const collapseBtn = document.getElementById('collapseAddForm');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleFormCollapse();
            });
        }

        // Filter changes
        const ageGroupSelect = document.getElementById('ageGroup');
        const conditionSelect = document.getElementById('condition');
        const lifestyleSelect = document.getElementById('lifestyle');
        
        [ageGroupSelect, conditionSelect, lifestyleSelect].forEach(select => {
            if (select) {
                select.addEventListener('change', () => {
                    this.updateSuggestions();
                });
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    // Keyboard shortcuts handler
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for quick search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.switchTab('library');
            setTimeout(() => {
                document.getElementById('medicineSearch')?.focus();
            }, 300);
        }

        // Ctrl/Cmd + N for new medicine
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.switchTab('schedule');
            setTimeout(() => {
                document.getElementById('medicineName')?.focus();
            }, 300);
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Tab switching with smooth transitions
    switchTab(tabName) {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.content-section');
        
        // Remove active classes
        navItems.forEach(item => item.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active classes
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(tabName)?.classList.add('active');
        
        this.currentTab = tabName;
        
        // Update page title
        document.title = `MediMate - ${this.capitalizeFirst(tabName)}`;
        
        // Trigger tab-specific actions
        this.onTabChange(tabName);
    }

    // Actions to perform when tab changes
    onTabChange(tabName) {
        switch (tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'schedule':
                this.updateMedicinesList();
                break;
            case 'library':
                this.resetLibraryView();
                break;
            case 'insights':
                this.updateSuggestions();
                break;
        }
    }

    // Time of day greeting
    updateTimeOfDay() {
        const now = new Date();
        const hour = now.getHours();
        const timeOfDayElement = document.getElementById('timeOfDay');
        
        if (!timeOfDayElement) return;
        
        let greeting = 'Morning';
        let icon = 'fas fa-sun';
        
        if (hour >= 12 && hour < 17) {
            greeting = 'Afternoon';
            icon = 'fas fa-sun';
        } else if (hour >= 17 || hour < 6) {
            greeting = 'Evening';
            icon = 'fas fa-moon';
        }
        
        timeOfDayElement.textContent = greeting;
        
        // Update icon if available
        const greetingIcon = document.querySelector('.greeting-icon');
        if (greetingIcon) {
            greetingIcon.className = `${icon} greeting-icon`;
        }
    }

    // Start real-time updates
    startTimeUpdates() {
        // Update time of day every minute
        setInterval(() => {
            this.updateTimeOfDay();
        }, 60000);

        // Update dashboard stats every 5 minutes
        setInterval(() => {
            this.updateDashboard();
        }, 300000);
    }

    // Dashboard statistics update
    updateDashboard() {
        this.updateDashboardStats();
        this.updateNextDose();
        this.updateRecentActivity();
    }

    updateDashboardStats() {
        const activeMedicines = this.medicines.filter(m => m.active).length;
        const todayDoses = this.getTodayDoses();
        const completedDoses = this.getCompletedDoses();
        const upcomingDoses = this.getUpcomingDoses();

        this.updateStatElement('totalMedicines', activeMedicines);
        this.updateStatElement('todayDoses', todayDoses);
        this.updateStatElement('completedDoses', completedDoses);
        this.updateStatElement('upcomingDoses', upcomingDoses);

        // Update progress ring
        this.updateProgressRing(completedDoses, todayDoses);
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate number change
            this.animateNumber(element, parseInt(element.textContent) || 0, value);
        }
    }

    animateNumber(element, start, end) {
        const duration = 500;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.round(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    updateProgressRing(completed, total) {
        const progressCircle = document.querySelector('.progress-svg circle:last-child');
        if (progressCircle && total > 0) {
            const percentage = (completed / total) * 100;
            const circumference = 2 * Math.PI * 15; // radius = 15
            const offset = circumference - (percentage / 100) * circumference;
            
            progressCircle.style.strokeDasharray = circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
    }

    getTodayDoses() {
        return this.medicines.reduce((total, medicine) => {
            if (medicine.active) {
                return total + medicine.times.length;
            }
            return total;
        }, 0);
    }

    getCompletedDoses() {
        // This would be calculated based on actual dose taking records
        const todayDoses = this.getTodayDoses();
        return Math.floor(todayDoses * 0.85); // Simulated 85% completion rate
    }

    getUpcomingDoses() {
        const now = new Date();
        const today = now.toDateString();
        let upcoming = 0;

        this.medicines.forEach(medicine => {
            if (medicine.active) {
                medicine.times.forEach(time => {
                    const [hours, minutes] = time.split(':');
                    const doseTime = new Date();
                    doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    if (doseTime > now && doseTime.toDateString() === today) {
                        upcoming++;
                    }
                });
            }
        });

        return upcoming;
    }

    updateNextDose() {
        const nextDoseCard = document.getElementById('nextDoseCard');
        if (!nextDoseCard) return;

        const nextDose = this.getNextScheduledDose();
        
        if (!nextDose) {
            nextDoseCard.innerHTML = `
                <div class="no-doses">
                    <div class="empty-illustration">
                        <i class="fas fa-leaf"></i>
                    </div>
                    <h4>All caught up!</h4>
                    <p>No upcoming doses scheduled. Great job staying on track!</p>
                </div>
            `;
            return;
        }

        const timeUntil = this.getTimeUntilDose(nextDose.time);
        
        nextDoseCard.innerHTML = `
            <div class="next-dose-info">
                <div class="dose-header">
                    <h4>${nextDose.medicine.name}</h4>
                    <span class="dose-time">${nextDose.time}</span>
                </div>
                <div class="dose-details">
                    <p class="dosage">${nextDose.medicine.dosage}</p>
                    <p class="instructions">${this.getInstructionText(nextDose.medicine.instructions)}</p>
                    <p class="time-until">
                        <i class="fas fa-clock"></i>
                        ${timeUntil}
                    </p>
                </div>
                <div class="dose-actions">
                    <button class="btn-primary" onclick="app.markDoseTaken('${nextDose.id}')">
                        <i class="fas fa-check"></i>
                        Mark as Taken
                    </button>
                    <button class="btn-secondary" onclick="app.postponeDose('${nextDose.id}')">
                        <i class="fas fa-clock"></i>
                        Postpone
                    </button>
                </div>
            </div>
        `;
    }

    getNextScheduledDose() {
        const now = new Date();
        let nextDose = null;
        let nextTime = null;

        this.medicines.forEach(medicine => {
            if (medicine.active) {
                medicine.times.forEach(time => {
                    const [hours, minutes] = time.split(':');
                    const doseTime = new Date();
                    doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    // If the time has passed today, schedule for tomorrow
                    if (doseTime <= now) {
                        doseTime.setDate(doseTime.getDate() + 1);
                    }
                    
                    if (!nextTime || doseTime < nextTime) {
                        nextTime = doseTime;
                        nextDose = {
                            id: `${medicine.id}-${time}`,
                            medicine: medicine,
                            time: time,
                            scheduledFor: doseTime
                        };
                    }
                });
            }
        });

        return nextDose;
    }

    getTimeUntilDose(time) {
        const now = new Date();
        const [hours, minutes] = time.split(':');
        const doseTime = new Date();
        doseTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (doseTime <= now) {
            doseTime.setDate(doseTime.getDate() + 1);
        }
        
        const diff = doseTime - now;
        const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
        const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursUntil === 0) {
            return `in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
        } else {
            return `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
        }
    }

    updateRecentActivity() {
        // This would normally fetch from a database
        const activities = [
            {
                time: '2 hours ago',
                text: 'Took Vitamin D3',
                type: 'completed'
            },
            {
                time: '8 hours ago',
                text: 'Took Morning Supplements',
                type: 'completed'
            }
        ];

        const timeline = document.querySelector('.activity-timeline');
        if (timeline) {
            timeline.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-dot ${activity.type}"></div>
                    <div class="activity-content">
                        <span class="activity-time">${activity.time}</span>
                        <p class="activity-text">${activity.text}</p>
                    </div>
                </div>
            `).join('');
        }
    }

    // Medicine management
    updateTimeSlots() {
        const frequency = document.getElementById('frequency')?.value;
        const timeSlotsContainer = document.getElementById('timeSlots');
        
        if (!timeSlotsContainer) return;
        
        if (frequency === 'custom') {
            timeSlotsContainer.innerHTML = `
                <div class="time-slot">
                    <label>
                        <i class="fas fa-clock"></i>
                        Custom Times
                    </label>
                    <input type="text" id="customTimes" placeholder="e.g., 08:00, 14:00, 20:00" 
                           class="custom-times-input">
                    <div class="input-helper">Enter times separated by commas</div>
                </div>
            `;
        } else {
            const numSlots = parseInt(frequency) || 1;
            const defaultTimes = ['08:00', '14:00', '20:00', '02:00'];
            let slotsHTML = '';
            
            for (let i = 1; i <= numSlots; i++) {
                const defaultTime = defaultTimes[i - 1] || '08:00';
                slotsHTML += `
                    <div class="time-slot">
                        <label>
                            <i class="fas fa-clock"></i>
                            Time ${i}
                        </label>
                        <input type="time" id="time${i}" value="${defaultTime}" required>
                    </div>
                `;
            }
            
            timeSlotsContainer.innerHTML = slotsHTML;
        }
    }

    addMedicine() {
        const form = document.getElementById('medicineForm');
        if (!form) return;

        const formData = new FormData(form);
        const frequency = document.getElementById('frequency')?.value;
        
        // Collect time slots
        const times = this.collectTimeSlots(frequency);
        
        if (times.length === 0) {
            this.showToast('Please specify at least one time for medication', 'error');
            return;
        }
        
        const medicine = {
            id: Date.now(),
            name: document.getElementById('medicineName')?.value,
            type: document.getElementById('medicineType')?.value,
            dosage: document.getElementById('dosage')?.value,
            frequency: frequency,
            times: times,
            duration: parseInt(document.getElementById('duration')?.value) || 7,
            instructions: document.getElementById('instructions')?.value,
            startDate: new Date(),
            active: true,
            createdAt: new Date(),
            adherenceRate: 0
        };
        
        // Validate required fields
        if (!medicine.name || !medicine.dosage) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        this.medicines.push(medicine);
        this.saveData();
        this.updateDashboard();
        this.updateMedicinesList();
        
        this.showToast(`${medicine.name} added successfully!`, 'success');
        
        // Reset form
        form.reset();
        this.updateTimeSlots();
        
        // Scroll to medicines list
        document.getElementById('medicinesList')?.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    collectTimeSlots(frequency) {
        const times = [];
        
        if (frequency === 'custom') {
            const customTimes = document.getElementById('customTimes')?.value;
            if (customTimes) {
                times.push(...customTimes.split(',').map(t => t.trim()).filter(t => t));
            }
        } else {
            const numSlots = parseInt(frequency) || 1;
            for (let i = 1; i <= numSlots; i++) {
                const timeInput = document.getElementById(`time${i}`);
                if (timeInput?.value) {
                    times.push(timeInput.value);
                }
            }
        }
        
        return times;
    }

    updateMedicinesList() {
        const medicinesList = document.getElementById('medicinesList');
        if (!medicinesList) return;
        
        if (this.medicines.length === 0) {
            medicinesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-illustration">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h4>No medicines scheduled</h4>
                    <p>Add your first medicine using the form above to get started with your health journey.</p>
                    <button class="add-medicine-quick" onclick="document.getElementById('medicineName').focus()">
                        <i class="fas fa-plus"></i>
                        Add First Medicine
                    </button>
                </div>
            `;
            return;
        }
        
        const medicinesHTML = this.medicines.map(medicine => `
            <div class="medicine-card" data-id="${medicine.id}">
                <div class="medicine-header">
                    <div class="medicine-title">
                        <h4>${medicine.name}</h4>
                        <span class="medicine-type">${this.capitalizeFirst(medicine.type)}</span>
                    </div>
                    <div class="medicine-status ${medicine.active ? 'active' : 'inactive'}">
                        <i class="fas ${medicine.active ? 'fa-play' : 'fa-pause'}"></i>
                    </div>
                </div>
                <div class="medicine-details">
                    <div class="detail-row">
                        <i class="fas fa-weight"></i>
                        <span>Dosage: ${medicine.dosage}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-clock"></i>
                        <span>Times: ${medicine.times.join(', ')}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-info-circle"></i>
                        <span>${this.getInstructionText(medicine.instructions)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>Duration: ${medicine.duration} days</span>
                    </div>
                </div>
                <div class="medicine-actions">
                    <button class="action-btn edit" onclick="app.editMedicine(${medicine.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn ${medicine.active ? 'pause' : 'play'}" 
                            onclick="app.toggleMedicine(${medicine.id})" 
                            title="${medicine.active ? 'Pause' : 'Resume'}">
                        <i class="fas ${medicine.active ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.deleteMedicine(${medicine.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        medicinesList.innerHTML = medicinesHTML;
    }

    getInstructionText(instruction) {
        const instructions = {
            'before-meal': 'Take before meal',
            'after-meal': 'Take after meal',
            'with-meal': 'Take with meal',
            'empty-stomach': 'Take on empty stomach',
            'anytime': 'Take anytime'
        };
        
        return instructions[instruction] || instruction;
    }

    toggleMedicine(id) {
        const medicine = this.medicines.find(m => m.id === id);
        if (medicine) {
            medicine.active = !medicine.active;
            this.saveData();
            this.updateMedicinesList();
            this.updateDashboard();
            
            const status = medicine.active ? 'resumed' : 'paused';
            this.showToast(`${medicine.name} ${status}`, 'info');
        }
    }

    editMedicine(id) {
        const medicine = this.medicines.find(m => m.id === id);
        if (!medicine) return;
        
        // Switch to schedule tab
        this.switchTab('schedule');
        
        // Populate form with medicine data
        setTimeout(() => {
            document.getElementById('medicineName').value = medicine.name;
            document.getElementById('medicineType').value = medicine.type;
            document.getElementById('dosage').value = medicine.dosage;
            document.getElementById('frequency').value = medicine.frequency;
            document.getElementById('duration').value = medicine.duration;
            document.getElementById('instructions').value = medicine.instructions;
            
            this.updateTimeSlots();
            
            // Set times after time slots are created
            setTimeout(() => {
                medicine.times.forEach((time, index) => {
                    const timeInput = document.getElementById(`time${index + 1}`);
                    if (timeInput) {
                        timeInput.value = time;
                    }
                });
            }, 100);
            
            // Remove the medicine from the list (it will be re-added on form submit)
            this.medicines = this.medicines.filter(m => m.id !== id);
            
            this.showToast('Medicine loaded for editing', 'info');
        }, 300);
    }

    deleteMedicine(id) {
        const medicine = this.medicines.find(m => m.id === id);
        if (!medicine) return;
        
        this.showConfirmModal(
            'Delete Medicine',
            `Are you sure you want to delete "${medicine.name}"? This action cannot be undone.`,
            () => {
                this.medicines = this.medicines.filter(m => m.id !== id);
                this.saveData();
                this.updateMedicinesList();
                this.updateDashboard();
                this.showToast(`${medicine.name} deleted successfully`, 'success');
            }
        );
    }

    markDoseTaken(doseId) {
        // This would normally record the dose as taken
        this.showToast('Dose marked as taken! 🎉', 'success');
        this.updateDashboard();
    }

    postponeDose(doseId) {
        // This would allow postponing a dose
        this.showToast('Dose postponed by 30 minutes', 'info');
    }

    // Search functionality
    handleSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.searchTimeout = setTimeout(() => {
            this.showSearchSuggestions(query);
        }, 300);
    }

    showSearchSuggestions(query) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (!suggestionsContainer || !query || query.length < 2) {
            if (suggestionsContainer) {
                suggestionsContainer.style.display = 'none';
            }
            return;
        }
        
        const suggestions = this.getMedicineSuggestions(query);
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = suggestions.map(suggestion => `
            <div class="search-suggestion" onclick="app.quickSearch('${suggestion}')">
                <i class="fas fa-search"></i>
                <span>${suggestion}</span>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
    }

    getMedicineSuggestions(query) {
        const commonMedicines = [
            'Paracetamol', 'Ibuprofen', 'Aspirin', 'Omeprazole', 'Cetirizine',
            'Amoxicillin', 'Metformin', 'Atorvastatin', 'Lisinopril', 'Levothyroxine'
        ];
        
        return commonMedicines.filter(medicine => 
            medicine.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    searchMedicine() {
        const searchTerm = document.getElementById('medicineSearch')?.value.trim();
        const searchResults = document.getElementById('searchResults');
        
        if (!searchTerm) {
            this.showToast('Please enter a medicine name to search', 'error');
            return;
        }
        
        if (!searchResults) return;
        
        // Hide suggestions
        const suggestionsContainer = document.getElementById('searchSuggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
        
        this.showLoading();
        
        // Simulate API call
        setTimeout(() => {
            this.hideLoading();
            
            const mockResults = this.getMockMedicineInfo(searchTerm);
            
            searchResults.innerHTML = `
                <div class="medicine-info-card">
                    <div class="medicine-info-header">
                        <div class="medicine-title">
                            <h3><i class="fas fa-pills"></i> ${mockResults.name}</h3>
                            <span class="medicine-category">${mockResults.category}</span>
                        </div>
                        <div class="medicine-rating">
                            <div class="rating-stars">
                                ${'★'.repeat(mockResults.rating)}${'☆'.repeat(5 - mockResults.rating)}
                            </div>
                            <span class="rating-text">${mockResults.rating}/5</span>
                        </div>
                    </div>
                    
                    <div class="medicine-info-content">
                        <div class="info-tabs">
                            <button class="info-tab active" data-tab="overview">Overview</button>
                            <button class="info-tab" data-tab="dosage">Dosage</button>
                            <button class="info-tab" data-tab="interactions">Interactions</button>
                            <button class="info-tab" data-tab="precautions">Precautions</button>
                        </div>
                        
                        <div class="info-content">
                            <div class="info-section active" id="overview">
                                <h4><i class="fas fa-info-circle"></i> Uses & Benefits</h4>
                                <p>${mockResults.uses}</p>
                                
                                <h4><i class="fas fa-exclamation-triangle"></i> Common Side Effects</h4>
                                <div class="side-effects-list">
                                    ${mockResults.sideEffects.map(effect => `
                                        <span class="side-effect-tag">${effect}</span>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="info-section" id="dosage">
                                <h4><i class="fas fa-weight"></i> Recommended Dosage</h4>
                                <div class="dosage-info">
                                    <div class="dosage-group">
                                        <h5>Adults</h5>
                                        <p>${mockResults.dosage.adults}</p>
                                    </div>
                                    <div class="dosage-group">
                                        <h5>Children</h5>
                                        <p>${mockResults.dosage.children}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="info-section" id="interactions">
                                <h4><i class="fas fa-exchange-alt"></i> Drug Interactions</h4>
                                <div class="interactions-list">
                                    ${mockResults.interactions.map(interaction => `
                                        <div class="interaction-item">
                                            <span class="interaction-drug">${interaction.drug}</span>
                                            <span class="interaction-level ${interaction.level}">${interaction.level}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="info-section" id="precautions">
                                <h4><i class="fas fa-shield-alt"></i> Precautions</h4>
                                <ul class="precautions-list">
                                    ${mockResults.precautions.map(precaution => `
                                        <li><i class="fas fa-check"></i> ${precaution}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="medicine-actions">
                        <button class="btn-primary" onclick="app.addToScheduleFromSearch('${mockResults.name}')">
                            <i class="fas fa-plus"></i>
                            Add to Schedule
                        </button>
                        <button class="btn-secondary" onclick="app.saveToFavorites('${mockResults.name}')">
                            <i class="fas fa-heart"></i>
                            Save to Favorites
                        </button>
                    </div>
                </div>
            `;
            
            // Setup info tabs
            this.setupInfoTabs();
            
        }, 1500);
    }

    setupInfoTabs() {
        const infoTabs = document.querySelectorAll('.info-tab');
        const infoSections = document.querySelectorAll('.info-section');
        
        infoTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                infoTabs.forEach(t => t.classList.remove('active'));
                infoSections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(targetTab)?.classList.add('active');
            });
        });
    }

    getMockMedicineInfo(searchTerm) {
        // This would normally fetch from a real medical database
        return {
            name: this.capitalizeFirst(searchTerm),
            category: 'Pain Relief / Anti-inflammatory',
            rating: 4,
            uses: 'Effective for reducing pain, inflammation, and fever. Commonly used for headaches, muscle pain, arthritis, and other inflammatory conditions.',
            dosage: {
                adults: '200-400mg every 4-6 hours as needed. Maximum 1200mg per day.',
                children: '10mg/kg every 6-8 hours. Consult pediatrician for exact dosing.'
            },
            sideEffects: ['Nausea', 'Stomach upset', 'Dizziness', 'Headache', 'Drowsiness'],
            interactions: [
                { drug: 'Warfarin', level: 'high' },
                { drug: 'Aspirin', level: 'moderate' },
                { drug: 'ACE Inhibitors', level: 'moderate' },
                { drug: 'Lithium', level: 'low' }
            ],
            precautions: [
                'Take with food to reduce stomach irritation',
                'Avoid alcohol while taking this medication',
                'Consult doctor if pregnant or breastfeeding',
                'Do not exceed recommended dosage',
                'Stop use if allergic reactions occur'
            ]
        };
    }

    quickSearch(medicineName) {
        document.getElementById('medicineSearch').value = medicineName;
        this.searchMedicine();
    }

    addToScheduleFromSearch(medicineName) {
        this.switchTab('schedule');
        setTimeout(() => {
            document.getElementById('medicineName').value = medicineName;
            document.getElementById('medicineName').focus();
        }, 300);
        this.showToast('Medicine added to form. Please complete the details.', 'success');
    }

    saveToFavorites(medicineName) {
        // This would save to user favorites
        this.showToast(`${medicineName} saved to favorites!`, 'success');
    }

    resetLibraryView() {
        const searchResults = document.getElementById('searchResults');
        const searchInput = document.getElementById('medicineSearch');
        
        if (searchInput) {
            searchInput.value = '';
        }
        
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="library-welcome">
                    <div class="welcome-content">
                        <div class="welcome-illustration">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>Comprehensive Medicine Database</h3>
                        <p>Search our extensive database for detailed information about medicines, including uses, dosages, side effects, interactions, and precautions.</p>
                        
                        <div class="popular-searches">
                            <h4>Popular Searches:</h4>
                            <div class="search-tags">
                                <button class="search-tag" onclick="app.quickSearch('paracetamol')">
                                    <i class="fas fa-pills"></i>
                                    Paracetamol
                                </button>
                                <button class="search-tag" onclick="app.quickSearch('ibuprofen')">
                                    <i class="fas fa-pills"></i>
                                    Ibuprofen
                                </button>
                                <button class="search-tag" onclick="app.quickSearch('aspirin')">
                                    <i class="fas fa-pills"></i>
                                    Aspirin
                                </button>
                                <button class="search-tag" onclick="app.quickSearch('omeprazole')">
                                    <i class="fas fa-pills"></i>
                                    Omeprazole
                                </button>
                                <button class="search-tag" onclick="app.quickSearch('cetirizine')">
                                    <i class="fas fa-pills"></i>
                                    Cetirizine
                                </button>
                            </div>
                        </div>

                        <div class="library-features">
                            <div class="feature-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>Drug Interaction Checker</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Side Effects Database</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-user-md"></i>
                                <span>Professional Information</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Insights and suggestions
    updateSuggestions() {
        const ageGroup = document.getElementById('ageGroup')?.value;
        const condition = document.getElementById('condition')?.value;
        const lifestyle = document.getElementById('lifestyle')?.value;
        const suggestionsList = document.getElementById('suggestionsList');
        
        if (!suggestionsList) return;
        
        if (ageGroup === 'all' || condition === 'all') {
            suggestionsList.innerHTML = `
                <div class="suggestions-placeholder">
                    <div class="placeholder-content">
                        <div class="placeholder-illustration">
                            <i class="fas fa-hand-holding-medical"></i>
                        </div>
                        <h4>Customize Your Experience</h4>
                        <p>Select your age group, health condition, and lifestyle above to receive personalized medicine recommendations and health insights tailored just for you.</p>
                        <div class="placeholder-features">
                            <div class="feature-tag">
                                <i class="fas fa-user-md"></i>
                                Professional Recommendations
                            </div>
                            <div class="feature-tag">
                                <i class="fas fa-shield-alt"></i>
                                Safety Guidelines
                            </div>
                            <div class="feature-tag">
                                <i class="fas fa-chart-bar"></i>
                                Dosage Information
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        const suggestions = this.generateSuggestions(ageGroup, condition, lifestyle);
        
        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="suggestion-card">
                <div class="suggestion-header">
                    <div class="suggestion-title">
                        <h4>${suggestion.name}</h4>
                        <span class="suggestion-type">${suggestion.type}</span>
                    </div>
                    <div class="suggestion-rating">
                        <div class="rating-stars">
                            ${'★'.repeat(suggestion.rating)}${'☆'.repeat(5 - suggestion.rating)}
                        </div>
                    </div>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-reason">
                        <h5><i class="fas fa-lightbulb"></i> Why recommended</h5>
                        <p>${suggestion.reason}</p>
                    </div>
                    <div class="suggestion-dosage">
                        <h5><i class="fas fa-weight"></i> Typical dosage</h5>
                        <p>${suggestion.dosage}</p>
                    </div>
                    <div class="suggestion-notes">
                        <h5><i class="fas fa-info-circle"></i> Important notes</h5>
                        <p>${suggestion.notes}</p>
                    </div>
                </div>
                <div class="suggestion-actions">
                    <button class="btn-primary" onclick="app.addToScheduleFromSearch('${suggestion.name}')">
                        <i class="fas fa-plus"></i>
                        Add to Schedule
                    </button>
                    <button class="btn-secondary" onclick="app.learnMore('${suggestion.name}')">
                        <i class="fas fa-info"></i>
                        Learn More
                    </button>
                </div>
            </div>
        `).join('');
        
        suggestionsList.innerHTML = suggestionsHTML;
    }

    generateSuggestions(ageGroup, condition, lifestyle) {
        // This would normally use a sophisticated recommendation algorithm
        const suggestionDatabase = {
            'adults-pain': [
                {
                    name: 'Ibuprofen',
                    type: 'NSAID',
                    rating: 4,
                    reason: 'Effective anti-inflammatory properties make it ideal for moderate pain and inflammation relief',
                    dosage: '200-400mg every 4-6 hours as needed',
                    notes: 'Take with food to prevent stomach upset. Avoid if you have kidney problems.'
                },
                {
                    name: 'Paracetamol',
                    type: 'Analgesic',
                    rating: 5,
                    reason: 'Safe and effective first-line treatment for mild to moderate pain with minimal side effects',
                    dosage: '500-1000mg every 4-6 hours',
                    notes: 'Maximum 4g per day. Safe for most people including pregnant women.'
                }
            ],
            'elderly-pain': [
                {
                    name: 'Paracetamol',
                    type: 'Analgesic',
                    rating: 5,
                    reason: 'Safest pain relief option for elderly patients with minimal drug interactions',
                    dosage: '500mg every 6 hours',
                    notes: 'Preferred over NSAIDs in elderly due to reduced side effect profile.'
                }
            ],
            'children-fever': [
                {
                    name: 'Paracetamol (Pediatric)',
                    type: 'Antipyretic',
                    rating: 5,
                    reason: 'Safe and effective fever reducer specifically formulated for children',
                    dosage: '10-15mg/kg every 4-6 hours',
                    notes: 'Use only pediatric formulations. Calculate dose based on weight, not age.'
                }
            ]
        };
        
        const key = `${ageGroup}-${condition}`;
        return suggestionDatabase[key] || [
            {
                name: 'Professional Consultation Recommended',
                type: 'Medical Advice',
                rating: 5,
                reason: 'For your specific age group and condition combination, personalized medical advice is recommended',
                dosage: 'As prescribed by healthcare provider',
                notes: 'Always consult with a qualified healthcare professional for personalized treatment recommendations.'
            }
        ];
    }

    learnMore(medicineName) {
        this.switchTab('library');
        setTimeout(() => {
            document.getElementById('medicineSearch').value = medicineName;
            this.searchMedicine();
        }, 300);
    }

    // Notifications
    toggleNotifications() {
        this.notificationsEnabled = !this.notificationsEnabled;
        
        if (this.notificationsEnabled) {
            this.requestNotificationPermission();
        }
        
        this.updateNotificationUI();
        this.saveData();
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showToast('Notifications enabled successfully!', 'success');
                this.scheduleNotifications();
            } else {
                this.notificationsEnabled = false;
                this.showToast('Notification permission denied', 'error');
            }
        } else {
            this.showToast('Notifications not supported in this browser', 'error');
        }
    }

    checkNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'granted') {
            this.notificationsEnabled = true;
        }
        this.updateNotificationUI();
    }

    updateNotificationUI() {
        const toggleBtn = document.getElementById('toggleNotifications');
        const statusCard = document.getElementById('notificationStatus');
        
        if (toggleBtn) {
            toggleBtn.innerHTML = this.notificationsEnabled 
                ? '<i class="fas fa-toggle-on"></i>' 
                : '<i class="fas fa-toggle-off"></i>';
        }
        
        if (statusCard) {
            if (this.notificationsEnabled) {
                statusCard.innerHTML = `
                    <div class="status-active">
                        <i class="fas fa-bell"></i>
                        <p>Notifications are enabled</p>
                        <small>You'll receive reminders for your medications</small>
                    </div>
                `;
            } else {
                statusCard.innerHTML = `
                    <div class="status-inactive">
                        <i class="fas fa-bell-slash"></i>
                        <p>Notifications are disabled</p>
                        <button class="enable-btn" onclick="app.toggleNotifications()">
                            Enable Notifications
                        </button>
                    </div>
                `;
            }
        }
    }

    scheduleNotifications() {
        // This would schedule actual notifications
        if (!this.notificationsEnabled) return;
        
        this.medicines.forEach(medicine => {
            if (medicine.active) {
                medicine.times.forEach(time => {
                    // Schedule notification for each medicine time
                    this.scheduleNotificationForTime(medicine, time);
                });
            }
        });
    }

    scheduleNotificationForTime(medicine, time) {
        const [hours, minutes] = time.split(':');
        const now = new Date();
        const notificationTime = new Date();
        notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (notificationTime <= now) {
            notificationTime.setDate(notificationTime.getDate() + 1);
        }
        
        const timeUntilNotification = notificationTime - now;
        
        setTimeout(() => {
            this.showMedicineNotification(medicine);
        }, timeUntilNotification);
    }

    showMedicineNotification(medicine) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Time to take ${medicine.name}`, {
                body: `${medicine.dosage} - ${this.getInstructionText(medicine.instructions)}`,
                icon: '/icon-192x192.png', // You would need to add this icon
                tag: `medicine-${medicine.id}`,
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                this.switchTab('dashboard');
                notification.close();
            };
        }
    }

    // Form management
    toggleFormCollapse() {
        const form = document.querySelector('.medicine-form');
        const collapseBtn = document.getElementById('collapseAddForm');
        
        if (form && collapseBtn) {
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
            collapseBtn.innerHTML = form.style.display === 'none' 
                ? '<i class="fas fa-chevron-down"></i>' 
                : '<i class="fas fa-chevron-up"></i>';
        }
    }

    // Modal management
    showConfirmModal(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        
        if (modal && modalTitle && modalMessage && confirmBtn) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            
            confirmBtn.onclick = () => {
                onConfirm();
                this.closeModal();
            };
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Toast notifications
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Loading management
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }

    // Data persistence
    saveData() {
        const data = {
            medicines: this.medicines,
            notificationsEnabled: this.notificationsEnabled,
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('mediMateData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showToast('Failed to save data', 'error');
        }
    }

    loadStoredData() {
        try {
            const storedData = localStorage.getItem('mediMateData');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.medicines = data.medicines || [];
                this.notificationsEnabled = data.notificationsEnabled || false;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showToast('Failed to load saved data', 'warning');
        }
    }

    // Utility functions
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MediMateApp();
});

// Add CSS for new toast animation
const additionalCSS = `
@keyframes slideOutToast {
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.medicine-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    margin-bottom: var(--space-4);
    box-shadow: var(--shadow-neumorphic);
    transition: var(--transition-normal);
    border-left: 4px solid var(--primary-500);
}

.medicine-card:hover {
    box-shadow: var(--shadow-neumorphic-hover);
    transform: translateY(-2px);
}

.medicine-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-4);
}

.medicine-title h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-800);
    margin-bottom: var(--space-1);
}

.medicine-type {
    background: var(--primary-100);
    color: var(--primary-700);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 500;
}

.medicine-status {
    padding: var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
}

.medicine-status.active {
    background: var(--success-100);
    color: var(--success-700);
}

.medicine-status.inactive {
    background: var(--neutral-100);
    color: var(--neutral-500);
}

.medicine-details {
    margin-bottom: var(--space-4);
}

.detail-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
    font-size: 0.875rem;
    color: var(--neutral-600);
}

.detail-row i {
    color: var(--primary-500);
    width: 16px;
}

.medicine-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
}

.action-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-fast);
    font-size: 0.875rem;
}

.action-btn.edit {
    background: var(--primary-50);
    color: var(--primary-600);
}

.action-btn.edit:hover {
    background: var(--primary-100);
}

.action-btn.play {
    background: var(--success-50);
    color: var(--success-600);
}

.action-btn.play:hover {
    background: var(--success-100);
}

.action-btn.pause {
    background: var(--warning-50);
    color: var(--warning-600);
}

.action-btn.pause:hover {
    background: var(--warning-100);
}

.action-btn.delete {
    background: var(--error-50);
    color: var(--error-600);
}

.action-btn.delete:hover {
    background: var(--error-100);
}

.search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--neutral-200);
    border-top: none;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
    display: none;
}

.search-suggestion {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    cursor: pointer;
    transition: var(--transition-fast);
    border-bottom: 1px solid var(--neutral-100);
}

.search-suggestion:hover {
    background: var(--primary-50);
}

.search-suggestion:last-child {
    border-bottom: none;
}

.medicine-info-card {
    background: white;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    box-shadow: var(--shadow-card);
}

.medicine-info-header {
    background: var(--primary-50);
    padding: var(--space-6);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
}

.medicine-title h3 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--neutral-800);
    margin-bottom: var(--space-2);
}

.medicine-category {
    background: var(--primary-100);
    color: var(--primary-700);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    font-weight: 500;
}

.medicine-rating {
    text-align: right;
}

.rating-stars {
    color: var(--warning-400);
    font-size: 1.25rem;
    margin-bottom: var(--space-1);
}

.rating-text {
    font-size: 0.875rem;
    color: var(--neutral-600);
    font-weight: 500;
}

.info-tabs {
    display: flex;
    border-bottom: 2px solid var(--neutral-100);
    margin-bottom: var(--space-6);
}

.info-tab {
    background: none;
    border: none;
    padding: var(--space-3) var(--space-6);
    cursor: pointer;
    font-weight: 500;
    color: var(--neutral-600);
    border-bottom: 2px solid transparent;
    transition: var(--transition-fast);
}

.info-tab.active {
    color: var(--primary-600);
    border-bottom-color: var(--primary-500);
}

.info-tab:hover {
    color: var(--primary-500);
}

.info-content {
    padding: 0 var(--space-6) var(--space-6);
}

.info-section {
    display: none;
}

.info-section.active {
    display: block;
}

.info-section h4 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--neutral-800);
    margin-bottom: var(--space-3);
}

.side-effects-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-3);
}

.side-effect-tag {
    background: var(--warning-50);
    color: var(--warning-700);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-lg);
    font-size: 0.875rem;
    border: 1px solid var(--warning-200);
}

.dosage-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
}

.dosage-group {
    background: var(--neutral-50);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    border-left: 3px solid var(--primary-500);
}

.dosage-group h5 {
    font-weight: 600;
    color: var(--neutral-800);
    margin-bottom: var(--space-2);
}

.interactions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.interaction-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3);
    background: var(--neutral-50);
    border-radius: var(--radius-lg);
}

.interaction-drug {
    font-weight: 500;
    color: var(--neutral-800);
}

.interaction-level {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.interaction-level.high {
    background: var(--error-100);
    color: var(--error-700);
}

.interaction-level.moderate {
    background: var(--warning-100);
    color: var(--warning-700);
}

.interaction-level.low {
    background: var(--success-100);
    color: var(--success-700);
}

.precautions-list {
    list-style: none;
    padding: 0;
}

.precautions-list li {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
    line-height: 1.6;
}

.precautions-list i {
    color: var(--success-500);
    margin-top: 2px;
    flex-shrink: 0;
}

.suggestion-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    margin-bottom: var(--space-6);
    box-shadow: var(--shadow-neumorphic);
    transition: var(--transition-normal);
}

.suggestion-card:hover {
    box-shadow: var(--shadow-neumorphic-hover);
    transform: translateY(-2px);
}

.suggestion-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-4);
}

.suggestion-title h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-800);
    margin-bottom: var(--space-1);
}

.suggestion-type {
    background: var(--primary-100);
    color: var(--primary-700);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: 500;
}

.suggestion-content {
    margin-bottom: var(--space-4);
}

.suggestion-content h5 {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--neutral-700);
    margin-bottom: var(--space-2);
}

.suggestion-content h5 i {
    color: var(--primary-500);
}

.suggestion-content p {
    color: var(--neutral-600);
    line-height: 1.6;
    margin-bottom: var(--space-3);
}

.suggestion-actions {
    display: flex;
    gap: var(--space-3);
}

.toast-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

.toast-content i {
    font-size: 1.125rem;
}

.status-active,
.status-inactive {
    text-align: center;
    padding: var(--space-4);
}

.status-active i,
.status-inactive i {
    font-size: 2.5rem;
    margin-bottom: var(--space-3);
}

.status-active i {
    color: var(--success-500);
}

.status-inactive i {
    color: var(--neutral-300);
}

.status-active p,
.status-inactive p {
    color: var(--neutral-600);
    margin-bottom: var(--space-2);
}

.status-active small {
    color: var(--neutral-500);
    font-size: 0.875rem;
}

.next-dose-info {
    text-align: left;
}

.dose-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
}

.dose-header h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--neutral-800);
}

.dose-time {
    background: var(--primary-100);
    color: var(--primary-700);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-lg);
    font-weight: 500;
}

.dose-details {
    margin-bottom: var(--space-4);
}

.dose-details p {
    margin-bottom: var(--space-2);
    color: var(--neutral-600);
}

.dosage {
    font-weight: 600;
    color: var(--neutral-800);
}

.time-until {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--primary-600);
    font-weight: 500;
}

.dose-actions {
    display: flex;
    gap: var(--space-3);
}

.custom-times-input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    border: 2px solid var(--neutral-200);
    border-radius: var(--radius-lg);
    font-family: inherit;
    font-size: 0.875rem;
    transition: var(--transition-fast);
}

.custom-times-input:focus {
    outline: none;
    border-color: var(--primary-400);
    box-shadow: 0 0 0 3px var(--primary-50);
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
