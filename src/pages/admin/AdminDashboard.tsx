import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { UtensilsCrossed, ClipboardList, TableProperties, Users } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ menuItems: 0, orders: 0, tables: 0, staff: 0 });

  useEffect(() => {
    const load = async () => {
      const [menuRes, orderRes, tableRes, staffRes] = await Promise.all([
        supabase.from('menu_items').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('restaurant_tables').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        menuItems: menuRes.count ?? 0,
        orders: orderRes.count ?? 0,
        tables: tableRes.count ?? 0,
        staff: staffRes.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { title: 'Menu Items', value: stats.menuItems, icon: UtensilsCrossed, color: 'text-primary' },
    { title: 'Total Orders', value: stats.orders, icon: ClipboardList, color: 'text-accent' },
    { title: 'Tables', value: stats.tables, icon: TableProperties, color: 'text-status-preparing' },
    { title: 'Staff Members', value: stats.staff, icon: Users, color: 'text-status-pending' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
