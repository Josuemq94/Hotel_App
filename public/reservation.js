const form = document.querySelector("#reservation-form");
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
const rates = { standard: 80, deluxe: 130, suite: 220 };
function estimate() {
  const start = new Date(document.querySelector("#checkIn").value);
  const end = new Date(document.querySelector("#checkOut").value);
  const nights = Math.ceil((end - start) / 86400000);
  const guests = Number(document.querySelector("#guests").value);
  const total =
    nights > 0
      ? rates[document.querySelector("#roomType").value] * nights +
        Math.max(0, guests - 2) * 15 * nights
      : 0;
  document.querySelector("#estimate").textContent = `$${total}`;
}
function renderCards() {
  document.querySelector("#room-cards").innerHTML = Object.entries(rates)
    .map(
      ([type, price]) =>
        `<article class="room-card"><img src="https://images.unsplash.com/photo-${type === "suite" ? "1590490360182-c33d57733427" : type === "deluxe" ? "1566665797739-1674de7a421a" : "1582719478250-c89cae4dc85b"}?auto=format&fit=crop&w=600&q=80" alt="Habitación ${type}"><div><h3>${type}</h3><p>Desde <strong>$${price}</strong> por noche</p></div></article>`,
    )
    .join("");
}
async function init() {
  try {
    const me = await request("/api/auth/me");
    document.querySelector("#email").value = me.data.email;
    document.querySelector("#guestName").value = me.data.name;
    const id = new URLSearchParams(location.search).get("id");
    if (id) {
      const { data } = await request(`${API}/${id}`);
      document.querySelector("#reservation-id").value = id;
      document.querySelector("#form-title").textContent = "Editar reserva";
      Object.entries(data).forEach(([key, value]) => {
        const input = document.querySelector(`#${key}`);
        if (input)
          input.value = key.startsWith("check") ? value.slice(0, 10) : value;
      });
    }
    estimate();
  } catch (error) {
    await Swal.fire({
      icon: "warning",
      title: "Sesión requerida",
      text: error.message,
    });
    location.href = "index.html";
  }
}
form.addEventListener("input", estimate);
form.addEventListener("change", estimate);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = document.querySelector("#reservation-id").value;
  const payload = Object.fromEntries(new FormData(form));
  payload.guests = Number(payload.guests);
  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    await Swal.fire({
      icon: "success",
      title: id ? "Reserva editada" : "Reserva creada",
      text: "La operación se realizó correctamente",
      timer: 1600,
      showConfirmButton: false,
    });
    location.href = "dashboard.html";
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "No se pudo guardar",
      text: error.message,
    });
  }
});
document.querySelector("#logout").addEventListener("click", async () => {
  await request("/api/auth/logout", { method: "POST" });
  location.href = "index.html";
});
renderCards();
init();
