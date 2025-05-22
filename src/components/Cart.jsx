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

function Cart({ setTab }) {
  const { cartItems, changeCartItemCount, addToCart, categories, dishes } = useApp();
  const [mode, setMode] = React.useState('table'); // 'table' или 'takeaway'
  const [tableNumber, setTableNumber] = React.useState('');

  // Логируем данные от бэка
  React.useEffect(() => {
    console.log('CATEGORIES:', categories);
    console.log('DISHES:', dishes);
  }, [categories, dishes]);

  // Закрытие корзины через setTab
  const handleClose = () => {
    setTab('menu');
  };

  // Итоговая сумма заказа
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.count), 0);

  return (
    <div style={{ background: '#F3ECE4', minHeight: '100vh', padding: '0 0 80px 0', position: 'relative' }}>
      <div style={{ background: '#F3ECE4', height: 87}}></div>
      <TiffanyFontTag />
      {/* Крестик закрытия */}
      <button
        onClick={handleClose}
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
        }}
        aria-label="Закрыть корзину"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.7 4.7L13.3 13.3M13.3 4.7L4.7 13.3" stroke="#410C00" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div style={{ padding: '32px 0 24px 26px', background: '#F3ECE4' }}>
        <span style={{ fontSize: 31, fontWeight: 400, color: '#410C00', fontFamily: 'Tiffany, serif', letterSpacing: '0.04em' }}>
          Моя Корзина
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
        {cartItems.length === 0 ? (
          <div style={{ color: '#8B6F53', fontSize: 16, textAlign: 'center', marginTop: -10, padding: '36px' }}>Выберите что-нибудь в меню</div>
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
      {/* Выбор способа заказа  */}
      <div style={{
        background: '#FFFBF7',
        borderRadius: 7,
        margin: '8px 24px 0',
        padding: '20px 20px 18px 20px',
        boxShadow: '0 2px 8px #0001',
        width: 338,
        height: mode === 'table' ? 124 : 60,
        transition: 'height 0.25s cubic-bezier(.4,0,.2,1)',
        maxWidth: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
          <button
            onClick={() => setMode('table')}
            style={{
              flex: 1,
              background: mode === 'table' ? '#EFE9E2' : 'none',
              color: '#3B1B0E',
              fontWeight: 500,
              fontSize: 14,
              border: 'none',
              borderRadius: 7,
              padding: '10px 0',
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginTop: -8,
            }}
          >За столом</button>
          <button
            onClick={() => setMode('takeaway')}
            style={{
              flex: 1,
              background: mode === 'takeaway' ? '#EFE9E2' : 'none',
              color: '#3B1B0E',
              fontWeight: 500,
              fontSize:14,
              border: 'none',
              borderRadius: 7,
              padding: '10px 0',
              cursor: 'pointer',
              transition: 'background 0.2s',
              marginTop: -8,
            }}
          >С собой</button>
        </div>
        <div style={{
          position: 'relative',
          width: '100%',
          height: 56,
          transition: 'height 0.25s cubic-bezier(.4,0,.2,1)',
          overflow: 'visible',
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            opacity: mode === 'table' ? 1 : 0,
            transform: mode === 'table' ? 'translateY(0)' : 'translateY(-20px)',
            pointerEvents: mode === 'table' ? 'auto' : 'none',
            transition: 'opacity 0.25s cubic-bezier(.4,0,.2,1), transform 0.25s cubic-bezier(.4,0,.2,1)',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}>
            <label style={{
              color: '#B7AFA7',
              fontSize: 12,
              fontWeight: 400,
              marginBottom: 0,
              marginLeft: 12,
              marginTop: -12,
              background: 'transparent',
              zIndex: 3,
            }}>Номер стола</label>
            <input
              type="text"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder=""
              style={{
                width: '100%',
                height: '44px',
                fontSize: 16,
                color: '#3B1B0E',
                background: '#FFFCFA',
                border: '1px solid #E8DFD5',
                borderRadius: 16,
                padding: '10px 14px 8px 14px',
                marginTop: 0,
                fontWeight: 400,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 0,
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
            />
          </div>
        </div>
      </div>

      {/* Раздел Возьмите еще */}
      {dishes && dishes.filter(d => d.category?.type === 'more' && !d.is_archived && !d.category?.is_archived && !cartItems.some(ci => ci.id === d.id)).length > 0 && (
        <div style={{ padding: '0 16px', marginTop: 44 }}>
          <div style={{
            fontSize: 32,
            fontWeight: 400,
            color: '#410C00',
            marginBottom: 16,
            fontFamily: 'Tiffany, serif',
            letterSpacing: '0.04em',
            width: 340,
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'left',
            paddingLeft: 0
          }}>
            Возьмите еще
          </div>
          {dishes.filter(d => d.category?.type === 'more' && !d.is_archived && !d.category?.is_archived && !cartItems.some(ci => ci.id === d.id)).map(item => {
            return (
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
                marginBottom: 16,
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
                    <button
                      style={{
                        width: '100%',
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
                      }}
                      onClick={() => addToCart(item)}
                    >В корзину</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Cart; 