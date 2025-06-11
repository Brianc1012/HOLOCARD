/* =========================================================================
   holocard.js   –   page that lists cards & opens Add-Card modal
   =========================================================================*/
console.log("🚀 holocard.js started");

// Test function availability
window.testFunctions = function() {
  console.log('🧪 Testing functions...');
  console.log('openAddModal available:', typeof window.openAddModal);
  console.log('refreshCardList available:', typeof window.refreshCardList);
  
  // Test add modal
  if (typeof window.openAddModal === 'function') {
    console.log('✅ openAddModal is available');
  } else {
    console.error('❌ openAddModal is NOT available');
  }
};

// Warn if loaded via file:// instead of http(s)://
if (location.protocol === 'file:') {
  alert('ERROR: You must run this page from a web server (http://localhost/...), not open it directly as a file.');
  console.error('Page loaded with file:// protocol. Please use http://localhost/... via XAMPP or similar.');
}

/* ------------------------------------------------------------------ */
/* 2.  openAddModal() – fetch /modals/addCard.html and show it         */
/* ------------------------------------------------------------------ */
function openAddModal() {
  console.log('🔧 openAddModal() called');
  const host = document.getElementById("modalContainer");
  const existing = document.querySelector(".modal-overlay");
  if (existing) {
    console.log('✅ Modal already exists, showing it');
    return existing.classList.add("active"); // already loaded
  }

  console.log("📡 Fetching addCard.html…");
  fetch("../modals/addCard.html")
    .then((res) => {
      if (!res.ok) throw new Error("addCard.html fetch failed");
      return res.text();
    })
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const modal = doc.querySelector(".modal-overlay");
      if (!modal) throw new Error(".modal-overlay missing in addCard.html");

      host.innerHTML = "";            // clear any prior content
      host.appendChild(modal);        // inject
      modal.classList.add("active");  // show

      /* Dynamically load its script AFTER it exists in DOM */
      const s = document.createElement("script");
      s.src = "../scripts/addCard.js";
      s.onload = () => console.log("✅ addCard.js loaded");
      s.onerror = (err) => console.error("❌ Failed to load addCard.js", err);
      document.body.appendChild(s);
    })
    .catch((err) => {
      console.error("❌ Add-Card modal error:", err);
      alert("Failed to load Add Card modal: " + err.message);
    });
}

window.openAddModal = openAddModal;

/* ------------------------------------------------------------------ */
/* 3. Robust Add Card button binding (handles dynamic DOM changes)   */
/* ------------------------------------------------------------------ */
function bindAddCardBtn() {
  const btn = document.getElementById("addCardBtn");
  if (btn) {
    btn.removeEventListener("click", window.openAddModal);
    btn.addEventListener("click", window.openAddModal);
  }
}

// Initial bind
bindAddCardBtn();

// Observe DOM for Add Card button changes
const observer = new MutationObserver(() => {
  bindAddCardBtn();
});
observer.observe(document.body, { childList: true, subtree: true });

