// Secure QR code scanning and AR overlay for HoloCard
// Uses jsQR for QR scanning and overlays card info on camera preview

let video = null;
let canvas = null;
let ctx = null;
let scanning = false;
let arOverlay = null;
let lastCardData = null;
let lastCardId = null;
let lastOverlayVisible = false;
let currentScannedCardId = null; // Track the currently scanned card for contacts

// Enhanced scanning state management
let scanningState = 'idle'; // 'idle', 'scanning', 'fetching', 'displaying', 'cooldown'
let lastScanTime = 0;
let scanCooldownPeriod = 3000; // 3 seconds cooldown after successful scan
let noQrCounter = 0;
let noQrThreshold = 150; // ~5 seconds at 30fps (150 frames)
let currentCardDisplayed = null;
let displayTimeout = null;
let noQRTimeout = null;
let currentDisplayedCardId = null;

function esc(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}

function injectARCardInfo(profile) {
  console.log('[AR] injectARCardInfo called with profile:', profile);
  // Remove previous children
  const arCardInfo = document.getElementById('arCardInfo');
  if (!arCardInfo) {
    console.warn('[AR] arCardInfo entity not found!');
    return;
  }
  while (arCardInfo.firstChild) arCardInfo.removeChild(arCardInfo.firstChild);

  // Format fields for AR overlay using correct API field names
  let name = profile.CardName || profile.name || profile.cardName || 
             `${profile.FirstName || ''} ${profile.LastName || ''}`.trim() || '';
  let company = profile.CompanyName || profile.company || profile.companyName || '';
  let email = profile.Email || profile.email || '';
  let contact = profile.ContactNo || profile.contact || '';
  let cardType = profile.CardTypeText || profile.cardType || '';

  let y = 0.2;
  if (cardType === 'Corporate') {
    if (company) {
      const companyText = document.createElement('a-text');
      companyText.setAttribute('value', company);
      companyText.setAttribute('color', '#FFD700');
      companyText.setAttribute('position', `0 ${y} 0`);
      companyText.setAttribute('align', 'center');
      companyText.setAttribute('scale', '0.7 0.7 0.7');
      arCardInfo.appendChild(companyText);
      y -= 0.15;
      console.log('[AR] Injected company:', company);
    }
  }
  if (name) {
    const nameText = document.createElement('a-text');
    nameText.setAttribute('value', name);
    nameText.setAttribute('color', '#00d0ff');
    nameText.setAttribute('position', `0 ${y} 0`);
    nameText.setAttribute('align', 'center');
    nameText.setAttribute('scale', '0.6 0.6 0.6');
    arCardInfo.appendChild(nameText);
    y -= 0.13;
    console.log('[AR] Injected name:', name);
  }
  if (email) {
    const emailText = document.createElement('a-text');
    emailText.setAttribute('value', email);
    emailText.setAttribute('color', '#fff');
    emailText.setAttribute('position', `0 ${y} 0`);
    emailText.setAttribute('align', 'center');
    emailText.setAttribute('scale', '0.4 0.4 0.4');
    arCardInfo.appendChild(emailText);
    y -= 0.11;
    console.log('[AR] Injected email:', email);
  }
  if (contact) {
    const contactText = document.createElement('a-text');
    contactText.setAttribute('value', contact);
    contactText.setAttribute('color', '#fff');
    contactText.setAttribute('position', `0 ${y} 0`);
    contactText.setAttribute('align', 'center');
    contactText.setAttribute('scale', '0.4 0.4 0.4');
    arCardInfo.appendChild(contactText);
    y -= 0.11;
    console.log('[AR] Injected contact:', contact);
  }
  console.log('[AR] AR card info injection complete.');
}

function setScanStatus(msg, color) {
  const el = document.getElementById('scanStatus');
  if (el) {
    el.textContent = msg;
    if (color) el.style.color = color;
    else el.style.color = '#fff';
  }
}

