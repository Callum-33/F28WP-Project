import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigate.css';

const Navigate = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Rent', path: '/rent' },
    { name: 'Sell', path: '/sell' },
    { name: 'Favourites', path: '/favourites' }
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderStyle, setSliderStyle] = useState({});
  const navRefs = useRef([]);

  useEffect(() => {
    // Update slider position when active index changes
    if (navRefs.current[activeIndex]) {
      const activeElement = navRefs.current[activeIndex];
      setSliderStyle({
        width: `${activeElement.offsetWidth}px`,
        left: `${activeElement.offsetLeft}px`,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    // Update active index based on current route
    const index = navItems.findIndex(
      item => location.pathname === item.path || location.pathname.startsWith(item.path)
    );
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Handle window resize
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
      </div>
    </nav>
  );
};

export default Navigate;
