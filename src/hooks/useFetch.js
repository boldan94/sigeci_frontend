import axios from "axios";
import Swal from "sweetalert2";
import HandlerApp from "../utils/HandlerApp";
import { useContext } from "react";
import { useNavigate } from "react-router";
import { AppContext } from "../context/AppContext";
// import { logoutGoogle } from "../utils/authGoogle";

// Variables fuera del hook para compartir el estado de refresh entre peticiones concurrentes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const useFetch = () => {
    const nav           = useNavigate();
    const handlerApp    = HandlerApp();
    const { app, setApp } = useContext(AppContext);
    
    const instance = axios.create({
        baseURL: `${import.meta.env.VITE_BACKEND_URL}`,
        headers: {
            Authorization: (app.token) ? app.token : (localStorage.getItem("token") || "")
        }
    });
    
    const logout = async () => {
        handlerApp.setLoader(false);
        await Swal.fire({
            title: "",
            text: "Session Expired",
            icon: "info"
        });
        localStorage.clear();
        // await logoutGoogle();
        setApp({
            token: null,
            timezone: null
        });
        nav("/login");
    };

    const notPermissions = async () => {
        handlerApp.setLoader(false);
        await Swal.fire({
            title: "",
            text: "Not permission",
            icon: "warning"
        });
        nav("/");
    };

    // --- INTERCEPTOR DE RESPUESTA PARA REFRESH TOKEN ---
    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            const isTokenExpired = error.response?.status === 401;
            const isAuthEndpoint = originalRequest.url?.includes("/auth/login") || 
                                   originalRequest.url?.includes("/auth/refresh");

            // Evitar reintento si la petición que falló fue login o el propio refresh
            if (isTokenExpired && !originalRequest._retry && !isAuthEndpoint) {
                
                // Si ya hay un refresco en curso, encolamos la petición
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                    .then((newToken) => {
                        originalRequest.headers.Authorization = newToken;
                        return instance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                const storedRefreshToken = localStorage.getItem("refreshToken");

                if (!storedRefreshToken) {
                    isRefreshing = false;
                    await logout();
                    return Promise.reject(error);
                }

                try {
                    // Petición al endpoint /refresh o /refresh-token
                    const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
                    const refreshUrl = baseUrl.includes("/api/v1") 
                        ? `${baseUrl}/auth/refresh/` 
                        : `${baseUrl}/api/v1/auth/refresh/`;

                    const response = await axios.post(refreshUrl, {
                        refresh_token: storedRefreshToken
                    });

                    if (response.data?.success) {
                        const responseData = response.data?.data || response.data;
                        const newAccessToken = responseData.token;
                        const newRefreshToken = responseData.refresh_token;

                        // 1. Guardar en localStorage
                        localStorage.setItem("token", newAccessToken);
                        if (newRefreshToken) {
                            localStorage.setItem("refreshToken", newRefreshToken);
                        }

                        // 2. Actualizar estado en AppContext
                        setApp(prev => ({
                            ...prev,
                            token: newAccessToken
                        }));

                        // 3. Actualizar headers de la instancia y de la petición fallida
                        instance.defaults.headers.Authorization = newAccessToken;
                        originalRequest.headers.Authorization = newAccessToken;

                        // 4. Despachar las peticiones encoladas
                        processQueue(null, newAccessToken);

                        // 5. Reintentar la petición original
                        return instance(originalRequest);
                    } else {
                        throw new Error(response.data?.message || "No fue posible renovar la sesión");
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    await logout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );

    const buildUrl = (url, params) => {
        if (!params) return url;
        const query = new URLSearchParams(params).toString();
        return query ? `${url}?${query}` : url;
    };

    const post = async (url, body = {}, params = null, captchaToken = null) => {
        url = buildUrl(url, params);
        const payload = captchaToken ? { ...body, captchaToken } : body;
        return new Promise((resolve, reject) => {
            instance.post(url, payload)
            .then(async response => {
                if (response.data?.action === "closeSession") {
                    await logout();
                }
                resolve(response.data);
            }).catch(error => {
                if (error.response?.status === 403) {
                    notPermissions();
                }
                reject(error.response?.data || error);
            });
        });
    };

    const put = async (url, body = {}, params = null, captchaToken = null) => {
        url = buildUrl(url, params);
        const payload = captchaToken ? { ...body, captchaToken } : body;
        return new Promise((resolve, reject) => {
            instance.put(url, payload)
            .then(async response => {
                if (response.data?.action === "closeSession") {
                    await logout();
                }
                resolve(response.data);
            }).catch(error => {
                if (error.response?.status === 403) {
                    notPermissions();
                }
                reject(error.response?.data || error);
            });
        });
    };

    const get = async (url, params = null) => {
        url = buildUrl(url, params);
        return new Promise((resolve, reject) => {
            instance.get(url)
            .then(async response => {
                if (response.data?.action === "closeSession") {
                    await logout();
                }
                resolve(response.data);
            }).catch(error => {
                if (error.response?.status === 403) {
                    notPermissions();
                }
                reject(error.response?.data || error);
            });
        });
    };
    
    const patch = async (url, body = {}, params = null, captchaToken = null) => {
        url = buildUrl(url, params);
        const payload = captchaToken ? { ...body, captchaToken } : body;
        return new Promise((resolve, reject) => {
            instance.patch(url, payload)
            .then(async response => {
                if (response.data?.action === "closeSession") {
                    await logout();
                }
                resolve(response.data);
            }).catch(error => {
                if (error.response?.status === 403) {
                    notPermissions();
                }
                reject(error.response?.data || error);
            });
        });
    };

    const deleteMethod = async (url, body = {}, params = null, captchaToken = null) => {
        url = buildUrl(url, params);
        const payload = captchaToken ? { ...body, captchaToken } : body;
        return new Promise((resolve, reject) => {
            instance.delete(url, { data: payload })
            .then(async response => {
                if (response.data?.action === "closeSession") {
                    await logout();
                }
                resolve(response.data);
            }).catch(error => {
                if (error.response?.status === 403) {
                    notPermissions();
                }
                reject(error.response?.data || error);
            });
        });
    };

    return { post, put, patch, get, deleteMethod, nav, logout };
};