import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get("/users/count", async (request, reply) => {
    try {
      const count = await prisma.user.count();
      return reply.status(200).send({ count });
    } catch (error) {
      return reply.status(400).send({ message: "Internal server error" });
    }
  });
}
