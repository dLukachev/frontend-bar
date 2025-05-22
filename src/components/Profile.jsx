import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { get } from '../fetch/get';
import EditProfileModal from './EditProfileModal';
import { useApp } from '../context/AppContext';

function getTelegramInitData() {
  try {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
      return window.Telegram.WebApp.initDataUnsafe.user || {};
    }
  } catch {}
  return {};
}

// Хук для загрузки и кэширования достижений пользователя (кэш 10 минут)
const achievementsCache = { data: null, timestamp: 0 };
export function useUserAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(false);
      // Кэш на 10 минут
      if (achievementsCache.data && Date.now() - achievementsCache.timestamp < 600000) {
        setAchievements(achievementsCache.data);
        setIsLoading(false);
        return;
      }
      const initData = window.Telegram?.WebApp?.initData || '';
      try {
        const response = await get('/achievements/me/all', initData);
        if (Array.isArray(response)) {
          achievementsCache.data = response;
          achievementsCache.timestamp = Date.now();
          setAchievements(response);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return { achievements, isLoading, error };
}

// Кэш для userData (10 минут)
const userDataCache = { data: null, timestamp: 0 };
export function useUserData() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setIsLoading(true);
      setError(false);
      if (userDataCache.data && Date.now() - userDataCache.timestamp < 600000) {
        setUserData(userDataCache.data);
        setIsLoading(false);
        return;
      }
      const initData = window.Telegram?.WebApp?.initData || '';
      try {
        const response = await get('/users/me', initData);
        if (response && response.user) {
          userDataCache.data = response.user;
          userDataCache.timestamp = Date.now();
          if (!ignore) setUserData(response.user);
        } else {
          if (!ignore) setError(true);
        }
      } catch {
        if (!ignore) setError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  // Функция для сброса кэша и обновления
  const refresh = async () => {
    userDataCache.data = null;
    userDataCache.timestamp = 0;
    setIsLoading(true);
    setError(false);
    const initData = window.Telegram?.WebApp?.initData || '';
    try {
      const response = await get('/users/me', initData);
      if (response && response.user) {
        userDataCache.data = response.user;
        userDataCache.timestamp = Date.now();
        setUserData(response.user);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      console.log('userData from /api/v1/users/me:', userData);
    }
  }, [userData]);

  return { userData, isLoading, error, refresh };
}

// Кэш для orders (10 минут)
const ordersCache = { data: null, timestamp: 0 };

export function useOrdersCache() {
  const [orders, setOrders] = useState(ordersCache.data || []);
  const [isLoading, setIsLoading] = useState(!ordersCache.data);
  const [error, setError] = useState(false);

  const refresh = React.useCallback(() => {
    setIsLoading(true);
    setError(false);
    const initData = window.Telegram?.WebApp?.initData || '';
    get('/orders', initData)
      .then(response => {
        if (Array.isArray(response)) {
          ordersCache.data = response;
          ordersCache.timestamp = Date.now();
          setOrders(response);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!ordersCache.data || Date.now() - ordersCache.timestamp > 600000) {
      refresh();
    }
  }, [refresh]);

  return { orders, isLoading, error, refresh };
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

function CollectionSection({ orders, onClose }) {
  const { dishes, categories } = useApp();

  // Собираем id купленных блюд из завершённых заказов
  const boughtDishIds = React.useMemo(() => {
    const ids = new Set();
    orders.forEach(order => {
      if (["completed", "cancelled"].includes(order.status) && Array.isArray(order.items)) {
        order.items.forEach(item => {
          ids.add(item.id || item.item_id);
        });
      }
    });
    return ids;
  }, [orders]);

  const totalDishes = dishes.length;
  const boughtDishes = dishes.filter(d => boughtDishIds.has(d.id));
  const progress = totalDishes === 0 ? 0 : boughtDishes.length / totalDishes;

  return (
    <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '6px 16px 83px 16px', boxSizing: 'border-box' }}>
      {/* Прогресс */}
        <div style={{ fontFamily: 'SF Pro Text, sans-serif', fontSize: 16, color: '#410C00', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Попробовано:</span>
          <span>{boughtDishes.length}/{totalDishes} позиций</span>
      </div>
      <div style={{ width: '100%', height: 8, background: '#fff', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: '#410C00', borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      {/* Категории и блюда */}
      {categories.map(cat => {
        const catDishes = dishes.filter(d => d.category_id === cat.id);
        if (catDishes.length === 0) return null;
        return (
          <div key={cat.id} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 32, fontFamily: 'Tiffany, serif', color: '#410C00', marginBottom: 18 }}>{cat.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 106px)', gap: 14, justifyContent: 'center' }}>
              {catDishes.map(dish => {
                const bought = boughtDishIds.has(dish.id);
                return (
                  <div key={dish.id} style={{ width: 106, height: 98, background: '#FFFBF7', borderRadius: 7, boxShadow: '0 2px 8px #0001', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' }}>
                    <div style={{ width: 96, height: 64, borderRadius: 7, overflow: 'hidden', margin: '8px auto 0 auto', position: 'relative' }}>
                      <img src={dish.image_url} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: bought ? 'none' : 'grayscale(1)' }} />
                      {bought && (
                        <img src="/icons/check.svg" alt="check" style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 8.5, color: '#410C00', fontFamily: 'SF Pro Text, sans-serif', marginTop: 4, textAlign: 'left', fontWeight: 500, paddingLeft: 8, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dish.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <ProfileCloseButton onClick={onClose} />
    </div>
  );
}

function AchievementsSection({ onClose, orders, ordersLoading }) {
  const [activeTab, setActiveTab] = useState('achievements'); // 'achievements' or 'collection'
  const { achievements, isLoading, error } = useUserAchievements();

  // Всегда показываем переключатель вкладок
  const tabSwitcher = (
    <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      background: '#F3ECE4',
      borderRadius: 50, 
      padding: 4,
      marginBottom: 20,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <button 
        onClick={() => setActiveTab('achievements')}
        style={{
          flex: 1,
          padding: '12px 0',
          background: activeTab === 'achievements' ? '#FFFBF7' : 'transparent',
          border: 'none',
          borderRadius: 50,
          fontWeight: 'bold',
          color: '#410C00',
          fontSize: 16,
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          WebkitTapHighlightColor: 'transparent',
          tapHighlightColor: 'transparent',
        }}
      >
        Достижения
      </button>
      <button 
        onClick={() => setActiveTab('collection')}
        style={{
          flex: 1,
          padding: '12px 0',
          background: activeTab === 'collection' ? '#FFFBF7' : 'transparent',
          border: 'none',
          borderRadius: 50,
          fontWeight: 'bold',
          color: '#410C00',
          fontSize: 16,
          cursor: 'pointer',
          transition: 'background-color 0.3s',
          WebkitTapHighlightColor: 'transparent',
          tapHighlightColor: 'transparent',
        }}
      >
        Коллекция
      </button>
    </div>
  );

  if (activeTab === 'collection') {
    if (ordersLoading) {
      return <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '16px 16px 83px 16px', boxSizing: 'border-box',  }}>{tabSwitcher}<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>Загрузка...</div></div>;
    }
    return <>
      <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '16px 16px 83px 16px', boxSizing: 'border-box' }}>
        {tabSwitcher}
        <div style={{ borderBottom: '1px solid #e5ded6', marginBottom: 20 }} />
        <CollectionSection orders={orders} onClose={onClose} />
      </div>
    </>;
  }

  return (
    <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '16px 16px 83px 16px', boxSizing: 'border-box' }}>
      {tabSwitcher}
      <div style={{ borderBottom: '1px solid #e5ded6', marginBottom: 20 }} />
      
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0' 
        }}>
          <div>Загрузка...</div>
        </div>
      ) : error ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          <div>Не удалось загрузить достижения</div>
        </div>
      ) : achievements.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          <div>У вас пока нет достижений</div>
        </div>
      ) : (
        <div>
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              style={{
                width: 340,
                height: 93,
                backgroundColor: '#FFFBF7',
                borderRadius: 16,
                padding: '16px 20px',
                marginBottom: 16,
                boxSizing: 'border-box',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    color: '#410C00',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    {achievement.name}
                  </h3>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: 11, 
                    color: '#410C00',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    {achievement.description}
                  </p>
                </div>
                <div style={{ 
                  fontSize: 27, 
                  fontWeight: 400,
                  color: '#410C00',
                  fontFamily: 'Tiffany, serif',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  +{achievement.required_points}
                  <span style={{ 
                    fontSize: 11, 
                    color: '#410C00',
                    fontWeight: 'normal',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    перепелок
                  </span>
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Слева текст выполнено, если достижение выполнено */}
                {achievement.is_earned && (
                  <span style={{ fontSize: 11, color: '#410C00', minWidth: 80 }}>(Выполненно)</span>
                )}
                <div style={{ flex: 1, width: '100%', height: 6, background: '#F3ECE4', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: achievement.is_earned ? '100%' : '0%',
                    height: '100%',
                    background: '#410C00',
                    borderTopLeftRadius: 3,
                    borderBottomLeftRadius: 3,
                    borderTopRightRadius: achievement.is_earned ? 0 : 3,
                    borderBottomRightRadius: achievement.is_earned ? 0 : 3
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ProfileCloseButton onClick={onClose} />
    </div>
  );
}

function AboutSection({ onClose }) {
  return <div style={sectionStyle}>
    <ProfileCloseButton onClick={onClose} />
    Обо мне (заглушка)
  </div>;
}

function OrderDetailsModal({ order, onClose }) {
  const { dishes } = useApp();
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const day = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}, ${day}`;
  };

  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `Заказ ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Готовится',
      'confirmed': 'Подтвержден',
      'completed': 'Выполнен',
      'cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  return (
    <div style={{ 
      background: '#F3ECE4', 
      minHeight: '100vh', 
      padding: '16px 16px 83px 16px',
      boxSizing: 'border-box'
    }}>
      <h1 style={{
        fontSize: '31px',
        fontWeight: 'bold',
        color: '#410C00',
        fontFamily: 'Tiffany, serif',
        margin: '16px 0 8px 0'
      }}>
        {formatOrderDate(order.created_at)}
      </h1>
      
      <p style={{ 
        fontSize: 14, 
        color: '#9B8169',
        fontFamily: 'SF Pro Text, sans-serif',
        margin: '0 0 16px 0'
      }}>
        {formatDate(order.created_at)}
      </p>
      
      <div style={{
        width: '100%',
        height: 1,
        background: '#D8CFCA',
        margin: '0 0 16px 0'
      }} />
      
      <div style={{
        width: 340,
        height: 99,
        background: '#FFFBF7',
        borderRadius: 10,
        padding: '16px',
        marginBottom: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', marginBottom: 8 }}>
          <span style={{ 
            fontSize: 14, 
            color: '#410C00', 
            fontWeight: '600',
            fontFamily: 'SF Pro Text, sans-serif',
            marginRight: 8
          }}>
            Статус заказа:
          </span>
          <span style={{ 
            fontSize: 14, 
            color: '#A2791B',
            fontFamily: 'SF Pro Text, sans-serif'
          }}>
            {getStatusText(order.status)}
          </span>
        </div>
        
        <div style={{ display: 'flex', marginBottom: 8 }}>
          <span style={{ 
            fontSize: 14, 
            color: '#410C00', 
            fontWeight: '600',
            fontFamily: 'SF Pro Text, sans-serif',
            marginRight: 8
          }}>
            Оплата:
          </span>
          <span style={{ 
            fontSize: 14, 
            color: '#410C00',
            fontFamily: 'SF Pro Text, sans-serif'
          }}>
            Онлайн
          </span>
        </div>
        
        <div style={{ display: 'flex', marginBottom: 8 }}>
          <span style={{ 
            fontSize: 14, 
            color: '#410C00', 
            fontWeight: '600',
            fontFamily: 'SF Pro Text, sans-serif',
            marginRight: 8
          }}>
            Перепелок начислено:
          </span>
          <span style={{ 
            fontSize: 14, 
            color: '#410C00',
            fontFamily: 'SF Pro Text, sans-serif'
          }}>
            {Math.round(order.total_amount * 0.02)}
          </span>
        </div>
      </div>
      
      {/* Итого отдельным блоком */}
      <div style={{
        width: 340,
        height: 45,
        background: '#FFFBF7',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        margin: '0 0 20px 0',
        boxSizing: 'border-box',
        fontSize: 22
      }}>
        <span style={{ fontFamily: 'SF Pro Text, sans-serif', color: '#410C00', fontSize: 22, fontWeight: 700, marginRight: 18 }}>Итого:</span>
        <div style={{ fontFamily: 'Tiffany, serif', color: '#410C00', fontSize: 22, display: 'flex', alignItems: 'center', marginTop: 3 }}>
          {Math.floor(order.total_amount)}
          <img src="/icons/rub.svg" alt="₽" style={{ width: 16, height: 16, marginLeft: 2 }} />
        </div>
      </div>
      
      {/* Товары в заказе */}
      {order.items && order.items.map((item, index) => {
        // Найти блюдо по id в dishes
        const dish = dishes.find(d => d.id === (item.id || item.item_id));
        return (
          <div key={index} style={{
            background: '#FFFBF7',
            borderRadius: 10,
            padding: '12px',
            display: 'flex',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ width: 128, height: 85, marginRight: 10, overflow: 'hidden', borderRadius: 10, flexShrink: 0 }}>
              <img src={dish?.image_url || '/placeholder-food.jpg'} alt={dish?.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#410C00' }}>{dish?.name || ''}</h3>
              </div>
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-start',
                  fontFamily: 'Tiffany, serif',
                  fontSize: 27,
                  color: '#410C00',
                  marginTop: 9
                }}>
                  {dish ? Math.floor(dish.price) : ''}
                  <img src="/icons/rub.svg" alt="₽" style={{ width: 16, height: 16, marginLeft: 2 }} />
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: '#410C00', 
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  x{item.quantity || 1}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      <button style={{
        width: 340,
        height: 45,
        background: '#FFFBF7',
        border: 'none',
        borderRadius: 10,
        fontSize: 14,
        color: '#410C00',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '24px auto',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        WebkitTapHighlightColor: 'transparent',
        tapHighlightColor: 'transparent',
      }}>
        <img src="/icons/redo.svg" alt="redo" style={{ width: 16, height: 16, marginRight: 8 }} />
        Повторить заказ
      </button>
      
      <ProfileCloseButton onClick={onClose} />
    </div>
  );
}

function OrdersSection({ onClose, orders, ordersLoading }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(false);

  // Форматирование даты и времени
  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const day = days[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}, ${day}`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') {
      return ['pending', 'confirmed'].includes(order.status);
    } else {
      return ['completed', 'cancelled'].includes(order.status);
    }
  });

  if (selectedOrder) {
    return <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />;
  }

  if (ordersLoading) {
    return <div style={{ background: '#F3ECE4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Загрузка...</div>;
  }

  return (
    <div style={{ 
      background: '#F3ECE4', 
      minHeight: '100vh', 
      padding: '16px 16px 83px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        background: '#FFFBF7',
        borderRadius: 15, 
        padding: 4,
        marginBottom: 30,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{
            width: 338,
            height: 39,
            background: activeTab === 'active' ? '#F3ECE4' : 'transparent',
            border: 'none',
            borderRadius: activeTab === 'active' ? 15 : 15,
            fontWeight: '300',
            color: '#410C00',
            fontSize: 14,
            fontFamily: 'SF Pro Text, sans-serif',
            cursor: 'pointer',
            transition: 'background-color 0.3s, border-radius 0.3s',
            WebkitTapHighlightColor: 'transparent',
            tapHighlightColor: 'transparent',
          }}
        >
          Активные
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          style={{
            width: 338,
            height: 39,
            background: activeTab === 'completed' ? '#F3ECE4' : 'transparent',
            border: 'none',
            borderRadius: activeTab === 'completed' ? 10 : 15,
            fontWeight: '300',
            color: '#410C00',
            fontSize: 14,
            fontFamily: 'SF Pro Text, sans-serif',
            cursor: 'pointer',
            transition: 'background-color 0.3s, border-radius 0.3s',
            WebkitTapHighlightColor: 'transparent',
            tapHighlightColor: 'transparent',
          }}
        >
          Завершенные
        </button>
      </div>

      {error ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          <div>Не удалось загрузить заказы</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '40px 0',
          color: '#8B6F53',
          textAlign: 'center'
        }}>
          <div>У вас пока нет {activeTab === 'active' ? 'активных' : 'завершенных'} заказов</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              style={{
                width: 342,
                height: 70,
                backgroundColor: '#FFFBF7',
                borderRadius: 16,
                padding: '16px 20px',
                boxSizing: 'border-box',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: 20, 
                    fontWeight: '700',
                    color: '#410C00',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    {formatOrderDate(order.created_at)}
                  </h3>
                  <p style={{ 
                    margin: '4px 0 0 0',
                    fontSize: 10,
                    color: '#9B8169',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}>
                  <div style={{
                    fontSize: 27,
                    fontWeight: 400,
                    color: '#410C00',
                    fontFamily: 'Tiffany, serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {order.total_amount}
                    <img src="/icons/rub.svg" alt="₽" style={{ width: 16, height: 16 }} />
                  </div>
                  <span style={{ 
                    fontSize: 10, 
                    color: '#9B8169',
                    fontFamily: 'SF Pro Text, sans-serif'
                  }}>
                    +{Math.round(order.total_amount * 0.02)} перепелок
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ProfileCloseButton onClick={onClose} />
    </div>
  );
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
        WebkitTapHighlightColor: 'transparent',
        tapHighlightColor: 'transparent',
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
        padding: '11px 0 21px 0',
        borderBottom: '1px solid #F3ECE4',
        fontSize: 16,
        color: '#3B1707',
        fontWeight: 500,
        cursor: 'pointer',
        gap: 18,
        outline: 'none',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        tapHighlightColor: 'transparent',
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { userData, isLoading, error, refresh } = useUserData();
  const { orders, isLoading: ordersLoading, refresh: refreshOrders } = useOrdersCache();
  const tgUser = useMemo(getTelegramInitData, []);
  let name = 'Не определено';
  let username = 'Не определено';
  let userId = 'Не определено';
  let photoUrl = undefined;
  if (tgUser.first_name || tgUser.last_name) {
    name = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();
    username = tgUser.username ? `@${tgUser.username}` : 'Не определено';
    userId = tgUser.id || 'Не определено';
    photoUrl = tgUser.photo_url;
  } else if (userData) {
    if (userData.first_name || userData.last_name) {
      name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }
    username = userData.telegram_id ? `ID ${userData.telegram_id}` : 'Не определено';
    userId = userData.id || 'Не определено';
    photoUrl = userData.photo_url;
  }

  // Возврат на главную страницу профиля при повторном выборе таба 'profile'
  useEffect(() => {
    if (currentTab === 'profile' && activeSection !== 'main') {
      setActiveSection('main');
    }
  }, [currentTab]);
  
  console.log('Profile activeSection:', activeSection);

  if (activeSection === 'achievements') return <AchievementsSection onClose={() => setActiveSection('main')} orders={orders} ordersLoading={ordersLoading} />;
  if (activeSection === 'about') return <AboutSection onClose={() => setActiveSection('main')} />;
  if (activeSection === 'orders') return <OrdersSection onClose={() => setActiveSection('main')} orders={orders} ordersLoading={ordersLoading} />;

  return (
    <div style={{ background: '#FFFBF7', paddingBottom: 83, height: '93vh', overflow: 'hidden'}}>
      {/* Верхний фон */}
      <div style={{ background: '#EFE9E2', height: 227 }} />
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
            onClick={() => setShowEditProfile(true)} 
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
      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal onClose={() => { setShowEditProfile(false); refresh(); }} initialData={userData} />
      )}
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
          minHeight: 630, maxHeight: '90vh',
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