import {
  LayoutDashboard, UtensilsCrossed, Users, ClipboardList,
  ChefHat, TableProperties, LogOut, Package
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Menu Items', url: '/admin/menu', icon: UtensilsCrossed },
  { title: 'Categories', url: '/admin/categories', icon: Package },
  { title: 'Tables', url: '/admin/tables', icon: TableProperties },
  { title: 'Orders', url: '/admin/orders', icon: ClipboardList },
  { title: 'Staff', url: '/admin/staff', icon: Users },
];

const kitchenItems = [
  { title: 'Kitchen', url: '/kitchen', icon: ChefHat },
];

const staffItems = [
  { title: 'Tables', url: '/staff', icon: TableProperties },
  { title: 'Orders', url: '/staff/orders', icon: ClipboardList },
];

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const items = role === 'admin' ? adminItems : role === 'kitchen' ? kitchenItems : staffItems;
  const roleName = role === 'admin' ? 'Admin' : role === 'kitchen' ? 'Kitchen Staff' : 'Waiter';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <div className="px-3 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-sidebar-foreground">RestaurantOS</p>
                <p className="text-xs text-sidebar-foreground/60">{roleName}</p>
              </div>
            </div>
          )}
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin' || item.url === '/kitchen' || item.url === '/staff'}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-sidebar-foreground/50 truncate">
            {user?.email}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && 'Sign Out'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
