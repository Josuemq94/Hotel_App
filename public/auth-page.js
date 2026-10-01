async function initializeGoogleAccess() {
  const status = document.querySelector("#auth-status");
  try {
    const response = await fetch("/api/config");
    const { data } = await response.json();
    if (!data.googleClientId) {
      status.textContent = "Google Auth no está configurado. Agrega GOOGLE_CLIENT_ID en .env.";
      return;
    }
    window.handleGoogleCredential = async ({ credential }) => {
      try {
        const loginResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });
        const body = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(body.error);
        await Swal.fire({
          icon: "success",
          title: "Acceso correcto",
          text: `Bienvenido, ${body.data.name}`,
          timer: 1500,
          showConfirmButton: false,
        });
        window.location.href = "dashboard.html";
      } catch (error) {
        Swal.fire({ icon: "error", title: "No se pudo autenticar", text: error.message });
      }
    };
    if (!window.google?.accounts?.id) {
      await new Promise((resolve) => {
        const started = Date.now();
        const timer = setInterval(() => {
          if (window.google?.accounts?.id || Date.now() - started > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
    }
    if (!window.google?.accounts?.id) {
      throw new Error("Google Identity Services no está disponible");
    }
    google.accounts.id.initialize({
      client_id: data.googleClientId,
      callback: window.handleGoogleCredential,
    });
    google.accounts.id.renderButton(document.querySelector("#google-button"), {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: 280,
    });
  } catch (error) {
    status.textContent = "No se pudo cargar el servicio de autenticación.";
  }
}

document.querySelector("#register-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    await Swal.fire({
      icon: "success",
      title: "Cuenta creada",
      text: "Ahora inicia sesión con tu correo y contraseña.",
      confirmButtonText: "Ir a iniciar sesión",
    });
    window.location.href = "login.html";
  } catch (error) {
    Swal.fire({ icon: "error", title: "No se pudo crear la cuenta", text: error.message });
  }
});

document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    await Swal.fire({
      icon: "success",
      title: "Sesión iniciada",
      text: `Bienvenido, ${body.data.name}`,
      timer: 1500,
      showConfirmButton: false,
    });
    window.location.href = "dashboard.html";
  } catch (error) {
    Swal.fire({ icon: "error", title: "No se pudo iniciar sesión", text: error.message });
  }
});

initializeGoogleAccess();
