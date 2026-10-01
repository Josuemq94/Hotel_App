async function showAuth() {
  const { data } = await (await fetch("/api/config")).json();
  const status = document.querySelector("#auth-status");
  if (!data.googleClientId) {
    status.textContent =
      "Configura GOOGLE_CLIENT_ID en .env para activar Google Auth.";
    return;
  }
  window.handleGoogleCredential = async (responseData) => {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: responseData.credential }),
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
      Swal.fire({
        icon: "error",
        title: "No se pudo iniciar sesión",
        text: error.message,
      });
    }
  };
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
}
document.querySelector("[data-register]")?.addEventListener("click", () => {
  document.querySelector("#auth-title").textContent = "Crea tu cuenta";
  document.querySelector("#auth-description").textContent =
    "Regístrate con Google para comenzar a reservar.";
});
showAuth();
