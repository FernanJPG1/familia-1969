type EventCallback = (data?: any) => void;

class SocketEventBus {
  private ioInstance: any = null;

  public setIO(io: any) {
    this.ioInstance = io;
  }

  public emit(event: string, data?: any) {
    if (this.ioInstance) {
      this.ioInstance.emit(event, data);
    }
  }
}

export const eventBus = new SocketEventBus();
export default eventBus;
