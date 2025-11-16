import { useState } from 'react';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, onSubmit, pricePerNight }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const calculateTotal = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const nights = (end - start) / (1000 * 60 * 60 * 24);
      if (nights > 0) {
        return (pricePerNight * nights).toFixed(2);
      }
    }
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking form submitted');
    console.log('Start date:', startDate);
    console.log('End date:', endDate);
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError('End date must be after start date');
      return;
    }

    if (start < new Date()) {
      setError('Start date cannot be in the past');
      return;
    }

    console.log('Validation passed, calling onSubmit');
    onSubmit({ startDate, endDate });
  };

  if (!isOpen) return null;

  console.log('BookingModal rendered, isOpen:', isOpen);

  const totalPrice = calculateTotal();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Book This Property</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          {totalPrice > 0 && (
            <div className="booking-summary">
              <p>Price per night: ${pricePerNight}</p>
              <p>Total nights: {(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)}</p>
              <p className="total-price">Total: ${totalPrice}</p>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
