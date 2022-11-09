"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../plugins/authenticate");
async function authRoutes(fastify) {
    fastify.post("/auth", async (request, reply) => {
        try {
            const createAuthBody = zod_1.z.object({
                access_token: zod_1.z.string(),
            });
            const { access_token } = createAuthBody.parse(request.body);
            const authResponse = await (0, node_fetch_1.default)("https://www.googleapis.com/oauth2/v2/userinfo", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const userData = await authResponse.json();
            const userInfoSchema = zod_1.z.object({
                id: zod_1.z.string(),
                name: zod_1.z.string(),
                email: zod_1.z.string().email(),
                picture: zod_1.z.string().url(),
            });
            const userInfo = userInfoSchema.parse(userData);
            let user = await prisma_1.prisma.user.findUnique({
                where: {
                    googleId: userInfo.id,
                },
            });
            if (!user) {
                user = await prisma_1.prisma.user.create({
                    data: {
                        name: userInfo.name,
                        email: userInfo.email,
                        googleId: userInfo.id,
                        avatarUrl: userInfo.picture,
                    },
                });
            }
            const token = fastify.jwt.sign({
                name: user.name,
                avatarUrl: user.avatarUrl,
            }, {
                sub: user.id,
                expiresIn: "7 days",
            });
            return reply.status(201).send({ token });
        }
        catch (error) {
            return reply.status(400).send({ message: "Invalid token" });
        }
    });
    fastify.get("/me", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        return reply.status(200).send({ user: request.user });
    });
}
exports.authRoutes = authRoutes;
