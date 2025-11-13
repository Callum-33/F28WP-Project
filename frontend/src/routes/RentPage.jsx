import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Card from '../components/Card';
import ListingGrid from '../components/ListingGrid';
import ListingDetailPanel from '../components/ListingDetailPanel';
import './RentPage.css';

const RentPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [maxPrice, setMaxPrice] = useState(Infinity);
  const [minPrice, setMinPrice] = useState(0);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get('/api/listings');
        setListings(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
  };

  const handleClosePanel = () => {
    setSelectedListing(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;


  return (
    <div className="rent-page-container">
      <div className={`listings-container ${selectedListing ? 'with-panel' : ''}`}>
        <ListingGrid>
          {listings.map((listing, index) => {
            const isActive = selectedListing && listing.propertyID === selectedListing.propertyID;
            if (listing.pricePerNight <= maxPrice && listing.pricePerNight >= minPrice)
            return (
              <Card 
                key={listing.propertyID || index} 
                listing={listing} 
                onClick={() => handleListingClick(listing)}
                active={isActive}
              />
            );
          })}
        </ListingGrid>
      </div>
      {selectedListing && (
        <ListingDetailPanel 
          listing={selectedListing} 
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};

export default RentPage;
