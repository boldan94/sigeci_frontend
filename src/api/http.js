const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

const getErrorMessage = (payload, fallback) => {
    if (!payload || typeof payload !== "object") {
        return fallback;
    }

    if (payload.message) {
        return payload.message;
    }

    if (payload.detail) {
        return Array.isArray(payload.detail) ? payload.detail.join(" ") : payload.detail;
    }

    const fieldMessages = Object.values(payload)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value) => typeof value === "string");

    return fieldMessages.length ? fieldMessages.join(" ") : fallback;
};

export const request = async (path, options = {}) => {
    const { skipAuthRefresh = false, ...fetchOptions } = options;
    const hasBody = options.body !== undefined && options.body !== null;
    const headers = {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        ...(fetchOptions.headers || {})
    };
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }
    const body = hasBody && typeof fetchOptions.body !== "string"
        ? JSON.stringify(fetchOptions.body)
        : fetchOptions.body;
    const url = new URL(`${backendUrl}${path}`);

    Object.entries(fetchOptions.params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url, {
        ...fetchOptions,
        body,
        headers
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (response.status === 401 && !skipAuthRefresh && !path.includes("/auth/refresh")) {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
            try {
                const refreshResponse = await request("/auth/refresh/", {
                    method: "POST",
                    body: { refresh_token: refreshToken },
                    skipAuthRefresh: true
                });
                const newToken = refreshResponse.data?.token || refreshResponse.token;
                if (newToken) {
                    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
                    return request(path, { ...fetchOptions, skipAuthRefresh: true });
                }
            } catch {
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
            }
        }
    }

    if (!response.ok) {
        throw new ApiError(
            response.status,
            getErrorMessage(payload, "No fue posible completar la solicitud.")
        );
    }

    return payload;
};
