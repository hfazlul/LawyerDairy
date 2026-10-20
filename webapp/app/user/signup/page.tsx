import { SignupForm } from './signup-form'

type Props = { searchParams?: Promise<{ error?: string }> }

/** Always render this route from the current module. Do not reuse a previous shell. */
export const dynamic = 'force-dynamic'

export default async function UserSignupPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const error = typeof params.error === 'string' ? params.error : ''
  return (
    <div className="min-h-screen bg-[#f7f3ea] px-4 py-6 sm:py-10">
      <SignupForm error={error} />
    </div>
  )
}
