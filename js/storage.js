(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};
  const STORAGE_KEY = `${QRSmart.STORAGE_PREFIX || "qrsmart."}profiles`;

  function readProfiles() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function writeProfiles(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function saveDraftToLocalStorage(data, url, existingId) {
    const profiles = readProfiles();
    const now = new Date().toISOString();
    const id = existingId || data.id || `profile-${Date.now()}`;
    const cleanData = QRSmart.sanitizeProfileData(data);
    const record = {
      id,
      title: cleanData.title || "صفحة بدون اسم",
      description: cleanData.description || "",
      createdAt: now,
      updatedAt: now,
      linkCount: QRSmart.getActiveLinks(cleanData).length,
      profileUrl: url || QRSmart.generateProfileUrl(cleanData),
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
          <button class="btn btn-secondary btn-sm" data-action="copy" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-copy"></i> نسخ</button>
          <button class="btn btn-secondary btn-sm" data-action="download" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-download"></i> QR</button>
          <a class="btn btn-primary btn-sm" href="${QRSmart.escapeHTML(item.profileUrl)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> فتح</a>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${QRSmart.escapeHTML(item.id)}"><i class="fa-solid fa-trash"></i> حذف</button>
        </div>
      `;
      list.appendChild(row);
    });
  }

  function setupDashboard() {
    if (document.body.dataset.page !== "dashboard") return;
    const modal = document.getElementById("confirmModal");
    const cancelBtn = document.getElementById("cancelDeleteBtn");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    let pendingDeleteId = null;

    renderDashboard();

    document.getElementById("dashboardList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const id = button.dataset.id;
      const action = button.dataset.action;
      const item = getDraftById(id);
      if (!item && action !== "delete") return;

      if (action === "copy") {
        QRSmart.copyToClipboard(item.profileUrl).then(() => QRSmart.showToast("تم نسخ رابط البروفايل.", "success"));
      }

      if (action === "download") {
        const scratch = document.createElement("div");
        scratch.id = "qrCode";
        scratch.style.position = "fixed";
        scratch.style.left = "-9999px";
        document.body.appendChild(scratch);
        QRSmart.generateQRCode(item.profileUrl, scratch);
        window.setTimeout(() => {
          QRSmart.downloadQRCode(`${item.title || "qr-profile"}.png`);
          scratch.remove();
        }, 80);
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
  }

  QRSmart.saveDraftToLocalStorage = saveDraftToLocalStorage;
  QRSmart.loadDraftsFromLocalStorage = loadDraftsFromLocalStorage;
  QRSmart.getDraftById = getDraftById;
  QRSmart.deleteDraft = deleteDraft;
  window.QRSmart = QRSmart;

  document.addEventListener("DOMContentLoaded", setupDashboard);
})();
