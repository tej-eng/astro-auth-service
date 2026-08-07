export const createAgoraChatRoom = async ({
  name,
  description,
  owner,
}) => {
  const token = await getAgoraManagementToken();

  const { data } = await axios.post(
    `${CHAT_BASE_URL}/${ORG_NAME}/${APP_NAME}/chatrooms`,
    {
      name,
      description,
      owner,
      maxusers: 5000,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.data;
};