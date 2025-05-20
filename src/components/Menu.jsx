import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

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

  // Функция для определения активной категории при скролле
  const handleScroll = () => {
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
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      // При клике скроллим точно к заголовку (offset = 140 для учета фиксированной панели)
      fastScrollTo(element, 140);
    }
  };

  return (
    <div style={{ background: '#FDF8F2', minHeight: '200vh', paddingBottom: 80, position: 'relative', overflowX: 'hidden' }}>
      <ShimmerStyleTag />
      {/* Табы */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 100, 
        background: '#FDF8F2',
        borderBottom: '1px solid #e5ded6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <div style={{ display: 'flex', background: '#f6f0e7', borderRadius: 18, boxShadow: '0 2px 8px #0001', padding: 2, width: '80%', justifyContent: 'center', gap: 19 }}>
            {['menu', 'bar'].map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  outline: 'none',
                  background: activeTab === tabKey ? '#fff' : 'transparent',
                  color: '#3B1707',
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
                  border: activeTab === tabKey ? '1.5px solid #e5ded6' : 'none',
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
          background: '#FDF8F2',
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
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    position: 'relative',
                    fontSize: 18,
                    fontWeight: activeCategory === cat.id ? 500 : 300,
                    color: activeCategory === cat.id ? '#3B1707' : '#8B6F53',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    paddingBottom: 8,
                    transition: 'color 0.2s',
                    userSelect: 'none',
                    marginRight: idx === categories.length - 1 ? 15 : 0,
                  }}
                >
                  {cat.name}
                  {activeCategory === cat.id && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '100%',
                      height: 5,
                      background: '#3B1707',
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
        {categories.map(cat => (
          <div key={cat.id} ref={el => (categoryRefs.current[cat.id] = el)}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#6B2F1A', fontFamily: 'Tiffany, serif', margin: '0 0 16px 20px' }}>
              {cat.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px', marginBottom: 32 }}>
              {dishes.filter(dish => dish.category_id === cat.id).map(dish => {
                const inCart = cartItems.find(ci => ci.id === dish.id);
                return (
                  <div key={dish.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minHeight: 220, position: 'relative', height: 240, justifyContent: 'flex-start' }}>
                    <img src={dish.img} alt={dish.name} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 12, marginBottom: 10 }} />
                    <div style={{ fontSize: 16, fontWeight: 500, color: '#3B1707', marginBottom: 6, textAlign: 'left' }}>{dish.name}</div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, width: '100%' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#6B2F1A' }}>{dish.price} ₽</div>
                      <div style={{ fontSize: 14, color: '#8B6F53' }}>{dish.volume}</div>
                    </div>
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginTop: 'auto' }}>
                        <button onClick={() => changeCartItemCount(dish.id, -1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>-</button>
                        <span style={{ fontSize: 20, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{inCart.count}</span>
                        <button onClick={() => changeCartItemCount(dish.id, 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
                      </div>
                    ) : (
                      <button
                        style={{
                          width: '100%',
                          padding: '7px 0',
                          border: '1.5px solid #6B2F1A',
                          borderRadius: 8,
                          background: 'none',
                          color: '#6B2F1A',
                          fontWeight: 600,
                          fontSize: 15,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          marginTop: 'auto',
                          position: 'static',
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
        right: 16,
        bottom: 96,
        background: '#F8F4EF',
        borderRadius: 16,
        boxShadow: '0 2px 8px #0001',
        padding: '8px 18px 8px 18px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 28,
        fontWeight: 700,
        color: '#6B2F1A',
        zIndex: 200,
        gap: 8,
        border: '1px solid #e5ded6',
        cursor: 'pointer',
      }}
      onClick={() => setTab && setTab('cart')}
      >
        <span>{cartItems.length}</span>
        <span style={{ fontSize: 28, margin: '0 2px' }}>|</span>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 8H10.6667M10.6667 8H26.6667L24.6667 20H11.3333L10.6667 8ZM10.6667 8L11.3333 20M13.3333 26C14.0697 26 14.6667 25.403 14.6667 24.6667C14.6667 23.9303 14.0697 23.3333 13.3333 23.3333C12.597 23.3333 12 23.9303 12 24.6667C12 25.403 12.597 26 13.3333 26ZM22.6667 26C23.403 26 24 25.403 24 24.6667C24 23.9303 23.403 23.3333 22.6667 23.3333C21.9303 23.3333 21.3333 23.9303 21.3333 24.6667C21.3333 25.403 21.9303 26 22.6667 26Z" stroke="#3B1707" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

export default Menu; 