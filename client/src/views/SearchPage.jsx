import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { searchMedia } from "../features/search/searchSlice";
import { addToCollection } from "../features/collection/collectionSlice";
import "./SearchPage.css";

const SEARCH_TYPES = ["all", "anime", "manga", "game", "user"];
const STATUSES = ["plan", "ongoing", "completed", "dropped"];

export default function SearchPage() {
  const dispatch = useDispatch();
  const { results, loading } = useSelector((s) => s.search);
  const { items: myCollection } = useSelector((s) => s.collection);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [addModal, setAddModal] = useState(null); // media item to add

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) dispatch(searchMedia(q.trim(), type));
  };

  const isInCollection = (externalId, mediaType) =>
    myCollection.some(
      (c) => c.externalId === String(externalId) && c.mediaType === mediaType,
    );

  const handleAddSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    dispatch(
      addToCollection({
        mediaType: addModal.mediaType,
        externalId: String(addModal.externalId),
        title: addModal.title,
        coverUrl: addModal.coverUrl || null,
        genres: addModal.genres || [],
        synopsis: addModal.synopsis || null,
        score: addModal.score || null,
        status: fd.get("status"),
      }),
    );
    setAddModal(null);
  };

  const mediaTypes = ["anime", "manga", "game"];

  return (
    <div className="search-page">
      <h1 className="search-title">Search</h1>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="input search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search anime, manga, games, or users…"
        />
        <div className="search-type-tabs">
          {SEARCH_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              className={`type-tab ${type === t ? "active" : ""}`}
              onClick={() => setType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !q.trim()}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {/* User results */}
      {results.users?.length > 0 && (
        <section className="search-section">
          <h2 className="search-section-title">Users</h2>
          <div className="user-results">
            {results.users.map((u) => (
              <Link
                to={`/users/${u.username}`}
                key={u.id}
                className="user-result-card"
              >
                {u.avatar ? (
                  <img
                    src={u.avatar}
                    alt={u.username}
                    className="user-result-avatar"
                  />
                ) : (
                  <div className="user-result-avatar-placeholder">
                    {u.username[0].toUpperCase()}
                  </div>
                )}
                <span className="user-result-name">{u.username}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Media results */}
      {mediaTypes
        .filter((t) => type === "all" || type === t)
        .map((mt) => {
          const list = results[mt] || [];
          if (list.length === 0) return null;
          return (
            <section className="search-section" key={mt}>
              <h2 className="search-section-title">
                <span className={`badge badge-${mt}`}>{mt}</span>
              </h2>
              <div className="search-media-grid">
                {list.map((item) => {
                  const inCol = isInCollection(item.externalId, item.mediaType);
                  return (
                    <div className="search-media-card" key={item.externalId}>
                      <Link
                        to={`/media/${item.mediaType}/${item.externalId}`}
                        className="search-media-cover-link"
                      >
                        <img
                          src={
                            item.coverUrl ||
                            `https://placehold.co/100x145/1e1e2a/7c7a8a?text=${mt}`
                          }
                          alt={item.title}
                          loading="lazy"
                        />
                      </Link>
                      <div className="search-media-info">
                        <Link
                          to={`/media/${item.mediaType}/${item.externalId}`}
                          className="search-media-title"
                        >
                          {item.title}
                        </Link>
                        {item.score != null && (
                          <span className="search-media-score">
                            ★ {item.score}
                          </span>
                        )}
                        {item.genres?.length > 0 && (
                          <p className="search-media-genres">
                            {item.genres.slice(0, 3).join(" · ")}
                          </p>
                        )}
                        {inCol ? (
                          <span className="search-in-collection">
                            ✓ In collection
                          </span>
                        ) : (
                          <button
                            className="btn btn-secondary search-add-btn"
                            onClick={() => setAddModal(item)}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

      {/* Add modal */}
      {addModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setAddModal(null)}
        >
          <div className="modal">
            <h2 className="modal-title">Add to collection</h2>
            <p className="search-modal-subtitle">{addModal.title}</p>
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
                  onClick={() => setAddModal(null)}
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
