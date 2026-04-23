import { useEffect } from "react";
import { useParams, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useState } from "react";
import { addToCollection } from "../features/collection/collectionSlice";
import { BASE_URL } from "../constants/url";

const STATUSES = ["plan", "ongoing", "completed", "dropped"];
const STATUS_LABELS = {
  plan: "Plan to Watch",
  ongoing: "Ongoing",
  completed: "Completed",
  dropped: "Dropped",
};

/* ── helpers ─────────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d)
    ? dateStr
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function formatUnix(ts) {
  if (!ts) return null;
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── sub-components ──────────────────────────────────────── */
function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="media-meta-row">
      <span className="media-meta-label">{label}</span>
      <span className="media-meta-value">{value}</span>
    </div>
  );
}

function AnimeDetails({ m }) {
  const studios = m.studios
    ?.map((s) => s.name)
    .filter(Boolean)
    .join(", ");
  const producers = m.producers
    ?.map((p) => p.name)
    .filter(Boolean)
    .join(", ");
  const themes = m.themes
    ?.map((t) => t.name)
    .filter(Boolean)
    .join(", ");
  const demographics = m.demographics
    ?.map((d) => d.name)
    .filter(Boolean)
    .join(", ");
  const aired = m.aired?.string || null;

  return (
    <div className="media-meta-grid">
      <MetaRow label="Type" value={m.type} />
      <MetaRow
        label="Episodes"
        value={m.episodes ? `${m.episodes} eps` : "Unknown"}
      />
      <MetaRow label="Status" value={m.status} />
      <MetaRow label="Aired" value={aired} />
      <MetaRow
        label="Season"
        value={
          m.season && m.year
            ? `${m.season.charAt(0).toUpperCase() + m.season.slice(1)} ${m.year}`
            : null
        }
      />
      <MetaRow label="Studios" value={studios} />
      <MetaRow label="Producers" value={producers} />
      <MetaRow label="Rating" value={m.rating} />
      <MetaRow label="Themes" value={themes} />
      <MetaRow label="Demographics" value={demographics} />
      {m.rank && <MetaRow label="Rank" value={`#${m.rank}`} />}
      {m.scored_by && (
        <MetaRow
          label="Scored by"
          value={`${m.scored_by.toLocaleString()} users`}
        />
      )}
    </div>
  );
}

function MangaDetails({ m }) {
  const authors = m.authors
    ?.map((a) => a.name)
    .filter(Boolean)
    .join(", ");
  const themes = m.themes
    ?.map((t) => t.name)
    .filter(Boolean)
    .join(", ");
  const demographics = m.demographics
    ?.map((d) => d.name)
    .filter(Boolean)
    .join(", ");
  const serializations = m.serializations
    ?.map((s) => s.name)
    .filter(Boolean)
    .join(", ");
  const published = m.published?.string || null;

  return (
    <div className="media-meta-grid">
      <MetaRow label="Type" value={m.type} />
      <MetaRow
        label="Chapters"
        value={m.chapters ? `${m.chapters} ch` : "Unknown"}
      />
      <MetaRow label="Volumes" value={m.volumes ? `${m.volumes} vol` : null} />
      <MetaRow label="Status" value={m.status} />
      <MetaRow label="Published" value={published} />
      <MetaRow label="Authors" value={authors} />
      <MetaRow label="Serialization" value={serializations} />
      <MetaRow label="Themes" value={themes} />
      <MetaRow label="Demographics" value={demographics} />
      {m.rank && <MetaRow label="Rank" value={`#${m.rank}`} />}
      {m.scored_by && (
        <MetaRow
          label="Scored by"
          value={`${m.scored_by.toLocaleString()} users`}
        />
      )}
    </div>
  );
}

function GameDetails({ m }) {
  const developers = m.involved_companies
    ?.filter((c) => c.developer)
    .map((c) => c.company?.name)
    .filter(Boolean)
    .join(", ");
  const publishers = m.involved_companies
    ?.filter((c) => c.publisher)
    .map((c) => c.company?.name)
    .filter(Boolean)
    .join(", ");
  const platforms = m.platforms
    ?.map((p) => p.name)
    .filter(Boolean)
    .join(", ");
  const themes = m.themes
    ?.map((t) => t.name)
    .filter(Boolean)
    .join(", ");
  const releaseDate = formatUnix(m.first_release_date);

  return (
    <div className="media-meta-grid">
      <MetaRow label="Release date" value={releaseDate} />
      <MetaRow label="Developers" value={developers} />
      <MetaRow label="Publishers" value={publishers} />
      <MetaRow label="Platforms" value={platforms} />
      <MetaRow label="Themes" value={themes} />
      {m.rating_count && (
        <MetaRow
          label="Rated by"
          value={`${m.rating_count.toLocaleString()} users`}
        />
      )}
    </div>
  );
}

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
  const storyline = type === "game" ? m.storyline : null;

  return (
    <div className="media-detail-page">
      {/* Hero */}
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

      {/* Meta details */}
      <section className="media-detail-section">
        <h2 className="media-detail-section-title">Details</h2>
        {type === "anime" && <AnimeDetails m={m} />}
        {type === "manga" && <MangaDetails m={m} />}
        {type === "game" && <GameDetails m={m} />}
      </section>

      {/* Synopsis */}
      {synopsis && (
        <section className="media-detail-section">
          <h2 className="media-detail-section-title">Synopsis</h2>
          <p className="media-detail-body-text">{synopsis}</p>
        </section>
      )}

      {/* Storyline (game only) */}
      {storyline && (
        <section className="media-detail-section">
          <h2 className="media-detail-section-title">Storyline</h2>
          <p className="media-detail-body-text">{storyline}</p>
        </section>
      )}

      {/* Reviews */}
      <section className="media-detail-section">
        <h2 className="media-detail-section-title">
          Questivate Reviews
          {reviews.length > 0 && (
            <span className="reviews-count"> ({reviews.length})</span>
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

      {/* Add modal */}
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
                      {STATUS_LABELS[s]}
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
