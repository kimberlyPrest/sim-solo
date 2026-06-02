import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type MemberRole = Database['public']['Enums']['member_role']

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  organization: Organization | null
  role: MemberRole | null
  noOrganization: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [noOrganization, setNoOrganization] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfileAndOrg = async (userId: string) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (prof) setProfile(prof)

      const { data: members } = await supabase
        .from('organization_members')
        .select('role, organization_id, organizations(*)')
        .eq('user_id', userId)

      if (members && members.length > 0) {
        const member = members[0]
        setRole(member.role)

        const orgsData = member.organizations as any
        const orgData = Array.isArray(orgsData) ? orgsData[0] : orgsData

        if (orgData) {
          setOrganization(orgData)
        } else {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', member.organization_id)
            .single()
          setOrganization(org)
        }
        setNoOrganization(false)
      } else {
        setNoOrganization(true)
      }
    } catch (err) {
      console.error(err)
      setNoOrganization(true)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfileAndOrg(session.user.id)
      } else {
        setProfile(null)
        setOrganization(null)
        setRole(null)
        setNoOrganization(false)
      }
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        if (mounted) {
          setLoading(true)
          loadProfileAndOrg(newSession.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        }
      } else {
        setProfile(null)
        setOrganization(null)
        setRole(null)
        setNoOrganization(false)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        role,
        noOrganization,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
