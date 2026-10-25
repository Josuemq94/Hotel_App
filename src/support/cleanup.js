const { ReservationService } = require('../services/api.services');

/**
 * Teardown de reservas.
 *
 * Guarda el id de cada reserva que la API crea durante las pruebas y las borra al
 * final, para dejar la base como estaba. Registra cualquier respuesta 201, también
 * las de casos que la API acepta por error (por ejemplo, un defecto), así que
 * nada queda huérfano.
 *
 * Los usuarios no se pueden borrar porque la API no tiene ese endpoint. Por eso se
 * crean con email único bajo el dominio de pruebas (ver data/builders/unique.js).
 */
const createReservationCleanup = () => {
    const createdIds = new Set();

    return {
        /** Registra la reserva si la respuesta la creó; devuelve la misma respuesta. */
        track(response) {
            const id = response?.status === 201 ? response.data?.data?._id : null;
            if (id) createdIds.add(id);
            return response;
        },

        /** Borra todas las reservas registradas y avisa si alguna no se pudo borrar. */
        async cleanup() {
            const failures = [];
            for (const id of [...createdIds]) {
                const response = await ReservationService.deleteReservation(id);
                if (response.status === 204) {
                    createdIds.delete(id);
                } else {
                    failures.push(`${id} (${response.status})`);
                }
            }
            if (failures.length > 0) {
                throw new Error(`[teardown] No se pudieron borrar las reservas: ${failures.join(', ')}`);
            }
        }
    };
};

module.exports = { createReservationCleanup };
