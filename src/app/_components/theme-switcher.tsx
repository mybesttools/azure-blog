"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import styles from "./switch.module.css";

export const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={styles.switch} />;
  }

  const cycleTheme = () => {
    const themes = ['light', 'system', 'dark'];
    const currentIndex = themes.indexOf(theme || 'system');
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      className={styles.switch}
      onClick={cycleTheme}
      aria-label="Toggle theme"
      title={`Current: ${theme}`}
    />
  );
};
