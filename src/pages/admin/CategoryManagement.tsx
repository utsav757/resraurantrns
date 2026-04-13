import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from('menu_categories').select('*').order('sort_order');
    setCategories(data ?? []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setName(''); setSortOrder('0'); setOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setSortOrder(String(c.sort_order)); setOpen(true); };

  const save = async () => {
    const payload = { name, sort_order: parseInt(sortOrder) };
    if (editing) {
      await supabase.from('menu_categories').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('menu_categories').insert(payload);
    }
    setOpen(false);
    load();
    toast({ title: editing ? 'Category updated' : 'Category created' });
  };

  const remove = async (id: string) => {
    await supabase.from('menu_categories').delete().eq('id', id);
    load();
    toast({ title: 'Category deleted' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Sort order" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
              <Button onClick={save} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-3">
        {categories.map(c => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">Order: {c.sort_order}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && <p className="text-muted-foreground text-center py-8">No categories yet.</p>}
      </div>
    </div>
  );
}
