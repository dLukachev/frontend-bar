import React, { useState, useRef, useEffect } from 'react';
import { get } from '../fetch/get';
import { useApp } from '../context/AppContext';
import { useUserAchievements } from './Profile';

// Локальное подключение Tiffany только для Home
const tiffanyFontFace = `
@font-face {
  font-family: 'Tiffany';
  src: url('/fonts/tiffany/tiffany.otf') format('opentype');
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

function Slider({ cardWidth, cardHeight }) {
  const [active, setActive] = useState(0);
  const startX = useRef(null);
  const lastX = useRef(null);
  const isDragging = useRef(false);

  // Определяем, находимся ли мы на внутреннем экране Fold
  const isFoldInnerScreen = window.innerWidth >= 717 && window.innerWidth <= 1236;

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

  const borderRadiusPx = 7;
  const gap = 4;
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: `0 0 24px 0`,
    height: cardHeight,
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
          const offset = (idx - active) * (cardWidth + gap);
          return (
            <div
              key={idx}
              style={{
                width: cardWidth,
                minWidth: cardWidth,
                maxWidth: cardWidth,
                height: cardHeight,
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
function AchievementSkeleton({ scaleFactor }) {
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
function SummerNoveltySkeleton({ scaleFactor }) {
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

// Bottom sheet для подробной карточки товара
function ProductBottomSheet({ product, onClose, inCart, onAdd, onChangeCount, scaleFactor, isFoldInnerScreen, isIPad, imageWidth, imageHeight }) {
  const [quantity, setQuantity] = React.useState(0);
  const [isClosing, setIsClosing] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchY, setTouchY] = React.useState(0);
  const sheetRef = React.useRef(null);
  
  React.useEffect(() => { 
    if (product) {
      setQuantity(inCart ? inCart.count : 0);
      setIsClosing(false);
      setTouchY(0);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [product, inCart]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTouchY(0);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
    setTouchY(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTouchY(diff);
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

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(0, quantity + delta);
    setQuantity(newQuantity);
    if (inCart) {
      if (newQuantity === 0) {
        onChangeCount(product.id, -inCart.count);
      } else {
        const diff = newQuantity - inCart.count;
        onChangeCount(product.id, diff);
      }
    }
  };

  const handleAddToCart = () => {
    if (inCart) {
      onChangeCount(product.id, -inCart.count);
      setQuantity(0);
    } else {
      const finalQuantity = quantity === 0 ? 1 : quantity;
      onAdd({...product, quantity: finalQuantity});
      setQuantity(finalQuantity);
    }
  };

  if (!product) return null;
  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.25)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }} />
      <div 
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', 
          left: isFoldInnerScreen ? '50%' : 0, 
          right: isFoldInnerScreen ? 'auto' : 0, 
          bottom: 0, 
          zIndex: 1000,
          background: '#FFFBF7',
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24,
          boxShadow: '0 -4px 24px #0002',
          minHeight: 320, 
          maxHeight: '90vh',
          width: isFoldInnerScreen ? '717px' : '100%',
          transform: isVisible 
            ? `translateY(${touchY}px) ${isFoldInnerScreen ? 'translateX(-50%)' : ''}` 
            : `translateY(100%) ${isFoldInnerScreen ? 'translateX(-50%)' : ''}`,
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 24,
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'stretch',
          willChange: 'transform',
          touchAction: 'none',
        }}
      >
        <img src={product.image_url} alt={product.name} style={{ 
          width: isFoldInnerScreen ? imageWidth : '100%',
          maxHeight: imageHeight, 
          objectFit: 'cover', 
          borderRadius: 16, 
          marginBottom: 18,
          display: 'block',
          margin: isFoldInnerScreen ? '0 auto' : '0 0 18px 0'
        }} />
        <div style={{ fontSize: 26, fontWeight: 600, color: '#410C00', marginBottom: 8 }}>{product.name}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#410C00', fontFamily: 'Tiffany, serif', marginBottom: 8 }}>
          {Math.floor(product.price)} <img src="/icons/rub.svg" alt="₽" style={{ width: 18, height: 17, marginLeft: -1, display: 'inline-block' }} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#410C00', marginBottom: 8 }}>Описание:</div>
        <div style={{ fontSize: 15, color: '#410C00', marginBottom: 16 }}>{product.description}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '2px solid #410C00', borderRadius: 15, padding: '4px 16px', minWidth: 80, justifyContent: 'center', background: '#FFFBF7' }}>
            <button onClick={() => handleQuantityChange(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#410C00', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginRight: 8, WebkitTapHighlightColor: 'transparent', tapHighlightColor: 'transparent' }}>-</button>
            <span style={{ fontSize: 18, fontWeight: 600, minWidth: 24, textAlign: 'center', color: '#410C00' }}>{inCart ? inCart.count : quantity}</span>
            <button onClick={() => handleQuantityChange(1)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#410C00', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginLeft: 8, WebkitTapHighlightColor: 'transparent', tapHighlightColor: 'transparent' }}>+</button>
          </div>
          <button
            style={{
              flex: 1,
              height: 44,
              border: 'none',
              borderRadius: 15,
              background: inCart ? '#410C00' : '#410C00',
              color: '#fff',
              fontWeight: 600,
              fontSize: 18,
              cursor: 'pointer',
              transition: 'background 0.2s',
              WebkitTapHighlightColor: 'transparent',
              tapHighlightColor: 'transparent'
            }}
            onClick={handleAddToCart}
          >{inCart ? 'Удалить' : 'В корзину'}</button>
        </div>
      </div>
    </>
  );
}

function Home() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devicePixelRatio, setDevicePixelRatio] = useState(window.devicePixelRatio || 1);

  // Определяем тип устройства и размеры экрана
  const isFoldInnerScreen = window.innerWidth >= 717 && window.innerWidth <= 1236;
  const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Базовые размеры для разных устройств
  const baseFontSize = isIPad ? 16 : 14;
  const scaleFactor = isIPad ? 1.5 : 1;
  const cardWidth = isFoldInnerScreen ? 685 : (isIPad ? 510 : 340);
  const cardHeight = isFoldInnerScreen ? 380 : (isIPad ? 285 : 190);
  const imageWidth = isFoldInnerScreen ? 685 : (isIPad ? 510 : 340);
  const imageHeight = isFoldInnerScreen ? 440 : (isIPad ? 330 : 220);

  // Обновляем devicePixelRatio при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    achievement,
    achievementLoading,
    achievementError,
    categories,
    categoriesLoading,
    categoriesError,
    dishes,
    noveltyLoading,
    noveltyError,
    cartItems,
    addToCart,
    changeCartItemCount
  } = useApp();

  // Новое: достижения пользователя
  const { achievements: userAchievements, isLoading: achievementsLoading } = useUserAchievements();
  // Фильтруем только невыполненные
  const unearned = userAchievements ? userAchievements.filter(a => !a.is_earned) : [];
  // Сохраняем выбор только один раз
  const [randomAchievement, setRandomAchievement] = useState(null);
  useEffect(() => {
    if (unearned.length > 0 && !randomAchievement) {
      setRandomAchievement(unearned[Math.floor(Math.random() * unearned.length)]);
    }
    if (unearned.length === 0 && randomAchievement) {
      setRandomAchievement(null);
    }
  }, [achievementsLoading, unearned, randomAchievement]);

  // Новинки: блюда с type: 'new'
  const noveltyItems = dishes ? dishes.filter(d => d.category?.type === 'new' && !d.is_archived && !d.category?.is_archived) : [];

  // Проверяем загрузку всех данных
  useEffect(() => {
    if (!categoriesLoading && !achievementLoading && !noveltyLoading && !achievementsLoading) {
      setIsLoading(false);
    }
  }, [categoriesLoading, achievementLoading, noveltyLoading, achievementsLoading]);

  // Если идет загрузка, показываем скелетон
  if (isLoading) {
    return (
      <div style={{ 
        background: '#F3ECE4', 
        minHeight: '100vh', 
        padding: '0 0 80px 0', 
        overflowX: 'hidden',
        maxWidth: isFoldInnerScreen ? '717px' : '100%',
        margin: isFoldInnerScreen ? '0 auto' : '0',
        fontSize: `${baseFontSize * scaleFactor}px`
      }}>
        <div style={{ 
          background: '#F3ECE4', 
          height: isIPad ? 120 : 87, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: isFoldInnerScreen ? 'sticky' : 'relative',
          top: 0,
          zIndex: 100
        }}>
          <img src="/icons/logo.png" alt="logo" style={{ height: isIPad ? 80 : 60 }} />
        </div>
        <TiffanyFontTag />
        <ShimmerStyleTag />
        <AchievementSkeleton scaleFactor={scaleFactor} />
        <SummerNoveltySkeleton scaleFactor={scaleFactor} />
      </div>
    );
  }

  // Если есть ошибки, показываем сообщение об ошибке
  if (achievementError || categoriesError || noveltyError) {
    return (
      <div style={{ 
        padding: 20, 
        textAlign: 'center', 
        color: '#410C00',
        background: '#F3ECE4',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2>Произошла ошибка при загрузке данных</h2>
        <p>Пожалуйста, попробуйте обновить страницу</p>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#F3ECE4', 
      minHeight: '100vh', 
      padding: '0 0 80px 0', 
      overflowX: 'hidden',
      maxWidth: isFoldInnerScreen ? '717px' : '100%',
      margin: isFoldInnerScreen ? '0 auto' : '0',
      fontSize: `${baseFontSize * scaleFactor}px`
    }}>
      <div style={{ 
        background: '#F3ECE4', 
        height: isIPad ? 120 : 87, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: isFoldInnerScreen ? 'sticky' : 'relative',
        top: 0,
        zIndex: 100
      }}>
        <img src="/icons/logo.png" alt="logo" style={{ height: isIPad ? 80 : 60 }} />
      </div>
      <TiffanyFontTag />
      <ShimmerStyleTag />
      {/* Акции и новости */}
      <div style={{ padding: `${24 * scaleFactor}px ${16 * scaleFactor}px 0 ${16 * scaleFactor}px` }}>
        <div style={{
          fontSize: `${32 * scaleFactor}px`,
          fontWeight: 400,
          color: '#410C00',
          marginBottom: `${16 * scaleFactor}px`,
          fontFamily: 'Tiffany, serif',
          letterSpacing: '0.04em',
          width: isFoldInnerScreen ? '100%' : cardWidth,
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'left',
          paddingLeft: 0
        }}>
          Акции и новости
        </div>
        <Slider cardWidth={cardWidth} cardHeight={cardHeight} />
      </div>

      {/* Случайное невыполненное достижение пользователя */}
      {achievementsLoading ? (
        <AchievementSkeleton scaleFactor={scaleFactor} />
      ) : randomAchievement ? (
        <div style={{ 
          background: '#FFFBF7', 
          borderRadius: `${7 * scaleFactor}px`, 
          margin: `0 ${16 * scaleFactor}px ${32 * scaleFactor}px`, 
          padding: `${20 * scaleFactor}px`, 
          boxShadow: '0 2px 8px #0001', 
          height: `${93 * scaleFactor}px`, 
          width: isFoldInnerScreen ? `calc(100% - ${32 * scaleFactor}px)` : cardWidth, 
          marginLeft: 'auto', 
          marginRight: 'auto' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${8 * scaleFactor}px` }}>
            <div style={{ marginLeft: `${-7 * scaleFactor}px` }}>
              <div style={{ fontWeight: 700, fontSize: `${20 * scaleFactor}px`, color: '#410C00' }}>{randomAchievement.name}</div>
              <div style={{ fontSize: `${11 * scaleFactor}px`, color: '#410C00', marginTop: `${2 * scaleFactor}px` }}>{randomAchievement.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: `${70 * scaleFactor}px`, marginTop: 0 }}>
              <span style={{ fontFamily: 'Tiffany, serif', fontWeight: 400, fontSize: `${27 * scaleFactor}px`, color: '#410C00', lineHeight: 1, marginTop: 0, paddingTop: 0 }}>{'+' + randomAchievement.required_points}</span>
              <span style={{ fontSize: `${11 * scaleFactor}px`, color: '#8B6F53', fontWeight: 400, marginTop: 0, lineHeight: 1 }}>{'перепелок'}</span>
            </div>
          </div>
          <div style={{ marginTop: `${8 * scaleFactor}px`, display: 'flex', alignItems: 'center', gap: `${10 * scaleFactor}px` }}>
            {randomAchievement.is_earned && (
              <span style={{ fontSize: `${11 * scaleFactor}px`, color: '#410C00', minWidth: `${80 * scaleFactor}px` }}>(Выполненно)</span>
            )}
            <div style={{ flex: 1, width: '100%', height: `${6 * scaleFactor}px`, background: '#F3ECE4', borderRadius: `${3 * scaleFactor}px`, overflow: 'hidden' }}>
              <div style={{
                width: randomAchievement.is_earned ? '100%' : '0%',
                height: '100%',
                background: '#410C00',
                borderTopLeftRadius: `${3 * scaleFactor}px`,
                borderBottomLeftRadius: `${3 * scaleFactor}px`,
                borderTopRightRadius: randomAchievement.is_earned ? 0 : `${3 * scaleFactor}px`,
                borderBottomRightRadius: randomAchievement.is_earned ? 0 : `${3 * scaleFactor}px`
              }} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Летние новинки */}
      <div style={{ padding: `0 ${16 * scaleFactor}px` }}>
        <div style={{
          fontSize: `${32 * scaleFactor}px`,
          fontWeight: 400,
          color: '#410C00',
          marginBottom: `${16 * scaleFactor}px`,
          fontFamily: 'Tiffany, bold',
          width: isFoldInnerScreen ? '100%' : cardWidth,
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'left',
          paddingLeft: 0
        }}>
          Летние новинки
        </div>
        {noveltyLoading ? (
          <SummerNoveltySkeleton scaleFactor={scaleFactor} />
        ) : noveltyItems.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: isFoldInnerScreen ? '100%' : 'auto',
            margin: isFoldInnerScreen ? '0 auto' : '0',
          }}>
            {noveltyItems.map(item => {
              const inCart = cartItems.find(ci => ci.id === item.id);
              return (
                <div key={item.id} style={{
                  width: isFoldInnerScreen ? 'calc(100% - 32px)' : cardWidth,
                  height: `${118 * scaleFactor}px`,
                  background: '#FFFBF7',
                  borderRadius: `${7 * scaleFactor}px`,
                  boxShadow: '0 2px 8px #0001',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  overflow: 'hidden',
                  marginBottom: `${16 * scaleFactor}px`,
                  padding: 0,
                }}
                  onClick={() => setSelectedProduct(item)}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    style={{ 
                      width: `${150 * scaleFactor}px`, 
                      height: `${100 * scaleFactor}px`, 
                      objectFit: 'cover', 
                      borderRadius: `${7 * scaleFactor}px`, 
                      marginLeft: `${10 * scaleFactor}px`, 
                      marginTop: `${10 * scaleFactor}px`,
                      display: 'block',
                    }} 
                  />
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    padding: `${12 * scaleFactor}px ${16 * scaleFactor}px ${12 * scaleFactor}px ${16 * scaleFactor}px` 
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: `${12 * scaleFactor}px`, 
                        fontWeight: 500, 
                        color: '#410C00', 
                        marginBottom: `${4 * scaleFactor}px`, 
                        textAlign: 'left', 
                        lineHeight: 1.1 
                      }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: `${8 * scaleFactor}px`, marginBottom: 0 }}>
                        <div style={{ 
                          fontSize: `${27 * scaleFactor}px`, 
                          fontWeight: 600, 
                          color: '#410C00', 
                          fontFamily: 'Tiffany, serif', 
                          lineHeight: 1 
                        }}>
                          {Math.floor(item.price)} 
                          <img 
                            src="/icons/rub.svg" 
                            alt="₽" 
                            style={{ 
                              width: `${18 * scaleFactor}px`, 
                              height: `${17 * scaleFactor}px`, 
                              marginLeft: `${-1 * scaleFactor}px`, 
                              display: 'inline-block' 
                            }} 
                          />
                          <div style={{ 
                            fontSize: `${12 * scaleFactor}px`, 
                            color: '#410C00', 
                            lineHeight: 1, 
                            marginTop: `${2 * scaleFactor}px`, 
                            fontWeight: 400, 
                            fontFamily: 'SF Pro Text, Arial, sans-serif' 
                          }}>
                            {item.volume_weight_display}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: `${16 * scaleFactor}px`, 
                          color: '#8B6F53', 
                          lineHeight: 1 
                        }}>{item.volume_with_unit}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', height: `${22 * scaleFactor}px` }}>
                      {inCart ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: `${8 * scaleFactor}px`, 
                          width: '100%', 
                          background: '#410C00', 
                          borderRadius: `${5 * scaleFactor}px`, 
                          justifyContent: 'center' 
                        }}>
                          <button onClick={(e) => { e.stopPropagation(); changeCartItemCount(item.id, -1); }} style={{ 
                            width: `${36 * scaleFactor}px`, 
                            height: `${22 * scaleFactor}px`, 
                            borderRadius: `${8 * scaleFactor}px`, 
                            border: 0, 
                            background: 'none', 
                            color: '#FFFBF7', 
                            fontSize: `${18 * scaleFactor}px`, 
                            fontWeight: 500, 
                            cursor: 'pointer', 
                            lineHeight: 1,
                            WebkitTapHighlightColor: 'transparent',
                            tapHighlightColor: 'transparent'
                          }}>-</button>
                          <span style={{ 
                            fontSize: `${15 * scaleFactor}px`, 
                            fontWeight: 500, 
                            minWidth: `${28 * scaleFactor}px`, 
                            textAlign: 'center', 
                            color: '#FFFBF7' 
                          }}>{inCart.count}</span>
                          <button onClick={(e) => { e.stopPropagation(); changeCartItemCount(item.id, 1); }} style={{ 
                            width: `${36 * scaleFactor}px`, 
                            height: `${22 * scaleFactor}px`, 
                            borderRadius: `${8 * scaleFactor}px`, 
                            border: 0, 
                            background: 'none', 
                            color: '#FFFBF7', 
                            fontSize: `${18 * scaleFactor}px`, 
                            fontWeight: 500, 
                            cursor: 'pointer', 
                            lineHeight: 1,
                            WebkitTapHighlightColor: 'transparent',
                            tapHighlightColor: 'transparent'
                          }}>+</button>
                        </div>
                      ) : (
                        <button
                          style={{
                            width: '100%',
                            height: `${22 * scaleFactor}px`,
                            border: `1px solid #410C00`,
                            borderRadius: `${5 * scaleFactor}px`,
                            background: 'none',
                            color: '#410C00',
                            fontWeight: 600,
                            fontSize: `${11 * scaleFactor}px`,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            padding: 0,
                            lineHeight: 1,
                            WebkitTapHighlightColor: 'transparent',
                            tapHighlightColor: 'transparent'
                          }}
                          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        >В корзину</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <ProductBottomSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        inCart={cartItems.find(ci => ci.id === selectedProduct?.id)}
        onAdd={addToCart}
        onChangeCount={changeCartItemCount}
        scaleFactor={scaleFactor}
        isFoldInnerScreen={isFoldInnerScreen}
        isIPad={isIPad}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
      />
    </div>
  );
}

export default Home; 