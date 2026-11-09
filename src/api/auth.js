import { request } from "./http";

export const login = async ({ identifier, password, captchaToken }) => {
    const response = await request("/api/auth/login/", {
        method: "POST",
        body: { identifier, password, captchaToken }
    });
    localStorage.setItem("access", response.access);
    localStorage.setItem("refresh", response.refresh);
    localStorage.setItem("user", JSON.stringify(response.user));
    return response;
};

export const register = (credentials) =>
    request("/api/auth/register/", {
        method: "POST",
        body: credentials
    });

export const getCurrentUser = () => request("/auth/me/");

export const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
};

export const forgotPassword = (email) =>
    request("/api/auth/password/forgot/", {
        method: "POST",
        body: { email }
    });

export const resetPassword = ({ email, code, password }) =>
    request("/api/auth/password/reset/", {
        method: "POST",
        body: { email, pin: code, password }
    });
