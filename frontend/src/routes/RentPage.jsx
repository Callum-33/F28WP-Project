import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Card from '../components/Card';
import ListingGrid from '../components/ListingGrid';

const RentPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ListingGrid>
      {listings.map((listing) => (
        <Card key={listing.id} listing={listing} />
      ))}
    </ListingGrid>
  );
};

export default RentPage;
