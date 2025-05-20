import React, { useState, useRef, useEffect } from 'react';
import { get } from '../fetch/get';
import { useApp } from '../context/AppContext';

// Локальное подключение Tiffany только для Home
const tiffanyFontFace = `
@font-face {
  font-family: 'Tiffany';
  src: url('/fonts/tiffany/tiffany.ttf') format('truetype'),
       url('/fonts/tiffany/ofont.ru_Tiffany.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
}
`;

function TiffanyFontTag() {
  return <style>{tiffanyFontFace}</style>;
}

// Вставка shimmer-стилей
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

function ShimmerStyleTag() {
  return <style>{shimmerStyle}</style>;
}

function EmptyState() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FDF8F2',
      color: '#8B6F53',
      textAlign: 'center',
      padding: '32px 16px 0 16px',
      boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 80, marginBottom: 24 }}>😔</div>
      <h2 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 22 }}>Ой! Нет доступа</h2>
      <p style={{ fontSize: 16, maxWidth: 320 }}>
        Для входа в приложение откройте его через Telegram.
      </p>
    </div>
  );
}

// Статичные баннеры для слайдера (акции и новости)
const sliderData = [
  {
    title: '20% СКИДКА',
    desc: 'В день рождения и 7 дней после',
    img: 'https://img.freepik.com/free-photo/chocolate-cake-with-candles_144627-10484.jpg',
  },
  {
    title: '1+1=3',
    desc: 'Третий коктейль в подарок',
    img: 'https://img.freepik.com/free-photo/refreshing-cocktail-drink_144627-10487.jpg',
  },
  {
    title: 'Счастливые часы',
    desc: 'Скидка 30% с 16:00 до 18:00',
    img: 'https://img.freepik.com/free-photo/fruit-cocktail-glass_144627-10485.jpg',
  },
];

const bannerImages = [
  '/banners/b1.png',
  '/banners/b2.png',
  '/banners/b3.png',
];

