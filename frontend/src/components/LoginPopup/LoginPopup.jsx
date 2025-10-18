import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState("Connexion");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  
  // Password reset states
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState("email"); // "email", "code", "password"
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    let endpoint = url;
    endpoint += currentState === "Connexion" ? "/api/user/login" : "/api/user/register";

    try {
      const response = await axios.post(endpoint, data);
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);
        toast.success("Connexion réussie !");
        setShowLogin(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  // Step 1: Send verification code
  const handleSendCode = async (event) => {
    event.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/forgot-password`, {
        email: forgotPasswordEmail,
      });

      if (response.data.success) {
        toast.success("Code de vérification envoyé ! Vérifiez votre boîte mail.");
        setResetStep("code");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify code
  const handleVerifyCode = async (event) => {
    event.preventDefault();
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast.error("Veuillez entrer un code valide à 6 chiffres");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/verify-reset-code`, {
        email: forgotPasswordEmail,
        code: verificationCode,
      });

      if (response.data.success) {
        toast.success("Code vérifié ! Vous pouvez maintenant changer votre mot de passe.");
        setResetStep("password");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la vérification. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (event) => {
    event.preventDefault();
    
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/reset-password`, {
        email: forgotPasswordEmail,
        code: verificationCode,
        newPassword,
      });

      if (response.data.success) {
        toast.success("Mot de passe réinitialisé avec succès ! Vous pouvez vous connecter.");
        // Reset all states
        setForgotPasswordEmail("");
        setVerificationCode("");
        setNewPassword("");
        setConfirmPassword("");
        setResetStep("email");
        setShowForgotPassword(false);
        setCurrentState("Connexion");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la réinitialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPasswordFlow = () => {
    setForgotPasswordEmail("");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStep("email");
    setShowForgotPassword(false);
  };

  // FORGOT PASSWORD FLOW - Step 1: Enter Email
  if (showForgotPassword && resetStep === "email") {
    return (
      <div className="login-popup">
        <form onSubmit={handleSendCode} className="login-popup-container">
          <div className="login-popup-title">
            <h2>Réinitialiser le mot de passe</h2>
            <img
              onClick={() => setShowLogin(false)}
              src={assets.cross_icon}
              alt="Fermer"
            />
          </div>

          <div className="login-popup-inputs">
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              Entrez votre email pour recevoir un code de vérification
            </p>
            <input
              name="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              type="email"
              placeholder="Votre email"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le code"}
          </button>

          <p style={{ textAlign: "center", marginTop: "15px" }}>
            <span
              onClick={resetForgotPasswordFlow}
              style={{ cursor: "pointer", color: "#f1683b" }}
            >
              Retour à la connexion
            </span>
          </p>
        </form>
      </div>
    );
  }

  // FORGOT PASSWORD FLOW - Step 2: Enter Verification Code
  if (showForgotPassword && resetStep === "code") {
    return (
      <div className="login-popup">
        <form onSubmit={handleVerifyCode} className="login-popup-container">
          <div className="login-popup-title">
            <h2>Entrer le code</h2>
            <img
              onClick={() => setShowLogin(false)}
              src={assets.cross_icon}
              alt="Fermer"
            />
          </div>

          <div className="login-popup-inputs">
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              Un code à 6 chiffres a été envoyé à <strong>{forgotPasswordEmail}</strong>
            </p>
            <input
              name="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              type="text"
              placeholder="Code à 6 chiffres"
              maxLength="6"
              style={{ letterSpacing: "8px", fontSize: "20px", textAlign: "center" }}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Vérifier le code"}
          </button>

          <p style={{ textAlign: "center", marginTop: "15px", fontSize: "13px" }}>
            <span
              onClick={(e) => {
                e.preventDefault();
                handleSendCode(e);
              }}
              style={{ cursor: "pointer", color: "#667eea", textDecoration: "underline" }}
            >
              Renvoyer le code
            </span>
            {" | "}
            <span
              onClick={resetForgotPasswordFlow}
              style={{ cursor: "pointer", color: "#f1683b" }}
            >
              Annuler
            </span>
          </p>
        </form>
      </div>
    );
  }

  // FORGOT PASSWORD FLOW - Step 3: Enter New Password
  if (showForgotPassword && resetStep === "password") {
    return (
      <div className="login-popup">
        <form onSubmit={handleResetPassword} className="login-popup-container">
          <div className="login-popup-title">
            <h2>Nouveau mot de passe</h2>
            <img
              onClick={() => setShowLogin(false)}
              src={assets.cross_icon}
              alt="Fermer"
            />
          </div>

          <div className="login-popup-inputs">
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "15px" }}>
              Entrez votre nouveau mot de passe
            </p>
            <input
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="Nouveau mot de passe (min. 8 caractères)"
              required
            />
            <input
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>

          <p style={{ textAlign: "center", marginTop: "15px" }}>
            <span
              onClick={resetForgotPasswordFlow}
              style={{ cursor: "pointer", color: "#f1683b" }}
            >
              Annuler
            </span>
          </p>
        </form>
      </div>
    );
  }

  // NORMAL LOGIN/REGISTER FORM
  return (
    <div className="login-popup">
      <form onSubmit={onSubmit} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currentState}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="Fermer"
          />
        </div>

        <div className="login-popup-inputs">
          {currentState !== "Connexion" && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Votre nom"
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Votre email"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Votre mot de passe"
            required
          />
        </div>

        <button type="submit">
          {currentState === "Inscription" ? "Créer un compte" : "Connexion"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>En continuant, j'accepte les conditions d'utilisation et la politique de confidentialité.</p>
        </div>

        {currentState === "Connexion" ? (
          <>
            <p>
              Créer un nouveau compte ?{" "}
              <span onClick={() => setCurrentState("Inscription")}>Cliquez ici</span>
            </p>
            <p style={{ textAlign: "center", marginTop: "10px" }}>
              <span
                onClick={() => setShowForgotPassword(true)}
                style={{
                  cursor: "pointer",
                  color: "#f1683b",
                  textDecoration: "underline",
                  fontSize: "13px"
                }}
              >
                Mot de passe oublié ?
              </span>
            </p>
          </>
        ) : (
          <p>
            Vous avez déjà un compte ?{" "}
            <span onClick={() => setCurrentState("Connexion")}>Connectez-vous ici</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;