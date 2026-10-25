
# Hotel Pura Vida

Aplicación de reservas hoteleras con Node.js, Express, MongoDB y frontend HTML/CSS/JavaScript vanilla.

## Inicio local

1. Instala Node.js 18+ y MongoDB local (o usa una URI de MongoDB Atlas).
2. Ejecuta `npm install`.
3. Copia `.env.example` como `.env` y configura `MONGODB_URI`.
4. Ejecuta `npm run dev` (o `npm start`).
5. Abre `http://localhost:3000`.

## Arquitectura

- `src/config`: Singleton de conexión a MongoDB.
- `src/models`: Esquemas Mongoose.
- `src/repositories`: acceso exclusivo a datos.
- `src/services`: reglas de negocio y validaciones.
- `src/controllers`: adaptación HTTP.
- `src/middleware`: manejo centralizado de errores.
- `public`: frontend vanilla.
- `postman`: colección importable con CRUD completo.

El backend expone `GET /api/health`, CRUD de reservas en `/api/reservations`, CRUD de habitaciones en `/api/rooms` y disponibilidad con `GET /api/rooms/available?checkIn=2026-10-10&checkOut=2026-10-13&type=deluxe`.

## Google Auth y roles

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto o selecciona uno existente.
2. Ve a **APIs y servicios → Pantalla de consentimiento OAuth**, configura la aplicación como externa y agrega tu correo como usuario de prueba.
3. Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**.
4. Selecciona **Aplicación web** y agrega `http://localhost:3000` en **Orígenes autorizados de JavaScript**.
5. Copia el Client ID al archivo `.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
JWT_SECRET=Eejemplo
ADMIN_EMAILS=jmoralesq@ucenfotec.ac.cr
```

## Pruebas automatizadas: capa de datos y setup/teardown

Las pruebas corren contra la API levantada (`npm run dev`) en la URL de `BASE_URL`, que por defecto es `http://localhost:3000/api`.

### Capa de datos (`src/data/`)

Los tests no escriben payloads a mano: los piden a esta capa. Para cambiar un dato se edita aquí, sin tocar la lógica de las pruebas.

| Archivo | Qué contiene |
|---|---|
| `fixtures.js` | Punto de entrada de la capa |
| `builders/user.builder.js` | `aUser()`: usuario válido con email único |
| `builders/reservation.builder.js` | `aReservation()`: reserva válida según el contrato real de la API, con fechas a futuro |
| `builders/unique.js` | Emails únicos bajo el dominio reservado `hotelpuravida.test` |
| `cases/register.cases.js` | Casos de Registro: dato de entrada y resultado esperado |
| `cases/reservation.cases.js` | Casos de Crear Reserva: dato de entrada y resultado esperado |

**Cómo se diseñaron los casos**

- **Partición de equivalencia:** cada campo tiene clases válidas e inválidas, como un formato de email incorrecto o un tipo de habitación fuera del catálogo.
- **Valores límite:** se prueba el valor justo en el límite o el primero afuera: contraseña de 5 caracteres, 10 y 11 huéspedes y estadía de 0 noches.
- **Un factor por caso:** cada caso parte de un dato válido y cambia o quita un solo campo, así el resultado se explica por ese campo.
- **Oráculo independiente:** los precios esperados se calcularon a mano, no con la fórmula de la API.
- **Datos únicos y sin vencimiento:** los emails son únicos en cada ejecución y las fechas son relativas a hoy, así que la suite se puede repetir sin choques.

Agregar un caso es agregar una fila a la tabla que corresponda; el test la recorre con `it.each`:

```js
{
    id: 'RES-03',
    scenario: 'huéspedes sobre el límite (11)',
    payload: aReservation().forGuests(11).build(),
    expectedError: 'Invalid reservation data'
}
```

### Setup y teardown (`src/support/`)

| Archivo | Responsabilidad |
|---|---|
| `session.js` | `createSession()` registra un usuario único, inicia sesión y activa su token. `extractAuthToken()` lee el token de la cookie `hotel_token`, porque la API no lo devuelve en el body. `withoutAuth()` hace una llamada sin sesión y después restaura el token. |
| `cleanup.js` | Guarda cada reserva creada durante las pruebas y la borra en `afterAll`, incluidas las que la API acepta por error. |

La API no tiene un endpoint para borrar usuarios, así que los usuarios de prueba quedan en la base. Todos usan el dominio `hotelpuravida.test` y se pueden borrar con:

```js
db.users.deleteMany({ email: /@hotelpuravida\.test$/ })
```

### Casos de Registro y Crear Reserva

**Registro: `POST /auth/register`** (`src/tests/auth-register.test.js`)

| ID | Técnica | Escenario | Esperado |
|---|---|---|---|
| REG-01 | Contrato | Usuario válido | 201, solo datos públicos y sin contraseña |
| REG-02 | Valor límite | Contraseña de 5 caracteres | 400 |
| REG-03 | Partición inválida | Email sin arroba | 400 |
| REG-04 | Campo obligatorio | Registro sin `name` | 400 |
| REG-05 | Regla de negocio | Email ya registrado | 409 |

**Crear reserva: `POST /reservations`** (`src/tests/reservations-create.test.js`)

| ID | Técnica | Escenario | Esperado |
|---|---|---|---|
| RES-01 | Contrato y regla de precio | Deluxe, 3 noches, 2 huéspedes | 201, estado `pending`, dueño = usuario de la sesión, precio 390 |
| RES-02 | Valor límite | 10 huéspedes | 201, precio 750 con recargo por huéspedes extra |
| RES-03 | Valor límite | 11 huéspedes | 400 |
| RES-04 | Valor límite | Check-out el mismo día (0 noches) | 400 |
| RES-05 | Partición inválida | Tipo de habitación fuera del catálogo | 400 |
| RES-06 | Autenticación | Reserva válida sin sesión | 401 |
| RES-07 | Defecto | Usuario sin rol admin envía `status: "confirmed"` | 201 con estado `pending` (falla: ver abajo) |

Además del status, cada caso valida el body: el contrato de la respuesta, los datos guardados o el mensaje de error exacto.

### Defecto detectado

**RES-07: un usuario sin rol admin puede crear una reserva ya confirmada.** Cambiar el estado de una reserva es exclusivo de admin (`PATCH /reservations/:id/status`), pero `POST /reservations` acepta el campo `status` de cualquier usuario.

- **Esperado:** la reserva nueva queda en `pending`.
- **Real:** la API responde 201 y la guarda como `confirmed`.

El caso falla a propósito mientras el defecto exista.
