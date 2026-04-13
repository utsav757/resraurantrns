import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_items: { name: string } | null;
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

export default function TableOrders() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableNumber, setTableNumber] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data: o }, { data: t }] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items(id, quantity, unit_price, menu_items(name))')
          .eq('table_id', tableId!)
          .order('created_at', { ascending: false }),
        supabase.from('restaurant_tables').select('table_number').eq('id', tableId!).single(),
      ]);
      setOrders((o as any) ?? []);
      setTableNumber(t?.table_number ?? 0);
    };
    load();
  }, [tableId]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Orders — Table {tableNumber}</h1>
      </div>
      <div className="space-y-4">
        {orders.map(o => (
          <Card key={o.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{new Date(o.created_at).toLocaleString()}</CardTitle>
                <Badge className={`status-${o.status}`}>{o.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1 mb-2">
                {o.order_items.map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.menu_items?.name} ×{item.quantity}</span>
                    <span className="text-muted-foreground">${(item.unit_price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="text-right font-semibold">Total: ${o.total_price.toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders for this table.</p>}
      </div>
    </div>
  );
}