function showARCard(data, qrLocation, qrCorners) {
  console.log('[DISPLAY] === STARTING showARCard ===');
  console.log('[DISPLAY] typeof data:', typeof data);
  console.log('[DISPLAY] data content:', data);
  console.log('[DISPLAY] JSON.stringify(data):', JSON.stringify(data));
  
  if (typeof data === 'string') {
    console.error('[DISPLAY] ERROR: showARCard called with string instead of object!');
    console.error('[DISPLAY] This should never happen - check the calling code');
    return;
  }
  
  console.log('[DISPLAY] showARCard called with data:', data);
  lastCardData = data;

  // --- AR OVERLAY: Floating HTML overlay that tracks QR code ---
  if (!arOverlay) {
    arOverlay = document.createElement('div');
    arOverlay.id = 'ar-overlay';
    arOverlay.style.position = 'absolute';    arOverlay.style.background = 'rgba(255,255,255,0.98)';
    arOverlay.style.border = '2px solid #667eea';
    arOverlay.style.borderRadius = '18px';
    arOverlay.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25), 0 4px 16px rgba(102,126,234,0.15)';
    arOverlay.style.padding = '1.5rem 2rem';
    arOverlay.style.zIndex = '10';
    arOverlay.style.minWidth = '280px';
    arOverlay.style.maxWidth = '400px';
    arOverlay.style.textAlign = 'center';
    arOverlay.style.pointerEvents = 'none';
    arOverlay.style.transition = 'transform 0.08s linear, left 0.08s linear, top 0.08s linear';
    arOverlay.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    arOverlay.style.fontSize = '14px';
    arOverlay.style.lineHeight = '1.4';
    document.querySelector('.camScanner').appendChild(arOverlay);  }
  arOverlay.style.display = '';
  lastOverlayVisible = true; // Mark overlay as visible
    // Build the card display content using correct API field names
  // Helper function to check for valid non-empty values
  const getValue = (...values) => {
    for (const val of values) {
      if (val && val.toString().trim() !== '') return val.toString().trim();
    }
    return null;
  };
  
  const cardName = getValue(data.CardName, data.cardName) || 
                   getValue(`${data.FirstName || ''} ${data.LastName || ''}`.trim()) ||
                   getValue(data.CompanyName, data.companyName) || 'Unknown';
  
  const cardType = getValue(data.CardTypeText, data.cardType, data.type) || 'Unknown';
    const logoImg = data.ProfilePicture && data.ProfilePicture.startsWith('data:image/')
    ? data.ProfilePicture
    : (data.CompanyLogo && data.CompanyLogo.startsWith('data:image/')
      ? data.CompanyLogo
      : '../public/images/holocardLogo.svg');  arOverlay.innerHTML = `
    <div class="ar-lshape-parent">
      <div class="ar-lshape-col">
        <div class="ar-business-card">
          <div class="ar-card-content">
            <h2>${esc(cardName)}</h2>
            <div class="ar-card-type">${esc(cardType)}</div>
            ${cardType === 'Corporate' ? `<div class="ar-card-row"><span class="ar-card-label">Company:</span><span class="ar-card-value">${esc(getValue(data.CompanyName, data.company, data.companyName) || 'None')}</span></div>` : ''}
            ${cardType === 'Corporate' ? `<div class="ar-card-row"><span class="ar-card-label">Contact Person:</span><span class="ar-card-value">${esc(getValue(data.ContactPerson) || 'None')}</span></div>` : ''}
            <div class="ar-card-row"><span class="ar-card-label">Email:</span><span class="ar-card-value">${esc(getValue(data.Email, data.email, data.personalEmail, data.companyEmail) || 'None')}</span></div>
            <div class="ar-card-row"><span class="ar-card-label">Contact:</span><span class="ar-card-value">${esc(getValue(data.ContactNo, data.contact, data.contactNo, data.phone) || 'None')}</span></div>
            <div class="ar-card-row"><span class="ar-card-label">Profession/Position:</span><span class="ar-card-value">${esc(getValue(data.Profession, data.profession, data.Position, data.position) || 'None')}</span></div>
            <div class="ar-card-row"><span class="ar-card-label">Address:</span><span class="ar-card-value">${esc(getValue(data.Address, data.address) || 'None')}</span></div>
          </div>
        </div>
        <div class="ar-card-watermark-container">
          <img src="../public/images/WATERMARK.png" alt="Watermark" class="ar-card-watermark" />
        </div>
      </div>
      <div class="ar-lshape-logo-col">
        <img src="../public/images/holocardLogo.svg" alt="HoloCard Logo" class="ar-card-holocard-logo" />
      </div>
    </div>
  `;
  if (qrCorners) {
    // Calculate center and angle of QR code
    const cx = (qrCorners.topLeftCorner.x + qrCorners.bottomRightCorner.x) / 2;
    const cy = (qrCorners.topLeftCorner.y + qrCorners.bottomRightCorner.y) / 2;
    // Calculate rotation angle (in degrees) from topLeft to topRight
    const dx = qrCorners.topRightCorner.x - qrCorners.topLeftCorner.x;
    const dy = qrCorners.topRightCorner.y - qrCorners.topLeftCorner.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    // Position overlay at center, rotate to match QR code
    arOverlay.style.left = `${cx}px`;
    arOverlay.style.top = `${cy}px`;
    arOverlay.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  } else if (qrLocation) {
    arOverlay.style.left = `${qrLocation.left}px`;
    arOverlay.style.top = `${qrLocation.top}px`;
    arOverlay.style.transform = 'translate(-50%, -50%)';
  } else {
    arOverlay.style.left = '50%';
    arOverlay.style.top = '50%';
    arOverlay.style.transform = 'translate(-50%, -50%)';
  }
  // --- AR.js/A-Frame overlay (optional, still present for marker-based AR) ---
  const profile = data.profile || data;
  injectARCardInfo(profile);
  // --- Update scanned details panel ---
  console.log('[DISPLAY] Updating details panel with data:', data);

  // Set profile picture or company logo in .photoLogoContainer img
  const photoLogoImg = document.querySelector('.photoLogoContainer img');
  if (photoLogoImg) {
    let imgSrc = '../public/images/holocardLogo.svg';
    if (data.ProfilePicture && data.ProfilePicture.startsWith('data:image/')) {
      imgSrc = data.ProfilePicture;
    } else if (data.CompanyLogo && data.CompanyLogo.startsWith('data:image/')) {
      imgSrc = data.CompanyLogo;
    }
    photoLogoImg.src = imgSrc;
  }

  const set = (id, val, label) => {
    const el = document.getElementById(id);
    if (el) {
      const finalValue = val || 'None';
      el.textContent = `${label}: ${finalValue}`;
      console.log(`[DISPLAY] Set ${id} = "${label}: ${finalValue}"`);
    } else {
      console.warn(`[DISPLAY] Element ${id} not found`);
    }
  };
    // Use the getValue helper function for consistent empty string handling
  set('cardType', getValue(data.CardTypeText, data.cardType, data.type), 'Card Type');
  set('company', getValue(data.CompanyName, data.company, data.companyName), 'Company');
  set('name', getValue(data.CardName, data.cardName) || getValue(`${data.FirstName || ''} ${data.LastName || ''}`.trim()), 'Name');
  
  // Add Contact Person field for Corporate cards
  if (getValue(data.CardTypeText, data.cardType, data.type) === 'Corporate') {
    set('contactPerson', getValue(data.ContactPerson), 'Contact Person');
  }
    set('email', getValue(data.Email, data.email, data.personalEmail, data.companyEmail), 'Email');
  set('contact', getValue(data.ContactNo, data.contact, data.contactNo, data.phone), 'Contact Number');
  set('professionPosition', getValue(data.Profession, data.profession, data.Position, data.position), 'Profession/Position');
  set('address', getValue(data.Address, data.address), 'Address');
  
  // Store the current scanned card ID for contacts functionality
  currentScannedCardId = getValue(data.HoloCardID, data.cardId, data.id);
  
  // Show the "Add to Contacts" button
  showAddContactButton();
  
  // Don't set scan status here - let state management handle it
  console.log('[DISPLAY] Card data displayed successfully');
}

