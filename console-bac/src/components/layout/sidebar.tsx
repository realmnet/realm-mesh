import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  Globe,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Network,
  Layers,
  Key,
  Users,
  BarChart
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Realms',
    href: '/realms',
    icon: Globe,
  },
  {
    title: 'Policies',
    href: '/policies',
    icon: Shield,
  },
  {
    title: 'Services',
    href: '/services',
    icon: Layers,
  },
  {
    title: 'Network',
    href: '/network',
    icon: Network,
  },
  {
    title: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
  },
  {
    title: 'Access Control',
    href: '/access',
    icon: Key,
  },
  {
    title: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "border-r bg-sidebar-bg transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-end px-3 border-b border-header-border bg-header-bg/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-primary/10",
                    isActive && "bg-primary/15 text-primary font-medium border-l-4 border-primary ml-[-2px]",
                    !isOpen && "justify-center"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isOpen && (
                    <span className="flex-1">{item.title}</span>
                  )}
                  {isOpen && item.badge && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
};