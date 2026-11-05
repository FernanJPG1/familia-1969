"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const store_1 = require("../../database/store");
class SettingsService {
    static get() {
        return store_1.store.settings;
    }
    static update(partial) {
        return store_1.store.updateSettings(partial);
    }
}
exports.SettingsService = SettingsService;
exports.default = SettingsService;
