import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { get } from '../fetch/get';
import { post } from '../fetch/post';
import { useUserData } from './Profile';

// In-memory cache для запросов (5 минут)
const cache = {};
function cachedGet(key, fetcher, ttlMs = 5 * 60 * 1000) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].ts < ttlMs)) {
    return Promise.resolve(cache[key].data);
  }
  return fetcher().then(data => {
    cache[key] = { data, ts: now };
    return data;
  });
}

function getInitData() {
  // Получаем initData из Telegram WebApp
  return window.Telegram?.WebApp?.initData || '';
}

function TableModal({ onClose, tableId, selectedDate, onSelectTime }) {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const [tableSlots, setTableSlots] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);
  const sheetRef = React.useRef(null);

  useEffect(() => {
    if (tableId) {
      fetchTableSlots(tableId);
    }
  }, [tableId, selectedDate]);

  const fetchTableSlots = async (id) => {
    try {
      const data = await get( // <- Здесь теперь прямой вызов get, без cachedGet
        `/reservations/tables/${id}/slots`,
        getInitData(),
        { date: selectedDate },
        { 'initData': getInitData() }
      );
      setTableSlots(data);
      if (data.length > 0) {
        setTableInfo(data[0].table);
      }
    } catch (error) {
      console.error('Error fetching table slots:', error);
    }
  };

  React.useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTouchY(0);
    setTimeout(onClose, 300);
  };

  const handleTouchStart = (e) => {
    const y = e.touches[0].clientY;
    setTouchStart(y);
    setTouchY(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const y = e.touches[0].clientY;
    const diff = y - touchStart;
    if (diff > 0) {
      setTouchY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    if (touchY > 100) handleClose();
    else setTouchY(0);
    setTouchStart(null);
  };

  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s'
      }} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: '#FFFBF7',
          borderTopLeftRadius: 15, borderTopRightRadius: 15,
          boxShadow: '0 -4px 24px #0002',
          height: 630,
          transform: isVisible ? `translateY(${touchY}px)` : 'translateY(100%)',
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '15px',
          display: 'flex', flexDirection: 'column',
          willChange: 'transform', touchAction: 'none',
        }}
      >
        {tableInfo && (
          <>
            <img 
              src={tableInfo.image_url} 
              alt={`Стол №${tableInfo.number}`}
              style={{ 
                width: 360,
                height: 240,
                borderRadius: 10,
                margin: '0 auto',
                objectFit: 'cover'
              }} 
            />
            <h1 style={{ 
              fontSize: 53, 
              color: '#410C00', 
              fontFamily: 'Tiffany, serif', 
              margin: '25px 0 8px 15px',
              textAlign: 'left'
            }}>
              Стол №{tableInfo.number}
            </h1>
            <p style={{ 
              color: '#410C00', 
              fontSize: 13,
              textAlign: 'left',
              margin: '0 15px',
              padding: 0
            }}>
              {tableInfo.description}
            </p>
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <button 
                onClick={() => onSelectTime(tableInfo, tableSlots)} 
                style={{ 
                  width: 340,
                  height: 46,
                  background: '#410C00',
                  color: '#FFFBF7',
                  border: 'none',
                  borderRadius: 15,
                  fontSize: 19,
                  cursor: 'pointer'
                }}
              >
                Выбрать время
              </button>
              <button 
                onClick={handleClose} 
                style={{ 
                  background: 'none',
                  border: 'none',
                  color: '#410C00',
                  fontSize: 19,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Booking() {
  const [showTableModal, setShowTableModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tablesAvailability, setTablesAvailability] = useState([]);
  // Временные интервалы
  const timeSlots = [
    '11:00 – 13:00', '12:00 – 14:00', '13:00 – 15:00', '14:00 – 16:00',
    '15:00 – 17:00', '16:00 – 18:00', '17:00 – 19:00', '18:00 – 20:00',
    '19:00 – 21:00', '20:00 – 22:00', '21:00 – 23:00'
  ];
  const [activeSlot, setActiveSlot] = useState(0); // по умолчанию 11:00–13:00
  // Сегодняшняя дата в формате YYYY-MM-DD
  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today); // State for selected date
  const [showCalendarModal, setShowCalendarModal] = useState(false); // State to control calendar modal visibility

  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedTableData, setSelectedTableData] = useState(null);

  // Функция для получения времени начала и конца выбранного слота
  function getSlotTimes(slot) {
    const [start, end] = slot.split('–').map(t => t.trim());
    return { start, end };
  }

  // Функция для получения доступности столов
  const fetchTablesAvailability = async (slot, bypassCache = false) => {
    try {
      const { start, end } = getSlotTimes(slot);
      const key = `/reservations/tables/slot-availability?restaurant_id=1&date=${selectedDate}&slot_start=${start}&slot_end=${end}`;
      const fetcher = () => get(
        '/reservations/tables/slot-availability',
        getInitData(),
        {
          restaurant_id: 1,
          date: selectedDate,
          slot_start: start,
          slot_end: end
        },
        { 'initData': getInitData() }
      );

      const data = bypassCache ? await fetcher() : await cachedGet(key, fetcher);

      setTablesAvailability(data);
    } catch (error) {
      console.error('Error fetching tables availability:', error);
    }
  };

  // При изменении активного слота запрашиваем доступность столов
  useEffect(() => {
    fetchTablesAvailability(timeSlots[activeSlot]);
  }, [activeSlot, selectedDate]); // Added selectedDate dependency

  // Просто открытие модалки по клику
  const handleTableClick = (tableId) => {
    setSelectedTableId(tableId);
    setShowTableModal(true);
  };

  const handleSelectTime = (tableInfo, tableSlots) => {
    setSelectedTableData({ tableInfo, tableSlots });
    setShowBookingDetailsModal(true);
    // Delay closing TableModal slightly for smoother transition
    setTimeout(() => {
      setShowTableModal(false);
    }, 200); // Adjust delay as needed
  };

  const handleCloseBookingDetailsModal = () => {
    setShowBookingDetailsModal(false);
    setSelectedTableData(null);
    // Clear cached table availability data for all time slots for the current date
    timeSlots.forEach(slot => {
      const { start, end } = getSlotTimes(slot);
      const key = `/reservations/tables/slot-availability?restaurant_id=1&date=${selectedDate}&slot_start=${start}&slot_end=${end}`;
      delete cache[key];
    });
    // Fetch fresh data for the currently active slot
    fetchTablesAvailability(timeSlots[activeSlot]);
  };

  return (
    <div style={{ background: '#FFFBF7', minHeight: '91vh' }}>
      <div style={{ background: '#FFFBF7', height: 87 }}></div>
      {/* Header + Date Select */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#FFFBF7', padding: '24px 0 0 20px' }}>
        <span style={{ fontFamily: 'Tiffany, serif', fontSize: 31, color: '#410C00', fontWeight: 400 }}>
          Бронирование
        </span>
        <div style={{ position: 'relative' }}>
          <button
            style={{
              width: 101, height: 39, borderRadius: 12, border: 'none', background: '#F3ECE4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, cursor: 'pointer',
              fontFamily: 'Tiffany, serif', fontSize: 31, color: '#410C00', fontWeight: 400
            }}
            onClick={() => setShowCalendarModal(true)}
          >
            {dayjs(selectedDate).format('DD.MM')}
            <span style={{ marginLeft: 8, fontSize: 18, color: '#410C00' }}>▼</span>
          </button>
          {showCalendarModal && (
            <CalendarModal
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setShowCalendarModal(false);
              }}
              onClose={() => setShowCalendarModal(false)}
            />
          )}
        </div>
      </div>
      {/* Временные интервалы */}
      <div style={{
        overflowX: 'auto', whiteSpace: 'nowrap', margin: '8px 0 16px 0', paddingLeft: 20, paddingRight: 20,
        height: 46, // 30px высота + отступы
        display: 'flex', alignItems: 'flex-end',
        scrollbarWidth: 'none', msOverflowStyle: 'none', // скрыть скроллбар для Firefox/IE
      }}
        className="time-scroll"
      >
        {timeSlots.map((slot, idx) => (
          <div
            key={slot}
            onClick={() => setActiveSlot(idx)}
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              minWidth: 120, height: 30, justifyContent: 'flex-end', marginRight: 24,
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <span style={{
              fontFamily: 'SF Pro Display, sans-serif', fontSize: 17, fontWeight: 500,
              color: activeSlot === idx ? '#410C00' : '#B7AFA7',
              letterSpacing: 0.2,
              transition: 'color 0.2s',
            }}>{slot}</span>
            {activeSlot === idx ? (
              <div style={{ width: '100%', height: 3, background: '#410C00', borderRadius: 2, marginTop: 6 }} />
            ) : (
              <div style={{ width: '100%', height: 3, marginTop: 6, visibility: 'hidden' }} />
            )}
          </div>
        ))}
      </div>
      {/* Схема зала */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '34px' }}>
        <svg width="344" height="497" viewBox="0 0 344 497" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="344" height="497" fill="#FFFBF7" />
          <rect x="297.534" y="67.9983" width="11.2419" height="67.4513" rx="3" transform="rotate(-180 297.534 67.9983)" fill="#9B8169"/>
          <rect x="297.159" y="0.546951" width="11.2419" height="241.326" rx="3" transform="rotate(90 297.159 0.546951)" fill="#F3ECE4"/>
          <rect x="268.492" y="11.7888" width="11.2419" height="28.4794" rx="3" transform="rotate(-90 268.492 11.7888)" fill="#9B8169"/>
          <rect x="212.283" y="11.7888" width="11.2419" height="26.9805" rx="3" transform="rotate(-90 212.283 11.7888)" fill="#9B8169"/>
          <rect x="157.01" y="11.7888" width="11.2419" height="26.9805" rx="3" transform="rotate(-90 157.01 11.7888)" fill="#9B8169"/>
          <rect x="203.852" y="118.587" width="11.2419" height="90.8718" rx="3" transform="rotate(-90 203.852 118.587)" fill="#F3ECE4"/>
          <rect x="203.852" y="287.215" width="11.2419" height="91.8087" rx="3" transform="rotate(-90 203.852 287.215)" fill="#F3ECE4"/>
          <rect x="101.738" y="11.7888" width="11.2419" height="26.9805" rx="3" transform="rotate(-90 101.738 11.7888)" fill="#9B8169"/>
          <rect x="46.4657" y="0.547043" width="11.2419" height="425.318" rx="3" fill="#F3ECE4"/>
          <rect x="46.4656" y="176.67" width="11.178" height="32.7888" rx="3" fill="#9B8169"/>
          <rect x="46.4656" y="258.173" width="11.178" height="32.7888" rx="3" fill="#9B8169"/>
          <rect x="46.4657" y="343.424" width="11.2419" height="82.4404" rx="3" fill="#9B8169"/>
          <rect x="50.2129" y="11.7889" width="11.2419" height="24.3574" rx="3" transform="rotate(-90 50.2129 11.7889)" fill="#9B8169"/>
          <rect x="89.5596" y="468.959" width="11.2419" height="206.101" rx="3" transform="rotate(-90 89.5596 468.959)" fill="#9B8169"/>
          <rect x="46.4656" y="0.546982" width="11.7103" height="42.157" rx="3" fill="#9B8169"/>
          <rect x="46.4656" y="89.5452" width="11.1898" height="40.2834" rx="3" fill="#9B8169"/>
          <rect x="295.661" y="468.958" width="11.2419" height="324.141" rx="3" transform="rotate(-180 295.661 468.958)" fill="#9B8169"/>
          <rect x="215.094" y="287.215" width="11.2419" height="179.87" rx="3" transform="rotate(-180 215.094 287.215)" fill="#F3ECE4"/>
          <rect x="305.029" y="67.9983" width="18.7365" height="11.2419" rx="3" transform="rotate(-180 305.029 67.9983)" fill="#9B8169"/>
          <rect x="305.029" y="156.06" width="20.6101" height="11.2419" rx="3" transform="rotate(-180 305.029 156.06)" fill="#9B8169"/>
          <rect x="305.029" y="118.587" width="59.9567" height="11.2419" rx="3" transform="rotate(-180 305.029 118.587)" fill="#9B8169"/>
          <rect x="295.661" y="287.215" width="50.5884" height="11.2419" rx="3" transform="rotate(-180 295.661 287.215)" fill="#9B8169"/>
          <path d="M243.101 199.837L234.278 189.649H251.924L243.101 199.837Z" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M243.101 200.403V206.063" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M239.705 207.195H246.497" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M239.139 195.309H247.063" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M249.893 192.479H251.591C253.466 192.479 254.987 190.958 254.987 189.083C254.987 187.207 253.466 185.687 251.591 185.687C249.715 185.687 248.195 187.207 248.195 189.083C248.195 189.276 248.211 189.465 248.242 189.649" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M236.309 191.994L241.14 197.573" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M249.893 191.994L244.918 197.738" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M290.508 82.9873C291.543 82.9873 292.382 82.1485 292.382 81.1137C292.382 80.0789 291.543 79.2401 290.508 79.2401C289.473 79.2401 288.635 80.0789 288.635 81.1137C288.635 82.1485 289.473 82.9873 290.508 82.9873Z" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M298.94 82.9873C299.974 82.9873 300.813 82.1485 300.813 81.1137C300.813 80.0789 299.974 79.2401 298.94 79.2401C297.905 79.2401 297.066 80.0789 297.066 81.1137C297.066 82.1485 297.905 82.9873 298.94 82.9873Z" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M288.166 85.7978H292.85L291.913 96.1029H289.103L288.166 85.7978Z" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M296.597 85.7978H301.282L302.218 90.9503H300.813L300.345 96.1029H297.534L297.066 90.9503H295.661L296.597 85.7978Z" stroke="#9B8169" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="282.545" y="15.5362" width="11.2419" height="221.09" rx="3" transform="rotate(90 282.545 15.5362)" fill="#F3ECE4"/>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => {
            const t = tablesAvailability.find(t => t.number === num);
            const fill = t?.is_available ? '#F3ECE4' : '#FFDEDA';
            const clickable = t?.is_available;
            if (num === 1) return (
              <g key={1} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="332.182" width="38.4097" height="22.4838" rx="3" fill={fill} />
                <rect x="99.8646" y="317.193" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 317.193)" fill={fill} />
                <rect x="99.8646" y="358.413" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 358.413)" fill={fill} />
            <path d="M81.6457 340.637L81.6457 347.182H80.6549L80.6549 341.628H80.6166L79.0505 342.65V341.704L80.6837 340.637H81.6457Z" fill="#410C00" />
                <rect x="106.455" y="334.993" width="11.2419" height="16.8628" rx="3" fill={fill} />
              </g>
            );
            if (num === 2) return (
              <g key={2} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="275.973" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="99.8646" y="260.984" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 260.984)" fill={fill}/>
                <rect x="99.8646" y="302.204" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 302.204)" fill={fill}/>
                <path d="M78.5296 290.973V290.257L80.7444 287.962C80.9809 287.713 81.1759 287.495 81.3293 287.307C81.4848 287.118 81.6009 286.938 81.6776 286.767C81.7543 286.597 81.7927 286.415 81.7927 286.224C81.7927 286.006 81.7416 285.819 81.6393 285.661C81.537 285.501 81.3975 285.379 81.2206 285.294C81.0438 285.206 80.8445 285.163 80.623 285.163C80.3886 285.163 80.184 285.211 80.0093 285.306C79.8346 285.402 79.7004 285.538 79.6066 285.712C79.5129 285.887 79.466 286.092 79.466 286.326H78.5232C78.5232 285.928 78.6148 285.579 78.798 285.281C78.9813 284.983 79.2327 284.751 79.5523 284.587C79.8719 284.421 80.2352 284.338 80.6421 284.338C81.0534 284.338 81.4156 284.42 81.7288 284.584C82.0441 284.746 82.2902 284.968 82.4671 285.249C82.6439 285.528 82.7323 285.843 82.7323 286.195C82.7323 286.438 82.6865 286.675 82.5949 286.908C82.5054 287.14 82.3488 287.399 82.1251 287.684C81.9014 287.968 81.5903 288.312 81.1918 288.717L79.8911 290.078V290.126H82.8378V290.973H78.5296Z" fill="#410C00"/>
                <rect x="106.455" y="278.783" width="11.2419" height="16.8628" rx="3" fill={fill}/>
              </g>
            );
            if (num === 3) return (
              <g key={3} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="219.764" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="99.8646" y="204.774" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 204.774)" fill={fill}/>
                <rect x="99.8646" y="245.995" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 245.995)" fill={fill}/>
            <path d="M80.6677 234.853C80.2288 234.853 79.8367 234.777 79.4916 234.626C79.1485 234.475 78.8769 234.265 78.6766 233.997C78.4784 233.726 78.3719 233.413 78.357 233.057H79.3605C79.3733 233.251 79.4383 233.419 79.5555 233.562C79.6748 233.703 79.8303 233.811 80.0221 233.888C80.2139 233.965 80.4269 234.003 80.6613 234.003C80.9191 234.003 81.1471 233.958 81.3453 233.869C81.5455 233.779 81.7021 233.655 81.8151 233.495C81.928 233.333 81.9845 233.146 81.9845 232.936C81.9845 232.716 81.928 232.523 81.8151 232.357C81.7043 232.189 81.5413 232.057 81.3261 231.961C81.113 231.865 80.8552 231.817 80.5526 231.817H79.9997V231.012H80.5526C80.7955 231.012 81.0086 230.968 81.1918 230.88C81.3772 230.793 81.5221 230.672 81.6265 230.516C81.7309 230.358 81.7831 230.174 81.7831 229.963C81.7831 229.761 81.7373 229.585 81.6457 229.436C81.5562 229.285 81.4284 229.166 81.2622 229.081C81.0981 228.996 80.9042 228.953 80.6805 228.953C80.4674 228.953 80.2682 228.993 80.0828 229.072C79.8996 229.148 79.7504 229.259 79.6354 229.404C79.5203 229.547 79.4585 229.718 79.45 229.918H78.4944C78.5051 229.565 78.6095 229.254 78.8076 228.985C79.0079 228.717 79.2721 228.507 79.6002 228.356C79.9284 228.204 80.2927 228.129 80.6933 228.129C81.113 228.129 81.4752 228.211 81.7799 228.375C82.0867 228.537 82.3232 228.753 82.4894 229.024C82.6578 229.294 82.7409 229.59 82.7387 229.912C82.7409 230.279 82.6386 230.59 82.4319 230.845C82.2274 231.101 81.9546 231.273 81.6137 231.36V231.411C82.0484 231.477 82.385 231.65 82.6237 231.929C82.8644 232.208 82.9837 232.554 82.9816 232.967C82.9837 233.328 82.8836 233.65 82.6812 233.936C82.4809 234.221 82.2071 234.446 81.8598 234.61C81.5125 234.772 81.1151 234.853 80.6677 234.853Z" fill="#410C00"/>
                <rect x="106.455" y="222.574" width="11.2419" height="16.8628" rx="3" fill={fill}/>
              </g>
            );
            if (num === 4) return (
              <g key={4} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="163.554" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="99.8646" y="148.565" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 148.565)" fill={fill}/>
                <rect x="99.8646" y="189.785" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 189.785)" fill={fill}/>
                <path d="M78.2076 177.276L78.2076 176.477L81.036 172.009H81.6657V173.185H81.2662L79.2431 176.387V176.438L83.1198 176.438L83.1198 177.276L78.2076 177.276ZM81.3109 178.554L81.3109 177.033L81.3173 176.669L81.3173 172.009L82.2537 172.009L82.2537 178.554L81.3109 178.554Z" fill="#410C00"/>
                <rect x="106.455" y="166.365" width="11.2419" height="16.8628" rx="3" fill={fill}/>
              </g>
            );
            if (num === 5) return (
              <g key={5} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="107.345" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="99.8646" y="92.3557" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 92.3557)" fill={fill}/>
                <rect x="99.8646" y="133.576" width="11.2419" height="38.4097" rx="3" transform="rotate(90 99.8646 133.576)" fill={fill}/>
            <path d="M80.6593 122.434C80.2587 122.434 79.8987 122.358 79.5791 122.204C79.2616 122.049 79.008 121.836 78.8184 121.565C78.6288 121.294 78.5276 120.986 78.5148 120.638H79.4736C79.497 120.919 79.6217 121.151 79.8475 121.332C80.0734 121.513 80.344 121.603 80.6593 121.603C80.9107 121.603 81.1334 121.546 81.3273 121.431C81.5233 121.314 81.6767 121.153 81.7875 120.948C81.9004 120.744 81.9569 120.51 81.9569 120.248C81.9569 119.982 81.8994 119.744 81.7843 119.536C81.6693 119.327 81.5105 119.163 81.3081 119.043C81.1078 118.924 80.8777 118.863 80.6178 118.861C80.4196 118.861 80.2204 118.895 80.0201 118.963C79.8198 119.032 79.6579 119.121 79.5343 119.232L78.6298 119.098L78.9974 115.799L82.5961 115.799V116.646H79.8188L79.611 118.478H79.6494C79.7772 118.354 79.9466 118.251 80.1575 118.168C80.3706 118.085 80.5986 118.043 80.8415 118.043C81.2399 118.043 81.5947 118.138 81.9058 118.327C82.219 118.517 82.4651 118.776 82.644 119.104C82.8251 119.43 82.9146 119.805 82.9125 120.229C82.9146 120.653 82.8188 121.031 82.6249 121.364C82.4331 121.696 82.1668 121.958 81.8259 122.15C81.4871 122.34 81.0982 122.434 80.6593 122.434Z" fill="#410C00"/>
                <rect x="106.455" y="110.155" width="11.2419" height="16.8628" rx="3" fill={fill}/>
              </g>
            );
            if (num === 6) return (
              <g key={6} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="61.4548" y="30.5254" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="99.8646" y="15.5362" width="11.2419" height="38.4098" rx="3" transform="rotate(90 99.8646 15.5362)" fill={fill}/>
                <rect x="101.318" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 101.318 56.7564)" fill={fill}/>
                <rect x="79.3176" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 79.3176 56.7564)" fill={fill}/>
                <path d="M79.9032 45.7042C79.6113 45.6999 79.3236 45.6467 79.0403 45.5444C78.759 45.4421 78.5033 45.2717 78.2732 45.033C78.0431 44.7944 77.8588 44.4737 77.7203 44.071C77.5839 43.6683 77.5157 43.1655 77.5157 42.5625C77.5157 41.9915 77.5722 41.4844 77.6851 41.0412C77.8002 40.598 77.9653 40.2241 78.1805 39.9194C78.3957 39.6126 78.6557 39.3793 78.9603 39.2195C79.265 39.0597 79.607 38.9798 79.9863 38.9798C80.3762 38.9798 80.7224 39.0565 81.025 39.2099C81.3275 39.3633 81.5726 39.5753 81.7601 39.8459C81.9497 40.1165 82.0701 40.4244 82.1212 40.7695L81.1464 40.7695C81.0804 40.4968 80.9493 40.2742 80.7533 40.1016C80.5573 39.929 80.3016 39.8427 79.9863 39.8427C79.5069 39.8427 79.1329 40.0515 78.8645 40.4691C78.5981 40.8867 78.4639 41.4673 78.4618 42.211H78.5097C78.6226 42.0256 78.7611 41.8679 78.9252 41.7379C79.0914 41.6058 79.2768 41.5046 79.4813 41.4343C79.688 41.3619 79.9053 41.3257 80.1333 41.3257C80.5126 41.3257 80.8556 41.4183 81.1624 41.6037C81.4714 41.7869 81.7175 42.0405 81.9007 42.3644C82.0839 42.6882 82.1755 43.059 82.1755 43.4766C82.1755 43.8942 82.0807 44.2724 81.8911 44.6112C81.7036 44.9499 81.4394 45.2184 81.0985 45.4166C80.7576 45.6126 80.3591 45.7085 79.9032 45.7042ZM79.9 44.8732C80.1514 44.8732 80.3762 44.8114 80.5743 44.6879C80.7725 44.5643 80.9291 44.3981 81.0442 44.1893C81.1592 43.9805 81.2167 43.7472 81.2167 43.4894C81.2167 43.2379 81.1603 43.0089 81.0474 42.8022C80.9366 42.5955 80.7831 42.4315 80.5871 42.31C80.3932 42.1886 80.1716 42.1279 79.9224 42.1279C79.7327 42.1279 79.5569 42.1641 79.395 42.2365C79.2352 42.309 79.0946 42.4091 78.9731 42.5369C78.8517 42.6648 78.7558 42.8118 78.6855 42.978C78.6173 43.1421 78.5832 43.3157 78.5832 43.4989C78.5832 43.744 78.6397 43.9709 78.7526 44.1797C78.8677 44.3885 79.0243 44.5568 79.2224 44.6847C79.4227 44.8104 79.6486 44.8732 79.9 44.8732Z" fill="#410C00"/>
              </g>
            );
            if (num === 7) return (
              <g key={7} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="122.348" y="30.5254" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="160.758" y="15.5362" width="11.2419" height="38.4098" rx="3" transform="rotate(90 160.758 15.5362)" fill={fill}/>
                <rect x="162.211" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 162.211 56.7564)" fill={fill}/>
                <rect x="140.211" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 140.211 56.7564)" fill={fill}/>
                <path d="M138.987 45.6147L141.844 39.9641V39.9162L138.539 39.9162V39.0693L142.867 39.0693V39.945L140.019 45.6147L138.987 45.6147Z" fill="#410C00"/>
              </g>
            );
            if (num === 8) return (
              <g key={8} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="183.242" y="30.5254" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="221.652" y="15.5362" width="11.2419" height="38.4098" rx="3" transform="rotate(90 221.652 15.5362)" fill={fill}/>
                <rect x="223.105" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 223.105 56.7564)" fill={fill}/>
                <rect x="201.105" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 201.105 56.7564)" fill={fill}/>
                <path d="M201.634 45.7042C201.176 45.7042 200.771 45.6254 200.42 45.4677C200.07 45.31 199.797 45.0927 199.598 44.8157C199.4 44.5387 199.302 44.2234 199.304 43.8697C199.302 43.5927 199.359 43.3381 199.474 43.1058C199.591 42.8715 199.75 42.6765 199.95 42.521C200.15 42.3633 200.374 42.2632 200.621 42.2205V42.1822C200.295 42.1034 200.034 41.9286 199.838 41.658C199.642 41.3874 199.545 41.0764 199.547 40.7248C199.545 40.3903 199.634 40.092 199.812 39.8299C199.994 39.5657 200.242 39.358 200.557 39.2067C200.873 39.0554 201.232 38.9798 201.634 38.9798C202.033 38.9798 202.388 39.0565 202.702 39.2099C203.017 39.3612 203.265 39.5689 203.446 39.8331C203.627 40.0952 203.719 40.3924 203.721 40.7248C203.719 41.0764 203.619 41.3874 203.421 41.658C203.223 41.9286 202.965 42.1034 202.647 42.1822V42.2205C202.892 42.2632 203.113 42.3633 203.309 42.521C203.507 42.6765 203.665 42.8715 203.782 43.1058C203.901 43.3381 203.962 43.5927 203.964 43.8697C203.962 44.2234 203.862 44.5387 203.664 44.8157C203.466 45.0927 203.191 45.31 202.839 45.4677C202.49 45.6254 202.088 45.7042 201.634 45.7042ZM201.634 44.8956C201.905 44.8956 202.139 44.8509 202.337 44.7614C202.536 44.6698 202.689 44.543 202.798 44.3811C202.906 44.217 202.962 44.0252 202.964 43.8058C202.962 43.5778 202.902 43.3764 202.785 43.2017C202.67 43.027 202.513 42.8896 202.315 42.7894C202.117 42.6893 201.89 42.6392 201.634 42.6392C201.376 42.6392 201.147 42.6893 200.947 42.7894C200.747 42.8896 200.589 43.027 200.474 43.2017C200.359 43.3764 200.303 43.5778 200.305 43.8058C200.303 44.0252 200.355 44.217 200.461 44.3811C200.57 44.543 200.724 44.6698 200.925 44.7614C201.125 44.8509 201.362 44.8956 201.634 44.8956Z" fill="#410C00"/>
              </g>
            );
            if (num === 9) return (
              <g key={9} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="244.135" y="30.5254" width="38.4097" height="22.4838" rx="3" fill={fill}/>
                <rect x="282.545" y="15.5362" width="11.2419" height="38.4098" rx="3" transform="rotate(90 282.545 15.5362)" fill={fill}/>
                <rect x="283.998" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 283.998 56.7564)" fill={fill}/>
                <rect x="261.998" y="56.7564" width="11.2419" height="16.8628" rx="3" transform="rotate(90 261.998 56.7564)" fill={fill}/>
                <path d="M262.475 38.9798C262.767 38.9819 263.054 39.0352 263.338 39.1396C263.621 39.244 263.877 39.4144 264.105 39.6509C264.335 39.8874 264.518 40.207 264.654 40.6097C264.793 41.0103 264.863 41.5089 264.865 42.1055C264.865 42.6786 264.808 43.1889 264.693 43.6364C264.578 44.0817 264.413 44.4578 264.197 44.7646C263.984 45.0714 263.726 45.3047 263.421 45.4645C263.116 45.6243 262.773 45.7042 262.392 45.7042C262.002 45.7042 261.656 45.6275 261.353 45.4741C261.05 45.3207 260.804 45.1087 260.615 44.8381C260.425 44.5654 260.307 44.2521 260.26 43.8985L261.235 43.8985C261.299 44.1797 261.429 44.4077 261.625 44.5824C261.823 44.755 262.079 44.8413 262.392 44.8413C262.871 44.8413 263.245 44.6325 263.514 44.2149C263.782 43.7951 263.917 43.2092 263.919 42.457H263.868C263.757 42.6403 263.619 42.798 263.453 42.9301C263.289 43.0622 263.104 43.1644 262.9 43.2369C262.695 43.3093 262.477 43.3455 262.245 43.3455C261.868 43.3455 261.525 43.2529 261.216 43.0675C260.907 42.8821 260.661 42.6275 260.477 42.3036C260.294 41.9798 260.202 41.6101 260.202 41.1946C260.202 40.7813 260.296 40.4063 260.484 40.0696C260.673 39.733 260.938 39.4666 261.276 39.2706C261.617 39.0725 262.017 38.9755 262.475 38.9798ZM262.478 39.8107C262.229 39.8107 262.004 39.8725 261.804 39.9961C261.605 40.1176 261.449 40.2827 261.334 40.4915C261.219 40.6982 261.161 40.9283 261.161 41.1818C261.161 41.4354 261.217 41.6655 261.327 41.8722C261.44 42.0767 261.594 42.2397 261.788 42.3612C261.984 42.4805 262.207 42.5401 262.459 42.5401C262.646 42.5401 262.821 42.5039 262.983 42.4315C263.145 42.359 263.287 42.2589 263.408 42.1311C263.529 42.0011 263.624 41.8541 263.692 41.69C263.761 41.5259 263.795 41.3534 263.795 41.1722C263.795 40.9315 263.737 40.7078 263.622 40.5011C263.509 40.2944 263.354 40.1282 263.156 40.0025C262.957 39.8747 262.732 39.8107 262.478 39.8107Z" fill="#410C00"/>
              </g>
            );
            if (num === 10) return (
              <g key={10} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="265.682" y="338.74" width="38.4097" height="22.4838" rx="3" transform="rotate(90 265.682 338.74)" fill={fill}/>
                <rect x="280.672" y="377.15" width="11.2419" height="38.4098" rx="3" transform="rotate(-180 280.672 377.15)" fill={fill}/>
                <rect x="239.451" y="378.603" width="11.2419" height="16.8628" rx="3" transform="rotate(-180 239.451 378.603)" fill={fill}/>
                <rect x="239.451" y="356.603" width="11.2419" height="16.8628" rx="3" transform="rotate(-180 239.451 356.603)" fill={fill}/>
                <path d="M252.522 354.195V360.74H251.531V355.185H251.493L249.927 356.208V355.262L251.56 354.195H252.522ZM256.571 360.849C256.066 360.847 255.635 360.714 255.277 360.449C254.919 360.185 254.645 359.801 254.455 359.296C254.266 358.791 254.171 358.182 254.171 357.471C254.171 356.761 254.266 356.155 254.455 355.652C254.647 355.149 254.922 354.766 255.28 354.502C255.64 354.237 256.07 354.105 256.571 354.105C257.072 354.105 257.501 354.238 257.859 354.505C258.217 354.769 258.491 355.152 258.681 355.655C258.872 356.156 258.968 356.761 258.968 357.471C258.968 358.184 258.873 358.794 258.684 359.299C258.494 359.802 258.22 360.186 257.862 360.453C257.504 360.717 257.074 360.849 256.571 360.849ZM256.571 359.996C257.014 359.996 257.361 359.779 257.61 359.347C257.861 358.914 257.987 358.289 257.987 357.471C257.987 356.927 257.929 356.468 257.814 356.093C257.701 355.716 257.538 355.431 257.325 355.237C257.114 355.041 256.863 354.943 256.571 354.943C256.13 354.943 255.784 355.16 255.532 355.595C255.281 356.029 255.154 356.655 255.152 357.471C255.152 358.016 255.209 358.477 255.322 358.855C255.437 359.23 255.6 359.514 255.811 359.708C256.021 359.9 256.275 359.996 256.571 359.996Z" fill="#410C00"/>
              </g>
            );
            if (num === 11) return (
              <g key={11} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="249.756" y="438.98" width="38.4097" height="22.4838" rx="3" transform="rotate(-180 249.756 438.98)" fill={fill}/>
                <rect x="211.347" y="453.969" width="11.2419" height="38.4098" rx="3" transform="rotate(-90 211.347 453.969)" fill={fill}/>
                <rect x="209.894" y="412.749" width="11.2419" height="16.8628" rx="3" transform="rotate(-90 209.894 412.749)" fill={fill}/>
                <rect x="231.894" y="412.749" width="11.2419" height="16.8628" rx="3" transform="rotate(-90 231.894 412.749)" fill={fill}/>
          <path d="M228.163 425.04L228.163 431.586H227.172L227.172 426.031H227.134L225.568 427.054L225.568 426.108L227.201 425.04H228.163ZM232.417 425.04L232.417 431.586H231.426L231.426 426.031H231.388L229.822 427.054L229.822 426.108L231.455 425.04H232.417Z" fill="#410C00"/>
              </g>
            );
            if (num === 12) return (
              <g key={12} style={{ cursor: clickable ? 'pointer' : 'default' }} onClick={clickable ? () => handleTableClick(t.id) : undefined}>
                <rect x="164.791" y="436.428" width="38.4097" height="22.4838" rx="3" transform="rotate(-135 164.791 436.428)" fill={fill}/>
                <rect x="127.032" y="419.867" width="11.2419" height="38.4098" rx="3" transform="rotate(-45 127.032 419.867)" fill={fill}/>
                <rect x="155.152" y="389.693" width="11.2419" height="16.8628" rx="3" transform="rotate(-45 155.152 389.693)" fill={fill}/>
                <rect x="170.708" y="405.249" width="11.2419" height="16.8628" rx="3" transform="rotate(-45 170.708 405.249)" fill={fill}/>
                <path d="M158.579 410.501L153.95 415.13L153.25 414.429L157.177 410.501L157.15 410.474L155.32 410.09L155.989 409.421L157.898 409.821L158.579 410.501ZM155.202 416.382L155.708 415.876L158.897 415.819C159.241 415.81 159.533 415.793 159.774 415.769C160.018 415.745 160.228 415.7 160.402 415.634C160.577 415.567 160.732 415.466 160.868 415.331C161.022 415.177 161.118 415.008 161.157 414.825C161.198 414.639 161.186 414.454 161.121 414.269C161.058 414.082 160.948 413.91 160.791 413.753C160.625 413.588 160.447 413.477 160.255 413.421C160.064 413.365 159.874 413.366 159.684 413.423C159.494 413.481 159.316 413.592 159.15 413.758L158.484 413.091C158.765 412.81 159.077 412.628 159.417 412.547C159.758 412.465 160.099 412.48 160.441 412.59C160.784 412.698 161.1 412.896 161.388 413.184C161.678 413.475 161.877 413.789 161.982 414.126C162.091 414.464 162.108 414.795 162.034 415.118C161.962 415.441 161.801 415.726 161.553 415.975C161.381 416.147 161.181 416.282 160.952 416.382C160.724 416.483 160.43 416.555 160.07 416.599C159.712 416.641 159.248 416.664 158.68 416.669L156.798 416.712L156.764 416.746L158.848 418.829L158.249 419.428L155.202 416.382Z" fill="#410C00"/>
              </g>
            );
          })}
          <rect x="57.7075" y="425.865" width="18.7365" height="11.2419" rx="3" transform="rotate(-180 57.7075 425.865)" fill="#9B8169"/>
          <rect x="89.5596" y="476.453" width="18.7365" height="11.2419" rx="3" transform="rotate(-90 89.5596 476.453)" fill="#9B8169"/>
          <path d="M1 1V481C1 489.284 7.71573 496 16 496H328C336.284 496 343 489.284 343 481V1" stroke="#F3ECE4" strokeWidth="2"/>
          <path d="M66.28 440.058L75.7422 440.058L75.7422 449.52" stroke="#9B8169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          
          <path d="M61.5489 444.789L71.0111 444.789L71.0111 454.251" stroke="#9B8169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="102.76" y="416.438" width="11.2419" height="73.4469" rx="3" transform="rotate(-45 102.76 416.438)" fill="#9B8169"/>
          <rect x="113.396" y="405.866" width="11.2419" height="68.7638" rx="3" transform="rotate(-45 113.396 405.866)" fill="#F3ECE4"/>
          <rect x="159.821" y="453.969" width="11.2419" height="120.85" rx="3" transform="rotate(-90 159.821 453.969)" fill="#F3ECE4"/>
          <rect x="269.43" y="315.32" width="11.2419" height="138.65" rx="3" fill="#F3ECE4"/>
        </svg>
        {showTableModal && <TableModal onClose={() => setShowTableModal(false)} tableId={selectedTableId} selectedDate={selectedDate} onSelectTime={handleSelectTime} />}
        {showBookingDetailsModal && selectedTableData && (
          <BookingDetailsModal
            onClose={handleCloseBookingDetailsModal}
            tableInfo={selectedTableData.tableInfo}
            tableSlots={selectedTableData.tableSlots}
          />
        )}
      </div>
    </div>
  );
}

