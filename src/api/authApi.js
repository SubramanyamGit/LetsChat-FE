import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "./axiosInstance";

// Signup API
export const useSignup = () => {
    return useMutation({
        mutationFn: (userData) => axiosInstance.post("/sign_up", userData),
    });
};

// Signin API
export const useSignin = () => {
    return useMutation({
        mutationFn: (loginData) => axiosInstance.post("/sign_in", loginData),
    });
};

// OAuth API (Google/GitHub)
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