function updateOverlayPosition(qrCorners) {
  if (!arOverlay || arOverlay.style.display === 'none') return;
  
  if (qrCorners) {
    const cx = (qrCorners.topLeftCorner.x + qrCorners.bottomRightCorner.x) / 2;
    const cy = (qrCorners.topLeftCorner.y + qrCorners.bottomRightCorner.y) / 2;
    const dx = qrCorners.topRightCorner.x - qrCorners.topLeftCorner.x;
    const dy = qrCorners.topRightCorner.y - qrCorners.topLeftCorner.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Smooth position updates
    arOverlay.style.left = `${cx}px`;
    arOverlay.style.top = `${cy}px`;
    arOverlay.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    arOverlay.style.display = '';
    
    console.log(`[OVERLAY] Position updated: (${cx.toFixed(1)}, ${cy.toFixed(1)}) angle: ${angle.toFixed(1)}°`);
  }
}

function startCamera() {
  console.log('[CAM] Starting camera...');
    // Check if the video container exists
  const videoContainer = document.querySelector('.arSceneContainer');
  if (!videoContainer) {
    console.error('[CAM] Video container (.arSceneContainer) not found!');
    setScanStatus('Scanner container not found', '#ff4e4e');
    return;
  }
  
  // Hide the A-Frame scene temporarily to avoid camera conflicts
  const arScene = document.querySelector('#arScene');
  if (arScene) {
    arScene.style.display = 'none';
    console.log('[CAM] Hiding A-Frame scene to avoid camera conflicts');
  }
  
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('[CAM] getUserMedia not supported');
    setScanStatus('Camera not supported in this browser', '#ff4e4e');
    return;
  }
  
  video = document.createElement('video');
  canvas = document.createElement('canvas');
  // Use willReadFrequently for better performance in QR scanning
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  scanning = true;
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', ''); // Add muted attribute for autoplay
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.zIndex = '5'; // Higher than A-Frame but lower than overlays
  video.style.borderRadius = '12px';
  video.style.background = '#000'; // Add black background for debugging
  
  console.log('[CAM] Appending video to container:', videoContainer);
  videoContainer.appendChild(video);
  
  // Request camera access with better error handling
  console.log('[CAM] Requesting camera access...');
  navigator.mediaDevices.getUserMedia({ 
    video: { 
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    } 
  })
    .then(stream => {
      console.log('[CAM] Camera stream obtained successfully:', stream);
      console.log('[CAM] Stream tracks:', stream.getTracks());
      video.srcObject = stream;
      console.log('[CAM] Video srcObject set');
      // Add error handler for video element
      video.addEventListener('error', (e) => {
        console.error('[CAM] Video element error:', e);
        setScanStatus('Video playback error', '#ff4e4e');
      });
      // Wait for video to be ready before starting scan loop
      video.addEventListener('loadeddata', () => {
        console.log('[CAM] Video loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('[CAM] Video readyState:', video.readyState);
        console.log('[CAM] Video style:', video.style.cssText);
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          console.log('[CAM] Starting scanner...');
          setScanningState('idle');
          requestAnimationFrame(tick);
        } else {
          console.warn('[CAM] Video dimensions are 0, waiting...');
        }
      });
      // Add additional event listeners for debugging
      video.addEventListener('loadedmetadata', () => {
        console.log('[CAM] Video metadata loaded');
      });
      video.addEventListener('canplay', () => {
        console.log('[CAM] Video can start playing');
      });
      video.addEventListener('playing', () => {
        console.log('[CAM] Video is playing');
      });
      // Fallback: start after play event if loadeddata doesn't fire
      video.addEventListener('play', () => {
        setTimeout(() => {
          if (video.readyState >= 2 && video.videoWidth > 0) {
            console.log('[CAM] Video playing, scanner ready...');
            if (scanningState === 'idle') { // Don't restart if already running
              setScanningState('idle');
              requestAnimationFrame(tick);
            }
          }
        }, 500);
      });
      console.log('[CAM] Starting video playback...');
      video.play().then(() => {
        console.log('[CAM] Video.play() resolved successfully');
      }).catch(playError => {
        console.error('[CAM] Video.play() failed:', playError);
        setScanStatus('Failed to start video', '#ff4e4e');
      });
    })
    .catch(err => {
      console.error('[CAM] Camera access error:', err);
      console.error('[CAM] Error name:', err.name);
      console.error('[CAM] Error message:', err.message);
      let errorMessage = 'Camera access failed';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is busy';
      }
      setScanStatus(errorMessage, '#ff4e4e');
      // Only try fallback if error is NOT NotReadableError (camera busy)
      if (err.name !== 'NotReadableError') {
        console.log('[CAM] Trying fallback camera settings...');
        navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', // Try front camera
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        })
        .then(fallbackStream => {
          console.log('[CAM] Fallback camera stream obtained');
          video.srcObject = fallbackStream;
          video.play();
        })
        .catch(fallbackErr => {
          console.error('[CAM] Fallback camera also failed:', fallbackErr);
          alert(`Camera access failed: ${errorMessage}\n\nPlease check:\n1. Camera permissions\n2. HTTPS connection\n3. Camera availability`);
        });
      } else {
        alert(`Camera access failed: ${errorMessage}\n\nPlease check:\n1. Camera permissions\n2. Close other apps using the camera\n3. Camera availability`);
      }
    });
}

