import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateProductPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Tops', // Default value
        size: '',
        image_url: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // --- IMPORTANT ---
        // We need the ID of the logged-in user to set as 'seller_id'.
        // You should get this from your global state/context or localStorage
        // after the user logs in. For now, we'll get it from localStorage.
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setError('You must be logged in to list a product.');
            return;
        }

        try {
            const productData = { ...formData, seller_id: userId };

            // Make a POST request to our new backend endpoint
            await axios.post('http://localhost:5000/api/marketplaceproducts', productData);

            setSuccess('Product listed successfully! Redirecting to marketplace...');
            setTimeout(() => {
                navigate('/marketplace'); // Redirect to the marketplace after success
            }, 2000);

        } catch (err) {
            console.error("Error creating product:", err);
            setError(err.response?.data?.error || 'Failed to list product. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h1>List a New Item</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '8px', minHeight: '100px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Price ($)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required step="0.01" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Dresses">Dresses</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Shoes">Shoes</option>
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Size</label>
                    <input type="text" name="size" value={formData.size} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                 <div style={{ marginBottom: '15px' }}>
                    <label>Image URL (Optional)</label>
                    <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>List Item</button>
            </form>
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            {success && <p style={{ color: 'green', marginTop: '10px' }}>{success}</p>}
        </div>
    );
};

export default CreateProductPage;
