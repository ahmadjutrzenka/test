import { useEffect } from "react";
import { useParams, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useState } from "react";
import { addToCollection } from "../features/collection/collectionSlice";
import { BASE_URL } from "../constants/url";
import "./MediaDetailPage.css";

const STATUSES = ["plan", "ongoing", "completed", "dropped"];

export default function MediaDetailPage() {
  const { type, externalId } = useParams();
  const dispatch = useDispatch();
  const { items: myCollection } = useSelector((s) => s.collection);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addModal, setAddModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/media/${type}/${externalId}`)
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load media.");
        setLoading(false);
      });
  }, [type, externalId]);

  const isInCollection = myCollection.some(
    (c) => c.externalId === String(externalId) && c.mediaType === type,
  );

  const handleAddSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const m = data.mediaInfo;
    dispatch(
      addToCollection({
        mediaType: type,
        externalId: String(externalId),
        title: m.title || m.name,
        coverUrl:
          type === "game"
            ? m.cover?.url
              ? "https:" + m.cover.url.replace("t_thumb", "t_cover_big")
              : null
            : m.images?.jpg?.large_image_url || null,
        genres: (m.genres || []).map((g) => g.name),
        synopsis: m.synopsis || m.summary || null,
        score: m.score || (m.rating ? Math.round(m.rating) / 10 : null),
        status: fd.get("status"),
      }),
    );
    setAddModal(false);
  };

  if (loading) return <p className="page-loading">Loading…</p>;
  if (error) return <p className="page-error">{error}</p>;
  if (!data) return null;

  const { mediaInfo: m, reviews } = data;
  const title = m.title || m.name;
  const coverUrl =
    type === "game"
      ? m.cover?.url
        ? "https:" + m.cover.url.replace("t_thumb", "t_cover_big")
        : null
      : m.images?.jpg?.large_image_url || m.images?.jpg?.image_url;
  const score = m.score || (m.rating ? (m.rating / 10).toFixed(1) : null);
  const genres = (m.genres || []).map((g) => g.name);
  const synopsis = m.synopsis || m.summary;

  return (
    <div className="media-detail-page">
      <div className="media-detail-hero">
        {coverUrl && (
          <img src={coverUrl} alt={title} className="media-detail-cover" />
        )}
        <div className="media-detail-info">
          <span className={`badge badge-${type}`}>{type}</span>
          <h1 className="media-detail-title">{title}</h1>
          {score && <p className="media-detail-score">★ {score}</p>}
          {genres.length > 0 && (
            <div className="media-detail-genres">
              {genres.map((g) => (
                <span key={g} className="genre-chip">
                  {g}
                </span>
              ))}
            </div>
          )}
          {isInCollection ? (
            <span className="media-in-collection">✓ In your collection</span>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setAddModal(true)}
            >
              + Add to collection
            </button>
          )}
        </div>
      </div>

      {synopsis && (
        <section className="media-synopsis">
          <h2>Synopsis</h2>
          <p>{synopsis}</p>
        </section>
      )}

      <section className="media-reviews-section">
        <h2>
          Questivate reviews{" "}
          {reviews.length > 0 && (
            <span className="reviews-count">({reviews.length})</span>
          )}
        </h2>
        {reviews.length === 0 ? (
          <p className="page-empty">No reviews yet for this title.</p>
        ) : (
          <div className="media-reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="media-review-card">
                <Link
                  to={`/users/${r.User.username}`}
                  className="media-review-author"
                >
                  {r.User.avatar ? (
                    <img
                      src={r.User.avatar}
                      alt={r.User.username}
                      className="media-review-avatar"
                    />
                  ) : (
                    <div className="media-review-avatar-placeholder">
                      {r.User.username[0].toUpperCase()}
                    </div>
                  )}
                  <span>{r.User.username}</span>
                </Link>
                <div className="media-review-body">
                  <div className="media-review-meta">
                    {r.rating != null && (
                      <span className="review-rating">★ {r.rating}</span>
                    )}
                    {r.isEdited && (
                      <span className="review-edited">edited</span>
                    )}
                  </div>
                  {r.content && (
                    <p className="media-review-content">{r.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {addModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setAddModal(false)}
        >
          <div className="modal">
            <h2 className="modal-title">Add — {title}</h2>
            <form onSubmit={handleAddSave} className="modal-form">
              <label className="form-label">
                Status
                <select name="status" className="input">
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
