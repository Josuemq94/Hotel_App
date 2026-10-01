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
- `src/models`: esquemas Mongoose.
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
JWT_SECRET=una-clave-larga-y-aleatoria
ADMIN_EMAILS=jmoralesq@ucenfotec.ac.cr
```

Google verifica el token en el backend. Las reservas de un usuario regular se filtran por su usuario; el correo de `ADMIN_EMAILS` recibe permisos administrativos para consultar, editar y cancelar cualquier reserva.

El registro de clientes también permite ingresar nombre y correo desde `register.html`. Este registro no crea una contraseña: el cliente debe iniciar sesión posteriormente con Google usando el mismo correo. El endpoint es `POST /api/auth/register`.
