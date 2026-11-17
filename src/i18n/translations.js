// src/i18n/translations.js
// Entries live in part*.js as [key, English, Arabic] so both languages stay in sync.
import part1 from "./part1";
import part2 from "./part2";
import part3 from "./part3";
import part4 from "./part4";
import part5 from "./part5";

const build = () => {
  const en = {};
  const ar = {};
  [part1, part2, part3, part4, part5].forEach((part) =>
    part.forEach(([key, e, a]) => {
      en[key] = e;
      ar[key] = a;
    })
  );
  return { en, ar };
};

export default build();
