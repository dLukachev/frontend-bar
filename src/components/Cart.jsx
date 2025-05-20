import React, { useState } from 'react';

const initialCart = [
  {
    id: 1,
    name: 'Завтрак с мартини',
    price: 690,
    volume: '250 мл',
    img: 'https://img.freepik.com/free-photo/cocktail_144627-10484.jpg',
    count: 1,
  },
  {
    id: 2,
    name: 'Лагман по-крымски',
    price: 690,
    volume: '400 г',
    img: 'https://img.freepik.com/free-photo/lagman_144627-10485.jpg',
    count: 2,
  },
];

function Cart() {
  const [cart, setCart] = useState(initialCart);

  const handleChange = (id, delta) => {
    setCart(prev => prev
      .map(item => item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item)
      .filter(item => item.count > 0)
    );
  };

  return (
    <div style={{ background: '#FDF8F2', minHeight: '100vh', padding: '0 0 80px 0' }}>
      <div style={{ padding: '32px 0 24px 20px', background: '#FDF8F2' }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: '#6B2F1A', fontFamily: 'serif' }}>
          Моя Корзина
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, padding: '0 16px' }}>
        {cart.map(item => (
          <div key={item.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #0001', padding: 10, display: 'flex', flexDirection: 'row', alignItems: 'stretch', minHeight: 120, position: 'relative', maxWidth: 520, width: '100%', margin: '0 auto' }}>
            <img src={item.img} alt={item.name} style={{ height: 120, width: 'auto', objectFit: 'cover', borderRadius: 12, marginRight: 18 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#3B1707', marginBottom: 6, textAlign: 'left' }}>{item.name}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#6B2F1A', marginBottom: 2 }}>{item.price} ₽</div>
                <div style={{ fontSize: 14, color: '#8B6F53', marginBottom: 12 }}>{item.volume}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => handleChange(item.id, -1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: 20, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{item.count}</span>
                  <button onClick={() => handleChange(item.id, 1)} style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #6B2F1A', background: 'none', color: '#6B2F1A', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cart; 