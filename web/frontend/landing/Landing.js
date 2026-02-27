    const dict = {
      en: {
        aboutK: "About",
        aboutT: "Built For India’s Gig Worker Economy",
        aboutD: "GigBit combines earnings tracking, benefits, support, and tax readiness into one worker-first platform. The app is designed to reduce financial stress and make daily operations clear, fast, and reliable.",
        everythingK: "Everything Workers Need In One Place",
        title: "Financial Platform<br>For Gig Workers",
        lead: "Track earnings, trips, expenses, withdrawals, plans, and tax-ready summaries in one secure ecosystem.",
        adminBtn: "Admin Access",
        apkBtn: "Download APK",
        apkBtnAlt: "Download For iOS",
        apkBtn2: "Get Latest Android APK",
        s1: "Active Platform Integrations",
        s2: "Subscription Tiers",
        s3: "Built For",
        s3v: "Workers",
        p1: "Zomato",
        p3: "Blinkit",
        p4: "Rapido",
        p6: "Ola",
        plan1: "Solo",
        plan2: "Duo",
        plan3: "Trio",
        plan1d: "Rs 299 / Month • Up To 1 Platform",
        plan2d: "Rs 399 / Month • Up To 2 Platforms",
        plan3d: "Rs 499 / Month • Up To 3 Platforms",
        viewDetails1: "View Details",
        viewDetails2: "View Details",
        rTitle: "Everything Workers Need In One Place",
        r1t: "Platform Integrations",
        r1d: "Connect Zomato, Blinkit, Rapido, and Ola with one flow.",
        r2t: "Smart Expense + Tax",
        r2d: "Daily fuel/rent tracking plus tax-ready summaries for fast filing.",
        r3t: "Plans, Insurance, Withdrawals",
        r3d: "Manage limits, benefits, support tickets, and withdrawal history.",
        b1: "Real Time Platform Sync",
        b2: "Unified Expense Tracker",
        b3: "Tax Assistant + ITR Summary",
        b4: "Admin Controlled Integrations",
        featuresK: "Features",
        featuresT: "Detailed Worker Features",
        f1t: "Loan Benefits",
        f1d: "Eligible users can apply for loans in-app, track approval stages, and see clear repayment context.",
        f2t: "GigBit Insurance",
        f2d: "Opt-in insurance support with monthly contribution logic and admin claim approvals.",
        f3t: "Instant Withdrawals",
        f3d: "Withdrawable balance is shown clearly with transaction history and admin withdrawal tracking.",
        f4t: "Tax Chatbot Assistance",
        f4d: "Tax assistant supports queries about platform earnings, tax basics, and ITR-ready summaries.",
        f5t: "Help And Support",
        f5d: "Raise tickets, check status updates, and access support channels from within the app.",
        f6t: "Smart Subscription Plans",
        f6d: "Solo, Duo, and Trio plans control platform integration limits with clear expiry tracking.",
        howK: "How GigBit Works",
        wTitle: "How GigBit Works",
        w1t: "Download And Register",
        w1d: "Install the Android app, verify your email, and create your worker profile.",
        w2t: "Purchases Subscription Plans",
        w2d: "Purchase Solo, Duo, or Trio subscription plan, then connect platform.",
        w3t: "Sync Trips And Earnings",
        w3d: "Track platform earnings, completed trips, and real expenses in one dashboard.",
        w4t: "Withdraw And File Tax",
        w4d: "Withdraw balance, use support features, and generate ITR-ready summaries.",
        copyrightTxt: "Copyright © 2026 GigBit Technologies. All Rights Reserved.",
        contactTitle: "Contact",
        contactEmail: "support@gigbit.app",
        contactPhone: "Helpline: +91 90000 00000",
        contactWhatsApp: "WhatsApp: +91 90000 00000"
      },
      hi: {},
      mr: {}
    };

    dict.hi = { ...dict.en, adminBtn: "एडमिन एक्सेस", apkBtn: "APK डाउनलोड", apkBtnAlt: "iOS के लिए डाउनलोड", apkBtn2: "नवीनतम Android APK", contactTitle: "संपर्क" };
    dict.mr = { ...dict.en, adminBtn: "अ‍ॅडमिन ऍक्सेस", apkBtn: "APK डाउनलोड", apkBtnAlt: "iOS साठी डाउनलोड", apkBtn2: "लेटेस्ट Android APK", contactTitle: "संपर्क" };

    const langBtn = document.getElementById("langBtn");
    const themeBtn = document.getElementById("themeBtn");
    const adminBtn = document.getElementById("adminBtn");
    const infoOverlay = document.getElementById("infoOverlay");
    const infoTitle = document.getElementById("infoTitle");
    const infoBody = document.getElementById("infoBody");
    const infoClose = document.getElementById("infoClose");
    let lang = localStorage.getItem("gigbit_web_lang") || "en";
    let theme = localStorage.getItem("gigbit_web_theme") || "dark";
    let platformCatalogTimer = null;
    let platformCatalogSource = null;

    function resolveApiBase() {
      const fromAdmin = (localStorage.getItem("gigbit_admin_api_base") || "").trim();
      if (/^https?:\/\/[^ ]+/i.test(fromAdmin)) return fromAdmin.replace(/\/+$/, "");
      const fromWindow = String(window.GIGBIT_API_BASE || "").trim();
      if (/^https?:\/\/[^ ]+/i.test(fromWindow)) return fromWindow.replace(/\/+$/, "");
      const fromMeta = (document.querySelector('meta[name="gigbit-api-base"]')?.getAttribute("content") || "").trim();
      if (/^https?:\/\/[^ ]+/i.test(fromMeta)) return fromMeta.replace(/\/+$/, "");
      if (location.protocol.startsWith("http")) {
        return `${location.protocol}//${location.hostname}:4000`;
      }
      return "http://127.0.0.1:4000";
    }

    async function hasValidAdminSession() {
      const token = (localStorage.getItem("gigbit_admin_token") || "").trim();
      if (!token) return false;
      try {
        const res = await fetch(`${resolveApiBase()}/admin/activity-logs?limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) return true;
      } catch (_) {}
      return false;
    }

    function fallbackLogoBySlug(slug) {
      const key = String(slug || "").toLowerCase();
      const map = {
        zomato: "./assets/platforms/zomato.png",
        blinkit: "./assets/platforms/blinkit.png",
        rapido: "./assets/platforms/rapido.png",
        ola: "./assets/platforms/ola.png"
      };
      return map[key] || "";
    }

    async function refreshPlatformCatalog() {
      const apiBase = resolveApiBase();
      try {
        const res = await fetch(`${apiBase}/platforms/catalog`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        const s1v = document.getElementById("s1v");
        if (s1v) s1v.textContent = String(items.length);

        const detailsGrid = document.getElementById("platformDetailsGrid");
        if (detailsGrid) {
          detailsGrid.innerHTML = items.map((item) => {
            const slug = String(item.slug || "").toLowerCase();
            const name = String(item.name || slug || "Platform");
            const logo = String(item.logo_url || "").trim() || fallbackLogoBySlug(slug);
            const lowerName = name.trim().toLowerCase();
            const needsLightBg = slug === "ola" || lowerName.includes("ola");
            const escapedName = name.replace(/</g, "&lt;");
            const escapedLogo = logo.replace(/"/g, "&quot;");
            return `<div class="detail-card">
              <img class="${needsLightBg ? "ola-light-bg" : ""}" src="${escapedLogo}" alt="${escapedName}" onerror="this.style.display='none'" />
              <div><b>${escapedName}</b><span>Platform</span></div>
            </div>`;
          }).join("") || `<div class="detail-card"><div><b>No Active Platform</b><span>Platform</span></div></div>`;
        }

        const r1d = document.getElementById("r1d");
        if (r1d) {
          const names = items.map((x) => String(x.name || "").trim()).filter(Boolean);
          if (names.length > 0) {
            r1d.textContent = `Connect ${names.join(", ")} with one flow.`;
          } else {
            r1d.textContent = "No platforms are active right now. Admin can enable them anytime.";
          }
        }
      } catch (_) {
        // keep landing usable if API is offline
      }
    }

    function startPlatformCatalogStream() {
      if (!("EventSource" in window)) {
        if (platformCatalogTimer) clearInterval(platformCatalogTimer);
        platformCatalogTimer = setInterval(refreshPlatformCatalog, 5000);
        return;
      }
      if (platformCatalogSource) {
        try { platformCatalogSource.close(); } catch (_) {}
      }
      const apiBase = resolveApiBase();
      platformCatalogSource = new EventSource(`${apiBase}/platforms/catalog/stream`);
      platformCatalogSource.addEventListener("platform_catalog", () => {
        refreshPlatformCatalog();
      });
      platformCatalogSource.onmessage = () => {
        refreshPlatformCatalog();
      };
      platformCatalogSource.onerror = () => {
        if (platformCatalogTimer) clearInterval(platformCatalogTimer);
        platformCatalogTimer = setInterval(refreshPlatformCatalog, 5000);
      };
    }

    function setTheme(next) {
      theme = next;
      document.body.classList.toggle("light", theme === "light");
      themeBtn.innerHTML = theme === "light"
        ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 2.8V5.2M12 18.8V21.2M21.2 12H18.8M5.2 12H2.8M18.4 5.6L16.7 7.3M7.3 16.7L5.6 18.4M18.4 18.4L16.7 16.7M7.3 7.3L5.6 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3A6.8 6.8 0 0 0 21 12.8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
      localStorage.setItem("gigbit_web_theme", theme);
    }

    function setLang(next) {
      lang = next;
      const orderLabel = { en: "EN", hi: "हि", mr: "मर" };
      langBtn.setAttribute("data-lang", orderLabel[lang] || "EN");
      localStorage.setItem("gigbit_web_lang", lang);
      const d = dict[lang] || dict.en;
      Object.keys(d).forEach((k) => {
        const el = document.getElementById(k);
        if (!el) return;
        if (k === "title") el.innerHTML = d[k];
        else el.textContent = d[k];
      });
    }

    langBtn.addEventListener("click", () => {
      const order = ["en", "hi", "mr"];
      setLang(order[(order.indexOf(lang) + 1) % order.length]);
    });
    themeBtn.addEventListener("click", () => setTheme(theme === "dark" ? "light" : "dark"));
    if (adminBtn) {
      adminBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.setItem("gigbit_admin_gate_ts", String(Date.now()));
        window.location.href = "admin.html";
      });
    }
    infoClose.addEventListener("click", () => infoOverlay.classList.remove("show"));
    infoOverlay.addEventListener("click", (e) => {
      if (e.target === infoOverlay) infoOverlay.classList.remove("show");
    });
    document.querySelectorAll(".popup-trigger").forEach((el) => {
      el.addEventListener("click", () => {
        const panel = el.querySelector(".expand-panel");
        if (!panel) return;
        infoTitle.textContent = el.getAttribute("data-popup-title") || "Details";
        infoBody.innerHTML = panel.innerHTML;
        infoOverlay.classList.add("show");
      });
    });

    setTheme(theme);
    setLang(lang);
    refreshPlatformCatalog();
    hasValidAdminSession().then((ok) => {
      if (ok) window.location.replace("admin.html");
    });
    window.addEventListener("storage", (e) => {
      if (e.key === "gigbit_platform_catalog_version") {
        refreshPlatformCatalog();
      }
    });
    if (platformCatalogTimer) clearInterval(platformCatalogTimer);
    startPlatformCatalogStream();
  
