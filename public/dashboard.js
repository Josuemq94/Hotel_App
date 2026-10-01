const API = "/api/reservations";
const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(body?.error || "No se pudo completar la operación");
  return body;
};
const date = (value) => new Date(value).toLocaleDateString("es-CR");
const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

let currentUser = null;

function renderReservations(list) {
  document.querySelector("#reservations").innerHTML = list.length
    ? list
        .map((item) => {
          const owner = item.user?.name || item.user?.email || "";
          const statusControl = currentUser?.role === "admin"
            ? `<select class="status-select" data-status-id="${item._id}">
                ${Object.entries(statusLabels)
                  .map(
                    ([value, label]) =>
                      `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`,
                  )
                  .join("")}
              </select>`
            : `<span class="badge">${statusLabels[item.status] || item.status}</span>`;
          return `<article class="reservation"><div><strong>${item.guestName}</strong><p>${item.email} · ${item.roomType} · ${item.guests} huésped(es)${owner ? ` · cuenta: ${owner}` : ""}</p><p>${date(item.checkIn)} → ${date(item.checkOut)} · <strong>$${item.totalPrice}</strong></p></div><div class="reservation-actions">${statusControl}<a class="secondary button-small" href="reservation.html?id=${item._id}">Editar</a><button class="danger button-small" data-delete="${item._id}">Cancelar</button></div></article>`;
        })
        .join("")
    : '<p class="muted">No hay reservas todavía.</p>';
}

async function loadReservations() {
  const userId = document.querySelector("#user-filter")?.value;
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const { data } = await request(`${API}${query}`);
  renderReservations(data);
}

async function setupAdminFilter() {
  const section = document.querySelector("#admin-filter");
  section.style.display = "block";
  const { data: users } = await request("/api/users");
  const select = document.querySelector("#user-filter");
  select.innerHTML =
    '<option value="">Todos los usuarios</option>' +
    users
      .map((user) => `<option value="${user._id}">${user.name} (${user.email})</option>`)
      .join("");
  select.addEventListener("change", loadReservations);
}

async function load() {
  try {
    const { data: user } = await request("/api/auth/me");
    currentUser = user;
    document.querySelector("#user-label").textContent = user.email;
    if (user.role === "admin") {
      document.querySelector("#heading").textContent =
        "Todas las reservas (Administrador)";
      await setupAdminFilter();
    }
    await loadReservations();
  } catch (error) {
    await Swal.fire({
      icon: "warning",
      title: "Sesión requerida",
      text: error.message,
    });
    window.location.href = "index.html";
  }
}

document
  .querySelector("#reservations")
  .addEventListener("click", async (event) => {
    const id = event.target.dataset.delete;
    if (!id) return;
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Cancelar reserva?",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;
    try {
      await request(`${API}/${id}`, { method: "DELETE" });
      await Swal.fire({
        icon: "success",
        title: "Reserva cancelada",
        timer: 1300,
        showConfirmButton: false,
      });
      loadReservations();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error.message });
    }
  });

document
  .querySelector("#reservations")
  .addEventListener("change", async (event) => {
    const id = event.target.dataset.statusId;
    if (!id) return;
    const status = event.target.value;
    try {
      await request(`${API}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        timer: 1100,
        showConfirmButton: false,
      });
      loadReservations();
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo actualizar", text: error.message });
      loadReservations();
    }
  });

document.querySelector("#refresh").addEventListener("click", loadReservations);
document.querySelector("#logout").addEventListener("click", async () => {
  await request("/api/auth/logout", { method: "POST" });
  window.location.href = "index.html";
});
load();
