'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Send,
  X,
  ThumbsUp,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';

interface Review {
  id: string;
  name: string;
  date: string;
  route: string;
  rating: number;
  comment: string;
  verified: boolean;
  isMine?: boolean;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Alexander Weber',
    date: 'Yesterday',
    route: 'BCN Airport Terminal 1 → Hotel Arts Barcelona',
    rating: 5,
    comment:
      'Superb private transfer experience! Chauffeur was waiting right at arrivals with our name board, helped with all our heavy luggage, and the Mercedes was spotless. Seamless start to our trip.',
    verified: true,
  },
  {
    id: 'rev-2',
    name: 'Elena Rossi',
    date: '3 days ago',
    route: 'Barcelona Cruise Port (Pier A) → Sagrada Família',
    rating: 5,
    comment:
      'Impeccable service. Our cruise docked early and the driver was already there. Fixed pricing gave us complete peace of mind, no meters or hidden fees. Highly recommend Barcelona Taxi Transfer!',
    verified: true,
  },
  {
    id: 'rev-3',
    name: 'James & Sarah Mitchell',
    date: '1 week ago',
    route: 'Gothic Quarter → Barcelona Sants Station',
    rating: 5,
    comment:
      'Prompt, polite, and exceptionally comfortable. The child booster seat we requested was brand new and already installed. Will definitely book again on our next holiday.',
    verified: true,
  },
  {
    id: 'rev-4',
    name: 'Sophie Laurent',
    date: '2 weeks ago',
    route: 'Barcelona City Tour (Montserrat & Park Güell)',
    rating: 5,
    comment:
      'Our private chauffeur made our full-day corporate trip an absolute pleasure. Professional, knowledgeable, and the Mercedes V-Class minivan was top-of-the-line.',
    verified: true,
  },
];

