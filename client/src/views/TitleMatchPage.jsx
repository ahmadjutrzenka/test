import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTitleMatch,
  addExcluded,
  clearSession,
} from "../features/recommendation/recommendationSlice";
import { addToCollection } from "../features/collection/collectionSlice";

const STATUSES = ["plan", "ongoing", "completed", "dropped"];
const MEDIA_TYPES = ["anime", "manga", "game"];

export default function TitleMatchPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.collection);
  const { titleResults, loading, error, excludedThisSession } = useSelector(
    (s) => s.recommendation,
  );
  const [addModal, setAddModal] = useState(null);

  const source = items.find((c) => String(c.id) === String(id));

  useEffect(() => {
    if (id) {
      dispatch(clearSession());
      dispatch(fetchTitleMatch(Number(id)));
    }
  }, [id, dispatch]);

  const handleSearchAgain = (type) => {
    const currentTitles = (titleResults[type] || []).map((r) => r.title);
    dispatch(addExcluded({ type, titles: currentTitles }));
    const excludeTitles = [
      ...Object.values(excludedThisSession).flat(),
      ...currentTitles,
    ];
    dispatch(fetchTitleMatch(Number(id), excludeTitles));
  };

  const handleAddSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    dispatch(
      addToCollection({
        mediaType: addModal.mediaType,
        externalId: String(addModal.externalId),
        title: addModal.title,
        coverUrl: addModal.coverUrl || null,
        genres: [],
        synopsis: null,
        score: null,
        status: fd.get("status"),
      }),
    );
    setAddModal(null);
  };

  const hasResults = MEDIA_TYPES.some((t) => titleResults[t]?.length > 0);

  return (
    <div className="vibe-page">
      <Link
        to="/collections"
        className="btn btn-ghost"
        style={{ alignSelf: "flex-start" }}
      >
        ← Back to collections
      </Link>

      {source && (
        <div className="title-match-source">
          {source.coverUrl && (
            <img
              src={source.coverUrl}
              alt={source.title}
              className="title-match-cover"
            />
          )}
          <div>
            <p className="title-match-label">Finding titles similar to</p>
            <h1 className="vibe-title">{source.title}</h1>
            <span className={`badge badge-${source.mediaType}`}>
              {source.mediaType}
            </span>
          </div>
        </div>
      )}

      {loading && (
        <p className="page-loading">AI is finding similar titles… (~15s)</p>
      )}
      {error && <p className="page-error">{error}</p>}

      {!loading &&
        hasResults &&
        MEDIA_TYPES.map((type) => {
          const list = titleResults[type] || [];
          if (list.length === 0) return null;
          return (
            <section key={type} className="rec-section">
              <div className="section-header">
                <span className={`badge badge-${type}`}>{type}</span>
                <button
                  className="btn btn-ghost rec-again-btn"
                  onClick={() => handleSearchAgain(type)}
                >
                  Search again ↻
                </button>
              </div>
              <div className="rec-grid">
                {list.map((item, i) => (
                  <div key={i} className="rec-card">
                    {item.coverUrl && (
                      <img
                        src={item.coverUrl}
                        alt={item.title}
                        className="rec-card-cover"
                      />
                    )}
                    <div className="rec-card-body">
                      <p className="rec-card-title">{item.title}</p>
                      <p className="rec-card-reason">{item.reason}</p>
                      <button
                        className="btn btn-secondary rec-add-btn"
                        onClick={() =>
                          setAddModal({ ...item, mediaType: type })
                        }
                      >
                        + Add to collection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      {addModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setAddModal(null)}
        >
          <div className="modal">
            <h2 className="modal-title">Add — {addModal.title}</h2>
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
