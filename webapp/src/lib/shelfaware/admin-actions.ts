'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'

export async function setShelfSuspended(formData: FormData) {
  await requireAdminPage('/hfazlul/shelfaware')
  const id = String(formData.get('id') || '')
  const suspended = String(formData.get('suspended') || '') === '1'
  if (!id) return
  await prisma.shelfDevice.update({ where: { id }, data: { suspended } })
  revalidatePath('/hfazlul/shelfaware')
}

export async function setShelfNote(formData: FormData) {
  await requireAdminPage('/hfazlul/shelfaware')
  const id = String(formData.get('id') || '')
  const panelNote = String(formData.get('panelNote') || '').slice(0, 280)
  if (!id) return
  await prisma.shelfDevice.update({ where: { id }, data: { panelNote } })
  revalidatePath('/hfazlul/shelfaware')
}
