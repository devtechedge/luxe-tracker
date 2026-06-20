'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Gem, MapPin, Clock, Star, Calendar } from 'lucide-react'
import { RunwayResponse, RunwayShow, fetchAPI, BRAND_COLORS, formatDate } from '@/lib/fashion-types'

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const CITY_ICONS: Record<string, string> = {
  'Milan': '\u{1F1EE}\u{1F1F9}', 'Paris': '\u{1F1EB}\u{1F1F7}', 'London': '\u{1F1EC}\u{1F1E7}',
  'New York': '\u{1F1FA}\u{1F1F8}', 'Tokyo': '\u{1F1EF}\u{1F1F5}',
}

export function RunwayPanel() {
  const [data, setData] = useState<RunwayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<string>('all')

  useEffect(() => {
    fetchAPI('/api/runway/shows').then((d: RunwayResponse) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Loading runway shows...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-400">Failed to load</div>

  const filteredShows = selectedSeason === 'all'
    ? data.shows
    : data.shows.filter((s: RunwayShow) => s.season === selectedSeason)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={0}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] to-violet-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Gem className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400/70">Total Shows</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.totalShows}</p>
              <p className="text-[10px] text-white/30">runway presentations tracked</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={1}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/70">Cities</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.cities.length}</p>
              <p className="text-[10px] text-white/30">fashion capitals covered</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={2}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/70">Standout Looks</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.shows.reduce((s, sh) => s + sh.standouts, 0)}</p>
              <p className="text-[10px] text-white/30">editorial-worthy moments</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Season filter */}
      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <Gem className="h-4 w-4 text-violet-400" /> Runway Collection Timeline
              </CardTitle>
              <CardDescription className="text-white/30">Track every show across Milan, Paris, and beyond</CardDescription>
            </div>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs border border-white/10 rounded px-2 py-1 bg-white/[0.04] text-white/70"
            >
              <option value="all">All Seasons</option>
              {data.bySeason && Object.keys(data.bySeason).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[540px]">
            <div className="space-y-4">
              {/* City groups */}
              {Object.entries(data.byCity).map(([city, shows]) => {
                const cityShows = shows.filter(s => selectedSeason === 'all' || s.season === selectedSeason)
                if (cityShows.length === 0) return null
                return (
                  <div key={city}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{CITY_ICONS[city] || '\u{1F30D}'}</span>
                      <h3 className="text-sm font-bold text-white/80">{city}</h3>
                      <Badge className="text-[9px] bg-white/[0.06] text-white/40 border-white/[0.06]">{cityShows.length} shows</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {cityShows.map((show: RunwayShow, idx: number) => (
                        <motion.div
                          key={show.id}
                          variants={staggerItem}
                          initial="hidden"
                          animate="visible"
                          custom={idx}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-white/90">{show.showName}</p>
                              <p className="text-[10px] text-white/30 flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3" /> {formatDate(show.showDate)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[9px]"
                              style={{ borderColor: BRAND_COLORS[show.brand.name] || 'rgba(255,255,255,0.1)', color: BRAND_COLORS[show.brand.name] || 'rgba(255,255,255,0.5)' }}
                            >
                              {show.brand.name}
                            </Badge>
                          </div>
                          {show.venue && <p className="text-[10px] text-white/30 mb-2">{show.venue}</p>}
                          <Separator className="my-2 bg-white/[0.06]" />
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {show.mood && (
                              <div>
                                <span className="text-white/25">Mood</span>
                                <p className="text-white/60 font-medium">{show.mood}</p>
                              </div>
                            )}
                            {show.theme && (
                              <div>
                                <span className="text-white/25">Theme</span>
                                <p className="text-white/60 font-medium">{show.theme}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-white/25">Looks</span>
                              <p className="text-white/60 font-medium">{show.lookCount}</p>
                            </div>
                            <div>
                              <span className="text-white/25">Standouts</span>
                              <p className="text-amber-400/80 font-medium">{show.standouts} \u2605</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
