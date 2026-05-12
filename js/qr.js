(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};
  const QR_SIZE = 384;
  const QR_PADDING = 46;
  const QR_DARK = "#000000";
  const QR_ACCENT = "#2563eb";

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

  function strokeRoundedRect(context, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
    context.stroke();
  }

  function drawFinderPattern(context, x, y, cell, style) {
    const size = cell * 7;
    if (style === "classic" || style === "scan") {
      context.fillRect(x, y, size, size);
      context.fillStyle = "#ffffff";
      context.fillRect(x + cell, y + cell, cell * 5, cell * 5);
      context.fillStyle = QR_DARK;
      context.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
      return;
    }

    context.fillStyle = style === "frame" ? QR_ACCENT : QR_DARK;
    drawRoundedRect(context, x, y, size, size, cell * 1.15);
    context.fillStyle = "#ffffff";
    drawRoundedRect(context, x + cell, y + cell, cell * 5, cell * 5, cell * 0.85);
    context.fillStyle = QR_DARK;
    if (style === "dots") {
      context.beginPath();
      context.arc(x + cell * 3.5, y + cell * 3.5, cell * 1.55, 0, Math.PI * 2);
      context.fill();
      return;
    }
    drawRoundedRect(context, x + cell * 2, y + cell * 2, cell * 3, cell * 3, cell * 0.55);
  }

  function isFinderArea(row, col, count) {
    const inTop = row < 7;
    const inBottom = row >= count - 7;
    const inLeft = col < 7;
    const inRight = col >= count - 7;
    return (inTop && inLeft) || (inTop && inRight) || (inBottom && inLeft);
  }

  function drawModule(context, x, y, cell, style) {
    context.fillStyle = QR_DARK;
    if (style === "classic" || style === "scan") {
      context.fillRect(x, y, cell, cell);
      return;
    }

    if (style === "dots") {
      context.beginPath();
      context.arc(x + cell / 2, y + cell / 2, cell * 0.38, 0, Math.PI * 2);
      context.fill();
      return;
    }

    const inset = style === "frame" ? cell * 0.12 : cell * 0.08;
    const size = cell - inset * 2;
    const radius = style === "frame" ? cell * 0.16 : cell * 0.28;
    drawRoundedRect(context, x + inset, y + inset, size, size, radius);
  }

  function drawProfessionalFrame(context) {
    context.strokeStyle = "rgba(37, 99, 235, 0.32)";
    context.lineWidth = 4;
    strokeRoundedRect(context, 7, 7, QR_SIZE - 14, QR_SIZE - 14, 18);

    context.fillStyle = QR_ACCENT;
    drawRoundedRect(context, QR_SIZE / 2 - 23, QR_SIZE - 34, 46, 12, 6);
  }

  function drawStyledQRCode(qrModel, container, style) {
    const count = qrModel.getModuleCount();
    const canvas = document.createElement("canvas");
    canvas.width = QR_SIZE;
    canvas.height = QR_SIZE;

    const context = canvas.getContext("2d");
    const cell = (QR_SIZE - QR_PADDING * 2) / count;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, QR_SIZE, QR_SIZE);

    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!qrModel.isDark(row, col) || isFinderArea(row, col, count)) continue;
        const x = QR_PADDING + col * cell;
        const y = QR_PADDING + row * cell;
        drawModule(context, x, y, cell, style);
      }
    }

    drawFinderPattern(context, QR_PADDING, QR_PADDING, cell, style);
    drawFinderPattern(context, QR_PADDING + (count - 7) * cell, QR_PADDING, cell, style);
    drawFinderPattern(context, QR_PADDING, QR_PADDING + (count - 7) * cell, cell, style);

    if (style === "frame") {
      drawProfessionalFrame(context);
    }

    container.innerHTML = "";
    canvas.setAttribute("aria-label", "QR Code");
    container.appendChild(canvas);
  }

  function generateQRCode(url, target, options) {
    const container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) return false;
    container.innerHTML = "";
    const style = (options && options.style) || "scan";

    if (!window.QRCode) {
      container.innerHTML = '<div class="empty-state small"><i class="fa-solid fa-triangle-exclamation"></i><span>تعذر تحميل مكتبة QRCode.js. تأكد من اتصال الإنترنت ثم أعد فتح الصفحة.</span></div>';
      return false;
    }

    try {
      const qr = new window.QRCode(container, {
        text: url,
        width: QR_SIZE,
        height: QR_SIZE,
        colorDark: QR_DARK,
        colorLight: "#ffffff",
        correctLevel: style === "scan" ? window.QRCode.CorrectLevel.M : window.QRCode.CorrectLevel.L
      });
      if (qr && qr._oQRCode && style !== "library") {
        drawStyledQRCode(qr._oQRCode, container, style);
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
