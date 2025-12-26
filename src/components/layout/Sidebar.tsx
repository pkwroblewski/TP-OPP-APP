'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Building2,
  Loader,
  BarChart3,
  Settings,
  X,
  Target,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/opportunities', label: 'Opportunities', icon: Target },
  { href: '/processing', label: 'Processing', icon: Loader },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-[#1e3a5f] text-white',
          'transition-transform duration-300 ease-in-out lg:translate-x-0',
          'flex flex-col shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / App Name */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#d4a853] to-[#c49843] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-[#1e3a5f] font-bold text-lg">TP</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-wide">TP Opportunity</h1>
              <p className="text-xs text-white/50">Finder</p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10 rounded-lg"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto tp-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'border-l-4',
                  isActive
                    ? 'bg-white/10 border-[#d4a853] text-white font-medium'
                    : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/20'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive ? 'text-[#d4a853]' : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-[#d4a853]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/60 text-center">
              Transfer Pricing Analysis Tool
            </p>
            <p className="text-[10px] text-white/40 text-center mt-1">
              v1.0 • Luxembourg
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
