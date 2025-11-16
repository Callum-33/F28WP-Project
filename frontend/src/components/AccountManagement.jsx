import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import './Auth.css';

const AccountManagement = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete(`/api/users/${user.id}`);
      logout();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="auth-form">
      <h2>Account Management</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Username</label>
        <input type="text" value={user.username} disabled />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input type="email" value={user.email || 'Not provided'} disabled />
      </div>

      <div className="form-group">
        <label>First Name</label>
        <input type="text" value={user.firstName || 'Not provided'} disabled />
      </div>

      <div className="form-group">
        <label>Last Name</label>
        <input type="text" value={user.lastName || 'Not provided'} disabled />
      </div>

      <button 
        type="button" 
        onClick={handleLogout} 
        className="button button-primary button-spacing"
      >
        Logout
      </button>

      {!showDeleteConfirm ? (
        <button 
          type="button" 
          onClick={() => setShowDeleteConfirm(true)}
          className="button button-danger"
        >
          Delete Account
        </button>
      ) : (
        <div>
          <p style={{ color: '#dc3545', marginBottom: '0.5rem', textAlign: 'center' }}>
            Are you sure? This cannot be undone.
          </p>
          <button 
            type="button" 
            onClick={handleDeleteAccount}
            className="button button-danger button-spacing"
          >
            Confirm Delete
          </button>
          <button 
            type="button" 
            onClick={() => setShowDeleteConfirm(false)}
            className="button button-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
