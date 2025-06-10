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
    reader.onload = ev => (preview.src = ev.target.result);
    reader.readAsDataURL(file);
  });

  /* ---------- SUBMIT → Swal → injected generated modal -------------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();    // collect data before SweetAlert closes the form
    const isPersonal = catSel.value === "Personal";
    const data = {
      cardType        : catSel.value, // Personal | Corporate
      company         : form.querySelector("#company")?.value || "",
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
      companyEmail    : !isPersonal ? form.querySelector("#companyEmail")?.value || "" : ""
    };

    // Generate QR code data as base64 for backend
    data.qrCode = btoa(JSON.stringify(data));

    // Show confirmation modal with submitted data
    let html = `<ul style='text-align:left;'>`;
    Object.entries(data).forEach(([k, v]) => {
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
    if (!result.isConfirmed) return;

    // POST to API
    try {
      const res = await fetch('../api/add_card.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const apiResult = await res.json();
      if (!apiResult.success) throw new Error(apiResult.error || 'Failed to add card');
      // Success: close modal, show QR, refresh card list
      modal.classList.remove("active");
      if (window.refreshCardList) window.refreshCardList();
      // Optionally show QR modal here (existing logic)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      return;
    }

    // Close the addCard modal before opening the cardGenerated modal
    modal.classList.remove("active");    // Show the cardGenerated modal and QR code
    fetch("../modals/cardGenerated.html")
      .then(r => r.text())
      .then(async html => {
        // Create modal container and inject directly into DOM (not shadow DOM)
        const modalContainer = document.getElementById('modalContainer') || document.body;
        modalContainer.innerHTML = html;
        
        const genModal = modalContainer.querySelector(".modal-overlay");
        if (!genModal) throw new Error("modal-overlay missing in cardGenerated.html");
        
        // Create card data structure for the enhanced generator
        const cardData = {
          HoloCardID: Date.now(),
          CardName: data.cardName,
          CardTypeText: data.cardType,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          suffix: data.suffix,
          Email: data.email,
          ContactNo: data.contactNo,
          Address: data.address,
          BirthDate: data.birthDate,
          CompanyName: data.company,
          CompanyEmail: !isPersonal ? data.email : ''
        };

        // Show the modal
        genModal.classList.add("active");
          // Use the enhanced QR generator
        setTimeout(() => {
          if (typeof window.generateHoloCardQR === 'function') {
            window.generateHoloCardQR(cardData);
          } else {
            console.error('Enhanced QR generator not available');
          }
        }, 100);
      })
      .catch(err => console.error("❌ Card-Generated modal error:", err));
  });
})();
