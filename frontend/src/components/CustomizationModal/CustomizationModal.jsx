import React, { useState, useContext, useEffect } from 'react';
import './CustomizationModal.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const CustomizationModal = ({ item, onClose, onAddToCart }) => {
  const { url } = useContext(StoreContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    meatOption: null,
    sauceOption: null,
    drinkOption: null,
    dessertOption: null
  });
  
  const [availableOptions, setAvailableOptions] = useState({
    meatOptions: [],
    sauceOptions: [],
    drinkOptions: [],
    dessertOptions: []
  });

  // Fetch available options based on the item's customization options
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // Fetch meat options if available
        if (item.availableMeatOptions && item.availableMeatOptions.length > 0) {
          const meatResponse = await axios.get(`${url}/api/customization/meat`);
          if (meatResponse.data.success) {
            // Filter to only include options that are in the item's available options
            const filteredMeatOptions = meatResponse.data.data.filter(option => 
              item.availableMeatOptions.includes(option._id)
            );
            setAvailableOptions(prev => ({ ...prev, meatOptions: filteredMeatOptions }));
          }
        }

        // Fetch sauce options if available
        if (item.availableSauceOptions && item.availableSauceOptions.length > 0) {
          const sauceResponse = await axios.get(`${url}/api/customization/sauce`);
          if (sauceResponse.data.success) {
            const filteredSauceOptions = sauceResponse.data.data.filter(option => 
              item.availableSauceOptions.includes(option._id)
            );
            setAvailableOptions(prev => ({ ...prev, sauceOptions: filteredSauceOptions }));
          }
        }

        // Fetch drink options if available
        if (item.availableDrinkOptions && item.availableDrinkOptions.length > 0) {
          const drinkResponse = await axios.get(`${url}/api/customization/drink`);
          if (drinkResponse.data.success) {
            const filteredDrinkOptions = drinkResponse.data.data.filter(option => 
              item.availableDrinkOptions.includes(option._id)
            );
            setAvailableOptions(prev => ({ ...prev, drinkOptions: filteredDrinkOptions }));
          }
        }

        // Fetch dessert options if available
        if (item.suggestedDesserts && item.suggestedDesserts.length > 0) {
          const dessertResponse = await axios.get(`${url}/api/customization/dessert`);
          if (dessertResponse.data.success) {
            const filteredDessertOptions = dessertResponse.data.data.filter(option => 
              item.suggestedDesserts.includes(option._id)
            );
            setAvailableOptions(prev => ({ ...prev, dessertOptions: filteredDessertOptions }));
          }
        }
      } catch (error) {
        console.error('Error fetching customization options:', error);
      } finally {
        setLoading(false);
      }
    };

    if (item) {
      fetchOptions();
    }
  }, [item, url]);

  // Determine the maximum number of steps based on available options
  const getMaxSteps = () => {
    let steps = 1; // Start with 1 for the summary step
    if (availableOptions.meatOptions.length > 0) steps++;
    if (availableOptions.sauceOptions.length > 0) steps++;
    if (availableOptions.drinkOptions.length > 0) steps++;
    if (availableOptions.dessertOptions.length > 0) steps++;
    return steps;
  };

  const handleNext = () => {
    if (step < getMaxSteps()) {
      setStep(step + 1);
    } else {
      // Final step - add to cart with selected options
      handleAddToCart();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleOptionSelect = (optionType, option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionType]: option
    }));
  };

  const handleAddToCart = () => {
    // Create a customized item with the selected options
    const customizedItem = {
      ...item,
      customization: {
        meatOption: selectedOptions.meatOption,
        sauceOption: selectedOptions.sauceOption,
        drinkOption: selectedOptions.drinkOption,
        dessertOption: selectedOptions.dessertOption
      }
    };
    
    // Calculate additional price from options
    let additionalPrice = 0;
    if (selectedOptions.meatOption) additionalPrice += selectedOptions.meatOption.price || 0;
    if (selectedOptions.sauceOption) additionalPrice += selectedOptions.sauceOption.price || 0;
    if (selectedOptions.drinkOption) additionalPrice += selectedOptions.drinkOption.price || 0;
    if (selectedOptions.dessertOption) additionalPrice += selectedOptions.dessertOption.price || 0;
    
    customizedItem.totalPrice = item.price + additionalPrice;
    
    // Call the onAddToCart function with the customized item
    onAddToCart(customizedItem);
    onClose();
  };

  // Render the current step content
  const renderStepContent = () => {
    if (loading) {
      return <div className="loading">Loading options...</div>;
    }

    // Determine which step to show based on available options
    let currentStepType = '';
    let currentStepNumber = 1;
    
    if (availableOptions.meatOptions.length > 0) {
      if (currentStepNumber === step) {
        currentStepType = 'meat';
      }
      currentStepNumber++;
    }
    
    if (availableOptions.sauceOptions.length > 0 && currentStepType === '') {
      if (currentStepNumber === step) {
        currentStepType = 'sauce';
      }
      currentStepNumber++;
    }
    
    if (availableOptions.drinkOptions.length > 0 && currentStepType === '') {
      if (currentStepNumber === step) {
        currentStepType = 'drink';
      }
      currentStepNumber++;
    }
    
    if (availableOptions.dessertOptions.length > 0 && currentStepType === '') {
      if (currentStepNumber === step) {
        currentStepType = 'dessert';
      }
      currentStepNumber++;
    }
    
    // If we've gone through all option types, show the summary
    if (currentStepType === '') {
      return renderSummary();
    }

    // Render the appropriate options based on the current step type
    switch (currentStepType) {
      case 'meat':
        return renderOptionSelection('Choose your meat', availableOptions.meatOptions, 'meatOption');
      case 'sauce':
        return renderOptionSelection('Choose your sauce', availableOptions.sauceOptions, 'sauceOption');
      case 'drink':
        return renderOptionSelection('Choose your drink', availableOptions.drinkOptions, 'drinkOption');
      case 'dessert':
        return renderOptionSelection('Add a dessert?', availableOptions.dessertOptions, 'dessertOption');
      default:
        return null;
    }
  };

  // Render option selection for a specific type (meat, sauce, etc.)
  const renderOptionSelection = (title, options, optionType) => {
    return (
      <div className="option-selection">
        <h3>{title}</h3>
        <div className="options-grid">
          {options.map(option => (
            <div 
              key={option._id}
              className={`option-card ${selectedOptions[optionType]?._id === option._id ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(optionType, option)}
            >
              <div className="option-image-container">
                {option.image && (
                  <img 
                    src={`${url}/images/${option.image}`} 
                    alt={option.name} 
                    className="option-image" 
                  />
                )}
              </div>
              <div className="option-info">
                <h4>{option.name}</h4>
                <p>{option.description}</p>
                {option.price > 0 && <span className="option-price">+${option.price.toFixed(2)}</span>}
              </div>
            </div>
          ))}
          <div 
            className={`option-card ${selectedOptions[optionType] === null ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(optionType, null)}
          >
            <div className="option-info">
              <h4>No thanks</h4>
              <p>Skip this option</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the summary step
  const renderSummary = () => {
    // Calculate total price
    let totalPrice = item.price;
    if (selectedOptions.meatOption) totalPrice += selectedOptions.meatOption.price || 0;
    if (selectedOptions.sauceOption) totalPrice += selectedOptions.sauceOption.price || 0;
    if (selectedOptions.drinkOption) totalPrice += selectedOptions.drinkOption.price || 0;
    if (selectedOptions.dessertOption) totalPrice += selectedOptions.dessertOption.price || 0;

    return (
      <div className="summary">
        <h3>Your Customized Order</h3>
        <div className="summary-item">
          <h4>{item.name}</h4>
          <p>{item.description}</p>
          <p className="item-price">${item.price.toFixed(2)}</p>
        </div>

        {selectedOptions.meatOption && (
          <div className="summary-option">
            <h5>Meat: {selectedOptions.meatOption.name}</h5>
            {selectedOptions.meatOption.price > 0 && (
              <span>+${selectedOptions.meatOption.price.toFixed(2)}</span>
            )}
          </div>
        )}

        {selectedOptions.sauceOption && (
          <div className="summary-option">
            <h5>Sauce: {selectedOptions.sauceOption.name}</h5>
            {selectedOptions.sauceOption.price > 0 && (
              <span>+${selectedOptions.sauceOption.price.toFixed(2)}</span>
            )}
          </div>
        )}

        {selectedOptions.drinkOption && (
          <div className="summary-option">
            <h5>Drink: {selectedOptions.drinkOption.name}</h5>
            {selectedOptions.drinkOption.price > 0 && (
              <span>+${selectedOptions.drinkOption.price.toFixed(2)}</span>
            )}
          </div>
        )}

        {selectedOptions.dessertOption && (
          <div className="summary-option">
            <h5>Dessert: {selectedOptions.dessertOption.name}</h5>
            {selectedOptions.dessertOption.price > 0 && (
              <span>+${selectedOptions.dessertOption.price.toFixed(2)}</span>
            )}
          </div>
        )}

        <div className="total-price">
          <h4>Total:</h4>
          <h4>${totalPrice.toFixed(2)}</h4>
        </div>
      </div>
    );
  };

  // Progress indicator
  const renderProgressBar = () => {
    const maxSteps = getMaxSteps();
    return (
      <div className="progress-bar">
        {Array.from({ length: maxSteps }, (_, i) => (
          <div 
            key={i} 
            className={`progress-step ${i + 1 === step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
            onClick={() => setStep(i + 1)}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="customization-modal-overlay">
      <div className="customization-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Customize Your {item.name}</h2>
        
        {renderProgressBar()}
        
        <div className="modal-content">
          {renderStepContent()}
        </div>
        
        <div className="modal-footer">
          {step > 1 && (
            <button className="previous-button" onClick={handlePrevious}>
              Previous
            </button>
          )}
          <button className="next-button" onClick={handleNext}>
            {step === getMaxSteps() ? 'Add to Cart' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;