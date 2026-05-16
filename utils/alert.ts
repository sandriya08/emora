import { Alert, Platform } from "react-native";

/**
 * A platform-compatible confirmation dialog.
 * Uses window.confirm on Web and Alert.alert on Mobile.
 */
export const confirmAction = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "Confirm",
  cancelText: string = "Cancel"
) => {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel" },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
};
