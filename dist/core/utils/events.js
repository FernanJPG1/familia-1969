"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
class SocketEventBus {
    ioInstance = null;
    setIO(io) {
        this.ioInstance = io;
    }
    emit(event, data) {
        if (this.ioInstance) {
            this.ioInstance.emit(event, data);
        }
    }
}
exports.eventBus = new SocketEventBus();
exports.default = exports.eventBus;
