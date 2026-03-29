import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GLOBAL_SHORTCUTS, type ShortcutConfig } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolShortcuts?: ShortcutConfig[];
}

export function ShortcutsHelpDialog({
  open,
  onOpenChange,
  toolShortcuts = [],
}: ShortcutsHelpDialogProps) {
  const isMac = navigator.platform.includes('Mac');

  const formatShortcut = (shortcut: Omit<ShortcutConfig, 'action'>) => {
    const parts: string[] = [];
    const modifiers = shortcut.modifiers || [];
    
    if (modifiers.includes('ctrl') || modifiers.includes('meta')) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (modifiers.includes('shift')) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (modifiers.includes('alt')) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    
    // Format special keys
    let keyDisplay = shortcut.key;
    if (keyDisplay === 'Escape') keyDisplay = 'Esc';
    if (keyDisplay === '/') keyDisplay = '/';
    
    parts.push(keyDisplay.toUpperCase());
    return parts.join(isMac ? '' : '+');
  };

  const globalShortcuts = GLOBAL_SHORTCUTS.filter(s => s.category === 'global');
  const actionShortcuts = GLOBAL_SHORTCUTS.filter(s => s.category === 'actions');
  const navigationShortcuts = GLOBAL_SHORTCUTS.filter(s => s.category === 'navigation');

  const ShortcutRow = ({ shortcut }: { shortcut: Omit<ShortcutConfig, 'action'> }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <Badge variant="outline" className="font-mono text-xs">
        {formatShortcut(shortcut)}
      </Badge>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Boost your productivity with these shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Global</h4>
            <div className="space-y-1">
              {globalShortcuts.map((shortcut, i) => (
                <ShortcutRow key={i} shortcut={shortcut} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Actions</h4>
            <div className="space-y-1">
              {actionShortcuts.map((shortcut, i) => (
                <ShortcutRow key={i} shortcut={shortcut} />
              ))}
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Navigation</h4>
            <div className="space-y-1">
              {navigationShortcuts.map((shortcut, i) => (
                <ShortcutRow key={i} shortcut={shortcut} />
              ))}
            </div>
          </div>

          {/* Tool-specific shortcuts */}
          {toolShortcuts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Current Tool</h4>
                <div className="space-y-1">
                  {toolShortcuts.map((shortcut, i) => (
                    <ShortcutRow key={i} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <Badge variant="outline" className="font-mono text-xs mx-1">/</Badge> 
            to open this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
