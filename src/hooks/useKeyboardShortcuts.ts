import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
  category?: 'global' | 'navigation' | 'actions' | 'tool';
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  ignoreInputs?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, ignoreInputs = true } = options;
  const shortcutsRef = useRef(shortcuts);
  
  // Keep shortcuts ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Skip if user is typing in an input/textarea/contenteditable
    if (ignoreInputs) {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isEditable = target.isContentEditable;
      
      if (tagName === 'input' || tagName === 'textarea' || isEditable) {
        // Allow specific shortcuts even in inputs (like Ctrl+S)
        const allowedInInputs = ['s', 'k'];
        const hasModifier = event.ctrlKey || event.metaKey;
        if (!hasModifier || !allowedInInputs.includes(event.key.toLowerCase())) {
          return;
        }
      }
    }

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      const modifiers = shortcut.modifiers || [];
      const requiresCtrl = modifiers.includes('ctrl');
      const requiresShift = modifiers.includes('shift');
      const requiresAlt = modifiers.includes('alt');
      const requiresMeta = modifiers.includes('meta');

      // Check key match (case insensitive)
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      // Check modifier matches (ctrl or meta for cross-platform)
      const ctrlMatch = requiresCtrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
      const shiftMatch = requiresShift ? event.shiftKey : !event.shiftKey;
      const altMatch = requiresAlt ? event.altKey : !event.altKey;
      const metaMatch = requiresMeta ? event.metaKey : true; // Meta is optional when ctrl is required

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [enabled, ignoreInputs]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.filter(s => s.enabled !== false),
    formatShortcut: (shortcut: ShortcutConfig) => {
      const parts: string[] = [];
      const modifiers = shortcut.modifiers || [];
      
      if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
        parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
      }
      if (modifiers.includes('shift')) {
        parts.push(navigator.platform.includes('Mac') ? '⇧' : 'Shift');
      }
      if (modifiers.includes('alt')) {
        parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
      }
      
      parts.push(shortcut.key.toUpperCase());
      return parts.join(navigator.platform.includes('Mac') ? '' : '+');
    },
  };
}

// Global shortcuts that should be available everywhere
export const GLOBAL_SHORTCUTS: Omit<ShortcutConfig, 'action'>[] = [
  { key: 'k', modifiers: ['ctrl'], description: 'Open command palette', category: 'global' },
  { key: 's', modifiers: ['ctrl'], description: 'Save current work', category: 'actions' },
  { key: 's', modifiers: ['ctrl', 'shift'], description: 'Save as template', category: 'actions' },
  { key: 'e', modifiers: ['ctrl'], description: 'Export to PDF', category: 'actions' },
  { key: 'z', modifiers: ['ctrl'], description: 'Undo / Rollback', category: 'actions' },
  { key: '/', description: 'Show keyboard shortcuts', category: 'global' },
  { key: 'n', description: 'Next workflow step', category: 'navigation' },
  { key: 'p', description: 'Previous workflow step', category: 'navigation' },
  { key: 'Escape', description: 'Close dialogs / Exit mode', category: 'global' },
];
