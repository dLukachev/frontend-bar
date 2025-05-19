import React from 'react';

const tabs = [
  {
    key: 'home',
    label: 'Главная',
    icon: (active) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 14L16 6L26 14V26C26 26.5523 25.5523 27 25 27H7C6.44772 27 6 26.5523 6 26V14Z" fill={active ? '#8B6F53' : 'none'} stroke="#8B6F53" strokeWidth="2"/>
        <rect x="13" y="19" width="6" height="8" rx="1" fill={active ? '#fff' : 'none'} stroke="#8B6F53" strokeWidth="2"/>
      </svg>
    )
  },
  {
    key: 'menu',
    label: 'Меню',
    icon: (active) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="8" height="8" rx="2" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
        <rect x="18" y="6" width="8" height="8" rx="2" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
        <rect x="6" y="18" width="8" height="8" rx="2" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
        <rect x="18" y="18" width="8" height="8" rx="2" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
      </svg>
    )
  },
  {
    key: 'booking',
    label: 'Бронь',
    icon: (active) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="20" height="18" rx="3" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
        <rect x="10" y="14" width="12" height="2" rx="1" fill="#8B6F53"/>
        <rect x="10" y="18" width="8" height="2" rx="1" fill="#8B6F53"/>
        <rect x="10" y="22" width="6" height="2" rx="1" fill="#8B6F53"/>
        <rect x="9" y="4" width="2" height="6" rx="1" fill="#8B6F53"/>
        <rect x="21" y="4" width="2" height="6" rx="1" fill="#8B6F53"/>
      </svg>
    )
  },
  {
    key: 'profile',
    label: 'Профиль',
    icon: (active) => (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="12" r="6" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
        <rect x="7" y="22" width="18" height="6" rx="3" stroke="#8B6F53" strokeWidth="2" fill={active ? '#8B6F53' : 'none'}/>
      </svg>
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
  return (
    <nav style={navStyle}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          style={btnStyle(currentTab === tab.key)}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon(currentTab === tab.key)}
        </button>
      ))}
    </nav>
  );
}

export default NavigationBar; 