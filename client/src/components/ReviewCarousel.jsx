import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./ReviewCarousel.css";

function Avatar({ src, username, size = "sm" }) {
  const initial = username?.[0]?.toUpperCase() ?? "?";
  const cls =
    size === "lg"
      ? "review-modal-avatar-placeholder"
      : "review-card-avatar-placeholder";
  const imgCls = size === "lg" ? "review-modal-avatar" : "review-card-avatar";

  return src ? (
    <img src={src} alt={username} className={imgCls} />
  ) : (
    <div className={cls}>{initial}</div>
  );
}

function EditedBadge({ className = "review-card-edited" }) {
  return (
    <span className={className}>
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8.5 1.5a1.415 1.415 0 0 1 2 2L4 10H2v-2l6.5-6.5Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      edited
    </span>
  );
}

function ReviewModal({ review, onClose }) {
  const navigate = useNavigate();
  const { Collection: col, User: user, rating, content, isEdited } = review;

  const handleMediaNav = () => {
    onClose();
    navigate(`/media/${col.mediaType}/${col.externalId}`);
  };

  // Close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="review-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Full review of ${col?.title}`}
    >
      <div className="review-modal">
        {/* Header: cover + meta */}
        <div className="review-modal-header">
          <Link
            to={`/media/${col.mediaType}/${col.externalId}`}
            className="review-modal-cover-link"
            onClick={onClose}
          >
            <img
              src={
                col.coverUrl ||
                `https://placehold.co/72x102/1e1e2a/7c7a8a?text=${encodeURIComponent(col.mediaType)}`
              }
              alt={col.title}
            />
          </Link>

          <div className="review-modal-info">
            <Link
              to={`/media/${col.mediaType}/${col.externalId}`}
              className="review-modal-title-link"
              onClick={onClose}
            >
              {col.title}
            </Link>

            <span className={`badge badge-${col.mediaType}`}>
              {col.mediaType}
            </span>

            <Link
              to={`/users/${user.username}`}
              className="review-modal-author"
              onClick={onClose}
            >
              <Avatar src={user.avatar} username={user.username} size="lg" />
              <span className="review-modal-username">{user.username}</span>
            </Link>

            <div className="review-modal-rating-row">
              {rating != null && (
                <span className="review-modal-rating">★ {rating}</span>
              )}
              {isEdited && <EditedBadge className="review-modal-edited" />}
            </div>
          </div>
        </div>

        {/* Body: full review text */}
        <div className="review-modal-body">
          {content ? (
            <p>{content}</p>
          ) : (
            <p className="review-modal-no-content">No written review.</p>
          )}
        </div>

        {/* Footer: actions */}
        <div className="review-modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handleMediaNav}>
            View media →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewCarousel({ reviews = [] }) {
  const [selected, setSelected] = useState(null);

  if (reviews.length === 0) {
    return (
      <p className="review-carousel-empty">
        No reviews yet. Be the first to review something in your collection!
      </p>
    );
  }

  return (
    <div className="review-carousel">
      <div className="review-carousel-track">
        {reviews.map((review) => {
          const { Collection: col, User: user } = review;
          if (!col || !user) return null;

          return (
            <article className="review-card" key={review.id}>
              {/* Top: cover + meta */}
              <div className="review-card-top">
                <Link
                  to={`/media/${col.mediaType}/${col.externalId}`}
                  className="review-card-cover-link"
                >
                  <img
                    src={
                      col.coverUrl ||
                      `https://placehold.co/56x80/1e1e2a/7c7a8a?text=${encodeURIComponent(col.mediaType)}`
                    }
                    alt={col.title}
                    loading="lazy"
                  />
                </Link>

                <div className="review-card-meta">
                  {/* Author */}
                  <Link
                    to={`/users/${user.username}`}
                    className="review-card-author"
                  >
                    <Avatar src={user.avatar} username={user.username} />
                    <span className="review-card-username">
                      {user.username}
                    </span>
                  </Link>

                  {/* Media title */}
                  <Link
                    to={`/media/${col.mediaType}/${col.externalId}`}
                    className="review-card-title-link"
                  >
                    {col.title}
                  </Link>

                  {/* Badge + rating + edited */}
                  <div className="review-card-rating-row">
                    <span className={`badge badge-${col.mediaType}`}>
                      {col.mediaType}
                    </span>
                    {review.rating != null && (
                      <span className="review-card-rating">
                        ★ {review.rating}
                      </span>
                    )}
                    {review.isEdited && <EditedBadge />}
                  </div>
                </div>
              </div>

              {/* Body: clamped content */}
              <div className="review-card-body">
                {review.content ? (
                  <p className="review-card-content">{review.content}</p>
                ) : (
                  <p className="review-card-content-empty">
                    Rating only — no written review.
                  </p>
                )}

                <button
                  className="review-card-read-btn"
                  onClick={() => setSelected(review)}
                >
                  read full ↗
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (
        <ReviewModal review={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
