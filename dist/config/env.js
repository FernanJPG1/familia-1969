"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Cargar variables de entorno desde .env si existe
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 3000,
    DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
    // Meta WhatsApp Cloud API credentials
    META_WA_ACCESS_TOKEN: process.env.META_WA_ACCESS_TOKEN || 'mock_meta_token_dev',
    META_WA_PHONE_NUMBER_ID: process.env.META_WA_PHONE_NUMBER_ID || '109876543210',
    META_WA_VERIFY_TOKEN: process.env.META_WA_VERIFY_TOKEN || 'barberia_webhook_secret_key_2026',
    // Tenant Configuration
    DEFAULT_TENANT_ID: 'tenant-demo-1',
    DEFAULT_TENANT_SLUG: process.env.DEFAULT_TENANT_SLUG || 'gentlemans-cut',
};
exports.default = exports.env;
