import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useApp } from '../context/AppContext';
import { post } from '../fetch/post';

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

const Cart = forwardRef(function Cart({ setTab }, ref) {
  const { cartItems, changeCartItemCount, addToCart, categories, dishes, clearCart, mode, setMode, tableNumber, setTableNumber } = useApp();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const successTimeout = useRef(null);
  const fadeTimeout = useRef(null);

  // Добавляем эффект для кнопки "Назад"
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(() => {
        setTab('menu'); // Возвращаем в меню
      });
    }
    return () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
      }
    };
  }, [setTab]);

  // Экспортируем функцию для вызова из NavigationBar
  useImperativeHandle(ref, () => ({
    handleOrderSuccess: () => {
      setOrderSuccess(true);
      setModalVisible(false); // Сначала скрыто
      requestAnimationFrame(() => setModalVisible(true)); // Плавное появление
      successTimeout.current = setTimeout(() => {
        setModalVisible(false); // Плавное исчезновение
        fadeTimeout.current = setTimeout(() => {
          setOrderSuccess(false);
          setTab('menu');
        }, 500); // Время анимации исчезновения
      }, 1800);
    }
  }));

  React.useEffect(() => () => {
    if (successTimeout.current) clearTimeout(successTimeout.current);
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
  }, []);

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

  // Новый обработчик оформления заказа
  const handleOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      // Собираем данные для заказа
      const orderPayload = {
        user_id: 0, // если есть user_id, подставьте его
        restaurant_id: 1, // если есть другой id, подставьте его
        table_id: mode === 'table' ? Number(tableNumber) || 0 : 0,
        status: 'pending',
        total_amount: total,
        items: cartItems.map(item => ({
          menu_item_id: item.id,
          quantity: item.count,
          price_at_time: item.price
        }))
      };
      const initData = window.Telegram?.WebApp?.initData || '';
      await post('/orders', initData, orderPayload);
      setOrderSuccess(true);
      clearCart && clearCart();
      setTimeout(() => {
        setOrderSuccess(false);
        setTab('menu');
      }, 1800);
    } catch (e) {
      setError('Ошибка при оформлении заказа. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
        background: 'rgba(255,251,247,0.96)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
      }}>
        <div style={{
          opacity: modalVisible ? 1 : 0,
          transform: modalVisible ? 'scale(1)' : 'scale(0.96)',
          transition: 'opacity 0.5s, transform 0.5s',
          fontFamily: 'Tiffany, serif', fontSize: 31, color: '#410C00',
          textAlign: 'center',
        }}>
          Спасибо за заказ!
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#F3ECE4', 
      minHeight: '100vh', 
      padding: '0 0 calc(80px + env(safe-area-inset-bottom)) 0', 
      position: 'relative' 
    }}>
      <div style={{ 
        background: '#F3ECE4', 
        height: 'calc(87px + env(safe-area-inset-top))', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingTop: 'env(safe-area-inset-top)'
      }}>
        <img src="/icons/logo.png" alt="logo" style={{ height: 60 }} />
      </div>
      <TiffanyFontTag />
      <div style={{ 
        padding: '32px 0 24px min(26px, 6vw)', 
        background: '#F3ECE4' 
      }}>
        <span style={{ 
          fontSize: 31, 
          fontWeight: 400, 
          color: '#410C00', 
          fontFamily: 'Tiffany, serif', 
          letterSpacing: '0.04em' 
        }}>
          Моя Корзина
        </span>
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8, 
        padding: '0 min(16px, 4vw)',
        maxWidth: 340,
        margin: '0 auto'
      }}>
        {cartItems.length === 0 ? (
          <div style={{ 
            color: '#8B6F53', 
            fontSize: 16, 
            textAlign: 'center', 
            marginTop: -10, 
            padding: '36px' 
          }}>Выберите что-нибудь в меню</div>
        ) : cartItems.map(item => (
          <div key={item.id} style={{
            width: '100%',
            height: 118,
            background: '#FFFBF7',
            borderRadius: 7,
            boxShadow: '0 2px 8px #0001',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            overflow: 'hidden',
            marginBottom: 8,
            padding: 0,
          }}>
            <img 
              src={item.image_url} 
              alt={item.name} 
              style={{ 
                width: 150, 
                height: 100, 
                objectFit: 'cover', 
                borderRadius: 7, 
                marginLeft: 10, 
                marginTop: 10 
              }} 
            />
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
        margin: '8px min(24px, 6vw) 0',
        padding: '20px 20px 18px 20px',
        boxShadow: '0 2px 8px #0001',
        width: 'min(338px, 90%)',
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
        <div style={{ 
          padding: '0 min(16px, 4vw)', 
          marginTop: 44,
          maxWidth: 340,
          margin: '44px auto 0'
        }}>
          <div style={{
            fontSize: 32,
            fontWeight: 400,
            color: '#410C00',
            marginBottom: 16,
            fontFamily: 'Tiffany, serif',
            letterSpacing: '0.04em',
            width: '100%',
            textAlign: 'left',
            paddingLeft: 0
          }}>
            Возьмите еще
          </div>
          {dishes.filter(d => d.category?.type === 'more' && !d.is_archived && !d.category?.is_archived && !cartItems.some(ci => ci.id === d.id)).map(item => {
            return (
              <div key={item.id} style={{
                width: '100%',
                height: 118,
                background: '#FFFBF7',
                borderRadius: 7,
                boxShadow: '0 2px 8px #0001',
                display: 'flex',
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
});

export default Cart; 