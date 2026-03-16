import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
});

// Token will be set by the AuthProvider
let getTokenFn: (() => Promise<string | null>) | null = null;

export function setGetTokenFn(fn: () => Promise<string | null>) {
  getTokenFn = fn;
}

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    const token = await getTokenFn();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
