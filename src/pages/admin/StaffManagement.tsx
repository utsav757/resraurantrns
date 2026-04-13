import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StaffMember {
  user_id: string;
  role: string;
  profile: { full_name: string } | null;
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name');
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p.full_name]));
      const result = (roles ?? []).map(r => ({
        user_id: r.user_id,
        role: r.role,
        profile: { full_name: profileMap.get(r.user_id) ?? '' },
      }));
      setStaff(result as any);
    };
    load();
  }, []);

  const roleColor = (r: string) => r === 'admin' ? 'status-preparing' : r === 'kitchen' ? 'status-pending' : 'status-ready';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Staff Members</h1>
      <p className="text-sm text-muted-foreground mb-4">To add staff, create user accounts and assign roles via the database.</p>
      <div className="grid gap-3">
        {staff.map(s => (
          <Card key={s.user_id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{s.profile?.full_name || 'Unnamed'}</p>
                <p className="text-sm text-muted-foreground">{s.user_id.slice(0, 8)}...</p>
              </div>
              <Badge className={roleColor(s.role)}>{s.role}</Badge>
            </CardContent>
          </Card>
        ))}
        {staff.length === 0 && <p className="text-muted-foreground text-center py-8">No staff members found.</p>}
      </div>
    </div>
  );
}
