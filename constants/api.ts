import { Platform } from "react-native";

export const API_URL =
  Platform.OS === "web"
    ? "http://localhost:5000"
    : Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://localhost:5000";
