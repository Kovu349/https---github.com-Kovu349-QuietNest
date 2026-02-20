// ================================
// SUPABASE SETUP
// ================================
const supabaseClient = window.supabase.createClient(
    'https://jwuwfkwrtqixihfvmwli.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXdma3dydHFpeGloZnZtd2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTk0NDgsImV4cCI6MjA4Njg3NTQ0OH0.0kO7wtC4N6zuc89StRepz3DTq2VTaJ2vqDimD0nuw8M'
);

// ================================
// DYNAMIC NAVBAR (all pages)
// ================================
async function updateNavbar() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const navLinks = document.querySelector('.nav-links ul');
    
    if (!navLinks) return;
    
    if (user) {
        // User is logged in - show My Listings
        navLinks.innerHTML = `
            <li><a href="my-listings.html">My Listings</a></li>
            <li><a href="find-space.html">Find a Space</a></li>
            <li><button id="logoutBtn" class="logout-btn">Logout</button></li>
        `;
        
        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                window.location.href = 'index.html';
            });
        }
    } else {
        // User is NOT logged in - show For Hosts
        navLinks.innerHTML = `
            <li><a href="auth.html">For Hosts</a></li>
            <li><a href="find-space.html">Find a Space</a></li>
        `;
    }
}

// Call this on every page load
updateNavbar();

// ================================
// AUTHENTICATION (auth.html)
// ================================
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// Tab switching
if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        signupForm.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.style.display = 'flex';
        loginForm.style.display = 'none';
    });
}

// Sign Up
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const name = document.getElementById('signup-name').value;

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Account created! Redirecting...');
            window.location.href = 'my-listings.html';
        }
    });
}

// Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Logged in! Redirecting...');
            window.location.href = 'my-listings.html';
        }
    });
}

// ================================
// HOST FORM (for-hosts.html)
// ================================
const spaceSelect = document.getElementById('space-type');
const otherInput = document.getElementById('other-space');
const customAlert = document.getElementById('custom-alert');
const alertMessage = document.getElementById('custom-alert-message');
const alertClose = document.getElementById('custom-alert-close');

// Show/hide "Other" textarea
if (spaceSelect) {
    spaceSelect.addEventListener('change', () => {
        if (spaceSelect.value === 'Other') {
            otherInput.style.display = 'block';
        } else {
            otherInput.style.display = 'none';
        }
    });
}

// Submit host form to Supabase
const hostForm = document.getElementById('hostForm');
if (hostForm) {
    hostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get logged in user
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            alert('Please log in first to list a space!');
            window.location.href = 'auth.html';
            return;
        }

        const spaceData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            city: document.getElementById('city').value,
            capacity: document.getElementById('capacity').value,
            space_type: document.getElementById('space-type').value,
            hours: document.getElementById('hours').value,
            price: document.getElementById('price').value,
            description: document.getElementById('description').value,
            price_type: document.querySelector('input[name="priceType"]:checked')?.value || 'Paid',
            user_id: user.id,
        };

        const { data, error } = await supabaseClient
            .from('spaces')
            .insert([spaceData]);

        if (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again!');
        } else {
            if (alertMessage) alertMessage.textContent = "Your space has been submitted successfully! 🎉";
            if (customAlert) customAlert.style.display = 'block';
            hostForm.reset();
            if (otherInput) otherInput.style.display = 'none';
        }
    });
}

// Close custom alert
if (alertClose) {
    alertClose.addEventListener('click', () => {
        customAlert.style.display = 'none';
    });
}

// ================================
// MY LISTINGS DASHBOARD
// ================================
const myListingsGrid = document.getElementById('myListingsGrid');
const noListings = document.getElementById('noListings');

// Check if user is logged in
async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user && window.location.pathname.includes('my-listings')) {
        alert('Please log in first!');
        window.location.href = 'auth.html';
    }
    
    return user;
}

// Load user's listings
if (myListingsGrid) {
    async function loadMyListings() {
        const user = await checkAuth();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('spaces')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error loading listings:', error);
            return;
        }

        if (data.length === 0) {
            noListings.style.display = 'block';
            myListingsGrid.style.display = 'none';
            return;
        }

        myListingsGrid.innerHTML = '';

        data.forEach(space => {
            const card = document.createElement('div');
            card.classList.add('my-listing-card');
            card.innerHTML = `
                <div class="space-card-top">
                    <span class="space-price">${space.price_type === 'Free' ? 'Free' : '$' + space.price + '/hr'}</span>
                    <span class="space-type">${space.space_type}</span>
                </div>
                <div class="space-card-image">
                    <img src="${space.photo_url || 'placeholder.png'}" alt="${space.space_type}">
                </div>
                <div class="space-card-bottom">
                    <h3 class="space-name">${space.name}'s Space</h3>
                    <div class="space-details">
                        <span>📍 ${space.city}</span>
                        <span>👤 ${space.capacity} people</span>
                    </div>
                </div>
                <div class="listing-actions">
                    <button class="btn-edit" data-id="${space.id}">Edit</button>
                    <button class="btn-delete" data-id="${space.id}">Delete</button>
                </div>
            `;

            // Delete button
            const deleteBtn = card.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this listing?')) {
                    const { error } = await supabaseClient
                        .from('spaces')
                        .delete()
                        .eq('id', space.id);

                    if (error) {
                        alert('Error deleting listing');
                    } else {
                        alert('Listing deleted! 🗑️');
                        loadMyListings(); // Reload
                    }
                }
            });

            // Edit button (placeholder for now)
            const editBtn = card.querySelector('.btn-edit');
            editBtn.addEventListener('click', () => {
                alert('Edit feature coming soon!');
            });

            myListingsGrid.appendChild(card);
        });
    }

    loadMyListings();
}

