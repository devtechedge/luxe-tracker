'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Clock, Users, Trophy, Ticket, AlertCircle, CheckCircle2 } from 'lucide-react'
import { DropQueueResponse, DropQueueEntry, fetchAPI, BRAND_COLORS, REGION_COLORS, formatDate } from '@/lib/fashion-types'

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const QUEUE_TYPE_COLORS: Record<string, string> = {
  waitlist: '#3b82f6',
  raffle: '#f59e0b',
  invite: '#8b5cf6',
}

const QUEUE_TYPE_LABELS: Record<string, string> = {
  waitlist: 'Waitlist',
  raffle: 'Raffle',
  invite: 'Invite Only',
}

export function DropQueuePanel() {
  const [data, setData] = useState<DropQueueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchAPI('/api/drops/queue').then((d: DropQueueResponse) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Loading drop queues...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-400">Failed to load</div>

  const filtered = statusFilter === 'all' ? data.queues : data.queues.filter((q: DropQueueEntry) => q.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={0}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] to-violet-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400/70">Total Queues</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.totalQueues}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={1}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/70">Open</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.openCount}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={2}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/70">Upcoming</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.upcomingCount}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={3}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.08] to-cyan-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-400/70">Avg Odds</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{(data.avgOdds * 100).toFixed(0)}%</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter + queue list */}
      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <Ticket className="h-4 w-4 text-violet-400" /> Exclusive Drop Queues
              </CardTitle>
              <CardDescription className="text-white/30">Waitlists, raffles, and invite-only access for limited drops</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {['all', 'open', 'upcoming', 'closed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors capitalize ${
                    statusFilter === status ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((q: DropQueueEntry, idx: number) => (
              <motion.div
                key={q.id}
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden"
              >
                {/* Status indicator */}
                <div className={`absolute top-0 right-0 w-16 h-16 -translate-y-1/2 translate-x-1/2 rotate-45 ${
                  q.status === 'open' ? 'bg-emerald-500/10' : q.status === 'upcoming' ? 'bg-amber-500/10' : 'bg-white/5'
                }`} />

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{q.productName}</p>
                    <p className="text-[10px] text-white/30">
                      <span style={{ color: BRAND_COLORS[q.brand] || 'rgba(255,255,255,0.5)' }}>{q.brand}</span>
                      {' \u00B7 '}{q.editionType}
                    </p>
                  </div>
                  <Badge
                    className="text-[8px] shrink-0"
                    style={{ backgroundColor: QUEUE_TYPE_COLORS[q.queueType] + '20', color: QUEUE_TYPE_COLORS[q.queueType], borderColor: QUEUE_TYPE_COLORS[q.queueType] + '40' }}
                  >
                    {QUEUE_TYPE_LABELS[q.queueType] || q.queueType}
                  </Badge>
                </div>

                {/* Fill progress */}
                <div className="mb-2">
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-white/30">{q.filledSlots}/{q.totalSlots} slots filled</span>
                    <span className={`font-bold ${q.fillPct > 90 ? 'text-red-400' : q.fillPct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {q.fillPct.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={q.fillPct} className="h-1.5" />
                </div>

                <Separator className="my-2 bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-white/25 block">Region</span>
                    <Badge variant="outline" className="text-[9px] mt-0.5" style={{ backgroundColor: REGION_COLORS[q.region] + '20', color: REGION_COLORS[q.region], borderColor: REGION_COLORS[q.region] + '40' }}>
                      {q.region}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-white/25 block">Your Position</span>
                    <span className="text-white/70 font-bold mt-0.5 block">#{q.userPosition || '\u2014'}</span>
                  </div>
                  <div>
                    <span className="text-white/25 block">Odds</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${q.oddsOfSuccess * 100}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 max-w-[60px]"
                      />
                      <span className={`font-bold ${(q.oddsOfSuccess * 100) >= 50 ? 'text-emerald-400' : (q.oddsOfSuccess * 100) >= 20 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(q.oddsOfSuccess * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/25 block">Status</span>
                    <Badge className={`text-[9px] mt-0.5 ${
                      q.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      q.status === 'upcoming' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-white/[0.04] text-white/30 border-white/[0.06]'
                    }`}>
                      {q.status === 'open' ? '\u2705 Open' : q.status === 'upcoming' ? `\u23F3 ${q.daysUntilOpen}d` : q.status}
                    </Badge>
                  </div>
                </div>

                {q.status === 'upcoming' && q.daysUntilOpen <= 7 && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-amber-400">
                    <AlertCircle className="h-3 w-3" />
                    Opens in {q.daysUntilOpen} day{q.daysUntilOpen !== 1 ? 's' : ''}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
