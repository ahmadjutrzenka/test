import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVibeMatch,
  addExcluded,
  clearSession,
} from "../features/recommendation/recommendationSlice";
import { addToCollection } from "../features/collection/collectionSlice";

const MEDIA_TYPES = ["anime", "manga", "game"];
const STATUSES = ["plan", "ongoing", "completed", "dropped"];

export default function VibeMatchPage() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.collection);
  const { vibeResults, loading, error, excludedThisSession } = useSelector(
    (s) => s.recommendation,
  );

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ anime: [], manga: [], game: [] });
  const [targetTypes, setTargetTypes] = useState([]);
  const [addModal, setAddModal] = useState(null);

  const groupedItems = {
    anime: items.filter((c) => c.mediaType === "anime"),
    manga: items.filter((c) => c.mediaType === "manga"),
    game: items.filter((c) => c.mediaType === "game"),
  };

  const toggleItem = (type, id) => {
    setSelected((prev) => {
      const arr = prev[type];
      return {
        ...prev,
        [type]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id],
      };
    });
  };

  const toggleAllType = (type) => {
    const all = groupedItems[type].map((c) => c.id);
    setSelected((prev) => ({
      ...prev,
      [type]: prev[type].length === all.length ? [] : all,
    }));
  };

  const toggleTarget = (t) => {
    if (t === "all") {
      setTargetTypes(
        targetTypes.length === 3 ? [] : ["anime", "manga", "game"],
      );
    } else {
      setTargetTypes((prev) =>
        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
      );
    }
  };

  const totalSelected =
    selected.anime.length + selected.manga.length + selected.game.length;

  const handleSearch = () => {
    const referenceIds = [
      ...selected.anime,
      ...selected.manga,
      ...selected.game,
    ];
    const excludeTitles = Object.values(excludedThisSession).flat();
    dispatch(fetchVibeMatch(referenceIds, targetTypes, excludeTitles));
  };

  const handleSearchAgain = (type) => {
    const currentTitles = (vibeResults[type] || []).map((r) => r.title);
    dispatch(addExcluded({ type, titles: currentTitles }));
    const referenceIds = [
      ...selected.anime,
      ...selected.manga,
      ...selected.game,
    ];
    const excludeTitles = [
      ...Object.values(excludedThisSession).flat(),
      ...currentTitles,
    ];
    dispatch(fetchVibeMatch(referenceIds, targetTypes, excludeTitles));
  };

  const handleNewSearch = () => {
    dispatch(clearSession());
    setStep(1);
    setSelected({ anime: [], manga: [], game: [] });
    setTargetTypes([]);
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

  const hasResults = MEDIA_TYPES.some((t) => vibeResults[t]?.length > 0);

  return (
    <div className="vibe-page">
      {/* Progress bar */}
      {step < 3 && (
        <div className="vibe-steps">
          {["Pick references", "Choose output", "Get recommendations"].map(
            (label, i) => (
              <div
                key={i}
                className={`vibe-step ${step === i + 1 ? "active" : ""} ${step > i + 1 ? "done" : ""}`}
              >
                <div className="vibe-step-dot">
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span>{label}</span>
              </div>
            ),
          )}
        </div>
      )}

      {/* Step 1 — Pick references */}
      {step === 1 && (
        <div className="vibe-step-content">
          <h1 className="vibe-title">Pick your references</h1>
          <p className="vibe-subtitle">
            Select titles from your collection. AI will find the vibe.
          </p>

          {MEDIA_TYPES.map((type) => {
            const group = groupedItems[type];
            if (group.length === 0) return null;
            const allChecked = selected[type].length === group.length;
            const someChecked = selected[type].length > 0 && !allChecked;
            return (
              <div key={type} className="vibe-group">
                <div className="vibe-group-header">
                  <label className="vibe-select-all">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={() => toggleAllType(type)}
                    />
                    <span className={`badge badge-${type}`}>{type}</span>
                    <span className="vibe-group-count">
                      {selected[type].length}/{group.length} selected
                    </span>
                  </label>
                </div>
                <div className="vibe-group-items">
                  {group.map((c) => (
                    <label
                      key={c.id}
                      className={`vibe-item ${selected[type].includes(c.id) ? "checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected[type].includes(c.id)}
                        onChange={() => toggleItem(type, c.id)}
                      />
                      {c.coverUrl && (
                        <img
                          src={c.coverUrl}
                          alt={c.title}
                          className="vibe-item-cover"
                        />
                      )}
                      <span className="vibe-item-title">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="vibe-step-footer">
            <button
              className="btn btn-primary"
              disabled={totalSelected === 0}
              onClick={() => setStep(2)}
            >
              Next → ({totalSelected} selected)
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Output type */}
      {step === 2 && (
        <div className="vibe-step-content">
          <h1 className="vibe-title">What do you want?</h1>
          <p className="vibe-subtitle">
            Pick which media types to get recommendations for.
          </p>

          <div className="output-grid">
            {[...MEDIA_TYPES, "all"].map((t) => {
              const isAll = t === "all";
              const active = isAll
                ? targetTypes.length === 3
                : targetTypes.includes(t);
              return (
                <button
                  key={t}
                  className={`output-card ${active ? "active" : ""}`}
                  onClick={() => toggleTarget(t)}
                >
                  <div className="output-card-icon">
                    {t === "anime" && (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
                      </svg>
                    )}
                    {t === "manga" && (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="12"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M9 3h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                    {t === "game" && (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="6"
                          width="20"
                          height="12"
                          rx="3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M8 12h4M10 10v4M16 12h.01M14 10.5h.01"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {t === "all" && (
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 3L3 8l9 5 9-5-9-5z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M3 16l9 5 9-5M3 12l9 5 9-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="output-card-label">
                    {t === "all"
                      ? "All media"
                      : t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                  <span className="output-card-sub">
                    {t === "all" ? "up to 9 results" : "up to 3 results"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="vibe-step-footer">
            <button className="btn btn-ghost" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              className="btn btn-primary"
              disabled={targetTypes.length === 0 || loading}
              onClick={() => {
                setStep(3);
                handleSearch();
              }}
            >
              {loading ? "Finding your vibe…" : "Find my vibe →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 3 && (
        <div className="vibe-results">
          <div className="vibe-results-header">
            <h1 className="vibe-title">Your recommendations</h1>
            <button className="btn btn-ghost" onClick={handleNewSearch}>
              New search
            </button>
          </div>

          {loading && (
            <p className="page-loading">
              AI is analysing your vibe… (this takes ~15s)
            </p>
          )}
          {error && <p className="page-error">{error}</p>}

          {!loading &&
            hasResults &&
            targetTypes.map((type) => {
              const list = vibeResults[type] || [];
              if (list.length === 0) return null;
              return (
                <section key={type} className="rec-section">
                  <div className="section-header">
                    <span className={`badge badge-${type}`}>{type}</span>
                    <button
                      className="btn btn-ghost rec-again-btn"
                      onClick={() => handleSearchAgain(type)}
                    >
                      Search again for {type} ↻
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
        </div>
      )}

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