// Fetch and render cards from API
async function refreshCardList() {
  const list = document.getElementById("holocardList");
  if (!list) return console.error("❌ #holocardList not found");
  list.innerHTML = '<div class="loading">Loading cards...</div>';
  
  // TODO: Replace with real user ID from auth
  const uid = localStorage.getItem('uid') || 1;
  console.log('🔍 Fetching cards for UID:', uid);
  
  try {
    const res = await fetch(`../api/get_cards.php?uid=${uid}`);
    console.log('📡 API Response status:', res.status, res.statusText);
    const text = await res.text();
    console.log('📡 Raw API response:', text);
    
    // Try to parse as JSON, but if it looks like HTML, show a clear error
    if (text.trim().startsWith('<')) {
      throw new Error('API returned HTML instead of JSON. This usually means the file path is wrong or the server is not running.');
    }
    const data = JSON.parse(text);
    console.log('📡 Parsed API data:', data);
    
    if (!data.success) throw new Error(data.error || 'Failed to fetch cards');
    list.innerHTML = '';
    if (!data.cards.length) {
      list.innerHTML = '<div class="empty">No cards found.</div>';
      return;
    }    data.cards.forEach(card => {
      list.insertAdjacentHTML(
        'beforeend',
        `<div class="card" data-id="${card.HoloCardID}"
             data-card-name="${card.CardName || ''}"
             data-card-type="${card.CardTypeText || ''}"
             data-first-name="${card.FirstName || ''}"
             data-last-name="${card.LastName || ''}"
             data-middle-name="${card.MiddleName || ''}"
             data-suffix="${card.Suffix || ''}"
             data-email="${card.Email || ''}"
             data-contact="${card.ContactNo || ''}"
             data-address="${card.Address || ''}"
             data-birth-date="${card.BirthDate || ''}"
             data-company-name="${card.CompanyName || ''}"
             data-company-email="${card.CompanyEmail || ''}"
             data-company-contact="${card.CompanyContact || ''}">
          <div class="card-header">
            <h5 class="card-title">${card.CardName || '-'} </h5>
            <p class="card-type">Type: <span class="type-label">${card.CardTypeText || '-'} </span></p>
          </div>
          <div class="card-actions">
            <button class="editBtn"   title="Edit" data-id="${card.HoloCardID}"><i class="ri-pencil-fill"></i></button>
            <button class="deleteBtn" title="Delete" data-id="${card.HoloCardID}"><i class="ri-delete-bin-2-fill"></i></button>
          </div>
        </div>`
      );
    });    // Add click listeners to cards to view them
    document.querySelectorAll('.card').forEach(cardEl => {
      cardEl.addEventListener('click', async function(e) {
        // Don't open if clicking on edit/delete buttons
        if (e.target.closest('.editBtn') || e.target.closest('.deleteBtn')) return;
        
        const cardId = this.getAttribute('data-id');        const cardData = {
          HoloCardID: cardId,
          CardName: this.getAttribute('data-card-name'),
          CardTypeText: this.getAttribute('data-card-type'),
          FirstName: this.getAttribute('data-first-name'),
          LastName: this.getAttribute('data-last-name'),
          MiddleName: this.getAttribute('data-middle-name'),
          Suffix: this.getAttribute('data-suffix'),
          Email: this.getAttribute('data-email'),
          ContactNo: this.getAttribute('data-contact'),
          Address: this.getAttribute('data-address'),
          BirthDate: this.getAttribute('data-birth-date'),
          CompanyName: this.getAttribute('data-company-name'),
          CompanyEmail: this.getAttribute('data-company-email'),
          CompanyContact: this.getAttribute('data-company-contact')
        };
        
        console.log('📋 Card data extracted:', cardData);
        console.log('📋 Card element attributes:', this.getAttributeNames());
        
        // Use the enhanced ViewCard modal function
        await window.openViewCardModal(cardData);
      });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const cardId = this.getAttribute('data-id');
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: 'This will remove the card from your list. You can restore it later.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'Cancel',
        });
        if (result.isConfirmed) {
          try {
            const res = await fetch(`../api/delete_card.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: cardId })
            });
            const apiResult = await res.json();
            if (!apiResult.success) throw new Error(apiResult.error || 'Failed to delete card');
            Swal.fire('Deleted!', 'The card has been removed.', 'success');
            refreshCardList();
          } catch (err) {
            Swal.fire('Error', err.message, 'error');
          }
        }
      });
    });

    // Add event listeners for edit buttons
    document.querySelectorAll('.editBtn').forEach(btn => {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Edit button clicked');
        
        const cardId = this.getAttribute('data-id');
        const card = data.cards.find(c => c.HoloCardID == cardId);
        if (!card) return Swal.fire('Error', 'Card not found.', 'error');
        
        console.log('Card found:', card);
        
        try {
          const modalContainer = document.getElementById('modalContainer');
          const res = await fetch('../modals/editCard.html');
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const modal = doc.querySelector('.modal-overlay');
          if (!modal) return Swal.fire('Error', 'Edit modal not found.', 'error');
            modalContainer.innerHTML = '';
          modalContainer.appendChild(modal);
          modal.classList.add('active');
          
          console.log('Modal loaded and activated');
          console.log('Modal elements check:');
          console.log('- Form:', modal.querySelector('#editCardForm'));
          console.log('- Save button:', modal.querySelector('#editCardButton'));
          console.log('- Cancel button:', modal.querySelector('.cancelButton'));
          console.log('- Category select:', modal.querySelector('#editCardCategory'));
          
          // Set cardId for update
          modal.dataset.cardId = card.HoloCardID;
          
          // Populate fields
          const isPersonal = card.CardTypeText === 'Personal';
          modal.querySelector('#editCardCategory').value = isPersonal ? 'Personal' : 'Corporate';
          modal.querySelector('.personalDetails').style.display = isPersonal ? 'block' : 'none';
          modal.querySelector('.corporateDetails').style.display = isPersonal ? 'none' : 'block';
          
          // Personal fields
          if (modal.querySelector('#editFName')) modal.querySelector('#editFName').value = isPersonal ? (card.CardName?.split(' ')[0] || '') : '';
          if (modal.querySelector('#editLname')) modal.querySelector('#editLname').value = isPersonal ? (card.CardName?.split(' ')[1] || '') : '';
          if (modal.querySelector('#editEmail')) modal.querySelector('#editEmail').value = isPersonal ? (card.Email || '') : '';
          if (modal.querySelector('#editContact')) modal.querySelector('#editContact').value = isPersonal ? (card.ContactNo || '') : '';
          if (modal.querySelector('#editAddress')) modal.querySelector('#editAddress').value = card.Address || '';
          
          // Corporate fields
          if (modal.querySelector('#editCompany')) modal.querySelector('#editCompany').value = !isPersonal ? (card.CardName || '') : '';
          if (modal.querySelector('#editCompanyEmail')) modal.querySelector('#editCompanyEmail').value = !isPersonal ? (card.Email || '') : '';
          if (modal.querySelector('#editCompanyContact')) modal.querySelector('#editCompanyContact').value = !isPersonal ? (card.ContactNo || '') : '';
          
          // Toggle fields on card type change
          modal.querySelector('#editCardCategory').addEventListener('change', function(e) {
            const isPersonal = e.target.value === 'Personal';
            modal.querySelector('.personalDetails').style.display = isPersonal ? 'block' : 'none';
            modal.querySelector('.corporateDetails').style.display = isPersonal ? 'none' : 'block';
          });
          
          // Add cancel button event listener
          if (modal.querySelector('.cancelButton')) {
            modal.querySelector('.cancelButton').addEventListener('click', function() {
              modal.classList.remove('active');
              setTimeout(() => modal.remove(), 300);
            });
          }
            // Add form submit event listener
          console.log('Setting up form submit listener...');
          
          const editForm = modal.querySelector('#editCardForm');
          const saveButton = modal.querySelector('#editCardButton');
          
          if (editForm) {
            console.log('Edit form found, adding submit listener');
            editForm.addEventListener('submit', async function(e) {
              e.preventDefault();              console.log('Form submitted!');
              
              const isPersonal = modal.querySelector('#editCardCategory').value === 'Personal';
              console.log('Is Personal card:', isPersonal);
              
              const data = {
                cardType: modal.querySelector('#editCardCategory').value,
                company: modal.querySelector('#editCompany')?.value || '',
                firstName: modal.querySelector(isPersonal ? '#editFName' : '#editCFName')?.value || '',
                lastName: modal.querySelector(isPersonal ? '#editLname' : '#editCLname')?.value || '',
                middleName: modal.querySelector(isPersonal ? '#editMname' : '#editCMname')?.value || '',
                suffix: modal.querySelector(isPersonal ? '#editNameSuffix' : '#editCnameSuffix')?.value || '',
                birthDate: modal.querySelector('#editBirthDate')?.value || '',
                email: modal.querySelector(isPersonal ? '#editEmail' : '#editCompanyEmail')?.value || '',
                contactNo: modal.querySelector(isPersonal ? '#editContact' : '#editCompanyContact')?.value || '',
                address: modal.querySelector('#editAddress')?.value || '',
                cardId: modal.dataset.cardId
              };
              
              console.log('Data to submit:', data);
              console.log('Card ID from modal dataset:', modal.dataset.cardId);
              
              // More detailed validation
              const requiredFields = [];
              if (!data.cardId) requiredFields.push('Card ID');
              if (!data.email) requiredFields.push('Email');
              if (!data.contactNo) requiredFields.push('Contact Number');
              if (isPersonal && !data.firstName) requiredFields.push('First Name');
              if (isPersonal && !data.lastName) requiredFields.push('Last Name');
              if (!isPersonal && !data.company) requiredFields.push('Company');
              
              if (requiredFields.length > 0) {
                Swal.fire('Error', `Please fill in the following required fields: ${requiredFields.join(', ')}`, 'error');
                return;
              }
              
              try {
                console.log('Sending update request...');
                const res = await fetch('../api/update_card.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                
                console.log('Response received:', res);
                const apiResult = await res.json();
                console.log('API result:', apiResult);
                
                if (!apiResult.success) throw new Error(apiResult.error || 'Failed to update card');
                Swal.fire('Success', 'Card updated successfully!', 'success');
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                refreshCardList();
              } catch (err) {
                console.error('Update error:', err);
                Swal.fire('Error', err.message, 'error');
              }
            });
          } else {
            console.error('Edit form not found!');
          }
            // Also add direct click listener to Save Changes button
          if (saveButton) {
            console.log('Save button found, adding click listener');
            saveButton.addEventListener('click', function(e) {
              console.log('Save button clicked directly');
              e.preventDefault(); // Prevent default button behavior
              // The form submission will handle the logic
              if (editForm) {
                console.log('Dispatching submit event to form');
                editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              } else {
                console.error('Form not found when save button clicked');
              }
            });
          } else {
            console.error('Save button not found!');
          }
        } catch (err) {
          console.error('Error loading edit modal:', err);
          Swal.fire('Error', 'Failed to load edit modal: ' + err.message, 'error');
        }
      });
    });
  } catch (e) {
    console.error('❌ Error fetching cards:', e);
    list.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎯 DOM Content Loaded - starting card refresh");
  refreshCardList();
});
window.refreshCardList = refreshCardList;

/* =========================================================================
   Global ViewCard Modal Functions - Enhanced Integration
   =========================================================================*/

// Global function to open ViewCard modal (can be called from anywhere)
window.openViewCardModal = async function(cardData) {
  console.log('🔍 Opening ViewCard modal for card:', cardData.HoloCardID);
  
  try {
    const modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) {
      throw new Error('Modal container not found');
    }
    
    // Close any existing modals
    const existingModal = document.querySelector('.modal-overlay.active');
    if (existingModal) {
      existingModal.classList.remove('active');
      setTimeout(() => modalContainer.innerHTML = '', 100);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const res = await fetch('../modals/viewCard.html');
    if (!res.ok) throw new Error('Failed to load ViewCard modal');
    
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const modal = doc.querySelector('.modal-overlay');
    if (!modal) throw new Error('Modal structure not found');
    
    modalContainer.innerHTML = '';
    modalContainer.appendChild(modal);
    
    // Add enhanced animations
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    modal.classList.add('active');
    
    // Smooth entrance animation
    requestAnimationFrame(() => {
      modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      modal.style.opacity = '1';
      modal.style.transform = 'scale(1)';    });    // Populate with enhanced error handling
    setTimeout(() => {
      try {
        console.log('🔍 Attempting to populate ViewCard with:', cardData);
        
        // Instead of executing modal scripts, define functions directly here
        console.log('📜 Defining ViewCard functions directly...');
        
        // Define the populateViewCard function
        window.populateViewCard = function(cardData) {
          console.log('📋 Populating view card with data:', cardData);
          
          // Update badge
          const badge = document.getElementById('cardTypeBadge');
          if (badge) {
            badge.textContent = (cardData.CardTypeText || 'Unknown') + ' Card';
          }

          // Set field values
          const setField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
              element.textContent = value || '—';
            }
          };
          
          setField('detailName', cardData.CardName);
          setField('detailEmail', cardData.Email);
          setField('detailContact', cardData.ContactNo);
          setField('detailAddress', cardData.Address);

          // Generate QR code using the global utility
          const qrContainer = document.getElementById('qrContainer');
          if (qrContainer && window.HoloCardQR) {
            console.log('🔍 Generating QR code for ViewCard...');
            window.HoloCardQR.generateHoloCardQR(qrContainer, cardData)
              .then(() => {
                console.log('✅ ViewCard QR Code generated successfully');
              })
              .catch((error) => {
                console.error('❌ ViewCard QR generation failed:', error);
                qrContainer.innerHTML = `
                  <div style="color: #dc3545; text-align: center; padding: 20px;">
                    QR Generation Failed<br>
                    <small>${error.message}</small>
                  </div>
                `;
              });
          }
        };
        
        // Define the closeViewModal function
        window.closeViewModal = function() {
          const modal = document.querySelector('.modal-overlay');
          if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
              const modalContainer = document.getElementById('modalContainer');
              if (modalContainer) {
                modalContainer.innerHTML = '';
              }
            }, 300);
          }
        };
        
        // Set up event listeners
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.onclick = window.closeViewModal;
        }
        
        // Handle escape key
        const handleEscape = function(e) {
          if (e.key === 'Escape') {
            window.closeViewModal();
            document.removeEventListener('keydown', handleEscape);
          }
        };
        document.addEventListener('keydown', handleEscape);

        // Handle click outside
        modal.addEventListener('click', function(e) {
          if (e.target === modal) {
            window.closeViewModal();
          }
        });
        
        // Now populate the card
        console.log('✅ ViewCard functions defined, populating card...');
        window.populateViewCard(cardData);
        console.log('✅ ViewCard populated successfully');
        
      } catch (error) {
        console.error('❌ Error during ViewCard initialization:', error);
        showViewCardError(modal, 'Failed to initialize card view: ' + error.message);
      }
    }, 200);
    
    console.log('✅ ViewCard modal opened successfully');
    
  } catch (error) {
    console.error('❌ ViewCard modal error:', error);
    if (window.Swal) {
      Swal.fire('Error', 'Failed to open card details: ' + error.message, 'error');
    } else {
      alert('Failed to open card details: ' + error.message);
    }
  }
};

// Enhanced data population with validation
function populateViewCardData(modal, cardData) {
  if (!cardData || !cardData.HoloCardID) {
    throw new Error('Invalid card data provided');
  }
  
  console.log('📋 Populating ViewCard with validated data:', cardData);
  
  const isPersonal = cardData.CardTypeText === 'Personal';
  
  // Update card type badge with animation
  const badge = modal.querySelector('#cardTypeBadge');
  if (badge) {
    badge.style.opacity = '0';
    badge.textContent = cardData.CardTypeText + ' Card';
    badge.className = `card-type-badge ${isPersonal ? 'card-type-personal' : 'card-type-corporate'}`;
    setTimeout(() => { badge.style.opacity = '1'; }, 200);
  }

  // Enhanced section switching with fade effect
  const personalSection = modal.querySelector('.personalDetails');
  const corporateSection = modal.querySelector('.corporateDetails');
  
  if (personalSection && corporateSection) {
    personalSection.style.opacity = '0';
    corporateSection.style.opacity = '0';
    
    setTimeout(() => {
      personalSection.style.display = isPersonal ? 'block' : 'none';
      corporateSection.style.display = isPersonal ? 'none' : 'block';
      
      const activeSection = isPersonal ? personalSection : corporateSection;
      activeSection.style.opacity = '1';
    }, 100);
  }

  // Enhanced field population with validation
  const setFieldWithValidation = (id, value, formatter = null) => {
    const element = modal.querySelector('#' + id);
    if (element) {
      let displayValue = value;
      
      // Apply formatting if provided
      if (formatter && value) {
        displayValue = formatter(value);
      }
      
      element.textContent = displayValue || '—';
      element.className = displayValue ? 'detail-value' : 'detail-value empty-field';
      
      // Add subtle entrance animation
      element.style.opacity = '0';
      setTimeout(() => { 
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '1'; 
      }, 150);
    }
  };

  // Format functions
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (isPersonal) {
    // Personal card fields with formatting
    setFieldWithValidation('detailFullName', cardData.CardName);
    setFieldWithValidation('detailEmail', cardData.Email);
    setFieldWithValidation('detailContact', cardData.ContactNo, formatPhone);
    setFieldWithValidation('detailBirthDate', cardData.BirthDate, formatDate);
    setFieldWithValidation('detailAddress', cardData.Address);
  } else {
    // Corporate card fields
    setFieldWithValidation('detailCompanyName', cardData.CardName);
    setFieldWithValidation('detailContactPerson', cardData.ContactPerson || 'Not specified');
    setFieldWithValidation('detailCompanyEmail', cardData.Email);
    setFieldWithValidation('detailCompanyContact', cardData.ContactNo, formatPhone);
    setFieldWithValidation('detailCompanyAddress', cardData.Address);
  }

  // Generate enhanced QR code with loading state
  generateEnhancedQRCode(modal, cardData);
  
  // Setup enhanced close handlers
  setupViewCardCloseHandlers(modal);
  
  // Setup action button handlers
  setupViewCardActionHandlers(modal, cardData);
}

// Enhanced QR code generation
function generateEnhancedQRCode(modal, cardData) {
  const qrContainer = modal.querySelector('#qrCodeContainer');
  if (!qrContainer) return;
  
  // Show loading state
  qrContainer.innerHTML = `
    <div class="qr-loading">
      <div class="loading-spinner"></div>
      <div>Generating AR-Ready QR Code...</div>
    </div>
  `;
  
  setTimeout(() => {
    try {
      // Enhanced AR data structure
      const arData = {
        type: "holocard-ar",
        version: "2.0",
        cardId: cardData.HoloCardID,
        profile: {
          name: cardData.CardName,
          cardType: cardData.CardTypeText,
          email: cardData.Email,
          contact: cardData.ContactNo,
          address: cardData.Address,
          birthDate: cardData.BirthDate
        },
        ar: {
          markerType: "qr",
          markerSize: 0.1,
          trackingMode: "stable",
          renderDistance: 2.0,
          effects: ["glow", "float", "rotate"],
          animations: ["entrance", "idle", "selection"]
        },
        metadata: {
          webUrl: `${window.location.origin}/holocard_nonext/pages/view-card.html?id=${cardData.HoloCardID}`,
          generated: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform
        }
      };

      qrContainer.innerHTML = '';
      
      // Check if qrcode library is available
      if (typeof qrcode !== 'undefined') {
        // Use qrcode-generator library
        const qr = qrcode(0, 'M');
        qr.addData(JSON.stringify(arData));
        qr.make();
        
        // Create QR code as image
        const qrImage = qr.createImgTag(4, 10);
        qrContainer.innerHTML = qrImage;
        
        // Style the image
        const img = qrContainer.querySelector('img');
        if (img) {
          img.style.width = '200px';
          img.style.height = '200px';
          img.style.border = '10px solid white';
          img.style.borderRadius = '8px';
          img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }
      } else {
        // Fallback: create a simple QR placeholder
        qrContainer.innerHTML = `
          <div style="width: 200px; height: 200px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; flex-direction: column; background: #f9f9f9;">
            <i class="ri-qr-code-line" style="font-size: 48px; color: #666; margin-bottom: 10px;"></i>
            <div style="color: #666; text-align: center;">QR Code<br>Ready for AR</div>
            <small style="color: #999; margin-top: 5px;">Card ID: ${cardData.HoloCardID}</small>
          </div>
        `;
      }

      console.log('✅ Enhanced QR code generated for card:', cardData.HoloCardID);
      
    } catch (error) {
      console.error('❌ QR generation failed:', error);
      qrContainer.innerHTML = `
        <div class="qr-error">
          <i class="ri-error-warning-line"></i>
          <div>Failed to generate QR code</div>
          <small>${error.message}</small>
          <button onclick="generateEnhancedQRCode(document.querySelector('.modal-overlay'), ${JSON.stringify(cardData).replace(/"/g, '&quot;')})" 
                  style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
  }, 500);
}

