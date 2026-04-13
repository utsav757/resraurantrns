import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  restaurant_tables: { table_number: number } | null;
}

export default function StaffOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, restaurant_tables(table_number)')
      .eq('staff_id', user.id)
      .order('created_at', { ascending: false });
    setOrders((data as any) ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const markServed = async (id: string) => {
    await supabase.from('orders').update({ status: 'served' }).eq('id', id);
    load();
    toast({ title: 'Order marked as served' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="grid gap-3">
        {orders.map(o => (
          <Card key={o.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Table {o.restaurant_tables?.table_number}</span>
                  <Badge className={`status-${o.status}`}>{o.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  ${o.total_price.toFixed(2)} · {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              {o.status === 'ready' && (
                <Button size="sm" onClick={() => markServed(o.id)}>Mark Served</Button>
              )}
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet.</p>}
      </div>
    </div>
  );
}
