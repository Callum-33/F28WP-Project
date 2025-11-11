import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Card from '../components/Card';
import ListingGrid from '../components/ListingGrid';

const FavouritesPage = () => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const response = await api.get('/api/favourites');
        setFavourites(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favourites:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ListingGrid>
      {favourites.map((listing) => (
        <Card key={listing.id} listing={listing} />
      ))}
    </ListingGrid>
  );
};

export default FavouritesPage;
