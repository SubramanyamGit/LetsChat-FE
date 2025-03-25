import { axiosInstanceWithToken } from "./axiosInstance";
//   Fetch Users
export const fetchUsers = async () => {
    const res = await axiosInstanceWithToken.get("/users");
    return res.data;
};

// Fetch User Data including Public Key & Gist URL
export const fetchUserPublicKey = async (userId) => {
    const res = await axiosInstanceWithToken.get(`/users/${userId}`);
    return res.data;
};

export const fetchUnreadMessages = async (userId) => {
    const res = await axiosInstanceWithToken.get(`/messages/unread/${userId}`);
    return res.data;
};
