'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Upload,
  Target,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simplified navigation - only 4 main items per redesign spec
const navItems = [
  { href: '/companies', label: 'Companies', icon: Building2, description: 'View and analyze companies' },
  { href: '/upload', label: 'Upload', icon: Upload, description: 'Upload annual accounts' },
  { href: '/opportunities', label: 'Opportunities', icon: Target, description: 'High-priority targets' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Configure preferences' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Determine active item - companies page is default for root
  const getIsActive = (href: string) => {
    if (href === '/companies') {
      return pathname === '/' || pathname === '/companies' || pathname.startsWith('/companies/');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Clean, professional Big Four aesthetic */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-56 bg-slate-900 text-white',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo - Minimal */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-800">
          <Link href="/companies" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xs">TP</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">TP Finder</span>
          </Link>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation - Clean, minimal */}
        <nav className="flex-1 py-4 px-2">
          {navItems.map((item) => {
            const isActive = getIsActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-1',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-amber-500' : '')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Version info */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 text-center">
            Luxembourg TP Analysis
          </p>
        </div>
      </aside>
    </>
  );
}
