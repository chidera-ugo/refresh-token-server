"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const isAuth = ({ context }, next) => {
    const authrorization = context.req.headers["authorization"];
    if (!authrorization) {
        throw new Error("Not authorized");
    }
    try {
        const token = authrorization?.split(" ")[1];
        const payload = (0, jsonwebtoken_1.verify)(token, process.env.ACCESS_TOKEN_SECRET);
        context.tokenPayload = payload;
    }
    catch (error) {
        console.log(error);
        throw new Error("An error occurred");
    }
    return next();
};
exports.isAuth = isAuth;
