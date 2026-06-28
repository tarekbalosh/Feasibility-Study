"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSectorConfig = getSectorConfig;
const sectors_1 = require("../src/config/sectors");
function getSectorConfig(sector) {
    const config = sectors_1.SECTORS[sector];
    if (!config) {
        throw new Error(`Sector ${sector} not supported`);
    }
    return config;
}
//# sourceMappingURL=sectorEngine.js.map