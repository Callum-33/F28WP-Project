import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import BookingModal from './BookingModal';
import './ListingDetailPanel.css';

const ListingDetailPanel = ({ listing, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, isAuthenticated } = useAuth();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (activeTab === 'reviews' && listing?.propertyID) {
        setLoadingReviews(true);
        try {
          const response = await api.get(`/api/listings/${listing.propertyID}/reviews`);
          setReviews(response.data);
        } catch (err) {
          console.error('Error fetching reviews:', err);
        } finally {
          setLoadingReviews(false);
        }
      }
    };
    fetchReviews();
  }, [activeTab, listing?.propertyID]);

  useEffect(() => {
    const fetchImages = async () => {
      if (listing?.propertyID) {
        try {
          const response = await api.get(`/api/listings/${listing.propertyID}/images`);
          if (response.data.length > 0) {
            setImages(response.data);
          } else {
            // Use the default image from listing if no images found
            setImages([{ imageUrl: listing.image }]);
          }
        } catch (err) {
          console.error('Error fetching images:', err);
          // Fallback to listing image
          setImages([{ imageUrl: listing.image }]);
        }
      }
    };
    fetchImages();
  }, [listing?.propertyID, listing?.image]);

  // Reset image index when listing changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [listing?.propertyID]);

  if (!listing) return null;

  const {
    propertyID,
    propertyName = 'Property',
    pDescription = 'No description available.',
    pAddress = 'Location not specified',
    pricePerNight = 0,
    rooms = 0,
    rating = 0
  } = listing;

  const currentImage = images[currentImageIndex]?.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookClick = () => {
    console.log('Book button clicked in ListingDetailPanel');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    
    if (!isAuthenticated) {
      alert('Please log in to book this property');
      return;
    }
    console.log('Opening booking modal');
    setIsBookingModalOpen(true);
  };

  const handleBooking = async (bookingData) => {
    console.log('Attempting to book property:', propertyID, 'with data:', bookingData);
    console.log('User:', user);
    
    if (!user || !user.id) {
      alert('User information not available. Please log in again.');
      return;
    }

    try {
      const response = await api.post('/api/bookings', {
        propertyID: parseInt(propertyID),
        renterID: user.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
      });
      console.log('Booking response:', response.data);
      setIsBookingModalOpen(false);
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (err) {
      console.error('Error creating booking:', err);
      console.error('Error response:', err.response?.data);
      alert(`Failed to create booking: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="listing-detail-panel">
      <button className="close-button" onClick={onClose}>x</button>

      <div className="panel-images">
        <div style={{ position: 'relative' }}>
          <img src={currentImage} alt={propertyName} className="main-image" />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ›
              </button>
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '12px'
              }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
        <div className="thumbnail-images" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
          {images.map((img, index) => (
            <img
              key={index}
              src={img.imageUrl}
              alt={`${propertyName} ${index + 1}`}
              className="thumbnail"
              onClick={() => setCurrentImageIndex(index)}
              style={{ 
                cursor: 'pointer', 
                opacity: currentImageIndex === index ? 1 : 0.6,
                border: currentImageIndex === index ? '3px solid #007bff' : '3px solid transparent',
                minWidth: '80px',
                flexShrink: 0
              }}
            />
          ))}
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
              <p>Average Rating: ★ {rating ? rating.toFixed(1) : '0.0'}/5</p>
              {loadingReviews ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  {reviews.map((review) => (
                    <div key={review.reviewID} style={{
                      padding: '1rem',
                      marginBottom: '1rem',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{review.fName} {review.lName}</strong>
                        <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      </div>
                      {review.comment && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#555' }}>{review.comment}</p>
                      )}
                      <small style={{ color: '#999' }}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </small>
                    </div>
                  ))}
                </div>
              )}
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

        {bookingSuccess && (
          <div style={{ 
            color: 'green', 
            padding: '1rem', 
            backgroundColor: '#d4edda', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Booking request submitted successfully!
          </div>
        )}

        <button className="book-button" onClick={handleBookClick}>Book</button>

        <div className="panel-map">
          <div className="map-placeholder">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_MAPS_API_KEY}&q=${encodeURIComponent(pAddress)}`}>
            </iframe>
          </div>
        </div>
      </div>
      
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBooking}
        pricePerNight={pricePerNight}
      />
    </div>
  );
};

export default ListingDetailPanel;
