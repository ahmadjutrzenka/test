import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCollections,
  updateCollection,
  removeFromCollection,
} from "../features/collection/collectionSlice";
import { createReview, updateReview } from "../features/review/reviewSlice";
import MediaCard from "../components/MediaCard";
import "./CollectionsPage.css";

const TYPES = ["all", "anime", "manga", "game"];
const STATUSES = ["plan", "ongoing", "completed", "dropped"];

export default function CollectionsPage() {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((s) => s.collection);
  const [typeFilter, setTypeFilter] = useState("all");
  const [editModal, setEditModal] = useState(null); // collection item being edited
  const [reviewModal, setReviewModal] = useState(null); // collection item getting reviewed

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  const filtered =
    typeFilter === "all"
      ? items
      : items.filter((c) => c.mediaType === typeFilter);

  const handleRemove = (id) => {
    if (window.confirm("Remove this title from your collection?")) {
      dispatch(removeFromCollection(id));
    }
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    dispatch(
      updateCollection(editModal.id, {
        status: fd.get("status"),
        isFavorite: fd.get("isFavorite") === "on",
      }),
    );
    setEditModal(null);
  };

  const handleReviewSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      collectionId: reviewModal.id,
      rating: fd.get("rating") ? Number(fd.get("rating")) : null,
      content: fd.get("content") || null,
    };
    if (reviewModal.existingReviewId) {
      dispatch(updateReview(reviewModal.existingReviewId, payload));
    } else {
      dispatch(createReview(payload));
    }
    setReviewModal(null);
  };

  return (
    <div className="collections-page">
      <div className="collections-header">
        <h1>My Collections</h1>
        <span className="collections-count">{items.length} titles</span>
      </div>

      <div className="type-tabs">
        {TYPES.map((t) => (
          <button
            key={t}
            className={`type-tab ${typeFilter === t ? "active" : ""}`}
            onClick={() => setTypeFilter(t)}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="type-tab-count">
              {t === "all"
                ? items.length
                : items.filter((c) => c.mediaType === t).length}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="page-error">{error}</p>}

      {loading && items.length === 0 ? (
        <p className="page-loading">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="page-empty">
          No {typeFilter === "all" ? "" : typeFilter + " "}titles yet.
        </p>
      ) : (
        <div className="card-grid collections-grid">
          {filtered.map((c) => (
            <div key={c.id} className="collection-item">
              <MediaCard
                id={c.id}
                title={c.title}
                coverUrl={c.coverUrl}
                mediaType={c.mediaType}
                status={c.status}
                score={c.score}
                isFavorite={c.isFavorite}
                externalId={c.externalId}
                onEdit={() => setEditModal(c)}
                onRemove={() => handleRemove(c.id)}
              />
              <button
                className="btn btn-ghost collection-review-btn"
                onClick={() => setReviewModal(c)}
              >
                {c.Review ? "Edit review" : "+ Review"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setEditModal(null)}
        >
          <div className="modal">
            <h2 className="modal-title">Edit — {editModal.title}</h2>
            <form onSubmit={handleEditSave} className="modal-form">
              <label className="form-label">
                Status
                <select
                  name="status"
                  defaultValue={editModal.status}
                  className="input"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-label checkbox-label">
                <input
                  type="checkbox"
                  name="isFavorite"
                  defaultChecked={editModal.isFavorite}
                />
                Mark as Favorite (max 5)
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setReviewModal(null)}
        >
          <div className="modal">
            <h2 className="modal-title">Review — {reviewModal.title}</h2>
            <form onSubmit={handleReviewSave} className="modal-form">
              <label className="form-label">
                Rating (0.5 – 10)
                <input
                  type="number"
                  name="rating"
                  min="0.5"
                  max="10"
                  step="0.5"
                  defaultValue={reviewModal.Review?.rating ?? ""}
                  className="input"
                  placeholder="Optional"
                />
              </label>
              <label className="form-label">
                Review
                <textarea
                  name="content"
                  rows={4}
                  className="input textarea"
                  defaultValue={reviewModal.Review?.content ?? ""}
                  placeholder="Write your thoughts… (optional)"
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setReviewModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
