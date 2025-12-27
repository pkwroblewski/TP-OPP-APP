'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, Settings, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchCommand, useSearchCommand } from '@/components/search-command';

interface HeaderProps {
  title: string;
  userEmail?: string;
  onMenuClick: () => void;
}

export function Header({ title, userEmail, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { open: searchOpen, setOpen: setSearchOpen } = useSearchCommand();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Get initials from email
  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side: Menu button (mobile) + Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600 hover:bg-slate-100 h-8 w-8"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-medium text-slate-900">{title}</h1>
        </div>

        {/* Center: Search - minimal */}
        <Button
          variant="ghost"
          className="hidden md:flex items-center gap-2 text-slate-500 h-8 px-3
                     hover:bg-slate-100 rounded-md"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search</span>
          <kbd className="ml-2 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            /
          </kbd>
        </Button>

        {/* Right side: User menu - minimal */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-slate-100 h-8 px-2"
            >
              <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
                <span className="text-white text-[10px] font-medium">
                  {userEmail ? getInitials(userEmail) : 'U'}
                </span>
              </div>
              <span className="hidden sm:inline text-sm text-slate-600">
                {userEmail ? userEmail.split('@')[0] : 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-xs text-slate-500 truncate">
                {userEmail || 'user@example.com'}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="cursor-pointer text-sm"
            >
              <Settings className="mr-2 h-3.5 w-3.5 text-slate-500" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