function tick() {
  if (!video || !canvas || !ctx || !scanning) return;
  
  // Check if video is ready and has valid dimensions
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    // Video not ready yet, try again in next frame
    requestAnimationFrame(tick);
    return;
  }
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
    try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    let code = null;
    if (window.jsQR) {
      code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
    }
      if (code) {
      console.log('[QR] Raw QR data:', code.data);
      
      // Parse QR code data
      let cardData = null;
      let isIdOnly = false;
      let cardId = null;
      
      try {
        // Try to parse as JSON first
        cardData = JSON.parse(code.data);
        console.log('[QR] Parsed as JSON:', cardData);
        // Check if it's a simple ID object like {"id": "17"}
        if (typeof cardData === 'object' && cardData !== null && Object.keys(cardData).length === 1 && cardData.id) {
          isIdOnly = true;
          cardId = cardData.id.toString();
          console.log('[QR] Detected ID-only JSON format:', cardId);
        } else if (typeof cardData === 'number' && Number.isInteger(cardData)) {
          // Accept plain number as card ID
          isIdOnly = true;
          cardId = cardData.toString();
          console.log('[QR] Detected simple number ID format:', cardId);
        }
      } catch (e) {
        // Not JSON, treat as simple string ID
        if (typeof code.data === 'string' && code.data.trim().length > 0) {
          const trimmedData = code.data.trim();
          // Check if it's a simple number/ID
          if (/^\d+$/.test(trimmedData)) {
            isIdOnly = true;
            cardId = trimmedData;
            console.log('[QR] Detected simple string ID format:', cardId);
          } else {
            console.log('[QR] Not a simple ID, treating as complex data');
            // Could be complex JSON that we couldn't parse, skip for now
          }
        }
      }
      
      const loc = code.location;
      let qrLocation = null;
      let qrCorners = null;
      if (loc) {
        const top = (loc.topLeftCorner.y + loc.bottomRightCorner.y) / 2;
        const left = (loc.topLeftCorner.x + loc.bottomRightCorner.x) / 2;
        qrLocation = { top, left };
        qrCorners = loc;
      }      // Enhanced QR detection with improved state management
      if (isIdOnly && cardId) {
        // Don't re-scan the same card during cooldown
        if (currentCardDisplayed === cardId && (scanningState === 'displaying' || scanningState === 'cooldown')) {
          console.log('[QR] Same card detected during cooldown/display, updating position only');
          updateOverlayPosition(qrCorners);
          lastOverlayVisible = true;
          // Reset no-QR counter since we can see the QR code
          noQrCounter = 0;
          requestAnimationFrame(tick);
          return;
        }
        
        // Only scan new cards if we're in idle state or enough time has passed
        if (scanningState === 'idle' || shouldResumeScanning()) {
          console.log('[QR] Fetching data for card ID:', cardId);
          lastCardId = cardId;
          fetchCardDataById(cardId, qrLocation, qrCorners);
          requestAnimationFrame(tick);
          return; // Stop here, fetchCardDataById will handle the rest
        } else {
          // Still in cooldown for different card, just update position if we have overlay
          updateOverlayPosition(qrCorners);
          lastOverlayVisible = true;
        }
      } else if (cardData && typeof cardData === 'object' && !isIdOnly) {
        // Handle complex embedded card data ONLY if it's an object
        if (scanningState === 'idle' || shouldResumeScanning()) {
          console.log('[QR] Using embedded card data');
          lastCardId = null;
          lastCardData = cardData;
          showARCard(cardData, qrLocation, qrCorners);
          setScanningState('displaying');
        } else {
          updateOverlayPosition(qrCorners);
          lastOverlayVisible = true;
        }
      } else {
        console.log('[QR] Invalid QR code format, ignoring');
        setScanStatus('Invalid QR code', '#ff4e4e');
      }
      
      // Reset no-QR counter since we found a QR code
      noQrCounter = 0;    } else {
      // No QR code detected
      noQrCounter++;
      
      // If we have an overlay visible and no QR code for threshold frames, hide it and resume
      if (lastOverlayVisible && noQrCounter > noQrThreshold) {
        console.log('[QR] No QR code detected for 5 seconds, resuming scanning');
        hideAROverlay();
        setScanningState('idle');
        noQrCounter = 0;
      }
      
      // Hide overlay if no QR code and not in displaying/cooldown state
      if (!lastOverlayVisible && (scanningState === 'idle' || scanningState === 'scanning')) {
        if (arOverlay) {
          arOverlay.style.display = 'none';
        }
        setScanStatus('Scanning...', '#fff');
      }
    }
    
  } catch (error) {
    console.error('[SCANNER] Error in tick function:', error);
    setScanStatus('Scanner error', '#ff4e4e');
  }
  
  requestAnimationFrame(tick);
}

