"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRefreshToken = void 0;
const sendRefreshToken = (res, token) => {
    return res.cookie("jid", token, {
        httpOnly: true,
        path: "/",
    });
};
exports.sendRefreshToken = sendRefreshToken;
