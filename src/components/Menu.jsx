import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
const cartIcon = '/icons/cart.svg';

// shimmer-стили из Home.jsx
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
}`;

// Локальное подключение Tiffany только для Menu
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

function ShimmerStyleTag() {
  return <style>{shimmerStyle}</style>;
}

function CategorySkeleton() {
  return (
    <div style={{ display: 'flex', gap: 18, marginTop: 10, marginLeft: 15, marginRight: 15 }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton-shimmer" style={{ width: 90, height: 28, borderRadius: 8 }} />
      ))}
    </div>
  );
}

function DishSkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 10, minHeight: 220 }}>
          <div className="skeleton-shimmer" style={{ width: '100%', height: 90, borderRadius: 12, marginBottom: 10 }} />
          <div className="skeleton-shimmer" style={{ width: '80%', height: 18, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-shimmer" style={{ width: '60%', height: 22, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-shimmer" style={{ width: '40%', height: 14, borderRadius: 6, marginBottom: 10 }} />
          <div className="skeleton-shimmer" style={{ width: '100%', height: 36, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

const RESTAURANT_ID = 1;

// Кастомная функция быстрого скролла
function fastScrollTo(element, offset = 0) {
  if (!element) return;
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;
  const startY = window.scrollY;
  const duration = 200; // ms, быстрее чем стандартный smooth
  const startTime = performance.now();

  function scrollStep(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    window.scrollTo(0, startY + (targetY - startY) * ease);
    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    }
  }
  requestAnimationFrame(scrollStep);
}

// Bottom sheet для подробной карточки товара
function ProductBottomSheet({ product, onClose, inCart, onAdd, onChangeCount }) {
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
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: '#FFFBF7',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: '0 -4px 24px #0002',
          minHeight: 320, maxHeight: '90vh',
          overflowY: 'auto',
          transform: isVisible ? `translateY(${touchY}px)` : 'translateY(100%)',
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          willChange: 'transform',
          touchAction: 'none',
        }}
      >
        <img src={product.image_url || 'https://s234klg.storage.yandex.net/rdisk/dd165799b546145e86676b0aacac4b2d41f3ea0453ffd577e5e648e46a540f61/682ced58/OEOWJxOEUzw24FFHQhwUhUO6oxhIvquHlGfDPWJKNziue6YF-owovARHIR2IDDeLq8b9Hdj7b1PM1eGsMVerqA==?uid=0&filename=IMG_20250520_151328_102.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&fsize=49873&hid=19963f6f7ae29874eda8ea51b944752e&media_type=image&tknv=v3&etag=737218b6e0cb0f8661e617e75bc4f3df&ts=6359788940600&s=f33c70d189de2a01bb15ce3c4eadca30d21b002050556e928f8533b292ca1c59&pb=U2FsdGVkX1-I28UKyGRZfUwvGf30w275NNziH45l0lKK9gQk4h8kKuLkkayHvQPC3BQ14PZuG3Hxwzv3PwD4QcrGTB6CkptLTtOl-hK9MnI'} alt={product.name} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 16, marginBottom: 18 }} />
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

function Menu({ setTab }) {
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const cartCount = 3;

  const {
    categories,
    categoriesLoading,
    categoriesError,
    dishes,
    dishesLoading,
    dishesError,
    addToCart,
    cartItems,
    changeCartItemCount
  } = useApp();

  // refs для скролла к категориям
  const categoryRefs = useRef({});
  const observerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const isScrollLockedRef = useRef(false);

  // Фильтрация категорий по типу
  const filteredCategories = categories.filter(cat => cat.type === activeTab && !cat.is_archived);

  // Функция для определения активной категории при скролле
  const handleScroll = () => {
    if (isScrollLockedRef.current) return;
    if (!filteredCategories.length) return;

    const scrollPosition = window.scrollY + 175;

    // Находим первую категорию, которая находится выше текущей позиции скролла
    let foundCategory = null;
    for (const category of filteredCategories) {
      const element = categoryRefs.current[category.id];
      if (element && element.offsetTop <= scrollPosition) {
        foundCategory = category;
      } else {
        break;
      }
    }

    if (foundCategory && activeCategory !== foundCategory.id) {
      setActiveCategory(foundCategory.id);
    }
  };

  // Добавляем и удаляем обработчик скролла
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredCategories, activeCategory]);

  // Скроллим наверх при смене таба (меню/барная карта)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Устанавливаем первую категорию при смене таба
  useEffect(() => {
    if (filteredCategories.length > 0) {
      setActiveCategory(filteredCategories[0].id);
    }
  }, [activeTab]);

  // Функция для скролла при клике на категорию
  const handleCategoryClick = (categoryId) => {
    isScrollLockedRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      fastScrollTo(element, 140);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollLockedRef.current = false;
    }, 200);
  };

  // Скролл наверх при смене таба
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cartVisible = cartItems.length > 0;

  return (
    <div style={{ background: '#F3ECE4', minHeight: '200vh', paddingBottom: 83, position: 'relative', overflowX: 'hidden' }}>
      <TiffanyFontTag />
      <ShimmerStyleTag />
      {/* Табы */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 100, 
        background: '#F3ECE4',
        borderBottom: '1px solid #E5DED6'
      }}>
        <div style={{ background: '#F3ECE4', height: 87, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <img src="/icons/logo.png" alt="logo" style={{ height: 60 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', background: '#FFFBF7', borderRadius: 18, boxShadow: '0 2px 8px #0001', padding: 8, width: '338px', height: 48, justifyContent: 'center', gap: 19 }}>
            {['menu', 'bar'].map(tabKey => (
              <button
                key={tabKey}
                onClick={() => handleTabChange(tabKey)}
                style={{
                  outline: 'none',
                  background: activeTab === tabKey ? '#F3ECE4' : 'transparent',
                  color: activeTab === tabKey ? '#410C00' : '#8B6F53',
                  fontWeight: 300,
                  fontSize: 14,
                  borderRadius: 14,
                  width: '100%',
                  height: 33,
                  textAlign: 'center',
                  padding: '2px 24px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  margin: 0,
                  boxShadow: activeTab === tabKey ? '0 1px 4px #0001' : 'none',
                  border: 0,
                }}
              >
                {tabKey === 'menu' ? 'Меню' : 'Барная карта'}
              </button>
            ))}
          </div>
        </div>
        {/* Категории */}
        <div style={{ 
          overflowX: 'auto', 
          padding: '0 15px 0 8px',
          background: '#F3ECE4',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}>
          {categoriesLoading ? (
            <CategorySkeleton />
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: 18, 
              marginTop: 10, 
              marginLeft: 15, 
              marginRight: 15,
              paddingBottom: 8
            }}>
              {filteredCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    position: 'relative',
                    fontSize: 15,
                    fontWeight: activeCategory === cat.id ? 500 : 300,
                    color: activeCategory === cat.id ? '#410C00' : '#8B6F53',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    paddingBottom: 8,
                    transition: 'color 0.2s',
                    userSelect: 'none',
                    marginRight: idx === filteredCategories.length - 1 ? 15 : 0,
                  }}
                >
                  {cat.name}
                  {activeCategory === cat.id && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      bottom: -2,
                      width: '100%',
                      height: 3,
                      background: '#410C00',
                      borderRadius: 4,
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ background: '#F3ECE4', height: 87}}></div>
      {/* Все категории и блюда */}
      <div style={{ paddingTop: 140 }}>
        {filteredCategories.map(cat => (
          <div key={cat.id} ref={el => (categoryRefs.current[cat.id] = el)}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#410C00', fontFamily: 'Tiffany, serif', margin: '0 0 16px 20px', letterSpacing: '0.04em' }}>
              {cat.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 24px', marginBottom: 32 }}>
              {dishes.filter(dish => dish.category_id === cat.id).map(dish => {
                const inCart = cartItems.find(ci => ci.id === dish.id);
                return (
                  <div key={dish.id} style={{
                    background: '#FFFBF7',
                    borderRadius: 7,
                    boxShadow: '0 2px 8px #0001',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    position: 'relative',
                    height: 230,
                    width: 164,
                    justifyContent: 'flex-start',
                    border: '1.5px solid #E5DED6',
                  }}
                    onClick={() => setSelectedProduct(dish)}
                  >
                    <img src={dish.image_url} alt={dish.name} style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 7, marginBottom: 10, marginLeft: -5, marginTop: -5 }} />
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#410C00', marginBottom: 6, textAlign: 'left' }}>{dish.name}</div>
                    <div style={{ fontSize: 27, fontFamily: 'Tiffany, serif', fontWeight: 600, color: '#410C00', marginBottom: 10 }}>
                      {Math.floor(dish.price)} <img src="/icons/rub.svg" alt="₽" style={{ width: 18, height: 17, marginLeft: -1, display: 'inline-block' }} />
                      <div style={{ fontSize: 12, color: '#410C00', lineHeight: 1, marginTop: 2, fontWeight: 400, fontFamily: 'SF Pro Text, Arial, sans-serif' }}>
                        {dish.volume_weight_display}
                      </div>
                    </div>
                    {/* Кнопки -/+ или В корзину */}
                    <div style={{ marginTop: 'auto', width: '100%' }} onClick={e => e.stopPropagation()}>
                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: '#410C00', borderRadius: 5, justifyContent: 'center' }}>
                          <button onClick={() => changeCartItemCount(dish.id, -1)} style={{ width: 36, height: 22, borderRadius: 7, border: 0, background: 'none', color: '#FFFBF7', fontSize: 18, fontWeight: 500, cursor: 'pointer', lineHeight: 1 }}>-</button>
                          <span style={{ fontSize: 15, fontWeight: 500, minWidth: 28, textAlign: 'center', color: '#FFFBF7' }}>{inCart.count}</span>
                          <button onClick={() => changeCartItemCount(dish.id, 1)} style={{ width: 36, height: 22, borderRadius: 7, border: 0, background: 'none', color: '#FFFBF7', fontSize: 18, fontWeight: 500, cursor: 'pointer', lineHeight: 1 }}>+</button>
                        </div>
                      ) : (
                        <button
                          style={{
                            width: '100%',
                            height: 22,
                            border: '1px solid #410C00',
                            borderRadius: 5,
                            background: 'none',
                            color: '#410C00',
                            fontWeight: 300,
                            fontSize: 11,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            padding: 0,
                            lineHeight: 1,
                            position: 'static',
                            marginTop: 'auto',
                          }}
                          onClick={() => addToCart(dish)}
                        >В корзину</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Значок корзины */}
      <div
        style={{
          position: 'fixed',
          left: 260,
          bottom: 100,
          width: 105,
          background: '#FFFBF7',
          borderRadius: 16,
          boxShadow: '0 2px 8px #0001',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          fontSize: 27,
          fontWeight: 700,
          color: '#410C00',
          zIndex: 200,
          gap: 5,
          border: '1px solid #E5DED6',
          cursor: 'pointer',
          fontFamily: 'Tiffany, serif',
          transform: cartVisible ? 'translateY(0)' : 'translateY(120%)',
          opacity: cartVisible ? 1 : 0,
          pointerEvents: cartVisible ? 'auto' : 'none',
          transition: 'transform 0.4s cubic-bezier(.4,0,.2,1), opacity 0.4s',
        }}
        onClick={() => setTab && setTab('cart')}
      >
        <span>{cartItems.length}</span>
        <span style={{ fontSize: 28, margin: '0 2px' }}>|</span>
        <img src={cartIcon} alt="Корзина" style={{ width: 32, height: 32 }} />
      </div>
      <ProductBottomSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        inCart={cartItems.find(ci => ci.id === selectedProduct?.id)}
        onAdd={addToCart}
        onChangeCount={changeCartItemCount}
      />
    </div>
  );
}

export default Menu; 