// Fetch card data by ID from backend and display AR overlay
function fetchCardDataById(cardId, qrLocation, qrCorners) {
  console.log('[API] === STARTING fetchCardDataById ===');
  console.log('[API] cardId:', cardId, 'type:', typeof cardId);
  
  // Set state to fetching
  setScanningState('fetching');
  
  // Use correct API path based on current location
  const currentPath = window.location.pathname;
  let apiPath;
  if (currentPath.includes('/pages/')) {
    // We're in pages directory, go up one level
    apiPath = `../api/get_cards.php?id=${encodeURIComponent(cardId)}`;
  } else {
    // We're in root directory
    apiPath = `api/get_cards.php?id=${encodeURIComponent(cardId)}`;
  }
  
  console.log('[API] Fetching card data for ID:', cardId, 'URL:', apiPath);fetch(apiPath)
    .then(res => {
      console.log('[API] Response received:', res.status, res.statusText);
      console.log('[API] Response headers:', Object.fromEntries(res.headers.entries()));
      if (!res.ok) {
        // Try alternative path if first fails
        const altPath = currentPath.includes('/pages/') ? 
          `../api/get_cards.php?id=${encodeURIComponent(cardId)}` : 
          `/holocard_nonext/api/get_cards.php?id=${encodeURIComponent(cardId)}`;
        console.log('[API] Trying alternative path:', altPath);
        return fetch(altPath);
      }
      return res;
    })
    .then(res => {
      console.log('[API] Final response:', res.status, res.statusText);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      console.log('[API] Raw response:', data);
      
      // Handle the updated API response format
      let card = null;
      if (data.success && data.card) {
        // Single card response (new format)
        card = data.card;
        console.log('[API] Using single card response format');
      } else if (data.success && data.cards && data.cards.length > 0) {
        // Array response (fallback)
        card = data.cards[0];
        console.log('[API] Using array response format');
      } else if (Array.isArray(data)) {
        // Direct array response (legacy)
        card = data[0] || null;
        console.log('[API] Using direct array format');
      } else if (typeof data === 'object' && data !== null && !data.success) {
        // Direct object response (legacy)
        card = data;
        console.log('[API] Using direct object format');
      }      
      if (!card) {
        throw new Error(`Card not found. Response: ${JSON.stringify(data)}`);
      }
      
      console.log('[API] Final card data to display:', card);
      currentCardDisplayed = cardId;
      showARCard(card, qrLocation, qrCorners);
      // Log the full response for debugging
      console.log('[API][DEBUG] Full response JSON:', data);
      if (data.debug_fetched) {
        console.log('[API][DEBUG] debug_fetched from backend:', data.debug_fetched);
      }
      // Set state to displaying (will automatically set cooldown after timeout)
      setScanningState('displaying');
    })
    .catch(err => {
      console.error('[API] Failed to fetch card data:', err);
      setScanStatus(`Error: ${err.message}`, '#ff4e4e');
      
      // Resume scanning on error after a short delay
      setTimeout(() => {
        setScanningState('idle');
      }, 2000);
    });
}

