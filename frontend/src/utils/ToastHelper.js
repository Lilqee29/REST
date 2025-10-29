import { toast } from "react-toastify";

let currentToast = null;

export const showToast = (message, type = "info") => {
  // Dismiss the previous toast if exists
  if (currentToast) toast.dismiss(currentToast);

  // Show new toast and store its ID
  currentToast = toast[type](message, {
    autoClose: 2000,  // disappears after 2 seconds
  });
};
