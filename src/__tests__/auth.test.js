import "dotenv/config";

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

import typeDefs from "../graphql/typeDefs.js";
import resolvers from "../graphql/resolvers.js";
import redis from "../config/redis.js";

const prisma = new PrismaClient();

let app;
let server;

const contactNo = "9999999999";

let astroAccessToken;
let astroRefreshCookie;
let generatedAstroOtp;

let adminToken;
let approvedAstrologer;

beforeAll(async () => {
  // 🧹 Clean DB
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Address",
      "ExperiencePlatform",
      "AstrologerRejectionHistory",
      "AstrologerDocument",
      "Interview",
      "Astrologer",
      "Admin",
      "Role"
    RESTART IDENTITY CASCADE;
  `);

  // 🧹 Clean Redis
  await redis.flushall();

  // ✅ Create Approved Astrologer
  approvedAstrologer = await prisma.astrologer.create({
    data: {
      profilePic: "test.jpg",
      name: "Approved Astro",
      dateOfBirth: new Date("1990-01-01"),
      gender: "MALE",
      languages: ["Hindi"],
      skills: ["Vedic"],
      experience: 5,
      email: "test@gmail.com",
      contactNo,
      about: "Test astrologer",
      approvalStatus: "APPROVED",
    },
  });

  // 🚀 Setup Express + Apollo
  app = express();
  app.use(express.json());
  app.use(cookieParser());

  server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        const authHeader = req.headers.authorization;
        let user = null;

        if (authHeader?.startsWith("Bearer ")) {
          try {
            user = jwt.verify(
              authHeader.replace("Bearer ", ""),
              process.env.JWT_SECRET
            );
          } catch {
            user = null;
          }
        }

        return { user, req, res };
      },
    })
  );

  // 👑 Create Admin
  const role = await prisma.role.create({
    data: { name: "ADMIN" },
  });

  const admin = await prisma.admin.create({
    data: {
      name: "Super Admin",
      email: "admin@test.com",
      password: "hashedpassword",
      phoneNo: "9999999990",
      role: { connect: { id: role.id } },
    },
  });

  adminToken = jwt.sign(
    { id: admin.id, role: "ADMIN" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
  await server.stop();
});

describe("ASTROLOGER OTP FLOW", () => {
  test("Request Astrologer OTP", async () => {
    const res = await request(app).post("/graphql").send({
      query: `
        mutation {
          requestAstrologerOtp(contactNo: "${contactNo}") {
            message
          }
        }
      `,
    });

    expect(res.body.errors).toBeUndefined();

    generatedAstroOtp = await redis.get(
      `astrologer_otp:${contactNo}`
    );

    expect(generatedAstroOtp).toBeDefined();
  });

  test("Verify Astrologer OTP", async () => {
    const res = await request(app).post("/graphql").send({
      query: `
        mutation {
          verifyAstrologerOtp(
            contactNo: "${contactNo}",
            otp: "${generatedAstroOtp}"
          ) {
            accessToken
            astrologer { id contactNo }
          }
        }
      `,
    });

    expect(res.body.errors).toBeUndefined();

    astroAccessToken =
      res.body.data.verifyAstrologerOtp.accessToken;

    expect(astroAccessToken).toBeDefined();

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("astro_refresh_token");

    astroRefreshCookie = cookies[0];

    // ✅ Ensure refreshToken saved in DB
    const updatedAstro = await prisma.astrologer.findUnique({
      where: { id: approvedAstrologer.id },
    });

    expect(updatedAstro.refreshToken).toBeDefined();
  });

  test("Refresh Astrologer Token (Cookie)", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Cookie", astroRefreshCookie)
      .send({
        query: `
          mutation {
            refreshAstrologerToken {
              accessToken
            }
          }
        `,
      });

    expect(res.body.errors).toBeUndefined();
    expect(
      res.body.data.refreshAstrologerToken.accessToken
    ).toBeDefined();
  });

  test("Logout Astrologer", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Authorization", `Bearer ${astroAccessToken}`)
      .set("Cookie", astroRefreshCookie)
      .send({
        query: `mutation { logoutAstrologer { message } }`,
      });

    expect(res.body.errors).toBeUndefined();

    // ✅ Ensure refreshToken removed from DB
    const updatedAstro = await prisma.astrologer.findUnique({
      where: { id: approvedAstrologer.id },
    });

    expect(updatedAstro.refreshToken).toBeNull();
  });

  test("Refresh After Logout Fails", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("Cookie", astroRefreshCookie)
      .send({
        query: `
          mutation {
            refreshAstrologerToken {
              accessToken
            }
          }
        `,
      });

    expect(res.body.errors).toBeDefined();
  });
});
