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
    modal.classList.remove("active");

    // Show the cardGenerated modal and QR code
    fetch("../modals/cardGenerated.html")
      .then(r => r.text())
      .then(async html => {
        const doc      = new DOMParser().parseFromString(html, "text/html");
        const genModal = doc.querySelector(".modal-overlay");
        if (!genModal) throw new Error("modal-overlay missing in cardGenerated.html");
        const host   = document.createElement("div");
        const shadow = host.attachShadow({ mode: "open" });
        const css = await fetch("../styles/cardGenerated.css").then(r => r.text());
        const styleTag = document.createElement("style");
        styleTag.textContent = css;
        shadow.appendChild(styleTag);
        shadow.appendChild(genModal);        const map = {
          detailCardType     : data.cardType,
          detailCompany      : data.company,
          detailFirstName    : data.firstName,
          detailLastName     : data.lastName,
          detailMiddleName   : data.middleName,
          detailSuffix       : data.suffix,
          detailBdate        : data.birthDate,
          detailEmail        : isPersonal ? data.email : "—",
          detailCompanyEmail : !isPersonal ? data.email : "—",
          detailContact      : data.contactNo,
          detailAddress      : data.address,
          detailCardName     : data.cardName
        };
        Object.entries(map).forEach(([id, value]) => {
          const span = shadow.querySelector(`#${id}`);
          if (span) span.textContent = value || "—";
        });
        shadow.querySelector(".personalDetails").style.display  = isPersonal ? "block" : "none";
        shadow.querySelector(".corporateDetails").style.display = isPersonal ? "none"  : "block";
        // Remove any existing cardGenerated modals before opening a new one
        document.querySelectorAll('div[data-generated-modal]').forEach(m => m.remove());
        // Hide the addCard modal (ensure it's not visible)
        modal.classList.remove('active');
        host.dataset.generatedModal = "true";
        document.body.appendChild(host);
        requestAnimationFrame(() => genModal.classList.add("active"));        // Generate enhanced AR-ready QR code using the new system
        const qrContainer = shadow.querySelector('.qr-placeholder');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          
          // Load QR code library into shadow DOM
          const qrScript = document.createElement('script');
          qrScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
          qrScript.onload = () => {
            // Create enhanced AR data structure
            const arData = {
              type: "holocard-ar",
              version: "1.0",
              cardId: Date.now(), // Temporary ID until we get the real one from API
              profile: {
                name: data.cardName || `${data.firstName} ${data.lastName}`.trim(),
                cardType: data.cardType,
                email: data.email,
                contact: data.contactNo,
                address: data.address,
                birthDate: data.birthDate || ''
              },
              company: !isPersonal ? {
                name: data.company,
                email: data.email,
                contact: data.contactNo
              } : null,
              ar: {
                markerType: "qr",
                markerSize: 0.1,
                trackingMode: "stable",
                renderDistance: 2.0
              },
              webUrl: `${window.location.origin}/holocard_nonext/pages/view-card.html?temp=${Date.now()}`,
              generated: new Date().toISOString()
            };

            // Generate QR with enhanced AR data
            const qr = new QRCode(qrContainer, {
              text: JSON.stringify(arData),
              width: 200,
              height: 200,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.H,
              margin: 2
            });

            // Add AR corner markers for visual indication
            setTimeout(() => {
              const canvas = qrContainer.querySelector('canvas');
              if (canvas) {
                const container = canvas.parentElement;
                container.style.position = 'relative';
                
                // Create corner markers
                const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                corners.forEach(corner => {
                  const marker = document.createElement('div');
                  marker.className = `ar-corner ${corner}`;
                  marker.style.cssText = `
                    position: absolute;
                    width: 15px;
                    height: 15px;
                    border: 2px solid #007bff;
                    ${corner.includes('top') ? 'top: -3px;' : 'bottom: -3px;'}
                    ${corner.includes('left') ? 'left: -3px;' : 'right: -3px;'}
                    ${corner.includes('top') && corner.includes('left') ? 'border-right: none; border-bottom: none;' : ''}
                    ${corner.includes('top') && corner.includes('right') ? 'border-left: none; border-bottom: none;' : ''}
                    ${corner.includes('bottom') && corner.includes('left') ? 'border-right: none; border-top: none;' : ''}
                    ${corner.includes('bottom') && corner.includes('right') ? 'border-left: none; border-top: none;' : ''}
                  `;
                  container.appendChild(marker);
                });

                // Add AR indicator
                const arIndicator = document.createElement('div');
                arIndicator.innerHTML = '📱 AR Ready';
                arIndicator.style.cssText = `
                  position: absolute;
                  bottom: -25px;
                  left: 50%;
                  transform: translateX(-50%);
                  font-size: 10px;
                  color: #007bff;
                  font-weight: bold;
                  text-align: center;
                `;
                container.appendChild(arIndicator);
                
                console.log('✅ AR-ready QR code generated successfully');
              }
            }, 100);
          };
          shadow.appendChild(qrScript);
        }

        // Download QR button
        const downloadBtn = shadow.querySelector('.download-btn');
        if (downloadBtn && qrContainer) {
          downloadBtn.onclick = function() {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
              const link = document.createElement('a');
              link.download = 'holocard_qr.png';
              link.href = canvas.toDataURL('image/png');
              link.click();
              console.log('✅ QR code downloaded');
            }
          };
        }// Close button
        const closeBtn = shadow.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            genModal.classList.remove('active');
            setTimeout(() => {
              host.remove();
            }, 300);
            // Also clear the form and show the addCard modal again if needed
            clearForm();
          };
        }
      })
      .catch(err => console.error("❌ Card-Generated modal error:", err));
  });
})();
