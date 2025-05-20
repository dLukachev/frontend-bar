import React from 'react';
import homeIcon from '/public/icons/home.svg';
import homeActiveIcon from '/public/icons/home-active.svg';
import menuIcon from '/public/icons/menu.svg';
import menuActiveIcon from '/public/icons/menu-active.svg';
import bookingIcon from '/public/icons/booking.svg';
import profileIcon from '/public/icons/profile.svg';
import profileActiveIcon from '/public/icons/profile-active.svg';

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
        src={bookingIcon}
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
  background: '#FDF8F2',
  borderTop: '1px solid #E5DED6',
  padding: '8px 24px',
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
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
  padding: '8px 24px', // ← вот здесь
  margin: 0,
});

function NavigationBar({ currentTab, onTabChange }) {
  const handleTabClick = (key) => {
    if (currentTab === key) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onTabChange(key);
    }
  };
  return (
    <nav style={navStyle}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          style={btnStyle(currentTab === tab.key)}
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.icon(currentTab === tab.key)}
        </button>
      ))}
    </nav>
  );
}

export default NavigationBar; 