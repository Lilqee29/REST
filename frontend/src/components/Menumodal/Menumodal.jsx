/* eslint-disable react/prop-types */
// components/ItemModal/ItemModal.jsx
import { useState } from "react";
import "./Menumodal.css";

export default function ItemModal({ item, onClose, onAddToCart }) {
  const [meat, setMeat] = useState(item.meatOptions?.[0] || "");
  const [sauce, setSauce] = useState(item.sauceOptions?.[0] || "");
  const [drink, setDrink] = useState(item.drinkOptions?.[0] || "");
  const [step, setStep] = useState(1);

  const dessertOptions = ["Ice Cream", "Cookie", "Brownie"];
  const randomDessert = dessertOptions[Math.floor(Math.random() * dessertOptions.length)];

  const handleNext = () => setStep(prev => prev + 1);

  const handleAddToCart = () => {
    onAddToCart({
      name: item.name,
      meat,
      sauce,
      drink,
      dessert: randomDessert,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>X</button>

        {step === 1 && (
          <>
            <h2>{item.name}</h2>
            {item.meatOptions && (
              <div>
                <p>Choisissez votre viande:</p>
                {item.meatOptions.map((m, i) => (
                  <button
                    key={i}
                    className={meat === m ? "active" : ""}
                    onClick={() => setMeat(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            <div>
              <p>Allergènes: {item.allergens.join(", ")}</p>
            </div>
            <button onClick={handleNext}>Suivant →</button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Sauces</h2>
            {item.sauceOptions?.map((s, i) => (
              <button
                key={i}
                className={sauce === s ? "active" : ""}
                onClick={() => setSauce(s)}
              >
                {s}
              </button>
            ))}
            <button onClick={handleNext}>Suivant →</button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Boissons</h2>
            {item.drinkOptions?.map((d, i) => (
              <button
                key={i}
                className={drink === d ? "active" : ""}
                onClick={() => setDrink(d)}
              >
                {d}
              </button>
            ))}
            <button onClick={handleNext}>Suivant →</button>
          </>
        )}

        {step === 4 && (
          <>
            <h2>Dessert Suggestion 🎉</h2>
            <p>{randomDessert}</p>
            <button onClick={handleAddToCart}>Ajouter au Panier</button>
          </>
        )}
      </div>
    </div>
  );
}
