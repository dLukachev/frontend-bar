import { useState, useEffect } from 'react';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Menu from './components/Menu';
import Booking from './components/Booking';
import Profile from './components/Profile';
import Cart from './components/Cart';
import { AppProvider } from './context/AppContext';

const TABS = {
  HOME: 'home',
  MENU: 'menu',
  BOOKING: 'booking',
  PROFILE: 'profile',
  CART: 'cart',
};

function App() {
  const [tab, setTab] = useState(TABS.HOME);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

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
      content = <Profile />;
      break;
    case TABS.CART:
      content = <Cart />;
      break;
    default:
      content = <Home />;
  }

  return (
    <AppProvider>
      <div style={{ paddingBottom: 64 }}>
        {content}
        <NavigationBar currentTab={tab} onTabChange={setTab} />
      </div>
    </AppProvider>
  );
}

export default App;
