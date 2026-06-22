import React from 'react';
import { LayoutDashboard, CheckSquare, Sparkles, ShieldAlert, TrendingUp, Clock, Hourglass } from 'lucide-react';
// @ts-ignore
import logoImg from '../assets/images/deadline_guardian_logo_1782140610858.jpg';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  taskCount: number;
  rescueCount: number;
}

export default function Sidebar({ activeTab, setActiveTab, taskCount, rescueCount }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Task Vault', icon: CheckSquare, badge: taskCount > 0 ? taskCount : undefined },
    { id: 'planner', label: 'AI Planner', icon: Sparkles },
    { id: 'rescue', label: 'Rescue Center', icon: ShieldAlert, badge: rescueCount > 0 ? rescueCount : undefined, badgeStyle: 'bg-rose-500 text-white animate-pulse shadow-sm' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const getActiveStyles = () => {
    return 'bg-violet-650/20 text-violet-300 font-bold border-l-4 border-violet-500 rounded-r-lg pl-3';
  };

  const getIconActiveColor = () => {
    return 'text-violet-400';
  };

  return (
    <aside className="w-64 theme-header border-r h-screen sticky top-0 flex flex-col justify-between hidden md:flex shrink-0 font-sans select-none" id="desktop-sidebar">
      <div>
        {/* Logo and Brand from Professional Polish template */}
        <div className="p-6 border-b border-[var(--border-main)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-xs flex-shrink-0 bg-[var(--bg-card)] p-0.5 border border-[var(--border-main)]">
            <img 
              src={logoImg} 
              alt="Deadline Guardian Logo" 
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight theme-text-title leading-tight">Deadline Guardian</span>
            <span className="text-[10px] text-[var(--primary-color)] font-extrabold uppercase tracking-widest leading-none">Plan-Complete</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs tracking-wide transition-all duration-150 ${
                  isActive
                    ? getActiveStyles()
                    : 'text-[var(--text-sub)] hover:bg-[var(--bg-alt)] hover:text-[var(--text-main)] font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-colors ${isActive ? getIconActiveColor() : 'text-[var(--text-sub)] opacity-70'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${item.badgeStyle || 'theme-badge-alt bg-[var(--badge-bg)] text-[var(--badge-text)] border border-[var(--border-main)]'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding matching Professional Polish precisely */}
      <div className="p-4 theme-alt-bg border-t border-[var(--border-sub)]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-black theme-text-main tracking-wider uppercase">GEMINI</span>
        </div>
        <p className="text-[10px] text-[var(--text-sub)] font-medium leading-relaxed opacity-80">
          Reasoning and calibrating live models over deadlines.
        </p>
      </div>
    </aside>
  );
}
