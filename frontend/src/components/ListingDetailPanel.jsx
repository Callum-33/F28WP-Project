import { useState } from 'react';
import './ListingDetailPanel.css';

const ListingDetailPanel = ({ listing, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!listing) return null;

  const {
    propertyID,
    propertyName = 'Property',
    pDescription = 'No description available.',
    pAddress = 'Location not specified',
    pricePerNight = 0,
    rooms = 0,
    rating = 0,
    image = 'https://via.placeholder.com/400x400?text=No+Image'
  } = listing;

  return (
    <div className="listing-detail-panel">
      <button className="close-button" onClick={onClose}>x</button>

      <div className="panel-images">
        <img src={image} alt={propertyName} className="main-image" />
        <div className="thumbnail-images">
          <img src={image} alt={propertyName} className="thumbnail" />
          <img src={image} alt={propertyName} className="thumbnail" />
        </div>
      </div>

      <div className="panel-content">
        <div className="panel-header">
          <div className="property-badge">{rooms} Room{rooms !== 1 ? 's' : ''}</div>
          <h2 className="panel-title">{propertyName}</h2>
          <p className="panel-address">📍 {pAddress}</p>
          <div className="panel-price">
            <span className="price-amount">${pricePerNight}</span>
            <span className="price-period">/night</span>
          </div>
        </div>

        <div className="panel-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            className={`tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>

        <div className="panel-body">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <h3>Description</h3>
              <p>{pDescription}</p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="reviews-content">
              <h3>Reviews</h3>
              <p>Rating: ★ {rating ? rating.toFixed(1) : '0.0'}/5</p>
              <p>No reviews yet.</p>
            </div>
          )}
          {activeTab === 'about' && (
            <div className="about-content">
              <h3>About</h3>
              <p>Location: {pAddress}</p>
              <p>Rooms: {rooms}</p>
              <p>Property ID: {propertyID}</p>
            </div>
          )}
        </div>

        <button className="book-button">Book</button>

        <div className="panel-map">
          <div className="map-placeholder">
            {/* <p>Map placeholder - {pAddress}</p> */}
            <iframe
              width="100%"
              height="100%"
              // style="border:0"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=KEY_HERE
    &q=${encodeURIComponent(pAddress)}`}>
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPanel;
