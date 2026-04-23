import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import { searchMedia, clearResults } from "../features/search/searchSlice";
import { addToCollection } from "../features/collection/collectionSlice";

const SEARCH_TYPES = ["all", "anime", "manga", "game", "user"];
const STATUSES = ["plan", "ongoing", "completed", "dropped"];
const STATUS_LABELS = {
  plan: "Plan to Watch",
  ongoing: "Ongoing",
  completed: "Completed",
  dropped: "Dropped",
};

export default function SearchPage() {
  const dispatch = useDispatch();
  const { results, loading } = useSelector((s) => s.search);
  const { items: myCollection } = useSelector((s) => s.collection);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [addModal, setAddModal] = useState(null);

  // Auto-fetch all users when switching to user tab
  useEffect(() => {
    if (type === "user") {
      dispatch(searchMedia("", "user"));
    }
  }, [type, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (type === "user") {
      dispatch(searchMedia(q.trim() || "", "user"));
    } else if (q.trim()) {
      dispatch(searchMedia(q.trim(), type));
    }
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
        <div className="search-input-wrap">
          <input
            className="input search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              type === "user"
                ? "Filter by username…"
                : "Search anime, manga, games, or users…"
            }
          />
          <button
            type="submit"
            className="search-input-btn"
            disabled={loading || (type !== "user" && !q.trim())}
          >
            {loading ? "…" : "Search"}
          </button>
        </div>
        <div className="search-type-tabs">
          {SEARCH_TYPES.map((t) => (
            <button
              type="button"
              key={t}
              className={`type-tab ${type === t ? "active" : ""}`}
              onClick={() => {
                setType(t);
                dispatch(clearResults());
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </form>

      {/* User-only tab — grid 4 kolom */}
      {type === "user" && results.users?.length > 0 && (
        <section className="search-section">
          <h2 className="search-section-title">Users</h2>
          <div className="user-results-grid">
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

      {/* All/media tabs — kolom berdampingan */}
      {type !== "user" &&
        (() => {
          const activeMediaTypes = ["anime", "manga", "game"].filter(
            (t) =>
              (type === "all" || type === t) && (results[t] || []).length > 0,
          );
          const showUsers = results.users?.length > 0;
          if (activeMediaTypes.length === 0 && !showUsers) return null;
          return (
            <div className="search-results-columns">
              {activeMediaTypes.map((mt) => (
                <div key={mt} className="search-results-col">
                  <h2 className="search-section-title">
                    <span className={`badge badge-${mt}`}>
                      {mt.charAt(0).toUpperCase() + mt.slice(1)}
                    </span>
                  </h2>
                  <div className="search-col-items">
                    {(results[mt] || []).map((item) => {
                      const inCol = isInCollection(
                        item.externalId,
                        item.mediaType,
                      );
                      return (
                        <div className="search-col-card" key={item.externalId}>
                          <Link
                            to={`/media/${item.mediaType}/${item.externalId}`}
                            className="search-col-cover-link"
                          >
                            <img
                              src={
                                item.coverUrl ||
                                `https://placehold.co/48x68/1e1e2a/7c7a8a?text=${mt}`
                              }
                              alt={item.title}
                              loading="lazy"
                            />
                          </Link>
                          <div className="search-col-info">
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
                                {item.genres.slice(0, 2).join(" · ")}
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
                </div>
              ))}
              {showUsers && (
                <div className="search-results-col">
                  <h2 className="search-section-title">Users</h2>
                  <div className="search-col-items">
                    {results.users.map((u) => (
                      <Link
                        to={`/users/${u.username}`}
                        key={u.id}
                        className="search-col-user-card"
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
                </div>
              )}
            </div>
          );
        })()}

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
                      {STATUS_LABELS[s]}
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
