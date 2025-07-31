import React from 'react';
import '../styles/ViewApproveListingModal.css'; // <-- create this CSS file as below!
import closeIcon from '../assets/close-icon.png';

export default function ViewApproveListingModal({ show, listing, onClose }) {
    if (!show || !listing) return null;

    return (
        <div
            className="view-approve-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="view-approve-modal-box"
                onClick={e => e.stopPropagation()}
            >
                <div className="view-approve-modal-content">
                    <img
                        src={closeIcon}
                        alt="Close"
                        className="view-approve-modal-close"
                        style={{
                            width: 28, height: 28, cursor: 'pointer', position: 'absolute', right: 18, top: 16
                        }}
                        onClick={onClose}
                    />
                    <h2 className="view-approve-modal-title">{listing.title}</h2>
                    <div className="view-approve-modal-row">
                        <img
                            src={listing.image_url && listing.image_url[0] ? listing.image_url[0] : 'https://placehold.co/200x200?text=No+Image'}
                            alt="Product"
                            className="view-approve-modal-img"
                        />
                        <div className="view-approve-modal-fields">
                            <div><span className="vam-label">Seller:</span> {listing.seller_name || listing.seller_id}</div>
                            <div><span className="vam-label">Category:</span> {listing.category}</div>
                            <div><span className="vam-label">Price:</span> ${listing.price}</div>
                            <div><span className="vam-label">Size:</span> {listing.size}</div>
                        </div>
                    </div>
                    <div className="view-approve-modal-description">
                        <span className="vam-label">Description:</span>
                        <div className="vam-description-text">{listing.description}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
