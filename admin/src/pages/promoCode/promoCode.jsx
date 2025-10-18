import React, { useState, useEffect } from "react";
import "./promoCode.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Users, TrendingUp, DollarSign, Eye, MoreVertical, Edit2, Trash2, Power } from 'lucide-react';

const PromoCodeManager = ({ url }) => {
  const token = localStorage.getItem("token");
  console.log("Token being sent:", token);

  const [promoCodes, setPromoCodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscount: "",
    usageLimit: "",
    perUserLimit: "1",
    minItems: "",
    minAmount: "",
    validUntil: ""
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const tokenFromStorage = localStorage.getItem("token");
      if (!tokenFromStorage) {
        toast.error("Vous n'êtes pas connecté. Veuillez vous connecter en tant qu'administrateur.");
        return;
      }
      
      const baseUrl = url ? (url.endsWith('/') ? url.slice(0, -1) : url) : '';
      const response = await axios.get(`${baseUrl}/api/promo/all`, {
        headers: { 
          token: tokenFromStorage,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setPromoCodes(response.data.data);
      } else {
        toast.error(response.data.message || "Erreur lors du chargement des codes promo");
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      toast.error("Erreur de connexion au serveur");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      maxDiscount: "",
      usageLimit: "",
      perUserLimit: "1",
      minItems: "",
      minAmount: "",
      validUntil: ""
    });
    setEditingPromo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tokenFromStorage = localStorage.getItem("token");
      if (!tokenFromStorage) {
        toast.error("Vous n'êtes pas connecté. Veuillez vous connecter en tant qu'administrateur.");
        return;
      }
      
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        perUserLimit: parseInt(formData.perUserLimit),
        conditions: {
          minItems: formData.minItems ? parseInt(formData.minItems) : 0,
          minAmount: formData.minAmount ? parseFloat(formData.minAmount) : 0
        },
        validUntil: formData.validUntil
      };

      const baseUrl = url ? (url.endsWith('/') ? url.slice(0, -1) : url) : '';
      let response;
      
      if (editingPromo) {
        response = await axios.put(
          `${baseUrl}/api/promo/update/${editingPromo._id}`,
          payload,
          { headers: { token: tokenFromStorage, 'Content-Type': 'application/json' } }
        );
      } else {
        response = await axios.post(
          `${baseUrl}/api/promo/create`,
          payload,
          { headers: { token: tokenFromStorage, 'Content-Type': 'application/json' } }
        );
      }

      if (response.data.success) {
        toast.success(editingPromo ? "Code promo mis à jour" : "Code promo créé");
        setShowModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        toast.error(response.data.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Error submitting promo code:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      maxDiscount: promo.maxDiscount?.toString() || "",
      usageLimit: promo.usageLimit?.toString() || "",
      perUserLimit: promo.perUserLimit.toString(),
      minItems: promo.conditions?.minItems?.toString() || "",
      minAmount: promo.conditions?.minAmount?.toString() || "",
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString().split('T')[0] : ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce code promo ?")) return;

    try {
      const tokenFromStorage = localStorage.getItem("token");
      if (!tokenFromStorage) {
        toast.error("Vous n'êtes pas connecté. Veuillez vous connecter en tant qu'administrateur.");
        return;
      }
      
      const baseUrl = url ? (url.endsWith('/') ? url.slice(0, -1) : url) : '';
      const response = await axios.delete(`${baseUrl}/api/promo/delete/${id}`, {
        headers: { token: tokenFromStorage, 'Content-Type': 'application/json' }
      });
      
      if (response.data.success) {
        toast.success("Code promo supprimé");
        fetchPromoCodes();
      } else {
        toast.error(response.data.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast.error("Erreur de connexion au serveur");
    }
  };

  const handleToggle = async (id) => {
    try {
      const tokenFromStorage = localStorage.getItem("token");
      if (!tokenFromStorage) {
        toast.error("Vous n'êtes pas connecté. Veuillez vous connecter en tant qu'administrateur.");
        return;
      }
      
      const baseUrl = url ? (url.endsWith('/') ? url.slice(0, -1) : url) : '';
      const response = await axios.patch(
        `${baseUrl}/api/promo/toggle/${id}`,
        {},
        { headers: { token: tokenFromStorage, 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Statut du code promo mis à jour");
        fetchPromoCodes();
      } else {
        toast.error(response.data.message || "Erreur lors de la mise à jour du statut");
      }
    } catch (error) {
      console.error("Error toggling promo code:", error);
      toast.error("Erreur de connexion au serveur");
    }
  };

  const getDiscountDisplay = (promo) => {
    if (promo.discountType === "percentage") {
      return `${promo.discountValue}%`;
    } else if (promo.discountType === "fixed") {
      return `${promo.discountValue}€`;
    } else {
      return `${promo.discountValue}% (conditionnel)`;
    }
  };

const calculateTotalRevenueLost = (promo) => {
  if (!promo.usedBy || promo.usedBy.length === 0) {
    return "0.00";
  }
  
  const total = promo.usedBy.reduce((sum, use) => {
    const discount = parseFloat(use.discountApplied) || 0;
    return sum + discount;
  }, 0);
  
  return total.toFixed(2);
};

  const calculateConversionRate = (promo) => {
    if (!promo.usageLimit) return "∞";
    return ((promo.usedCount / promo.usageLimit) * 100).toFixed(1);
  };

  const getUniqueUsers = (promo) => {
    return new Set(promo.usedBy?.map(u => u.userId) || []).size;
  };

  const sortedPromoCodes = [...promoCodes].sort((a, b) => {
    switch(sortBy) {
      case 'mostUsed':
        return (b.usedCount || 0) - (a.usedCount || 0);
      case 'leastUsed':
        return (a.usedCount || 0) - (b.usedCount || 0);
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  return (
    <div className="promo-manager">
      <div className="promo-header">
        <div className="promo-title-section">
          <h1>Gestion des Codes Promo</h1>
          <p className="promo-subtitle">Gérez et analysez l'utilisation de vos codes promotionnels</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Nouveau Code Promo
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon codes">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Codes Actifs</p>
            <h3 className="stat-value">{promoCodes.filter(p => p.isActive).length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Utilisations Totales</p>
            <h3 className="stat-value">{promoCodes.reduce((sum, p) => sum + (p.usedCount || 0), 0)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Réductions Accordées</p>
            <h3 className="stat-value">{promoCodes.reduce((sum, p) => sum + parseFloat(calculateTotalRevenueLost(p)), 0).toFixed(2)}€</h3>
          </div>
        </div>
      </div>

      {/* Sorting */}
      <div className="promo-controls">
        <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Plus récents</option>
          <option value="mostUsed">Plus utilisés</option>
          <option value="leastUsed">Moins utilisés</option>
        </select>
      </div>

      {/* Grid */}
      <div className="promo-grid">
        {sortedPromoCodes.map((promo) => (
          <div key={promo._id} className={`promo-card ${!promo.isActive ? 'inactive' : ''}`}>
            {/* Header */}
            <div className="promo-card-header">
              <div className="promo-code-info">
                <h3 className="promo-code">{promo.code}</h3>
                <p className="promo-description">{promo.description}</p>
              </div>
              <div className={`status-badge ${promo.isActive ? 'active' : 'inactive'}`}>
                {promo.isActive ? 'Actif' : 'Inactif'}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="promo-metrics">
              <div className="metric-item">
                <span className="metric-label">Utilisateurs Uniques</span>
                <span className="metric-value">{getUniqueUsers(promo)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Utilisations</span>
                <span className="metric-value">{promo.usedCount || 0} {promo.usageLimit ? `/ ${promo.usageLimit}` : '/ ∞'}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Réductions</span>
                <span className="metric-value">{calculateTotalRevenueLost(promo)}€</span>
              </div>
            </div>

            {/* Details */}
            <div className="promo-details">
              <div className="detail-row">
                <span className="label">Type:</span>
                <span className="value discount">{getDiscountDisplay(promo)}</span>
              </div>
              
              {promo.conditions?.minItems > 0 && (
                <div className="detail-row">
                  <span className="label">Min. articles:</span>
                  <span className="value">{promo.conditions.minItems}</span>
                </div>
              )}
              
              {promo.conditions?.minAmount > 0 && (
                <div className="detail-row">
                  <span className="label">Min. montant:</span>
                  <span className="value">{promo.conditions.minAmount}€</span>
                </div>
              )}

              <div className="detail-row">
                <span className="label">Expire:</span>
                <span className="value">
                  {new Date(promo.validUntil).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="promo-actions">
              <button 
                onClick={() => { setSelectedPromo(promo); setShowDetails(true); }} 
                className="btn-details"
                title="Voir les détails"
              >
                <Eye size={16} />
                Détails
              </button>
              <button onClick={() => handleEdit(promo)} className="btn-edit" title="Modifier">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleToggle(promo._id)} className="btn-toggle" title={promo.isActive ? "Désactiver" : "Activer"}>
                <Power size={16} />
              </button>
              <button onClick={() => handleDelete(promo._id)} className="btn-delete" title="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {promoCodes.length === 0 && (
          <div className="empty-state">
            <p>Aucun code promo créé</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedPromo && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content modal-details" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails - {selectedPromo.code}</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="details-content">
              <div className="details-section">
                <h4>Statistiques d'Utilisation</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="label">Utilisateurs Uniques:</span>
                    <span className="value">{getUniqueUsers(selectedPromo)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Utilisations Totales:</span>
                    <span className="value">{selectedPromo.usedCount || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Réductions Accordées:</span>
                    <span className="value">{calculateTotalRevenueLost(selectedPromo)}€</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Taux d'Utilisation:</span>
                    <span className="value">{calculateConversionRate(selectedPromo)}%</span>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h4>Dernières Utilisations</h4>
                <div className="usage-list">
                  {selectedPromo.usedBy && selectedPromo.usedBy.slice(-5).reverse().map((usage, idx) => (
                    <div key={idx} className="usage-item">
                      <div className="usage-info">
                        <p className="usage-user">Utilisateur ID: {usage.userId.substring(0, 8)}...</p>
                        <p className="usage-date">{new Date(usage.usedAt).toLocaleDateString('fr-FR')} à {new Date(usage.usedAt).toLocaleTimeString('fr-FR')}</p>
                      </div>
                      <div className="usage-amount">
                        <p className="usage-label">Montant:</p>
                        <p className="usage-value">{usage.orderAmount}€</p>
                      </div>
                      <div className="usage-discount">
                        <p className="usage-label">Réduction:</p>
                        <p className="usage-value">-{usage.discountApplied}€</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedPromo.usedBy || selectedPromo.usedBy.length === 0) && (
                    <p className="no-usage">Aucune utilisation enregistrée</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPromo ? 'Modifier le Code Promo' : 'Nouveau Code Promo'}</h3>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>

            <div className="promo-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Code Promo *</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="PROMO20" required disabled={!!editingPromo} />
                </div>
                <div className="form-group">
                  <label>Type de Réduction *</label>
                  <select name="discountType" value={formData.discountType} onChange={handleInputChange} required>
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                    <option value="conditional">Conditionnel</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="20% de réduction sur votre commande" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valeur de Réduction * {formData.discountType === 'percentage' ? '(%)' : '(€)'}</label>
                  <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} placeholder="20" min="0" step="0.01" required />
                </div>
                {formData.discountType === 'percentage' && (
                  <div className="form-group">
                    <label>Réduction Maximum (€)</label>
                    <input type="number" name="maxDiscount" value={formData.maxDiscount} onChange={handleInputChange} placeholder="10" min="0" step="0.01" />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Articles Minimum</label>
                  <input type="number" name="minItems" value={formData.minItems} onChange={handleInputChange} placeholder="3" min="0" />
                </div>
                <div className="form-group">
                  <label>Montant Minimum (€)</label>
                  <input type="number" name="minAmount" value={formData.minAmount} onChange={handleInputChange} placeholder="25" min="0" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Limite d'Utilisation Totale</label>
                  <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleInputChange} placeholder="100 (vide = illimité)" min="1" />
                </div>
                <div className="form-group">
                  <label>Limite par Utilisateur *</label>
                  <input type="number" name="perUserLimit" value={formData.perUserLimit} onChange={handleInputChange} placeholder="1" min="1" required />
                </div>
              </div>

              <div className="form-group">
                <label>Date d'Expiration *</label>
                <input type="date" name="validUntil" value={formData.validUntil} onChange={handleInputChange} required min={new Date().toISOString().split('T')[0]} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</button>
                <button type="submit" className="btn-submit" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Enregistrement...' : editingPromo ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodeManager;