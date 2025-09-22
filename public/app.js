(function () {
  const API = (path) => `${window.API_BASE_URL || ''}${path}`;
  const $ = (id) => document.getElementById(id);

  // Nav + Tabs
  const navLogin = $("navLogin");
  const navRegister = $("navRegister");
  const navLogout = $("navLogout");
  const tabLogin = $("tabLogin");
  const tabRegister = $("tabRegister");

  // Sections
  const authSection = $("authSection");
  const appSection = $("appSection");
  const loginForm = $("loginForm");
  const registerForm = $("registerForm");
  const hello = $("hello");

  // Tasks UI
  const taskForm = $("taskForm");
  const taskTitle = $("taskTitle");
  const taskDesc = $("taskDesc");
  const tasksList = $("tasksList");
  const emptyState = $("emptyState");

  let auth = JSON.parse(localStorage.getItem("auth")) || null;

  // Helpers
  const saveAuth = (a) => { auth = a; localStorage.setItem("auth", JSON.stringify(a)); };
  const clearAuth = () => { auth = null; localStorage.removeItem("auth"); };
  const isLogged = () => !!(auth && auth.token && auth.user);
  const setActiveTab = (which) => {
    const isLogin = which === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
  };
  const escapeHtml = (s = "") =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function renderUI() {
    const logged = isLogged();
    authSection.classList.toggle("hidden", logged);
    appSection.classList.toggle("hidden", !logged);
    navLogin.classList.toggle("hidden", logged);
    navRegister.classList.toggle("hidden", logged);
    navLogout.classList.toggle("hidden", !logged);
    if (logged) hello.textContent = `Hola, ${auth.user.name}`;
  }

  async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (isLogged()) headers["Authorization"] = "Bearer " + auth.token;
    const res = await fetch(API(path), { ...opts, headers });
    let data = null;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);
    return data;
  }

  async function loadTasks() {
    if (!isLogged()) return;
    const items = await api(`/tasks/${auth.user.id}`);
    tasksList.innerHTML = "";
    if (!items.length) {
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    for (const t of items) {
      const card = document.createElement("div");
      card.className = "task";
      card.innerHTML = `
        <div>
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="desc">${escapeHtml(t.description || "")}</div>
          <div class="meta">
            <span class="badge ${t.status}">${t.status}</span>
            <small>${new Date(t.created_at).toLocaleString()}</small>
          </div>
        </div>
        <div class="row-actions">
          <button class="btn" data-act="advance" data-id="${t.id}">Avanzar</button>
        </div>
      `;

      card.querySelector('[data-act="advance"]').onclick = async () => {
        await api(`/tasks/${t.id}/status`, { method: "PUT" });
        loadTasks();
      };

      tasksList.appendChild(card);
    }
  }

  // Nav events
  navLogin.onclick = () => { setActiveTab("login"); window.scrollTo({top:0, behavior:'smooth'}); };
  navRegister.onclick = () => { setActiveTab("register"); window.scrollTo({top:0, behavior:'smooth'}); };
  navLogout.onclick = () => { clearAuth(); renderUI(); setActiveTab("login"); };

  tabLogin.onclick = () => setActiveTab("login");
  tabRegister.onclick = () => setActiveTab("register");

  // Forms
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value.trim();
    try {
      const data = await api("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
      saveAuth(data); renderUI(); await loadTasks();
    } catch (err) { alert(err.message); }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("regName").value.trim();
    const email = $("regEmail").value.trim();
    const password = $("regPassword").value.trim();
    try {
      await api("/users/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
      alert("Cuenta creada. Ahora inicia sesión.");
      setActiveTab("login");
    } catch (err) { alert(err.message); }
  });

  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    const description = taskDesc.value.trim();
    if (!title) return;
    try {
      await api("/tasks", { method: "POST", body: JSON.stringify({ title, description }) });
      taskTitle.value = ""; taskDesc.value = "";
      await loadTasks();
    } catch (err) { alert(err.message); }
  });

  // Init
  setActiveTab("login");
  renderUI();
  if (isLogged()) loadTasks();
})();
