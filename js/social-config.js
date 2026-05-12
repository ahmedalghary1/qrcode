(function () {
  "use strict";

  const SOCIAL_PLATFORMS = [
    {
      type: "whatsapp",
      label: "واتساب",
      icon: "fa-brands fa-whatsapp",
      placeholder: "اكتب رقم واتساب مثل 201000000000",
      inputType: "tel",
      color: "#25D366",
      valueKind: "phone"
    },
    {
      type: "instagram",
      label: "إنستجرام",
      icon: "fa-brands fa-instagram",
      placeholder: "ضع رابط حساب إنستجرام",
      inputType: "url",
      color: "#E4405F",
      valueKind: "url"
    },
    {
      type: "tiktok",
      label: "تيك توك",
      icon: "fa-brands fa-tiktok",
      placeholder: "https://tiktok.com/@username",
      inputType: "url",
      color: "#111827",
      valueKind: "url"
    },
    {
      type: "facebook",
      label: "فيسبوك",
      icon: "fa-brands fa-facebook-f",
      placeholder: "https://facebook.com/username",
      inputType: "url",
      color: "#1877F2",
      valueKind: "url"
    },
    {
      type: "youtube",
      label: "يوتيوب",
      icon: "fa-brands fa-youtube",
      placeholder: "https://youtube.com/@channel",
      inputType: "url",
      color: "#FF0000",
      valueKind: "url"
    },
    {
      type: "snapchat",
      label: "سناب شات",
      icon: "fa-brands fa-snapchat",
      placeholder: "https://snapchat.com/add/username",
      inputType: "url",
      color: "#FACC15",
      valueKind: "url"
    },
    {
      type: "linkedin",
      label: "لينكدإن",
      icon: "fa-brands fa-linkedin-in",
      placeholder: "https://linkedin.com/in/username",
      inputType: "url",
      color: "#0A66C2",
      valueKind: "url"
    },
    {
      type: "twitter",
      label: "X / Twitter",
      icon: "fa-brands fa-x-twitter",
      placeholder: "https://x.com/username",
      inputType: "url",
      color: "#111827",
      valueKind: "url"
    },
    {
      type: "telegram",
      label: "تيليجرام",
      icon: "fa-brands fa-telegram",
      placeholder: "https://t.me/username",
      inputType: "url",
      color: "#26A5E4",
      valueKind: "url"
    },
    {
      type: "pinterest",
      label: "بينترست",
      icon: "fa-brands fa-pinterest-p",
      placeholder: "https://pinterest.com/username",
      inputType: "url",
      color: "#E60023",
      valueKind: "url"
    },
    {
      type: "website",
      label: "الموقع الإلكتروني",
      icon: "fa-solid fa-globe",
      placeholder: "https://example.com",
      inputType: "url",
      color: "#2563EB",
      valueKind: "url"
    },
    {
      type: "phone",
      label: "الهاتف",
      icon: "fa-solid fa-phone",
      placeholder: "اكتب رقم الهاتف",
      inputType: "tel",
      color: "#10B981",
      valueKind: "phone"
    },
    {
      type: "email",
      label: "البريد الإلكتروني",
      icon: "fa-solid fa-envelope",
      placeholder: "example@email.com",
      inputType: "email",
      color: "#F97316",
      valueKind: "email"
    },
    {
      type: "location",
      label: "الموقع الجغرافي",
      icon: "fa-solid fa-location-dot",
      placeholder: "ضع رابط Google Maps",
      inputType: "url",
      color: "#EF4444",
      valueKind: "url"
    },
    {
      type: "custom-single",
      label: "رابط مخصص",
      icon: "fa-solid fa-link",
      placeholder: "https://example.com/page",
      inputType: "url",
      color: "#7C3AED",
      valueKind: "url"
    }
  ];

  const CUSTOM_ICON_OPTIONS = [
    { value: "link", label: "Link", icon: "fa-solid fa-link" },
    { value: "store", label: "Store", icon: "fa-solid fa-store" },
    { value: "menu", label: "Menu", icon: "fa-solid fa-utensils" },
    { value: "booking", label: "Booking", icon: "fa-regular fa-calendar-check" },
    { value: "portfolio", label: "Portfolio", icon: "fa-solid fa-briefcase" },
    { value: "app", label: "App", icon: "fa-solid fa-mobile-screen-button" },
    { value: "file", label: "File", icon: "fa-regular fa-file-lines" }
  ];

  window.SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;
  window.CUSTOM_ICON_OPTIONS = CUSTOM_ICON_OPTIONS;
})();
