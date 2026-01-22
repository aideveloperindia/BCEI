'use client'

import { useState, useEffect } from 'react'
import { AdminProtection } from '@/components/AdminProtection'
import Image from 'next/image'
import Link from 'next/link'

export default function NewsPage() {
  return (
    <AdminProtection>
      <NewsContent />
    </AdminProtection>
  )
}

function NewsContent() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [newsList, setNewsList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      console.log('Fetched news:', data) // Debug log
      if (data.success) {
        setNewsList(data.news || [])
        console.log('News list set:', data.news?.length || 0, 'items')
      } else {
        console.error('Failed to fetch news:', data.message)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: any) => {
    setTitle(item.title)
    setBody(item.body)
    setEditingId(item.id)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setTitle('')
    setBody('')
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) {
      return
    }

    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setResult({ success: true, message: 'News deleted successfully!' })
        fetchNews()
        if (editingId === id) {
          handleCancelEdit()
        }
      } else {
        setResult({ success: false, message: data.message || 'Failed to delete news' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to delete news' })
      console.error('Error deleting news:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setResult(null)

    try {
      let response
      if (editingId) {
        // Update existing news
        response = await fetch(`/api/news/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        })
      } else {
        // Create new news
        response = await fetch('/api/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body }),
        })
      }

      const data = await response.json()
      if (data.success) {
        setResult({ 
          success: true, 
          message: editingId ? 'News updated successfully!' : 'News saved successfully!' 
        })
        setTitle('')
        setBody('')
        setEditingId(null)
        fetchNews()
      } else {
        setResult({ success: false, message: data.message || 'Failed to save news' })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to save news' })
      console.error('Error saving news:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl w-full">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-2 shadow-lg ring-2 ring-white/20">
          <Image
            src="/advocates-logo.png"
            alt="Advocates Logo"
            width={96}
            height={96}
            className="object-contain w-full h-full"
            priority
            unoptimized
          />
        </div>

        <div className="flex items-center justify-between w-full">
          <h1 className="text-white text-2xl font-semibold">
            {editingId ? 'Edit News' : 'Add News'}
          </h1>
          <Link
            href="/admin/push-notifications"
            className="text-white/70 hover:text-white text-sm underline"
          >
            Send Push
          </Link>
        </div>

        {editingId && (
          <div className="w-full bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-blue-400 text-sm">
            Editing news item. Click &quot;Cancel&quot; to stop editing.
          </div>
        )}

        <form onSubmit={handleSave} className="w-full space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">News Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40"
              placeholder="Enter news title"
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">News Content</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Enter news content"
              required
              disabled={isSaving}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update News' : 'Save News'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="bg-white/10 text-white font-semibold py-4 px-8 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {result && (
          <div
            className={`text-center p-4 rounded-lg ${
              result.success
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            <div className="font-semibold">{result.message}</div>
          </div>
        )}

        <div className="w-full">
          <h2 className="text-white text-lg font-semibold mb-4">Recent News</h2>
          {isLoading ? (
            <div className="text-white/50 text-center py-8">Loading...</div>
          ) : newsList.length === 0 ? (
            <div className="text-white/50 text-center py-8">No news yet. Add your first news item above.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {newsList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-white font-medium text-sm flex-1">{item.title}</div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-400 hover:text-blue-300 text-xs underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-white/60 text-xs line-clamp-3 mb-2 whitespace-pre-wrap">
                    {item.body}
                  </div>
                  <div className="text-white/40 text-xs">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : 'Unknown date'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
