import React, { useEffect, useState } from "react";
import "./styles/Activities.css";
import activitiesBg from "./Images/home1.jpg";
import { FaMapMarkerAlt, FaRegCalendarAlt } from "react-icons/fa";
import { activitiesAPI } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
const DEFAULT_ACTIVITIES = [
 {
   id: 1,
   title: "Muscat International Book Fair",
   location: "Muscat – Oman Convention & Exhibition Centre",
   date: "20 February – 1 March 2026",
   description:
     "One of the largest book fairs in the region featuring international and local publishers, author talks, workshops, and cultural panels.",
 },
 {
   id: 2,
   title: "Salalah Khareef (Summer) Festival",
   location: "Salalah, Dhofar Governorate",
   date: "15 July – 31 August 2026",
   description:
     'A long-running cultural and tourism festival celebrating the monsoon "Khareef" season with greenery, traditional music, markets, performances, and family entertainment.',
 },
 {
   id: 3,
   title: "Tour of Oman (Cycling Race)",
   location: "Various cities across Oman",
   date: "9–14 February 2026",
   description:
     "A prestigious international road cycling race showcasing Oman’s landscapes.",
 },
 {
   id: 4,
   title: "Al Bashayer Camel Racing Festival",
   location: "Adam",
   date: "2 – 7 February 2026 (approx.)",
   description:
     "Traditional camel races — a key part of Omani heritage and sport.",
 },
 {
   id: 5,
   title: "Sifah Beach Festival",
   location: "Sifah Beach",
   date: "May 2026 (TBA)",
   description:
     "A beachside culture and music festival with performances, food, and nightlife.",
 },
 {
   id: 6,
   title: "Spring Festival Maslenitsa",
   location: "Al Mouj, Muscat",
   date: "6 – 7 February 2026",
   description:
     "A cultural festival celebrating Russian traditions with music, dance, food, and workshops.",
 },
];
function Activities() {
 const { t, tv, locale } = useLang();
 const [activities, setActivities] = useState(DEFAULT_ACTIVITIES);
 useEffect(() => {
   const loadActivities = async () => {
     try {
       const res = await activitiesAPI.getAll();
       if (res.success && Array.isArray(res.data)) {
         const mapped = res.data.map((act) => {
           const startDate = act.start_date
             ? new Date(act.start_date).toLocaleDateString(locale, {
                 year: "numeric",
                 month: "long",
                 day: "numeric",
               })
             : "";
           const endDate = act.end_date
             ? new Date(act.end_date).toLocaleDateString(locale, {
                 year: "numeric",
                 month: "long",
                 day: "numeric",
               })
             : "";
           return {
             id: act.id,
             title: act.title,
             location: act.location || act.region || "Oman",
             isApi: true,
             date:
               startDate && endDate
                 ? `${startDate} – ${endDate}`
                 : startDate || endDate || t("act.date_tba"),
             description: act.description || "",
           };
         });
         setActivities(prev => {
 const all = [...DEFAULT_ACTIVITIES, ...mapped];
 const unique = all.filter(
   (item, index, self) =>
     index === self.findIndex((i) => i.title === item.title)
 );
 return unique;
});
       }
     } catch {
       setActivities(DEFAULT_ACTIVITIES);
     }
   };
   loadActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [locale]);
 return (
<div
     className="activities-page page-transition"
     style={{ backgroundImage: `url(${activitiesBg})` }}
>
<div className="activities-overlay">
<main className="activities-main">
         {activities.map((activity) => (
<section className="activity-card" key={activity.id}>
<h2 className="activity-title">{activity.title}</h2>
<div className="activity-meta">
<div className="activity-meta-row">
<FaMapMarkerAlt className="activity-icon" />
<span>{activity.isApi ? tv(activity.location) : activity.location}</span>
</div>
<div className="activity-meta-row">
<FaRegCalendarAlt className="activity-icon" />
<span>{activity.date}</span>
</div>
</div>
<p className="activity-description">
               {activity.description}
</p>
</section>
         ))}
</main>
</div>
</div>
 );
}
export default Activities;

