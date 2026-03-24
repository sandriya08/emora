import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://127.0.0.1:5000"
    : Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://127.0.0.1:5000";
