// src/components/AdSlot.js – in-app sponsored cards (revenue stream: in-app ads).
// Ads come from the admin dashboard; Premium users get an empty list (ad-free) from the server.
import React, { useEffect, useRef, useState } from "react";
import { adsAPI } from "../services/businessApi";
import { useLang } from "../i18n/LanguageContext";
import { resolveMediaUrl } from "../config";

export default function AdSlot({ placement = "home", className = "" }) {
  const { t, lang } = useLang();
  const [ads, setAds] = useState([]);
  const counted = useRef(new Set());

  useEffect(() => {
    let alive = true;
    adsAPI.list(placement).then((res) => { if (alive && res.success) setAds(res.data || []); }).catch(() => {});
    return () => { alive = false; };
  }, [placement]);

  useEffect(() => {
    ads.forEach((a) => { if (!counted.current.has(a.id)) { counted.current.add(a.id); adsAPI.impression(a.id).catch(() => {}); } });
  }, [ads]);

  if (!ads.length) return null;
  const open = (a) => {
    adsAPI.click(a.id).catch(() => {});
    if (a.link_url && /^https?:\/\//i.test(a.link_url)) window.open(a.link_url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className={`ad-slot ${className}`} aria-label={t("ads.sponsored")}>
      {ads.map((a) => (
        <article key={a.id} className="ad-card" onClick={() => open(a)} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") open(a); }}>
          {a.image_url && <img src={resolveMediaUrl(a.image_url)} alt="" loading="lazy" />}
          <div>
            <span className="ad-tag">{t("ads.sponsored")}</span>
            <strong>{(lang === "ar" && a.title_ar) || a.title}</strong>
            {(a.body || a.body_ar) && <p>{(lang === "ar" && a.body_ar) || a.body}</p>}
          </div>
        </article>
      ))}
    </div>
  );
}
