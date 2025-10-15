// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCeQQz9A6r3gMRWR-gQ4G62sMG3HO9NK70",
    authDomain: "stationery-htbb.firebaseapp.com",
    databaseURL: "https://stationery-htbb-default-rtdb.firebaseio.com/",
    projectId: "stationery-htbb",
    storageBucket: "stationery-htbb.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
let database, borrowingLogRef, inventoryRef, itemsRef;
let borrowingLog = [];
let nextId = 1;
let inventory = {};
let items = {};
let currentFilter = 'all';
let selectedQuantities = {};
let currentReturnId = null;
let returnQuantities = {};

// Admin password updated to "htbb"
const ADMIN_PASSWORD = "htbb";

// Date formatting function for dd/mm/yy
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

// Initialize Firebase connection
function initializeFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        borrowingLogRef = database.ref('borrowingLog');
        inventoryRef = database.ref('inventory');
        itemsRef = database.ref('items');
        
        // Set up Firebase listeners
        setupFirebaseListeners();
        
        // Update connection status
        updateConnectionStatus(true);
    } catch (error) {
        console.error("Firebase initialization error:", error);
        updateConnectionStatus(false);
        showToast('error', 'Firebase Error', 'Failed to initialize Firebase. Please check your configuration.');
    }
}

// Set up Firebase listeners
function setupFirebaseListeners() {
    // Listen for borrowing log changes
    borrowingLogRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            borrowingLog = Object.keys(data).map(key => ({
                id: parseInt(key),
                ...data[key]
            }));
            
            // Find the highest ID for next entry
            if (borrowingLog.length > 0) {
                nextId = Math.max(...borrowingLog.map(item => item.id)) + 1;
            }
        } else {
            borrowingLog = [];
            nextId = 1;
        }
        
        updateDashboardStats();
        updateRecordsTable();
        updateRecentActivity();
        updateRecentBorrowingTable();
        updateStatusCounts();
        updateStatusLists();
    });

    // Listen for inventory changes
    inventoryRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            inventory = data;
        } else {
            inventory = {};
        }
        
        updateDashboardStats();
        renderInventory();
        updateOfficeSuppliesQuantities();
    });

    // Listen for items changes
    itemsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            items = data;
        } else {
            // Initialize with empty items if none exist
            items = {};
            itemsRef.set(items);
        }
        
        updateDashboardStats();
        renderInventory();
        renderOfficeSuppliesItems();
        updateOfficeSuppliesQuantities();
    });
}

// Navigation functions
function showLandingScreen() {
    hideAllSections();
    document.getElementById('landingScreen').style.display = 'flex';
}

function showBorrowingForm() {
    hideAllSections();
    document.getElementById('borrowingSection').classList.add('active');
    setDefaultDates();
    selectedQuantities = {};
    updateSummary();
}

function showAdminLogin() {
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
}

function showAdminSection(sectionId) {
    // Hide all admin sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById('admin' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1)).classList.add('active');
    
    // Update active nav link
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the correct link
    const sidebarLink = document.querySelector(`.sidebar .nav-link[onclick*="${sectionId}"]`);
    if (sidebarLink) {
        sidebarLink.classList.add('active');
    }
    
    const mobileLink = document.querySelector(`.mobile-nav-link[onclick*="${sectionId}"]`);
    if (mobileLink) {
        mobileLink.classList.add('active');
    }
}

function hideAllSections() {
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('borrowingSection').classList.remove('active');
    document.getElementById('adminSection').classList.remove('active');
}

// Toggle mobile navigation - Fixed
function toggleMobileNav() {
    const navMenu = document.getElementById('mobileNavMenu');
    const navOverlay = document.getElementById('mobileNavOverlay');
    const body = document.body;
    
    // Toggle active class on menu and overlay
    navMenu.classList.toggle('active');
    navOverlay.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navMenu.classList.contains('active')) {
        body.style.overflow = 'hidden';
    } else {
        body.style.overflow = '';
    }
}

// Set default dates for borrowing form
function setDefaultDates() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    document.getElementById('borrowDate').value = todayString;
    
    // Set default return date to 3 days from now
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 3);
    const returnDateString = returnDate.toISOString().split('T')[0];
    document.getElementById('returnDate').value = returnDateString;
}

// Admin login form submission
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
        document.getElementById('adminPassword').value = '';
        
        // Show admin dashboard
        hideAllSections();
        document.getElementById('adminSection').classList.add('active');
        
        // Initialize Firebase if not already done
        if (!database) {
            initializeFirebase();
        }
    } else {
        showToast('error', 'Login Failed', 'Invalid password. Please try again.');
    }
});

