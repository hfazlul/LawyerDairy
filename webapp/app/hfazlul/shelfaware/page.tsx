import { redirect } from 'next/navigation'

/** ShelfAware jobs stay on the backend. This admin URL does not render them. */
export default function ShelfAwareAdminPage() {
  redirect('/hfazlul')
}
