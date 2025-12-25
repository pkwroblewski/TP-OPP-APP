import { useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(customShortcuts?: KeyboardShortcut[]) {
  const router = useRouter();

  // Memoize shortcuts to avoid recreation on every render
  const shortcuts = useMemo(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        key: 'h',
        meta: true,
        action: () => router.push('/'),
        description: 'Go to Dashboard',
      },
      {
        key: 'u',
        meta: true,
        action: () => router.push('/upload'),
        description: 'Go to Upload',
      },
      {
        key: 'c',
        meta: true,
        shift: true,
        action: () => router.push('/companies'),
        description: 'Go to Companies',
      },
      {
        key: 'o',
        meta: true,
        shift: true,
        action: () => router.push('/opportunities'),
        description: 'Go to Opportunities',
      },
      {
        key: 'a',
        meta: true,
        shift: true,
        action: () => router.push('/analytics'),
        description: 'Go to Analytics',
      },
      {
        key: ',',
        meta: true,
        action: () => router.push('/settings'),
        description: 'Go to Settings',
      },
    ];

    return [...defaultShortcuts, ...(customShortcuts || [])];
  }, [router, customShortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta
          ? event.metaKey || event.ctrlKey
          : !event.metaKey && !event.ctrlKey;
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey
          : !shortcut.meta && !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          metaMatch &&
          (shortcut.meta || ctrlMatch) &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Get all available shortcuts for display
export function getShortcutsList(): Array<{ keys: string; description: string }> {
  return [
    { keys: '⌘ + K', description: 'Open search' },
    { keys: '⌘ + H', description: 'Go to Dashboard' },
    { keys: '⌘ + U', description: 'Go to Upload' },
    { keys: '⌘ + Shift + C', description: 'Go to Companies' },
    { keys: '⌘ + Shift + O', description: 'Go to Opportunities' },
    { keys: '⌘ + Shift + A', description: 'Go to Analytics' },
    { keys: '⌘ + ,', description: 'Go to Settings' },
    { keys: 'Esc', description: 'Close dialogs' },
  ];
}