function Slider() {
  const [active, setActive] = useState(0);
  const startX = useRef(null);
  const lastX = useRef(null);
  const isDragging = useRef(false);

  // Swipe handlers
  const onTouchStart = (e) => {
    isDragging.current = true;
    startX.current = e.touches ? e.touches[0].clientX : e.clientX;
    lastX.current = startX.current;
  };
  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    lastX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };
  const onTouchEnd = () => {
    if (!isDragging.current) return;
    const dx = lastX.current - startX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0 && active < bannerImages.length - 1) setActive(active + 1);
      if (dx > 0 && active > 0) setActive(active - 1);
    }
    isDragging.current = false;
    startX.current = null;
    lastX.current = null;
  };

  const cardWidthPx = 340;
  const cardHeightPx = 190;
  const borderRadiusPx = 7;
  const gap = 4;
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: `0 0 24px 0`,
    height: cardHeightPx,
    touchAction: 'pan-y',
    overflow: 'visible',
  };

  return (
    <div
      style={{ position: 'relative', width: '100%' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseMove={onTouchMove}
      onMouseUp={onTouchEnd}
      onMouseLeave={onTouchEnd}
    >
      <div style={containerStyle}>
        {bannerImages.map((img, idx) => {
          const offset = (idx - active) * (cardWidthPx + gap);
          return (
            <div
              key={idx}
              style={{
                width: cardWidthPx,
                minWidth: cardWidthPx,
                maxWidth: cardWidthPx,
                height: cardHeightPx,
                borderRadius: borderRadiusPx,
                background: '#2B1B12',
                display: 'flex',
                alignItems: 'center',
                boxShadow: active === idx ? '0 4px 16px #0002' : '0 2px 8px #0001',
                boxSizing: 'border-box',
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: `translate(-50%, 0) translateX(${offset}px) scale(${active === idx ? 1 : 0.95})`,
                opacity: Math.abs(idx - active) > 1 ? 0 : 1,
                zIndex: 10 - Math.abs(idx - active),
                transition: 'transform 0.4s cubic-bezier(.4,0,.2,1), opacity 0.3s',
                cursor: 'grab',
                overflow: 'hidden',
                padding: 0,
              }}
              onClick={() => setActive(idx)}
            >
              <img src={img} alt={`banner-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: borderRadiusPx }} />
            </div>
          );
        })}
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -8, marginBottom: 28 }}>
        {bannerImages.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setActive(idx)}
            style={{
              width: 16,
              height: 6,
              borderRadius: 3,
              background: active === idx ? '#8B6F53' : '#E5DED6',
              margin: '0 4px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Скелетон для карточки слайдера
function SliderSkeleton() {
  const cardWidthPx = 330;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      margin: '0 0 24px 0',
      height: 180,
      width: '100%',
    }}>
      <div style={{
        width: cardWidthPx,
        minWidth: cardWidthPx,
        maxWidth: cardWidthPx,
        borderRadius: 28,
        background: '#E5DED6',
        display: 'flex',
        alignItems: 'center',
        padding: '24px 24px 24px 16px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 8px #0001',
      }}>
        <div className="skeleton-shimmer" style={{
          width: 150,
          height: 150,
          borderRadius: 16,
          marginRight: 25,
        }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton-shimmer" style={{
            width: 120,
            height: 24,
            borderRadius: 8,
            marginBottom: 12,
          }} />
          <div className="skeleton-shimmer" style={{
            width: 90,
            height: 16,
            borderRadius: 8,
            marginBottom: 8,
          }} />
        </div>
      </div>
    </div>
  );
}

// Скелетон для блока достижений
function AchievementSkeleton() {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      margin: '0 16px 32px',
      padding: 20,
      boxShadow: '0 2px 8px #0001'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div className="skeleton-shimmer" style={{
            width: 120,
            height: 22,
            borderRadius: 8,
            marginBottom: 8,
          }} />
          <div className="skeleton-shimmer" style={{
            width: 90,
            height: 14,
            borderRadius: 8,
          }} />
        </div>
        <div className="skeleton-shimmer" style={{
          width: 60,
          height: 28,
          borderRadius: 8,
        }} />
      </div>
      <div className="skeleton-shimmer" style={{
        width: 60,
        height: 14,
        borderRadius: 8,
        marginBottom: 8,
      }} />
      <div className="skeleton-shimmer" style={{ background: '#F5EEE7', borderRadius: 6, height: 8, width: '100%' }} />
    </div>
  );
}

// Скелетон для летней новинки
function SummerNoveltySkeleton() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 8px #0001',
      overflow: 'hidden',
      padding: 16,
    }}>
      <div style={{
        flex: '0 0 120px',
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="skeleton-shimmer" style={{
          width: 112,
          height: 92,
          borderRadius: 16,
        }} />
      </div>
      <div style={{ flex: 1, paddingLeft: 16 }}>
        <div className="skeleton-shimmer" style={{
          width: 120,
          height: 18,
          borderRadius: 8,
          marginBottom: 12,
        }} />
        <div className="skeleton-shimmer" style={{
          width: 80,
          height: 22,
          borderRadius: 8,
          marginBottom: 8,
        }} />
        <div className="skeleton-shimmer" style={{
          width: '100%',
          height: 32,
          borderRadius: 8,
        }} />
      </div>
    </div>
  );
}

function Home() {
  // const initData = window?.Telegram?.WebApp?.initData;
  // РАСКОММЕНТИРОВАТЬ ПРИ ПЕРЕХОДЕ НА ПРОД
  // if (!initData) {
  //   return <EmptyState />;
  // }

  const {
    achievement,
    achievementLoading,
    achievementError,
    categories,
    categoriesLoading,
    categoriesError,
    noveltyItems,
    noveltyLoading,
    noveltyError,
    cartItems,
    addToCart,
    changeCartItemCount
  } = useApp();

  return (
    <div style={{ background: '#FDF8F2', minHeight: '100vh', padding: '0 0 80px 0', overflowX: 'hidden' }}>
      <TiffanyFontTag />
      <ShimmerStyleTag />
      {/* Акции и новости */}
      <div style={{ padding: '24px 16px 0 16px' }}>
        <div style={{
          fontSize: 32,
          fontWeight: 400,
          color: '#6B2F1A',
          marginBottom: 16,
          fontFamily: 'Tiffany, serif',
          letterSpacing: '0.04em',
          width: 340,
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'left',
          paddingLeft: 0
        }}>
          Акции и новости
        </div>
        <Slider />
      </div>

      {/* Знаток настоек (достижение) */}
      {achievementLoading ? (
        <AchievementSkeleton />
      ) : achievement ? (
        <div style={{ background: '#fff', borderRadius: 16, margin: '0 16px 32px', padding: 20, boxShadow: '0 2px 8px #0001' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{achievement.name}</div>
              <div style={{ fontSize: 14, color: '#8B6F53' }}>{achievement.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 70, marginTop: 0 }}>
              <span style={{ fontFamily: 'Tiffany, serif', fontWeight: 400, fontSize: 28, color: '#6B2F1A', lineHeight: 1, marginTop: 0, paddingTop: 0 }}>{'+' + achievement.required_points}</span>
              <span style={{ fontSize: 14, color: '#8B6F53', fontWeight: 400, marginTop: 0, lineHeight: 1 }}>{'перепелок'}</span>
            </div>
          </div>
        </div>
      ) : (
        <AchievementSkeleton />
      )}

      {/* Летние новинки */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: 32, fontWeight: 300, color: '#6B2F1A', marginBottom: 16, fontFamily: 'Tiffany, bold' }}>
          Летние новинки
        </div>
        {noveltyLoading ? (
          <SummerNoveltySkeleton />
        ) : noveltyItems.length > 0 ? (
          noveltyItems.map(item => {
            // Найти товар в корзине
            const inCart = cartItems.find(ci => ci.id === item.id);
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', overflow: 'hidden', padding: 16, marginBottom: 16 }}>
                <div style={{ flex: '0 0 120px', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={item.image_url || 'https://via.placeholder.com/112x92?text=No+Image'} alt={item.name} style={{ width: 112, height: 92, objectFit: 'cover', borderRadius: 16 }} />
                </div>
                <div style={{ flex: 1, paddingLeft: 16 }}>
                  <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>{item.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#6B2F1A', marginBottom: 4 }}>{item.price} ₽ <span style={{ fontSize: 16, color: '#8B6F53', fontWeight: 400 }}>{item.volume_with_unit}</span></div>
                  {inCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <button onClick={() => changeCartItemCount(item.id, -1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: 20, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{inCart.count}</span>
                      <button onClick={() => changeCartItemCount(item.id, 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
                    </div>
                  ) : (
                    <button style={{
                      marginTop: 8,
                      width: '100%',
                      padding: '8px 0',
                      border: '1.5px solid #6B2F1A',
                      borderRadius: 8,
                      background: 'none',
                      color: '#6B2F1A',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }} onClick={() => addToCart({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      volume: item.volume_with_unit,
                      img: item.image_url || 'https://via.placeholder.com/112x92?text=No+Image',
                    })}>В корзину</button>
                  )}
                </div>
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
}

export default Home; 