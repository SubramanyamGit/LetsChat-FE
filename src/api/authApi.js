import { useMutation } from "@tanstack/react-query";
import { axiosInstance,axiosInstanceWithToken } from "./axiosInstance";

// OAuth API (Google)
export const useOAuthSignin = (provider) => {
    return useMutation({
        mutationFn: (tokenData) => axiosInstance.post(`/sign_in/auth/${provider}`, tokenData),
    });
};

// Google Signup API
export const useOAuthSignup = (provider) => {
    return useMutation({
        mutationFn: (tokenData) => axiosInstance.post(`/sign_up/auth/${provider}`, tokenData),
    });
};

// Logout API
export const useLogout = () => {
    return useMutation({
        mutationFn: () => axiosInstanceWithToken.post("/logout"),
    });
};