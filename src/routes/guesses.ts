import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessesRoutes(fastify: FastifyInstance) {
  fastify.get("/guesses/count", async (request, reply) => {
    try {
      const count = await prisma.guess.count();
      return reply.status(200).send({ count });
    } catch (error) {
      return reply.status(400).send({ message: "Internal server error" });
    }
  });

  fastify.post(
    "/pools/:poolId/games/:gameId/guesses",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      try {
        const getGuessParams = z.object({
          poolId: z.string(),
          gameId: z.string(),
        });

        const getGuessBody = z.object({
          firstTeamPoints: z.number(),
          secondTeamPoints: z.number(),
        });

        const { poolId, gameId } = getGuessParams.parse(request.params);
        const { firstTeamPoints, secondTeamPoints } = getGuessBody.parse(
          request.body
        );

        const participant = await prisma.participant.findUnique({
          where: {
            userId_poolId: {
              userId: request.user.sub,
              poolId: poolId,
            },
          },
        });

        if (!participant) {
          return reply.status(400).send({
            message: "You're not allowed to create a guess inside this pool",
          });
        }

        const guess = await prisma.guess.findUnique({
          where: {
            gameId_participantId: {
              gameId,
              participantId: participant.id,
            },
          },
        });

        if (guess) {
          return reply.status(400).send({
            message: "You already sent a guess to this game on this pool",
          });
        }

        const game = await prisma.game.findUnique({
          where: {
            id: gameId,
          },
        });

        if (!game) {
          return reply.status(400).send({
            message: "Game not found",
          });
        }

        if (game.date < new Date()) {
          return reply.status(400).send({
            message: "You cannot send guesses after the game date",
          });
        }

        await prisma.guess.create({
          data: {
            gameId,
            participantId: participant.id,
            firstTeamPoints,
            secondTeamPoints,
          },
        });

        return reply.status(201).send();
      } catch (error) {
        return reply.status(400).send({ message: "Internal server error" });
      }
    }
  );
}
