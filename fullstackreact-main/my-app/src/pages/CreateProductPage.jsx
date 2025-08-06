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
        size: 'XS',
    });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setMediaFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

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
            let uploadedImageUrls = [];

            if (mediaFiles.length > 0) {
                const uploadFormData = new FormData();
                for (let i = 0; i < mediaFiles.length; i++) {
                    // Use 'productMedia' as the field name, matching the backend multer config.
                    uploadFormData.append('productMedia', mediaFiles[i]);
                }
                
                const uploadResponse = await axios.post('http://localhost:5000/api/product-media/upload', uploadFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImageUrls = uploadResponse.data.urls;
            }

            const productData = { ...formData, seller_id: userId, image_url: uploadedImageUrls };

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
    <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
    }}>
        <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '100%',
            padding: '30px'
        }}>
            <h1 style={{ fontSize: '1.8rem', color: '#15342D', marginBottom: '20px' }}>
                List a New Item
            </h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            padding: '10px',
                            minHeight: '100px',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Price ($)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        step="0.01"
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Category</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="Tops">Tops</option>
                        <option value="Bottoms">Bottoms</option>
                        <option value="Dresses">Dresses</option>
                        <option value="Outerwear">Outerwear</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Shoes">Shoes</option>
                    </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Size</label>
                    <select
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                    </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Product Images/Videos</label>

    <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            setMediaFiles(files);
        }}
        style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            cursor: 'pointer'
        }}
        onClick={() => document.getElementById('fileInput').click()}
    >
        <p style={{ marginBottom: '8px', color: '#888' }}>Drag & drop files here or click to select</p>
        <input
            id="fileInput"
            type="file"
            name="productMedia"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setMediaFiles(Array.from(e.target.files))}
            style={{ display: 'none' }}
        />
    </div>

    {mediaFiles.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
            {mediaFiles.map((file, index) => {
                const url = URL.createObjectURL(file);
                const isImage = file.type.startsWith('image/');
                const isVideo = file.type.startsWith('video/');
                return (
                    <div key={index} style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                        {isImage && (
                            <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        {isVideo && (
                            <video src={url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                    </div>
                );
            })}
        </div>
    )}
</div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#15342D',
                        color: 'white',
                        fontWeight: 'bold',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        width: '100%',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => {
                        if (!isSubmitting) e.currentTarget.style.backgroundColor = '#1e4b3d';
                    }}
                    onMouseOut={(e) => {
                        if (!isSubmitting) e.currentTarget.style.backgroundColor = '#15342D';
                    }}
                >
                    {isSubmitting ? 'Submitting...' : 'List Item'}
                </button>
            </form>
            {error && <p style={{ color: 'red', marginTop: '16px', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: 'green', marginTop: '16px', textAlign: 'center' }}>{success}</p>}
        </div>
    </div>
);
};

export default CreateProductPage;
