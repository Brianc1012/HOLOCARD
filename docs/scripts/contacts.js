// Contacts page functionality
console.log('[contacts.js] Contacts script loaded');

// Global variables
let currentContacts = [];
let contactToDelete = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[contacts.js] DOMContentLoaded - initializing contacts page');
    checkSession();
    loadContacts();
});

// Check if user is logged in
async function checkSession() {
    try {
        const response = await fetch('../api/session_test.php', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!result.logged_in) {
            console.log('[contacts.js] User not logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('[contacts.js] Session valid for user:', result.username);
    } catch (error) {
        console.error('[contacts.js] Session check failed:', error);
        window.location.href = 'login.html';
    }
}

// Load user's contacts
async function loadContacts() {
    const loadingContainer = document.getElementById('loadingContainer');
    const emptyState = document.getElementById('emptyState');
    const contactsList = document.getElementById('contactsList');
    
    try {
        // Use correct API path based on current location
        const currentPath = window.location.pathname;
        let apiPath;
        if (currentPath.includes('/menuPage.html')) {
            apiPath = '../api/get_contacts.php';
        } else {
            apiPath = 'api/get_contacts.php';
        }
        
        const response = await fetch(apiPath, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        // Hide loading
        loadingContainer.style.display = 'none';
        
        if (result.success && result.contacts && result.contacts.length > 0) {
            currentContacts = result.contacts;
            renderContacts(result.contacts);
            contactsList.style.display = 'grid';
        } else {
            emptyState.style.display = 'block';
        }
        
    } catch (error) {
        console.error('[contacts.js] Failed to load contacts:', error);
        loadingContainer.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// Render contacts list
function renderContacts(contacts) {
    const contactsList = document.getElementById('contactsList');
    contactsList.innerHTML = '';
    
    contacts.forEach(contact => {
        const contactCard = createContactCard(contact);
        contactsList.appendChild(contactCard);
    });
}

// Create individual contact card
function createContactCard(contact) {
    const card = document.createElement('div');
    card.className = 'contact-card';
    
    // Determine card type and name
    let cardType = 'Personal';
    let displayName = 'Unknown';
    
    if (contact.CardType === 0 || contact.CardType === '0') {
        // Personal card
        cardType = 'Personal';
        if (contact.FirstName || contact.LastName) {
            displayName = `${contact.FirstName || ''} ${contact.LastName || ''}`.trim();
        }
    } else {
        // Corporate card
        cardType = 'Corporate';
        if (contact.CompanyName) {
            displayName = contact.CompanyName;
        } else if (contact.ContactPerson_FirstName || contact.ContactPerson_LastName) {
            displayName = `${contact.ContactPerson_FirstName || ''} ${contact.ContactPerson_LastName || ''}`.trim();
        }
    }
    
    card.innerHTML = `
        <div class="contact-header">
            <span class="contact-type ${cardType.toLowerCase()}">${cardType}</span>
            <button class="delete-btn" onclick="showDeleteModal(${contact.ContactID})">
                <span>🗑️</span>
                Delete
            </button>
        </div>
        
        <div class="contact-name">${displayName}</div>
        
        <div class="contact-details">
            ${contact.ContactNo ? `
                <div class="contact-detail">
                    <span class="detail-icon">📞</span>
                    <span class="detail-value">${contact.ContactNo}</span>
                </div>
            ` : ''}
            
            ${contact.Email ? `
                <div class="contact-detail">
                    <span class="detail-icon">📧</span>
                    <span class="detail-value">${contact.Email}</span>
                </div>
            ` : ''}
            
            ${contact.Address ? `
                <div class="contact-detail">
                    <span class="detail-icon">📍</span>
                    <span class="detail-value">${contact.Address}</span>
                </div>
            ` : ''}
            
            ${contact.Position ? `
                <div class="contact-detail">
                    <span class="detail-icon">💼</span>
                    <span class="detail-value">${contact.Position}</span>
                </div>
            ` : ''}
            
            ${contact.Profession ? `
                <div class="contact-detail">
                    <span class="detail-icon">💼</span>
                    <span class="detail-value">${contact.Profession}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// Show delete confirmation modal
function showDeleteModal(contactId) {
    const contact = currentContacts.find(c => c.ContactID == contactId);
    if (!contact) {
        console.error('[contacts.js] Contact not found for deletion:', contactId);
        return;
    }
    
    contactToDelete = contact;
    
    // Determine display name for preview
    let displayName = 'Unknown Contact';
    if (contact.CardType === 0 || contact.CardType === '0') {
        if (contact.FirstName || contact.LastName) {
            displayName = `${contact.FirstName || ''} ${contact.LastName || ''}`.trim();
        }
    } else {
        if (contact.CompanyName) {
            displayName = contact.CompanyName;
        } else if (contact.ContactPerson_FirstName || contact.ContactPerson_LastName) {
            displayName = `${contact.ContactPerson_FirstName || ''} ${contact.ContactPerson_LastName || ''}`.trim();
        }
    }
    
    // Update preview
    const deletePreview = document.getElementById('deletePreview');
    deletePreview.innerHTML = `
        <div class="contact-name" style="font-size: 18px; margin-bottom: 10px;">${displayName}</div>
        <div class="contact-details">
            ${contact.ContactNo ? `
                <div class="contact-detail">
                    <span class="detail-icon">📞</span>
                    <span class="detail-value">${contact.ContactNo}</span>
                </div>
            ` : ''}
            ${contact.Email ? `
                <div class="contact-detail">
                    <span class="detail-icon">📧</span>
                    <span class="detail-value">${contact.Email}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    // Set up delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    confirmDeleteBtn.onclick = () => deleteContact(contactId);
    
    // Show modal
    document.getElementById('deleteModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    contactToDelete = null;
}

// Delete contact
async function deleteContact(contactId) {
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Set loading state
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';
    
    try {
        // Use correct API path based on current location
        const currentPath = window.location.pathname;
        let apiPath;
        if (currentPath.includes('/menuPage.html')) {
            apiPath = '../api/delete_contact.php';
        } else {
            apiPath = 'api/delete_contact.php';
        }
        
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                contactId: contactId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Close modal
            closeDeleteModal();
            
            // Remove contact from current list
            currentContacts = currentContacts.filter(c => c.ContactID != contactId);
            
            // Re-render contacts
            if (currentContacts.length > 0) {
                renderContacts(currentContacts);
            } else {
                // Show empty state
                document.getElementById('contactsList').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
            }
            
            // Show success message (you could implement a toast notification here)
            console.log('[contacts.js] Contact deleted successfully');
            
        } else {
            alert(result.error || 'Failed to delete contact');
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete';
        }
        
    } catch (error) {
        console.error('[contacts.js] Failed to delete contact:', error);
        alert('Error deleting contact. Please try again.');
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeDeleteModal();
    }
});