// Borrowing form submission
document.getElementById('borrowForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!borrowingLogRef) {
        showToast('error', 'Not Connected', 'Please wait for the system to initialize.');
        return;
    }
    
    // Get form values
    const borrowerName = document.getElementById('borrowerName').value;
    const purpose = document.getElementById('purpose').value;
    const borrowDate = document.getElementById('borrowDate').value;
    const returnDate = document.getElementById('returnDate').value;
    
    // Get selected office supplies items with quantities
    const selectedItems = [];
    let itemsAvailable = true;
    let unavailableItems = [];
    let selectedItemIds = [];
    
    Object.entries(selectedQuantities).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
            const item = items[itemId];
            const availableQuantity = inventory[itemId] || 0;
            
            if (availableQuantity < quantity) {
                itemsAvailable = false;
                unavailableItems.push(`${item.name} (requested: ${quantity}, available: ${availableQuantity})`);
            } else {
                selectedItems.push({
                    name: item.name,
                    quantity: quantity,
                    returned: 0 // Track returned quantity
                });
                selectedItemIds.push({
                    id: itemId,
                    quantity: quantity
                });
            }
        }
    });
    
    if (selectedItems.length === 0) {
        showToast('error', 'No Items Selected', 'Please select at least one office supplies item with quantity.');
        return;
    }
    
    if (!itemsAvailable) {
        showToast('error', 'Insufficient Stock', `The following items don't have enough stock: ${unavailableItems.join(', ')}`);
        return;
    }
    
    // Create new log entry
    const newEntry = {
        borrowerName,
        purpose,
        borrowDate,
        returnDate,
        items: selectedItems,
        status: 'pending',
        actualReturnDate: null
    };
    
    // Add to Firebase
    borrowingLogRef.child(nextId).set(newEntry)
        .then(() => {
            // Update inventory quantities
            const inventoryUpdates = {};
            selectedItemIds.forEach(({ id, quantity }) => {
                inventoryUpdates[id] = (inventory[id] || 0) - quantity;
            });
            
            inventoryRef.update(inventoryUpdates)
                .then(() => {
                    // Reset form
                    this.reset();
                    setDefaultDates();
                    selectedQuantities = {};
                    updateSummary();
                    
                    // Show success message
                    showToast('success', 'Request Submitted', 'Your borrowing request has been recorded successfully.');
                })
                .catch((error) => {
                    console.error("Error updating inventory:", error);
                    showToast('error', 'Inventory Error', 'Failed to update inventory quantities.');
                });
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            showToast('error', 'Submission Error', 'Failed to submit your request. Please try again.');
        });
});

