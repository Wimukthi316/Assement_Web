import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
        darkMode
          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'
      } ${className}`}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
