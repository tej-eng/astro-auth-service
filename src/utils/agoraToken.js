import pkg from "agora-access-token";

const { RtcTokenBuilder, RtcRole } = pkg;

export const generateRtcToken = ({
  channelName,
  uid,
  role = "audience",
}) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate =
    process.env.AGORA_APP_CERTIFICATE;

  const expirationTimeInSeconds = 3600;

  const currentTimestamp = Math.floor(
    Date.now() / 1000
  );

  const privilegeExpiredTs =
    currentTimestamp + expirationTimeInSeconds;

  const rtcRole =
    role === "host"
      ? RtcRole.PUBLISHER
      : RtcRole.SUBSCRIBER;

  const token =
    RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs
    );

  return token;
};