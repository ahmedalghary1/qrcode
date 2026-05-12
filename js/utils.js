(function () {
  "use strict";

  const QRSmart = window.QRSmart || {};
  const STORAGE_PREFIX = "qrsmart.";

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    if (/^(https?:)?\/\//i.test(trimmed)) {
      return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
    }
    if (/^(mailto:|tel:|sms:|whatsapp:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function normalizePhone(phone, options) {
    const value = String(phone || "").trim();
    const keepPlus = options && options.keepPlus;
    const cleaned = value.replace(/[^\d+]/g, "");
    if (!keepPlus) return cleaned.replace(/\+/g, "");
    return cleaned.replace(/(?!^)\+/g, "");
  }

  function isValidUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(normalizeUrl(url));
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (error) {
      return false;
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || "").trim());
  }

  function getPlatformConfig(type) {
    return (window.SOCIAL_PLATFORMS || []).find((platform) => platform.type === type) || null;
  }

  function getCustomIconConfig(iconKey) {
    return (window.CUSTOM_ICON_OPTIONS || []).find((item) => item.value === iconKey) || window.CUSTOM_ICON_OPTIONS[0];
  }

  function getIconClass(link) {
    const platform = getPlatformConfig(link.type);
    if (platform) return platform.icon;
    if (link.type === "custom") return getCustomIconConfig(link.icon || "link").icon;
    return "fa-solid fa-link";
  }

  function buildSocialLink(type, value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "";
    if (type === "whatsapp") return `https://wa.me/${normalizePhone(trimmed)}`;
    if (type === "phone") return `tel:${normalizePhone(trimmed, { keepPlus: true })}`;
    if (type === "email") return `mailto:${trimmed}`;
    return normalizeUrl(trimmed);
  }

  function getActiveLinks(data) {
    return (data.links || []).filter((link) => link && link.active && String(link.value || "").trim());
  }

  function validateProfileData(data) {
    const errors = [];
    const activeLinks = getActiveLinks(data);

    if (!String(data.title || "").trim()) {
      errors.push("اكتب اسم الشخص أو النشاط التجاري.");
    }

    if (!activeLinks.length) {
      errors.push("أضف رابطًا واحدًا نشطًا على الأقل.");
    }

    if (data.logoUrl && !isValidUrl(data.logoUrl)) {
      errors.push("رابط اللوجو غير صحيح.");
    }

    activeLinks.forEach((link) => {
      const label = link.label || "رابط";
      const platform = getPlatformConfig(link.type);
      const kind = link.valueKind || (platform && platform.valueKind) || (link.type === "email" ? "email" : "url");

      if (kind === "email" && !isValidEmail(link.value)) {
        errors.push(`البريد الإلكتروني في ${label} غير صحيح.`);
      }

      if (kind === "phone" && normalizePhone(link.value).length < 5) {
        errors.push(`رقم ${label} قصير أو غير صحيح.`);
      }

      if (kind === "url" && !isValidUrl(link.value)) {
        errors.push(`الرابط في ${label} غير صحيح.`);
      }

      if (link.type === "custom" && !String(link.label || "").trim()) {
        errors.push("كل رابط مخصص يحتاج إلى اسم واضح.");
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  const TYPE_TO_CODE = {
    whatsapp: "w",
    instagram: "ig",
    tiktok: "tt",
    facebook: "fb",
    youtube: "yt",
    snapchat: "sc",
    linkedin: "li",
    twitter: "x",
    telegram: "tg",
    pinterest: "pt",
    website: "web",
    phone: "ph",
    email: "em",
    location: "map",
    "custom-single": "cs",
    custom: "c"
  };

  const CODE_TO_TYPE = Object.keys(TYPE_TO_CODE).reduce((result, type) => {
    result[TYPE_TO_CODE[type]] = type;
    return result;
  }, {});

  function packProfileData(data) {
    const profile = sanitizeProfileData(data || {});
    const packed = {
      v: 2,
      t: profile.title
    };

    if (profile.description) packed.d = profile.description;
    if (profile.logoUrl) packed.g = profile.logoUrl;
    if (profile.primaryColor && profile.primaryColor !== "#2563EB") packed.p = profile.primaryColor;
    if (profile.backgroundColor && profile.backgroundColor !== "#F8FAFC") packed.b = profile.backgroundColor;
    if (profile.theme && profile.theme !== "modern") packed.h = profile.theme;

    packed.l = getActiveLinks(profile).map((link) => {
      const platform = getPlatformConfig(link.type);
      const typeCode = TYPE_TO_CODE[link.type] || link.type;
      const item = [typeCode, link.value];
      if (link.type === "custom") {
        item.push(link.label || "رابط مخصص");
        item.push(link.icon || "link");
      } else if (platform && link.label && link.label !== platform.label) {
        item.push(link.label);
      }
      return item;
    });

    return packed;
  }

  function unpackProfileData(data) {
    if (!data || data.v !== 2 || !Array.isArray(data.l)) return data;

    return {
      title: data.t || "",
      description: data.d || "",
      logoUrl: data.g || "",
      primaryColor: data.p || "#2563EB",
      backgroundColor: data.b || "#F8FAFC",
      theme: data.h || "modern",
      links: data.l.map((item) => {
        const type = CODE_TO_TYPE[item[0]] || item[0];
        const platform = getPlatformConfig(type);
        const label = type === "custom" ? item[2] : (item[2] || (platform && platform.label) || "رابط");
        return {
          type,
          label,
          value: item[1] || "",
          active: true,
          icon: type === "custom" ? (item[3] || "link") : "",
          valueKind: (platform && platform.valueKind) || (type === "email" ? "email" : "url")
        };
      })
    };
  }

  function stringToBase64Url(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      const chunk = bytes.subarray(index, index + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToString(value) {
    const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeProfileData(data) {
    const json = JSON.stringify(packProfileData(data));
    if (window.LZString && typeof window.LZString.compressToEncodedURIComponent === "function") {
      return `lz.${window.LZString.compressToEncodedURIComponent(json)}`;
    }
    return `b64.${stringToBase64Url(json)}`;
  }

  function decodeProfileData(encoded) {
    const value = String(encoded || "").trim();
    if (!value) return null;

    if (value.startsWith("lz.") && window.LZString) {
      return unpackProfileData(safeJsonParse(window.LZString.decompressFromEncodedURIComponent(value.slice(3))));
    }

    if (value.startsWith("b64.")) {
      return unpackProfileData(safeJsonParse(base64UrlToString(value.slice(4))));
    }

    if (window.LZString) {
      const lzResult = unpackProfileData(safeJsonParse(window.LZString.decompressFromEncodedURIComponent(value)));
      if (lzResult) return lzResult;
    }

    try {
      return unpackProfileData(safeJsonParse(base64UrlToString(value)));
    } catch (error) {
      return unpackProfileData(safeJsonParse(decodeURIComponent(value)));
    }
  }

  function generateProfileUrl(data) {
    const encoded = encodeProfileData(data);
    const url = new URL("profile.html", window.location.href);
    url.searchParams.set("data", encoded);
    return url.href;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return Promise.resolve();
  }

  function showToast(message, type) {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type || ""}`.trim();
    toast.textContent = message;
    root.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
    }, 3200);
  }

  function createObjectUrlDownload(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJSON(data) {
    const safeTitle = String(data.title || "qr-profile")
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "") || "qr-profile";
    createObjectUrlDownload(`${safeTitle}.json`, JSON.stringify(data, null, 2), "application/json;charset=utf-8");
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("لم يتم اختيار ملف."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const data = safeJsonParse(reader.result);
        if (!data || typeof data !== "object") {
          reject(new Error("ملف JSON غير صالح."));
          return;
        }
        resolve(data);
      };
      reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
      reader.readAsText(file, "utf-8");
    });
  }

  function sanitizeProfileData(data) {
    const copy = {
      title: String(data.title || "").trim(),
      description: String(data.description || "").trim(),
      logoUrl: data.logoUrl ? normalizeUrl(data.logoUrl) : "",
      primaryColor: data.primaryColor || "#2563EB",
      backgroundColor: data.backgroundColor || "#F8FAFC",
      theme: data.theme || "modern",
      links: []
    };

    (data.links || []).forEach((link) => {
      if (!link) return;
      const platform = getPlatformConfig(link.type);
      const valueKind = link.valueKind || (platform && platform.valueKind) || (link.type === "email" ? "email" : "url");
      let value = String(link.value || "").trim();
      if (valueKind === "phone") value = normalizePhone(value, { keepPlus: link.type === "phone" });
      if (valueKind === "url") value = normalizeUrl(value);
      copy.links.push({
        type: link.type || "custom",
        label: String(link.label || (platform && platform.label) || "رابط").trim(),
        value,
        active: Boolean(link.active),
        icon: link.icon || "",
        valueKind
      });
    });

    return copy;
  }

  function renderProfile(data, container, options) {
    if (!container) return;
    const profile = sanitizeProfileData(data || {});
    const activeLinks = getActiveLinks(profile);
    const preview = options && options.preview;
    const title = profile.title || "اسم الصفحة";
    const description = profile.description || "وصف قصير يظهر هنا";
    const primary = profile.primaryColor || "#2563EB";
    const background = profile.backgroundColor || "#F8FAFC";
    const theme = profile.theme || "modern";
    const logo = profile.logoUrl
      ? `<img class="profile-logo" src="${escapeHTML(profile.logoUrl)}" alt="${escapeHTML(title)}" onerror="this.replaceWith(window.QRSmart.profileLogoFallback())">`
      : '<div class="profile-logo-fallback"><i class="fa-solid fa-user"></i></div>';

    const linksHtml = activeLinks.length
      ? activeLinks.map((link) => {
        const href = preview ? "#" : buildSocialLink(link.type, link.value);
        const icon = getIconClass(link);
        const target = link.type === "phone" || link.type === "email" ? "" : ' target="_blank" rel="noopener"';
        const actionIcon = link.type === "phone" ? "fa-solid fa-phone" : link.type === "email" ? "fa-solid fa-paper-plane" : "fa-solid fa-arrow-up-right-from-square";
        return `
          <a class="profile-link-button" href="${escapeHTML(href)}"${preview ? ' tabindex="-1" aria-disabled="true" onclick="return false;"' : target}>
            <span class="profile-link-main">
              <i class="${escapeHTML(icon)}"></i>
              <span>${escapeHTML(link.label)}</span>
            </span>
            <i class="${actionIcon}"></i>
          </a>
        `;
      }).join("")
      : '<div class="empty-state small"><i class="fa-solid fa-link"></i><span>ستظهر الروابط المفعلة هنا.</span></div>';

    container.innerHTML = `
      <div class="profile-surface theme-${escapeHTML(theme)}" style="--profile-primary: ${escapeHTML(primary)}; --profile-bg: ${escapeHTML(background)};">
        <div class="profile-card-inner">
          <div class="profile-brand-area">
            ${logo}
            <h1>${escapeHTML(title)}</h1>
            <p>${escapeHTML(description)}</p>
          </div>
          <div class="profile-links">
            ${linksHtml}
          </div>
          <div class="profile-footer-note">تم إنشاؤها بواسطة QR Smart Links</div>
        </div>
      </div>
    `;
  }

  function profileLogoFallback() {
    const fallback = document.createElement("div");
    fallback.className = "profile-logo-fallback";
    fallback.innerHTML = '<i class="fa-solid fa-user"></i>';
    return fallback;
  }

  QRSmart.STORAGE_PREFIX = STORAGE_PREFIX;
  QRSmart.escapeHTML = escapeHTML;
  QRSmart.normalizeUrl = normalizeUrl;
  QRSmart.normalizePhone = normalizePhone;
  QRSmart.isValidUrl = isValidUrl;
  QRSmart.isValidEmail = isValidEmail;
  QRSmart.getPlatformConfig = getPlatformConfig;
  QRSmart.getCustomIconConfig = getCustomIconConfig;
  QRSmart.getIconClass = getIconClass;
  QRSmart.buildSocialLink = buildSocialLink;
  QRSmart.getActiveLinks = getActiveLinks;
  QRSmart.validateProfileData = validateProfileData;
  QRSmart.packProfileData = packProfileData;
  QRSmart.unpackProfileData = unpackProfileData;
  QRSmart.encodeProfileData = encodeProfileData;
  QRSmart.decodeProfileData = decodeProfileData;
  QRSmart.generateProfileUrl = generateProfileUrl;
  QRSmart.copyToClipboard = copyToClipboard;
  QRSmart.showToast = showToast;
  QRSmart.exportJSON = exportJSON;
  QRSmart.importJSON = importJSON;
  QRSmart.sanitizeProfileData = sanitizeProfileData;
  QRSmart.renderProfile = renderProfile;
  QRSmart.profileLogoFallback = profileLogoFallback;

  window.QRSmart = QRSmart;
})();
