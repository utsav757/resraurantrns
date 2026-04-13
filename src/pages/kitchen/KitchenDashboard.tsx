import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, ChefHat, CheckCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  menu_items: { name: string } | null;
}

interface Order {
  id: string;
  status: string;
  created_at: string;
  restaurant_tables: { table_number: number } | null;
  order_items: OrderItem[];
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, restaurant_tables(table_number), order_items(id, quantity, menu_items(name))')
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: true });
    setOrders((data as any) ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    load();
    toast({ title: `Order marked as ${status}` });
  };

  const grouped = {
    pending: orders.filter(o => o.status === 'pending'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  const columns = [
    { key: 'pending' as const, title: 'Pending', icon: Clock, color: 'status-pending' },
    { key: 'preparing' as const, title: 'Preparing', icon: ChefHat, color: 'status-preparing' },
    { key: 'ready' as const, title: 'Ready', icon: CheckCircle, color: 'status-ready' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kitchen Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-4">
              <col.icon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{col.title}</h2>
              <Badge className={col.color}>{grouped[col.key].length}</Badge>
            </div>
            <div className="space-y-3">
              {grouped[col.key].map(order => (
                <Card key={order.id} className={col.key === 'pending' ? 'border-l-4 border-l-amber-400' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Table {order.restaurant_tables?.table_number}</CardTitle>
                      <span className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1 mb-3">
                      {order.order_items.map(item => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.menu_items?.name}</span>
                          <span className="text-muted-foreground">×{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    {col.key === 'pending' && (
                      <Button size="sm" className="w-full" onClick={() => updateStatus(order.id, 'preparing')}>
                        Start Preparing
                      </Button>
                    )}
                    {col.key === 'preparing' && (
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => updateStatus(order.id, 'ready')}>
                        Mark Ready
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {grouped[col.key].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No orders</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