// Enhanced scanning state management functions
function setScanningState(newState) {
  console.log(`[STATE] Changing from ${scanningState} to ${newState}`);
  const oldState = scanningState;
  scanningState = newState;
  
  // Clear any existing timeouts
  clearTimeout(displayTimeout);
  clearTimeout(noQRTimeout);
  
  switch (newState) {
    case 'idle':
      scanning = true;
      setScanStatus('Scanning...', '#fff');
      currentCardDisplayed = null;
      console.log('[STATE] Scanner ready for new QR codes');
      break;
    case 'scanning':
      scanning = true;
      setScanStatus('Scanning...', '#fff');
      break;
    case 'fetching':
      scanning = true; // Keep scanning while fetching so we can track QR movement
      setScanStatus('Fetching card data...', '#00ffae');
      break;
    case 'displaying':
      scanning = true; // Keep scanning to track QR movement
      setScanStatus('Scanned!', '#00ffae');
      lastScanTime = Date.now();
      lastOverlayVisible = true;
      // Set timeout to go to cooldown state
      displayTimeout = setTimeout(() => {
        if (scanningState === 'displaying') {
          setScanningState('cooldown');
        }
      }, scanCooldownPeriod);
      break;
    case 'cooldown':
      scanning = true; // Keep scanning to track QR movement and detect removal
      setScanStatus('Scan complete - Point away to scan another', '#ffaa00');
      noQrCounter = 0; // Reset counter when entering cooldown
      break;
  }
}

