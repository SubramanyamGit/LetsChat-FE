import { axiosInstanceWithToken } from "./axiosInstance";

//   Fetch Messages
export const fetchMessages = async (userId, receiverId) => {
    const res = await axiosInstanceWithToken.get(`/chat/${userId}/${receiverId}`);
    return res.data;
};

//   Send Message
export const sendMessageApi = async (senderId, receiverId, encryptedMessage) => {
    await axiosInstanceWithToken.post("/chat/send", { senderId, receiverId, encryptedMessage });
};

