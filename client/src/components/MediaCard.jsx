import { Link } from "react-router";

export default function MediaCard({
  id,
  title,
  coverUrl,
  mediaType,
  status,
  score,
  isFavorite,
  externalId,
  onEdit,
  onRemove,
}) {
  const badgeClass = `badge badge-${mediaType}`;
  const statusClass = `status-chip status-${status}`;

  const STATUS_LABELS = {
    plan: "Planned",
    ongoing: "Ongoing",
    completed: "Completed",
    dropped: "Dropped",
  };

  return (
    <div className="media-card">
      {/* Cover */}
      <Link
        to={`/media/${mediaType}/${externalId}`}
        className="media-card-cover-link"
      >
        <div className="media-card-cover">
          <img
            src={
              coverUrl ||
              `https://placehold.co/150x220/1e1e2a/7c7a8a?text=${encodeURIComponent(mediaType)}`
            }
            alt={title}
            loading="lazy"
          />
          {isFavorite && (
            <span className="media-card-star" aria-label="Favorite">
              ★
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="media-card-body">
        <Link
          to={`/media/${mediaType}/${externalId}`}
          className="media-card-title"
        >
          {title}
        </Link>

        <div className="media-card-meta">
          <span className={badgeClass}>
            {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
          </span>
          {score != null && (
            <span className="media-card-score">
              ★ {typeof score === "number" ? score.toFixed(1) : score}
            </span>
          )}
        </div>

        {status && (
          <span className={statusClass}>{STATUS_LABELS[status] ?? status}</span>
        )}

        {/* Action buttons — hanya muncul kalau prop dikirim */}
        {(onEdit || onRemove) && (
          <div className="media-card-actions">
            {onEdit && (
              <button className="btn btn-ghost media-card-btn" onClick={onEdit}>
                Edit
              </button>
            )}
            {onRemove && (
              <button
                className="btn btn-danger media-card-btn"
                onClick={onRemove}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