/**
 * Global QR Code Generation Utility
 * Ensures QR library is loaded and provides consistent QR generation
 */
window.HoloCardQR = {
  // Check if QR library is loaded
  isLibraryLoaded() {
    return typeof QRCode !== 'undefined';
  },

  // Load QR library dynamically if not available
  async ensureLibraryLoaded() {
    if (this.isLibraryLoaded()) {
      return true;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = () => {
        console.log('✅ QR library loaded dynamically');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load QR library');
        reject(false);
      };
      document.head.appendChild(script);
    });
  },

  // Generate QR code with HoloCard format
  async generateHoloCardQR(container, cardData) {
    try {
      // Ensure library is loaded
      await this.ensureLibraryLoaded();

      if (!container) {
        throw new Error('Container element not found');
      }

      // Clear existing content
      container.innerHTML = '';

      // Create AR-ready data structure
      const arData = {
        type: "holocard-ar",
        version: "1.0",
        cardId: cardData.HoloCardID || cardData.id || Date.now(),
        profile: {
          name: cardData.CardName,
          cardType: cardData.CardTypeText || 'Personal',
          email: cardData.Email || '',
          contact: cardData.ContactNo || '',
          address: cardData.Address || '',
          birthDate: cardData.BirthDate || ''
        },
        ar: {
          markerType: "qr",
          markerSize: 0.1,
          trackingMode: "stable",
          renderDistance: 2.0
        },
        webUrl: `${window.location.origin}/holocard_nonext/pages/view-card.html?id=${cardData.HoloCardID}`,
        generated: new Date().toISOString()
      };

      // Generate QR code
      const qrInstance = new QRCode(container, {
        text: JSON.stringify(arData),
        width: 150,
        height: 150,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      console.log('✅ HoloCard QR Code generated successfully');
      return qrInstance;

    } catch (error) {
      console.error('❌ QR generation failed:', error);
      if (container) {
        container.innerHTML = `
          <div style="color: #dc3545; text-align: center; padding: 20px;">
            QR Generation Failed<br>
            <small>${error.message}</small>
          </div>
        `;
      }
      throw error;
    }
  }
};

// Enhanced close handlers
function setupViewCardCloseHandlers(modal) {
  const closeModal = () => {
    modal.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      modal.classList.remove('active');
      const modalContainer = document.getElementById('modalContainer');
      if (modalContainer) {
        modalContainer.innerHTML = '';
      }
    }, 300);
  };

  // Close button
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }

  // Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// Enhanced action button handlers
