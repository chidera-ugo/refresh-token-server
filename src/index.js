"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const userResolver_1 = require("./resolvers/userResolver");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = require("jsonwebtoken");
const UserEntity_1 = require("./entities/UserEntity");
const auth_1 = require("./auth");
const sendRefreshToken_1 = require("./helpers/sendRefreshToken");
const cors_1 = __importDefault(require("cors"));
async function main() {
    const corsOptions = {
        origin: ["http://localhost:3000", "https://studio.apollographql.com"],
        credentials: true,
    };
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(corsOptions));
    app.use((0, cookie_parser_1.default)());
    await (0, typeorm_1.createConnection)();
    app.post("/refresh-token", async (req, res) => {
        const token = req.cookies.jid;
        if (!token) {
            return res.send({
                ok: false,
                accessToken: null,
            });
        }
        let payload = null;
        try {
            payload = (0, jsonwebtoken_1.verify)(token, process.env.REFRESH_TOKEN_SECRET);
        }
        catch (error) {
            console.log(error);
            return res.send({ ok: false, accessToken: null });
        }
        const userId = payload.userId;
        const user = await UserEntity_1.User.findOne({ where: { id: userId } });
        if (!user) {
            return res.send({ ok: false, accessToken: null });
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: null });
        }
        (0, sendRefreshToken_1.sendRefreshToken)(res, (0, auth_1.createRefreshToken)(user));
        return res.send({
            ok: true,
            accessToken: (0, auth_1.createAccessToken)(user),
        });
    });
    const server = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [userResolver_1.UserResolver],
        }),
        context: ({ req, res }) => ({
            req,
            res,
        }),
    });
    await server.start();
    server.applyMiddleware({
        app,
        cors: false,
    });
    app.listen(4000, () => {
        console.log("SERVER IS UP");
    });
}
main();
// createConnection().then(async connection => {
//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);
//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);
//     console.log("Here you can setup and run express/koa/any other framework.");
// }).catch(error => console.log(error));
