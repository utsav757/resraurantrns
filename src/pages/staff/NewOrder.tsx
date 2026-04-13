import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, Send, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function NewOrder() {
  const { tableId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number>(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: items }, { data: cats }, { data: table }] = await Promise.all([
        supabase.from('menu_items').select('*').eq('available', true).order('name'),
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('restaurant_tables').select('table_number').eq('id', tableId!).single(),
      ]);
      setMenuItems(items ?? []);
      setCategories(cats ?? []);
      setTableNumber(table?.table_number ?? 0);
      if (cats && cats.length > 0) setActiveCategory(cats[0].id);
    };
    load();
  }, [tableId]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);

  const sendOrder = async () => {
    if (!user || cart.length === 0) return;
    setSending(true);
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ table_id: tableId!, staff_id: user.id, total_price: total })
        .select()
        .single();
      if (orderError) throw orderError;

      const items = cart.map(c => ({
        order_id: order.id,
        menu_item_id: c.menuItem.id,
        quantity: c.quantity,
        unit_price: c.menuItem.price,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      // Mark table as occupied
      await supabase.from('restaurant_tables').update({ status: 'occupied' }).eq('id', tableId!);

      toast({ title: 'Order sent to kitchen!' });
      navigate('/staff');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const filtered = activeCategory
    ? menuItems.filter(i => i.category_id === activeCategory)
    : menuItems;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">New Order — Table {tableNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={activeCategory === null ? 'default' : 'outline'}
              onClick={() => setActiveCategory(null)}
            >All</Button>
            {categories.map(c => (
              <Button
                key={c.id}
                size="sm"
                variant={activeCategory === c.id ? 'default' : 'outline'}
                onClick={() => setActiveCategory(c.id)}
              >{c.name}</Button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id);
              return (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(item)}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    {inCart && <Badge>{inCart.quantity}</Badge>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Add items from the menu</p>
              ) : (
                <div className="space-y-3">
                  {cart.map(c => (
                    <div key={c.menuItem.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.menuItem.name}</p>
                        <p className="text-xs text-muted-foreground">${(c.menuItem.price * c.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(c.menuItem.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-6 text-center">{c.quantity}</span>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(c.menuItem.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <Button className="w-full" onClick={sendOrder} disabled={sending}>
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? 'Sending...' : 'Send to Kitchen'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