function setupViewCardActionHandlers(modal, cardData) {
  // Edit button
  const editBtn = modal.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      // Close current modal first
      modal.classList.remove('active');
      setTimeout(() => {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) modalContainer.innerHTML = '';
        
        // Trigger edit modal
        const editButton = document.querySelector(`[data-id="${cardData.HoloCardID}"].editBtn`);
        if (editButton) {
          editButton.click();
        }
      }, 300);
    });
  }

  // Download button
  const downloadBtn = modal.querySelector('.download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const canvas = modal.querySelector('#qrCodeContainer canvas');
      if (canvas) {
        try {
          const link = document.createElement('a');
          link.download = `holocard-qr-${cardData.HoloCardID}-${new Date().getTime()}.png`;
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          
          if (window.Swal) {
            Swal.fire('Success', 'QR code downloaded successfully!', 'success');
          }
        } catch (error) {
          console.error('Download failed:', error);
          if (window.Swal) {
            Swal.fire('Error', 'Failed to download QR code', 'error');
          }
        }
      }
    });
  }

  // Share button
  const shareBtn = modal.querySelector('.share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: `${cardData.CardName} - HoloCard`,
        text: `Check out my HoloCard: ${cardData.CardName}`,
        url: `${window.location.origin}/holocard_nonext/pages/view-card.html?id=${cardData.HoloCardID}`
      };

      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        try {
          await navigator.share(shareData);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
            fallbackShare(shareData.url);
          }
        }
      } else {
        fallbackShare(shareData.url);
      }
    });
  }
}

