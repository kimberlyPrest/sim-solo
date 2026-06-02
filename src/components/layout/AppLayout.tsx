import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, Users, Map, MapPin, Database, Bell, Sprout, LogOut } from 'lucide-react'
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
  SidebarFooter,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs'

export function AppLayout() {
  const location = useLocation()
  const { signOut, profile, organization, role } = useAuth()
  const { breadcrumbs } = useBreadcrumbs()

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 flex flex-col gap-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm">
              <Sprout className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">SIM Solo</span>
          </div>
          {organization && (
            <div className="text-xs font-medium px-2 py-1 bg-muted rounded text-muted-foreground flex justify-between">
              <span>{organization.name}</span>
              <span className="capitalize">
                {role === 'admin' ? 'Admin' : role === 'technician' ? 'Técnico' : 'Visualizador'}
              </span>
            </div>
          )}
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
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith('/fazendas')}>
                    <Link to="/fazendas">
                      <Map /> Fazendas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith('/areas')}>
                    <Link to="/areas">
                      <MapPin /> Áreas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith('/importacoes')}
                  >
                    <Link to="/importacoes">
                      <Database /> Importações
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/10">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/thumbnail?seed=${profile?.id || '1'}`}
              />
              <AvatarFallback>{profile?.full_name?.substring(0, 2) || 'US'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">
                {profile?.full_name || 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col min-h-screen bg-muted/20">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b bg-background shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Início</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.url ? (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.url}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
