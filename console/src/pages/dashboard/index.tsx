import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusTab } from './status-tab';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Realm Mesh infrastructure
        </p>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="realms">Realms</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <StatusTab />
        </TabsContent>

        <TabsContent value="realms" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Active Realms</h3>
            <p className="text-muted-foreground">Realms configuration will be displayed here.</p>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Security Policies</h3>
            <p className="text-muted-foreground">Policy management interface will be displayed here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};