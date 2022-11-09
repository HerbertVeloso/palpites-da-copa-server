"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const pools_1 = require("./routes/pools");
const games_1 = require("./routes/games");
const guesses_1 = require("./routes/guesses");
dotenv_1.default.config();
async function bootstrap() {
    const fastify = (0, fastify_1.default)({
        logger: true,
    });
    await fastify.register(cors_1.default, {
        origin: true,
    });
    await fastify.register(jwt_1.default, {
        secret: process.env.JWT_SECRET,
    });
    await fastify.register(auth_1.authRoutes);
    await fastify.register(users_1.usersRoutes);
    await fastify.register(pools_1.poolsRoutes);
    await fastify.register(games_1.gamesRoutes);
    await fastify.register(guesses_1.guessesRoutes);
    await fastify.listen({ port: 3333, host: "0.0.0.0" });
}
bootstrap();
