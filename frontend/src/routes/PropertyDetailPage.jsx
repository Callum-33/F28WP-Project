import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p>Loading property details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!property) return <p>Property not found</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)}>← Back</button>
      <h1>{property.propertyName || 'Property Details'}</h1>
      <p>{property.pDescription}</p>
      <p>Price: ${property.pricePerNight}/night</p>
      <p>Location: {property.pAddress}</p>
      <p>Rooms: {property.rooms}</p>
    </div>
  );
};

export default PropertyDetailPage;
