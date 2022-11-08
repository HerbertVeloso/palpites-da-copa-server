import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function gamesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/pools/:id/games",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const getPoolParams = z.object({
          id: z.string(),
        });

        const { id } = getPoolParams.parse(request.params);

        const games = await prisma.game.findMany({
          orderBy: {
            date: "desc",
          },
          include: {
            guesses: {
              where: {
                participant: {
                  userId: request.user.sub,
                  poolId: id,
                },
              },
            },
          },
        });

        return reply.status(200).send({
          games: games.map((game) => {
            return {
              ...game,
              guess: game.guesses.length > 0 ? game.guesses[0] : null,
              guesses: undefined,
            };
          }),
        });
      } catch (error) {
        return reply.status(400).send({ message: "Internal server error" });
      }
    }
  );
}
