/* =========================================================================
   holocard.js   –   page that lists cards & opens Add-Card modal
   =========================================================================*/
console.log("🚀 holocard.js started");

/* ------------------------------------------------------------------ */
/* 1.  MOCK card list – replace with real data fetch later            */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("holocardList");
  if (!list) return console.error("❌ #holocardList not found");

  [
    { name: "John Doe",   type: "Personal Card"  },
    { name: "Jane Smith", type: "Corporate Card" },
    { name: "Alice Johnson", type: "Corporate Card" }
  ].forEach(({ name, type }) => {
    list.insertAdjacentHTML(
      "beforeend",
      /* html */ `
        <div class="card">
          <div class="card-header">
            <h5 class="card-title">${name}</h5>
            <p class="card-type">Type: <span class="type-label">${type}</span></p>
          </div>
          <div class="card-actions">
            <button class="editBtn"   title="Edit ${name}"><i class="ri-pencil-fill"></i></button>
            <button class="deleteBtn" title="Delete ${name}"><i class="ri-delete-bin-2-fill"></i></button>
          </div>
        </div>`
    );
  });
});

/* ------------------------------------------------------------------ */
/* 2.  openAddModal() – fetch /modals/addCard.html and show it         */
/* ------------------------------------------------------------------ */
function openAddModal() {
  const host        = document.getElementById("modalContainer");
  const existing    = document.querySelector(".modal-overlay");
  if (existing) return existing.classList.add("active"); // already loaded

  console.log("📡 Fetching addCard.html…");
  fetch("../modals/addCard.html")
    .then((res) => {
      if (!res.ok) throw new Error("addCard.html fetch failed");
      return res.text();
    })
    .then((html) => {
      const doc   = new DOMParser().parseFromString(html, "text/html");
      const modal = doc.querySelector(".modal-overlay");
      if (!modal) throw new Error(".modal-overlay missing in addCard.html");

      host.innerHTML = "";            // clear any prior content
      host.appendChild(modal);        // inject
      modal.classList.add("active");  // show

      /* Dynamically load its script AFTER it exists in DOM */
      const s = document.createElement("script");
      s.src    = "../scripts/addCard.js";
      s.onload = () => console.log("✅ addCard.js loaded");
      s.onerror= () => console.error("❌ Failed to load addCard.js");
      document.body.appendChild(s);
    })
    .catch((err) => console.error("❌ Add-Card modal error:", err));
}

window.openAddModal = openAddModal;
