import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { get } from '../fetch/get';

function getTelegramInitData() {
  try {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      return window.Telegram.WebApp.initDataUnsafe.user || {};
    }
  } catch {}
  return {};
}

function QRSection({ onClose }) {
  const tgUser = useMemo(getTelegramInitData, []);
  const userId = tgUser.id || null; // Реальный ID или null если недоступен
  const [qrValue, setQrValue] = useState(`user_id:${userId || 'demo'}`);
  const [displayCode, setDisplayCode] = useState('L42ZA6E'); // Код для показа пользователю
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const sheetRef = useRef(null);
  
  // Показываем модалку после рендера
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);
  
  const refreshQRCode = () => {
    // Обновляем данные QR-кода с новой временной меткой для имитации обновления
    const newQrValue = `user_id:${userId || 'demo'}:${Date.now()}`;
    setQrValue(newQrValue);
  };
  
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTouchY(0);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTouchStart = (e) => {
    const touchY = e.touches[0].clientY;
    const sheetTop = sheetRef.current.getBoundingClientRect().top;
    if (touchY - sheetTop > 50) return; // Игнорируем касания ниже 50px от верха
    
    setTouchStart(e.touches[0].clientY);
    setTouchY(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    
    // Разрешаем свайп только вниз
    if (diff > 0) {
      setTouchY(diff);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    
    // Если свайпнули больше 100px вниз, закрываем
    if (touchY > 100) {
      handleClose();
    } else {
      // Иначе возвращаем на место
      setTouchY(0);
    }
    setTouchStart(null);
  };
  
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
          background: '#F3ECE4',
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
        {/* Индикатор свайпа */}
        <div 
          style={{
            width: 40,
            height: 4,
            background: '#E5DED6',
            borderRadius: 2,
            margin: '0 auto 24px',
            cursor: 'grab',
          }}
        />
        
        <h1 style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: '#410C00',
          fontFamily: 'Tiffany, serif',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Мой QR-код
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#8B6F53',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Покажи на кассе
        </p>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          position: 'relative'
        }}>
          <QRCodeSVG 
            value={qrValue} 
            size={250} 
            level="H" 
            style={{
              opacity: userId ? 1 : 0.5
            }}
          />
        </div>
        
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#410C00',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'SF Pro Text, sans-serif',
        }}>
          {displayCode}
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          Или продиктуй
        </p>
        
        <button onClick={handleClose} style={{ 
          margin: '0 auto', 
          marginTop: '24px', 
          background: 'none', 
          border: 0, 
          color: '#8B6F53', 
          fontSize: 18, 
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          tapHighlightColor: 'transparent'
        }}>Закрыть</button>
      </div>
    </>
  );
}

function AchievementsSection({ onClose }) {
  return <div style={sectionStyle}>
    <ProfileCloseButton onClick={onClose} />
    Достижения (заглушка)
  </div>;
}
function AboutSection({ onClose }) {
  return <div style={sectionStyle}>
    <ProfileCloseButton onClick={onClose} />
    Обо мне (заглушка)
  </div>;
}
function OrdersSection({ onClose }) {
  return <div style={sectionStyle}>
    <ProfileCloseButton onClick={onClose} />
    История заказов (заглушка)
  </div>;
}

const sectionStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 32,
  color: '#410C00',
  fontFamily: 'Tiffany, serif',
  background: '#F3ECE4',
};

function ProfileCloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 32,
        right: 18,
        width: 24,
        height: 24,
        background: 'rgba(255, 255, 255, 0)',
        border: 'none',
        borderRadius: '50%',
        boxShadow: '0 2px 8px #0001',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        fontSize: 24,
        color: '#410C00',
        transition: 'background 0.2s',
      }}
      aria-label="Закрыть"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.7 4.7L13.3 13.3M13.3 4.7L4.7 13.3" stroke="#410C00" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function ProfileButton({ icon, text, onClick, rightElement }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '18px 0 25px 0',
        borderBottom: '1px solid #F3ECE4',
        fontSize: 16,
        color: '#3B1707',
        fontWeight: 500,
        cursor: 'pointer',
        gap: 18,
        outline: 'none',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ flex: 1 }}>{text}</span>
      <span style={{ color: '#3B1707', fontSize: 22, fontWeight: 400 }}>
        {rightElement || <img src="/icons/strelka.svg" alt=">" style={{ width: 13, height: 11 }} />}
      </span>
    </button>
  );
}

