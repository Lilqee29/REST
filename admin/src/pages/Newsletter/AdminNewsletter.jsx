import React, { useState, useEffect } from 'react';
import { Send, Users, Mail, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './AdminNewsletter.css';

export default function AdminNewsletter() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteType, setDeleteType] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('https://restaurant-backend-06ce.onrender.com/api/newsletter/subscribers');
      const data = await res.json();
      setSubscribers(data.subscribers || []);
      setSubscriberCount(data.count || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des abonnés:', error);
    }
  };

  const handleDelete = async (email) => {
    try {
      const res = await fetch('https://restaurant-backend-06ce.onrender.com/api/newsletter/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteMessage(data.message);
        setDeleteType('success');
        fetchSubscribers();
      } else {
        setDeleteMessage(data.message);
        setDeleteType('error');
      }
    } catch (error) {
      setDeleteMessage('Erreur de connexion au serveur');
      setDeleteType('error');
    }

    setConfirmDelete(null);
    setTimeout(() => setDeleteMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('https://restaurant-backend-06ce.onrender.com/api/newsletter/send-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, imageUrl })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setResponse({ text: data.message, type: 'success' });
        setSubject('');
        setMessage('');
        setImageUrl('');
      } else {
        setResponse({ text: data.message, type: 'error' });
      }
    } catch (error) {
      setResponse({ text: 'Erreur de connexion au serveur', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-container'>
      {/* Header */}
      <div className='admin-header'>
        <h1>
          <Mail size={32} />
          Administration Newsletter
        </h1>
        <p>Kebab Express</p>
      </div>

      {/* Stats Card */}
      <div className='stats-card'>
        <div className='stats-icon'>
          <Users size={28} />
        </div>
        <div className='stats-content'>
          <p>Abonnés actifs</p>
          <h3>{subscriberCount}</h3>
        </div>
      </div>

      {/* Newsletter Card */}
      <div className='newsletter-card'>
        <h2>
          <Send size={24} />
          Envoyer une Newsletter
        </h2>

        <form onSubmit={handleSubmit} className='newsletter-form'>
          <div className='form-group'>
            <label>Sujet de l'email</label>
            <input 
              type='text' 
              placeholder='Ex: Nouvelles promotions du mois' 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              required 
              disabled={loading}
            />
          </div>

          <div className='form-group'>
            <label>Message</label>
            <textarea 
              placeholder='Écrivez votre message ici...' 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              required
              disabled={loading}
              rows={8}
            ></textarea>
          </div>

          <div className='form-group'>
            <label>URL de l'image (optionnel)</label>
            <input 
              type='url' 
              placeholder='https://exemple.com/image.jpg' 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type='submit' className='send-btn' disabled={loading || subscriberCount === 0}>
            <Send size={18} />
            {loading ? 'Envoi en cours...' : `Envoyer à ${subscriberCount} abonné(s)`}
          </button>
        </form>
        
        {response && (
          <div className={`response-message ${response.type}`}>
            <div className='response-content'>
              {response.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              <span>{response.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Subscribers List Card */}
      {subscribers.length > 0 && (
        <div className='subscribers-card'>
          <div className='subscribers-header'>
            <h2>
              <Users size={24} />
              Liste des abonnés
            </h2>
            <span className='subscriber-badge'>{subscribers.length}</span>
          </div>

          <div className='subscribers-list'>
            {subscribers.map((sub, index) => (
              <div 
                key={sub._id || index} 
                className='subscriber-item'
              >
                <Mail size={16} />
                <div className='subscriber-info'>
                  <p className='subscriber-email'>{sub.email}</p>
                  <small>{new Date(sub.date).toLocaleDateString('fr-FR')}</small>
                </div>
                <button 
                  className='delete-btn' 
                  onClick={() => setConfirmDelete(sub.email)}
                  title="Supprimer cet abonné"
                  type="button"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <div className='modal-icon'>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer cet abonné ?</p>
              </div>
            </div>

            <div className='modal-email'>
              <p>Email:</p>
              <p className='email-value'>{confirmDelete}</p>
            </div>

            <div className='modal-actions'>
              <button
                onClick={() => setConfirmDelete(null)}
                className='btn-cancel'
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className='btn-delete'
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success/Error Message */}
      {deleteMessage && (
        <div className={`delete-message ${deleteType}`}>
          <div className='delete-content'>
            {deleteType === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span>{deleteMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}