import prisma from "../config/prisma.js";

import {
  logoutService,
  refreshTokenService,
  verifyOtpService,
  requestOtpService,
} from "../services/auth.service.js";

export default {
  Query: {
    /* =====================================
       ASTROLOGER EARNINGS
    ===================================== */
    getAstrologerEarnings: async (
      _,
      __,
      { user }
    ) => {
      try {
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        console.log(
          "ASTROLOGER ID:",
          astrologerId
        );

        /* =====================================
           GET WALLET
        ===================================== */
        const wallet =
          await prisma.astrologerWallet.findUnique({
            where: {
              astrologerId,
            },

            include: {
              transactions: {
                orderBy: {
                  createdAt: "desc",
                },

                take: 20,
              },
            },
          });

        /* =====================================
           EMPTY WALLET RESPONSE
        ===================================== */
        if (!wallet) {
          return {
            summary: {
              totalEarnings: 0,
              totalWithdrawn: 0,
              currentBalance: 0,
              totalSessions: 0,
              totalChatMinutes: 0,
            },

            transactions: [],
          };
        }

        /* =====================================
           SESSION STATS
        ===================================== */
        const sessions =
          await prisma.session.findMany({
            where: {
              astrologerId,
              status: "COMPLETED",
            },

            select: {
              durationSec: true,
            },
          });

        const totalSessions =
          sessions.length;

        let totalChatMinutes = 0;

        sessions.forEach((s) => {
          totalChatMinutes += Math.ceil(
            (s.durationSec || 0) / 60
          );
        });

        /* =====================================
           FINAL RESPONSE
        ===================================== */
        return {
          summary: {
            totalEarnings:
              wallet.totalEarned || 0,

            totalWithdrawn:
              wallet.totalWithdrawn || 0,

            currentBalance:
              wallet.balanceCoins || 0,

            totalSessions,

            totalChatMinutes,
          },

          transactions:
            wallet.transactions.map((t) => ({
              id: t.id,

              type: t.type,

              amount: t.amount || 0,

              coins: t.coins || 0,

              description:
                t.description || "",

              createdAt:
                t.createdAt.toISOString(),
            })),
        };
      } catch (error) {
        console.error(
          "getAstrologerEarnings error:",
          error
        );

        throw new Error(
          error.message ||
            "Failed to fetch earnings"
        );
      }
    },

    /* =====================================
       ASTROLOGER CHAT HISTORY
    ===================================== */
    getAstrologerChatHistory: async (
      _,
      { filter = {} },
      { user }
    ) => {
      try {
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        const {
          page = 1,
          limit = 10,
          userName,
          status,
          startDate,
          endDate,
        } = filter;

        const skip = (page - 1) * limit;

        const where = {
          astrologerId,

          ...(status && {
            status,
          }),

          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate && {
                    gte: new Date(startDate),
                  }),

                  ...(endDate && {
                    lte: new Date(endDate),
                  }),
                },
              }
            : {}),

          ...(userName && {
            user: {
              name: {
                contains: userName,
                mode: "insensitive",
              },
            },
          }),
        };

        /* =====================================
           TOTAL COUNT
        ===================================== */
        const totalCount =
          await prisma.session.count({
            where,
          });

        /* =====================================
           FETCH SESSIONS
        ===================================== */
        const sessions =
          await prisma.session.findMany({
            where,

            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  mobile: true,
                  countryCode: true,
                },
              },

              messages: {
                orderBy: {
                  createdAt: "desc",
                },

                take: 1,

                select: {
                  roomId: true,
                  message: true,
                },
              },
            },

            orderBy: {
              createdAt: "desc",
            },

            skip,
            take: limit,
          });

        /* =====================================
           RESPONSE DATA
        ===================================== */
        const data = sessions.map(
          (session) => {
            const lastMessage =
              session.messages?.[0] || null;

            const durationMinutes =
              session.durationSec
                ? Math.ceil(
                    session.durationSec / 60
                  )
                : 0;

            return {
              sessionId: session.id,

              roomId:
                lastMessage?.roomId || null,

              userName:
                session.user?.name || "",

              userMobile:
                session.user?.mobile || "",

              userCountryCode:
                session.user?.countryCode ||
                "",

              startedAt: session.startedAt
                ? session.startedAt.toISOString()
                : null,

              endedAt: session.endedAt
                ? session.endedAt.toISOString()
                : null,

              createdAt: session.createdAt
                ? session.createdAt.toISOString()
                : null,

              status: session.status,

              durationSec:
                session.durationSec || 0,

              durationMinutes,

              ratePerMin:
                session.ratePerMin || 0,

              coinsEarned:
                session.coinsEarned || 0,

              commission:
                session.commission || 0,

              lastMessage:
                lastMessage?.message || "",
            };
          }
        );

        return {
          success: true,

          totalCount,

          currentPage: page,

          totalPages: Math.ceil(
            totalCount / limit
          ),

          data,
        };
      } catch (error) {
        console.error(
          "getAstrologerChatHistory error:",
          error
        );

        throw new Error(
          error.message ||
            "Failed to fetch chat history"
        );
      }
    },
  },

  Mutation: {
    requestAstrologerOtp: async (
      _,
      { contactNo }
    ) => {
      return requestOtpService(contactNo);
    },

    verifyAstrologerOtp: async (
      _,
      { contactNo, otp },
      { res }
    ) => {
      return verifyOtpService(
        contactNo,
        otp,
        res
      );
    },

    logoutAstrologer: async (
      _,
      __,
      { req, res }
    ) => {
      await logoutService(req, res);

      return {
        message:
          "Logged out successfully",

        success: true,
      };
    },

    refreshAstrologerToken: async (
      _,
      __,
      { req, res }
    ) => {
      return refreshTokenService(
        req,
        res
      );
    },
  },
};