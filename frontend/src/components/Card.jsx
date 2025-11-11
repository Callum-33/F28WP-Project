import { Link } from 'react-router-dom';
import './Card.css';

const Card = ({ listing }) => {
  const {
    id,
    title = 'Property',
    address = 'Location not specified',
    price = 0,
    rating = 0,
    image = 'https://via.placeholder.com/400x400?text=No+Image'
  } = listing;

  return (
    <Link to={`/property/${id}`} className="card">
      <div 
        className="card-image" 
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="card-info">
          <div className="card-main-info">
            <h3 className="card-title">{title}</h3>
            <p className="card-address">{address}</p>
          </div>
          <div className="card-separator"></div>
          <div className="card-details">
            <span className="card-price">${price}/night</span>
            <span className="card-rating">★ {rating.toFixed(1)}/5</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default Card;
