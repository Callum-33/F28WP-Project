import { useState } from 'react';
import Modal from './Modal';
import Login from './Login';
import Register from './Register';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {mode === 'login' ? (
        <Login
          onSwitchToRegister={() => setMode('register')}
          onClose={onClose}
        />
      ) : (
        <Register
          onSwitchToLogin={() => setMode('login')}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

export default AuthModal;