// Render office supplies items dynamically
function renderOfficeSuppliesItems() {
    const officeSuppliesList = document.getElementById('officeSuppliesList');
    officeSuppliesList.innerHTML = '';
    
    if (Object.keys(items).length === 0) {
        officeSuppliesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-inbox"></i>
                </div>
                <div class="empty-state-title">No Office Supplies Items Available</div>
                <div class="empty-state-description">
                    There are currently no office supplies items in the system. Please contact the administrator to add items.
                </div>
            </div>
        `;
        return;
    }
    
    Object.entries(items).forEach(([id, item]) => {
        const quantity = inventory[id] || 0;
        let quantityClass = 'quantity-high';
        
        if (quantity <= 3) {
            quantityClass = 'quantity-low';
        } else if (quantity <= 6) {
            quantityClass = 'quantity-medium';
        }
        
        const selectedQuantity = selectedQuantities[id] || 0;
        
        const officeSuppliesItem = document.createElement('div');
        officeSuppliesItem.className = 'office-supplies-item';
        officeSuppliesItem.innerHTML = `
            <i class="bi bi-box office-supplies-icon"></i>
            <div class="office-supplies-details">
                <div class="office-supplies-name">${item.name}</div>
                <div class="office-supplies-quantity">
                    <span>Available:</span>
                    <span class="quantity-badge ${quantityClass}" id="${id}-available">${quantity}</span>
                </div>
            </div>
            <div class="quantity-selector">
                <button type="button" class="quantity-btn" onclick="decreaseQuantity('${id}')" ${selectedQuantity <= 0 ? 'disabled' : ''}>
                    <i class="bi bi-dash"></i>
                </button>
                <input type="number" class="quantity-input" id="${id}-quantity" value="${selectedQuantity}" min="0" max="${quantity}" readonly>
                <button type="button" class="quantity-btn" onclick="increaseQuantity('${id}')" ${selectedQuantity >= quantity ? 'disabled' : ''}>
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `;
        
        officeSuppliesList.appendChild(officeSuppliesItem);
    });
}

// Increase quantity for an item
function increaseQuantity(itemId) {
    const available = inventory[itemId] || 0;
    const current = selectedQuantities[itemId] || 0;
    
    if (current < available) {
        selectedQuantities[itemId] = current + 1;
        document.getElementById(`${itemId}-quantity`).value = selectedQuantities[itemId];
        
        // Update button states
        const decreaseBtn = document.querySelector(`button[onclick="decreaseQuantity('${itemId}')"]`);
        const increaseBtn = document.querySelector(`button[onclick="increaseQuantity('${itemId}')"]`);
        
        decreaseBtn.disabled = false;
        if (selectedQuantities[itemId] >= available) {
            increaseBtn.disabled = true;
        }
        
        updateSummary();
    }
}

// Decrease quantity for an item
function decreaseQuantity(itemId) {
    const current = selectedQuantities[itemId] || 0;
    
    if (current > 0) {
        selectedQuantities[itemId] = current - 1;
        document.getElementById(`${itemId}-quantity`).value = selectedQuantities[itemId];
        
        // Update button states
        const decreaseBtn = document.querySelector(`button[onclick="decreaseQuantity('${itemId}')"]`);
        const increaseBtn = document.querySelector(`button[onclick="increaseQuantity('${itemId}')"]`);
        
        increaseBtn.disabled = false;
        if (selectedQuantities[itemId] <= 0) {
            decreaseBtn.disabled = true;
        }
        
        updateSummary();
    }
}

// Update order summary
function updateSummary() {
    const summaryCard = document.getElementById('summaryCard');
    const summaryItems = document.getElementById('summaryItems');
    
    // Calculate total items and total unique items
    const selectedItems = Object.entries(selectedQuantities).filter(([id, qty]) => qty > 0);
    
    if (selectedItems.length === 0) {
        summaryCard.style.display = 'none';
        return;
    }
    
    summaryCard.style.display = 'block';
    
    let html = '';
    let totalItems = 0;
    
    selectedItems.forEach(([id, quantity]) => {
        const item = items[id];
        html += `
            <div class="summary-item">
                <span>${item.name}</span>
                <span>${quantity} unit${quantity > 1 ? 's' : ''}</span>
            </div>
        `;
        totalItems += quantity;
    });
    
    html += `
        <div class="summary-item">
            <span>Total Items</span>
            <span>${totalItems}</span>
        </div>
    `;
    
    summaryItems.innerHTML = html;
}

// Update office supplies quantities
function updateOfficeSuppliesQuantities() {
    Object.entries(items).forEach(([id, item]) => {
        const quantity = inventory[id] || 0;
        const badge = document.getElementById(`${id}-available`);
        const input = document.getElementById(`${id}-quantity`);
        const selectedQuantity = selectedQuantities[id] || 0;
        
        if (badge) {
            badge.textContent = quantity;
            badge.classList.remove('quantity-low', 'quantity-medium', 'quantity-high');
            
            if (quantity <= 3) {
                badge.classList.add('quantity-low');
            } else if (quantity <= 6) {
                badge.classList.add('quantity-medium');
            } else {
                badge.classList.add('quantity-high');
            }
        }
        
        if (input) {
            // Adjust selected quantity if it exceeds available stock
            if (selectedQuantity > quantity) {
                selectedQuantities[id] = quantity;
                input.value = quantity;
            }
            
            // Update button states
            const decreaseBtn = document.querySelector(`button[onclick="decreaseQuantity('${id}')"]`);
            const increaseBtn = document.querySelector(`button[onclick="increaseQuantity('${id}')"]`);
            
            if (decreaseBtn) {
                decreaseBtn.disabled = selectedQuantity <= 0;
            }
            if (increaseBtn) {
                increaseBtn.disabled = selectedQuantity >= quantity;
            }
        }
    });
    
    updateSummary();
}

// Update recent borrowing table
function updateRecentBorrowingTable() {
    const tableBody = document.getElementById('recentBorrowingTable');
    const mobileContainer = document.getElementById('recentBorrowingMobile');
    
    // Get recent records (last 5)
    const recent = [...borrowingLog]
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
        .slice(0, 5);
    
    if (recent.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No records found</td></tr>';
        mobileContainer.innerHTML = '<div class="empty-state"><p>No records found</p></div>';
        return;
    }
    
    // Check if we should show mobile view
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Hide desktop table and show mobile cards
        tableBody.parentElement.parentElement.style.display = 'none';
        mobileContainer.style.display = 'block';
        
        let html = '';
        recent.forEach(entry => {
            const statusClass = entry.status === 'returned' ? 'badge-returned' : 
                               entry.status === 'overdue' ? 'badge-overdue' : 
                               entry.status === 'partial' ? 'badge-partial' : 'badge-pending';
            
            // Format items with quantities and returned amounts
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            const actionButton = entry.status !== 'returned' ? 
                `<button class="btn btn-success btn-sm w-100" onclick="showReturnModal(${entry.id})">
                    <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                </button>` : 
                '<span class="text-muted">Returned</span>';
            
            html += `
                <div class="mobile-card">
                    <div class="mobile-card-header">${entry.borrowerName}</div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Items:</div>
                        <div class="mobile-card-value">${itemsText}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Borrow Date:</div>
                        <div class="mobile-card-value">${formatDate(entry.borrowDate)}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Return Date:</div>
                        <div class="mobile-card-value">${formatDate(entry.returnDate)}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Status:</div>
                        <div class="mobile-card-value">
                            <span class="badge ${statusClass}">${getStatusText(entry.status)}</span>
                        </div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Action:</div>
                        <div class="mobile-card-value">${actionButton}</div>
                    </div>
                </div>
            `;
        });
        
        mobileContainer.innerHTML = html;
    } else {
        // Show desktop table and hide mobile cards
        tableBody.parentElement.parentElement.style.display = 'block';
        mobileContainer.style.display = 'none';
        
        let html = '';
        recent.forEach(entry => {
            const statusClass = entry.status === 'returned' ? 'badge-returned' : 
                               entry.status === 'overdue' ? 'badge-overdue' : 
                               entry.status === 'partial' ? 'badge-partial' : 'badge-pending';
            
            // Format items with quantities and returned amounts
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            const actionButton = entry.status !== 'returned' ? 
                `<button class="btn btn-success btn-sm" onclick="showReturnModal(${entry.id})">
                    <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                </button>` : 
                '<span class="text-muted">Returned</span>';
            
            html += `
                <tr>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${formatDate(entry.borrowDate)}</td>
                    <td>${formatDate(entry.returnDate)}</td>
                    <td><span class="badge ${statusClass}">${getStatusText(entry.status)}</span></td>
                    <td>${actionButton}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'On loan';
        case 'partial': return 'Partial return';
        case 'overdue': return 'Overdue';
        case 'returned': return 'Returned';
        default: return status;
    }
}

