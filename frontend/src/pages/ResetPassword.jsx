// pages/ResetPassword.jsx
import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/reset-password`,
        { token, newPassword }
      );

      if (response.data.success) {
        toast.success("Mot de passe réinitialisé avec succès !");
        // Redirect to login
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password">
      <form onSubmit={handleReset}>
        <h2>Nouveau mot de passe</h2>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Traitement..." : "Réinitialiser"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;