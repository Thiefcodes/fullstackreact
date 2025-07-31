import React from 'react';

export default function ViewApproveListingModal({ show, listing, onClose }) {
    if (!show || !listing) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'rgba(0,0,0,0.18)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 12, padding: 36, minWidth: 370,
                    maxWidth: 550, boxShadow: '0 8px 36px #bbb8', position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', right: 18, top: 16, fontSize: 21, background: 'none',
                        border: 'none', cursor: 'pointer', color: '#333'
                    }}
                >×</button>
                <h2 style={{ marginTop: 0, marginBottom: 18 }}>{listing.title}</h2>
                {/* Main image */}
                <img
                    src={listing.image_url && listing.image_url[0]
                        ? listing.image_url[0]
                        : 'https://placehold.co/200x200?text=No+Image'}
                    alt="Product"
                    style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 18, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                />
                <div style={{ marginBottom: 8 }}><b>Seller:</b> {listing.seller_name || listing.seller_id}</div>
                <div style={{ marginBottom: 8 }}><b>Category:</b> {listing.category}</div>
                <div style={{ marginBottom: 8 }}><b>Price:</b> ${listing.price}</div>
                <div style={{ marginBottom: 8 }}><b>Size:</b> {listing.size}</div>
                <div style={{ marginBottom: 8 }}><b>Description:</b><br />{listing.description}</div>
                {/* All images, if any */}
                {listing.image_url && listing.image_url.length > 1 && (
                    <>
                        <div style={{ marginTop: 18, fontWeight: 500 }}>All Images:</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {listing.image_url.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt={`Product ${idx + 1}`}
                                    style={{ width: 55, height: 55, objectFit: 'cover', borderRadius: 4 }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
