// Secure QR code scanning and AR overlay for HoloCard
// Uses jsQR for QR scanning and overlays card info on camera preview

let video = null;
let canvas = null;
let ctx = null;
let scanning = false;

function esc(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}

function showARCard(data, qrLocation) {
  // Overlay card info on top of the video, centered or near QR code if available
  let arOverlay = document.getElementById('ar-overlay');
  if (!arOverlay) {
    arOverlay = document.createElement('div');
    arOverlay.id = 'ar-overlay';
    arOverlay.style.position = 'absolute';
    arOverlay.style.top = '50%';
    arOverlay.style.left = '50%';
    arOverlay.style.transform = 'translate(-50%, -50%)';
    arOverlay.style.background = 'rgba(255,255,255,0.95)';
    arOverlay.style.borderRadius = '18px';
    arOverlay.style.boxShadow = '0 2px 24px rgba(0,0,0,0.13)';
    arOverlay.style.padding = '1.5rem 2rem';
    arOverlay.style.zIndex = '10';
    arOverlay.style.minWidth = '220px';
    arOverlay.style.textAlign = 'center';
    arOverlay.style.pointerEvents = 'none';
    document.querySelector('.camScanner').appendChild(arOverlay);
  }
  arOverlay.innerHTML = `
    <h2 style="margin:0 0 0.5rem 0;">${esc(data.cardName || (data.firstName || '') + ' ' + (data.lastName || ''))}</h2>
    <div style="font-size:1.1rem;color:#6a11cb;margin-bottom:0.5rem;">${esc(data.cardType || 'None')}</div>
    <div><strong>Company:</strong> ${esc(data.company || 'None')}</div>
    <div><strong>Email:</strong> ${esc(data.personalEmail || data.companyEmail || 'None')}</div>
    <div><strong>Contact:</strong> ${esc(data.contact || 'None')}</div>
    <div><strong>Birth Date:</strong> ${esc(data.birthDate || 'None')}</div>
    <div><strong>Address:</strong> ${esc(data.address || 'None')}</div>
  `;
  // Optionally, position overlay near QR code if qrLocation is available
  if (qrLocation) {
    arOverlay.style.top = `${qrLocation.top}px`;
    arOverlay.style.left = `${qrLocation.left}px`;
    arOverlay.style.transform = 'translate(-50%, -50%)';
  }
}

function startCamera() {
  video = document.createElement('video');
  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');
  scanning = true;

  const videoContainer = document.querySelector('.camScanner');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.style.width = '100%';
  video.style.borderRadius = '12px';
  videoContainer.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      requestAnimationFrame(tick);
    })
    .catch(err => {
      alert('Camera access denied or not available.');
    });
}

function tick() {
  if (!scanning) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (window.jsQR) {
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        scanning = false;
        try {
          const cardData = JSON.parse(code.data);
          // Calculate QR code center for AR overlay
          const loc = code.location;
          let qrLocation = null;
          if (loc) {
            const top = (loc.topLeftCorner.y + loc.bottomRightCorner.y) / 2;
            const left = (loc.topLeftCorner.x + loc.bottomRightCorner.x) / 2;
            qrLocation = { top, left };
          }
          showARCard(cardData, qrLocation);
        } catch (e) {
          alert('Invalid QR code data.');
          scanning = true;
          requestAnimationFrame(tick);
        }
        return;
      }
    }
  }
  requestAnimationFrame(tick);
}

window.addEventListener('DOMContentLoaded', () => {
  // Only start camera if jsQR is loaded
  if (window.jsQR) {
    startCamera();
  } else {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/jsqr/dist/jsQR.js';
    script.onload = startCamera;
    document.body.appendChild(script);
  }
});