// Show return modal
function showReturnModal(id) {
    currentReturnId = id;
    returnQuantities = {};
    
    const entry = borrowingLog.find(e => e.id === id);
    if (!entry) return;
    
    // Set borrower info
    document.getElementById('returnBorrowerName').textContent = entry.borrowerName;
    document.getElementById('returnPurpose').textContent = entry.purpose;
    
    // Build return items list
    const returnItemsList = document.getElementById('returnItemsList');
    returnItemsList.innerHTML = '';
    
    entry.items.forEach((item, index) => {
        const remainingQuantity = item.quantity - (item.returned || 0);
        
        if (remainingQuantity > 0) {
            const returnItem = document.createElement('div');
            returnItem.className = 'return-item';
            returnItem.innerHTML = `
                <input type="checkbox" class="return-checkbox" id="return-${index}" onchange="toggleReturnItem(${index}, ${remainingQuantity})">
                <div class="return-item-info">
                    <div class="return-item-name">${item.name}</div>
                    <div class="return-item-details">
                        <span>Borrowed: ${item.quantity}</span>
                        <span>Already returned: ${item.returned || 0}</span>
                        <span>Remaining: ${remainingQuantity}</span>
                    </div>
                </div>
                <div class="return-quantity-control">
                    <button type="button" class="quantity-btn" onclick="decreaseReturnQuantity(${index})" disabled>
                        <i class="bi bi-dash"></i>
                    </button>
                    <input type="number" class="quantity-input" id="return-quantity-${index}" value="0" min="0" max="${remainingQuantity}" readonly>
                    <button type="button" class="quantity-btn" onclick="increaseReturnQuantity(${index})" disabled>
                        <i class="bi bi-plus"></i>
                    </button>
                </div>
            `;
            returnItemsList.appendChild(returnItem);
            
            // Initialize return quantities
            returnQuantities[index] = 0;
        }
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('returnItemsModal'));
    modal.show();
}

// Toggle return item selection
function toggleReturnItem(index, maxQuantity) {
    const checkbox = document.getElementById(`return-${index}`);
    const quantityInput = document.getElementById(`return-quantity-${index}`);
    const decreaseBtn = checkbox.parentElement.querySelector('.quantity-btn:first-of-type');
    const increaseBtn = checkbox.parentElement.querySelector('.quantity-btn:last-of-type');
    
    if (checkbox.checked) {
        returnQuantities[index] = 1;
        quantityInput.value = 1;
        decreaseBtn.disabled = false;
        increaseBtn.disabled = maxQuantity <= 1;
    } else {
        returnQuantities[index] = 0;
        quantityInput.value = 0;
        decreaseBtn.disabled = true;
        increaseBtn.disabled = true;
    }
}

// Increase return quantity
function increaseReturnQuantity(index) {
    const entry = borrowingLog.find(e => e.id === currentReturnId);
    if (!entry) return;
    
    const item = entry.items[index];
    const maxQuantity = item.quantity - (item.returned || 0);
    const current = returnQuantities[index] || 0;
    
    if (current < maxQuantity) {
        returnQuantities[index] = current + 1;
        document.getElementById(`return-quantity-${index}`).value = returnQuantities[index];
        
        // Update button states
        const decreaseBtn = document.querySelector(`#return-${index}`).parentElement.querySelector('.quantity-btn:first-of-type');
        const increaseBtn = document.querySelector(`#return-${index}`).parentElement.querySelector('.quantity-btn:last-of-type');
        
        decreaseBtn.disabled = false;
        if (returnQuantities[index] >= maxQuantity) {
            increaseBtn.disabled = true;
        }
    }
}

// Decrease return quantity
function decreaseReturnQuantity(index) {
    const current = returnQuantities[index] || 0;
    
    if (current > 0) {
        returnQuantities[index] = current - 1;
        document.getElementById(`return-quantity-${index}`).value = returnQuantities[index];
        
        // Update button states
        const decreaseBtn = document.querySelector(`#return-${index}`).parentElement.querySelector('.quantity-btn:first-of-type');
        const increaseBtn = document.querySelector(`#return-${index}`).parentElement.querySelector('.quantity-btn:last-of-type');
        
        increaseBtn.disabled = false;
        if (returnQuantities[index] <= 0) {
            decreaseBtn.disabled = true;
        }
    }
}

// Process return
function processReturn() {
    const entry = borrowingLog.find(e => e.id === currentReturnId);
    if (!entry) return;
    
    // Check if any items are selected for return
    const totalReturnQuantity = Object.values(returnQuantities).reduce((sum, qty) => sum + qty, 0);
    if (totalReturnQuantity === 0) {
        showToast('error', 'No Items Selected', 'Please select at least one item to return.');
        return;
    }
    
    // Prepare updates
    const updates = {};
    const inventoryUpdates = {};
    let allItemsReturned = true;
    
    // Update borrowing log with returned quantities
    entry.items.forEach((item, index) => {
        const returnQuantity = returnQuantities[index] || 0;
        if (returnQuantity > 0) {
            // Update returned quantity
            updates[`borrowingLog/${currentReturnId}/items/${index}/returned`] = (item.returned || 0) + returnQuantity;
            
            // Update inventory
            const itemId = Object.keys(items).find(key => {
                return items[key].name.toLowerCase() === item.name.toLowerCase();
            });
            
            if (itemId) {
                inventoryUpdates[`inventory/${itemId}`] = (inventory[itemId] || 0) + returnQuantity;
            }
        }
        
        // Check if all items are fully returned
        const totalReturned = (item.returned || 0) + (returnQuantities[index] || 0);
        if (totalReturned < item.quantity) {
            allItemsReturned = false;
        }
    });
    
    // Update status and return date
    if (allItemsReturned) {
        updates[`borrowingLog/${currentReturnId}/status`] = 'returned';
        updates[`borrowingLog/${currentReturnId}/actualReturnDate`] = new Date().toISOString().split('T')[0];
    } else {
        updates[`borrowingLog/${currentReturnId}/status`] = 'partial';
    }
    
    // Apply updates
    database.ref().update({ ...updates, ...inventoryUpdates })
        .then(() => {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('returnItemsModal')).hide();
            
            // Show success message
            if (allItemsReturned) {
                showToast('success', 'All Items Returned', 'All items have been successfully returned.');
            } else {
                showToast('success', 'Partial Return Processed', 'Selected items have been returned. Some items are still on loan.');
            }
        })
        .catch((error) => {
            console.error("Error processing return:", error);
            showToast('error', 'Return Error', 'Failed to process the return. Please try again.');
        });
}

