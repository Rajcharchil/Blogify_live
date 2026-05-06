'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus, AlertCircle } from 'lucide-react'

export default function DraftsPage() {
  const router = useRouter()
  const { isAuthenticated, user, token, loading: authLoading } = useAuth()
  const [drafts, setDrafts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    fetch(`/api/blogs?authorId=${encodeURIComponent(user.id)}&published=false`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data?.error || 'Failed to load drafts')
        return data
      })
      .then((data) => setDrafts(data.blogs || []))
      .catch((e) => setError(e?.message || 'Failed to load drafts'))
      .finally(() => setLoading(false))
  }, [user?.id, token])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Drafts</h1>
            <p className="text-slate-400">Unpublished stories saved to your workspace</p>
          </div>
          <Link href="/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="w-4 h-4" /> New Draft
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 p-10 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold mb-2">No drafts yet</p>
            <p className="text-slate-500 text-sm mb-6">Start writing and save your first draft.</p>
            <Link href="/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Write a Draft</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((d) => (
              <Link key={d.id} href={`/blog/${d.slug}`}>
                <Card className="bg-slate-800 border-slate-700 p-6 hover:border-emerald-500/40 transition-all cursor-pointer">
                  <h2 className="text-white font-bold text-lg mb-1 line-clamp-1">{d.title}</h2>
                  {d.excerpt && <p className="text-slate-400 text-sm line-clamp-2 mb-3">{d.excerpt}</p>}
                  <div className="text-xs text-slate-500">
                    Last updated: {new Date(d.updatedAt || d.createdAt).toLocaleString()}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

