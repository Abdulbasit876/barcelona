'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import {
  Star,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  CheckCircle,
  Eye,
  EyeOff,
  X,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  name: string;
  customer_name?: string;
  customer_email?: string;
  rating: number;
  comment: string;
  route: string;
  verified: boolean;
  is_verified?: boolean;
  is_published?: boolean;
  created_at: string;
  date: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    rating: 5,
    route: '',
    comment: '',
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getReviews(true);
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to load reviews for admin:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenEdit = (rev: ReviewItem) => {
    setEditingReview(rev);
    setEditForm({
      name: rev.customer_name || rev.name || '',
      rating: rev.rating || 5,
      route: rev.route || '',
      comment: rev.comment || '',
      is_published: rev.is_published ?? true,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSaving(true);
    try {
      await ApiClient.updateReview(editingReview.id, {
        customer_name: editForm.name,
        rating: editForm.rating,
        route: editForm.route,
        comment: editForm.comment,
        is_published: editForm.is_published,
      });
      setEditingReview(null);
      await fetchReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (rev: ReviewItem) => {
    try {
      const nextPublished = !(rev.is_published ?? true);
      await ApiClient.updateReview(rev.id, { is_published: nextPublished });
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, is_published: nextPublished } : r)),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle review visibility');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteReview(deletingId);
      setReviews((prev) => prev.filter((r) => r.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered reviews
  const filtered = reviews.filter((r) => {
    const matchesSearch =
      !search ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.comment && r.comment.toLowerCase().includes(search.toLowerCase())) ||
      (r.route && r.route.toLowerCase().includes(search.toLowerCase()));

    const matchesRating = !ratingFilter || String(r.rating) === ratingFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'published' && (r.is_published ?? true)) ||
      (statusFilter === 'hidden' && !(r.is_published ?? true));

    return matchesSearch && matchesRating && matchesStatus;
  });

  const totalReviews = reviews.length;
  const publishedCount = reviews.filter((r) => r.is_published ?? true).length;
  const avgRating = totalReviews
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Customer Reviews & Ratings"
        subtitle="Manage traveler feedback, approve publications, and maintain ratings in Supabase"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Reviews
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalReviews}</div>
            <div className="text-[11px] text-slate-500 mt-1">Saved in Supabase</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Published Live
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{publishedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Visible on customer website</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Average Rating
            </div>
            <div className="text-2xl font-black text-gold-600 mt-1 flex items-center gap-1.5">
              <span>{avgRating}</span>
              <Star className="w-5 h-5 fill-current text-gold-500 inline" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Across all client reviews</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admin Access Rule
            </div>
            <div className="text-sm font-black text-navy-800 mt-2 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>RLS Protected</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Only admins can edit or delete</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, route, or comment text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-navy-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="published">Published Live</option>
              <option value="hidden">Hidden</option>
            </select>

            <button
              onClick={fetchReviews}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Refresh reviews from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Reviews List / Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-600" />
              <span>Customer Reviews ({filtered.length})</span>
            </h3>
          </div>

          {loading && reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              Loading reviews from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No reviews match the current filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((rev) => {
                const isPublished = rev.is_published ?? true;

                return (
                  <div key={rev.id} className="p-5 hover:bg-slate-50/70 transition space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex text-gold-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${
                                s <= rev.rating ? 'fill-current text-gold-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-extrabold text-sm text-slate-900">
                          {rev.customer_name || rev.name}
                        </span>
                        {rev.route && (
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {rev.route}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                      </div>

                      {/* Admin action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePublished(rev)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={isPublished ? 'Click to hide from website' : 'Click to publish on website'}
                        >
                          {isPublished ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(rev)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition"
                          title="Edit this review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingId(rev.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                          title="Delete review permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-3">
                      <span>ID: {rev.id}</span>
                      {rev.customer_email && <span>Email: {rev.customer_email}</span>}
                      <span>Created: {new Date(rev.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-navy-800 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-gold-400" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">Edit Customer Review</h3>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer Name *
                </label>
                <input
                  required
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Rating (1-5 Stars) *
                  </label>
                  <select
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terrible</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Journey / Route
                  </label>
                  <input
                    type="text"
                    value={editForm.route}
                    onChange={(e) => setEditForm({ ...editForm, route: e.target.value })}
                    placeholder="e.g. BCN Airport → Hotel Arts"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Review Comment *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editForm.comment}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishedCheckbox"
                  checked={editForm.is_published}
                  onChange={(e) => setEditForm({ ...editForm, is_published: e.target.checked })}
                  className="w-4 h-4 text-navy-800 rounded border-slate-300 focus:ring-navy-800"
                />
                <label htmlFor="publishedCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publish live on website review section
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Review Permanently?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this customer review from Supabase? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
