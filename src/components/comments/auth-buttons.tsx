import { IconBrandGoogle, IconLogout } from '@tabler/icons-react'
import { googleSignInEnabled, signIn, signOut } from '@/auth'
import { Button } from '@/components/ui/button'

async function startGoogleSignIn() {
  'use server'
  await signIn('google')
}

async function startSignOut() {
  'use server'
  await signOut()
}

export function GoogleSignInButton() {
  return (
    <form action={startGoogleSignIn}>
      <Button aria-label="Sign in with Google" className="size-10 p-0 sm:h-10 sm:w-auto sm:px-4" disabled={!googleSignInEnabled} type="submit">
        <IconBrandGoogle aria-hidden="true" className="size-4" />
        <span className="sr-only sm:not-sr-only">Sign in with Google</span>
      </Button>
    </form>
  )
}

export function SignOutButton() {
  return (
    <form action={startSignOut}>
      <Button aria-label="Sign out" className="sm:w-auto sm:px-4" size="icon-lg" type="submit" variant="outline">
        <IconLogout aria-hidden="true" className="size-4" />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </Button>
    </form>
  )
}
