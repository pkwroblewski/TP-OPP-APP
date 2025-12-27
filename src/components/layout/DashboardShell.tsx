'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KeyboardShortcutsDialog, useKeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

interface DashboardShellProps {
  title: string;
  userEmail?: string;
  children: React.ReactNode;
}

export function DashboardShell({ title, userEmail, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { open: shortcutsOpen, setOpen: setShortcutsOpen } = useKeyboardShortcutsDialog();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area - matches sidebar width of w-56 (224px) */}
      <div className="lg:pl-56 min-h-screen flex flex-col">
        <Header
          title={title}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Keyboard shortcuts dialog */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
