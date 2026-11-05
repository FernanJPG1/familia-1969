"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const error_handler_1 = require("./middlewares/error-handler");
function createApp() {
    const app = (0, express_1.default)();
    // Middlewares estándar
    app.use((0, cors_1.default)({ origin: '*' }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Archivos estáticos del frontend móvil / PWA
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    // Rutas principales del API
    app.use('/api', routes_1.default);
    // Manejador centralizado de errores
    app.use(error_handler_1.errorHandler);
    return app;
}
exports.default = createApp;
