import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import cartIcon from '/public/icons/cart.svg';

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

function Menu({ setTab }) {
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCategory, setActiveCategory] = useState(null);
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
  const filteredCategories = categories.filter(cat => cat.type === activeTab);

  // Функция для определения активной категории при скролле
  const handleScroll = () => {
    if (isScrollLockedRef.current) return;
    if (!categories.length) return;

    const scrollPosition = window.scrollY + 175; // Устанавливаем отступ в 175 пикселей

    // Находим текущую категорию на основе позиции скролла
    for (let i = categories.length - 1; i >= 0; i--) {
      const category = categories[i];
      const element = categoryRefs.current[category.id];
      if (element && element.offsetTop <= scrollPosition) {
        if (activeCategory !== category.id) {
          setActiveCategory(category.id);
        }
        break;
      }
    }
  };

  // Добавляем и удаляем обработчик скролла
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories, activeCategory]);

  // Устанавливаем активную категорию при загрузке категорий
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories]);

  // Функция для скролла при клике на категорию
  const handleCategoryClick = (categoryId) => {
    // Отключаем scroll-обработчик на время прокрутки
    isScrollLockedRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      // При клике скроллим точно к заголовку (offset = 140 для учета фиксированной панели)
      fastScrollTo(element, 140);
    }
    // Включаем scroll-обработчик через 200 мс (длительность прокрутки)
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollLockedRef.current = false;
    }, 200);
  };

  console.log('activeTab:', activeTab);
  console.log('categories:', categories);
  console.log('filteredCategories:', filteredCategories);
  console.log('dishes:', dishes);

  return (
    <div style={{ background: '#F3ECE4', minHeight: '200vh', paddingBottom: 80, position: 'relative', overflowX: 'hidden' }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', background: '#f6f0e7', borderRadius: 18, boxShadow: '0 2px 8px #0001', padding: 2, width: '80%', justifyContent: 'center', gap: 19 }}>
            {['menu', 'bar'].map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  outline: 'none',
                  background: activeTab === tabKey ? '#FFFBF7' : 'transparent',
                  color: activeTab === tabKey ? '#410C00' : '#8B6F53',
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 14,
                  width: '100%',
                  height: 40,
                  textAlign: 'center',
                  padding: '2px 24px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  margin: 0,
                  boxShadow: activeTab === tabKey ? '0 1px 4px #0001' : 'none',
                  border: activeTab === tabKey ? '1.5px solid #E5DED6' : 'none',
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
                  }}>
                    <img src={dish.image_url} alt={dish.name} style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 7, marginBottom: 10, marginLeft: -5, marginTop: -5 }} />
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#410C00', marginBottom: 6, textAlign: 'left' }}>{dish.name}</div>
                    <div style={{ fontSize: 27, fontFamily: 'Tiffany, serif', fontWeight: 600, color: '#410C00', marginBottom: 10 }}>
                      {Math.floor(dish.price)} <img src="/icons/rub.svg" alt="₽" style={{ width: 18, height: 17, marginLeft: -1, display: 'inline-block' }} />
                      <div style={{ fontSize: 12, color: '#410C00', lineHeight: 1, marginTop: 2, fontWeight: 400, fontFamily: 'SF Pro Text, Arial, sans-serif' }}>
                        {dish.volume_weight_display}
                      </div>
                    </div>
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 'auto' }}>
                        <button onClick={() => changeCartItemCount(dish.id, -1)} style={{ width: 36, height: 22, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 18, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>-</button>
                        <span style={{ fontSize: 18, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{inCart.count}</span>
                        <button onClick={() => changeCartItemCount(dish.id, 1)} style={{ width: 36, height: 22, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 18, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>+</button>
                      </div>
                    ) : (
                      <button
                        style={{
                          width: 140,
                          height: 22,
                          border: '1px solid #410C00',
                          borderRadius: 5,
                          background: 'none',
                          color: '#410C00',
                          fontWeight: 600,
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
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Значок корзины */}
      <div style={{
        position: 'fixed',
        fontFamily: 'Tiffany, serif',
        right: 16,
        bottom: 96,
        background: '#FFFBF7',
        borderRadius: 16,
        boxShadow: '0 2px 8px #0001',
        padding: '8px 18px 8px 18px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 27,
        fontWeight: 700,
        color: '#410C00',
        zIndex: 200,
        gap: 5,
        border: '1px solid #E5DED6',
        cursor: 'pointer',
      }}
      onClick={() => setTab && setTab('cart')}
      >
        <span>{cartItems.length}</span>
        <span style={{ fontSize: 28, margin: '0 2px' }}>|</span>
        <img src={cartIcon} alt="Корзина" style={{ width: 32, height: 32 }} />
      </div>
    </div>
  );
}

export default Menu; 