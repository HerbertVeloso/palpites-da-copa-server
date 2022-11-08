import { FastifyInstance } from "fastify";
import fetch from "node-fetch";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth", async (request, reply) => {
    try {
      const createAuthBody = z.object({
        access_token: z.string(),
      });
      const { access_token } = createAuthBody.parse(request.body);

      const authResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const userData = await authResponse.json();
      const userInfoSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        picture: z.string().url(),
      });

      const userInfo = userInfoSchema.parse(userData);

      let user = await prisma.user.findUnique({
        where: {
          googleId: userInfo.id,
        },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: userInfo.name,
            email: userInfo.email,
            googleId: userInfo.id,
            avatarUrl: userInfo.picture,
          },
        });
      }

      const token = fastify.jwt.sign(
        {
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        {
          sub: user.id,
          expiresIn: "7 days",
        }
      );

      return reply.status(201).send({ token });
    } catch (error) {
      return reply.status(400).send({ message: "Invalid token" });
    }
  });

  fastify.get(
    "/me",
    {
      onRequest: [authenticate],
    },
    async (request, reply) => {
      return reply.status(200).send({ user: request.user });
    }
  );
}
