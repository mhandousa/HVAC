import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Calculator,
  Wind,
  Thermometer,
  Settings,
  FileText,
  Home,
  Building2,
  Wrench,
  Users,
  BarChart3,
  Save,
  Download,
  Undo2,
  Keyboard,
  Layout,
  Gauge,
  Fan,
  Droplets,
  Volume2,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  group: 'navigation' | 'actions' | 'recent' | 'tools';
  onSelect: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onShowShortcuts?: () => void;
}

export function CommandPalette({
  onSave,
  onExport,
  onUndo,
  onShowShortcuts,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMac = navigator.platform.includes('Mac');
  const modKey = isMac ? '⌘' : 'Ctrl+';

  const commands = useMemo<CommandItem[]>(() => [
    // Navigation
    { id: 'dashboard', label: 'Dashboard', icon: Home, group: 'navigation', onSelect: () => navigate('/dashboard'), keywords: ['home', 'main'] },
    { id: 'projects', label: 'Projects', icon: Building2, group: 'navigation', onSelect: () => navigate('/projects'), keywords: ['project', 'list'] },
    { id: 'design-tools', label: 'Design Tools', icon: Layout, group: 'navigation', onSelect: () => navigate('/design'), keywords: ['tools', 'hvac'] },
    { id: 'equipment', label: 'Equipment', icon: Wrench, group: 'navigation', onSelect: () => navigate('/equipment'), keywords: ['assets', 'inventory'] },
    { id: 'customers', label: 'Customers', icon: Users, group: 'navigation', onSelect: () => navigate('/customers'), keywords: ['clients'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, group: 'navigation', onSelect: () => navigate('/reports'), keywords: ['analytics'] },
    { id: 'settings', label: 'Settings', icon: Settings, group: 'navigation', onSelect: () => navigate('/settings'), keywords: ['preferences', 'config'] },
    
    // Design Tools
    { id: 'load-calc', label: 'Load Calculation', icon: Calculator, group: 'tools', onSelect: () => navigate('/design/load-calculation'), keywords: ['cooling', 'heating', 'btuh'] },
    { id: 'ventilation', label: 'Ventilation Calculator', icon: Wind, group: 'tools', onSelect: () => navigate('/design/ventilation'), keywords: ['ashrae', 'oa', 'outdoor air'] },
    { id: 'psychrometric', label: 'Psychrometric Analysis', icon: Thermometer, group: 'tools', onSelect: () => navigate('/design/psychrometric'), keywords: ['humidity', 'enthalpy'] },
    { id: 'ahu-config', label: 'AHU Configuration', icon: Fan, group: 'tools', onSelect: () => navigate('/design/ahu-configuration'), keywords: ['air handler'] },
    { id: 'duct-designer', label: 'Duct Designer', icon: Layout, group: 'tools', onSelect: () => navigate('/design/duct-designer'), keywords: ['ductwork', 'sizing'] },
    { id: 'pipe-sizing', label: 'Pipe Sizing', icon: Droplets, group: 'tools', onSelect: () => navigate('/design/pipe-sizing'), keywords: ['piping', 'water'] },
    { id: 'acoustic', label: 'Acoustic Calculations', icon: Volume2, group: 'tools', onSelect: () => navigate('/design/acoustic'), keywords: ['noise', 'nc'] },
    { id: 'chiller', label: 'Chiller Selection', icon: Gauge, group: 'tools', onSelect: () => navigate('/design/chiller-selection'), keywords: ['cooling', 'plant'] },
    { id: 'boiler', label: 'Boiler Selection', icon: Thermometer, group: 'tools', onSelect: () => navigate('/design/boiler-selection'), keywords: ['heating', 'plant'] },
    { id: 'workflow', label: 'Workflow Diagram', icon: Workflow, group: 'tools', onSelect: () => navigate('/design/workflow-diagram'), keywords: ['process', 'stages'] },
    
    // Actions
    { id: 'save', label: 'Save', shortcut: `${modKey}S`, icon: Save, group: 'actions', onSelect: () => { onSave?.(); setOpen(false); }, keywords: ['save', 'store'] },
    { id: 'export', label: 'Export to PDF', shortcut: `${modKey}E`, icon: Download, group: 'actions', onSelect: () => { onExport?.(); setOpen(false); }, keywords: ['download', 'pdf'] },
    { id: 'undo', label: 'Undo / Rollback', shortcut: `${modKey}Z`, icon: Undo2, group: 'actions', onSelect: () => { onUndo?.(); setOpen(false); }, keywords: ['revert', 'history'] },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', shortcut: '/', icon: Keyboard, group: 'actions', onSelect: () => { onShowShortcuts?.(); setOpen(false); }, keywords: ['help', 'keys'] },
  ], [navigate, onSave, onExport, onUndo, onShowShortcuts, modKey]);

  const navigationCommands = commands.filter(c => c.group === 'navigation');
  const toolCommands = commands.filter(c => c.group === 'tools');
  const actionCommands = commands.filter(c => c.group === 'actions');

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          {actionCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.onSelect}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
              {cmd.shortcut && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {cmd.shortcut}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navigation">
          {navigationCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.onSelect}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Design Tools">
          {toolCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.onSelect}
              keywords={cmd.keywords}
            >
              <cmd.icon className="mr-2 h-4 w-4" />
              <span>{cmd.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