function shouldResumeScanning() {
  const timeSinceLastScan = Date.now() - lastScanTime;
  return timeSinceLastScan > scanCooldownPeriod && scanningState !== 'fetching';
}

function hideAROverlay() {
  if (arOverlay) {
    arOverlay.style.display = 'none';
    console.log('[OVERLAY] Hidden');
  }
  lastOverlayVisible = false;
  lastCardId = null;
  lastCardData = null;
  currentCardDisplayed = null;
  currentScannedCardId = null;
  
  // Hide the "Add to Contacts" button
  hideAddContactButton();
    // Clear the details panel
  const detailElements = ['cardType', 'company', 'contactPerson', 'name', 'email', 'contact', 'professionPosition', 'address'];
  detailElements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const labels = {
        'cardType': 'Card Type',
        'company': 'Company', 
        'contactPerson': 'Contact Person',
        'name': 'Name',
        'email': 'Email',
        'contact': 'Contact Number',
        'professionPosition': 'Profession/Position',
        'address': 'Address'
      };
      el.textContent = `${labels[id]}: None`;
    }
  });
}

// Add session check functionality
async function checkSession() {
  try {
    const currentPath = window.location.pathname;
    let apiPath;
    if (currentPath.includes('/pages/')) {
      apiPath = '../api/session_test.php';
    } else {
      apiPath = 'api/session_test.php';
    }
    
    const response = await fetch(apiPath, {
      method: 'GET',
      credentials: 'include'
    });
    
    const result = await response.json();
    console.log('[SESSION] Session check result:', result);
    
    if (!result.logged_in) {
      console.warn('[SESSION] User not logged in, some features may not work');
      // Optionally redirect to login or show a warning
    } else {
      console.log('[SESSION] User is logged in:', result.username);
    }
    
    return result;
  } catch (error) {
    console.error('[SESSION] Error checking session:', error);
    return { logged_in: false };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Check session status when page loads
  checkSession();
  
  // Only start camera if jsQR is loaded
  if (window.jsQR) {
    console.log('[INIT] jsQR loaded, starting camera.');
    startCamera();
  } else {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jsqr/dist/jsQR.js';
    script.onload = () => {
      console.log('[INIT] jsQR script loaded, starting camera.');
      startCamera();
    };
    document.body.appendChild(script);
  }
  // Copy to clipboard for scanned details
  document.querySelectorAll('.copy-btn').forEach(btn => {    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-copy-target');
      const field = document.getElementById(targetId);
      if (field) {
        // Remove the button text from the copied value
        const text = field.childNodes[0].nodeValue.trim();
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✔';
          setTimeout(() => { btn.textContent = '📋'; }, 1000);
        });
      }
    });
  });
    // Add to Contacts button event listener
  const addContactBtn = document.getElementById('addContactBtn');
  if (addContactBtn) {
    addContactBtn.addEventListener('click', handleAddToContacts);
    console.log('[INIT] Add to Contacts button event listener attached');
  }
});

