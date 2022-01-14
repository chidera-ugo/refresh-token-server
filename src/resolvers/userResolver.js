"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const UserEntity_1 = require("../entities/UserEntity");
const auth_1 = require("../auth");
const isAuth_1 = require("../middleware/isAuth");
const sendRefreshToken_1 = require("../helpers/sendRefreshToken");
const typeorm_1 = require("typeorm");
const jsonwebtoken_1 = require("jsonwebtoken");
let FieldError = class FieldError {
    constructor() {
        this.field = "";
        this.message = "";
    }
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
// @ObjectType()
// class UserResponse {
// 	@Field({ nullable: true })
// 	errors?: FieldError[]
// 	@Field({ nullable: true })
// 	user?: User
// }
let LoginResponse = class LoginResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => String, { nullable: true }),
    __metadata("design:type", String)
], LoginResponse.prototype, "accessToken", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], LoginResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => UserEntity_1.User, { nullable: true }),
    __metadata("design:type", UserEntity_1.User)
], LoginResponse.prototype, "user", void 0);
LoginResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], LoginResponse);
let UserResolver = class UserResolver {
    hello() {
        return "hi";
    }
    bye({ tokenPayload }) {
        return `Your user ID is ${tokenPayload?.userId}`;
    }
    users() {
        return UserEntity_1.User.find();
    }
    async me(context) {
        const authrorization = context.req.headers["authorization"];
        if (!authrorization) {
            return null;
        }
        try {
            const token = authrorization?.split(" ")[1];
            const payload = (0, jsonwebtoken_1.verify)(token, process.env.ACCESS_TOKEN_SECRET);
            context.tokenPayload = payload;
            return await UserEntity_1.User.findOne(payload.userId);
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async register(email, password) {
        const hashedPassword = await argon2_1.default.hash(password);
        try {
            await UserEntity_1.User.insert({
                email,
                password: hashedPassword,
            });
        }
        catch (error) {
            console.log(error);
            return false;
        }
        return true;
    }
    async login(email, password, { res }) {
        const user = await UserEntity_1.User.findOne({ where: { email } });
        if (!user) {
            return {
                errors: [{ field: "email", message: "user not found" }],
            };
        }
        const validPassword = await argon2_1.default.verify(user.password, password);
        if (!validPassword) {
            return {
                errors: [{ field: "email", message: "invalid email or password" }],
            };
        }
        (0, sendRefreshToken_1.sendRefreshToken)(res, (0, auth_1.createRefreshToken)(user));
        return {
            accessToken: (0, auth_1.createAccessToken)(user),
            user,
        };
    }
    async revokeRefreshTokensForUser(userId) {
        await (0, typeorm_1.getConnection)()
            .getRepository(UserEntity_1.User)
            .increment({ id: userId }, "tokenVersion", 1);
        return true;
    }
    logout({ res }) {
        (0, sendRefreshToken_1.sendRefreshToken)(res, "");
        return true;
    }
};
__decorate([
    (0, type_graphql_1.Query)(() => String),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "hello", null);
__decorate([
    (0, type_graphql_1.Query)(() => String),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "bye", null);
__decorate([
    (0, type_graphql_1.Query)(() => [UserEntity_1.User]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "users", null);
__decorate([
    (0, type_graphql_1.Query)(() => UserEntity_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("email")),
    __param(1, (0, type_graphql_1.Arg)("password")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => LoginResponse),
    __param(0, (0, type_graphql_1.Arg)("email")),
    __param(1, (0, type_graphql_1.Arg)("password")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("userId", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "revokeRefreshTokensForUser", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)()
], UserResolver);
exports.UserResolver = UserResolver;
