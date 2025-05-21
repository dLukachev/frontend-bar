import React, { useState, useEffect, useRef } from 'react';
import { get } from '../fetch/get';
import { put } from '../fetch/put';

// shimmer-стили (копия из Home.jsx)
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: #F5EEE7 !important;
}
.skeleton-shimmer::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, #F5EEE7 0%, #ede7df 45%, #f0e8dc 50%, #ede7df 55%, #F5EEE7 100%);
  background-size: 400px 100%;
  animation: shimmer 1.2s infinite linear;
  opacity: 0.9;
  pointer-events: none;
}
`;

function EditProfileModal({ onClose, initialData }) {
  const [form, setForm] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    phone_number: initialData?.phone_number || '',
    birthdate: initialData?.birthdate || '',
    favorite_dish: initialData?.favorite_dish || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Обновлять форму при появлении initialData (только если данные изменились)
  useEffect(() => {
    if (initialData) {
      setForm(f => ({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        phone_number: initialData.phone_number || '',
        birthdate: initialData.birthdate || '',
        favorite_dish: initialData.favorite_dish || '',
      }));
    }
  }, [initialData]);

  const handleClose = () => {
    setIsVisible(false);
    setTouchY(0);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTouchStart = (e) => {
    const y = e.touches[0].clientY;
    const sheetTop = sheetRef.current.getBoundingClientRect().top;
    if (y - sheetTop > 50) return;
    setTouchStart(y);
    setTouchY(0);
  };
  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchY(diff);
      e.preventDefault();
    }
  };
  const handleTouchEnd = () => {
    if (!touchStart) return;
    if (touchY > 100) {
      handleClose();
    } else {
      setTouchY(0);
    }
    setTouchStart(null);
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      await put('/users/me', initData, form);
      setSuccess(true);
      setTimeout(handleClose, 1000);
    } catch (err) {
      setError('Ошибка сохранения');
    } finally {
      setIsLoading(false);
    }
  };

  // Стили
  const inputStyle = {
    width: 340,
    height: 44,
    borderRadius: 12,
    border: '1px solid #E5DED6',
    background: '#FFFBF7',
    fontSize: 16,
    color: '#410C00',
    padding: '2px 16px 0 16px',
    fontFamily: 'SF Pro Text, sans-serif',
    outline: 'none',
    marginBottom: 10,
    boxSizing: 'border-box',
    position: 'relative',
  };
  const labelStyle = {
    position: 'absolute',
    top: -6.8,
    left: 16,
    background: '#FFFBF7',
    padding: '0 6px',
    fontSize: 12,
    color: '#B7AFA7',
    fontFamily: 'SF Pro Text, sans-serif',
    zIndex: 2,
    pointerEvents: 'none',
    fontWeight: 400,
  };
  const fieldWrapStyle = {
    position: 'relative',
    marginBottom: 10,
    width: 340,
  };
  const buttonStyle = {
    width: 340,
    height: 46,
    borderRadius: 15,
    background: '#410C00',
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    margin: '24px 0 0 0',
    cursor: 'pointer',
    fontFamily: 'SF Pro Text, sans-serif',
    transition: 'background 0.2s',
  };

  // Скелетон для формы
  function ProfileSkeleton() {
    return (
      <div style={{ width: 340, margin: '0 auto' }}>
        <style>{shimmerStyle}</style>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ marginBottom: 24, position: 'relative', width: 340, height: 44, borderRadius: 12, overflow: 'hidden' }}>
            <div className="skeleton-shimmer" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
          </div>
        ))}
        <div style={{ width: 340, height: 46, borderRadius: 15, margin: '24px 0 0 0', overflow: 'hidden' }}>
          <div className="skeleton-shimmer" style={{ width: '100%', height: '100%', borderRadius: 15 }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: '#FFFBF7',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: '0 -4px 24px #0002',
          minHeight: 520, maxHeight: '90vh',
          overflowY: 'auto',
          transform: isVisible ? `translateY(${touchY}px)` : 'translateY(100%)',
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          willChange: 'transform',
          touchAction: 'none',
        }}
      >
        <div style={{ width: 40, height: 4, background: '#E5DED6', borderRadius: 2, margin: '0 auto 24px', cursor: 'grab' }} />
        <div style={{ width: '100%', paddingLeft: 16, marginBottom: 32 }}>
          <h1 style={{
            fontSize: 31,
            fontWeight: 400,
            color: '#410C00',
            fontFamily: 'Tiffany, serif',
            margin: 0,
            textAlign: 'left'
          }}>Обо мне</h1>
        </div>
        {!initialData ? <ProfileSkeleton /> :
        <form onSubmit={handleSubmit} style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Имя */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Имя</label>
            <input style={inputStyle} value={form.first_name} onChange={e => handleChange('first_name', e.target.value)} maxLength={32} autoComplete="off" />
          </div>
          {/* Фамилия */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Фамилия</label>
            <input style={inputStyle} value={form.last_name} onChange={e => handleChange('last_name', e.target.value)} maxLength={32} autoComplete="off" />
          </div>
          {/* Телефон */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Телефон</label>
            <input style={inputStyle} value={form.phone_number} onChange={e => handleChange('phone_number', e.target.value)} maxLength={32} autoComplete="off" />
          </div>
          {/* Дата рождения */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Дата рождения</label>
            <input style={inputStyle} value={form.birthdate} onChange={e => handleChange('birthdate', e.target.value)} maxLength={32} autoComplete="off" />
          </div>
          {/* Любимое блюдо */}
          <div style={fieldWrapStyle}>
            <label style={labelStyle}>Любимое блюдо</label>
            <input style={inputStyle} value={form.favorite_dish} onChange={e => handleChange('favorite_dish', e.target.value)} maxLength={64} autoComplete="off" />
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить'}</button>
          {error && <div style={{ color: '#B00020', marginTop: 12 }}>{error}</div>}
          {success && <div style={{ color: '#388E3C', marginTop: 12 }}>Сохранено!</div>}
        </form>
        }
        <button onClick={handleClose} style={{ margin: '0 auto', marginTop: 24, background: 'none', border: 0, color: '#8B6F53', fontSize: 18, cursor: 'pointer', WebkitTapHighlightColor: 'transparent', tapHighlightColor: 'transparent' }}>Закрыть</button>
      </div>
    </>
  );
}

export default EditProfileModal; 