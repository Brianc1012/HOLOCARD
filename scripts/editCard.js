// editCard.js - logic for Edit Card modal
(function initEditCardModal() {
  const modal = document.querySelector('.modal-overlay');
  const form = modal?.querySelector('#editCardForm');
  const catSel = modal?.querySelector('#editCardCategory');
  const cancelBtn = modal?.querySelector('.cancelButton');
  const upload = modal?.querySelector('#editPhotoUpload');
  const preview = modal?.querySelector('#editPhotoPreview');

  if (!modal || !form || !catSel) return;

  // --- Style Consistency Fixes ---
  // Make all buttons and inputs consistent
  modal.querySelectorAll('button').forEach(btn => {
    btn.classList.add('addButton');
    btn.style.width = '100px';
    btn.style.borderRadius = '0.5rem';
    btn.style.fontSize = '1rem';
    btn.style.padding = '0.5rem 1rem';
  });
  modal.querySelectorAll('input, select, textarea').forEach(input => {
    input.style.width = '100%';
    input.style.borderRadius = '6px';
    input.style.fontSize = '1rem';
    input.style.padding = '0.5rem 1rem';
    input.style.marginBottom = '0.5rem';
    input.style.boxSizing = 'border-box';
  });

  // --- Toggle Personal/Corporate Fields ---
  function updateVisibility(isPersonal) {
    modal.querySelector('.personalDetails').style.display = isPersonal ? 'block' : 'none';
    modal.querySelector('.corporateDetails').style.display = isPersonal ? 'none' : 'block';
  }
  catSel.addEventListener('change', e => {
    updateVisibility(e.target.value === 'Personal');
  });

  // --- Cancel Button ---
  cancelBtn?.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  });

  // --- Photo Upload Preview ---
  upload?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => (preview.src = ev.target.result);
    reader.readAsDataURL(file);
  });

  // --- Save Changes (Submit) ---
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    // Collect data
    const isPersonal = catSel.value === 'Personal';
    const data = {
      cardType: catSel.value,
      company: form.querySelector('#editCompany')?.value || '',
      firstName: form.querySelector(isPersonal ? '#editFName' : '#editCFName')?.value || '',
      lastName: form.querySelector(isPersonal ? '#editLname' : '#editCLname')?.value || '',
      middleName: form.querySelector(isPersonal ? '#editMname' : '#editCMname')?.value || '',
      suffix: form.querySelector(isPersonal ? '#editNameSuffix' : '#editCnameSuffix')?.value || '',
      birthDate: form.querySelector('#editBirthDate')?.value || '',
      email: form.querySelector(isPersonal ? '#editEmail' : '#editCompanyEmail')?.value || '',
      contactNo: form.querySelector(isPersonal ? '#editContact' : '#editCompanyContact')?.value || '',
      address: form.querySelector('#editAddress')?.value || '',
      cardId: modal.dataset.cardId
    };
    // Validate required fields
    if (!data.email || !data.contactNo || !data.cardId) {
      Swal.fire('Error', 'Please fill in all required fields.', 'error');
      return;
    }
    try {
      const res = await fetch('../api/update_card.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const apiResult = await res.json();
      if (!apiResult.success) throw new Error(apiResult.error || 'Failed to update card');
      Swal.fire('Success', 'Card updated successfully!', 'success');
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
      if (window.refreshCardList) window.refreshCardList();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  });
})();
