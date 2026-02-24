import {
  logoutService,
  refreshTokenService,
  verifyOtpService,
  requestOtpService,
  registerAstrologerService,
} from "../services/auth.service.js";

export default {
  Mutation: {
    logoutAstrologer: async (_, __, { req, res, user }) => {
      if (!user) throw new Error("Unauthorized");

      const message = await logoutService(req, res);

      return { message };
    },

    refreshAstrologerToken: async (_, __, { req, res }) => {
      return refreshTokenService(req, res);
    },

    verifyAstrologerOtp: async (_, { contactNo, otp }, { res }) => {
      return verifyOtpService(contactNo, otp, res);
    },

    requestAstrologerOtp: async (_, { contactNo }) => {
      const message = await requestOtpService(contactNo);
      return { message };
    },

    registerAstrologer: async (_, { data }) => {
      return registerAstrologerService(data);
    },
  },
};
