import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  staff_id: string;
  restaurant_tables: { table_number: number } | null;
  staff_name?: string;
}

export default function OrderOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data: rawOrders } = await supabase
      .from('orders')
      .select('*, restaurant_tables(table_number)')
      .order('created_at', { ascending: false });
    const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.full_name]));
    const enriched = (rawOrders ?? []).map((o: any) => ({ ...o, staff_name: profileMap.get(o.staff_id) ?? '' }));
    setOrders(enriched);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    load();
    toast({ title: `Order updated to ${status}` });
  };

  const statusClass = (s: string) => `status-${s}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">All Orders</h1>
      <div className="grid gap-3">
        {orders.map(o => (
          <Card key={o.id}>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Table {o.restaurant_tables?.table_number}</span>
                  <Badge className={statusClass(o.status)}>{o.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  ${o.total_price.toFixed(2)} · {new Date(o.created_at).toLocaleString()}
                  {o.staff_name && ` · by ${o.staff_name}`}
                </p>
              </div>
              <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet.</p>}
      </div>
    </div>
  );
}