// Helper component for floating label input (similar to profile/about)
function FloatingLabelInput({ label, value, onChange, style = {}, inputStyle = {}, ...props }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        value={value}
        onChange={onChange}
        placeholder=" " // Important for the :placeholder-shown trick
        style={{
          width: '100%',
          height: '100%',
          padding: '10px 15px',
          backgroundColor: 'transparent',
          borderRadius: 10,
          border: '1px solid #DDCAB6',
          fontSize: 16,
          fontFamily: 'SF Pro Text, sans-serif',
          color: '#410C00',
          outline: 'none',
          boxSizing: 'border-box',
          // Floating label styles (using placeholder-shown pseudo-class)
          '&:focus + label, &:not(:placeholder-shown) + label': {
            top: '5px',
            fontSize: 10,
            color: '#9B8169', // Adjust label color if needed
          },
          ...inputStyle
        }}
        {...props}
      />
      <label
        style={{
          position: 'absolute',
          left: '15px',
          top: '1%',
          transform: 'translateY(-50%)',
          color: '#9B8169', // Default label color
          fontSize: 12,
          fontFamily: 'SF Pro Text, sans-serif',
          pointerEvents: 'none',
          transition: '0.2s ease all',
          backgroundColor: '#FFFBF7',
        }}
      >
        {label}
      </label>
    </div>
  );
}

