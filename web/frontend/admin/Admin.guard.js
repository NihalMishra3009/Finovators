    (function () {
      try {
        const token = (localStorage.getItem("gigbit_admin_token") || "").trim();
        const gateTs = Number(localStorage.getItem("gigbit_admin_gate_ts") || "0");
        const gateFresh = Number.isFinite(gateTs) && (Date.now() - gateTs) < 60 * 1000;
        if (token) {
          document.documentElement.classList.add("has-admin-token");
          return;
        }
        if (!gateFresh) {
          window.location.replace("../landing/Landing.html");
        }
      } catch (_) {}
    })();
  

