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
    e.preventDefault();

    /* —— collect data before SweetAlert closes the form —— */
    const isPersonal = catSel.value === "Personal";
    const data = {
      cardType        : catSel.value, // Personal | Corporate
      company         : form.querySelector("#company")?.value || "",
      firstName       : form.querySelector(isPersonal ? "#FName"  : "#CFName")?.value || "",
      lastName        : form.querySelector(isPersonal ? "#Lname"  : "#CLname")?.value || "",
      middleName      : form.querySelector(isPersonal ? "#Mname"  : "#CMname")?.value || "",
      suffix          : form.querySelector(isPersonal ? "#nameSuffix"  : "#CnameSuffix")?.value || "",
      birthDate       : form.querySelector("#birthDate")?.value || "",    // Personal only
      personalEmail   : form.querySelector("#email")?.value || "",
      companyEmail    : form.querySelector("#companyEmail")?.value || "",
      contact         : form.querySelector(isPersonal ? "#contact" : "#companyContact")?.value || "",
      address         : form.querySelector("#address")?.value || "",
      cardName        : ((isPersonal ? form.querySelector("#FName")?.value : form.querySelector("#company")?.value) || "undefined") + "'s Card",
    };

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
      confirmButtonText: "Confirm & Generate QR",
      cancelButtonText: "Edit",
      allowOutsideClick: false,
      allowEscapeKey: false
    });
    if (!result.isConfirmed) return; // User cancelled, let them edit

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
        shadow.appendChild(genModal);
        const map = {
          detailCardType     : data.cardType,
          detailCompany      : data.company,
          detailFirstName    : data.firstName,
          detailLastName     : data.lastName,
          detailMiddleName   : data.middleName,
          detailSuffix       : data.suffix,
          detailBdate        : data.birthDate,
          detailEmail        : isPersonal ? data.personalEmail : "—",
          detailCompanyEmail : !isPersonal ? data.companyEmail : "—",
          detailContact      : data.contact,
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
        requestAnimationFrame(() => genModal.classList.add("active"));
        // Generate QR code inside the modal with black foreground and white background
        const qrContainer = shadow.querySelector('.qr-placeholder');
        if (qrContainer) {
          qrContainer.innerHTML = '';
          const qr = new QRCode(qrContainer, {
            text: JSON.stringify(data),
            width: 180,
            height: 180,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
          });
          // Add AR marker corners (SVG overlay)
          setTimeout(() => {
            const img = qrContainer.querySelector('img');
            if (img) {
              // Create SVG overlay for AR marker corners
              const svgNS = 'http://www.w3.org/2000/svg';
              const svg = document.createElementNS(svgNS, 'svg');
              svg.setAttribute('width', '180');
              svg.setAttribute('height', '180');
              svg.style.position = 'absolute';
              svg.style.top = '0';
              svg.style.left = '0';
              svg.style.pointerEvents = 'none';
              // Draw four L-shaped corners
              const size = 24;
              const stroke = 4;
              const color = '#00eaff';
              // Top-left
              let path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', `M${stroke/2},${size} V${stroke/2} H${size}`);
              path.setAttribute('stroke', color);
              path.setAttribute('stroke-width', stroke);
              path.setAttribute('fill', 'none');
              svg.appendChild(path);
              // Top-right
              path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', `M${180-size},${stroke/2} H${180-stroke/2} V${size}`);
              path.setAttribute('stroke', color);
              path.setAttribute('stroke-width', stroke);
              path.setAttribute('fill', 'none');
              svg.appendChild(path);
              // Bottom-left
              path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', `M${stroke/2},${180-size} V${180-stroke/2} H${size}`);
              path.setAttribute('stroke', color);
              path.setAttribute('stroke-width', stroke);
              path.setAttribute('fill', 'none');
              svg.appendChild(path);
              // Bottom-right
              path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', `M${180-size},${180-stroke/2} H${180-stroke/2} V${180-size}`);
              path.setAttribute('stroke', color);
              path.setAttribute('stroke-width', stroke);
              path.setAttribute('fill', 'none');
              svg.appendChild(path);
              // Wrap img and svg in a container
              const wrap = document.createElement('div');
              wrap.style.position = 'relative';
              wrap.style.display = 'inline-block';
              img.style.display = 'block';
              wrap.appendChild(img);
              wrap.appendChild(svg);
              qrContainer.appendChild(wrap);
            }
          }, 100);
        }
        // Download QR button
        const downloadBtn = shadow.querySelector('.download-btn');
        if (downloadBtn && qrContainer) {
          downloadBtn.onclick = function() {
            const img = qrContainer.querySelector('img');
            if (img) {
              const a = document.createElement('a');
              a.href = img.src;
              a.download = 'holocard_qr.png';
              a.click();
            }
          };
        }
        // Close button
        const closeBtn = shadow.querySelector('.close-btn');
        if (closeBtn) {
          closeBtn.onclick = () => {
            host.remove();
            // Also clear the form and show the addCard modal again if needed
            clearForm();
          };
        }
      })
      .catch(err => console.error("❌ Card-Generated modal error:", err));
  });
})();
