import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import Modal from './Modal';
import AccountManagement from './AccountManagement';
import './Navigate.css';

const Navigate = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const navItems = [
    { name: 'Rent', path: '/rent' },
    { name: 'Sell', path: '/sell' },
    { name: 'My Rentals', path: '/my-rentals' }
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderStyle, setSliderStyle] = useState({});
  const navRefs = useRef([]);

  useEffect(() => {
    if (navRefs.current[activeIndex]) {
      const activeElement = navRefs.current[activeIndex];
      setSliderStyle({
        width: `${activeElement.offsetWidth}px`,
        left: `${activeElement.offsetLeft}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const index = navItems.findIndex(
      item => location.pathname === item.path || location.pathname.startsWith(item.path)
    );
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (navRefs.current[activeIndex]) {
        const activeElement = navRefs.current[activeIndex];
        setSliderStyle({
          width: `${activeElement.offsetWidth}px`,
          left: `${activeElement.offsetLeft}px`,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  const handleItemClick = (index) => {
    setActiveIndex(index);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="nav-items">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              to={item.path}
              ref={(el) => (navRefs.current[index] = el)}
              className={`nav-item ${activeIndex === index ? 'active' : ''}`}
              onClick={() => handleItemClick(index)}
            >
              {item.name}
            </Link>
          ))}
          <div className="slider" style={sliderStyle} />
        </div>
        <div className="nav-auth">
          {user ? (
            <div className="user-info">
              <span className="username">Welcome, {user.username}!</span>
              <button onClick={() => setShowAccountModal(true)} className="auth-button logout-button">
                Account
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="auth-button login-button">
              Login
            </button>
          )}
        </div>
      </div>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      >
        <AccountManagement onClose={() => setShowAccountModal(false)} />
      </Modal>
    </nav>
  );
};

export default Navigate;
