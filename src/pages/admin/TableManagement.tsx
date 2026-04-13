import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RestaurantTable {
  id: string;
  table_number: number;
  seats: number;
  status: string;
}

export default function TableManagement() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [form, setForm] = useState({ table_number: '', seats: '4', status: 'available' });
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('restaurant_tables').select('*').order('table_number');
    setTables(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ table_number: '', seats: '4', status: 'available' }); setOpen(true); };
  const openEdit = (t: RestaurantTable) => {
    setEditing(t);
    setForm({ table_number: String(t.table_number), seats: String(t.seats), status: t.status });
    setOpen(true);
  };

  const save = async () => {
    const payload = { table_number: parseInt(form.table_number), seats: parseInt(form.seats), status: form.status };
    if (editing) {
      await supabase.from('restaurant_tables').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('restaurant_tables').insert(payload);
    }
    setOpen(false);
    load();
    toast({ title: editing ? 'Table updated' : 'Table created' });
  };

  const remove = async (id: string) => {
    await supabase.from('restaurant_tables').delete().eq('id', id);
    load();
  };

  const statusClass = (s: string) => s === 'available' ? 'status-ready' : s === 'occupied' ? 'status-pending' : 'status-preparing';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tables</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Table</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Table' : 'New Table'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Table number" type="number" value={form.table_number} onChange={e => setForm({ ...form, table_number: e.target.value })} />
              <Input placeholder="Seats" type="number" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} />
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(t => (
          <Card key={t.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Table {t.table_number}</h3>
                <Badge className={statusClass(t.status)}>{t.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{t.seats} seats</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => remove(t.id)}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
