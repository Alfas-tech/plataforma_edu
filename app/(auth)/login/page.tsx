import { createClient } from '@/src/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import React, { Suspense } from 'react'
import { LoginForm } from './components/LoginForm'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-svh items-center">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
