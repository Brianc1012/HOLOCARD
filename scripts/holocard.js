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
    }

    data.cards.forEach(card => {
      list.insertAdjacentHTML(
        'beforeend',
        `<div class="card" data-id="${card.HoloCardID}">
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
    });

    // Add click listeners to cards to view them
    document.querySelectorAll('.card').forEach(cardEl => {
      cardEl.addEventListener('click', async function(e) {
        // Don't open if clicking on edit/delete buttons
        if (e.target.closest('.editBtn') || e.target.closest('.deleteBtn')) return;
        
        const cardId = this.getAttribute('data-id');
        const card = data.cards.find(c => c.HoloCardID == cardId);
        if (!card) return;
        
        // Open cardGenerated modal
        const res = await fetch('../modals/cardGenerated.html');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const modal = doc.querySelector('.modal-overlay');
        if (!modal) return;
        
        const modalContainer = document.getElementById('modalContainer');
        modalContainer.innerHTML = '';
        modalContainer.appendChild(modal);
        modal.classList.add('active');
        
        // Populate the modal with card data
        const isPersonal = card.CardTypeText === 'Personal';
        modal.querySelector('.personalDetails').style.display = isPersonal ? 'block' : 'none';
        modal.querySelector('.corporateDetails').style.display = isPersonal ? 'none' : 'block';
        
        // Set the data
        const setField = (id, value) => {
          const el = modal.querySelector('#' + id);
          if (el) el.textContent = value || '—';
        };
        
        setField('detailCardName', card.CardName);
        setField('detailCardType', card.CardTypeText);
        setField('detailFirstName', card.CardName?.split(' ')[0] || '');
        setField('detailLastName', card.CardName?.split(' ')[1] || '');
        setField('detailEmail', card.Email);
        setField('detailContact', card.ContactNo);
        setField('detailAddress', card.Address);
        setField('detailBdate', card.BirthDate);
        
        // Generate QR code
        const qrContainer = modal.querySelector('.qr-placeholder');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          try {
            new QRCode(qrContainer, {
              text: JSON.stringify(card),
              width: 180,
              height: 180,
              correctLevel: QRCode.CorrectLevel.H
            });
          } catch(e) {
            console.error('QR generation failed:', e);
          }
        }
        
        // Ensure close button works
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.remove('active');
            setTimeout(() => {
              modalContainer.innerHTML = '';
            }, 300);
          });
        }
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
