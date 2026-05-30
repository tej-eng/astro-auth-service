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
    message: String
  success: Boolean
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

  #---------------------start code for astrologer earnings--------
  type AstrologerEarningSummary {
  totalEarnings: Float!
  totalWithdrawn: Float!
  currentBalance: Float!
  totalSessions: Int!
  totalChatMinutes: Int!
}

type AstrologerEarningTransaction {
  id: ID!
  type: String!
  amount: Float
  coins: Int
  description: String
  createdAt: String
}

type AstrologerEarningResponse {
  summary: AstrologerEarningSummary!
  transactions: [AstrologerEarningTransaction!]!
}


  #--------end code for astrologer earnings---------------------

  #-----------------------start code for astrologer chat history-----
  enum SessionStatus {
  REQUESTED
  ACCEPTED
  ONGOING
  COMPLETED
  CANCELLED
  FAILED
}
 type AstrologerChatHistoryItem {
  sessionId: String
  roomId: String

  userName: String
  userMobile: String
  userCountryCode: String

  birthPlace: String
  birthDate: String
  birthTime: String
  occupation: String
  gender: Gender
  intakeName: String

  startedAt: String
  endedAt: String
  createdAt: String

  status: String

  durationSec: Int
  durationMinutes: Int

  ratePerMin: Int

  coinsEarned: Int
  commission: Int

  rating: Int
  reviewComment: String

  lastMessage: String
}

type AstrologerChatHistoryResponse {
  success: Boolean!
  totalCount: Int!
  currentPage: Int!
  totalPages: Int!
  data: [AstrologerChatHistoryItem!]!
}

input AstrologerChatHistoryFilterInput {
  page: Int
  limit: Int

  userName: String
  status: SessionStatus

  startDate: String
  endDate: String
}



  #------end code for astrologer chat history-----------------------
  # ================= MESSAGE TYPES =================

type ChatMessage {
  id: ID!

  msgId: String
  roomId: String

  senderId: String
  receiverId: String

  message: String
  image: String
  sender: String

  replyTo: String

  createdAt: String
}

type GetSessionMessagesResponse {
  success: Boolean!
  totalCount: Int!

  data: [ChatMessage!]!
}
#------------------------END code for message----------------------

#----------------start code for call history----------------------
# ================= CALL HISTORY =================

type AstrologerCallHistoryItem {
  sessionId: String
  roomId: String

  userName: String
  userMobile: String
  userCountryCode: String

  startedAt: String
  endedAt: String
  createdAt: String

  status: String

  durationSec: Int
  durationMinutes: Int

  ratePerMin: Int

  coinsEarned: Int
  commission: Int

  lastMessage: String
}

type AstrologerCallHistoryResponse {
  success: Boolean!
  totalCount: Int!
  currentPage: Int!
  totalPages: Int!

  data: [AstrologerCallHistoryItem!]!
}

input AstrologerCallHistoryFilterInput {
  page: Int
  limit: Int

  userName: String
  status: SessionStatus

  startDate: String
  endDate: String
}
#---------END code for call history----------------------

#---------start code for astrologer wallet transactions----------------------
type WalletTransactionItem {
  id: String!

  type: String!

  amount: Float

  coins: Int

  description: String

  createdAt: String!
}

type WalletTransactionResponse {
  success: Boolean!

  totalCount: Int!

  currentPage: Int!

  totalPages: Int!

  data: [WalletTransactionItem!]!
}
#-----END code for astrologer wallet transactions----------------------


#--------------------start code for get astrologer reviews--------------
# ================= REVIEW TYPES =================

type ReviewItem {
  id: ID!

  sessionId: String
  sessionType: String
  sessionStatus: String

  durationSec: Int

  startedAt: String
  endedAt: String

  userName: String
  astroName: String

  rating: Int!
  comment: String
  reply: String

  isFlagged: Boolean

  createdAt: String!
}

type ReviewResponse {
  success: Boolean!

  totalCount: Int!

  currentPage: Int!

  totalPages: Int!

  limit: Int!

  data: [ReviewItem!]!
}

input ReviewFilterInput {
  page: Int
  limit: Int
  rating: Int
}
#-----------Start code for getAstrologerProfile----------------------
enum DocumentStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum PricingType {
  CHAT
  CALL
  VIDEO
  AUDIO
}

type AstrologerPricing {
  id: ID
  type: PricingType
  price: Float
  offerPrice: Float
  commissionPercent: Float
  isActive: Boolean
}

