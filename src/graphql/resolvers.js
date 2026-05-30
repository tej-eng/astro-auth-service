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
    getAstrologerEarnings: async (_, __, { user }) => {
      try {
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        console.log("ASTROLOGER ID:", astrologerId);

        /* =====================================
           GET WALLET
        ===================================== */
        const wallet = await prisma.astrologerWallet.findUnique({
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
        const sessions = await prisma.session.findMany({
          where: {
            astrologerId,
            status: "COMPLETED",
          },

          select: {
            durationSec: true,
          },
        });

        const totalSessions = sessions.length;

        let totalChatMinutes = 0;

        sessions.forEach((s) => {
          totalChatMinutes += Math.ceil((s.durationSec || 0) / 60);
        });

        /* =====================================
           FINAL RESPONSE
        ===================================== */
        return {
          summary: {
            totalEarnings: wallet.totalEarned || 0,

            totalWithdrawn: wallet.totalWithdrawn || 0,

            currentBalance: wallet.balanceCoins || 0,

            totalSessions,

            totalChatMinutes,
          },

          transactions: wallet.transactions.map((t) => ({
            id: t.id,

            type: t.type,

            amount: t.amount || 0,

            coins: t.coins || 0,

            description: t.description || "",

            createdAt: t.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("getAstrologerEarnings error:", error);

        throw new Error(error.message || "Failed to fetch earnings");
      }
    },

    /* =====================================
       ASTROLOGER CHAT HISTORY
    ===================================== */
 getAstrologerChatHistory: async (_, { filter = {} }, { user }) => {
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
    const totalCount = await prisma.session.count({
      where,
    });

    /* =====================================
       FETCH SESSIONS
    ===================================== */
    const sessions = await prisma.session.findMany({
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

        review: {
          select: {
            rating: true,
            comment: true,
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
       FETCH INTAKE DETAILS
    ===================================== */
    const roomIds = sessions
      .map((session) => session.messages?.[0]?.roomId)
      .filter(Boolean);

    let intakeMap = new Map();

    if (roomIds.length > 0) {
      const intakes = await prisma.intake.findMany({
        where: {
          chatId: {
            in: roomIds,
          },
        },

        select: {
          chatId: true,
          birthPlace: true,
          birthDate: true,
          birthTime: true,
          occupation: true,
          gender: true,
          name: true,
        },
      });

      intakeMap = new Map(
        intakes.map((intake) => [intake.chatId, intake])
      );
    }

    /* =====================================
       RESPONSE DATA
    ===================================== */
    const data = sessions.map((session) => {
      const lastMessage = session.messages?.[0] || null;

      const intake = intakeMap.get(lastMessage?.roomId);

      const durationMinutes = session.durationSec
        ? Math.ceil(session.durationSec / 60)
        : 0;

      return {
        sessionId: session.id,

        roomId: lastMessage?.roomId || null,

        userName: session.user?.name || "",

        userMobile: session.user?.mobile || "",

        userCountryCode: session.user?.countryCode || "",

        birthPlace: intake?.birthPlace || "",

        birthDate: intake?.birthDate
          ? intake.birthDate.toISOString()
          : null,

        birthTime: intake?.birthTime || "",

        occupation: intake?.occupation || "",

        gender: intake?.gender || null,

        intakeName: intake?.name || "",

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

        durationSec: session.durationSec || 0,

        durationMinutes,

        ratePerMin: session.ratePerMin || 0,

        coinsEarned: session.coinsEarned || 0,

        commission: session.commission || 0,

        rating: session.review?.rating ?? null,

        reviewComment: session.review?.comment ?? null,

        lastMessage: lastMessage?.message || "",
      };
    });

    return {
      success: true,

      totalCount,

      currentPage: page,

      totalPages: Math.ceil(totalCount / limit),

      data,
    };
  } catch (error) {
    console.error("getAstrologerChatHistory error:", error);

    throw new Error(
      error.message || "Failed to fetch chat history"
    );
  }
},
    
    getSessionMessages: async (_, { sessionId }, { user }) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
        if (!user) {
          throw new Error("Unauthorized");
        }

        /* =====================================
       VALIDATE SESSION
    ===================================== */
        const session = await prisma.session.findUnique({
          where: {
            id: sessionId,
          },

          select: {
            id: true,
            astrologerId: true,
          },
        });

        if (!session) {
          throw new Error("Session not found");
        }

        /* =====================================
       SECURITY CHECK
    ===================================== */
        if (session.astrologerId !== user.id) {
          throw new Error("Access denied");
        }

        /* =====================================
       FETCH MESSAGES
    ===================================== */
        const messages = await prisma.message.findMany({
          where: {
            sessionId,
          },

          orderBy: {
            createdAt: "asc",
          },
        });

        /* =====================================
       RESPONSE
    ===================================== */
        return {
          success: true,

          totalCount: messages.length,

          data: messages.map((msg) => ({
            id: msg.id,

            msgId: msg.msgId,

            roomId: msg.roomId,

            senderId: msg.senderId,

            receiverId: msg.receiverId || null,

            message: msg.message || null,

            image: msg.image || null,

            sender: msg.sender,

            replyTo: msg.replyTo ? JSON.stringify(msg.replyTo) : null,

            createdAt: msg.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("getSessionMessages error:", error);

        throw new Error(error.message || "Failed to fetch messages");
      }
    },
    getAstrologerCallHistory: async (_, { filter = {} }, { user }) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
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

        console.log("ASTROLOGER CALL HISTORY:", astrologerId);

        /* =====================================
       FILTER
    ===================================== */
        const where = {
          astrologerId,

          type: "CALL",

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
        const totalCount = await prisma.session.count({
          where,
        });

        /* =====================================
       FETCH SESSIONS
    ===================================== */
        const sessions = await prisma.session.findMany({
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
       RESPONSE
    ===================================== */
        const data = sessions.map((session) => {
          const lastMessage = session.messages?.[0] || null;

          let durationMinutes = 0;

          if (session.durationSec) {
            durationMinutes = Math.ceil(session.durationSec / 60);
          }

          return {
            sessionId: session.id,

            roomId: lastMessage?.roomId || null,

            userName: session.user?.name || null,

            userMobile: session.user?.mobile || null,

            userCountryCode: session.user?.countryCode || null,

            startedAt: session.startedAt
              ? session.startedAt.toISOString()
              : null,

            endedAt: session.endedAt ? session.endedAt.toISOString() : null,

            createdAt: session.createdAt
              ? session.createdAt.toISOString()
              : null,

            status: session.status,

            durationSec: session.durationSec || 0,

            durationMinutes,

            ratePerMin: session.ratePerMin || 0,

            coinsEarned: session.coinsEarned || 0,

            commission: session.commission || 0,

            lastMessage: lastMessage?.message || null,
          };
        });

        return {
          success: true,

          totalCount,

          currentPage: page,

          totalPages: Math.ceil(totalCount / limit),

          data,
        };
      } catch (error) {
        console.error("getAstrologerCallHistory error:", error);

        throw new Error(error.message || "Failed to fetch call history");
      }
    },

    getAstrologerWalletTransactions: async (
      _,
      { page = 1, limit = 20 },
      { user },
    ) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        const skip = (page - 1) * limit;

        console.log("ASTROLOGER WALLET TRANSACTIONS:", astrologerId);

        /* =====================================
       GET ASTROLOGER WALLET
    ===================================== */
        const wallet = await prisma.astrologerWallet.findUnique({
          where: {
            astrologerId,
          },
        });

        /* =====================================
       EMPTY WALLET RESPONSE
    ===================================== */
        if (!wallet) {
          return {
            success: true,

            totalCount: 0,

            currentPage: page,

            totalPages: 0,

            data: [],
          };
        }

        /* =====================================
       TOTAL COUNT
    ===================================== */
        const totalCount = await prisma.walletTransaction.count({
          where: {
            astrologerWalletId: wallet.id,
          },
        });

        /* =====================================
       FETCH TRANSACTIONS
    ===================================== */
        const transactions = await prisma.walletTransaction.findMany({
          where: {
            astrologerWalletId: wallet.id,
          },

          orderBy: {
            createdAt: "desc",
          },

          skip,

          take: limit,
        });

        /* =====================================
       RESPONSE
    ===================================== */
        return {
          success: true,

          totalCount,

          currentPage: page,

          totalPages: Math.ceil(totalCount / limit),

          data: transactions.map((txn) => ({
            id: txn.id,

            type: txn.type,

            amount: txn.amount || 0,

            coins: txn.coins || 0,

            description: txn.description || "",

            createdAt: txn.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("getAstrologerWalletTransactions error:", error);

        throw new Error(error.message || "Failed to fetch wallet transactions");
      }
    },
    getAstrologerReviews: async (_, { filter = {} }, { user }) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        /* =====================================
       PAGINATION
    ===================================== */
        const page = Number(filter.page) || 1;
        const limit = Number(filter.limit) || 10;

        const skip = (page - 1) * limit;

        /* =====================================
       FILTER
    ===================================== */
        const where = {
          astrologerId,

          ...(filter.rating && {
            rating: Number(filter.rating),
          }),
        };

        /* =====================================
       TOTAL COUNT
    ===================================== */
        const totalCount = await prisma.review.count({
          where,
        });

        /* =====================================
       FETCH REVIEWS
    ===================================== */
        const reviews = await prisma.review.findMany({
          where,

          include: {
            session: {
              select: {
                id: true,
                type: true,
                status: true,
                startedAt: true,
                endedAt: true,
                durationSec: true,
                createdAt: true,
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
       RESPONSE
    ===================================== */
        return {
          success: true,

          totalCount,

          currentPage: page,

          totalPages: Math.ceil(totalCount / limit),

          limit,

          data: reviews.map((review) => ({
            id: review.id,

            /* Session Details */
            sessionId: review.session?.id || review.sessionId || null,
            sessionType: review.session?.type || null,
            sessionStatus: review.session?.status || null,

            durationSec: review.session?.durationSec || 0,

            startedAt: review.session?.startedAt
              ? review.session.startedAt.toISOString()
              : null,

            endedAt: review.session?.endedAt
              ? review.session.endedAt.toISOString()
              : null,

            /* Review Details */
            userName: review.userName || "",
            astroName: review.astroName || "",

            rating: review.rating,

            comment: review.comment || "",

            reply: review.reply || null,

            isFlagged: review.isFlagged || false,

            createdAt: review.createdAt.toISOString(),
          })),
        };
      } catch (error) {
        console.error("getAstrologerReviews error:", error);

        throw new Error(error.message || "Failed to fetch reviews");
      }
    },
  getUserDetails: async (_, { userId }, { user }) => {
  try {
    if (!user) {
      throw new Error("Unauthorized");
    }

    const userData = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        wallet: true,
        sessions: {
          select: {
            status: true,
          },
        },
        reviews: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!userData) {
      throw new Error("User not found");
    }

    const totalSessions = userData.sessions.length;

    const completedSessions = userData.sessions.filter(
      (session) => session.status === "COMPLETED"
    ).length;

    return {
      id: userData.id,

      name: userData.name,
      mobile: userData.mobile,
      countryCode: userData.countryCode,

      gender: userData.gender,

      birthDate: userData.birthDate
        ? userData.birthDate.toISOString()
        : null,

      birthTime: userData.birthTime,

      occupation: userData.occupation,

      isActive: userData.isActive,

      wallet: userData.wallet
        ? {
            balanceCoins: userData.wallet.balanceCoins,
            lockedCoins: userData.wallet.lockedCoins,
          }
        : null,

      totalSessions,

      completedSessions,

      totalReviews: userData.reviews.length,

      createdAt: userData.createdAt.toISOString(),
      updatedAt: userData.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("getUserDetails error:", error);
    throw new Error(error.message || "Failed to fetch user details");
  }
},
    getAstrologerProfile: async (_, __, { user }) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
        if (!user) {
          throw new Error("Unauthorized");
        }

        const astrologerId = user.id;

        /* =====================================
       FETCH ASTROLOGER PROFILE
    ===================================== */
        const astrologer = await prisma.astrologer.findUnique({
          where: {
            id: astrologerId,
          },

          include: {
            pricing: true,

            wallet: true,

            reviews: {
              orderBy: {
                createdAt: "desc",
              },

              take: 5,

              select: {
                id: true,
                rating: true,
                comment: true,
                userName: true,
                createdAt: true,
              },
            },

            addresses: true,

            experiences: true,

            kycDetail: true,
          },
        });

        if (!astrologer) {
          throw new Error("Astrologer profile not found");
        }

        /* =====================================
       TOTAL REVIEW COUNT
    ===================================== */
        const totalReviews = await prisma.review.count({
          where: {
            astrologerId,
          },
        });

        /* =====================================
       TOTAL SESSIONS
    ===================================== */
        const totalSessions = await prisma.session.count({
          where: {
            astrologerId,
            status: "COMPLETED",
          },
        });

        /* =====================================
       RESPONSE
    ===================================== */
        return {
          success: true,

          message: "Astrologer profile fetched successfully",

          data: {
            id: astrologer.id,

            profilePic: astrologer.profilePic || "",

            name: astrologer.name,

            displayName: astrologer.displayName,

            email: astrologer.email,

            contactNo: astrologer.contactNo,

            about: astrologer.about,

            gender: astrologer.gender,

            languages: astrologer.languages || [],

            skills: astrologer.skills || [],

            problems: astrologer.problems || [],

            experience: astrologer.experience || 0,

            rating: astrologer.rating || 0,

            totalReviews,

            totalSessions,

            tags: astrologer.tags || "",

            vtags: astrologer.vtags || "",

            status: astrologer.status || false,

            createdAt: astrologer.createdAt.toISOString(),

            pricing: astrologer.pricing || [],

            wallet: astrologer.wallet
              ? {
                  balanceCoins: astrologer.wallet.balanceCoins || 0,

                  totalEarned: astrologer.wallet.totalEarned || 0,

                  totalWithdrawn: astrologer.wallet.totalWithdrawn || 0,
                }
              : null,

            recentReviews: astrologer.reviews.map((review) => ({
              id: review.id,

              rating: review.rating,

              comment: review.comment || "",

              userName: review.userName || "",

              createdAt: review.createdAt.toISOString(),
            })),

            addresses: astrologer.addresses || [],

            experiences: astrologer.experiences || [],

            kycDetail: astrologer.kycDetail || null,
          },
        };
      } catch (error) {
        console.error("getAstrologerProfile error:", error);

        throw new Error(error.message || "Failed to fetch astrologer profile");
      }
    },
  },

  Mutation: {
    requestAstrologerOtp: async (_, { contactNo }) => {
      return requestOtpService(contactNo);
    },

    verifyAstrologerOtp: async (_, { contactNo, otp }, { res }) => {
      return verifyOtpService(contactNo, otp, res);
    },

    logoutAstrologer: async (_, __, { req, res }) => {
      await logoutService(req, res);

      return {
        message: "Logged out successfully",

        success: true,
      };
    },

    refreshAstrologerToken: async (_, __, { req, res }) => {
      return refreshTokenService(req, res);
    },
    replyToReview: async (_, { reviewId, reply }, { user }) => {
      try {
        /* =====================================
       AUTH CHECK
    ===================================== */
        if (!user) {
          throw new Error("Unauthorized");
        }

        /* =====================================
       FIND REVIEW
    ===================================== */
        const review = await prisma.review.findUnique({
          where: {
            id: reviewId,
          },
        });

        if (!review) {
          throw new Error("Review not found");
        }

        /* =====================================
       SECURITY CHECK
    ===================================== */
        if (review.astrologerId !== user.id) {
          throw new Error("Access denied");
        }

        /* =====================================
       UPDATE REVIEW
    ===================================== */
        await prisma.review.update({
          where: {
            id: reviewId,
          },

          data: {
            reply,
          },
        });

        return {
          success: true,

          message: "Reply added successfully",
        };
      } catch (error) {
        console.error("replyToReview error:", error);

        throw new Error(error.message || "Failed to reply to review");
      }
    },
  },
};
