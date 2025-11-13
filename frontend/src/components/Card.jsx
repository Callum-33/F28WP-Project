import './Card.css';

const Card = ({ listing, onClick, active = false }) => {
  const {
    propertyID,
    propertyName = 'Property',
    pAddress = 'Location not specified',
    pricePerNight = 0,
    rating = 0,
    image = 'https://via.placeholder.com/400x400?text=No+Image'
  } = listing;


  return (
    <div className="card" onClick={onClick}>
      <div 
        className="card-image" 
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className={`card-info ${active === true ? 'card-active-info' : ''}`}>
          <div className="card-main-info">
            <h3 className="card-title">{propertyName}</h3>
            <p className="card-address">{pAddress}</p>
          </div>
          <div className="card-separator"></div>
          <div className="card-details">
            <span className="card-price">${pricePerNight}/night</span>
            <span className="card-rating">{rating ? rating.toFixed(1) : '0.0'}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