type AstrologerAddress {
  street: String
  city: String
  state: String
  country: String
  pincode: String
}

type AstrologerExperience {
  platformName: String
  yearsWorked: Int
}

type AstrologerReview {
  id: ID
  rating: Int
  comment: String
  reply: String
  userName: String
  createdAt: String
}

type AstrologerProfile {
  id: ID

  profilePic: String
  name: String
  displayName: String

  email: String
  contactNo: String

  gender: Gender
  about: String

  languages: [String]
  skills: [String]
  problems: [String]

  experience: Int
  rating: Float

  tags: String
  vtags: String

  status: Boolean

  createdAt: String

  pricing: [AstrologerPricing]

  wallet: AstrologerWalletInfo

  recentReviews: [AstrologerReview]

  addresses: [AstrologerAddress]

  experiences: [AstrologerExperience]

  totalReviews: Int
  totalSessions: Int

  kycDetail: KycDetailResponse
}
type AstrologerWalletInfo {
  balanceCoins: Float
  totalEarned: Int
  totalWithdrawn: Int
}

type AstrologerProfileResponse {
  success: Boolean!
  message: String!
  data: AstrologerProfile
}

type KycDetailResponse {
  accountHolderName: String
  accountNumber: String
  bankName: String
  ifsc: String
  branchName: String
  panNumber: String

  profileImage: String
  aadhaarImage: String
  panImage: String
  passbookImage: String

  status: DocumentStatus
}
#--------END--code for getAstrologerProfile----------------------

#-----------------start code for getUser Details--------
type UserWalletInfo {
  balanceCoins: Float
  lockedCoins: Float
}

type UserDetails {
  id: ID!
  name: String
  mobile: String
  countryCode: String
  gender: Gender

  birthDate: String
  birthTime: String

  occupation: String

  isActive: Boolean

  wallet: UserWalletInfo

  totalSessions: Int
  completedSessions: Int

  totalReviews: Int

  createdAt: String
  updatedAt: String
}
#--END code for getUser Details-------

#-----------------start code for getAstrologerSessions----------------------

input AstrologerSessionFilterInput {
  page: Int
  limit: Int

  userName: String

  startDate: String
  endDate: String

  sessionType: String
}

type AstrologerSessionItem {
  sessionId: String

  sessionType: String
  status: String

  userId: String
  userName: String
  userMobile: String
  userCountryCode: String

  birthPlace: String
  birthDate: String
  birthTime: String
  occupation: String
  gender: String

  rating: Int
  reviewComment: String

  startedAt: String
  endedAt: String
  createdAt: String

  durationSec: Int
  durationMinutes: Int

  ratePerMin: Int

  coinsEarned: Int
  commission: Int
}

type AstrologerSessionResponse {
  success: Boolean!

  totalCount: Int!

  currentPage: Int!

  totalPages: Int!

  data: [AstrologerSessionItem!]!
}
#--END code for getAstrologerSessions----------------------
  type Query {
    meAstrologer: Astrologer
    getAstrologerEarnings: AstrologerEarningResponse!
    getAstrologerChatHistory(
    filter: AstrologerChatHistoryFilterInput
  ): AstrologerChatHistoryResponse!

  getSessionMessages(
  sessionId: String!
): GetSessionMessagesResponse!

getAstrologerCallHistory(
  filter: AstrologerCallHistoryFilterInput
): AstrologerCallHistoryResponse!

getAstrologerWalletTransactions(
  page: Int
  limit: Int
): WalletTransactionResponse!

getAstrologerReviews(
  filter: ReviewFilterInput
): ReviewResponse!

getAstrologerProfile: AstrologerProfileResponse!

getUserDetails(userId: String!): UserDetails!

getAstrologerSessions(
  filter: AstrologerSessionFilterInput
): AstrologerSessionResponse!


  }


 

  type Mutation {
    registerAstrologer(data: RegisterAstrologerInput!): Astrologer!

    requestAstrologerOtp(contactNo: String!): MessageResponse!

    verifyAstrologerOtp(
      contactNo: String!
      otp: String!
    ): AstrologerAuthPayload!

    refreshAstrologerToken: AstrologerRefreshAuthPayload!

    logoutAstrologer: MessageResponse!

    replyToReview(
  reviewId: String!
  reply: String!
): MessageResponse!
  }
`;