// Error handling for invalid QR
function handleInvalidQR() {
  setScanStatus('Cannot scan: Invalid QR code', '#ff4e4e');
}

// Add to Contacts functionality
function showAddContactButton() {
  const container = document.getElementById('addContactContainer');
  const button = document.getElementById('addContactBtn');
  
  if (container && button) {
    container.style.display = 'block';
    
    // Reset button state
    button.disabled = false;
    button.className = 'add-contact-btn';
    button.innerHTML = '<span class="btn-icon">👤</span><span class="btn-text">Add to Contacts</span>';
    
    // Remove any existing event listeners and add new one
    button.replaceWith(button.cloneNode(true));
    const newButton = document.getElementById('addContactBtn');
    newButton.addEventListener('click', handleAddToContacts);
  }
}

function hideAddContactButton() {
  const container = document.getElementById('addContactContainer');
  if (container) {
    container.style.display = 'none';
  }
}

async function handleAddToContacts() {
  const button = document.getElementById('addContactBtn');
  
  if (!currentScannedCardId) {
    alert('No card data available');
    return;
  }
  
  // Set loading state
  button.disabled = true;
  button.className = 'add-contact-btn loading';
  button.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Adding...</span>';
  
  try {
    // Use correct API path based on current location
    const currentPath = window.location.pathname;
    let apiPath;
    if (currentPath.includes('/pages/')) {
      apiPath = '../api/add_contact.php';
    } else {
      apiPath = 'api/add_contact.php';
    }
      const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        holocardId: currentScannedCardId // Fix the field name to match backend
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Success state
      button.className = 'add-contact-btn success';
      button.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Added!</span>';
      
      // Show success message
      setTimeout(() => {
        alert('Contact added successfully!');
      }, 500);
      
    } else {
      // Error state
      button.disabled = false;
      button.className = 'add-contact-btn';
      button.innerHTML = '<span class="btn-icon">👤</span><span class="btn-text">Add to Contacts</span>';
      
      // Show error message
      alert('Error: ' + (result.error || 'Failed to add contact'));
    }
    
  } catch (error) {
    console.error('Error adding contact:', error);
    
    // Reset button state
    button.disabled = false;
    button.className = 'add-contact-btn';
    button.innerHTML = '<span class="btn-icon">👤</span><span class="btn-text">Add to Contacts</span>';
    
    alert('Network error: Please check your connection and try again.');
  }
}

// Add session check on load
checkSession();
