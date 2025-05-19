import { useState } from 'react';
import NavigationBar from './components/NavigationBar';
import Home from './components/Home';
import Menu from './components/Menu';
import Booking from './components/Booking';
import Profile from './components/Profile';

const TABS = {
  HOME: 'home',
  MENU: 'menu',
  BOOKING: 'booking',
  PROFILE: 'profile',
};

function App() {
  const [tab, setTab] = useState(TABS.HOME);

  let content;
  switch (tab) {
    case TABS.HOME:
      content = <Home />;
      break;
    case TABS.MENU:
      content = <Menu />;
      break;
    case TABS.BOOKING:
      content = <Booking />;
      break;
    case TABS.PROFILE:
      content = <Profile />;
      break;
    default:
      content = <Home />;
  }

  return (
    <div style={{ paddingBottom: 64 }}>
      {content}
      <NavigationBar currentTab={tab} onTabChange={setTab} />
    </div>
  );
}

export default App;