// Fallback share function
function fallbackShare(url) {
  navigator.clipboard.writeText(url).then(() => {
    if (window.Swal) {
      Swal.fire('Copied!', 'Share link copied to clipboard', 'success');
    } else {
      alert('Share link copied to clipboard');
    }
  }).catch(() => {
    // Manual copy fallback
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (window.Swal) {
      Swal.fire('Copied!', 'Share link copied to clipboard', 'success');
    } else {
      alert('Share link copied to clipboard');
    }
  });
}

// Error display function
function showViewCardError(modal, message) {
  const content = modal.querySelector('.view-card-content');
  if (content) {
    // Preserve the header, only replace the content area
    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #dc3545;">
        <i class="ri-error-warning-line" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h3>Error Loading Card</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; margin-top: 20px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
  
  // Ensure close button is visible and functional
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.style.display = 'flex';
    closeBtn.style.visibility = 'visible';
    closeBtn.onclick = function() {
      modal.classList.remove('active');
      setTimeout(() => {
        const modalContainer = document.getElementById('modalContainer');
        if (modalContainer) modalContainer.innerHTML = '';
      }, 300);
    };
  }
}

// Make functions globally available
window.populateViewCardData = populateViewCardData;
window.generateEnhancedQRCode = generateEnhancedQRCode;
window.setupViewCardCloseHandlers = setupViewCardCloseHandlers;
window.setupViewCardActionHandlers = setupViewCardActionHandlers;
