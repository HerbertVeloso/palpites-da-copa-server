"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessesRoutes = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../plugins/authenticate");
async function guessesRoutes(fastify) {
    fastify.get("/guesses/count", async (request, reply) => {
        try {
            const count = await prisma_1.prisma.guess.count();
            return reply.status(200).send({ count });
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
    fastify.post("/pools/:poolId/games/:gameId/guesses", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        try {
            const getGuessParams = zod_1.z.object({
                poolId: zod_1.z.string(),
                gameId: zod_1.z.string(),
            });
            const getGuessBody = zod_1.z.object({
                firstTeamPoints: zod_1.z.number(),
                secondTeamPoints: zod_1.z.number(),
            });
            const { poolId, gameId } = getGuessParams.parse(request.params);
            const { firstTeamPoints, secondTeamPoints } = getGuessBody.parse(request.body);
            const participant = await prisma_1.prisma.participant.findUnique({
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
            const guess = await prisma_1.prisma.guess.findUnique({
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
            const game = await prisma_1.prisma.game.findUnique({
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
            await prisma_1.prisma.guess.create({
                data: {
                    gameId,
                    participantId: participant.id,
                    firstTeamPoints,
                    secondTeamPoints,
                },
            });
            return reply.status(201).send();
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
}
exports.guessesRoutes = guessesRoutes;
