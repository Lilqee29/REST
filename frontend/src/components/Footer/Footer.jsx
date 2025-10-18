import React, { useState } from "react";
import "./Footer.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Facebook, Twitter, Instagram, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage("Veuillez entrer votre email");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ " + data.message);
        setEmail("");
      } else {
        setMessage("⚠️ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      {/* Logo + Réseaux sociaux */}
      <div className="footer-top">
        <div className="footer-logo">
          <img src={assets.logo} alt="Logo Kebab Express" />
        </div>
        <div className="footer-socials">
          <Facebook size={20} />
          <Twitter size={20} />
          <Instagram size={20} />
        </div>
      </div>

      {/* Newsletter + Contacts */}
      <div className="footer-middle">
        <div className="footer-newsletter">
          <p>Abonnez-vous à notre newsletter :</p>
          <form onSubmit={handleSubscribe} className="newsletter-input">
            <input 
              type="email" 
              placeholder="Votre email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "..." : "S'inscrire"}
            </button>
          </form>
          {message && <p className="newsletter-message">{message}</p>}
        </div>

        <div className="footer-contact">
          <p><Phone size={16} /> +33 1 23 45 67 89</p>
          <p><Mail size={16} /> contact@kebabexpress.fr</p>
          <p><MapPin size={16} /> 25 Rue du Goût, Paris</p>
        </div>
      </div>

      <hr />

      {/* Copyright */}
      <p className="footer-copy">
        © 2024 Kebab Express – Tous droits réservés.
      </p>
    </footer>
  );
};

export default Footer;