export default function CustomerReviews() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [myReviewIds, setMyReviewIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form Fields
  const [userName, setUserName] = useState('');
  const [userRoute, setUserRoute] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load customer's own reviews and tracked IDs from localStorage
  useEffect(() => {
    try {
      const savedIds = localStorage.getItem('btt_my_review_ids');
      let myIds: string[] = savedIds ? JSON.parse(savedIds) : [];

      const savedReviews = localStorage.getItem('btt_customer_reviews');
      if (savedReviews) {
        let parsed: Review[] = JSON.parse(savedReviews);

        // Delete "haseeb" / "very good experiance" review as requested
        parsed = parsed.filter(
          (r) =>
            !r.name.toLowerCase().includes('haseeb') &&
            !r.comment.toLowerCase().includes('very good experiance'),
        );

        // Ensure all local reviews created on this device are recognized as the customer's own
        const allUserIds = Array.from(new Set([...myIds, ...parsed.map((r) => r.id)]));
        setMyReviewIds(allUserIds);

        localStorage.setItem('btt_customer_reviews', JSON.stringify(parsed));
        localStorage.setItem('btt_my_review_ids', JSON.stringify(allUserIds));

        // Mark user's own reviews so Edit and Delete buttons always appear
        const marked = parsed.map((r) => ({
          ...r,
          isMine: true,
        }));
        setReviews([...marked, ...INITIAL_REVIEWS]);
      } else {
        setMyReviewIds(myIds);
      }
    } catch (e) {
      // Storage access error handling
    }
  }, []);

  const openNewReviewModal = () => {
    setEditingReviewId(null);
    setUserName('');
    setUserRoute('');
    setUserRating(5);
    setUserComment('');
    setModalOpen(true);
  };

  const openEditModal = (review: Review) => {
    // Only permit editing if this review belongs to the customer
    if (!myReviewIds.includes(review.id)) return;
    setEditingReviewId(review.id);
    setUserName(review.name);
    setUserRoute(review.route);
    setUserRating(review.rating);
    setUserComment(review.comment);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    // Only permit deleting if this review belongs to the customer
    if (!myReviewIds.includes(id)) return;

    const updatedReviews = reviews.filter((r) => r.id !== id);
    const updatedMyIds = myReviewIds.filter((myId) => myId !== id);

    setReviews(updatedReviews);
    setMyReviewIds(updatedMyIds);
    setDeleteConfirmId(null);

    try {
      localStorage.setItem('btt_my_review_ids', JSON.stringify(updatedMyIds));
      const localOnly = updatedReviews.filter(
        (r) => !INITIAL_REVIEWS.some((init) => init.id === r.id),
      );
      localStorage.setItem('btt_customer_reviews', JSON.stringify(localOnly));
    } catch (e) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    if (editingReviewId) {
      // Edit existing review belonging to user
      const updatedReviews = reviews.map((r) => {
        if (r.id === editingReviewId) {
          return {
            ...r,
            name: userName.trim(),
            route: userRoute.trim() || 'Barcelona Transfer',
            rating: userRating,
            comment: userComment.trim(),
            date: 'Edited just now',
          };
        }
        return r;
      });

      setReviews(updatedReviews);

      try {
        const localOnly = updatedReviews.filter(
          (r) => !INITIAL_REVIEWS.some((init) => init.id === r.id),
        );
        localStorage.setItem('btt_customer_reviews', JSON.stringify(localOnly));
      } catch (e) {}
    } else {
      // Create new review
      const newId = `rev-${Date.now()}`;
      const newReview: Review = {
        id: newId,
        name: userName.trim(),
        date: 'Just now',
        route: userRoute.trim() || 'Barcelona Transfer',
        rating: userRating,
        comment: userComment.trim(),
        verified: true,
        isMine: true,
      };

      const updatedReviews = [newReview, ...reviews];
      const updatedMyIds = [newId, ...myReviewIds];

      setReviews(updatedReviews);
      setMyReviewIds(updatedMyIds);

      try {
        localStorage.setItem('btt_my_review_ids', JSON.stringify(updatedMyIds));
        const localOnly = updatedReviews.filter(
          (r) => !INITIAL_REVIEWS.some((init) => init.id === r.id),
        );
        localStorage.setItem('btt_customer_reviews', JSON.stringify(localOnly));
      } catch (e) {}
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setModalOpen(false);
      setEditingReviewId(null);
    }, 1500);
  };

  return (
    <section className="py-16 sm:py-24 bg-white relative border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
          <div>
            <span className="text-xs uppercase tracking-widest text-gold-600 font-bold">
              Client Feedback & Ratings
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-navy-950 mt-1">
              What Our Travelers Say
            </h2>
            <div className="flex items-center space-x-3 mt-3">
              <div className="flex text-gold-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current text-gold-500" />
                ))}
              </div>
              <span className="text-navy-950 font-bold text-base">4.9 / 5.0</span>
              <span className="text-gray-500 text-xs sm:text-sm">
                (Based on 450+ verified passenger experiences)
              </span>
            </div>
          </div>

          <button
            onClick={openNewReviewModal}
            className="gold-button px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-gold shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Share Your Experience</span>
          </button>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.slice(0, 8).map((r) => {
            const isMyReview = r.isMine || myReviewIds.includes(r.id);

            return (
              <div
                key={r.id}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative bg-white ${
                  isMyReview
                    ? 'border-2 border-gold-500 bg-gold-50/20 shadow-md'
                    : 'border border-gray-200/90 hover:border-gold-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* Top Bar: Rating & Date + "Your Review" Badge / Edit / Delete */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-gold-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating ? 'fill-current text-gold-500' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-gray-500 font-medium">{r.date}</span>

                      {/* Options to Edit or Delete ONLY for the customer's own review */}
                      {isMyReview && (
                        <div className="flex items-center space-x-1 ml-1 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
                          <button
                            onClick={() => openEditModal(r)}
                            title="Edit your review"
                            aria-label="Edit review"
                            className="p-1 rounded text-gray-600 hover:text-gold-700 hover:bg-gold-50 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            title="Delete your review"
                            aria-label="Delete review"
                            className="p-1 rounded text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer own review indicator pill */}
                  {isMyReview && (
                    <div className="mb-2.5 inline-flex items-center space-x-1 bg-gold-50 border border-gold-300 px-2 py-0.5 rounded-full text-[10px] font-bold text-gold-800">
                      <User className="w-3 h-3" />
                      <span>Your Review (Editable by you)</span>
                    </div>
                  )}

                  <p className="text-xs text-gray-600 leading-relaxed mb-4 italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-navy-950">{r.name}</h4>
                      <p className="text-[10px] text-gold-600 font-semibold truncate max-w-[170px]">{r.route}</p>
                    </div>
                    {r.verified && (
                      <span className="flex items-center text-[10px] font-semibold text-emerald-600">
                        <CheckCircle className="w-3 h-3 mr-0.5 text-emerald-600" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-navy-950">Delete Your Review?</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete your review? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-4 sm:p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setModalOpen(false);
                setEditingReviewId(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-navy-950 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <ThumbsUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">
                  {editingReviewId ? 'Review Updated Successfully!' : 'Thank You for Your Feedback!'}
                </h3>
                <p className="text-xs text-gray-600">
                  {editingReviewId
                    ? 'Your changes have been saved.'
                    : 'Your review has been published. You can edit or delete it anytime.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-gold-600 font-bold block mb-1">
                    {editingReviewId ? 'Modify Your Experience' : 'Rate Your Journey'}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-navy-950">
                    {editingReviewId ? 'Edit Your Review' : 'Share Your Experience'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {editingReviewId
                      ? 'Update your ratings or comments for your Barcelona transfer.'
                      : 'Help other travelers by rating your Barcelona chauffeur and ride.'}
                  </p>
                </div>

                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Your Rating *
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating ?? userRating)
                              ? 'fill-current text-gold-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-xs font-bold text-gold-600">
                      {(hoverRating ?? userRating)} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-navy-950 placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Journey / Route Taken (optional)
                  </label>
                  <input
                    type="text"
                    value={userRoute}
                    onChange={(e) => setUserRoute(e.target.value)}
                    placeholder="e.g. Barcelona Airport to Hotel W"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-navy-950 placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Review & Comments *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Tell us about the vehicle condition, punctuality, driver courtesy..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-navy-950 placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:bg-white transition-colors"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setEditingReviewId(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-gold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{editingReviewId ? 'Save Changes' : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
