/* ==========================================================================
   Momira Organic — account/auth (placeholder)
   Local, front-end-only "accounts" so the checkout flow can require sign-in.
   No real backend — swap for Shopify Customer Accounts / Multipass when the
   store is wired up; keep the window.Auth surface (isLoggedIn, currentUser,
   login, signup, logout, requireLogin) so callers don't need to change.
   ========================================================================== */
(function () {
  "use strict";

  const KEY_USERS = "ptree_users_v1";
  const KEY_SESSION = "ptree_session_v1";
  const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const readJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // Not cryptographic — just avoids storing raw passwords in localStorage.
  // Replaced entirely once real auth (Shopify) is in place.
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) | 0;
    return String(h >>> 0);
  }

  let session = readJSON(KEY_SESSION, null);
  let pending = null; // callback queued behind a login prompt

  function emit() {
    document.dispatchEvent(new CustomEvent("auth:change", { detail: { user: session } }));
  }

  const Auth = {
    currentUser() { return session; },
    isLoggedIn() { return !!session; },

    signup({ name, email, password }) {
      name = (name || "").trim();
      email = (email || "").trim().toLowerCase();
      password = password || "";
      if (!name) return { ok: false, error: "Enter your name." };
      if (!EMAIL_RX.test(email)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

      const users = readJSON(KEY_USERS, []);
      if (users.some((u) => u.email === email)) {
        return { ok: false, error: "An account with this email already exists — sign in instead." };
      }
      users.push({ name, email, pass: hash(password) });
      writeJSON(KEY_USERS, users);

      session = { name, email };
      writeJSON(KEY_SESSION, session);
      emit();
      return { ok: true };
    },

    login({ email, password }) {
      email = (email || "").trim().toLowerCase();
      const users = readJSON(KEY_USERS, []);
      const found = users.find((u) => u.email === email);
      if (!found || found.pass !== hash(password || "")) {
        return { ok: false, error: "Email or password is incorrect." };
      }
      session = { name: found.name, email: found.email };
      writeJSON(KEY_SESSION, session);
      emit();
      return { ok: true };
    },

    logout() {
      session = null;
      try { localStorage.removeItem(KEY_SESSION); } catch {}
      emit();
    },

    /* Run fn() now if signed in; otherwise prompt for sign-in and run fn()
       once it succeeds. `reason` lets the modal show contextual copy. */
    requireLogin(fn, reason) {
      if (session) { fn(); return; }
      pending = fn;
      document.dispatchEvent(new CustomEvent("auth:required", { detail: { reason } }));
    },
    hasPending() { return !!pending; },
    resolvePending() {
      const fn = pending; pending = null;
      if (fn) fn();
    },
    clearPending() { pending = null; },
  };

  window.Auth = Auth;
})();
