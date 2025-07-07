import React, { useState, useRef, useEffect } from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(30, 30, 40, 0.55)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const modalStyle = {
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 4px 32px rgba(0,0,0,0.16)',
  padding: '32px 40px 28px 40px',
  minWidth: 390,
  minHeight: 430,
  position: 'relative'
};

// Example dropdown data, can come from parent props or database later
const tagsOptions = ['Casual', 'Formal', 'Sport', 'Work', 'Party'];
const colorOptions = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Brown'];

export default function MixAndMatchModal({ onClose, onSubmit, loading = false }) {
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [color, setColor] = useState('');
  const [owned, setOwned] = useState('owned');
  const [tagsDropdown, setTagsDropdown] = useState(false);
  const [colorDropdown, setColorDropdown] = useState(false);

  // Close modal on ESC
  const modalRef = useRef();
  useEffect(() => {
    const escListener = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener('keydown', escListener);
    return () => window.removeEventListener('keydown', escListener);
  }, [onClose]);

  // Close dropdowns if click outside
  useEffect(() => {
    const listener = e => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setTagsDropdown(false);
        setColorDropdown(false);
      }
    };
    window.addEventListener('mousedown', listener);
    return () => window.removeEventListener('mousedown', listener);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit({ category, tags, color, owned: owned === 'owned' });
    onClose(); // (Optional) close after submit
  };

  return (
    <div style={overlayStyle}>
      <div ref={modalRef} style={modalStyle}>
        {/* Back button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', left: 20, top: 20,
            background: 'none', border: 'none', fontSize: 26, cursor: 'pointer'
          }}
          aria-label="Close"
        >←</button>
        <form onSubmit={handleSubmit} autoComplete="off">
          <label>Category</label>
          <input
            style={{ width: '100%', marginBottom: 18, marginTop: 4, padding: 10, borderRadius: 7, border: '1.5px solid #ccc' }}
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />

          <label>Tags</label>
          <div style={{ position: 'relative', display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              placeholder="Optional"
              value={tags}
              onChange={e => setTags(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 7, border: '1.5px solid #ccc' }}
              onFocus={() => setTagsDropdown(true)}
              autoComplete="off"
            />
            <button type="button"
              style={{
                background: '#f7fafc', border: '1.5px solid #ccc', borderRadius: 7, width: 38, cursor: 'pointer'
              }}
              onClick={() => setTagsDropdown(v => !v)}
              tabIndex={-1}
            >▼</button>
            {tagsDropdown && (
              <div style={{
                position: 'absolute', top: 45, left: 0, background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 2px 12px #ececec',
                zIndex: 10, minWidth: 180
              }}>
                {tagsOptions.map(option =>
                  <div
                    key={option}
                    style={{ padding: 10, cursor: 'pointer', background: tags === option ? '#f6e7a9' : 'transparent' }}
                    onMouseDown={() => { setTags(option); setTagsDropdown(false); }}
                  >
                    {option}
                  </div>
                )}
              </div>
            )}
          </div>

          <label>Color</label>
          <div style={{ position: 'relative', display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              placeholder="Optional"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 7, border: '1.5px solid #ccc' }}
              onFocus={() => setColorDropdown(true)}
              autoComplete="off"
            />
            <button type="button"
              style={{
                background: '#f7fafc', border: '1.5px solid #ccc', borderRadius: 7, width: 38, cursor: 'pointer'
              }}
              onClick={() => setColorDropdown(v => !v)}
              tabIndex={-1}
            >▼</button>
            {colorDropdown && (
              <div style={{
                position: 'absolute', top: 45, left: 0, background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 2px 12px #ececec',
                zIndex: 10, minWidth: 180
              }}>
                {colorOptions.map(option =>
                  <div
                    key={option}
                    style={{ padding: 10, cursor: 'pointer', background: color === option ? '#f6e7a9' : 'transparent' }}
                    onMouseDown={() => { setColor(option); setColorDropdown(false); }}
                  >
                    {option}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Owned / Unowned Radio */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 26, justifyContent: 'center' }}>
            <label style={{
              border: '2px solid #222', borderRadius: 12, padding: '8px 36px',
              display: 'flex', alignItems: 'center', fontWeight: 500, cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="owned"
                value="owned"
                checked={owned === 'owned'}
                onChange={() => setOwned('owned')}
                style={{ marginRight: 8 }}
              />
              Owned
            </label>
            <label style={{
              border: '2px solid #222', borderRadius: 12, padding: '8px 30px',
              display: 'flex', alignItems: 'center', fontWeight: 500, cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="owned"
                value="unowned"
                checked={owned === 'unowned'}
                onChange={() => setOwned('unowned')}
                style={{ marginRight: 8 }}
              />
              Unowned
            </label>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#f6e7a9',
              color: '#444',
              border: 'none',
              borderRadius: 7,
              padding: '13px 0',
              fontWeight: 500,
              fontSize: 18,
              cursor: loading ? 'wait' : 'pointer',
              marginBottom: 6,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? "Mixing..." : "Mix & Match!"}
          </button>
        </form>
      </div>
    </div>
  );
}
