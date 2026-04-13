import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';

interface RestaurantTable {
  id: string;
  table_number: number;
  seats: number;
  status: string;
}

export default function StaffTables() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('restaurant_tables').select('*').order('table_number');
      setTables(data ?? []);
    };
    load();
  }, []);

  const statusClass = (s: string) => `status-${s === 'available' ? 'ready' : s === 'occupied' ? 'pending' : 'preparing'}`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Table {t.table_number}</h3>
                <Badge className={statusClass(t.status)}>{t.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{t.seats} seats</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate(`/staff/new-order/${t.id}`)}>
                  <Plus className="h-3 w-3 mr-1" />New Order
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/staff/table-orders/${t.id}`)}>
                  <Eye className="h-3 w-3 mr-1" />Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