// Helper component for floating label textarea (for Wishes)
function FloatingLabelTextarea({ label, value, onChange, style = {}, textareaStyle = {}, ...props }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder=" " // Important for the :placeholder-shown trick
        style={{
          width: '100%',
          height: '100%',
          padding: '10px 15px',
          backgroundColor: 'transparent',
          borderRadius: 10,
          border: '1px solid #DDCAB6',
          fontSize: 16,
          fontFamily: 'SF Pro Text, sans-serif',
          color: '#410C00',
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'none', // Prevent resizing
          // Floating label styles
           '&:focus + label, &:not(:placeholder-shown) + label': {
            top: '5px',
            fontSize: 10,
            color: '#9B8169', // Adjust label color if needed
          },
          ...textareaStyle
        }}
        {...props}
      />
       <label
        style={{
          position: 'absolute',
          top: '-9%',
          left: '15px',
          color: '#9B8169', // Default label color
          fontSize: 12,
          fontFamily: 'SF Pro Text, sans-serif',
          pointerEvents: 'none',
          transition: '0.2s ease all',
          backgroundColor: '#FFFBF7'
        }}
      >
        {label}
      </label>
    </div>
  );
}

function BookingDetailsModal({ onClose, tableInfo, tableSlots }) {
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchY, setTouchY] = useState(0);
  const sheetRef = React.useRef(null);

  const { userData, isLoading: isUserDataLoading, error: userDataError } = useUserData();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState('');
  const [phone, setPhone] = useState('');
  const [wishes, setWishes] = useState('');
  const [formErrors, setFormErrors] = useState({});


  React.useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Autocomplete name and phone from userData when it loads
  useEffect(() => {
    if (userData) {
      if (userData.first_name || userData.last_name) {
        setName(`${userData.first_name || ''} ${userData.last_name || ''}`.trim());
      }
      if (userData.phone_number) {
        setPhone(userData.phone_number);
      }
    }
  }, [userData]);


  const handleClose = () => {
    setIsVisible(false);
    setTouchY(0);
    setTimeout(onClose, 300);
  };

  const handleTouchStart = (e) => {
    const y = e.touches[0].clientY;
    setTouchStart(y);
    setTouchY(0);
  };

  const handleTouchMove = (e) => {
    if (!touchStart) return;
    const y = e.touches[0].clientY;
    const diff = y - touchStart;
    if (diff > 0) {
      setTouchY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    if (touchY > 100) handleClose();
    else setTouchY(0);
    setTouchStart(null);
  };

  const handleBookTime = async () => { // Made async to await post request
      const errors = {};
      if (!name.trim()) {
          errors.name = 'Имя обязательно';
      }
      if (!phone.trim()) {
          errors.phone = 'Телефон обязателен';
      }
      // Check if guests is a positive number
      const guestsNum = parseInt(guests, 10);
      if (!guests || isNaN(guestsNum) || guestsNum <= 0) {
          errors.guests = 'Количество гостей обязательно и должно быть больше 0';
      }
      if (!selectedSlot) {
          errors.selectedSlot = 'Выберите время';
      }

      if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          // Optionally highlight fields or show a general error message
          console.error('Form validation errors:', errors);
          return;
      }

      setFormErrors({}); // Clear previous errors

      // Format reservation_time
      // Using hardcoded date 2025-05-24 for now as per instructions
      // In a real app, this would come from the date selector
      const reservationDate = '2025-05-24';
      const reservationTimeISO = `${reservationDate}T${selectedSlot.start}:00Z`; // Assuming slot.start is like "HH:mm"

      const bookingPayload = {
          restaurant_id: 1, // Assuming restaurant_id is 1
          table_id: tableInfo?.id,
          reservation_time: reservationTimeISO,
          duration: 120, // as per instructions
          guest_count: guestsNum,
          contact_name: name.trim(), // Add contact_name from name state
          contact_phone: phone.trim(), // Add contact_phone from phone state
          special_requests: wishes.trim() || null, // Use null if wishes is empty
          is_recurring: false, // Assuming not recurring for now
          recurring_pattern: null // Assuming no recurring pattern
      };

      try {
          // TODO: Implement actual booking API call here
          console.log('Attempting to book with payload:', bookingPayload);
          const response = await post(
              '/reservations',
              getInitData(),
              bookingPayload
              // Add headers if necessary, e.g., Authorization
          );
          console.log('Booking successful:', response);
          // Assuming booking API call is successful, close modal
          handleClose();

          // Clear cached table availability data for all time slots for the current date
          timeSlots.forEach(slot => {
            const { start, end } = getSlotTimes(slot);
            const key = `/reservations/tables/slot-availability?restaurant_id=1&date=${selectedDate}&slot_start=${start}&slot_end=${end}`;
            delete cache[key];
          });

          // Clear cache for the specific table's slots
          const tableSlotsKey = `/reservations/tables/${tableInfo.id}/slots?date=${selectedDate}`;
          delete cache[tableSlotsKey];

          // Also clear cache for slots of all tables currently in tablesAvailability
          // This ensures when any table modal is opened, it fetches fresh slot data
          tablesAvailability.forEach(table => {
              const key = `/reservations/tables/${table.id}/slots?date=${selectedDate}`;
              delete cache[key];
          });

          // Fetch fresh data for the currently active slot (for the main SVG view)
          fetchTablesAvailability(timeSlots[activeSlot], true);

      } catch (error) {
          console.error('Booking failed:', error);
          // TODO: Handle booking error (show message to user)
      }
  };


  return (
    <>
      {/* Overlay for Booking Details Modal */}
      <div onClick={handleClose} style={{
        position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 1001, // Higher z-index
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s'
      }} />
      {/* Booking Details Modal Content */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1002, // Higher z-index
          background: '#FFFBF7',
          borderTopLeftRadius: 15, borderTopRightRadius: 15,
          boxShadow: '0 -4px 24px #0002',
          height: 630,
          transform: isVisible ? `translateY(${touchY}px)` : 'translateY(100%)',
          transition: touchStart ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '36px 25px 25px 25px', // Consistent horizontal padding (25px) and top padding for title (36px)
          display: 'flex', flexDirection: 'column',
          willChange: 'transform', touchAction: 'none',
          overflowY: 'auto' // Add overflow for longer content if needed
        }}
      >
         {/* Title (positioned relative to the padded container) */}
        <h2 style={{
            fontFamily: 'Tiffany, serif',
            color: '#410C00',
            fontSize: 31,
            margin: '0 0 0 0', // Adjust margin left to compensate padding for visual alignment
            // position: 'absolute', // Removed absolute positioning
            // top: 36, // Removed absolute positioning
            // left: 25 // Removed absolute positioning
        }}>
            Бронирование
        </h2>

        {/* Choose Time Label */}
        <p style={{
            fontFamily: 'SF Pro Text, sans-serif',
            color: '#9B8169',
            fontSize: 14,
            marginTop: '25px', // 25px below title area
            marginBottom: '12px', // 12px above slots
            padding: 0,
            // position: 'relative', // Removed relative positioning
        }}>
            Выберите время:
        </p>

        {/* Time Slots */}
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8, // Adjust gap between slots
            margin: '0 0 25px 0', // 25px below slots
            justifyContent: 'flex-start' // Align items to the start
        }}>
            {tableSlots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                const isAvailable = slot.is_available;

                let borderColor = '#DDCAB6'; // Occupied
                let textColor = '#DDCAB6';   // Occupied

                if (isAvailable) {
                    borderColor = '#9B8169'; // Available
                    textColor = '#9B8169';   // Available
                }

                if (isSelected) {
                    borderColor = '#410C00'; // Selected
                    textColor = '#410C00';   // Selected
                }

                return (
                    <button
                        key={index}
                        onClick={() => {
                          if (!isAvailable) return; // Only allow clicking on available slots
                          if (isSelected) {
                            setSelectedSlot(null); // Deselect if already selected
                          } else {
                            setSelectedSlot(slot); // Select if not selected
                          }
                        }}
                        style={{
                            width: 105,
                            height: 29,
                            borderRadius: 7,
                            border: `1px solid ${borderColor}`,
                            background: 'none',
                            color: textColor,
                            fontSize: 13,
                            fontFamily: 'SF Pro Text, sans-serif',
                            cursor: isAvailable ? 'pointer' : 'default',
                            opacity: isAvailable ? 1 : 0.5, // Dim unavailable slots
                            padding: 0,
                            flexShrink: 0 // Prevent shrinking
                        }}
                        disabled={!isAvailable}
                    >
                        {`${slot.start} – ${slot.end}`}
                    </button>
                );
            })}
        </div>

        {/* Divider */}
        <div style={{
            height: 1,
            background: '#E8DFD5',
            margin: '0 0 25px 0', // 25px below divider
        }} />

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: '25px' }}> {/* 25px below inputs */}
            <div style={{ display: 'flex', gap: 12 }}> {/* Gap between Name and Guests */}
                <FloatingLabelInput
                    label="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 1, height: 44}} // Use flex: 1 to distribute width
                />
                 <FloatingLabelInput
                    label="Гостей"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    style={{ width: 134, height: 44 }}
                    type="number" // Assuming guests is a number
                />
            </div>
             <FloatingLabelInput
                label="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', height: 44 }} // Use 100% width
                 type="tel" // Assuming phone is a phone number
            />
             <FloatingLabelTextarea
                label="Пожелания"
                value={wishes}
                onChange={(e) => setWishes(e.target.value)}
                style={{ width: '100%', height: 77 }} // Use 100% width
            />
        </div>
         {Object.keys(formErrors).length > 0 && (
             <div style={{ color: '#B00020', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                 Пожалуйста, заполните все обязательные поля. {formErrors.name} {formErrors.phone} {formErrors.guests}
             </div>
         )}

        {/* Book Button */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}>
            <button
                onClick={handleBookTime}
                style={{
                    width: 340,
                    height: 46,
                    background: '#410C00',
                    color: '#FFFBF7',
                    border: 'none',
                    borderRadius: 15,
                    fontSize: 19,
                    cursor: 'pointer',
                    fontFamily: 'SF Pro Text, sans-serif',
                     fontWeight: 500
                }}
            >
                Забронировать
            </button>
        </div>


      </div>
    </>
  );
}

