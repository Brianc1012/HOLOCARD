/* =========================================================================
   addCard.js   –   logic inside the Add-Card modal
   =========================================================================*/
(function initAddCardModal() {
  const modal     = document.querySelector(".modal-overlay");
  const form      = modal?.querySelector("#addCardForm");
  const catSel    = modal?.querySelector("#cardCategory");
  const cancelBtn = modal?.querySelector(".cancelButton");
  const upload    = modal?.querySelector("#photoUpload");
  const preview   = modal?.querySelector("#photoPreview");

  if (!modal || !form || !catSel) {
    console.error("❌ Add-Card modal missing critical elements"); return;
  }

  /* ---------- helpers ------------------------------------------------ */
  const clearForm = () => form.reset();

  const personalInputs  = modal.querySelectorAll(
    ".personalDetails input, .personalDetails textarea, .personalDetails select"
  );
  const corporateInputs = modal.querySelectorAll(
    ".corporateDetails input, .corporateDetails textarea, .corporateDetails select"
  );

  function updateVisibility(isPersonal) {
    modal.querySelector(".personalDetails").style.display  = isPersonal ? "block" : "none";
    modal.querySelector(".corporateDetails").style.display = isPersonal ? "none"  : "block";

    personalInputs.forEach(el  => el.required =  isPersonal && el.dataset.required !== undefined);
    corporateInputs.forEach(el => el.required = !isPersonal && el.dataset.required !== undefined);
  }

  /* ---------- initial state ------------------------------------------ */
  catSel.value = "Personal";
  updateVisibility(true);

  /* ---------- events ------------------------------------------------- */
  catSel.addEventListener("change", e => {
    clearForm();
    updateVisibility(e.target.value === "Personal");
  });

  cancelBtn?.addEventListener("click", () => {
    clearForm();
    modal.classList.remove("active");
  });

  upload?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ---------- SUBMIT → Swal → injected generated modal -------------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();    // collect data before SweetAlert closes the form
    const isPersonal = catSel.value === "Personal";
    const data = {
      cardType        : catSel.value, // Personal | Corporate
      company         : form.querySelector("#company")?.value || "",
      companyName     : form.querySelector("#company")?.value || "", // For API compatibility
      firstName       : form.querySelector(isPersonal ? "#FName"  : "#CFName")?.value || "",
      lastName        : form.querySelector(isPersonal ? "#Lname"  : "#CLname")?.value || "",
      middleName      : form.querySelector(isPersonal ? "#Mname"  : "#CMname")?.value || "",
      suffix          : form.querySelector(isPersonal ? "#nameSuffix"  : "#CnameSuffix")?.value || "",
      birthDate       : form.querySelector("#birthDate")?.value || "",
      email           : form.querySelector(isPersonal ? "#email" : "#companyEmail")?.value || "",
      contactNo       : form.querySelector(isPersonal ? "#contact" : "#companyContact")?.value || "",
      address         : form.querySelector("#address")?.value || "",
      cardName        : ((isPersonal ? form.querySelector("#FName")?.value : form.querySelector("#company")?.value) || "undefined") + "'s Card",
      uid             : localStorage.getItem('uid') || 1, // TODO: Use real user ID from auth
      qrCode          : '', // Will be set below
      // Add proper email fields for modal mapping
      personalEmail   : isPersonal ? form.querySelector("#email")?.value || "" : "",
      companyEmail    : !isPersonal ? form.querySelector("#companyEmail")?.value || "" : "",
      // Add corporate contact person fields for API
      contactFirstName: !isPersonal ? form.querySelector("#CFName")?.value || "" : "",
      contactLastName : !isPersonal ? form.querySelector("#CLname")?.value || "" : "",
      contactSuffix   : !isPersonal ? form.querySelector("#CnameSuffix")?.value || "" : ""
    };

    // Generate QR code data as base64 for backend
    data.qrCode = btoa(JSON.stringify(data));

    // Read profile picture or company logo as base64
    const fileInput = upload;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      // Await file read as base64
      const base64 = await new Promise(resolve => {
        reader.onload = ev => resolve(ev.target.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      if (isPersonal) {
        data.profilePicture = base64;
      } else {
        data.companyLogo = base64;
      }
    }

    // Show confirmation modal with submitted data
    let html = `<ul style='text-align:left;'>`;
    Object.entries(data).forEach(([k, v]) => {
      // Exclude UID, qrCode, profilePicture, companyLogo from confirmation
      if (["uid", "qrCode", "profilePicture", "companyLogo"].includes(k)) return;
      html += `<li><b>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}:</b> ${v || '-'} </li>`;
    });
    html += `</ul>`;

    const result = await Swal.fire({
      title: "Confirm Card Details",
      html,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Confirm & Save",
      cancelButtonText: "Edit",
      allowOutsideClick: false,
      allowEscapeKey: false
    });
    if (!result.isConfirmed) return;    // POST to API
    try {
      const res = await fetch('../api/add_card.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const apiResult = await res.json();
      if (!apiResult.success) throw new Error(apiResult.error || 'Failed to add card');
      
      console.log('✅ Card added successfully, API result:', apiResult);
        // Success: close modal, refresh card list, then show the viewCard modal
      modal.classList.remove("active");
      if (window.refreshCardList) window.refreshCardList();
      
      // Use the actual card ID returned from the database
      const actualCardId = apiResult.holocardId;
      console.log('🔍 Using actual card ID from database:', actualCardId);
      
      // Show success message first
      await Swal.fire({
        icon: 'success',
        title: 'Card Added Successfully!',
        text: 'Your new card has been created.',
        showConfirmButton: true,
        confirmButtonText: 'View Card',
        timer: 3000,
        timerProgressBar: true
      });
        // Show the viewCard modal with the newly created card data
      await showViewCardModal(data, actualCardId);
      
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      return;
    }
  });

  // Function to show the viewCard modal with the newly created card data
  async function showViewCardModal(formData, holocardId) {
    console.log('🔍 Showing viewCard modal with ID:', holocardId);
    
    try {
      // Fetch the viewCard modal
      const response = await fetch("../modals/viewCard.html");
      const html = await response.text();
      
      // Create modal container and inject directly into DOM
      const modalContainer = document.getElementById('modalContainer') || document.body;
      modalContainer.innerHTML = html;
      
      const viewModal = modalContainer.querySelector(".modal-overlay");
      if (!viewModal) throw new Error("modal-overlay missing in viewCard.html");
      
      // Create card data structure with the actual database ID for the viewCard modal
      const cardData = {
        HoloCardID: holocardId, // Use the actual ID from database
        CardName: formData.cardName,
        CardTypeText: formData.cardType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        suffix: formData.suffix,
        Email: formData.email,
        ContactNo: formData.contactNo,
        Address: formData.address,
        BirthDate: formData.birthDate,
        CompanyName: formData.company,
        CompanyEmail: formData.cardType !== 'Personal' ? formData.email : ''
      };

      console.log('📋 ViewCard data structure:', cardData);

      // Show the modal
      viewModal.classList.add("active");

      // Wait for modal to be visible, then initialize it using the global viewCard functions
      setTimeout(() => {
        // Define global functions if they don't exist (similar to how it's done in holocard.js)
        if (!window.closeViewModal) {
          window.closeViewModal = function() {
            const modal = document.querySelector('.modal-overlay');
            if (modal) {
              modal.classList.remove('active');
              setTimeout(() => {
                const modalContainer = document.getElementById('modalContainer');
                if (modalContainer) modalContainer.innerHTML = '';
              }, 300);
            }
          };
        }

        if (!window.populateViewCard) {
          window.populateViewCard = function(cardData) {
            console.log('📋 Populating view card with data:', cardData);
            
            const isPersonal = cardData.CardTypeText === 'Personal';
            
            // Update badge
            const badge = document.getElementById('cardTypeBadge');
            if (badge) {
              badge.textContent = (cardData.CardTypeText || 'Unknown') + ' Card';
            }

            // Helper function to set field value
            const setField = (id, value) => {
              const element = document.getElementById(id);
              if (element) {
                element.textContent = value || '—';
              }
            };

            // Populate fields based on card type
            setField('detailName', cardData.CardName);
            setField('detailEmail', cardData.Email);
            setField('detailContact', cardData.ContactNo);
            setField('detailAddress', cardData.Address);            // Generate simple QR code with just the card ID for easy scanning
            const qrContainer = document.getElementById('qrContainer');
            if (qrContainer && window.QRCode) {
              try {
                qrContainer.innerHTML = ''; // Clear existing content
                // Simple card ID for fastest scanning
                new QRCode(qrContainer, {
                  text: cardData.HoloCardID.toString(),
                  width: 150,
                  height: 150,
                  correctLevel: QRCode.CorrectLevel.M, // Medium correction for simple data
                  margin: 3 // Better margin for scanning
                });
                console.log('✅ Simple QR Code generated with ID:', cardData.HoloCardID);
              } catch (error) {
                console.error('QR generation failed:', error);
                qrContainer.innerHTML = `<div style="color: #999;">QR Code Generation Failed</div>`;
              }
            } else if (qrContainer) {
              qrContainer.innerHTML = `<div style="color: #999;">Card ID: ${cardData.HoloCardID}</div>`;
            }
          };
        }

        // Now populate the card with the new data
        console.log('✅ ViewCard functions defined, populating card...');
        window.populateViewCard(cardData);
        console.log('✅ ViewCard populated successfully with new card data');
        
      }, 100);

    } catch (error) {
      console.error('❌ Error showing viewCard modal:', error);
      Swal.fire('Error', 'Failed to show card details: ' + error.message, 'error');
    }
  }
})();
