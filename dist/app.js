"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const routes_1 = __importDefault(require("./routes"));
const error_handler_1 = require("./middlewares/error-handler");
function createApp() {
    const app = (0, express_1.default)();
    // Middlewares estándar
    app.use((0, cors_1.default)({ origin: '*' }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Redirección inmediata a index.html en raíz
    app.get('/', (req, res) => {
        return res.redirect(302, '/index.html');
    });
    // Archivos estáticos del frontend móvil / PWA
    const publicDir = path_1.default.join(__dirname, '../public');
    if (fs_1.default.existsSync(publicDir)) {
        app.use(express_1.default.static(publicDir));
    }
    const assetsDir = path_1.default.join(__dirname, '../assets');
    if (fs_1.default.existsSync(assetsDir)) {
        app.use('/assets', express_1.default.static(assetsDir));
    }
    // Rutas principales del API
    app.use('/api', routes_1.default);
    // Fallback para 404
    app.use((req, res) => {
        res.redirect(302, '/index.html');
    });
    // Manejador centralizado de errores
    app.use(error_handler_1.errorHandler);
    return app;
}
exports.default = createApp;
