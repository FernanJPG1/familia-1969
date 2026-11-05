/**
 * Semáforo / Mutex en memoria para garantizar atomicidad en reservas concurrentes
 * y prevenir condiciones de carrera (Double-Booking).
 */
export class Mutex {
  private currentLock: Promise<void> = Promise.resolve();

  public async acquire<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.currentLock;
    let release!: () => void;

    this.currentLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await task();
    } finally {
      release();
    }
  }
}

export const globalMutex = new Mutex();