// Admin functions
function updateDashboardStats() {
    const totalItems = Object.keys(items).length;
    const availableItems = Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
    const activeBorrows = borrowingLog.filter(entry => entry.status === 'pending' || entry.status === 'overdue' || entry.status === 'partial').length;
    const lowStock = Object.values(inventory).filter(qty => qty <= 3).length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('availableItems').textContent = availableItems;
    document.getElementById('activeBorrows').textContent = activeBorrows;
    document.getElementById('lowStock').textContent = lowStock;
}

function updateRecentActivity() {
    const recentActivity = document.getElementById('recentActivity');
    
    if (borrowingLog.length === 0) {
        recentActivity.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }
    
    // Sort by date (newest first) and take last 5
    const recent = [...borrowingLog]
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
        .slice(0, 5);
    
    let html = '<div class="list-group list-group-flush">';
    
    recent.forEach(entry => {
        const date = new Date(entry.borrowDate);
        const statusClass = entry.status === 'returned' ? 'success' : 
                           entry.status === 'overdue' ? 'danger' : 
                           entry.status === 'partial' ? 'info' : 'warning';
        
        // Format items with quantities and returned amounts
        const itemsText = entry.items.map(item => {
            const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
            return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
        }).join(', ');
        
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-semibold">${entry.borrowerName}</div>
                    <small class="text-muted">Borrowed: ${itemsText}</small>
                </div>
                <div class="text-end">
                    <span class="badge bg-${statusClass}">${getStatusText(entry.status)}</span>
                    <div><small class="text-muted">${formatDate(entry.borrowDate)}</small></div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    recentActivity.innerHTML = html;
}

function renderInventory() {
    const inventoryList = document.getElementById('inventoryList');
    
    if (Object.keys(items).length === 0) {
        inventoryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-stack"></i>
                </div>
                <div class="empty-state-title">No Inventory Items</div>
                <div class="empty-state-description">
                    Add office supplies items to start managing your inventory.
                </div>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addItemModal">
                    <i class="bi bi-plus-circle me-2"></i>Add Items
                </button>
            </div>
        `;
        return;
    }
    
    // Filter items based on current filter
    let filteredItems = Object.entries(items);
    
    if (currentFilter === 'low') {
        filteredItems = filteredItems.filter(([id]) => (inventory[id] || 0) <= 3);
    } else if (currentFilter === 'medium') {
        filteredItems = filteredItems.filter(([id]) => {
            const qty = inventory[id] || 0;
            return qty >= 4 && qty <= 6;
        });
    } else if (currentFilter === 'high') {
        filteredItems = filteredItems.filter(([id]) => (inventory[id] || 0) > 6);
    }
    
    if (filteredItems.length === 0) {
        inventoryList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-funnel"></i>
                </div>
                <div class="empty-state-title">No Items Found</div>
                <div class="empty-state-description">
                    No items match the current filter. Try a different filter or add new items.
                </div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    filteredItems.forEach(([id, item]) => {
        const quantity = inventory[id] || 0;
        let quantityClass = 'quantity-high';
        
        if (quantity <= 3) {
            quantityClass = 'quantity-low';
        } else if (quantity <= 6) {
            quantityClass = 'quantity-medium';
        }
        
        html += `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-icon">
                            <i class="bi bi-box"></i>
                        </div>
                        <div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-quantity">
                                <span>Current Stock:</span>
                                <span class="quantity-badge ${quantityClass}">${quantity}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-danger me-2" onclick="updateInventoryQuantity('${id}', -1)">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="fw-bold mx-2">${quantity}</span>
                        <button class="btn btn-sm btn-outline-success ms-2" onclick="updateInventoryQuantity('${id}', 1)">
                            <i class="bi bi-plus"></i>
                        </button>
                        <div class="item-actions ms-3">
                            <button class="btn-icon edit" onclick="editItem('${id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn-icon delete" onclick="deleteItem('${id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    inventoryList.innerHTML = html;
}

// Filter items function
function filterItems(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Re-render inventory with filter
    renderInventory();
}

function updateInventoryQuantity(itemId, change) {
    const newQuantity = Math.max(0, (inventory[itemId] || 0) + change);
    
    inventoryRef.child(itemId).set(newQuantity)
        .then(() => {
            showToast('success', 'Inventory Updated', `${items[itemId].name} quantity updated to ${newQuantity}.`);
        })
        .catch((error) => {
            console.error("Error updating inventory:", error);
            showToast('error', 'Update Error', 'Failed to update inventory. Please try again.');
        });
}

function addNewItem() {
    const name = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    
    if (!name) {
        showToast('error', 'Validation Error', 'Please fill in all fields.');
        return;
    }
    
    // Generate ID from name (lowercase, no spaces)
    const id = name.toLowerCase().replace(/\s+/g, '');
    
    // Check if item already exists
    if (items[id]) {
        showToast('error', 'Duplicate Item', 'An item with this name already exists.');
        return;
    }
    
    // Add item to Firebase
    const updates = {};
    updates[`items/${id}`] = { name };
    updates[`inventory/${id}`] = quantity;
    
    database.ref().update(updates)
        .then(() => {
            // Close modal and reset form
            bootstrap.Modal.getInstance(document.getElementById('addItemModal')).hide();
            document.getElementById('addItemForm').reset();
            
            showToast('success', 'Item Added', `${name} has been added successfully.`);
        })
        .catch((error) => {
            console.error("Error adding item:", error);
            showToast('error', 'Add Error', 'Failed to add item. Please try again.');
        });
}

function editItem(itemId) {
    const item = items[itemId];
    if (!item) return;
    
    document.getElementById('editItemId').value = itemId;
    document.getElementById('editItemName').value = item.name;
    
    // Show modal
    new bootstrap.Modal(document.getElementById('editItemModal')).show();
}

function updateItem() {
    const itemId = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value;
    
    if (!name) {
        showToast('error', 'Validation Error', 'Please fill in all fields.');
        return;
    }
    
    // Update item in Firebase
    itemsRef.child(itemId).set({ name })
        .then(() => {
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
            
            showToast('success', 'Item Updated', `${name} has been updated successfully.`);
        })
        .catch((error) => {
            console.error("Error updating item:", error);
            showToast('error', 'Update Error', 'Failed to update item. Please try again.');
        });
}

function deleteItem(itemId) {
    const item = items[itemId];
    if (!item) return;
    
    if (confirm(`Are you sure you want to delete "${item.name}"? This will also remove all inventory data for this item.`)) {
        // Delete item and inventory from Firebase
        const updates = {};
        updates[`items/${itemId}`] = null;
        updates[`inventory/${itemId}`] = null;
        
        database.ref().update(updates)
            .then(() => {
                showToast('success', 'Item Deleted', `${item.name} has been deleted successfully.`);
            })
            .catch((error) => {
                console.error("Error deleting item:", error);
                showToast('error', 'Delete Error', 'Failed to delete item. Please try again.');
            });
    }
}

function updateRecordsTable() {
    const tableBody = document.getElementById('recordsTableBody');
    const mobileContainer = document.getElementById('recordsMobile');
    const searchTerm = document.getElementById('recordsSearch').value.toLowerCase();
    
    // Filter records
    let filteredRecords = borrowingLog.filter(entry => {
        return entry.borrowerName.toLowerCase().includes(searchTerm) || 
               entry.purpose.toLowerCase().includes(searchTerm);
    });
    
    // Check for overdue items - item is overdue if current date is after return date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    
    filteredRecords = filteredRecords.map(entry => {
        const returnDate = new Date(entry.returnDate);
        returnDate.setHours(0, 0, 0, 0); // Set to midnight for comparison
        
        if (entry.status === 'pending' && today > returnDate) {
            return { ...entry, status: 'overdue' };
        }
        return entry;
    });
    
    // Sort by date (newest first)
    filteredRecords.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
    
    // Check if we should show mobile view
    const isMobile = window.innerWidth <= 768;
    
    if (filteredRecords.length === 0) {
        if (isMobile) {
            tableBody.parentElement.parentElement.style.display = 'none';
            mobileContainer.style.display = 'block';
            mobileContainer.innerHTML = '<div class="empty-state"><p>No records found</p></div>';
        } else {
            tableBody.parentElement.parentElement.style.display = 'block';
            mobileContainer.style.display = 'none';
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No records found</td></tr>';
        }
        return;
    }
    
    if (isMobile) {
        // Hide desktop table and show mobile cards
        tableBody.parentElement.parentElement.style.display = 'none';
        mobileContainer.style.display = 'block';
        
        let html = '';
        filteredRecords.forEach(entry => {
            // Create status badge
            let statusBadge = '';
            if (entry.status === 'returned') {
                statusBadge = '<span class="badge badge-returned">Returned</span>';
            } else if (entry.status === 'overdue') {
                statusBadge = '<span class="badge badge-overdue">Overdue</span>';
            } else if (entry.status === 'partial') {
                statusBadge = '<span class="badge badge-partial">Partial Return</span>';
            } else {
                statusBadge = '<span class="badge badge-pending">On loan</span>';
            }
            
            // Format items with quantities and returned amounts
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            // Create action button
            let actionButton = '';
            if (entry.status !== 'returned') {
                actionButton = `<button class="btn btn-success btn-sm w-100" onclick="showReturnModal(${entry.id})">
                                    <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                                </button>`;
            } else {
                actionButton = `<span class="text-muted">
                                    Returned on ${formatDate(entry.actualReturnDate)}
                                </span>`;
            }
            
            html += `
                <div class="mobile-card">
                    <div class="mobile-card-header">ID: ${entry.id} - ${entry.borrowerName}</div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Items:</div>
                        <div class="mobile-card-value">${itemsText}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Purpose:</div>
                        <div class="mobile-card-value">${entry.purpose}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Borrow Date:</div>
                        <div class="mobile-card-value">${formatDate(entry.borrowDate)}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Return Date:</div>
                        <div class="mobile-card-value">${formatDate(entry.returnDate)}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Status:</div>
                        <div class="mobile-card-value">${statusBadge}</div>
                    </div>
                    <div class="mobile-card-row">
                        <div class="mobile-card-label">Action:</div>
                        <div class="mobile-card-value">${actionButton}</div>
                    </div>
                </div>
            `;
        });
        
        mobileContainer.innerHTML = html;
    } else {
        // Show desktop table and hide mobile cards
        tableBody.parentElement.parentElement.style.display = 'block';
        mobileContainer.style.display = 'none';
        
        let html = '';
        
        filteredRecords.forEach(entry => {
            const borrowDate = new Date(entry.borrowDate);
            const returnDate = new Date(entry.returnDate);
            const actualReturnDate = entry.actualReturnDate ? new Date(entry.actualReturnDate) : null;
            
            // Create status badge
            let statusBadge = '';
            if (entry.status === 'returned') {
                statusBadge = '<span class="badge badge-returned">Returned</span>';
            } else if (entry.status === 'overdue') {
                statusBadge = '<span class="badge badge-overdue">Overdue</span>';
            } else if (entry.status === 'partial') {
                statusBadge = '<span class="badge badge-partial">Partial Return</span>';
            } else {
                statusBadge = '<span class="badge badge-pending">On loan</span>';
            }
            
            // Format items with quantities and returned amounts
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            // Create action button
            let actionButton = '';
            if (entry.status !== 'returned') {
                actionButton = `<button class="btn btn-success btn-sm" onclick="showReturnModal(${entry.id})">
                                    <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                                </button>`;
            } else {
                actionButton = `<span class="text-muted">
                                    Returned on ${formatDate(entry.actualReturnDate)}
                                </span>`;
            }
            
            html += `
                <tr>
                    <td>${entry.id}</td>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${entry.purpose}</td>
                    <td>${formatDate(entry.borrowDate)}</td>
                    <td>${formatDate(entry.returnDate)}</td>
                    <td>${statusBadge}</td>
                    <td>${actionButton}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }
}

// Status section functions
function showStatusTab(status) {
    // Hide all status content
    document.querySelectorAll('.status-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected content
    document.getElementById(status + 'Items').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

function updateStatusCounts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    
    let pendingCount = 0;
    let overdueCount = 0;
    let partialCount = 0;
    let returnedCount = 0;
    
    borrowingLog.forEach(entry => {
        if (entry.status === 'returned') {
            returnedCount++;
        } else if (entry.status === 'partial') {
            partialCount++;
        } else {
            const returnDate = new Date(entry.returnDate);
            returnDate.setHours(0, 0, 0, 0); // Set to midnight for comparison
            
            if (today > returnDate) {
                overdueCount++;
            } else {
                pendingCount++;
            }
        }
    });
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('overdueCount').textContent = overdueCount;
    document.getElementById('partialCount').textContent = partialCount;
    document.getElementById('returnedCount').textContent = returnedCount;
}

function updateStatusLists() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    
    // Update pending items
    const pendingList = document.getElementById('pendingItemsList');
    const pendingItems = borrowingLog.filter(entry => {
        if (entry.status === 'returned' || entry.status === 'partial') return false;
        
        const returnDate = new Date(entry.returnDate);
        returnDate.setHours(0, 0, 0, 0); // Set to midnight for comparison
        
        return today <= returnDate;
    }).sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));
    
    if (pendingItems.length === 0) {
        pendingList.innerHTML = '<p class="text-muted">No items on loan</p>';
    } else {
        let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Borrower</th><th>Items</th><th>Due Date</th><th>Action</th></tr></thead><tbody>';
        pendingItems.forEach(entry => {
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            html += `
                <tr>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${formatDate(entry.returnDate)}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="showReturnModal(${entry.id})">
                            <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                        </button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        pendingList.innerHTML = html;
    }
    
    // Update overdue items
    const overdueList = document.getElementById('overdueItemsList');
    const overdueItems = borrowingLog.filter(entry => {
        if (entry.status === 'returned' || entry.status === 'partial') return false;
        
        const returnDate = new Date(entry.returnDate);
        returnDate.setHours(0, 0, 0, 0); // Set to midnight for comparison
        
        return today > returnDate;
    }).sort((a, b) => new Date(a.returnDate) - new Date(b.returnDate));
    
    if (overdueItems.length === 0) {
        overdueList.innerHTML = '<p class="text-muted">No overdue items</p>';
    } else {
        let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Borrower</th><th>Items</th><th>Due Date</th><th>Days Overdue</th><th>Action</th></tr></thead><tbody>';
        overdueItems.forEach(entry => {
            const returnDate = new Date(entry.returnDate);
            returnDate.setHours(0, 0, 0, 0); // Set to midnight for comparison
            
            const daysOverdue = Math.floor((today - returnDate) / (1000 * 60 * 60 * 24));
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            html += `
                <tr>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${formatDate(entry.returnDate)}</td>
                    <td><span class="badge bg-danger">${daysOverdue} days</span></td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="showReturnModal(${entry.id})">
                            <i class="bi bi-box-arrow-in-left me-1"></i>Return Items
                        </button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        overdueList.innerHTML = html;
    }
    
    // Update partial return items
    const partialList = document.getElementById('partialItemsList');
    const partialItems = borrowingLog.filter(entry => entry.status === 'partial')
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
    
    if (partialItems.length === 0) {
        partialList.innerHTML = '<p class="text-muted">No partial returns</p>';
    } else {
        let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Borrower</th><th>Items</th><th>Borrow Date</th><th>Action</th></tr></thead><tbody>';
        partialItems.forEach(entry => {
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            html += `
                <tr>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${formatDate(entry.borrowDate)}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="showReturnModal(${entry.id})">
                            <i class="bi bi-box-arrow-in-left me-1"></i>Return More
                        </button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        partialList.innerHTML = html;
    }
    
    // Update returned items
    const returnedList = document.getElementById('returnedItemsList');
    const returnedItems = borrowingLog.filter(entry => entry.status === 'returned')
        .sort((a, b) => new Date(b.actualReturnDate) - new Date(a.actualReturnDate))
        .slice(0, 10); // Show last 10 returned items
    
    if (returnedItems.length === 0) {
        returnedList.innerHTML = '<p class="text-muted">No returned items</p>';
    } else {
        let html = '<div class="table-responsive"><table class="table"><thead><tr><th>Borrower</th><th>Items</th><th>Borrow Date</th><th>Return Date</th></tr></thead><tbody>';
        returnedItems.forEach(entry => {
            const itemsText = entry.items.map(item => {
                const returnedText = item.returned > 0 ? ` (${item.returned}/${item.quantity} returned)` : '';
                return `${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}${returnedText}`;
            }).join(', ');
            
            html += `
                <tr>
                    <td>${entry.borrowerName}</td>
                    <td>${itemsText}</td>
                    <td>${formatDate(entry.borrowDate)}</td>
                    <td>${formatDate(entry.actualReturnDate)}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        returnedList.innerHTML = html;
    }
}

// Search functionality
document.getElementById('recordsSearch').addEventListener('input', updateRecordsTable);

// Update connection status
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (isConnected) {
        statusElement.className = 'connection-status connected';
        statusElement.innerHTML = '<i class="bi bi-wifi"></i><span>Connected to Firebase</span>';
    } else {
        statusElement.className = 'connection-status disconnected';
        statusElement.innerHTML = '<i class="bi bi-wifi-off"></i><span>Disconnected</span>';
    }
}

// Show toast notification
function showToast(type, title, message) {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi ${iconClass}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase when page loads
    initializeFirebase();
    
    // Check if mobile view on load
    updateRecentBorrowingTable();
    updateRecordsTable();
    
    // Add resize event listener to handle orientation changes
    window.addEventListener('resize', function() {
        updateRecentBorrowingTable();
        updateRecordsTable();
    });
});