// New Calendar Modal Component
function CalendarModal({ selectedDate, onSelectDate, onClose }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate));
  const calendarRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handlePreviousMonth = () => {
    const currentMonthStart = dayjs().startOf('month');
    const newMonth = currentMonth.subtract(1, 'month');
    if (newMonth.isBefore(currentMonthStart, 'month')) {
      return;
    }
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const daysInMonth = currentMonth.daysInMonth();
  const startOfMonth = dayjs(currentMonth).startOf('month');
  const firstDayOfWeek = startOfMonth.day(); // 0 for Sunday, 1 for Monday
  const daysBeforeMonth = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1); // Adjust for Monday start

  const days = [];
  // Add placeholder days before the start of the month
  for (let i = 0; i < daysBeforeMonth; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(startOfMonth).date(i));
  }

  return (
    <div 
      ref={calendarRef}
      style={{
        position: 'fixed',
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 342,
        height: 257,
        background: '#F3ECE4',
        borderRadius: 15,
        zIndex: 9999,
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Month Navigation */}
      <div style={{
        width: 274.6,
        height: 24,
        background: '#FFFBF7',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
        padding: '0 10px'
      }}>
        <button 
          onClick={handlePreviousMonth} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#410C00', 
            fontSize: 16,
            padding: '4px 8px',
            opacity: currentMonth.isSame(dayjs().startOf('month'), 'month') ? 0.5 : 1
          }}
        >
          &lt;
        </button>
        <span style={{
          fontFamily: 'SF Pro Text, sans-serif',
          fontSize: 11,
          color: '#410C00',
          textTransform: 'capitalize'
        }}>
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button 
          onClick={handleNextMonth} 
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: '#410C00', 
            fontSize: 16,
            padding: '4px 8px'
          }}
        >
          &gt;
        </button>
      </div>

      {/* Day Names */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: '8px'
      }}>
        {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((dayName, index) => (
          <span 
            key={dayName} 
            style={{
              fontFamily: 'SF Pro Text, sans-serif',
              fontSize: 11,
              color: index >= 5 ? '#FF2C2C' : '#410C00',
              width: 24,
              textAlign: 'center'
            }}
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '5px',
        width: '100%',
        textAlign: 'center'
      }}>
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              fontSize: 11,
              cursor: day ? 'pointer' : 'default',
              padding: '4px',
              borderRadius: 4,
              background: day && day.isSame(selectedDate, 'day') ? '#410C00' : 'none',
              color: day && day.isSame(selectedDate, 'day') 
                ? '#FFFBF7' 
                : (day && (day.day() === 0 || day.day() === 6) ? '#FF2C2C' : '#410C00'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              margin: '0 auto',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (day) {
                e.currentTarget.style.background = '#410C00';
                e.currentTarget.style.color = '#FFFBF7';
              }
            }}
            onMouseLeave={(e) => {
              if (day) {
                e.currentTarget.style.background = day.isSame(selectedDate, 'day') ? '#410C00' : 'none';
                e.currentTarget.style.color = day.isSame(selectedDate, 'day') 
                  ? '#FFFBF7' 
                  : (day.day() === 0 || day.day() === 6 ? '#FF2C2C' : '#410C00');
              }
            }}
            onClick={() => {
              if (day) {
                onSelectDate(day.format('YYYY-MM-DD'));
                onClose();
              }
            }}
          >
            {day ? day.date() : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Booking; 