// ================================
// FIND SPACE PAGE (find-space.html)
// ================================
const spacesGrid = document.getElementById('spacesGrid');
let currentSpace = null;

if (spacesGrid) {
    // Load all spaces from Supabase
    async function loadSpaces() {
        const { data, error } = await supabaseClient
            .from('spaces')
            .select('*');

        if (error) {
            console.error('Error fetching spaces:', error);
            return;
        }

        if (data.length === 0) {
            spacesGrid.innerHTML = '<p class="no-spaces">No spaces listed yet. Check back soon!</p>';
            return;
        }

        // Clear grid before loading
        spacesGrid.innerHTML = '';

        data.forEach(space => {
            const card = document.createElement('div');
            card.classList.add('space-card');
            card.dataset.priceType = space.price_type || 'Paid';
            card.innerHTML = `
                <div class="space-card-top">
                    <span class="space-price">${space.price_type === 'Free' ? 'Free' : '$' + space.price + '/hr'}</span>
                    <span class="space-type">${space.space_type}</span>
                </div>
                <div class="space-card-image">
                    <img src="${space.photo_url || 'placeholder.png'}" alt="${space.space_type}">
                </div>
                <div class="space-card-bottom">
                    <h3 class="space-name">${space.name}'s Space</h3>
                    <div class="space-details">
                        <span>📍 ${space.city}</span>
                        <span>👤 ${space.capacity} people</span>
                    </div>
                    ${space.description ? `<p class="space-description">${space.description}</p>` : ''}
                    <button class="view-space-btn" data-id="${space.id}">View Space</button>
                </div>
            `;

            // Add click event to View Space button
            const viewBtn = card.querySelector('.view-space-btn');
            viewBtn.addEventListener('click', () => {
                currentSpace = space;
                const modalSubtitle = document.getElementById('modalSubtitle');
                modalSubtitle.textContent = `${space.name}'s ${space.space_type} • ${space.price_type === 'Free' ? 'Free' : '$' + space.price + '/hr'}`;
                document.getElementById('modalOverlay').classList.add('active');
            });

            spacesGrid.appendChild(card);
        });
    }

    loadSpaces();

    // Filter by Free/Paid
    const freeCheckbox = document.getElementById('free');
    const paidCheckbox = document.getElementById('paid');

    if (freeCheckbox && paidCheckbox) {
        freeCheckbox.addEventListener('change', filterSpaces);
        paidCheckbox.addEventListener('change', filterSpaces);
    }

    function filterSpaces() {
        const showFree = freeCheckbox.checked;
        const showPaid = paidCheckbox.checked;
        const cards = document.querySelectorAll('.space-card');

        cards.forEach(card => {
            const priceType = card.dataset.priceType;

            if (!showFree && !showPaid) {
                card.style.display = 'block';
                return;
            }

            if ((showFree && priceType === 'Free') || (showPaid && priceType === 'Paid')) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}

// ================================
// BOOKING MODAL (find-space.html)
// ================================
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');

// Close modal on X button
if (modalClose) {
    modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        bookingForm.reset();
    });
}

// Close modal when clicking outside
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
            bookingForm.reset();
        }
    });
}

// Send booking request via EmailJS
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = bookingForm.querySelector('.modal-submit');
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        const templateParams = {
            space_name: currentSpace.name + "'s " + currentSpace.space_type,
            host_email: currentSpace.email,
            renter_name: document.getElementById('renter-name').value,
            renter_email: document.getElementById('renter-email').value,
            date: document.getElementById('booking-date').value,
            start_time: document.getElementById('start-time').value,
            duration: document.getElementById('duration').value,
            num_people: document.getElementById('num-people').value,
        };

        emailjs.send('service_4cbzddf', 'template_0kfucu6', templateParams, 'icZWc9FCx4twORcCY')
            .then(() => {
                alert('Booking request sent! The host will contact you soon 🎉');
                modalOverlay.classList.remove('active');
                bookingForm.reset();
                submitBtn.textContent = 'Send Booking Request';
                submitBtn.disabled = false;
            })
            .catch((error) => {
                console.error('EmailJS error:', error);
                alert('Something went wrong. Please try again!');
                submitBtn.textContent = 'Send Booking Request';
                submitBtn.disabled = false;
            });
    });
}

// ================================
// FILTER TOGGLE (find-space.html)
// ================================
const filterToggle = document.getElementById('filterToggle');
const filterOptions = document.getElementById('filterOptions');

if (filterToggle && filterOptions) {
    filterToggle.addEventListener('click', function() {
        filterOptions.classList.toggle('active');
    });
}