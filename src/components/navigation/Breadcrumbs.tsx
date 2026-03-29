import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumbs({ items, showHome = false, className }: BreadcrumbsProps) {
  const allItems = showHome 
    ? [{ label: 'Home', href: '/dashboard' }, ...items]
    : items;

  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Breadcrumb">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1">
            {index === 0 && showHome && (
              <Home className="w-4 h-4 text-muted-foreground" />
            )}
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {isLast || !item.href ? (
              <span className={cn(
                isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