function Profile({ currentTab }) {
  const [activeSection, setActiveSection] = useState('main');
  const [showQRModal, setShowQRModal] = useState(false);
  const tgUser = useMemo(getTelegramInitData, []);
  const name = tgUser.first_name || tgUser.last_name ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : 'Не определено';
  const username = tgUser.username ? `@${tgUser.username}` : 'Не определено';
  const photoUrl = tgUser.photo_url;

  // Возврат на главную страницу профиля при повторном выборе таба 'profile'
  useEffect(() => {
    if (currentTab === 'profile' && activeSection !== 'main') {
      setActiveSection('main');
    }
  }, [currentTab]);

  if (activeSection === 'achievements') return <AchievementsSection onClose={() => setActiveSection('main')} />;
  if (activeSection === 'about') return <AboutSection onClose={() => setActiveSection('main')} />;
  if (activeSection === 'orders') return <OrdersSection onClose={() => setActiveSection('main')} />;

  return (
    <div style={{ background: '#FFFBF7', paddingBottom: 83}}>
      {/* Верхний фон */}
      <div style={{ background: '#EFE9E2', height: 140 }} />
      {/* Основной контейнер с закруглением, наезжающий на верхний фон */}
      <div
        style={{
          background: '#FFFBF7',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          margin: '-35px auto 0', // наезжает на верхний фон
          width: '100%',
          padding: '32px 0 0 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {/* Аватарка, имя, юзернейм */}
        <div style={{
          width: 110,
          height: 113.52,
          borderRadius: 20,
          background: '#F3ECE4',
          border: '5px solid #fff',
          boxShadow: '0 2px 8px #0001',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: 8,
          marginTop: -75,
        }}>
          {photoUrl ? (
            <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src="/icons/photo.svg" alt="avatar placeholder" style={{ width: 58, height: 67 }} />
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#3B1707', fontFamily: 'SF Pro Text, Arial, sans-serif', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 15, color: '#8B6F53', fontWeight: 400 }}>{username}</div>

        {/* Статичная полоска уровня */}
        <div style={{ width: '100%', margin: '30px 0 24px 0', background: '#FFFBF7', paddingTop: 30, borderRadius: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: '#3B1707', fontWeight: 500, marginBottom: 6, padding: '0 20px' }}>
            <span>2 уровень</span>
            <span>350/1200 перепелок</span>
          </div>
          <div style={{ width: '90%', height: 6, background: '#F3ECE4', borderRadius: 2, overflow: 'hidden', marginLeft: '5%' }}>
            <div style={{ width: '29%', height: 6, background: '#3B1707', borderRadius: 2 }} />
          </div>
        </div>
        {/* Кнопки */}
        <div style={{ width: '90%', display: 'flex', flexDirection: 'column', gap: 10}}>
          <ProfileButton 
            icon={<img src="/icons/qr.svg" alt="QR" style={{ width: 24, height: 24 }} />} 
            text={<span style={{ fontWeight: 300, fontFamily: 'SF Pro Text, sans-serif', letterSpacing: 0, fontSize: 16 }}>Мой QR</span>} 
            onClick={() => setShowQRModal(true)} 
          />
          <ProfileButton 
            icon={<img src="/icons/kybok.svg" alt="Достижения" style={{ width: 24, height: 24 }} />} 
            text={<span style={{ fontWeight: 300, fontFamily: 'SF Pro Text, sans-serif', letterSpacing: 0, fontSize: 16 }}>Достижения</span>} 
            onClick={() => setActiveSection('achievements')} 
          />
          <ProfileButton 
            icon={<img src="/icons/Info.svg" alt="Обо мне" style={{ width: 24, height: 24 }} />} 
            text={<span style={{ fontWeight: 300, fontFamily: 'SF Pro Text, sans-serif', letterSpacing: 0, fontSize: 16 }}>Обо мне</span>} 
            onClick={() => setActiveSection('about')} 
          />
          <ProfileButton 
            icon={<img src="/icons/list.svg" alt="История заказов" style={{ width: 24, height: 24 }} />} 
            text={<span style={{ fontWeight: 300, fontFamily: 'SF Pro Text, sans-serif', letterSpacing: 0, fontSize: 16 }}>История заказов</span>} 
            onClick={() => setActiveSection('orders')} 
          />
          {/* Темная тема */}
          <ProfileButton 
            icon={<img src="/icons/theme.svg" alt="Темная тема" style={{ width: 20, height: 20 }} />} 
            text={<span style={{ fontWeight: 300, fontFamily: 'SF Pro Text, sans-serif', letterSpacing: 0, fontSize: 16 }}>Темная тема</span>} 
            rightElement={
              <div style={{ width: 44, height: 26, background: '#E5DED6', borderRadius: 13, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, background: '#fff', borderRadius: '50%', position: 'absolute', left: 2, top: 2, boxShadow: '0 2px 8px #0001' }} />
              </div>
            }
          />
        </div>
      </div>
      
      {/* QR Modal */}
      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}

// QR Modal component for overlay
function QRModal({ onClose }) {
  const tgUser = useMemo(getTelegramInitData, []);
  const userId = tgUser.id || null; // Реальный ID или null если недоступен
  const [qrValue] = useState(`user_id:${userId || 'demo'}`);
  const [userUniqueCode, setUserUniqueCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const sheetRef = useRef(null);
  
  // Показываем модалку после рендера
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);
  
  // Загрузка данных пользователя из API
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData || '';
    
    setIsLoading(true);
    setError(false);
    
    get('/users/me', initData)
      .then(response => {
        if (response && response.user && response.user.unique_code) {
          setUserUniqueCode(response.user.unique_code);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
  
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTouchY(0);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTouchStart = (e) => {
    const touchY = e.touches[0].clientY;
    const sheetTop = sheetRef.current.getBoundingClientRect().top;
    if (touchY - sheetTop > 50) return; // Игнорируем касания ниже 50px от верха
    
    setTouchStart(e.touches[0].clientY);
    setTouchY(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    
    // Разрешаем свайп только вниз
    if (diff > 0) {
      setTouchY(diff);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    
    // Если свайпнули больше 100px вниз, закрываем
    if (touchY > 100) {
      handleClose();
    } else {
      // Иначе возвращаем на место
      setTouchY(0);
    }
    setTouchStart(null);
  };
  
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
          background: '#F3ECE4',
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
        {/* Индикатор свайпа */}
        <div 
          style={{
            width: 40,
            height: 4,
            background: '#E5DED6',
            borderRadius: 2,
            margin: '0 auto 24px',
            cursor: 'grab',
          }}
        />
        
        <h1 style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: '#410C00',
          fontFamily: 'Tiffany, serif',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Мой QR-код
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#8B6F53',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Покажи на кассе
        </p>
        
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          position: 'relative'
        }}>
          <QRCodeSVG 
            value={qrValue} 
            size={250} 
            level="H" 
            style={{
              opacity: userId ? 1 : 0.5
            }}
          />
          
          {!userId && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '20px',
              fontSize: '16px',
              color: '#8B6F53',
              textAlign: 'center',
              padding: '0 30px'
            }}>
              QR-код недоступен
            </div>
          )}
        </div>
        
        <h2 style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#410C00',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'SF Pro Text, sans-serif',
        }}>
          {isLoading ? 
            "Загрузка..." : 
            (userUniqueCode || "Код недоступен")}
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          Или продиктуй
        </p>
        
        <button onClick={handleClose} style={{ 
          margin: '0 auto', 
          marginTop: '24px', 
          background: 'none', 
          border: 0, 
          color: '#8B6F53', 
          fontSize: 18, 
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          tapHighlightColor: 'transparent'
        }}>Закрыть</button>
      </div>
    </>
  );
}

export default Profile; 