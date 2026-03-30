import gql from "graphql-tag";

export default gql`
  # ================= ENUMS =================

  enum Gender {
    MALE
    FEMALE
    OTHER
  }

  enum ApprovalStatus {
    PENDING
    INTERVIEW
    DOCUMENT_VERIFICATION
    APPROVED
    REJECTED
  }

  # ================= COMMON =================

  type MessageResponse {
    message: String!
  }

  # ================= TYPES =================

  type Astrologer {
    id: ID!
    profilePic: String!
    name: String!
    dateOfBirth: String!
    gender: Gender!
    languages: [String!]!
    skills: [String!]!
    experience: Int!
    email: String!
    contactNo: String!
    about: String!
    approvalStatus: ApprovalStatus!
    adminRemarks: String
    addresses: [Address!]!
    experiences: [ExperiencePlatform!]!
    createdAt: String
    updatedAt: String
  
  }

  type Address {
    street: String!
    city: String!
    state: String!
    country: String!
    pincode: String!
  }

  type ExperiencePlatform {
    platformName: String!
    yearsWorked: Int!
  }

  # ================= INPUTS =================

  input AddressInput {
    street: String!
    city: String!
    state: String!
    country: String!
    pincode: String!
  }

  input ExperiencePlatformInput {
    platformName: String!
    yearsWorked: Int!
  }

  input RegisterAstrologerInput {
    profilePic: String!
    name: String!
    dateOfBirth: String!
    gender: Gender!
    languages: [String!]!
    skills: [String!]!
    experience: Int!
    email: String!
    contactNo: String!
    about: String!
    addresses: [AddressInput!]!
    experiences: [ExperiencePlatformInput!]!
  }

  # ================= AUTH PAYLOADS =================

  type AstrologerAuthPayload {
    accessToken: String!
    astrologer: Astrologer!
  }

  type AstrologerRefreshAuthPayload {
    accessToken: String!
  }

  # ================= QUERY =================

  type Query {
    meAstrologer: Astrologer
  }

  # ================= MUTATION =================

  type Mutation {
    registerAstrologer(data: RegisterAstrologerInput!): Astrologer!

    requestAstrologerOtp(contactNo: String!): MessageResponse!

    verifyAstrologerOtp(
      contactNo: String!
      otp: String!
    ): AstrologerAuthPayload!

    refreshAstrologerToken: AstrologerRefreshAuthPayload!

    logoutAstrologer: MessageResponse!
  }
`;
