import { useState, useEffect } from 'react';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Menu from './components/Menu';
import Booking from './components/Booking';
import Profile from './components/Profile';
import Cart from './components/Cart';
import Order from './components/Order';
import { AppProvider } from './context/AppContext';
import CustomHeader from './components/CustomHeader';

const TABS = {
  HOME: 'home',
  MENU: 'menu',
  BOOKING: 'booking',
  PROFILE: 'profile',
  CART: 'cart',
  ORDER: 'order',
};

function App() {
  const [tab, setTab] = useState(TABS.HOME);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  useEffect(() => {
    if (window.Telegram?.WebApp?.disableHeader) {
      window.Telegram.WebApp.disableHeader();
    }
    if (window.Telegram?.WebApp?.expand) {
      window.Telegram.WebApp.expand();
    }
    if (window.Telegram?.WebApp?.requestFullscreen) {
      window.Telegram.WebApp.requestFullscreen();
    }
    if (window.Telegram?.WebApp?.setHeaderColor) {
      window.Telegram.WebApp.setHeaderColor('#ffffff');
    }
  }, []);

  let content;
  switch (tab) {
    case TABS.HOME:
      content = <Home />;
      break;
    case TABS.MENU:
      content = <Menu setTab={setTab} />;
      break;
    case TABS.BOOKING:
      content = <Booking />;
      break;
    case TABS.PROFILE:
      content = <Profile currentTab={tab} />;
      break;
    case TABS.CART:
      content = <Cart setTab={setTab} />;
      break;
    case TABS.ORDER:
      content = <Order setTab={setTab} />;
      break;
    default:
      content = <Home />;
  }

  return (
    <AppProvider>
      <CustomHeader onClose={() => window.Telegram?.WebApp?.close()} />
      <div style={{ paddingBottom: 64 }}>
        {content}
        <NavigationBar currentTab={tab} onTabChange={setTab} />
      </div>
    </AppProvider>
  );
}

export default App;
