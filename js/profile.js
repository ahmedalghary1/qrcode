(function () {
  "use strict";

  function renderError(message) {
    const root = document.getElementById("profileRoot");
    root.innerHTML = `
      <section class="profile-error">
        <div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h1>تعذر فتح صفحة الروابط</h1>
          <p>${window.QRSmart.escapeHTML(message)}</p>
        </div>
      </section>
    `;
  }

  function initProfile() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("data");
    if (!encoded) {
      renderError("الرابط لا يحتوي على بيانات profile.html?data=...");
      return;
    }

    const data = window.QRSmart.decodeProfileData(encoded);
    if (!data) {
      renderError("البيانات داخل الرابط غير صالحة أو تعذر فك ترميزها.");
      return;
    }

    const root = document.getElementById("profileRoot");
    const cleanData = window.QRSmart.sanitizeProfileData(data);
    document.title = `${cleanData.title || "صفحة روابط"} | QR Smart Links`;
    window.QRSmart.renderProfile(cleanData, root);
  }

  document.addEventListener("DOMContentLoaded", initProfile);
})();
