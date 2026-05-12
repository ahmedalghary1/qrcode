(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};

  function generateQRCode(url, target) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) return false;
    container.innerHTML = "";

    if (!window.QRCode) {
      container.innerHTML = '<div class="empty-state small"><i class="fa-solid fa-triangle-exclamation"></i><span>تعذر تحميل مكتبة QRCode.js. تأكد من اتصال الإنترنت ثم أعد فتح الصفحة.</span></div>';
      return false;
    }

    try {
      new window.QRCode(container, {
        text: url,
        width: 256,
        height: 256,
        colorDark: "#111827",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M
      });
      return true;
    } catch (error) {
      container.innerHTML = '<div class="empty-state small"><i class="fa-solid fa-triangle-exclamation"></i><span>الرابط طويل جدًا على إنشاء QR واضح. قلل عدد الروابط أو طول النصوص ثم حاول مرة أخرى.</span></div>';
      return false;
    }
  }

  function getQrCanvas() {
    const box = document.getElementById("qrCode");
    if (!box) return null;
    const canvas = box.querySelector("canvas");
    if (canvas) return canvas;

    const image = box.querySelector("img");
    if (!image) return null;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = image.naturalWidth || 256;
    tempCanvas.height = image.naturalHeight || 256;
    const context = tempCanvas.getContext("2d");
    context.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas;
  }

  function downloadQRCode(filename) {
    const canvas = getQrCanvas();
    if (!canvas) {
      QRSmart.showToast && QRSmart.showToast("لا يوجد QR Code جاهز للتحميل.", "error");
      return;
    }

    const link = document.createElement("a");
    link.download = filename || "qr-smart-links.png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  QRSmart.generateQRCode = generateQRCode;
  QRSmart.downloadQRCode = downloadQRCode;
  window.QRSmart = QRSmart;
})();
