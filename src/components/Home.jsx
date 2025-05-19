import React from 'react';

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

function Home() {
  const initData = window?.Telegram?.WebApp?.initData;

  if (!initData) {
    return <EmptyState />;
  }

  return (
    <div style={{ background: '#FDF8F2', minHeight: '100vh' }}>
      {/* Здесь будет главная страница */}
    </div>
  );
}

export default Home; 