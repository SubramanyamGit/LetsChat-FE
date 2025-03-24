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
    console.log("RES",res.data)
    return res.data; // Returns { sender_id: unread_count, sender_id: unread_count, ... }
};
// Logout API (if needed)
// export const logoutApi = () => axios.post("http://localhost:5000/logout");