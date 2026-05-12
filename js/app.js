(function () {
  "use strict";

  const QRSmart = window.QRSmart;
  const state = {
    customLinks: [],
    currentDraftId: null,
    lastProfileUrl: ""
  };

  function getElement(id) {
    return document.getElementById(id);
  }

  function renderSocialInputs() {
    const root = getElement("socialInputs");
    if (!root) return;
    root.innerHTML = "";

    window.SOCIAL_PLATFORMS.forEach((platform) => {
      const card = document.createElement("article");
      card.className = "platform-card";
      card.dataset.type = platform.type;
      card.style.setProperty("--platform-color", platform.color);
      card.innerHTML = `
        <div class="platform-head">
          <span class="platform-icon"><i class="${platform.icon}"></i></span>
          <div class="platform-title">
            <strong>${platform.label}</strong>
            <small>غير مضاف</small>
          </div>
        </div>
        <label>
          <span class="sr-only">قيمة ${platform.label}</span>
          <input data-social-value="${platform.type}" type="${platform.inputType}" placeholder="${platform.placeholder}" autocomplete="off">
        </label>
        <div class="platform-actions">
          <label class="toggle" title="تفعيل أو إلغاء ظهور الرابط">
            <input data-social-active="${platform.type}" type="checkbox">
            <span></span>
          </label>
          <button type="button" class="clear-btn" data-clear-social="${platform.type}" title="مسح القيمة">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `;
      root.appendChild(card);
    });
  }

  function renderCustomLinks() {
    const list = getElement("customLinksList");
    const empty = getElement("customEmpty");
    if (!list || !empty) return;
    list.innerHTML = "";
    empty.hidden = state.customLinks.length > 0;

    state.customLinks.forEach((item, index) => {
      const iconOptions = window.CUSTOM_ICON_OPTIONS.map((icon) => (
        `<option value="${icon.value}" ${item.icon === icon.value ? "selected" : ""}>${icon.label}</option>`
      )).join("");

      const card = document.createElement("article");
      card.className = "custom-card";
      card.dataset.index = index;
      card.innerHTML = `
        <label class="field">
          <span>اسم الرابط</span>
          <input data-custom-field="label" type="text" value="${QRSmart.escapeHTML(item.label || "")}" placeholder="مثال: قائمة الطعام">
        </label>
        <label class="field">
          <span>URL</span>
          <input data-custom-field="value" type="url" value="${QRSmart.escapeHTML(item.value || "")}" placeholder="https://example.com">
        </label>
        <label class="field">
          <span>الأيقونة</span>
          <select data-custom-field="icon">${iconOptions}</select>
        </label>
        <button type="button" class="icon-btn" data-delete-custom="${index}" title="حذف الرابط">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      list.appendChild(card);
    });
  }

  function updatePlatformVisuals() {
    document.querySelectorAll(".platform-card").forEach((card) => {
      const type = card.dataset.type;
      const input = card.querySelector(`[data-social-value="${type}"]`);
      const active = card.querySelector(`[data-social-active="${type}"]`);
      const status = card.querySelector(".platform-title small");
      const hasValue = Boolean(input.value.trim());
      const isActive = hasValue && active.checked;
      card.classList.toggle("is-active", isActive);
      status.textContent = isActive ? "مضاف ومفعل" : hasValue ? "مضاف وغير مفعل" : "غير مضاف";
    });
  }

  function getProfileDataFromForm() {
    const links = window.SOCIAL_PLATFORMS.map((platform) => {
      const valueInput = document.querySelector(`[data-social-value="${platform.type}"]`);
      const activeInput = document.querySelector(`[data-social-active="${platform.type}"]`);
      return {
        type: platform.type,
        label: platform.label,
        value: valueInput ? valueInput.value.trim() : "",
        active: Boolean(activeInput && activeInput.checked && valueInput.value.trim()),
        valueKind: platform.valueKind
      };
    });

    state.customLinks.forEach((item) => {
      links.push({
        type: "custom",
        label: item.label || "رابط مخصص",
        value: item.value || "",
        active: Boolean(item.value),
        icon: item.icon || "link",
        valueKind: "url"
      });
    });

    return {
      title: getElement("titleInput").value.trim(),
      description: getElement("descriptionInput").value.trim(),
      logoUrl: getElement("logoUrlInput").value.trim(),
      primaryColor: getElement("primaryColorInput").value || "#2563EB",
      backgroundColor: getElement("backgroundColorInput").value || "#F8FAFC",
      theme: getElement("themeInput").value || "modern",
      links
    };
  }

  function renderLivePreview() {
    const data = getProfileDataFromForm();
    QRSmart.renderProfile(data, getElement("livePreview"), { preview: true });
    const count = QRSmart.getActiveLinks(QRSmart.sanitizeProfileData(data)).length;
    getElement("activeCountPill").textContent = `${count} ${count === 1 ? "رابط" : "روابط"}`;
    updatePlatformVisuals();
  }

  function showValidation(errors) {
    const box = getElement("validationBox");
    if (!errors.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = `<ul>${errors.map((error) => `<li>${QRSmart.escapeHTML(error)}</li>`).join("")}</ul>`;
  }

  function fillFormFromData(data) {
    const profile = QRSmart.sanitizeProfileData(data || {});
    getElement("titleInput").value = profile.title || "";
    getElement("descriptionInput").value = profile.description || "";
    getElement("logoUrlInput").value = profile.logoUrl || "";
    getElement("primaryColorInput").value = profile.primaryColor || "#2563EB";
    getElement("backgroundColorInput").value = profile.backgroundColor || "#F8FAFC";
    getElement("themeInput").value = profile.theme || "modern";

    window.SOCIAL_PLATFORMS.forEach((platform) => {
      const link = (profile.links || []).find((item) => item.type === platform.type);
      const input = document.querySelector(`[data-social-value="${platform.type}"]`);
      const active = document.querySelector(`[data-social-active="${platform.type}"]`);
      input.value = link ? link.value || "" : "";
      active.checked = Boolean(link && link.active && link.value);
    });

    state.customLinks = (profile.links || [])
      .filter((item) => item.type === "custom")
      .map((item) => ({
        label: item.label || "",
        value: item.value || "",
        icon: item.icon || "link"
      }));

    renderCustomLinks();
    renderLivePreview();
  }

  function handleGenerate(event) {
    event.preventDefault();
    const data = QRSmart.sanitizeProfileData(getProfileDataFromForm());
    const validation = QRSmart.validateProfileData(data);
    showValidation(validation.errors);

    if (!validation.valid) {
      QRSmart.showToast("راجع البيانات المطلوبة قبل إنشاء QR.", "error");
      return;
    }

    const url = QRSmart.generateProfileUrl(data);
    state.lastProfileUrl = url;

    const qrReady = QRSmart.generateQRCode(url, getElement("qrCode"));
    getElement("qrResult").hidden = false;
    getElement("profileUrlOutput").value = url;
    getElement("openProfileBtn").href = url;

    const warning = getElement("qrWarning");
    warning.hidden = url.length <= 1800;
    warning.textContent = "البيانات كثيرة وقد يصبح QR صعب القراءة. حاول تقليل عدد الروابط أو حذف اللوجو.";

    if (qrReady) {
      const record = QRSmart.saveDraftToLocalStorage(data, url, state.currentDraftId);
      state.currentDraftId = record.id;
      QRSmart.showToast("تم إنشاء QR Code وحفظ الصفحة محليًا.", "success");
    }
  }

  function saveDraftOnly() {
    const data = QRSmart.sanitizeProfileData(getProfileDataFromForm());
    if (!data.title) {
      QRSmart.showToast("اكتب اسم الصفحة قبل حفظ المسودة.", "error");
      return;
    }
    const url = QRSmart.generateProfileUrl(data);
    const record = QRSmart.saveDraftToLocalStorage(data, url, state.currentDraftId);
    state.currentDraftId = record.id;
    QRSmart.showToast("تم حفظ المسودة على هذا الجهاز.", "success");
  }

  function setupEvents() {
    getElement("profileForm").addEventListener("submit", handleGenerate);

    document.addEventListener("input", (event) => {
      const socialInput = event.target.closest("[data-social-value]");
      if (socialInput) {
        const type = socialInput.dataset.socialValue;
        const active = document.querySelector(`[data-social-active="${type}"]`);
        if (socialInput.value.trim()) active.checked = true;
        if (!socialInput.value.trim()) active.checked = false;
      }

      const customField = event.target.closest("[data-custom-field]");
      if (customField) {
        const card = event.target.closest(".custom-card");
        const index = Number(card.dataset.index);
        state.customLinks[index][customField.dataset.customField] = customField.value;
      }

      renderLivePreview();
    });

    document.addEventListener("change", (event) => {
      const activeInput = event.target.closest("[data-social-active]");
      if (activeInput) renderLivePreview();

      const customField = event.target.closest("[data-custom-field]");
      if (customField) {
        const card = event.target.closest(".custom-card");
        const index = Number(card.dataset.index);
        state.customLinks[index][customField.dataset.customField] = customField.value;
        renderLivePreview();
      }
    });

    document.addEventListener("click", (event) => {
      const clear = event.target.closest("[data-clear-social]");
      if (clear) {
        const type = clear.dataset.clearSocial;
        document.querySelector(`[data-social-value="${type}"]`).value = "";
        document.querySelector(`[data-social-active="${type}"]`).checked = false;
        renderLivePreview();
      }

      const deleteCustom = event.target.closest("[data-delete-custom]");
      if (deleteCustom) {
        state.customLinks.splice(Number(deleteCustom.dataset.deleteCustom), 1);
        renderCustomLinks();
        renderLivePreview();
      }
    });

    getElement("addCustomLinkBtn").addEventListener("click", () => {
      state.customLinks.push({ label: "", value: "", icon: "link" });
      renderCustomLinks();
      renderLivePreview();
    });

    getElement("saveDraftBtn").addEventListener("click", saveDraftOnly);

    getElement("exportJsonBtn").addEventListener("click", () => {
      QRSmart.exportJSON(QRSmart.sanitizeProfileData(getProfileDataFromForm()));
      QRSmart.showToast("تم تحميل ملف JSON.", "success");
    });

    getElement("importJsonInput").addEventListener("change", (event) => {
      QRSmart.importJSON(event.target.files[0])
        .then((data) => {
          fillFormFromData(data);
          QRSmart.showToast("تم استيراد البيانات بنجاح.", "success");
        })
        .catch((error) => QRSmart.showToast(error.message, "error"))
        .finally(() => {
          event.target.value = "";
        });
    });

    getElement("downloadQrBtn").addEventListener("click", () => QRSmart.downloadQRCode("qr-smart-links.png"));

    getElement("copyUrlBtn").addEventListener("click", () => {
      const value = getElement("profileUrlOutput").value;
      if (!value) return;
      QRSmart.copyToClipboard(value).then(() => QRSmart.showToast("تم نسخ الرابط.", "success"));
    });

    getElement("shareUrlBtn").addEventListener("click", () => {
      const value = getElement("profileUrlOutput").value;
      if (!value) return;
      if (navigator.share) {
        navigator.share({
          title: getElement("titleInput").value || "QR Smart Links",
          text: "رابط صفحة الروابط",
          url: value
        }).catch(() => {});
      } else {
        QRSmart.copyToClipboard(value).then(() => QRSmart.showToast("المشاركة غير مدعومة هنا، تم نسخ الرابط.", "success"));
      }
    });
  }

  function loadInitialDraft() {
    const params = new URLSearchParams(window.location.search);
    const draftId = params.get("draft");
    if (!draftId) return false;
    const draft = QRSmart.getDraftById(draftId);
    if (!draft) {
      QRSmart.showToast("لم يتم العثور على المسودة المطلوبة.", "error");
      return false;
    }
    state.currentDraftId = draft.id;
    fillFormFromData(draft.data);
    QRSmart.showToast("تم تحميل المسودة للتعديل.", "success");
    return true;
  }

  function init() {
    if (document.body.dataset.page !== "create") return;
    renderSocialInputs();
    renderCustomLinks();
    setupEvents();
    if (!loadInitialDraft()) {
      renderLivePreview();
    }
  }

  QRSmart.renderSocialInputs = renderSocialInputs;
  QRSmart.renderLivePreview = renderLivePreview;
  window.QRSmart = QRSmart;

  document.addEventListener("DOMContentLoaded", init);
})();
