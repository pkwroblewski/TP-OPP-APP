'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut, Settings, User, Search, Bell, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side: Menu button (mobile) + Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#1e3a5f] hover:bg-gray-100 rounded-lg"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#1e3a5f]">{title}</h1>
          </div>
        </div>

        {/* Center: Search button */}
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 text-gray-500 w-72 justify-start
                     border-gray-200 hover:border-[#1e3a5f]/30 hover:bg-gray-50
                     rounded-lg transition-all duration-200"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Search companies...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Right side: Notifications + User menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-[#1e3a5f] hover:bg-gray-100 rounded-lg relative"
          >
            <Bell className="h-5 w-5" />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4a853] rounded-full" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 h-auto"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2a4a7f] flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-medium">
                    {userEmail ? getInitials(userEmail) : <User className="h-4 w-4" />}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">
                    {userEmail ? userEmail.split('@')[0] : 'User'}
                  </span>
                  <span className="text-xs text-gray-400">Admin</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <div className="px-2 py-1.5 mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {userEmail ? userEmail.split('@')[0] : 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userEmail || 'user@example.com'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer rounded-lg"
              >
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Command Palette */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
