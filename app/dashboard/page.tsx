"use client"

import { supabase } from "@/lib/supabase"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FiPlus, FiSearch, FiLogOut, FiGrid, FiLayout, FiEdit2, FiTrash2, FiStar, FiX, FiCheck } from "react-icons/fi"
import { MdBookmark } from "react-icons/md"

export default function Dashboard() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([])
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editUrl, setEditUrl] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [showAddForm, setShowAddForm] = useState(false)
  const [markedBookmarks, setMarkedBookmarks] = useState<number[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
        // Load bookmarks with the user ID directly
        const { data: bookmarksData } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
        setBookmarks(bookmarksData || [])
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!user?.id) return

    const userId = user.id

    // Real-time subscription for multi-tab sync (filtered by user_id)
    const subscription = supabase
      .channel(`realtime-bookmarks-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks", filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log("Realtime payload:", payload)
          // reload bookmarks for this user
          loadBookmarks(userId)
        }
      )
      .subscribe()

    // Debug: ensure websocket connected
    console.log("Subscribed to realtime for user:", userId)

    return () => {
      try {
        subscription?.unsubscribe()
      } catch (e) {
        console.warn("Failed to unsubscribe realtime subscription", e)
      }
    }
  }, [user?.id])

  useEffect(() => {
    const filtered = bookmarks.filter(b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredBookmarks(filtered)
  }, [searchQuery, bookmarks])

  const loadBookmarks = useCallback(async (userId?: string) => {
    const id = userId || user?.id
    if (!id) return
    try {
      const { data } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })

      setBookmarks(data || [])
    } catch (error) {
      console.error("Failed to load bookmarks:", error)
    }
  }, [])

  const addBookmark = async () => {
    if (!title || !url) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from("bookmarks").insert({
      title,
      url,
      notes,
      user_id: user.id,
    })

    setTitle("")
    setUrl("")
    setNotes("")
    setShowAddForm(false)
    loadBookmarks(user?.id)
  }

  const deleteBookmark = async (id: number) => {
    if (!user?.id) return
    try {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
      await loadBookmarks(user.id)
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  const startEditBookmark = (bookmark: any) => {
    setEditingId(bookmark.id)
    setEditTitle(bookmark.title)
    setEditUrl(bookmark.url)
    setEditNotes(bookmark.notes || "")
  }

  const saveEditBookmark = async () => {
    if (!editingId || !user?.id) return

    try {
      // Update the bookmark
      const { data, error } = await supabase
        .from("bookmarks")
        .update({ title: editTitle, url: editUrl, notes: editNotes })
        .eq("id", editingId)
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Update error:", error)
        return
      }

      console.log("Bookmark updated:", data)

      // Clear the editing state first
      setEditingId(null)
      setEditTitle("")
      setEditUrl("")
      setEditNotes("")
      
      // Then reload bookmarks
      await new Promise(resolve => setTimeout(resolve, 100))
      await loadBookmarks(user.id)
    } catch (error) {
      console.error("Edit failed:", error)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
    setEditUrl("")
    setEditNotes("")
  }

  const toggleMarkBookmark = (id: number) => {
    setMarkedBookmarks(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    )
  }

  const formatUrl = (urlString: string) => {
    if (!urlString) return ""
    if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
      return urlString
    }
    return `https://${urlString}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg font-bold text-lg">
              <MdBookmark size={24} />
            </div>
            <span className="text-xl font-bold text-gray-900">Smart Bookmarks</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8 relative">
            <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
            />
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 hidden sm:inline">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Control Bar */}
        <div className="flex gap-4 items-center justify-between">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            title="Add new bookmark"
          >
            <FiPlus size={20} />
            <span>Add Bookmark</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
              title="Table view"
            >
              <FiGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                viewMode === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border hover:bg-gray-50"
              }`}
              title="Card view"
            >
              <FiLayout size={20} />
            </button>
          </div>
        </div>

        {/* Modal Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MdBookmark size={28} className="text-blue-600" />
                  Add New Bookmark
                </h2>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setTitle("")
                    setUrl("")
                    setNotes("")
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <input
                autoFocus
                placeholder="Bookmark title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                placeholder="Website URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none h-24"
              />

              <div className="flex gap-2">
                <button
                  onClick={addBookmark}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <FiCheck size={18} />
                  Save Bookmark
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setTitle("")
                    setUrl("")
                    setNotes("")
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 font-medium py-2 rounded-lg hover:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  <FiX size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks Display */}
        {viewMode === "table" ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Sr.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookmarks.map((b, index) =>
                    editingId === b.id ? (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <input
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                              placeholder="Title"
                            />
                            <input
                              value={editUrl}
                              onChange={e => setEditUrl(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
                              placeholder="URL"
                            />
                            <textarea
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none h-20"
                              placeholder="Notes"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditBookmark}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                              >
                                <FiCheck size={18} />
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 font-medium flex items-center justify-center gap-2"
                              >
                                <FiX size={18} />
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={b.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {markedBookmarks.includes(b.id) && <span className="mr-2"><FiStar size={16} className="inline text-yellow-500 fill-yellow-500" /></span>}
                          {b.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600">
                          <a href={formatUrl(b.url)} target="_blank" className="hover:underline truncate max-w-xs block">
                            {b.url}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={b.notes}>
                          {b.notes || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(b.created_at)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => toggleMarkBookmark(b.id)}
                              className="p-2 rounded-lg hover:bg-yellow-50 transition text-yellow-500"
                              title={markedBookmarks.includes(b.id) ? "Unmark" : "Mark"}
                            >
                              <FiStar size={18} fill={markedBookmarks.includes(b.id) ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => startEditBookmark(b)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteBookmark(b.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            {filteredBookmarks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No bookmarks found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookmarks.map((b, index) =>
              editingId === b.id ? (
                <div key={b.id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="space-y-3">
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="Title"
                    />
                    <input
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm"
                      placeholder="URL"
                    />
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600 outline-none text-sm h-20"
                      placeholder="Notes"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEditBookmark}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FiCheck size={16} />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <FiX size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition p-4 space-y-3 ${markedBookmarks.includes(b.id) ? "ring-2 ring-yellow-400" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">#{index + 1}</div>
                      <h3 className="text-lg font-bold text-gray-900 truncate flex items-center gap-2">
                        {markedBookmarks.includes(b.id) && <FiStar size={18} className="text-yellow-500 flex-shrink-0 fill-yellow-500" />}
                        {b.title}
                      </h3>
                    </div>
                  </div>
                  <a
                    href={formatUrl(b.url)}
                    target="_blank"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {b.url}
                  </a>
                  {b.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded truncate" title={b.notes}>
                      {b.notes}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    {formatDate(b.created_at)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => toggleMarkBookmark(b.id)}
                      className="flex-1 p-2 text-center font-medium border rounded-lg hover:bg-yellow-50 transition text-yellow-500"
                      title={markedBookmarks.includes(b.id) ? "Unmark" : "Mark"}
                    >
                      <FiStar size={18} fill={markedBookmarks.includes(b.id) ? "currentColor" : "none"} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => startEditBookmark(b)}
                      className="flex-1 p-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                      title="Edit"
                    >
                      <FiEdit2 size={18} className="mx-auto" />
                    </button>
                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="flex-1 p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} className="mx-auto" />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {filteredBookmarks.length === 0 && viewMode === "card" && (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookmarks found</p>
          </div>
        )}
      </div>
    </div>
  )
}
