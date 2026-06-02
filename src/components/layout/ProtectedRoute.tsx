import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function ProtectedRoute() {
  const { user, loading, noOrganization, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (noOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Alert className="max-w-md bg-background shadow-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription className="mt-2">
            Você não está associado a nenhuma organização no momento. Por favor, solicite a um
            administrador que adicione seu usuário à organização correta.
            <div className="mt-6">
              <Button onClick={() => signOut()} variant="outline" className="w-full">
                Sair
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <Outlet />
}
