import React from 'react';
import { useApp } from '../context/AppContext';

// Локальное подключение Tiffany только для Cart
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

function Cart() {
  const { cartItems, changeCartItemCount } = useApp();

  return (
    <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '0 0 80px 0' }}>
      <TiffanyFontTag />
      <div style={{ padding: '32px 0 24px 26px', background: '#F3ECE4' }}>
        <span style={{ fontSize: 31, fontWeight: 400, color: '#410C00', fontFamily: 'Tiffany, serif', letterSpacing: '0.04em' }}>
          Моя Корзина
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
        {cartItems.length === 0 ? (
          <div style={{ color: '#8B6F53', fontSize: 20, textAlign: 'center', marginTop: 40 }}>Корзина пуста</div>
        ) : cartItems.map(item => (
          <div key={item.id} style={{
            width: 340,
            height: 118,
            background: '#FFFBF7',
            borderRadius: 7,
            boxShadow: '0 2px 8px #0001',
            display: 'flex',
            marginLeft: 'auto',
            marginRight: 'auto',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflow: 'hidden',
            marginBottom: 8,
            padding: 0,
          }}>
            <img src={item.image_url || 'https://s234klg.storage.yandex.net/rdisk/dd165799b546145e86676b0aacac4b2d41f3ea0453ffd577e5e648e46a540f61/682ced58/OEOWJxOEUzw24FFHQhwUhUO6oxhIvquHlGfDPWJKNziue6YF-owovARHIR2IDDeLq8b9Hdj7b1PM1eGsMVerqA==?uid=0&filename=IMG_20250520_151328_102.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&fsize=49873&hid=19963f6f7ae29874eda8ea51b944752e&media_type=image&tknv=v3&etag=737218b6e0cb0f8661e617e75bc4f3df&ts=6359788940600&s=f33c70d189de2a01bb15ce3c4eadca30d21b002050556e928f8533b292ca1c59&pb=U2FsdGVkX1-I28UKyGRZfUwvGf30w275NNziH45l0lKK9gQk4h8kKuLkkayHvQPC3BQ14PZuG3Hxwzv3PwD4QcrGTB6CkptLTtOl-hK9MnI'} alt={item.name} style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 7, marginLeft: 10, marginTop: 10 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 16px 12px 16px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#410C00', marginBottom: 4, textAlign: 'left', lineHeight: 1.1 }}>{item.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 0 }}>
                  <div style={{ fontSize: 27, fontWeight: 600, color: '#410C00', fontFamily: 'Tiffany, serif', lineHeight: 1 }}>
                    {Math.floor(item.price)} <img src="/icons/rub.svg" alt="₽" style={{ width: 18, height: 17, marginLeft: -1, display: 'inline-block' }} />
                    <div style={{ fontSize: 12, color: '#410C00', lineHeight: 1, marginTop: 2, fontWeight: 400, fontFamily: 'SF Pro Text, Arial, sans-serif' }}>
                      {item.volume_weight_display}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, color: '#8B6F53', lineHeight: 1 }}>{item.volume_with_unit}</div>
                </div>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', height: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: '#410C00', borderRadius: 5, justifyContent: 'center' }}>
                  <button onClick={() => changeCartItemCount(item.id, -1)} style={{ width: 36, height: 22, borderRadius: 8, border: 0, background: 'none', color: '#FFFBF7', fontSize: 18, fontWeight: 500, cursor: 'pointer', lineHeight: 1 }}>-</button>
                  <span style={{ fontSize: 15, fontWeight: 500, minWidth: 28, textAlign: 'center', color: '#FFFBF7' }}>{item.count}</span>
                  <button onClick={() => changeCartItemCount(item.id, 1)} style={{ width: 36, height: 22, borderRadius: 8, border: 0, background: 'none', color: '#FFFBF7', fontSize: 18, fontWeight: 500, cursor: 'pointer', lineHeight: 1 }}>+</button>
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