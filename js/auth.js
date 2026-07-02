(function () {
  "use strict";

  const AUTH_KEY = "qrsmart.auth.session";
  const AUTH_USER = "admin";
  const AUTH_PASSWORD_HASH = "912591460e84006508cc88bdc194ea308a37c0be603e0d0f183b4fd83eec7707";
  const SESSION_HOURS = 12;
  const script = document.currentScript;
  const mode = script && script.dataset ? script.dataset.auth : "";

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  function sha256Fallback(text) {
    const ascii = unescape(encodeURIComponent(text));
    const maxWord = Math.pow(2, 32);
    const words = [];
    const hash = [];
    const k = [];
    const isComposite = {};
    let primeCounter = 0;

    for (let candidate = 2; primeCounter < 64; candidate += 1) {
      if (!isComposite[candidate]) {
        for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
        if (primeCounter < 8) hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter += 1;
      }
    }

    let message = `${ascii}\x80`;
    while (message.length % 64 - 56) message += "\x00";

    for (let i = 0; i < message.length; i += 1) {
      words[i >> 2] |= message.charCodeAt(i) << (((3 - i) % 4) * 8);
    }
    words[words.length] = ((ascii.length * 8) / maxWord) | 0;
    words[words.length] = (ascii.length * 8) | 0;

    for (let block = 0; block < words.length;) {
      const w = words.slice(block, block += 16);
      const oldHash = hash.slice(0);

      for (let i = 0; i < 64; i += 1) {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const a = hash[0];
        const e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = i < 16 ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash.unshift((temp1 + temp2) | 0);
        hash[4] = (hash[4] + temp1) | 0;
        hash.pop();
      }

      for (let i = 0; i < 8; i += 1) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    return hash.map((value) => {
      let result = "";
      for (let i = 3; i + 1; i -= 1) {
        result += ((value >> (i * 8)) & 255).toString(16).padStart(2, "0");
      }
      return result;
    }).join("");
  }

  function hashPassword(password) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(password))
        .then(bytesToHex);
    }
    return Promise.resolve(sha256Fallback(password));
  }

  function readSession() {
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
      if (!session || !session.expiresAt || Date.now() > session.expiresAt) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      return session;
    } catch (error) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  }

  function writeSession(username) {
    const now = Date.now();
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      username,
      loginAt: now,
      expiresAt: now + SESSION_HOURS * 60 * 60 * 1000
    }));
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
  }

  function currentTarget() {
    const file = window.location.pathname.split("/").pop() || "index.html";
    if (file === "index.html") return "dashboard.html";
    return `${file}${window.location.search}${window.location.hash}`;
  }

  function safeRedirectTarget(value) {
    const target = String(value || "").trim();
    if (!target || target.startsWith("/") || target.startsWith("\\") || target.startsWith("//")) return "dashboard.html";
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.includes("\\")) return "dashboard.html";

    try {
      const url = new URL(target, window.location.href);
      const file = url.pathname.split("/").pop() || "dashboard.html";
      const allowed = ["dashboard.html", "create.html", "index.html"];
      if (!allowed.includes(file)) return "dashboard.html";
      return `${file}${url.search}${url.hash}`;
    } catch (error) {
      return "dashboard.html";
    }
  }

  function requireAuth() {
    if (readSession()) return;
    window.location.replace(`login.html?next=${encodeURIComponent(currentTarget())}`);
  }

  function setMessage(element, message) {
    if (!element) return;
    element.textContent = message || "";
    element.hidden = !message;
  }

  function setupLogoutControls() {
    document.querySelectorAll("[data-auth-user]").forEach((element) => {
      const session = readSession();
      element.textContent = session ? session.username : "";
    });

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-auth-logout]");
      if (!button) return;
      event.preventDefault();
      logout();
      window.location.href = "login.html";
    });
  }

  function setupLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const next = safeRedirectTarget(params.get("next"));
    const errorBox = document.getElementById("loginError");
    const submitButton = document.getElementById("loginSubmitBtn");

    if (readSession()) {
      window.location.replace(next);
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setMessage(errorBox, "");

      const username = document.getElementById("usernameInput").value.trim();
      const password = document.getElementById("passwordInput").value;

      if (submitButton) submitButton.disabled = true;
      hashPassword(password)
        .then((hash) => {
          if (username !== AUTH_USER || hash !== AUTH_PASSWORD_HASH) {
            setMessage(errorBox, "اسم المستخدم أو كلمة المرور غير صحيحة.");
            return;
          }
          writeSession(username);
          window.location.replace(next);
        })
        .catch(() => {
          setMessage(errorBox, "تعذر تسجيل الدخول. حاول مرة أخرى.");
        })
        .finally(() => {
          if (submitButton) submitButton.disabled = false;
        });
    });
  }

  if (mode === "required") {
    requireAuth();
  }

  window.QRSmartAuth = {
    isAuthenticated: () => Boolean(readSession()),
    logout
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupLogoutControls();
    if (mode === "login") setupLoginForm();
  });
})();
