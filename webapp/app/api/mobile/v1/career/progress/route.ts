import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { nextStreakDays, levelFromXp } from '@/lib/habit'

const HABIT_TOPIC = '__habit__'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const [progress, attempts] = await Promise.all([
    prisma.learningProgress.findMany({ where: { userId: user.id } }),
    prisma.attempt.count({ where: { userId: user.id } }),
  ])
  const xp = progress.reduce((s, p) => s + p.xp, 0)
  const habit = progress.find((p) => p.topicId === HABIT_TOPIC)
  const streak = habit?.streakDays ?? Math.max(0, ...progress.map((p) => p.streakDays), 0)
  return NextResponse.json({
    progress,
    attempts,
    xp,
    streak,
    level: levelFromXp(xp),
    lastStudied: habit?.lastStudied ?? null,
  })
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await req.json()) as { topicId?: string; moduleId?: string; xpDelta?: number }
  if (!body.topicId) return NextResponse.json({ message: 'topicId required' }, { status: 400 })
  const xpDelta = body.xpDelta ?? 10
  const now = new Date()

  const [topic, habit] = await Promise.all([
    prisma.learningProgress.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: body.topicId } },
    }),
    prisma.learningProgress.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: HABIT_TOPIC } },
    }),
  ])

  const topicStreak = nextStreakDays(topic?.lastStudied, topic?.streakDays ?? 0, now)
  const habitStreak = nextStreakDays(habit?.lastStudied, habit?.streakDays ?? 0, now)

  const row = await prisma.learningProgress.upsert({
    where: { userId_topicId: { userId: user.id, topicId: body.topicId } },
    create: {
      userId: user.id,
      topicId: body.topicId,
      moduleId: body.moduleId,
      xp: xpDelta,
      lastStudied: now,
      streakDays: topicStreak,
      level: levelFromXp(xpDelta),
    },
    update: {
      xp: { increment: xpDelta },
      lastStudied: now,
      streakDays: topicStreak,
      moduleId: body.moduleId ?? undefined,
    },
  })

  await prisma.learningProgress.upsert({
    where: { userId_topicId: { userId: user.id, topicId: HABIT_TOPIC } },
    create: {
      userId: user.id,
      topicId: HABIT_TOPIC,
      moduleId: 'habit',
      xp: 0,
      lastStudied: now,
      streakDays: habitStreak,
      level: 1,
    },
    update: {
      lastStudied: now,
      streakDays: habitStreak,
    },
  })

  const updated = await prisma.learningProgress.findUnique({
    where: { userId_topicId: { userId: user.id, topicId: body.topicId } },
  })
  if (updated) {
    await prisma.learningProgress.update({
      where: { id: updated.id },
      data: { level: levelFromXp(updated.xp) },
    })
  }

  return NextResponse.json({ progress: row, streak: habitStreak, level: levelFromXp((row.xp ?? 0)) })
}
