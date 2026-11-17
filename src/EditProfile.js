import React, { useState } from "react";
import "./styles/EditProfile.css";
import profileBg from "./Images/home1.jpg";
import { FaUserCircle, FaPen, FaCamera } from "react-icons/fa";
import { userAPI, setUser } from "./services/api";
import { useLang } from "./i18n/LanguageContext";
 
const BACKEND = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:5000";
const resolvePhoto = (url) => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${BACKEND}${url}`;
};
 
function EditProfile({ profileData, setProfileData, onNavigate = () => {} }) {
  const { t } = useLang();
  const [formData, setFormData]   = useState(profileData || {});
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
 
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };
 
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username",    formData.name      || "");
      fd.append("email",       formData.email     || "");
      fd.append("location",    formData.location  || "");
      fd.append("interests",   formData.interests || "");
      fd.append("budget",      formData.budget    || "Low");
      fd.append("travel_type", formData.travelType|| "Solo");
      if (photoFile) fd.append("photo", photoFile);
 
      const result = await userAPI.updateProfile(fd);
      if (result.success) {
        const u = result.data;
        const updated = {
          ...formData,
          name:       u.username,
          email:      u.email,
          location:   u.location   || "",
          interests:  u.interests  || "",
          budget:     u.budget     || "Low",
          travelType: u.travel_type|| "Solo",
          photo:      resolvePhoto(u.photo_url) || formData.photo,
        };
        setProfileData(updated);
setUser({
 id: u.id,
 username: u.username,
 email: u.email,
 photo_url: u.photo_url,
 photo: resolvePhoto(u.photo_url),
 role: u.role
});
        onNavigate("profile");
      } else {
        setError(result.message || t("prof.err_update"));
      }
    } catch {
      setError(t("common.error_connect"));
    } finally {
      setLoading(false);
    }
  };
 
  const errStyle = { background:"rgba(220,53,69,0.15)", border:"1px solid rgba(220,53,69,0.4)", color:"#ff6b6b", borderRadius:"8px", padding:"10px 14px", marginBottom:"12px", fontSize:"0.85rem", textAlign:"center" };
 
  return (
    <div className="edit-profile-page-full" style={{ backgroundImage:`url(${profileBg})` }}>
      <div className="edit-profile-overlay">
        <div className="edit-profile-container">
          <form onSubmit={handleUpdate}>
            {error && <div style={errStyle}>{error}</div>}
            <div className="edit-top-avatar">
              <div className="edit-avatar-circle-big">
                {formData.photo
                  ? <img src={formData.photo} alt="" className="edit-avatar-image-big" />
                  : <FaUserCircle className="edit-avatar-icon-big" />}
              </div>
              <label className="change-photo-hidden-btn">
                <FaCamera /> {t("prof.change_photo")}
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </label>
            </div>
            <div className="edit-row-full">
              <div className="edit-label-side">{t("auth.username")}</div>
              <div className="edit-value-side">
                <input type="text" name="name" value={formData.name || ""} onChange={handleChange} />
                <FaPen className="edit-small-icon" />
              </div>
            </div>
            <div className="edit-row-full">
              <div className="edit-label-side">{t("auth.email")}</div>
              <div className="edit-value-side">
                <input type="email" name="email" value={formData.email || ""} onChange={handleChange} />
                <FaPen className="edit-small-icon" />
              </div>
            </div>
            <div className="edit-row-full">
              <div className="edit-label-side">{t("prof.location")}</div>
              <div className="edit-value-side">
                <select name="location" value={formData.location || "Muscat,Oman"} onChange={handleChange}>
                  <option value="Muscat,Oman">{t("loc.Muscat")}</option>
                  <option value="Nizwa,Oman">{t("loc.Nizwa")}</option>
                  <option value="Salalah,Oman">{t("loc.Salalah")}</option>
                  <option value="Sohar,Oman">{t("loc.Sohar")}</option>
                  <option value="Musandam,Oman">{t("loc.Musandam")}</option>
                </select>
              </div>
            </div>
            <div className="preferences-wrap">
              <div className="edit-label-side preferences-label">{t("prof.preferences")}</div>
              <div className="preferences-box">
                <div className="preference-line">
                  <span>{t("prof.interest")}</span>
                  <select name="interests" value={formData.interests || "Nature, Beaches"} onChange={handleChange}>
                    <option value="Nature, Beaches">{t("int.nature")}</option>
                    <option value="Mountains, Adventure">{t("int.mountains")}</option>
                    <option value="Culture, History">{t("int.culture")}</option>
                    <option value="Desert, Camping">{t("int.desert")}</option>
                  </select>
                </div>
                <div className="preference-line">
                  <span>{t("prof.budget")}</span>
                  <select name="budget" value={formData.budget || "Low"} onChange={handleChange}>
                    <option value="Low">{t("opt.Low")}</option><option value="Medium">{t("opt.Medium")}</option><option value="High">{t("opt.High")}</option>
                  </select>
                </div>
                <div className="preference-line">
                  <span>{t("prof.type")}</span>
                  <select name="travelType" value={formData.travelType || "Solo"} onChange={handleChange}>
                    <option value="Solo">{t("opt.Solo")}</option><option value="Family">{t("opt.Family")}</option><option value="Friends">{t("opt.Friends")}</option><option value="Couple">{t("opt.Couple")}</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="update-main-btn" type="submit" disabled={loading} style={{ opacity:loading ? 0.7:1 }}>
              {loading ? t("trip.saving") : t("prof.update")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default EditProfile;