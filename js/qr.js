(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};
  const QR_SIZE = 288;
  const QR_PADDING = 22;

  function drawRoundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
    context.fill();
  }

  function drawFinderPattern(context, x, y, cell) {
    const size = cell * 7;
    drawRoundedRect(context, x, y, size, size, cell * 1.15);
    context.fillStyle = "#ffffff";
    drawRoundedRect(context, x + cell, y + cell, cell * 5, cell * 5, cell * 0.85);
    context.fillStyle = "#111827";
    drawRoundedRect(context, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.55);
  }

  function isFinderArea(row, col, count) {
    const inTop = row < 7;
    const inBottom = row >= count - 7;
    const inLeft = col < 7;
    const inRight = col >= count - 7;
    return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
  }

  function drawStyledQRCode(qrModel, container) {
    const count = qrModel.getModuleCount();
    const canvas = document.createElement("canvas");
    canvas.width = QR_SIZE;
    canvas.height = QR_SIZE;

    const context = canvas.getContext("2d");
    const cell = (QR_SIZE - QR_PADDING * 2) / count;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, QR_SIZE, QR_SIZE);
    context.fillStyle = "#111827";

    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!qrModel.isDark(row, col) || isFinderArea(row, col, count)) continue;
        const x = QR_PADDING + col * cell;
        const y = QR_PADDING + row * cell;
        drawRoundedRect(context, x + cell * 0.08, y + cell * 0.08, cell * 0.84, cell * 0.84, cell * 0.28);
      }
    }

    drawFinderPattern(context, QR_PADDING, QR_PADDING, cell);
    drawFinderPattern(context, QR_PADDING + (count - 7) * cell, QR_PADDING, cell);
    drawFinderPattern(context, QR_PADDING, QR_PADDING + (count - 7) * cell, cell);

    container.innerHTML = "";
    canvas.setAttribute("aria-label", "QR Code");
    container.appendChild(canvas);
  }

  function generateQRCode(url, target) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) return false;
    container.innerHTML = "";

    if (!window.QRCode) {
      container.innerHTML = '<div class="empty-state small"><i class="fa-solid fa-triangle-exclamation"></i><span>تعذر تحميل مكتبة QRCode.js. تأكد من اتصال الإنترنت ثم أعد فتح الصفحة.</span></div>';
      return false;
    }

    try {
      const qr = new window.QRCode(container, {
        text: url,
        width: QR_SIZE,
        height: QR_SIZE,
        colorDark: "#111827",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.L
      });
      if (qr && qr._oQRCode) {
        drawStyledQRCode(qr._oQRCode, container);
      }
      return true;
    } catch (error) {
      container.innerHTML = '<div class="empty-state small"><i class="fa-solid fa-triangle-exclamation"></i><span>الرابط طويل جدًا على إنشاء QR واضح. قلل عدد الروابط أو طول النصوص ثم حاول مرة أخرى.</span></div>';
      return false;
    }
  }

  function getQrCanvas(target) {
    const box = typeof target === "string"
      ? document.querySelector(target)
      : target || document.getElementById("qrCode");
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

  function downloadQRCode(filename, target) {
    const canvas = getQrCanvas(target);
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
