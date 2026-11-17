// src/Learn.js – Learning trails, quizzes and heritage badges.
// Content comes from the existing destinations API (falls back to the bundled list).
// Progress is stored on the device (localStorage); no backend change needed.
import React, { useEffect, useMemo, useState } from "react";
import { FaGraduationCap, FaCheckCircle, FaRegCircle, FaMedal, FaLock } from "react-icons/fa";
import { destinationsAPI, getUser } from "./services/api";
import { DESTINATIONS, mapApiDestination, getLocalImage } from "./Destinations";
import { learningAPI } from "./services/businessApi";
import AdSlot from "./components/AdSlot";
import { useLang } from "./i18n/LanguageContext";
import { mailtoLink } from "./config";

const storageKey = () => `misfar_learn_${getUser()?.id || "guest"}`;
const loadProgress = () => {
  try { return JSON.parse(localStorage.getItem(storageKey())) || { visited: {}, best: {} }; }
  catch { return { visited: {}, best: {} }; }
};

// Seeded static destinations have no category; derive a trail from the area so the page works offline too.
const trailOf = (d) => d.category || "Oman";

const shuffle = (arr, seed) => {
  const a = [...arr]; let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// Build multiple-choice questions only from real destination fields.
function buildQuiz(stops, all, t, tv) {
  const questions = [];
  const areas = Array.from(new Set(all.map((d) => d.area).filter(Boolean)));
  const cats = Array.from(new Set(all.map((d) => d.category).filter(Boolean)));
  stops.forEach((d, i) => {
    if (d.area && areas.length >= 3) {
      const wrong = shuffle(areas.filter((a) => a !== d.area), i + 3).slice(0, 3);
      questions.push({
        text: t("learn.q_where", { name: tv(d.name) }),
        answer: tv(d.area),
        options: shuffle([d.area, ...wrong], i + 7).map(tv),
      });
    }
    if (d.category && cats.length >= 3) {
      const wrong = shuffle(cats.filter((c) => c !== d.category), i + 5).slice(0, 3);
      questions.push({
        text: t("learn.q_category", { name: tv(d.name) }),
        answer: tv(d.category),
        options: shuffle([d.category, ...wrong], i + 11).map(tv),
      });
    }
  });
  return questions.slice(0, 5);
}

function Quiz({ trailId, stops, all, onScore, t, tv, fixed }) {
  const questions = useMemo(() => fixed || buildQuiz(stops, all, t, tv), [fixed, stops, all, t, tv]);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (questions.length < (fixed ? 1 : 2)) return <p className="learn-muted">{t("learn.quiz_unavailable")}</p>;
  if (!started) {
    return (
      <div className="quiz-box">
        <p>{t("learn.quiz_intro", { n: questions.length })}</p>
        <button className="learn-btn" onClick={() => setStarted(true)}>{t("learn.quiz_start")}</button>
      </div>
    );
  }
  if (done) {
    return (
      <div className="quiz-box">
        <p className="quiz-score">{t("learn.score", { score, total: questions.length })}</p>
        <button className="learn-btn" onClick={() => { setI(0); setPicked(null); setScore(0); setDone(false); }}>{t("learn.retake")}</button>
      </div>
    );
  }
  const q = questions[i];
  const choose = (opt) => { if (picked !== null) return; setPicked(opt); if (opt === q.answer) setScore((s) => s + 1); };
  const next = () => {
    if (i + 1 >= questions.length) { setDone(true); onScore(trailId, score, questions.length); }
    else { setI(i + 1); setPicked(null); }
  };
  return (
    <div className="quiz-box">
      <div className="quiz-counter">{t("learn.q_counter", { i: i + 1, n: questions.length })}</div>
      <h4>{q.text}</h4>
      <div className="quiz-options">
        {q.options.map((o) => (
          <button key={o} disabled={picked !== null}
            className={`quiz-opt ${picked !== null ? (o === q.answer ? "right" : o === picked ? "wrong" : "") : ""}`}
            onClick={() => choose(o)}>{o}</button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className={picked === q.answer ? "quiz-ok" : "quiz-bad"}>
            {picked === q.answer ? t("learn.correct") : t("learn.wrong", { answer: q.answer })}
          </p>
          <button className="learn-btn" onClick={next}>{i + 1 >= questions.length ? t("learn.finish") : t("learn.next")}</button>
        </>
      )}
    </div>
  );
}

function Stop({ d, visited, toggle, onOpenDestination, t, tv, hasLink = true }) {
  const [more, setMore] = useState(false);
  const text = d.overview || "";
  const long = text.length > 180;
  return (
    <article className={`stop ${visited ? "done" : ""}`}>
      <img src={d.image} alt={tv(d.name)} loading="lazy" />
      <div className="stop-body">
        <h4>{tv(d.name)}</h4>
        <span className="stop-area">{tv(d.area)}</span>
        {text && <p>{more || !long ? text : `${text.slice(0, 180)}…`}</p>}
        {long && <button className="link-btn" onClick={() => setMore(!more)}>{more ? t("learn.show_less") : t("learn.show_more")}</button>}
        <div className="stop-actions">
          <button className={`learn-btn ${visited ? "ghost-ok" : ""}`} onClick={() => toggle(d.id)} aria-pressed={visited}>
            {visited ? <FaCheckCircle /> : <FaRegCircle />} {visited ? t("learn.visited") : t("learn.mark_visited")}
          </button>
          {hasLink && <button className="learn-btn ghost" onClick={() => onOpenDestination(d)}>{t("learn.open_place")}</button>}
        </div>
      </div>
    </article>
  );
}

export default function Learn({ onNavigate = () => {}, onOpenDestination = () => {} }) {
  const { t, tv, lang } = useLang();
  const [dests, setDests] = useState(DESTINATIONS);
  const [adminTrails, setAdminTrails] = useState([]);
  const [progress, setProgress] = useState(loadProgress);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    destinationsAPI.getAll({ limit: 50 })
      .then((res) => { if (alive && res.success && res.data?.length) setDests(res.data.map(mapApiDestination)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // trails written by the Misfar team in the admin dashboard (new endpoint /api/learning)
  useEffect(() => {
    let alive = true;
    learningAPI.list().then((r) => { if (alive && r.success) setAdminTrails(r.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => { try { localStorage.setItem(storageKey(), JSON.stringify(progress)); } catch {} }, [progress]);

  const trails = useMemo(() => {
    const map = {};
    dests.forEach((d) => { const k = trailOf(d); (map[k] = map[k] || []).push(d); });
    const auto = Object.entries(map).map(([id, stops]) => ({ id, stops }));
    const L = (o, f) => (lang === "ar" && o[`${f}_ar`]) || o[f];
    const curated = adminTrails
      .filter((tr) => tr.stops.length > 0)
      .map((tr) => ({
        id: `a:${tr.id}`, title: L(tr, "title"),
        stops: tr.stops.map((s) => {
          const d = dests.find((x) => x.id === s.destination_id);
          return { id: `s:${s.id}`, name: L(s, "title"), area: d?.area || "", image: d?.image || getLocalImage(s.destination_name || ""), overview: L(s, "content") || d?.overview || "", dest: d || null };
        }),
        questions: tr.questions.map((q) => {
          const labels = (q.options || []).map((o) => (lang === "ar" && o.ar) || o.en);
          return { text: L(q, "question"), options: labels, answer: labels[q.correct_index] };
        }),
      }));
    return [...curated, ...auto];
  }, [dests, adminTrails, lang]);

  useEffect(() => { if (trails.length && !trails.some((x) => x.id === active)) setActive(trails[0].id); }, [trails, active]);

  const trailName = (id) => {
    const cur = trails.find((x) => x.id === id);
    if (cur?.title) return cur.title;
    const k = `learn.trail.${id}`;
    const s = t(k);
    return s === k ? t("learn.trail.generic", { name: tv(id) }) : s;
  };
  const toggle = (id) => setProgress((p) => ({ ...p, visited: { ...p.visited, [id]: !p.visited[id] } }));
  const onScore = (trailId, score, total) =>
    setProgress((p) => ({ ...p, best: { ...p.best, [trailId]: Math.max(p.best[trailId] || 0, Math.round((score / total) * 100)) } }));

  const current = trails.find((x) => x.id === active);
  const doneCount = current ? current.stops.filter((s) => progress.visited[s.id]).length : 0;
  const quizMaster = Object.values(progress.best).some((v) => v === 100);

  return (
    <div className="learn-page page-transition">
      <div className="learn-wrap">
        <header className="learn-hero">
          <FaGraduationCap className="learn-hero-icon" />
          <h1>{t("learn.title")}</h1>
          <p>{t("learn.subtitle")}</p>
          <small>{t("learn.audience")}</small>
        </header>

        {trails.length === 0 ? <p className="learn-muted">{t("learn.empty")}</p> : (
          <>
            <h2 className="learn-h2">{t("learn.trails")}</h2>
            <div className="trail-tabs" role="tablist">
              {trails.map((tr) => {
                const d = tr.stops.filter((s) => progress.visited[s.id]).length;
                return (
                  <button key={tr.id} role="tab" aria-selected={active === tr.id}
                    className={`trail-tab ${active === tr.id ? "active" : ""}`} onClick={() => setActive(tr.id)}>
                    <strong>{trailName(tr.id)}</strong>
                    <span>{d}/{tr.stops.length}</span>
                  </button>
                );
              })}
            </div>

            {current && (
              <section className="trail-panel">
                <div className="trail-head">
                  <h3>{trailName(current.id)} <small>· {t("learn.stops", { n: current.stops.length })}</small></h3>
                  <div className="progress" aria-label={t("learn.progress", { done: doneCount, total: current.stops.length })}>
                    <div className="progress-bar"><i style={{ width: `${(doneCount / current.stops.length) * 100}%` }} /></div>
                    <span>{t("learn.progress", { done: doneCount, total: current.stops.length })}</span>
                  </div>
                </div>
                <div className="stops">
                  {current.stops.map((d) => (
                    <Stop key={d.id} d={d} visited={!!progress.visited[d.id]} toggle={toggle} onOpenDestination={d.dest ? () => onOpenDestination(d.dest) : onOpenDestination} t={t} tv={tv} hasLink={!String(d.id).startsWith("s:") || !!d.dest} />
                  ))}
                </div>
                <h3 className="learn-h3">🧠 {t("learn.quiz")}</h3>
                <Quiz key={current.id + lang} trailId={current.id} stops={current.stops} all={dests} onScore={onScore} t={t} tv={tv} fixed={current.questions} />
              </section>
            )}

            <h2 className="learn-h2"><FaMedal /> {t("learn.badges")}</h2>
            <div className="badges">
              {trails.map((tr) => {
                const earned = tr.stops.length > 0 && tr.stops.every((s) => progress.visited[s.id]);
                return (
                  <div key={tr.id} className={`badge ${earned ? "earned" : ""}`}>
                    <span className="badge-ic">{earned ? <FaMedal /> : <FaLock />}</span>
                    <strong>{t("learn.badge_trail", { trail: trailName(tr.id) })}</strong>
                    <small>{t("learn.badge_trail_desc", { trail: trailName(tr.id) })}</small>
                    <em>{earned ? t("learn.badge_earned") : t("learn.badge_locked")}</em>
                  </div>
                );
              })}
              <div className={`badge ${quizMaster ? "earned" : ""}`}>
                <span className="badge-ic">{quizMaster ? <FaMedal /> : <FaLock />}</span>
                <strong>{t("learn.badge_quiz")}</strong>
                <small>{t("learn.badge_quiz_desc")}</small>
                <em>{quizMaster ? t("learn.badge_earned") : t("learn.badge_locked")}</em>
              </div>
            </div>
            <p className="learn-muted">{t("learn.saved_note")}</p>
          </>
        )}

        <AdSlot placement="learn" />
        <section className="schools-cta">
          <div>
            <h3>{t("learn.schools_title")}</h3>
            <p>{t("learn.schools_body")}</p>
          </div>
          <a className="learn-btn" href={mailtoLink(t("partners.mail_subject", { type: t("partners.t_edu") }), "")}>{t("learn.schools_btn")}</a>
        </section>
      </div>
    </div>
  );
}
