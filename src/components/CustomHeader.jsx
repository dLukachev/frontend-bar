import React from 'react';

const CustomHeader = ({ title = 'UNICORN', onClose }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#fff',
      borderBottom: '1px solid #eee',
      borderRadius: '0 0 20px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <button
        style={{
          background: '#f2f2f2',
          border: 'none',
          borderRadius: '16px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 16,
          cursor: 'pointer',
        }}
        onClick={onClose}
      >
        <span style={{ marginRight: 8, fontSize: 20 }}>✕</span> Close
      </button>
      <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>{title}</div>
      <button
        style={{
          background: '#f2f2f2',
          border: 'none',
          borderRadius: '16px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 20,
          cursor: 'pointer',
        }}
      >
        <span style={{ marginRight: 4 }}>⌄</span> ...
      </button>
    </div>
  );
};

export default CustomHeader; 