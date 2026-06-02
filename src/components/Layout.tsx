import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, Users, Search, Bell, Sprout } from 'lucide-react'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Layout() {
  const location = useLocation()

  const getBreadcrumb = () => {
    const path = location.pathname
    if (path.startsWith('/produtores')) return 'Produtores'
    if (path.startsWith('/fazendas')) return 'Fazendas'
    if (path.startsWith('/areas')) return 'Áreas'
    if (path.startsWith('/campanhas')) return 'Campanhas'
    return 'Dashboard'
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-row items-center gap-3 border-b">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm">
            <Sprout className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground">SIM Solo</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                    <Link to="/">
                      <Home /> Início
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith('/produtores')}>
                    <Link to="/produtores">
                      <Users /> Produtores
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen bg-muted/20">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-background shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink className="font-medium text-foreground">
                    {getBreadcrumb()}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden lg:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Busca global..."
                className="w-full bg-muted pl-8 h-9 rounded-full border-transparent focus-visible:bg-background"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in-up">
            <Outlet />
          </div>
        </main>
        <footer className="py-4 text-center text-xs text-muted-foreground border-t">
          SIM Solo v0.0.1 MVP - Supabase Conectado
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
