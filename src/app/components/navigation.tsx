import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Clock, Sparkles, Settings, Moon, Sun } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout?: () => void;
}

export function Navigation({ activeTab, onTabChange, theme, onThemeToggle, onLogout }: NavigationProps) {
  const tabs = [
    { id: 'log', label: 'Log', icon: BookOpen },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'wrapped', label: 'Wrapped', icon: Sparkles }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-medium">Food Wrapped</span>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-secondary rounded-lg"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onThemeToggle}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  Demo Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <div className="flex items-center justify-around px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onThemeToggle}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-muted-foreground"
            >
              {theme === 'light' ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
              <span className="text-xs">Theme</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-1 text-[11px] text-muted-foreground underline"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
