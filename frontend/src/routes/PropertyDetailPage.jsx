import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  console.log('PropertyDetailPage rendered - user:', user, 'isAuthenticated:', isAuthenticated);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await api.get(`/api/listings/${id}`);
        setProperty(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  const handleBooking = async (bookingData) => {
    console.log('Attempting to book property:', id, 'with data:', bookingData);
    console.log('User:', user);
    
    if (!user || !user.id) {
      alert('User information not available. Please log in again.');
      return;
    }

    try {
      const response = await api.post('/api/bookings', {
        propertyID: parseInt(id),
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

  const handleBookClick = () => {
    console.log('Book button clicked');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user:', user);
    
    if (!isAuthenticated) {
      alert('Please log in to book this property');
      return;
    }
    console.log('Opening booking modal');
    setIsBookingModalOpen(true);
  };

  if (loading) return <p>Loading property details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!property) return <p>Property not found</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        ← Back
      </button>
      <h1>{property.propertyName || 'Property Details'}</h1>
      <p>{property.pDescription}</p>
      <p><strong>Price:</strong> ${property.pricePerNight}/night</p>
      <p><strong>Location:</strong> {property.pAddress}</p>
      <p><strong>Rooms:</strong> {property.rooms}</p>
      {bookingSuccess && (
        <p style={{ color: 'green', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px', marginTop: '1rem' }}>
          Booking request submitted successfully!
        </p>
      )}
      <button 
        onClick={(e) => {
          console.log('Button clicked - event:', e);
          handleBookClick();
        }}
        style={{ 
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Book This Property
      </button>
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBooking}
        pricePerNight={property.pricePerNight}
      />
    </div>
  );
};

export default PropertyDetailPage;
