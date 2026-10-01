(function () {
  const style = document.createElement("style");
  style.textContent = `
    #hb-toggle{position:fixed;top:16px;right:16px;z-index:1000;width:44px;height:44px;border-radius:10px;
      border:1px solid #ffffff40;background:#123e48;color:#fff;font-size:20px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.2);}
    body:not(.landing) #hb-toggle{background:#1e6870;}
    #hb-backdrop{position:fixed;inset:0;background:rgba(10,20,25,.45);z-index:998;
      opacity:0;pointer-events:none;transition:opacity .2s;}
    #hb-backdrop.open{opacity:1;pointer-events:auto;}
    #hb-drawer{position:fixed;top:0;right:0;height:100%;width:min(300px,85vw);background:#fff;color:#203040;
      z-index:999;box-shadow:-8px 0 24px rgba(0,0,0,.18);transform:translateX(100%);
      transition:transform .25s ease;display:flex;flex-direction:column;padding:24px 20px;gap:6px;}
    #hb-drawer.open{transform:translateX(0);}
    #hb-drawer h2{margin:0 0 2px;font-size:16px;}
    #hb-drawer .hb-user{font-size:13px;color:#5b6b76;margin-bottom:14px;word-break:break-all;}
    #hb-drawer a,#hb-drawer button{display:block;text-align:left;padding:11px 12px;border-radius:8px;
      border:none;background:none;font-size:15px;color:#123e48;text-decoration:none;cursor:pointer;
      font-family:inherit;width:100%;}
    #hb-drawer a:hover,#hb-drawer button:hover,
    #hb-drawer a:focus-visible,#hb-drawer button:focus-visible{background:#eef4f4;}
    #hb-drawer .hb-logout{margin-top:auto;color:#b3261e;font-weight:600;}
    #hb-drawer hr{border:none;border-top:1px solid #e5eaea;margin:8px 0;}
    @media (prefers-reduced-motion: reduce){
      #hb-drawer,#hb-backdrop{transition:none;}
    }
  `;
  document.head.appendChild(style);

  const toggle = document.createElement("button");
  toggle.id = "hb-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-haspopup", "true");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "hb-drawer");
  toggle.setAttribute("aria-label", "Abrir menú de navegación");
  toggle.textContent = "☰";

  const backdrop = document.createElement("div");
  backdrop.id = "hb-backdrop";
  backdrop.setAttribute("aria-hidden", "true");

  const drawer = document.createElement("nav");
  drawer.id = "hb-drawer";
  drawer.setAttribute("aria-label", "Menú principal");
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = '<p class="hb-user">Cargando…</p>';

  document.body.append(toggle, backdrop, drawer);

  let isOpen = false;

  function open() {
    isOpen = true;
    backdrop.classList.add("open");
    drawer.classList.add("open");
    drawer.removeAttribute("aria-hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú de navegación");
    const firstFocusable = drawer.querySelector("a, button");
    firstFocusable?.focus();
  }

  function close({ returnFocus = true } = {}) {
    isOpen = false;
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú de navegación");
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => (isOpen ? close() : open()));
  backdrop.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) close();
  });
  drawer.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...drawer.querySelectorAll("a, button")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "index.html";
  }

  function link(href, label) {
    const isCurrent = location.pathname.endsWith(href);
    return `<a href="${href}"${isCurrent ? ' aria-current="page"' : ""}>${label}</a>`;
  }

  async function render() {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error();
      const { data: user } = await response.json();
      const isAdmin = user.role === "admin";
      drawer.innerHTML = `
        <h2>${user.name}</h2>
        <p class="hb-user">${user.email} · ${isAdmin ? "Administrador" : "Cliente"}</p>
        ${link("dashboard.html", isAdmin ? "Todas las reservas" : "Mis reservas")}
        ${link("reservation.html", "Nueva reserva")}
        ${isAdmin ? link("rooms.html", "Gestionar habitaciones") : ""}
        <hr>
        <button type="button" class="hb-logout" id="hb-logout-btn">Cerrar sesión</button>
      `;
      drawer.querySelector("#hb-logout-btn").addEventListener("click", logout);
    } catch {
      drawer.innerHTML = `
        <h2>Hotel Pura Vida</h2>
        <p class="hb-user">No has iniciado sesión</p>
        ${link("index.html", "Inicio")}
        ${link("login.html", "Iniciar sesión")}
        ${link("register.html", "Registrarse")}
      `;
    }
  }

  render();
})();
