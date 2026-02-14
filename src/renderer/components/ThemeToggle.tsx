import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
      className="h-7 px-2 text-sm border border-gray-300 rounded bg-white"
      title="Theme"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  )
}
