import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

export const useUserCheck = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
    setUserChecked(true);

    // check for Stripe success param
    const params = new URLSearchParams(location.search);
    const success = params.get("success");

    // show toast only if user not logged in and not coming from Stripe success
    if (!savedUser && !success) {
      setTimeout(() => {
        toast.error("User not logged in", { toastId: "login-error" });
      }, 300);
    }
  }, [location]);

  return { user, userChecked, setUser };
};
