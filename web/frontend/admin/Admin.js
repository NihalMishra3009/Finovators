    function resolveAdminApiBase() {
      const raw = localStorage.getItem("gigbit_admin_api_base") || "";
      const v = raw.trim();
      if (/^https?:\/\/[^ ]+/i.test(v)) return v.replace(/\/+$/, "");
      const fromWindow = String(window.GIGBIT_API_BASE || "").trim();
      if (/^https?:\/\/[^ ]+/i.test(fromWindow)) return fromWindow.replace(/\/+$/, "");
      const fromMeta = (document.querySelector('meta[name="gigbit-api-base"]')?.getAttribute("content") || "").trim();
      if (/^https?:\/\/[^ ]+/i.test(fromMeta)) return fromMeta.replace(/\/+$/, "");
      if (location.protocol.startsWith("http")) {
        return `${location.protocol}//${location.hostname}:4000`;
      }
      return "http://127.0.0.1:4000";
    }

    const state = {
      lang: localStorage.getItem("gigbit_web_lang") || "en",
      theme: localStorage.getItem("gigbit_web_theme") || "dark",
      token: localStorage.getItem("gigbit_admin_token") || "",
      adminUsername: localStorage.getItem("gigbit_admin_username") || "Admin",
      apiBase: resolveAdminApiBase(),
      platforms: [],
      editId: null,
      newLogoData: "",
      editLogoData: "",
      commissionMonth: "",
      notifications: [],
      gigPlatformExpanded: false,
      withdrawHistoryExpanded: false,
      loanHistoryExpanded: false,
      insuranceHistoryExpanded: false,
      deleteReqHistoryExpanded: false,
      commissionItems: [],
      withdrawRows: [],
      loanItems: [],
      claimItems: [],
      deleteReqItems: []
    };
    let commissionRefreshTimer = null;
    let warmupInFlight = null;
    let liveRefreshInFlight = false;
    const getRequestInFlight = new Map();
    const HISTORY_PREVIEW_COUNT = 3;
    const DELETE_REQ_PREVIEW_COUNT = 2;

    const dict = {
      en: {
        loginTitle: "Admin Access",
        loginDesc: "Login with username to approve requests and manage platform controls.",
        portalTitle: "Admin Operations Overview",
        portalDesc: "Monitor approvals, configure platform availability, and review financial summaries in real time.",
        loginBtn: "Login", logoutBtn: "Logout", tW1: "Total Withdrawn", tW2: "Total Registered Users", tW3: "Total Loan Amount Claimed", tW4: "Active Users",
        loanTitle: "Loan Approvals", insTitle: "Insurance Approvals", wdTitle: "Withdrawals History",
        pfTitle: "Integration Platforms", pfFormTitle: "Add / Edit Platform", enabledTxt: "Enabled", savePfBtn: "Save Platform",
        resetPfBtn: "Reset", pfColorTxt: "Logo BG Color"
      },
      hi: {
        loginTitle: "एडमिन एक्सेस",
        loginDesc: "यूज़रनेम से लॉगिन करें, रिक्वेस्ट अप्रूव करें और प्लेटफॉर्म कंट्रोल मैनेज करें।",
        portalTitle: "एडमिन ऑपरेशंस ओवरव्यू",
        portalDesc: "अप्रूवल मॉनिटर करें, प्लेटफॉर्म उपलब्धता बदलें और फाइनेंशियल सारांश देखें।",
        loginBtn: "लॉगिन", logoutBtn: "लॉगआउट", tW1: "कुल निकासी", tW2: "कुल पंजीकृत यूज़र्स", tW3: "दावा की गई कुल लोन राशि", tW4: "सक्रिय यूज़र्स",
        loanTitle: "लोन अप्रूवल", insTitle: "इंश्योरेंस अप्रूवल", wdTitle: "निकासी इतिहास",
        pfTitle: "इंटीग्रेशन प्लेटफॉर्म", pfFormTitle: "प्लेटफॉर्म जोड़ें / एडिट करें", enabledTxt: "सक्रिय", savePfBtn: "सेव करें",
        resetPfBtn: "रीसेट", pfColorTxt: "लोगो BG रंग"
      },
      mr: {
        loginTitle: "अ‍ॅडमिन ऍक्सेस",
        loginDesc: "यूजरनेमने लॉगिन करा, रिक्वेस्ट मंजूर करा आणि प्लॅटफॉर्म कंट्रोल्स व्यवस्थापित करा।",
        portalTitle: "अ‍ॅडमिन ऑपरेशन्स ओव्हरव्ह्यू",
        portalDesc: "अप्रूव्हल्स मॉनिटर करा, प्लॅटफॉर्म उपलब्धता बदला आणि फायनान्शियल सारांश पहा.",
        loginBtn: "लॉगिन", logoutBtn: "लॉगआउट", tW1: "एकूण विथड्रॉन", tW2: "एकूण नोंदणीकृत वापरकर्ते", tW3: "दावा केलेली एकूण कर्ज रक्कम", tW4: "सक्रिय वापरकर्ते",
        loanTitle: "लोन मंजुरी", insTitle: "विमा मंजुरी", wdTitle: "विथड्रॉवल इतिहास",
        pfTitle: "इंटिग्रेशन प्लॅटफॉर्म", pfFormTitle: "प्लॅटफॉर्म जोडा / एडिट करा", enabledTxt: "सक्रिय", savePfBtn: "सेव्ह",
        resetPfBtn: "रीसेट", pfColorTxt: "लोगो BG रंग"
      }
    };

    const $ = (id) => document.getElementById(id);
    const fmtRs = (n) => "Rs " + Number(n || 0).toFixed(0);
    const fmtCount = (n) => Number(n || 0).toLocaleString("en-IN");
    const fmtDateTime12 = (raw) => {
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return "-";
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };
    const fmtDateOnly = (raw) => {
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return "-";
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    };
    const safe = (v) => (v ?? "").toString();
    const hasFreshAdminGate = () => {
      const gateTs = Number(localStorage.getItem("gigbit_admin_gate_ts") || "0");
      return Number.isFinite(gateTs) && (Date.now() - gateTs) < 60 * 1000;
    };
    const prettyPlatform = (value) => String(value || "")
      .trim()
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
      .join(" ");
    const prettyReasonCode = (value) => {
      const raw = String(value || "").trim();
      if (!raw) return "-";
      return raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
        .join(" ");
    };
    const prettyInsuranceType = (value) => {
      const raw = String(value || "").trim().toLowerCase();
      if (!raw) return "-";
      if (raw === "product_damage_loss") return "Product damage/loss";
      if (raw === "vehicle_damage") return "Vehicle damage";
      return raw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((x, i) => (i === 0 ? x.charAt(0).toUpperCase() + x.slice(1).toLowerCase() : x.toLowerCase()))
        .join(" ");
    };

    function setTheme(next) {
      state.theme = next;
      document.body.classList.toggle("light", next === "light");
      $("themeBtn").innerHTML = next === "light"
        ? `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M12 2.8V5.2M12 18.8V21.2M21.2 12H18.8M5.2 12H2.8M18.4 5.6L16.7 7.3M7.3 16.7L5.6 18.4M18.4 18.4L16.7 16.7M7.3 7.3L5.6 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3A6.8 6.8 0 0 0 21 12.8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`;
      $("themeBtn").setAttribute("data-tip", next === "light" ? "Light mode" : "Dark mode");
      localStorage.setItem("gigbit_web_theme", next);
    }

    function setLang(next) {
      state.lang = next;
      const orderLabel = { en: "EN", hi: "हि", mr: "मर" };
      $("langBtn").setAttribute("data-lang", orderLabel[next] || "EN");
      $("langBtn").setAttribute("data-tip", `Language: ${orderLabel[next] || "EN"}`);
      localStorage.setItem("gigbit_web_lang", next);
      const d = dict[next] || dict.en;
      Object.keys(d).forEach((k) => { const el = $(k); if (el) el.textContent = d[k]; });
    }

    function syncThemeTooltips(root = document) {
      const nodes = (root && root.querySelectorAll) ? root.querySelectorAll("[title]") : [];
      nodes.forEach((el) => {
        const tip = String(el.getAttribute("title") || "").trim();
        if (!tip) return;
        if (!el.getAttribute("data-tip")) el.setAttribute("data-tip", tip);
        el.removeAttribute("title");
      });
    }

    function closeHeaderMenus() {
      $("notifMenu")?.classList.remove("open");
      $("profileMenu")?.classList.remove("open");
    }

    function toggleHeaderMenu(menuId) {
      const target = $(menuId);
      if (!target) return;
      const willOpen = !target.classList.contains("open");
      closeHeaderMenus();
      if (willOpen) target.classList.add("open");
    }

    function prettyAdminAction(action, details) {
      const a = String(action || "").trim().toLowerCase();
      const d = details && typeof details === "object" ? details : {};
      const platformRaw = String(d.name ?? d.slug ?? "Platform").trim();
      const platformName = platformRaw
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
        .join(" ") || "Platform";
      if (a === "platform.toggle") return d.enabled === true ? `${platformName} Enabled` : `${platformName} Disabled`;
      if (a === "platform.create") return `${platformName} Added`;
      if (a === "platform.update") return `${platformName} Edited`;
      if (a === "platform.delete") return `${platformName} Deleted`;
      if (a === "loan.status.update") {
        const s = String(d.status ?? "").trim();
        return s ? `Loan ${s.charAt(0).toUpperCase()}${s.slice(1)}` : "Loan Updated";
      }
      if (a === "insurance_claim.status.update") {
        const s = String(d.status ?? "").trim();
        return s ? `Insurance ${s.charAt(0).toUpperCase()}${s.slice(1)}` : "Insurance Updated";
      }
      if (a === "account_deletion.approve") return "Account Deletion Approved";
      if (a === "account_deletion.reject") return "Account Deletion Rejected";
      if (a === "password.reset.otp" || a === "password.change") return "Password Reset";
      return a
        .split(/[._\s]+/)
        .filter(Boolean)
        .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
        .join(" ");
    }

    function renderNotifications() {
      const items = Array.isArray(state.notifications) ? state.notifications : [];
      const list = $("notifList");
      const badge = $("notifBadge");
      if (!list || !badge) return;
      const daySel = $("notifDayFilter");
      const monthSel = $("notifMonthFilter");
      const yearSel = $("notifYearFilter");

      const years = Array.from(new Set(items.map((x) => {
        const d = x?.created_at ? new Date(x.created_at) : null;
        return d && !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : "";
      }).filter(Boolean))).sort((a, b) => Number(b) - Number(a));

      const months = Array.from(new Set(items.map((x) => {
        const d = x?.created_at ? new Date(x.created_at) : null;
        return d && !Number.isNaN(d.getTime()) ? String(d.getMonth() + 1).padStart(2, "0") : "";
      }).filter(Boolean))).sort((a, b) => Number(a) - Number(b));

      const days = Array.from(new Set(items.map((x) => {
        const d = x?.created_at ? new Date(x.created_at) : null;
        return d && !Number.isNaN(d.getTime()) ? String(d.getDate()).padStart(2, "0") : "";
      }).filter(Boolean))).sort((a, b) => Number(a) - Number(b));

      if (daySel) {
        const current = String(daySel.value || "");
        daySel.innerHTML = `<option value="">Day</option>` + days.map((d) => `<option value="${d}">${d}</option>`).join("");
        if (days.includes(current)) daySel.value = current;
      }
      if (monthSel) {
        const current = String(monthSel.value || "");
        monthSel.innerHTML = `<option value="">Month</option>` + months.map((m) => {
          const label = new Date(2000, Number(m) - 1, 1).toLocaleString(undefined, { month: "short" });
          return `<option value="${m}">${label}</option>`;
        }).join("");
        if (months.includes(current)) monthSel.value = current;
      }
      if (yearSel) {
        const current = String(yearSel.value || "");
        yearSel.innerHTML = `<option value="">Year</option>` + years.map((y) => `<option value="${y}">${y}</option>`).join("");
        if (years.includes(current)) yearSel.value = current;
      }

      const selDay = String(daySel?.value || "");
      const selMonth = String(monthSel?.value || "");
      const selYear = String(yearSel?.value || "");
      const filtered = items.filter((x) => {
        const d = x?.created_at ? new Date(x.created_at) : null;
        if (!d || Number.isNaN(d.getTime())) return false;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear());
        if (selDay && selDay !== day) return false;
        if (selMonth && selMonth !== month) return false;
        if (selYear && selYear !== year) return false;
        return true;
      });

      const total = items.length;
      badge.textContent = total > 99 ? "99+" : String(total);
      badge.style.display = total > 0 ? "inline-flex" : "none";
      list.innerHTML = filtered.length
        ? filtered.map((x) => {
            const actor = safe(x.actor_username || "admin");
            const actionText = prettyAdminAction(x.action, x.details);
            const when = fmtDateTime12(x.created_at);
            return `<div class="menu-item"><b>${actor}</b><br>${safe(actionText)}<br>${when || "-"}</div>`;
          }).join("")
        : `<div class="menu-item empty">No notifications</div>`;
    }

    function syncExpandButtons() {
      const g = $("toggleGigHistoryBtn");
      if (g) {
        g.textContent = state.gigPlatformExpanded ? "▲" : "▼";
        g.setAttribute("data-tip", state.gigPlatformExpanded ? "Show less" : "Show all");
      }
      const w = $("toggleWithdrawHistoryBtn");
      if (w) {
        w.textContent = state.withdrawHistoryExpanded ? "▲" : "▼";
        w.setAttribute("data-tip", state.withdrawHistoryExpanded ? "Show less" : "Show all");
      }
      const l = $("toggleLoanHistoryBtn");
      if (l) {
        l.textContent = state.loanHistoryExpanded ? "▲" : "▼";
        l.setAttribute("data-tip", state.loanHistoryExpanded ? "Show less" : "Show all");
      }
      const i = $("toggleInsuranceHistoryBtn");
      if (i) {
        i.textContent = state.insuranceHistoryExpanded ? "▲" : "▼";
        i.setAttribute("data-tip", state.insuranceHistoryExpanded ? "Show less" : "Show all");
      }
      const d = $("toggleDeleteReqHistoryBtn");
      if (d) {
        d.textContent = state.deleteReqHistoryExpanded ? "▲" : "▼";
        d.setAttribute("data-tip", state.deleteReqHistoryExpanded ? "Show less" : "Show all");
      }
    }

    function animateSingleSectionToggle(panelId, contentId, expandedKey, renderFn) {
      const panel = $(panelId);
      const content = $(contentId);
      const prevExpanded = !!state[expandedKey];
      const nextExpanded = !prevExpanded;
      if (!panel) {
        state[expandedKey] = nextExpanded;
        renderFn();
        return;
      }
      const prevHtml = content ? content.innerHTML : "";
      const startHeight = panel.getBoundingClientRect().height;

      state[expandedKey] = nextExpanded;
      renderFn();
      const endHeight = panel.scrollHeight;

      if (prevExpanded && !nextExpanded && content) {
        content.innerHTML = prevHtml;
        syncExpandButtons();
      }

      panel.style.height = `${startHeight}px`;
      panel.style.overflow = "hidden";
      panel.style.transition = "height 260ms ease";
      requestAnimationFrame(() => {
        panel.style.height = `${endHeight}px`;
      });
      window.setTimeout(() => {
        state[expandedKey] = nextExpanded;
        renderFn();
        panel.style.height = "";
        panel.style.overflow = "";
        panel.style.transition = "";
      }, 280);
    }

    function animateHistoryState(nextGigExpanded, nextWithdrawExpanded) {
      const gigPanel = $("gigHistoryPanel");
      const withdrawPanel = $("withdrawHistoryPanel");
      const panels = [gigPanel, withdrawPanel].filter(Boolean);
      if (!panels.length) {
        state.gigPlatformExpanded = nextGigExpanded;
        state.withdrawHistoryExpanded = nextWithdrawExpanded;
        renderCommissionGigPlatform();
        renderWithdrawTable();
        return;
      }

      const prevGigExpanded = state.gigPlatformExpanded;
      const prevWithdrawExpanded = state.withdrawHistoryExpanded;
      const gigCollapsing = prevGigExpanded && !nextGigExpanded;
      const withdrawCollapsing = prevWithdrawExpanded && !nextWithdrawExpanded;
      const prevGigHtml = $("commissionGigPlatform")?.innerHTML || "";
      const prevWithdrawHtml = $("withdrawTable")?.innerHTML || "";

      const startHeights = panels.map((p) => ({ p, h: p.getBoundingClientRect().height }));

      state.gigPlatformExpanded = nextGigExpanded;
      state.withdrawHistoryExpanded = nextWithdrawExpanded;
      renderCommissionGigPlatform();
      renderWithdrawTable();
      const endHeights = panels.map((p) => ({ p, h: p.scrollHeight }));

      // Keep collapsing panel content visible until height animation completes.
      if (gigCollapsing && $("commissionGigPlatform")) $("commissionGigPlatform").innerHTML = prevGigHtml;
      if (withdrawCollapsing && $("withdrawTable")) $("withdrawTable").innerHTML = prevWithdrawHtml;
      if (gigCollapsing || withdrawCollapsing) syncExpandButtons();

      startHeights.forEach(({ p, h }) => {
        p.style.height = `${h}px`;
        p.style.overflow = "hidden";
        p.style.transition = "height 260ms ease";
      });

      requestAnimationFrame(() => {
        endHeights.forEach(({ p, h }) => {
          p.style.height = `${h}px`;
        });
      });

      window.setTimeout(() => {
        state.gigPlatformExpanded = nextGigExpanded;
        state.withdrawHistoryExpanded = nextWithdrawExpanded;
        renderCommissionGigPlatform();
        renderWithdrawTable();
        panels.forEach((p) => {
          p.style.height = "";
          p.style.overflow = "";
          p.style.transition = "";
        });
      }, 280);
    }

    async function loadAdminActivityNotifications() {
      const out = await api("/admin/activity-logs?limit=120");
      state.notifications = Array.isArray(out.items) ? out.items : [];
      renderNotifications();
    }

    async function api(path, opts = {}) {
      const method = String(opts.method || "GET").toUpperCase();
      const isPlainGet = method === "GET" && !opts.body;
      const inflightKey = isPlainGet ? `${state.token || ""}|${path}` : "";
      if (isPlainGet && getRequestInFlight.has(inflightKey)) {
        return getRequestInFlight.get(inflightKey);
      }

      const requestPromise = (async () => {
        const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
        if (state.token) headers.Authorization = "Bearer " + state.token;
        const res = await fetch(state.apiBase + path, Object.assign({}, opts, { headers }));
        const txt = await res.text();
        const ctype = String(res.headers.get("content-type") || "").toLowerCase();
        let data = {};
        if (txt && ctype.includes("application/json")) {
          data = JSON.parse(txt);
        } else if (txt && txt.trim().startsWith("<!doctype")) {
          throw new Error("API URL is incorrect or backend is not updated");
        }
        if (!res.ok) throw new Error((data && data.message) || "Request failed");
        return data;
      })();

      if (isPlainGet) {
        getRequestInFlight.set(inflightKey, requestPromise);
        requestPromise.finally(() => getRequestInFlight.delete(inflightKey));
      }

      return requestPromise;
    }

    async function warmApi() {
      if (warmupInFlight) return warmupInFlight;
      warmupInFlight = fetch(`${state.apiBase}/health`, { cache: "no-store" })
        .catch(() => {})
        .finally(() => { warmupInFlight = null; });
      return warmupInFlight;
    }

    function showPortal(show) {
      document.documentElement.classList.toggle("has-admin-token", !!show);
      $("loginOverlay").classList.toggle("hidden", show);
      $("portalView").classList.toggle("blurred", !show);
      $("notifWrap").classList.toggle("hidden", !show);
      $("profileWrap").classList.toggle("hidden", !show);
      $("profileName").textContent = state.adminUsername || "Admin";
      if (!show) closeHeaderMenus();
      if (!show) $("editPlatformOverlay").classList.add("hidden");
      if (!show) $("profilePasswordOverlay").classList.add("hidden");
      if (!show) $("loanTermsOverlay").classList.add("hidden");
      if (!show && commissionRefreshTimer) {
        clearInterval(commissionRefreshTimer);
        commissionRefreshTimer = null;
      }
    }

    function showEditPlatform(show) {
      $("editPlatformOverlay").classList.toggle("hidden", !show);
      if (!show) {
        state.editId = null;
        state.editLogoData = "";
        $("editPfMsg").textContent = "";
      }
    }

    function showLoanTermsPopup(show) {
      $("loanTermsOverlay").classList.toggle("hidden", !show);
      if (!show) {
        $("loanTermsTitle").textContent = "Interest & Tenure";
        $("loanTermsList").innerHTML = "";
      }
    }

    async function openLoanTermsFromLoan(loanId) {
      const loan = (state.loanItems || []).find((x) => safe(x?.id) === safe(loanId));
      if (!loan) {
        showToast("Loan not found", "error", 2200);
        return;
      }
      const userName = safe(loan?.full_name || loan?.username || loan?.email || "User");
      const userId = safe(loan?.user_id);
      const storedRate = Number(loan?.annual_interest_rate || 0);
      let dynamicRate = storedRate;
      if (userId) {
        try {
          const eligibility = await api(`/admin/loan-eligibility/${encodeURIComponent(userId)}`);
          dynamicRate = Number(eligibility?.annualInterestRate ?? dynamicRate);
        } catch (_) {
          // fallback to stored loan rate
        }
      }
      const tenure = Number(loan?.tenure_months || 0);
      const monthlyPayable = Number(loan?.monthly_installment || 0);
      let repayments = [];
      try {
        const rep = await api(`/admin/loans/${encodeURIComponent(safe(loanId))}/repayments`);
        repayments = Array.isArray(rep?.schedule) ? rep.schedule : [];
      } catch (_) {
        repayments = [];
      }
      const monthLabel = (raw) => {
        const s = String(raw || "");
        const m = s.match(/^(\d{4})-(\d{2})$/);
        if (!m) return s || "-";
        const d = new Date(Number(m[1]), Number(m[2]) - 1, 1);
        return d.toLocaleString("en-IN", { month: "short", year: "numeric" });
      };
      const repaymentHtml = repayments.length
        ? repayments.map((r) => {
            const paid = String(r?.status || "").toLowerCase() === "paid";
            const paidAt = paid ? fmtDateTime12(r?.paidAt) : "";
            return `<div class="repayment-row">
              <div>${monthLabel(r?.monthLabel)}</div>
              <div class="${paid ? "repayment-status-paid" : "repayment-status-pending"}">${paid ? "Paid" : "Pending"}</div>
              <div class="repayment-paid-at">${paidAt || "-"}</div>
            </div>`;
          }).join("")
        : `<div class="muted">No repayment records found</div>`;
      $("loanTermsTitle").textContent = `${userName} - Loan Details`;
      $("loanTermsList").innerHTML = `<div class="loan-terms-grid">
        <div class="loan-terms-item">
          <div class="loan-terms-card-title">Loan Details</div>
          <div>Interest Rate: ${Number.isFinite(dynamicRate) ? `${dynamicRate.toFixed(2)}%` : "-"} | Tenure: ${tenure > 0 ? `${tenure} Months` : "-"} | Payable per month: Rs ${Number(monthlyPayable || 0).toFixed(0)}</div>
        </div>
        <div class="loan-terms-item">
          <div class="loan-terms-card-title">Repayment Status</div>
          ${repaymentHtml}
        </div>
      </div>`;
      showLoanTermsPopup(true);
    }

    function renderDocButton(kind, row) {
      const id = safe(row?.id);
      const proofUrl = safe(row?.proof_url).trim();
      if (!id) return `<button class="doc-icon-btn" type="button" disabled aria-label="No document">📄</button>`;
      if (!proofUrl) return `<button class="doc-icon-btn" type="button" disabled aria-label="No document">📄</button>`;
      return `<button class="doc-icon-btn" type="button" aria-label="Download document" onclick="downloadUploadedDoc('${kind}','${id}')">📄</button>`;
    }

    function sanitizeFilePart(value) {
      return String(value || "")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "")
        .slice(0, 60) || "user";
    }

    function detectDocExtension(proofUrl, proofName) {
      const named = String(proofName || "").trim();
      const fromName = named.includes(".") ? named.split(".").pop() : "";
      if (fromName) return fromName.toLowerCase();
      const raw = String(proofUrl || "").trim();
      if (/^data:/i.test(raw)) {
        const m = raw.match(/^data:([^;,]+)/i);
        const mime = (m && m[1] ? m[1] : "").toLowerCase();
        if (mime.includes("pdf")) return "pdf";
        if (mime.includes("png")) return "png";
        if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
        if (mime.includes("webp")) return "webp";
      }
      const clean = raw.split("?")[0].split("#")[0];
      const ix = clean.lastIndexOf(".");
      if (ix > -1 && ix < clean.length - 1) return clean.slice(ix + 1).toLowerCase();
      return "bin";
    }

    function downloadUploadedDoc(kind, id) {
      const list = kind === "loan" ? (state.loanItems || []) : (state.claimItems || []);
      const row = list.find((x) => safe(x?.id) === safe(id));
      const proofUrl = safe(row?.proof_url).trim();
      if (!proofUrl) {
        showToast("No uploaded document found", "error", 2400);
        return;
      }
      const userName = sanitizeFilePart(row?.full_name || row?.username || (safe(row?.email).split("@")[0]) || "user");
      const suffix = kind === "loan" ? "loan-document" : "insurance-document";
      const ext = detectDocExtension(proofUrl, row?.proof_name);
      const docName = `${userName}-${suffix}.${ext}`;
      const link = document.createElement("a");
      link.href = proofUrl;
      link.download = docName;
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function notifyPlatformCatalogChanged() {
      try {
        localStorage.setItem("gigbit_platform_catalog_version", String(Date.now()));
      } catch (_) {
        // ignore
      }
    }

    function showToast(message, type = "info", timeout = 2600) {
      const host = $("toastStack");
      if (!host) return;
      const node = document.createElement("div");
      node.className = `toast ${type}`;
      node.textContent = String(message || "");
      host.appendChild(node);
      const t = window.setTimeout(() => node.remove(), timeout);
      node.addEventListener("click", () => {
        window.clearTimeout(t);
        node.remove();
      });
    }

    function confirmToast(message, confirmText = "Confirm", cancelText = "Cancel") {
      return new Promise((resolve) => {
        const host = $("toastStack");
        if (!host) return resolve(false);
        const node = document.createElement("div");
        node.className = "toast warn";
        node.innerHTML = `
          <div>${String(message || "")}</div>
          <div class="toast-actions">
            <button class="btn small">${cancelText}</button>
            <button class="btn small danger">${confirmText}</button>
          </div>
        `;
        const [cancelBtn, confirmBtn] = node.querySelectorAll("button");
        const done = (val) => {
          node.remove();
          resolve(val);
        };
        cancelBtn.addEventListener("click", () => done(false));
        confirmBtn.addEventListener("click", () => done(true));
        host.appendChild(node);
      });
    }

    function isLogoBgRemoved(value) {
      const v = String(value ?? "").trim().toLowerCase();
      return v === "transparent" || v === "none" || v === "rgba(0,0,0,0)" || v === "rgba(0, 0, 0, 0)";
    }

    function fileToDataUrl(file) {
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result || ""));
        fr.onerror = () => reject(new Error("Failed to read logo file"));
        fr.readAsDataURL(file);
      });
    }

    async function login() {
      $("loginErr").style.color = "#ffb4b4";
      $("loginErr").textContent = "";
      try {
        warmApi().catch(() => {});
        const out = await api("/admin/login", {
          method: "POST",
          body: JSON.stringify({
            username: $("adminUsername").value.trim(),
            password: $("adminPass").value
          })
        });
        state.token = out.token || "";
        state.adminUsername = String(out.admin?.username || $("adminUsername").value.trim() || "Admin");
        localStorage.setItem("gigbit_admin_token", state.token);
        localStorage.setItem("gigbit_admin_username", state.adminUsername);
        localStorage.removeItem("gigbit_admin_gate_ts");
        await loadAll();
        startCommissionLiveRefresh();
        showPortal(true);
      } catch (e) {
        $("loginErr").textContent = e.message;
      }
    }

    function showForgotPassword(show) {
      $("forgotPasswordOverlay").classList.toggle("hidden", !show);
      if (!show) {
        $("forgotPwdErr").textContent = "";
        $("forgotPwdErr").style.color = "#ffb4b4";
        $("forgotOtp").value = "";
        $("forgotNewPass").value = "";
      }
    }

    async function requestAdminPasswordOtp() {
      const username = $("adminUsername").value.trim();
      if (!username) {
        $("loginErr").style.color = "#ffb4b4";
        $("loginErr").textContent = "Enter admin username first";
        return;
      }
      $("loginErr").textContent = "";
      try {
        warmApi().catch(() => {});
        await api("/admin/password/request-otp", {
          method: "POST",
          body: JSON.stringify({ username })
        });
        $("loginErr").style.color = "#92f1c9";
        $("loginErr").textContent = "OTP sent to gigbitaccess@gmail.com";
        showForgotPassword(true);
      } catch (e) {
        $("loginErr").style.color = "#ffb4b4";
        $("loginErr").textContent = e.message || "Failed";
      }
    }

    async function resetAdminPasswordWithOtp() {
      $("forgotPwdErr").style.color = "#ffb4b4";
      $("forgotPwdErr").textContent = "";
      try {
        warmApi().catch(() => {});
        await api("/admin/password/verify-otp-change", {
          method: "POST",
          body: JSON.stringify({
            username: $("adminUsername").value.trim(),
            otp: $("forgotOtp").value.trim(),
            newPassword: $("forgotNewPass").value
          })
        });
        showForgotPassword(false);
        $("loginErr").style.color = "#92f1c9";
        $("loginErr").textContent = "Password updated. Please login with new password.";
        $("adminPass").value = "";
      } catch (e) {
        $("forgotPwdErr").style.color = "#ffb4b4";
        $("forgotPwdErr").textContent = e.message || "Failed";
      }
    }

    function bindPasswordToggle(buttonId, inputId) {
      const btn = $(buttonId);
      const input = $(inputId);
      btn.addEventListener("click", () => {
        const isPwd = input.type === "password";
        input.type = isPwd ? "text" : "password";
        btn.textContent = isPwd ? "🙈" : "👁";
      });
    }

    function logout() {
      state.token = "";
      state.adminUsername = "Admin";
      localStorage.removeItem("gigbit_admin_token");
      localStorage.removeItem("gigbit_admin_username");
      localStorage.removeItem("gigbit_admin_gate_ts");
      if (commissionRefreshTimer) {
        clearInterval(commissionRefreshTimer);
        commissionRefreshTimer = null;
      }
      window.location.href = "../landing/Landing.html";
    }

    function statusPill(s) {
      const x = safe(s).toLowerCase();
      const cls = x.includes("approve") || x.includes("resolve") || x.includes("enabled")
        ? "done" : x.includes("progress") ? "progress" : "open";
      const raw = safe(s || "open").trim();
      const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : "Open";
      return `<span class="pill ${cls}">${label}</span>`;
    }

    async function loadLoans() {
      const out = await api("/admin/loans");
      const items = out.items || [];
      state.loanItems = items;
      const totalLoanAmount = items.reduce((sum, x) => sum + Number(x.amount || 0), 0);
      $("totLoans").textContent = fmtRs(totalLoanAmount);
      renderLoans();
    }

    function renderLoans() {
      const items = Array.isArray(state.loanItems) ? state.loanItems : [];
      const sorted = [...items].sort((a, b) => {
        const rank = (s) => {
          const v = String(s || "").toLowerCase();
          if (v === "rejected") return 2;
          if (v === "approved") return 1;
          return 0; // pending/open first
        };
        return rank(a?.status) - rank(b?.status);
      });
      const limited = state.loanHistoryExpanded ? sorted : sorted.slice(0, HISTORY_PREVIEW_COUNT);
      $("loanList").innerHTML = limited.length ? `
        <div class="approval-list">
          <div class="approval-head">
            <div>Name</div>
            <div>Email</div>
            <div>Amount</div>
            <div>Status</div>
            <div class="doc-col">Doc</div>
            <div>Actions</div>
          </div>
          ${limited.map((x) => `
            <div class="approval-row">
              <div><b>${safe(x.full_name || x.username || x.email || x.user_id)}</b></div>
              <div class="approval-email">${safe(x.email)}</div>
              <div>${fmtRs(x.amount)}</div>
              <div>${statusPill(x.status)}</div>
              <div class="approval-doc">${renderDocButton("loan", x)}</div>
              <div class="approval-actions">
                ${String(x.status || "").toLowerCase() === "approved"
                  ? `<button class="btn small" onclick="openLoanTermsFromLoan('${safe(x.id)}')">Details</button>`
                  : String(x.status || "").toLowerCase() === "rejected"
                    ? `<span class="pill open">Rejected</span>`
                    : `<button class="btn small primary" onclick="setLoanStatus('${x.id}','approved')">Approve</button>
                       <button class="btn small danger" onclick="setLoanStatus('${x.id}','rejected')">Reject</button>`}
              </div>
            </div>
          `).join("")}
        </div>
      ` : `<div class="muted">No records</div>`;
      syncExpandButtons();
    }

    async function loadClaims() {
      const out = await api("/admin/insurance-claims");
      state.claimItems = out.items || [];
      renderClaims();
    }

    function renderClaims() {
      const items = Array.isArray(state.claimItems) ? state.claimItems : [];
      const sorted = [...items].sort((a, b) => {
        const rank = (s) => {
          const v = String(s || "").toLowerCase();
          if (v === "rejected") return 2;
          if (v === "approved") return 1;
          return 0; // submitted/pending first
        };
        return rank(a?.status) - rank(b?.status);
      });
      const limited = state.insuranceHistoryExpanded ? sorted : sorted.slice(0, HISTORY_PREVIEW_COUNT);
      $("claimList").innerHTML = limited.length ? `
        <div class="approval-list approval-list-insurance">
          <div class="approval-head">
            <div>Name</div>
            <div>Email</div>
            <div>Amount</div>
            <div>Type</div>
            <div class="doc-col">Doc</div>
            <div>Actions</div>
          </div>
          ${limited.map((x) => `
            <div class="approval-row">
              <div><b>${safe(x.full_name || x.username || x.email || x.user_id)}</b></div>
              <div class="approval-email">${safe(x.email)}</div>
              <div>${x.amount != null ? fmtRs(x.amount) : "-"}</div>
              <div>${prettyInsuranceType(x.claim_type)}</div>
              <div class="approval-doc">${renderDocButton("insurance", x)}</div>
              <div class="approval-actions">
                ${String(x.status || "").toLowerCase() === "approved"
                  ? `<span class="pill done">Approved</span>`
                  : String(x.status || "").toLowerCase() === "rejected"
                    ? `<span class="pill open">Rejected</span>`
                    : `<button class="btn small primary" onclick="setClaimStatus('${x.id}','approved')">Approve</button>
                       <button class="btn small danger" onclick="setClaimStatus('${x.id}','rejected')">Reject</button>`}
              </div>
            </div>
          `).join("")}
        </div>
      ` : `<div class="muted">No records</div>`;
      syncExpandButtons();
    }

    async function loadWithdrawals() {
      const out = await api("/admin/withdrawals");
      const rows = out.items || [];
      state.withdrawRows = rows;
      const totals = out.totals || {};
      $("totWithdrawn").textContent = fmtRs(totals.total_withdrawn);
      $("totUsers").textContent = fmtCount(totals.total_users);
      $("totActiveUsers").textContent = fmtCount(totals.total_active_users);
      $("sharedPool").textContent = fmtRs(totals.total_insurance);
      const approvedClaims = Number(totals.approved_claims_count ?? 0);
      const claimedAmt = Number(totals.claimed_insurance_amount ?? 0);
      $("claimedPoolValue").textContent = approvedClaims > 0 ? fmtRs(claimedAmt) : "No Claims Till Now";
      renderWithdrawTable();
    }

    function renderWithdrawTable() {
      const rows = Array.isArray(state.withdrawRows) ? state.withdrawRows : [];
      const limited = state.withdrawHistoryExpanded ? rows : rows.slice(0, HISTORY_PREVIEW_COUNT);
      $("withdrawTable").innerHTML = limited.map((x) => `
        <tr>
          <td>${safe(x.full_name || x.username || x.email || x.user_id)}</td>
          <td>${safe(x.email)}</td>
          <td>${fmtRs(x.amount)}</td>
          <td>${fmtDateTime12(x.created_at)}</td>
        </tr>`).join("");
      syncExpandButtons();
    }

    async function loadCommissionShare() {
      const q = state.commissionMonth ? `?month=${encodeURIComponent(state.commissionMonth)}` : "";
      const out = await api("/admin/commission-share" + q);
      const availableMonths = Array.isArray(out.availableMonths) ? out.availableMonths.map((x) => String(x)) : [];
      if (String(out.selectedMonth || "").trim()) state.commissionMonth = String(out.selectedMonth).trim();
      syncCommissionMonthSelects(availableMonths, state.commissionMonth);
      state.commissionItems = out.items || [];
      renderCommissionGigPlatform();
      const txCharge = Number(out.transactionChargeTotal || 0);
      $("commissionTransactionCharge").textContent = fmtRs(txCharge);
      $("commissionProfit").textContent = fmtRs(Number(out.profit || 0));
    }

    function renderCommissionGigPlatform() {
      const rows = Array.isArray(state.commissionItems) ? state.commissionItems : [];
      const limited = state.gigPlatformExpanded ? rows : rows.slice(0, HISTORY_PREVIEW_COUNT);
      $("commissionGigPlatform").innerHTML = limited.length
        ? limited.map((x) => `<div class="commission-platform-line">${prettyPlatform(safe(x.platform))} : ${fmtRs(x.commission)} | ${Number(x.usersCount || 0)} Users | Start Date : ${fmtDateOnly(x.startDate)}</div>`).join("")
        : "No active plan/platform commission";
      syncExpandButtons();
    }

    async function loadDeleteRequests() {
      const [pending, approved, rejected] = await Promise.all([
        api("/admin/account-deletions?status=pending"),
        api("/admin/account-deletions?status=approved"),
        api("/admin/account-deletions?status=rejected"),
      ]);
      state.deleteReqItems = [
        ...(pending.items || []),
        ...(approved.items || []),
        ...(rejected.items || []),
      ];
      renderDeleteRequests();
    }

    function renderDeleteRequests() {
      const items = Array.isArray(state.deleteReqItems) ? state.deleteReqItems : [];
      const sorted = [...items].sort((a, b) => {
        const rank = (s) => {
          const v = String(s || "").toLowerCase();
          if (v === "rejected") return 2;
          if (v === "approved") return 1;
          return 0; // pending first
        };
        return rank(a?.status) - rank(b?.status);
      });
      const limited = state.deleteReqHistoryExpanded ? sorted : sorted.slice(0, DELETE_REQ_PREVIEW_COUNT);
      $("deleteReqList").innerHTML = limited.map((x) => `
        <div class="deletion-item">
          <div class="row" style="justify-content:space-between; align-items:flex-start; gap:10px;">
            <div style="min-width:0;"><b>${safe(x.user_email || x.user_id)}</b></div>
            <div class="deletion-meta" style="text-align:right; white-space:nowrap;">${fmtDateTime12(x.created_at)}</div>
          </div>
          <div class="row" style="justify-content:space-between; align-items:center; gap:10px; margin-top:6px;">
            <div class="deletion-meta" style="min-width:0;">${prettyReasonCode(x.reason_code)}${safe(x.reason_text) ? ` • ${safe(x.reason_text)}` : ""}</div>
            <div class="row" style="gap:6px; margin:0; flex-wrap:nowrap;">
              ${String(x.status || "").toLowerCase() === "approved"
                ? `<span class="pill done">Approved</span>`
                : String(x.status || "").toLowerCase() === "rejected"
                  ? `<span class="pill open">Rejected</span>`
                  : `<button class="btn small primary" onclick="approveDeleteReq('${safe(x.id)}')">Approve</button>
                     <button class="btn small danger" onclick="rejectDeleteReq('${safe(x.id)}')">Reject</button>`}
            </div>
          </div>
        </div>`).join("") || `<div class="muted">No pending requests</div>`;
      syncExpandButtons();
    }

    async function approveDeleteReq(id) {
      const ok = await confirmToast("Approve and permanently delete this user?", "Approve", "Cancel");
      if (!ok) return;
      await api(`/admin/account-deletions/${id}/approve`, { method: "POST", body: "{}" });
      showToast("Request approved", "success");
      await loadDeleteRequests();
    }

    async function rejectDeleteReq(id) {
      const ok = await confirmToast("Reject this deletion request?", "Reject", "Cancel");
      if (!ok) return;
      await api(`/admin/account-deletions/${id}/reject`, { method: "POST", body: "{}" });
      showToast("Request rejected", "success");
      await loadDeleteRequests();
    }

    function showProfilePassword(show) {
      $("profilePasswordOverlay").classList.toggle("hidden", !show);
      if (!show) {
        $("profileOtp").value = "";
        $("profileNewPass").value = "";
        $("profilePwdErr").textContent = "";
        $("profilePwdErr").style.color = "#ffb4b4";
      }
    }

    async function requestAdminPasswordOtpFromProfile() {
      $("profilePwdErr").style.color = "#ffb4b4";
      $("profilePwdErr").textContent = "";
      try {
        const username = String(state.adminUsername || "").trim();
        if (!username) {
          $("profilePwdErr").textContent = "Admin username not found";
          return false;
        }
        await api("/admin/password/request-otp", {
          method: "POST",
          body: JSON.stringify({ username }),
        });
        $("profilePwdErr").style.color = "#92f1c9";
        $("profilePwdErr").textContent = "OTP sent to gigbitaccess@gmail.com";
        return true;
      } catch (e) {
        $("profilePwdErr").style.color = "#ffb4b4";
        $("profilePwdErr").textContent = e.message || "Failed to send OTP";
        return false;
      }
    }

    async function verifyOtpAndUpdateAdminPasswordFromProfile() {
      $("profilePwdErr").textContent = "";
      try {
        const otp = $("profileOtp").value.trim();
        const newPassword = $("profileNewPass").value;
        const username = String(state.adminUsername || "").trim();
        if (!username || !otp || String(newPassword).length < 8) {
          $("profilePwdErr").style.color = "#ffb4b4";
          $("profilePwdErr").textContent = "Enter OTP and valid new password (min 8 chars)";
          return;
        }
        await api("/admin/password/verify-otp-change", {
          method: "POST",
          body: JSON.stringify({ username, otp, newPassword }),
        });
        showProfilePassword(false);
        showToast("Password updated successfully", "success");
      } catch (e) {
        $("profilePwdErr").style.color = "#ffb4b4";
        $("profilePwdErr").textContent = e.message || "Failed to update password";
      }
    }

    function syncCommissionMonthSelects(months, selected) {
      const ids = ["commissionMonth1", "commissionMonth2", "commissionMonth3"];
      ids.forEach((id) => {
        const el = $(id);
        if (!el) return;
        el.innerHTML = months.map((m) => `<option value="${safe(m)}">${safe(m)}</option>`).join("");
        if (selected) el.value = selected;
      });
    }

    async function onCommissionMonthChanged(value) {
      const next = String(value || "").trim();
      if (!next || next === state.commissionMonth) return;
      state.commissionMonth = next;
      syncCommissionMonthSelects(
        Array.from(new Set([
          ...Array.from($("commissionMonth1")?.options || []).map((o) => o.value),
          ...Array.from($("commissionMonth2")?.options || []).map((o) => o.value),
          ...Array.from($("commissionMonth3")?.options || []).map((o) => o.value),
        ])),
        next
      );
      await loadCommissionShare();
    }

    function startCommissionLiveRefresh() {
      if (commissionRefreshTimer) clearInterval(commissionRefreshTimer);
      commissionRefreshTimer = setInterval(() => {
        if (document.hidden) return;
        if (!state.token) return;
        if (liveRefreshInFlight) return;
        liveRefreshInFlight = true;
        Promise.all([
          loadCommissionShare().catch(() => {}),
          loadAdminActivityNotifications().catch(() => {}),
          loadWithdrawals().catch(() => {}),
          loadDeleteRequests().catch(() => {}),
          loadLoans().catch(() => {}),
          loadClaims().catch(() => {}),
        ]).finally(() => {
          liveRefreshInFlight = false;
        });
      }, 6000);
    }

    function resetPlatformForm() {
      state.newLogoData = "";
      $("pfName").value = "";
      $("pfLogo").value = "";
      $("pfMsg").textContent = "";
    }

    function localPlatformLogoBySlug(slug) {
      const s = safe(slug).toLowerCase();
      const map = {
        zomato: "./assets/platforms/zomato.png",
        blinkit: "./assets/platforms/blinkit.png",
        rapido: "./assets/platforms/rapido.png",
        ola: "./assets/platforms/ola.png"
      };
      return map[s] || "";
    }

    async function loadPlatforms() {
      const out = await api("/admin/platforms");
      state.platforms = out.items || [];
      $("platformList").innerHTML = state.platforms.map((p) => {
        const name = safe(p.name);
        const slug = safe(p.slug);
        const logoUrl = safe(p.logo_url || "") || localPlatformLogoBySlug(slug);
        const isOla = slug.trim().toLowerCase().includes("ola") || name.trim().toLowerCase().includes("ola");
        const fallback = (name || slug || "P").trim().charAt(0).toUpperCase();
        return `
        <div class="platform-card">
          <div class="platform-head">
            <div class="platform-main">
              <div class="logo-shell">
              <img class="logo" src="${logoUrl}" alt="${name}" style="${isOla ? "background:#fff; padding:2px;" : ""}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
              <span class="logo-fallback" style="display:${logoUrl ? "none" : "inline-flex"};">${fallback}</span>
              </div>
              <div>
                <div><b>${name}</b></div>
              </div>
            </div>
            <div class="platform-state">
              <button class="switch ${p.enabled ? "active" : ""}" onclick="togglePlatform('${p.id}')" data-tip="${p.enabled ? "Disable" : "Enable"}">
                <span class="knob"></span>
              </button>
            </div>
          </div>
          <div class="row platform-actions">
            <button class="btn small" onclick="editPlatform('${p.id}')">Edit</button>
            <button class="btn small danger" onclick="deletePlatform('${p.id}')">Delete</button>
          </div>
        </div>
      `;
      }).join("");
      syncThemeTooltips($("platformList"));
    }

    async function setLoanStatus(id, status) { await api(`/admin/loans/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }); await loadLoans(); }
    async function setClaimStatus(id, status) {
      try {
        await api(`/admin/insurance-claims/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
        await loadClaims();
        showToast(`Insurance ${status}`, "success");
      } catch (e) {
        showToast(e.message || "Unable to update insurance claim", "error");
      }
    }
    async function togglePlatform(id) {
      const p = state.platforms.find((x) => x.id === id);
      const nextAction = p && p.enabled ? "Disable" : "Enable";
      const ok = await confirmToast(`${nextAction} this platform?`, nextAction, "Cancel");
      if (!ok) return;
      await api(`/admin/platforms/${id}/toggle`, { method: "POST", body: "{}" });
      await loadPlatforms();
      notifyPlatformCatalogChanged();
      showToast(`Platform ${nextAction.toLowerCase()}d`, "success");
    }
    async function deletePlatform(id) {
      const ok = await confirmToast("Delete this platform?", "Delete", "Cancel");
      if (!ok) return;
      await api(`/admin/platforms/${id}`, { method: "DELETE" });
      await loadPlatforms();
      notifyPlatformCatalogChanged();
      showToast("Platform deleted", "success");
    }

    function editPlatform(id) {
      const p = state.platforms.find((x) => x.id === id);
      if (!p) return;
      state.editId = id;
      state.editLogoData = "";
      $("editPfName").value = p.name || "";
      $("editPfLogo").value = "";
      showEditPlatform(true);
    }

    async function savePlatformEditPopup() {
      if (!state.editId) return;
      const name = $("editPfName").value.trim();
      if (!name) { $("editPfMsg").textContent = "Platform name is required"; return; }
      const ok = await confirmToast("Update this platform?", "Update", "Cancel");
      if (!ok) return;
      const payload = {
        name
      };
      const editLogoFile = $("editPfLogo").files && $("editPfLogo").files[0];
      if (editLogoFile) payload.logoUrl = await fileToDataUrl(editLogoFile);
      else if (state.editLogoData) payload.logoUrl = state.editLogoData;
      await api(`/admin/platforms/${state.editId}`, { method: "PUT", body: JSON.stringify(payload) });
      showEditPlatform(false);
      await loadPlatforms();
      notifyPlatformCatalogChanged();
      showToast("Platform updated", "success");
    }

    async function savePlatform() {
      const name = $("pfName").value.trim();
      if (!name) { $("pfMsg").textContent = "Platform name is required"; return; }
      const payload = {
        name
      };
      const newLogoFile = $("pfLogo").files && $("pfLogo").files[0];
      if (newLogoFile) payload.logoUrl = await fileToDataUrl(newLogoFile);
      else if (state.newLogoData) payload.logoUrl = state.newLogoData;
      await api("/admin/platforms", { method: "POST", body: JSON.stringify(payload) });
      resetPlatformForm();
      await loadPlatforms();
      notifyPlatformCatalogChanged();
    }

    async function loadAll() {
      await Promise.all([
        loadLoans(),
        loadClaims(),
        loadWithdrawals(),
        loadCommissionShare(),
        loadDeleteRequests(),
        loadPlatforms(),
        loadAdminActivityNotifications(),
      ]);
    }

    $("loginBtn").addEventListener("click", login);
    $("forgotAdminPassBtn").addEventListener("click", requestAdminPasswordOtp);
    $("verifyForgotPwdBtn").addEventListener("click", resetAdminPasswordWithOtp);
    $("cancelForgotPwdBtn").addEventListener("click", () => showForgotPassword(false));
    $("closeForgotPwdBtn").addEventListener("click", () => showForgotPassword(false));
    $("closeLoginBtn").addEventListener("click", () => { window.location.href = "../landing/Landing.html"; });
    $("closeEditPlatformBtn").addEventListener("click", () => showEditPlatform(false));
    $("closeLoanTermsBtn").addEventListener("click", () => showLoanTermsPopup(false));
    $("cancelEditPfBtn").addEventListener("click", () => showEditPlatform(false));
    $("notifBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleHeaderMenu("notifMenu"); });
    $("profileBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleHeaderMenu("profileMenu"); });
    $("profileLogoutBtn").addEventListener("click", () => { closeHeaderMenus(); logout(); });
    $("profileResetPwdBtn").addEventListener("click", async () => {
      closeHeaderMenus();
      showProfilePassword(true);
      await requestAdminPasswordOtpFromProfile();
    });
    $("saveProfilePwdBtn").addEventListener("click", verifyOtpAndUpdateAdminPasswordFromProfile);
    $("cancelProfilePwdBtn").addEventListener("click", () => showProfilePassword(false));
    $("closeProfilePwdBtn").addEventListener("click", () => showProfilePassword(false));
    $("savePfBtn").addEventListener("click", savePlatform);
    $("saveEditPfBtn").addEventListener("click", savePlatformEditPopup);
    $("pfLogo").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { state.newLogoData = String(fr.result || ""); };
      fr.readAsDataURL(f);
    });
    $("editPfLogo").addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { state.editLogoData = String(fr.result || ""); };
      fr.readAsDataURL(f);
    });
    $("langBtn").addEventListener("click", () => {
      const order = ["en", "hi", "mr"];
      setLang(order[(order.indexOf(state.lang) + 1) % order.length]);
    });
    $("themeBtn").addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));
    $("commissionMonth1").addEventListener("change", (e) => onCommissionMonthChanged(e.target.value));
    $("commissionMonth2").addEventListener("change", (e) => onCommissionMonthChanged(e.target.value));
    $("commissionMonth3").addEventListener("change", (e) => onCommissionMonthChanged(e.target.value));
    $("toggleGigHistoryBtn").addEventListener("click", () => {
      const nextGig = !state.gigPlatformExpanded;
      const nextWithdraw = nextGig ? false : state.withdrawHistoryExpanded;
      animateHistoryState(nextGig, nextWithdraw);
    });
    $("toggleWithdrawHistoryBtn").addEventListener("click", () => {
      const nextWithdraw = !state.withdrawHistoryExpanded;
      const nextGig = nextWithdraw ? false : state.gigPlatformExpanded;
      animateHistoryState(nextGig, nextWithdraw);
    });
    $("toggleLoanHistoryBtn").addEventListener("click", () => {
      animateSingleSectionToggle("loanPanel", "loanList", "loanHistoryExpanded", renderLoans);
    });
    $("toggleInsuranceHistoryBtn").addEventListener("click", () => {
      animateSingleSectionToggle("insurancePanel", "claimList", "insuranceHistoryExpanded", renderClaims);
    });
    $("toggleDeleteReqHistoryBtn").addEventListener("click", () => {
      animateSingleSectionToggle("deleteReqPanel", "deleteReqList", "deleteReqHistoryExpanded", renderDeleteRequests);
    });
    $("notifDayFilter").addEventListener("change", renderNotifications);
    $("notifMonthFilter").addEventListener("change", renderNotifications);
    $("notifYearFilter").addEventListener("change", renderNotifications);
    bindPasswordToggle("toggleAdminLoginPwd", "adminPass");
    document.addEventListener("click", (e) => {
      const t = e.target;
      const inNotif = $("notifWrap")?.contains(t);
      const inProfile = $("profileWrap")?.contains(t);
      if (!inNotif && !inProfile) closeHeaderMenus();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.token) {
        if (liveRefreshInFlight) return;
        liveRefreshInFlight = true;
        Promise.all([
          loadCommissionShare().catch(() => {}),
          loadAdminActivityNotifications().catch(() => {}),
          loadWithdrawals().catch(() => {}),
          loadDeleteRequests().catch(() => {}),
          loadLoans().catch(() => {}),
          loadClaims().catch(() => {}),
        ]).finally(() => {
          liveRefreshInFlight = false;
        });
      }
    });
    $("loanTermsOverlay").addEventListener("click", (e) => {
      if (e.target === $("loanTermsOverlay")) showLoanTermsPopup(false);
    });

    window.setLoanStatus = setLoanStatus;
    window.setClaimStatus = setClaimStatus;
    window.approveDeleteReq = approveDeleteReq;
    window.rejectDeleteReq = rejectDeleteReq;
    window.togglePlatform = togglePlatform;
    window.deletePlatform = deletePlatform;
    window.editPlatform = editPlatform;
    window.downloadUploadedDoc = downloadUploadedDoc;
    window.openLoanTermsFromLoan = openLoanTermsFromLoan;

    setTheme(state.theme);
    setLang(state.lang);
    warmApi();
    syncThemeTooltips(document);
    syncExpandButtons();
    $("adminUsername").value = "Admin1";
    if (state.token) {
      loadAll().then(() => {
        startCommissionLiveRefresh();
        showPortal(true);
      }).catch(() => {
        localStorage.removeItem("gigbit_admin_token");
        state.token = "";
        if (hasFreshAdminGate()) showPortal(false);
        else window.location.replace("../landing/Landing.html");
      });
    } else {
      if (hasFreshAdminGate()) showPortal(false);
      else window.location.replace("../landing/Landing.html");
    }
  

