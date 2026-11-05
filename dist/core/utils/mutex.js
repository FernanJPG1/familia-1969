"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalMutex = exports.Mutex = void 0;
/**
 * Semáforo / Mutex en memoria para garantizar atomicidad en reservas concurrentes
 * y prevenir condiciones de carrera (Double-Booking).
 */
class Mutex {
    currentLock = Promise.resolve();
    async acquire(task) {
        const previous = this.currentLock;
        let release;
        this.currentLock = new Promise((resolve) => {
            release = resolve;
        });
        await previous;
        try {
            return await task();
        }
        finally {
            release();
        }
    }
}
exports.Mutex = Mutex;
exports.globalMutex = new Mutex();
