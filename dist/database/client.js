"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Fallback client singleton
exports.prisma = {
    $connect: async () => { },
    $disconnect: async () => { },
};
exports.default = exports.prisma;
