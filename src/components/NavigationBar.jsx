import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { post } from '../fetch/post';

const homeIcon = '/icons/home.svg';
const homeActiveIcon = '/icons/home-active.svg';
const menuIcon = '/icons/menu.svg';
const menuActiveIcon = '/icons/menu-active.svg';
const bookingIcon = '/icons/booking.svg';
const bookingActiveIcon = '/icons/booking-active.svg';
const profileIcon = '/icons/profile.svg';
const profileActiveIcon = '/icons/profile-active.svg';

const tabs = [
  {
    key: 'home',
    label: 'Главная',
    icon: (active) => (
      <img
        src={active ? homeActiveIcon : homeIcon}
        alt="Главная"
        style={{ width: '24px', height: '24px' }}
      />
    )
  },
  {
    key: 'menu',
    label: 'Меню',
    icon: (active) => (
      <img
        src={active ? menuActiveIcon : menuIcon}
        alt="Меню"
        style={{ width: '24px', height: '24px' }}
      />
    )
  },
  {
    key: 'booking',
    label: 'Бронь',
    icon: (active) => (
      <img
        src={active ? bookingActiveIcon : bookingIcon}
        alt="Бронь"
        style={{ width: '24px', height: '24px' }}
      />
    )
  },
  {
    key: 'profile',
    label: 'Профиль',
    icon: (active) => (
      <img
        src={active ? profileActiveIcon : profileIcon}
        alt="Профиль"
        style={{ width: '24px', height: '24px' }}
      />
    )
  }
];

const navStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  background: '#FFFBF7',
  borderTop: '1px solid #E5DED6',
  padding: '8px 24px',
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  height: 77,
  zIndex: 100,
};

const btnStyle = (active) => ({
  background: 'none',
  border: 'none',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: active ? '#3B1707' : '#8B6F53',
  cursor: 'pointer',
  padding: '8px 24px',
  margin: 0,
  WebkitTapHighlightColor: 'transparent',
  tapHighlightColor: 'transparent',
});

function NavigationBar({ currentTab, onTabChange, cartRef }) {
  const { cartItems, clearCart, mode, tableNumber } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.count), 0);

  const isButtonDisabled = loading || cartItems.length === 0 || (mode === 'table' && (!tableNumber || Number(tableNumber) === 0));

  const handleTabClick = (key) => {
    onTabChange(key);
    if (currentTab === key) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOrder = async () => {
    if (isButtonDisabled) return;
    
    setLoading(true);
    setError(null);
    try {
      const orderPayload = {
        user_id: 0,
        restaurant_id: 1,
        status: 'pending',
        total_amount: total,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.count,
          price_at_time: item.price
        }))
      };
      if (mode === 'table') {
        orderPayload.table_id = Number(tableNumber);
      }
      const initData = window.Telegram?.WebApp?.initData || '';
      await post('/orders', initData, orderPayload);
      clearCart && clearCart();
      cartRef.current?.handleOrderSuccess();
    } catch (e) {
      let errorMessage = 'Ошибка при оформлении заказа';
      if (mode === 'table') {
        errorMessage = 'Ошибка при оформлении заказа: номер стола указан неверно';
      }
      window.Telegram?.WebApp?.showPopup?.({
        title: 'Ошибка',
        message: errorMessage,
        buttons: [{ type: 'ok' }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav style={navStyle}>
      {currentTab === 'cart' ? (
        <button
          onClick={handleOrder}
          disabled={isButtonDisabled}
          style={{
            background: isButtonDisabled ? '#E5DED6' : '#3B1707',
            color: '#fff',
            fontSize: 20,
            fontWeight: 400,
            border: 'none',
            borderRadius: 20,
            width: 360,
            height: 46,
            margin: '0 auto',
            boxShadow: '0 2px 8px #0002',
            cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            WebkitTapHighlightColor: 'transparent',
            tapHighlightColor: 'transparent',
            opacity: 1,
            position: 'relative',
          }}
        >
          {loading ? (
            'Оформляем...'
          ) : (
            <>
              <span>Оформить заказ  ·</span>
              <span style={{ 
                fontFamily: 'Tiffany, serif', 
                fontSize: 22, 
                fontWeight: 400, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                color: '#fff'
              }}>
                {total}
                <img 
                  src="/icons/rub.svg" 
                  alt="₽" 
                  style={{ 
                    width: 16, 
                    height: 15, 
                    marginLeft: 2, 
                    marginTop: -1, 
                    display: 'inline-block', 
                    verticalAlign: 'middle',
                    filter: 'brightness(0) saturate(100%) invert(1)'
                  }} 
                />
              </span>
            </>
          )}
        </button>
      ) : (
        tabs.map(tab => (
          <button
            key={tab.key}
            style={btnStyle(currentTab === tab.key)}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.icon(currentTab === tab.key)}
          </button>
        ))
      )}
    </nav>
  );
}

export default NavigationBar; 