(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};
  const STORAGE_KEY = `${QRSmart.STORAGE_PREFIX || "qrsmart."}profiles`;

  function storageAvailable() {
    try {
      const testKey = `${STORAGE_KEY}.test`;
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function readProfilesRaw() {
    if (!storageAvailable()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeProfiles(items) {
    if (!storageAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (error) {
      QRSmart.showToast && QRSmart.showToast("تعذر حفظ البيانات على هذا الجهاز. قد تكون مساحة التخزين ممتلئة.", "error");
      return false;
    }
  }

  function decodeDataFromUrl(profileUrl) {
    if (!profileUrl) return null;
    try {
      const url = new URL(profileUrl, window.location.href);
      const encoded = url.searchParams.get("data");
      return encoded ? QRSmart.decodeProfileData(encoded) : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeRecord(record) {
    if (!record || typeof record !== "object") return null;

    const sourceData = record.data || decodeDataFromUrl(record.profileUrl);
    if (!sourceData) return null;

    const cleanData = QRSmart.sanitizeProfileData(sourceData);
    const createdAt = record.createdAt || record.updatedAt || new Date().toISOString();
    const id = record.id || `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    return {
      id,
      title: cleanData.title || "صفحة بدون اسم",
      description: cleanData.description || "",
      createdAt,
      updatedAt: record.updatedAt || createdAt,
      linkCount: QRSmart.getActiveLinks(cleanData).length,
      profileUrl: QRSmart.generateProfileUrl(cleanData),
      data: cleanData
    };
  }

  function readProfiles() {
    const normalized = readProfilesRaw()
      .map(normalizeRecord)
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return normalized;
  }

  function saveDraftToLocalStorage(data, url, existingId) {
    const profiles = readProfiles();
    const now = new Date().toISOString();
    const cleanData = QRSmart.sanitizeProfileData(data);
    const id = existingId || data.id || `profile-${Date.now()}`;
    const generatedUrl = url || QRSmart.generateProfileUrl(cleanData);

    const record = {
      id,
      title: cleanData.title || "صفحة بدون اسم",
      description: cleanData.description || "",
      createdAt: now,
      updatedAt: now,
      linkCount: QRSmart.getActiveLinks(cleanData).length,
      profileUrl: generatedUrl,
      data: cleanData
    };

    const index = profiles.findIndex((item) => item.id === id);
    if (index >= 0) {
      record.createdAt = profiles[index].createdAt || now;
      profiles[index] = record;
    } else {
      profiles.unshift(record);
    }

    writeProfiles(profiles);
    return record;
  }

  function loadDraftsFromLocalStorage() {
    return readProfiles();
  }

  function getDraftById(id) {
    return readProfiles().find((item) => item.id === id) || null;
  }

  function deleteDraft(id) {
    writeProfiles(readProfiles().filter((item) => item.id !== id));
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    } catch (error) {
      return value || "";
    }
  }

  function safeFileName(value) {
    return String(value || "qr-profile")
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "") || "qr-profile";
  }

  function renderDashboard() {
    const list = document.getElementById("dashboardList");
    const empty = document.getElementById("dashboardEmpty");
    if (!list || !empty) return;

    const profiles = loadDraftsFromLocalStorage();
    empty.hidden = profiles.length > 0;
    list.innerHTML = "";

    profiles.forEach((item) => {
      const row = document.createElement("article");
      row.className = "dashboard-item";
      row.innerHTML = `
        <div class="dashboard-item-main">
          <div class="dashboard-item-head">
            <div>
              <h2>${QRSmart.escapeHTML(item.title)}</h2>
              <p>${QRSmart.escapeHTML(item.description || "لا يوجد وصف")}</p>
            </div>
          </div>
          <div class="dashboard-meta">
            <span><i class="fa-regular fa-clock"></i> ${QRSmart.escapeHTML(formatDate(item.createdAt))}</span>
            <span><i class="fa-solid fa-link"></i> ${Number(item.linkCount || 0)} روابط</span>
          </div>
        </div>
        <div class="dashboard-actions">
          <a class="btn btn-secondary btn-sm" href="create.html?draft=${encodeURIComponent(item.id)}"><i class="fa-solid fa-pen"></i> تعديل</a>
          <button type="button" class="btn btn-secondary btn-sm" data-action="copy" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-copy"></i> نسخ</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="download" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-download"></i> QR</button>
          <a class="btn btn-primary btn-sm" href="${QRSmart.escapeHTML(item.profileUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح</a>
          <button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
      `;
      list.appendChild(row);
    });
  }

  function downloadDashboardQr(item) {
    if (!QRSmart.generateQRCode || !QRSmart.downloadQRCode) {
      QRSmart.showToast("مكتبة QR لم تكتمل بعد. أعد تحميل الصفحة ثم حاول مرة أخرى.", "error");
      return;
    }

    const scratch = document.createElement("div");
    scratch.className = "qr-scratch";
    scratch.style.position = "fixed";
    scratch.style.left = "-9999px";
    scratch.style.top = "0";
    document.body.appendChild(scratch);

    const ready = QRSmart.generateQRCode(item.profileUrl, scratch);
    if (!ready) {
      scratch.remove();
      QRSmart.showToast("تعذر إنشاء QR لهذه الصفحة. حاول تقليل البيانات.", "error");
      return;
    }

    const schedule = window.requestAnimationFrame || window.setTimeout;
    schedule(() => {
      QRSmart.downloadQRCode(`${safeFileName(item.title)}.png`, scratch);
      scratch.remove();
      QRSmart.showToast("تم تحميل QR Code.", "success");
    });
  }

  function setupDashboard() {
    if (document.body.dataset.page !== "dashboard") return;

    const list = document.getElementById("dashboardList");
    const modal = document.getElementById("confirmModal");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    let pendingDeleteId = null;

    if (!storageAvailable()) {
      QRSmart.showToast("التخزين المحلي غير متاح في هذا المتصفح، لذلك لن تعمل لوحة التحكم المحلية.", "error");
    }

    renderDashboard();

    if (!list || !modal || !cancelBtn || !confirmBtn) return;

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const id = button.dataset.id;
      const action = button.dataset.action;
      const item = getDraftById(id);

      if (!item) {
        QRSmart.showToast("تعذر العثور على هذه الصفحة. أعد تحميل لوحة التحكم.", "error");
        renderDashboard();
        return;
      }

      if (action === "copy") {
        QRSmart.copyToClipboard(item.profileUrl)
          .then(() => QRSmart.showToast("تم نسخ رابط البروفايل.", "success"))
          .catch(() => QRSmart.showToast("تعذر نسخ الرابط تلقائيًا.", "error"));
      }

      if (action === "download") {
        downloadDashboardQr(item);
      }

      if (action === "delete") {
        pendingDeleteId = id;
        modal.hidden = false;
      }
    });

    cancelBtn.addEventListener("click", () => {
      pendingDeleteId = null;
      modal.hidden = true;
    });

    confirmBtn.addEventListener("click", () => {
      if (!pendingDeleteId) return;
      deleteDraft(pendingDeleteId);
      pendingDeleteId = null;
      modal.hidden = true;
      renderDashboard();
      QRSmart.showToast("تم حذف الصفحة من هذا الجهاز.", "success");
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        pendingDeleteId = null;
        modal.hidden = true;
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        pendingDeleteId = null;
        modal.hidden = true;
      }
    });
  }

  QRSmart.saveDraftToLocalStorage = saveDraftToLocalStorage;
  QRSmart.loadDraftsFromLocalStorage = loadDraftsFromLocalStorage;
  QRSmart.getDraftById = getDraftById;
  QRSmart.deleteDraft = deleteDraft;
  window.QRSmart = QRSmart;

  document.addEventListener("DOMContentLoaded", setupDashboard);
})();
