const API = "/api/rooms";
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

const statusLabels = { available: "Disponible", maintenance: "Mantenimiento" };
let isAdmin = false;

function renderAvailability(rooms) {
  const results = document.querySelector("#availability-results");
  const count = document.querySelector("#availability-count");
  count.textContent = rooms.length
    ? `${rooms.length} habitación(es) disponible(s)`
    : "Sin resultados";
  results.innerHTML = rooms.length
    ? rooms
        .map(
          (room) =>
            `<article class="availability-card"><strong>${room.type}</strong><p>Habitación ${room.number} · hasta ${room.capacity} huésped(es)</p><p><strong>$${room.pricePerNight}</strong> por noche</p></article>`,
        )
        .join("")
    : '<p class="muted">No hay habitaciones disponibles para esas fechas.</p>';
}

document
  .querySelector("#availability-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { type, checkIn, checkOut } = Object.fromEntries(new FormData(form));
    const query = new URLSearchParams({ checkIn, checkOut, ...(type ? { type } : {}) });
    try {
      const { data } = await request(`${API}/available?${query}`);
      renderAvailability(data);
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo buscar", text: error.message });
    }
  });

function renderRoomList(rooms) {
  const list = document.querySelector("#room-list");
  list.innerHTML = rooms.length
    ? rooms
        .map(
          (room) => `
      <article class="room-manage-item">
        <div class="room-info">
          <strong>${room.type} · Hab. ${room.number}</strong>
          <span class="muted">Capacidad ${room.capacity} · $${room.pricePerNight}/noche</span>
          <span class="badge">${statusLabels[room.status] || room.status}</span>
        </div>
        <div class="room-manage-actions">
          <button type="button" class="secondary button-small" data-edit="${room._id}">Editar</button>
          <button type="button" class="danger button-small" data-delete="${room._id}">Eliminar</button>
        </div>
      </article>`,
        )
        .join("")
    : '<p class="muted">No hay habitaciones registradas todavía.</p>';
}

let allRooms = [];

async function loadRooms() {
  const { data } = await request(API);
  allRooms = data;
  renderRoomList(data);
}

function showForm(room) {
  const form = document.querySelector("#room-form");
  form.classList.remove("hidden");
  document.querySelector("#room-id").value = room?._id || "";
  document.querySelector("#room-number").value = room?.number || "";
  document.querySelector("#room-type").value = room?.type || "standard";
  document.querySelector("#room-capacity").value = room?.capacity ?? 2;
  document.querySelector("#room-price").value = room?.pricePerNight ?? "";
  document.querySelector("#room-status").value = room?.status || "available";
  document.querySelector("#room-form-submit").textContent = room
    ? "Guardar cambios"
    : "Crear habitación";
  document.querySelector("#room-number").focus();
}

function hideForm() {
  document.querySelector("#room-form").classList.add("hidden");
  document.querySelector("#room-form").reset();
}

document.querySelector("#new-room-btn").addEventListener("click", () => showForm());
document.querySelector("#room-form-cancel").addEventListener("click", hideForm);

document.querySelector("#room-list").addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) {
    const room = allRooms.find((item) => item._id === editId);
    if (room) showForm(room);
    return;
  }
  if (deleteId) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar habitación?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;
    try {
      await request(`${API}/${deleteId}`, { method: "DELETE" });
      await Swal.fire({ icon: "success", title: "Habitación eliminada", timer: 1200, showConfirmButton: false });
      loadRooms();
    } catch (error) {
      Swal.fire({ icon: "error", title: "No se pudo eliminar", text: error.message });
    }
  }
});

document.querySelector("#room-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#room-id").value;
  const payload = Object.fromEntries(new FormData(event.currentTarget));
  payload.capacity = Number(payload.capacity);
  payload.pricePerNight = Number(payload.pricePerNight);
  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await Swal.fire({
      icon: "success",
      title: id ? "Habitación actualizada" : "Habitación creada",
      timer: 1200,
      showConfirmButton: false,
    });
    hideForm();
    loadRooms();
  } catch (error) {
    Swal.fire({ icon: "error", title: "No se pudo guardar", text: error.message });
  }
});

document.querySelector("#logout").addEventListener("click", async () => {
  await request("/api/auth/logout", { method: "POST" });
  window.location.href = "index.html";
});

async function init() {
  try {
    const { data: user } = await request("/api/auth/me");
    document.querySelector("#user-label").textContent = user.email;
    isAdmin = user.role === "admin";
    if (isAdmin) {
      document.querySelector("#manage-section").hidden = false;
      await loadRooms();
    }
  } catch (error) {
    await Swal.fire({ icon: "warning", title: "Sesión requerida", text: error.message });
    window.location.href = "index.html";
  }
}

init();
