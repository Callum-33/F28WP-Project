import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import './MyRentalsPage.css';
import '../components/Auth.css';

const MyRentalsPage = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [propertyBookings, setPropertyBookings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sliderStyle, setSliderStyle] = useState({});
  const tabRefs = useRef([]);
  const [reviewModal, setReviewModal] = useState({ isOpen: false, bookingID: null, propertyName: '' });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    rooms: 1
  });
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingEditData, setBookingEditData] = useState({
    startDate: '',
    endDate: ''
  });

  const tabs = [
    { name: `My Bookings (${myBookings.length})`, key: 'myBookings' },
    { name: `Booking Requests (${propertyBookings.length})`, key: 'propertyBookings' },
    { name: `Your Listings (${myListings.length})`, key: 'myListings' }
  ];

  useEffect(() => {
    if (tabRefs.current[activeTab]) {
      const activeElement = tabRefs.current[activeTab];
      setSliderStyle({
        width: `${activeElement.offsetWidth}px`,
        left: `${activeElement.offsetLeft}px`,
      });
    }
  }, [activeTab, myBookings.length, propertyBookings.length, myListings.length]);

  useEffect(() => {
    const handleResize = () => {
      if (tabRefs.current[activeTab]) {
        const activeElement = tabRefs.current[activeTab];
        setSliderStyle({
          width: `${activeElement.offsetWidth}px`,
          left: `${activeElement.offsetLeft}px`,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [myBookingsRes, propertyBookingsRes, myListingsRes] = await Promise.all([
          api.get(`/api/bookings/users/${user.id}`),
          api.get(`/api/bookings/owner/${user.id}`),
          api.get(`/api/users/${user.id}/listings`)
        ]);
        setMyBookings(myBookingsRes.data);
        setPropertyBookings(propertyBookingsRes.data);
        setMyListings(myListingsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleApprove = async (bookingID) => {
    try {
      await api.put(`/api/bookings/${bookingID}/approve`);
      setPropertyBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.bookingID === bookingID
            ? { ...booking, bookingStatus: 'Approved' }
            : booking
        )
      );
    } catch (err) {
      console.error('Error approving booking:', err);
      alert('Failed to approve booking');
    }
  };

  const handleDeny = async (bookingID) => {
    try {
      await api.put(`/api/bookings/${bookingID}/deny`);
      setPropertyBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.bookingID === bookingID
            ? { ...booking, bookingStatus: 'Denied' }
            : booking
        )
      );
    } catch (err) {
      console.error('Error denying booking:', err);
      alert('Failed to deny booking');
    }
  };

  const openReviewModal = (bookingID, propertyName) => {
    setReviewModal({ isOpen: true, bookingID, propertyName });
    setReviewData({ rating: 5, comment: '' });
    setReviewError('');
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, bookingID: null, propertyName: '' });
    setReviewData({ rating: 5, comment: '' });
    setReviewError('');
  };

  // Demo purposes: Allow reviews on approved bookings without date validation
  // Production: Should verify endDate < current date to ensure stay is completed
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmittingReview(true);
    try {
      await api.post(`/api/bookings/${reviewModal.bookingID}/review`, reviewData);
      alert('Review submitted successfully!');
      closeReviewModal();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteListing = async (propertyID) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/listings/${propertyID}`);
      setMyListings(myListings.filter(listing => listing.propertyID !== propertyID));
      alert('Property deleted successfully');
    } catch (err) {
      console.error('Error deleting property:', err);
      alert(err.response?.data?.error || 'Failed to delete property');
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing.propertyID);
    setEditFormData({
      title: listing.propertyName,
      description: listing.pDescription,
      price: listing.pricePerNight,
      address: listing.pAddress,
      rooms: listing.rooms
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (propertyID) => {
    try {
      await api.put(`/api/listings/${propertyID}`, {
        title: editFormData.title,
        description: editFormData.description,
        price: parseFloat(editFormData.price),
        address: editFormData.address,
        rooms: parseInt(editFormData.rooms)
      });
      const updatedListings = myListings.map(listing => 
        listing.propertyID === propertyID 
          ? { 
              ...listing, 
              propertyName: editFormData.title,
              pDescription: editFormData.description,
              pricePerNight: parseFloat(editFormData.price),
              pAddress: editFormData.address,
              rooms: parseInt(editFormData.rooms)
            }
          : listing
      );
      setMyListings(updatedListings);
      setEditingListing(null);
      alert('Property updated successfully');
    } catch (err) {
      console.error('Error updating property:', err);
      alert(err.response?.data?.error || 'Failed to update property');
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking.bookingID);
    setBookingEditData({
      startDate: new Date(booking.startDate).toISOString().split('T')[0],
      endDate: new Date(booking.endDate).toISOString().split('T')[0]
    });
  };

  const handleBookingEditChange = (e) => {
    setBookingEditData({ ...bookingEditData, [e.target.name]: e.target.value });
  };

  const handleSaveBookingEdit = async (bookingID) => {
    try {
      const response = await api.put(`/api/bookings/${bookingID}`, {
        startDate: bookingEditData.startDate,
        endDate: bookingEditData.endDate
      });
      const updatedBookings = myBookings.map(booking => 
        booking.bookingID === bookingID 
          ? { 
              ...booking, 
              startDate: bookingEditData.startDate,
              endDate: bookingEditData.endDate,
              totalPrice: response.data.booking.totalPrice
            }
          : booking
      );
      setMyBookings(updatedBookings);
      setEditingBooking(null);
      alert('Booking updated successfully');
    } catch (err) {
      console.error('Error updating booking:', err);
      alert(err.response?.data?.error || 'Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingID) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    try {
      await api.delete(`/api/bookings/${bookingID}`);
      setMyBookings(myBookings.filter(booking => booking.bookingID !== bookingID));
      alert('Booking cancelled successfully');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const currentTab = tabs[activeTab].key;

  return (
    <div className="my-rentals-container">
      <h1>My Rentals</h1>
      
      <div className="rentals-tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            ref={(el) => (tabRefs.current[index] = el)}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.name}
          </button>
        ))}
        <div className="slider" style={sliderStyle} />
      </div>

      {currentTab === 'myBookings' && (
        <div className="bookings-section">
          <h2>My Bookings</h2>
          {myBookings.length === 0 ? <p>You haven't made any bookings yet.</p> : (
            <div className="bookings-list">
              {myBookings.map((booking) => (
                <div key={booking.bookingID} className="booking-card">
                  {editingBooking === booking.bookingID ? (
                    <div>
                      <h3>Edit Booking for {booking.propertyName}</h3>
                      <p className="address">{booking.pAddress}</p>
                      <div className="form-group">
                        <label>Check-in Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={bookingEditData.startDate}
                          onChange={handleBookingEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Check-out Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={bookingEditData.endDate}
                          onChange={handleBookingEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div className="booking-actions">
                        <button onClick={() => handleSaveBookingEdit(booking.bookingID)} className="approve-button">Save</button>
                        <button onClick={() => setEditingBooking(null)} className="deny-button">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{booking.propertyName}</h3>
                      <p className="address">{booking.pAddress}</p>
                      <div className="booking-details">
                        <p><strong>Check-in:</strong> {formatDate(booking.startDate)}</p>
                        <p><strong>Check-out:</strong> {formatDate(booking.endDate)}</p>
                        <p><strong>Total:</strong> ${booking.totalPrice}</p>
                        <p className={`status ${booking.bookingStatus.toLowerCase()}`}>
                          <strong>Status:</strong> {booking.bookingStatus}
                        </p>
                      </div>
                      <div className="booking-actions">
                        {booking.bookingStatus === 'Pending' && (
                          <>
                            <button onClick={() => handleEditBooking(booking)} className="approve-button">Edit Dates</button>
                            <button onClick={() => handleCancelBooking(booking.bookingID)} className="deny-button">Cancel Booking</button>
                          </>
                        )}
                        {booking.bookingStatus === 'Approved' && (
                          <button 
                            onClick={() => openReviewModal(booking.bookingID, booking.propertyName)} 
                            className="approve-button"
                          >
                            Leave Review
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentTab === 'propertyBookings' && (
        <div className="bookings-section">
          <h2>Booking Requests for My Properties</h2>
          {propertyBookings.length === 0 ? <p>No booking requests yet.</p> : (
            <div className="bookings-list">
              {propertyBookings.map((booking) => (
                <div key={booking.bookingID} className="booking-card">
                  <h3>{booking.propertyName}</h3>
                  <p className="address">{booking.pAddress}</p>
                  <div className="booking-details">
                    <p><strong>Guest:</strong> {booking.username} ({booking.email})</p>
                    <p><strong>Check-in:</strong> {formatDate(booking.startDate)}</p>
                    <p><strong>Check-out:</strong> {formatDate(booking.endDate)}</p>
                    <p><strong>Total:</strong> ${booking.totalPrice}</p>
                    <p className={`status ${booking.bookingStatus.toLowerCase()}`}>
                      <strong>Status:</strong> {booking.bookingStatus}
                    </p>
                  </div>
                  {booking.bookingStatus === 'Pending' && (
                    <div className="booking-actions">
                      <button onClick={() => handleApprove(booking.bookingID)} className="approve-button">Approve</button>
                      <button onClick={() => handleDeny(booking.bookingID)} className="deny-button">Deny</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentTab === 'myListings' && (
        <div className="bookings-section">
          <h2>Your Listings</h2>
          {myListings.length === 0 ? <p>You haven't listed any properties yet.</p> : (
            <div className="bookings-list">
              {myListings.map((listing) => (
                <div key={listing.propertyID} className="booking-card">
                  {editingListing === listing.propertyID ? (
                    <div>
                      <h3>Edit Property</h3>
                      <div className="form-group">
                        <label>Property Name</label>
                        <input
                          type="text"
                          name="title"
                          value={editFormData.title}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '60px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Price per Night ($)</label>
                        <input
                          type="number"
                          name="price"
                          value={editFormData.price}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Rooms</label>
                        <input
                          type="number"
                          name="rooms"
                          value={editFormData.rooms}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                          min="1"
                        />
                      </div>
                      <div className="booking-actions">
                        <button onClick={() => handleSaveEdit(listing.propertyID)} className="approve-button">Save</button>
                        <button onClick={() => setEditingListing(null)} className="deny-button">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{listing.propertyName}</h3>
                      <p className="address">{listing.pAddress}</p>
                      <div className="booking-details">
                        <p><strong>Price:</strong> ${listing.pricePerNight}/night</p>
                        <p><strong>Rooms:</strong> {listing.rooms}</p>
                        <p><strong>Description:</strong> {listing.pDescription}</p>
                      </div>
                      <div className="booking-actions">
                        <button onClick={() => handleEditListing(listing)} className="approve-button">Edit</button>
                        <button onClick={() => handleDeleteListing(listing.propertyID)} className="deny-button">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <Modal isOpen={reviewModal.isOpen} onClose={closeReviewModal}>
        <div className="auth-form">
          <h2>Leave a Review</h2>
          <h3 style={{ fontSize: '1rem', fontWeight: 'normal', marginBottom: '1.5rem', color: '#666' }}>
            {reviewModal.propertyName}
          </h3>
          {reviewError && <div className="error-message">{reviewError}</div>}
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label htmlFor="rating">Rating (1-5 stars)</label>
              <select
                id="rating"
                value={reviewData.rating}
                onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                disabled={submittingReview}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="comment">Comment (Optional)</label>
              <textarea
                id="comment"
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                disabled={submittingReview}
                placeholder="Share your experience..."
                style={{ minHeight: '100px', resize: 'vertical', width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
              />
            </div>
            <button type="submit" disabled={submittingReview} className="button button-primary">
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default MyRentalsPage;
