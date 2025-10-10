import React from 'react';
import { Activity, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface StatusCard {
  title: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'info';
  description: string;
}

const statusCards: StatusCard[] = [
  {
    title: 'System Health',
    value: 'Operational',
    status: 'success',
    description: 'All systems running normally',
  },
  {
    title: 'Active Realms',
    value: 12,
    status: 'info',
    description: '3 new realms this week',
  },
  {
    title: 'Policy Violations',
    value: 2,
    status: 'warning',
    description: 'Requires attention',
  },
  {
    title: 'Network Latency',
    value: '45ms',
    status: 'success',
    description: 'Average across all realms',
  },
];

export const StatusTab: React.FC = () => {
  const getStatusIcon = (status: StatusCard['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card, index) => (
          <div
            key={index}
            className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {card.title}
              </h3>
              {getStatusIcon(card.status)}
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 mt-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2 min ago', event: 'New realm "production-east" created', type: 'info' },
              { time: '15 min ago', event: 'Policy update applied to realm "staging"', type: 'success' },
              { time: '1 hour ago', event: 'Connection timeout in realm "dev-west"', type: 'warning' },
              { time: '3 hours ago', event: 'Automatic failover triggered', type: 'error' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">{item.time}</span>
                <span className="flex-1">{item.event}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold mb-4">System Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'CPU Usage', value: 45, max: 100 },
              { label: 'Memory Usage', value: 62, max: 100 },
              { label: 'Network I/O', value: 78, max: 100 },
              { label: 'Storage', value: 35, max: 100 },
            ].map((metric, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{metric.label}</span>
                  <span className="text-muted-foreground">{metric.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};