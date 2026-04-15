import io from "socket.io-client";
import { getToken } from "./auth";

const socket = io(import.meta.env.VITE_API_URL, {
  auth: { token: getToken() },
  autoConnect: false,
});

export { socket };
