'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle,
  Send,
  X,
  ThumbsUp,
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
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [userName, setUserName] = useState('');
  const [userRoute, setUserRoute] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews from database:', err);
    }
  };

  // Load reviews from Supabase permanently on mount & periodically
  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 30000);
    return () => clearInterval(interval);
  }, []);

  const openNewReviewModal = () => {
    setUserName('');
    setUserRoute('');
    setUserRating(5);
    setUserComment('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: userName.trim(),
          route: userRoute.trim() || 'Barcelona Transfer',
          rating: userRating,
          comment: userComment.trim(),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.review) {
          setReviews((prev) => [result.review, ...prev]);
        } else {
          fetchReviews();
        }
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setModalOpen(false);
          setUserName('');
          setUserRoute('');
          setUserRating(5);
          setUserComment('');
        }, 1500);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to submit your review. Please try again.');
      }
    } catch (err) {
      alert('Unable to connect to database. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
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
            return (
              <div
                key={r.id}
                className="rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative bg-white border border-gray-200/90 hover:border-gold-500/60 shadow-sm hover:shadow-xl hover:-translate-y-1"
              >
                <div>
                  {/* Top Bar: Rating & Date */}
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
                    </div>
                  </div>

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

      {/* Create Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-4 sm:p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalOpen(false)}
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
                  Thank You for Your Feedback!
                </h3>
                <p className="text-xs text-gray-600">
                  Your review has been successfully submitted and published to our traveler feedback section.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-gold-600 font-bold block mb-1">
                    Rate Your Journey
                  </span>
                  <h3 className="text-xl font-serif font-bold text-navy-950">
                    Share Your Experience
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Help other travelers by rating your Barcelona chauffeur and ride.
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
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="gold-button px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-gold disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
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
