import React, { createContext, useContext, useState, useEffect } from 'react';
import { get } from '../fetch/get';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  const [dishes, setDishes] = useState([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [dishesError, setDishesError] = useState(false);

  const [achievement, setAchievement] = useState(null);
  const [achievementLoading, setAchievementLoading] = useState(true);
  const [achievementError, setAchievementError] = useState(false);

  const [noveltyItems, setNoveltyItems] = useState([]);
  const [noveltyLoading, setNoveltyLoading] = useState(true);
  const [noveltyError, setNoveltyError] = useState(false);

  // --- Корзина ---
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cartItems');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Добавить товар в корзину
  const addToCart = (dish) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, count: item.count + (dish.quantity || 1) } : item);
      } else {
        return [...prev, { ...dish, count: dish.quantity || 1 }];
      }
    });
  };

  // Изменить количество товара
  const changeCartItemCount = (id, delta) => {
    setCartItems(prev => prev
      .map(item => item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item)
      .filter(item => item.count > 0)
    );
  };

  // Удалить товар из корзины
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Очистить корзину
  const clearCart = () => setCartItems([]);

  // Сохранять корзину в localStorage при изменении
  React.useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const RESTAURANT_ID = 1;

  // Загрузка категорий
  useEffect(() => {
    if (categories.length === 0) {
      setCategoriesLoading(true);
      get('/menu/categories', '', { restaurant_id: RESTAURANT_ID })
        .then(data => {
          setCategories(Array.isArray(data) ? data : []);
          setCategoriesLoading(false);
        })
        .catch(() => {
          setCategoriesError(true);
          setCategoriesLoading(false);
        });
    }
  }, []);

  // Загрузка всех блюд
  useEffect(() => {
    if (dishes.length === 0) {
      setDishesLoading(true);
      get('/menu/items', '', { restaurant_id: RESTAURANT_ID })
        .then(data => {
          setDishes(Array.isArray(data) ? data : []);
          setDishesLoading(false);
        })
        .catch(() => {
          setDishesError(true);
          setDishesLoading(false);
        });
    }
  }, []);

  // Загрузка достижений
  useEffect(() => {
    if (!achievement) {
      setAchievementLoading(true);
      get('/achievements', '')
        .then(data => {
          setAchievement(Array.isArray(data) && data.length > 0 ? data[0] : null);
          setAchievementLoading(false);
        })
        .catch(() => {
          setAchievementError(true);
          setAchievementLoading(false);
        });
    }
  }, []);

  // Загрузка новинок
  useEffect(() => {
    if (categories.length > 0 && noveltyItems.length === 0) {
      const lastCategory = categories[categories.length - 1];
      if (lastCategory?.id) {
        setNoveltyLoading(true);
        get('/menu/items', '', { restaurant_id: RESTAURANT_ID, category_id: lastCategory.id })
          .then(data => {
            setNoveltyItems(Array.isArray(data) ? data : []);
            setNoveltyLoading(false);
          })
          .catch(() => {
            setNoveltyError(true);
            setNoveltyLoading(false);
          });
      }
    }
  }, [categories]);

  const value = {
    categories,
    categoriesLoading,
    categoriesError,
    dishes,
    dishesLoading,
    dishesError,
    achievement,
    achievementLoading,
    achievementError,
    noveltyItems,
    noveltyLoading,
    noveltyError,
    refreshCategories: () => {
      // Implementation of refreshCategories
    },
    refreshDishes: () => {
      // Implementation of refreshDishes
    },
    refreshAchievement: () => {
      // Implementation of refreshAchievement
    },
    refreshNoveltyItems: () => {
      // Implementation of refreshNoveltyItems
    },
    refreshAll: () => {
      // Implementation of refreshAll
    },
    // Корзина
    cartItems,
    addToCart,
    changeCartItemCount,
    removeFromCart,
    clearCart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 