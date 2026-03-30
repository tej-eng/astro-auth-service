import {
  logoutService,
  refreshTokenService,
  verifyOtpService,
  requestOtpService,
} from "../services/auth.service.js";

export default {
  Query: {
 
  },

  Mutation: {
    requestAstrologerOtp: async (_, { contactNo }) => {
      return requestOtpService(contactNo);
    },

    verifyAstrologerOtp: async (_, { contactNo, otp }, { res }) => {
      return verifyOtpService(contactNo, otp, res);
    },

    logoutAstrologer: async (_, __, { req, res, user }) => {
      if (!user) throw new Error("Unauthorized");
      return logoutService(req, res);
    },

    refreshAstrologerToken: async (_, __, { req, res }) => {
      return refreshTokenService(req, res);
    },
  },
};
