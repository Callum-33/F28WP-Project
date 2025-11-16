import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../components/Auth.css';

const SellPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    rooms: 1
  });
  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setImages(results);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setError('Please login to post a listing');
      return;
    }
    
    // Validate required fields
    if (!formData.title || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await api.post('/api/listings', {
        listerId: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.address,
        images: images
      });
      navigate('/rent');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate step 1
    if (step === 1 && !formData.title) {
      setError('Please enter a unit name');
      return;
    }
    // Validate step 2
    if (step === 2 && !formData.price) {
      setError('Please enter a price');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const steps = [
    { num: 1, label: 'Property Details' },
    { num: 2, label: 'Property Price' },
    { num: 3, label: 'Property Images' },
    { num: 4, label: 'Submit' }
  ];

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="auth-form">
        <h2>Configure your Property</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
          {steps.map((s) => (
            <div key={s.num} style={{ textAlign: 'center', flex: 1, opacity: step === s.num ? 1 : 0.4 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step === s.num ? '#007bff' : '#ddd', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontWeight: 'bold' }}>{s.num}</div>
              <div style={{ fontSize: '0.75rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}
        
        <div>
          {step === 1 && (
            <>
              <h3>General Information</h3>
              <div className="form-group">
                <label>Unit Name</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Snow Whites Cottage" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description..." style={{ minHeight: '150px', resize: 'vertical', width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Pricing Information</h3>
              <div className="form-group">
                <label>Price per Night ($)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City, Country" />
              </div>
              <div className="form-group">
                <label>Number of Rooms</label>
                <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} min="1" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3>Property Images</h3>
              <div className="form-group">
                <label htmlFor="images">Upload Images (Max 5)</label>
                <input
                  type="file"
                  id="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
                  {images.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img src={img} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: 'red',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          lineHeight: '1'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <h3>Review and Submit</h3>
              <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                <p><strong>Price:</strong> ${formData.price || '0'}/night</p>
                <p><strong>Address:</strong> {formData.address || 'Not set'}</p>
                <p><strong>Rooms:</strong> {formData.rooms}</p>
                <p><strong>Images:</strong> {images.length} uploaded</p>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="button button-secondary" style={{ width: '50%' }}>
                Back
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="button button-primary" style={{ width: step > 1 ? '50%' : '100%' }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="button button-primary" style={{ width: step > 1 ? '50%' : '100%' }}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
