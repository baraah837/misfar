# Misfar – frontend update (responsive + business-model gaps)

**Backend / API: not touched.** No file in `misfar-backend` was changed, and `src/services/api.js` is unchanged.
New code only calls endpoints that already exist (destinations, recommendations, trending, notifications, chatbot).

## 1) New files (place inside `misfar/src/` unless noted)
- `i18n/` (LanguageContext.js, translations.js, part1-4.js) – Arabic/English + RTL
- `components/` LanguageSwitch.js, OfflineBanner.js, InstallPrompt.js, pwa.js
- `config.js`, `services/notificationsClient.js`
- `Learn.js`, `Offers.js`, `Partners.js`, `Support.js`
- `styles/` NavbarV2.css, Sections.css, responsive.css
- `public/` service-worker.js, apple-touch-icon.png, logo512-maskable.png, favicon.png

## 2) Modified files
App.js, index.js, Navbar.js, Footer.js, Home.js, Destinations.js, DestinationDetails.js, Activities.js,
Login.js, Register.js, TripBuilder.js, AiTripGenerator.js, Profile.js, EditProfile.js, AdminDashboard.js (layout only),
components/Chatbot.js, public/index.html, public/manifest.json, public/logo192.png, public/logo512.png, public/favicon.ico

## 3) Run
    cd misfar
    npm install
    npm start        # development
    npm run build    # production

Optional `.env`: `REACT_APP_API_URL=...` (as before) and `REACT_APP_CONTACT_EMAIL=...`.

---
# Update 2 – business model (needs the updated backend)
New pages: `Directory.js` (hotels/restaurants + booking request), `MyBookings.js`, `BusinessPortal.js` (owners: list business, subscribe, manage bookings),
`Premium.js` (traveller Premium + trip-plan store), `AdminBusiness.js` (admin tab "Business model"), `components/AdSlot.js` (ads), `services/businessApi.js`.
Learn page now also shows trails/quizzes created in admin. New translation file `i18n/part5.js`.
Modified: App.js, Navbar.js, Home.js, Destinations.js, DestinationDetails.js, Learn.js, AdminDashboard.js (one tab added), i18n/translations.js, styles/Sections.css.
Still untouched: `services/api.js`.
