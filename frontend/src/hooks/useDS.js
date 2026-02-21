/**
 * useDS — Design System hook
 * Returns theme-aware tokens so pages never re-derive
 * pageBg/cardBg/inputCls manually.
 */
import { useTheme } from '../context/ThemeContext';

export const useDS = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    theme,

    // ── Page / layout ──────────────────────────────
    pageBg:    isDark ? 'bg-[#313b48]'                      : 'bg-[#d6d0d4]',
    headerBg:  isDark ? 'bg-gray-800 border-gray-700'       : 'bg-[#e8e3e8] border-gray-200',
    sidebarBg: '#1a1a1a',

    // ── Cards ──────────────────────────────────────
    cardBg:    isDark ? 'bg-gray-800 border-gray-700'       : 'bg-white border-gray-200',
    cardRaised:isDark ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-gray-200 shadow-md',
    cardFlat:  isDark ? 'bg-gray-900/50 border-gray-700'   : 'bg-gray-50 border-gray-200',

    // ── Text ───────────────────────────────────────
    text:      isDark ? 'text-white'    : 'text-gray-900',
    muted:     isDark ? 'text-gray-400' : 'text-gray-500',
    subtle:    isDark ? 'text-gray-500' : 'text-gray-400',

    // ── Inputs ─────────────────────────────────────
    inputCls:  isDark
      ? 'bg-transparent border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500',
    inputDarkFilled: isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400'
      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-yellow-500',

    // ── Dropdowns / overlays ───────────────────────
    dropBg:    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800',
    overlayBg: 'bg-black/60',

    // ── Dividers ───────────────────────────────────
    divider:   isDark ? 'border-gray-700' : 'border-gray-200',

    // ── Icon helpers ────────────────────────────────
    iconColor: isDark ? 'text-gray-400' : 'text-gray-500',
  };
};
