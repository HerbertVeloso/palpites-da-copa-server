import dontenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";

import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { poolsRoutes } from "./routes/pools";
import { gamesRoutes } from "./routes/games";
import { guessesRoutes } from "./routes/guesses";

dontenv.config();

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  await fastify.register(authRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(poolsRoutes);
  await fastify.register(gamesRoutes);
  await fastify.register(guessesRoutes);

  await fastify.listen({ port: 3333, host: "0.0.0.0" });
}

bootstrap();
