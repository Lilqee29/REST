import React from "react";
import "./Header.css";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="header">
      <div className="header-contents">
        <h2>Découvrez vos plats préférés dès maintenant</h2>
        <p>
          Explorez notre menu varié, composé de plats raffinés préparés avec les
          meilleurs ingrédients et un savoir-faire culinaire exceptionnel. Notre
          objectif : satisfaire vos envies et transformer chaque repas en une
          expérience gastronomique mémorable.
        </p>
        <Link to="/menu">
          <button>Consulter le Menu</button>
        </Link>
      </div>
    </div>
  );
};

export default Header;
