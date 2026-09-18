# ENGLISH <img width="25px" src="./assets/logo.png" /> JANALA

An interactive **vocabulary learning web app**. Pick a lesson, study word cards with
meaning & pronunciation, listen to the words, open full details in a modal, save your
favourite words and search the whole word list — all in the browser, powered by the
Programming Hero open API.

---

## ✨ Features

### 1. Levels on the UI
- Lesson buttons are generated dynamically from **API‑01** and appear on page load
- The section keeps the centre-aligned "Let's Learn Vocabularies" heading

### 2. Word cards per level
- The vocabulary section starts with the default *"Select a Lesson"* message
- Clicking a lesson loads its words from **API‑02** and renders one card per word with:
  - the word
  - its meaning & pronunciation (Bangla, `font-bangla`)
  - three action buttons — **details**, **speak** and **save**
- A friendly message replaces the cards when a lesson has no words yet
- The **active lesson button** is filled with the brand colour (indigo) and white text

### 3. Vocabulary details modal
- The info icon opens a modal fed by **API‑03**
- It shows the word + pronunciation, meaning, example sentence and synonyms as chips
- The word can be spoken from the modal too, and **Complete Learning** closes it

### 4. Search
- Searches while you type (debounced), and also with the **Search** button or **Enter**
- Searching resets the active lesson button; clearing the input restores the default message
- The full word list (**API‑04**) is fetched once and reused, so repeat searches are instant

### 5. Saved words
- The heart button saves / removes a word; a saved word shows a filled red heart
- Saved words appear in their own **Saved Vocabulary** section with a counter and **Clear All**
- Stored in `localStorage`, so the box survives a page reload

### 6. Pronunciation
- The speaker icon reads the word aloud with `SpeechSynthesisUtterance` (`lang = "en-EN"`)

### 7. Get started & logout
- The hero form validates the name (min 3 characters) and password (min 6 characters)
  and shows the error inline
- A valid submit hides the hero banner and scrolls to the lessons
- Logout (desktop navbar or mobile menu) clears the form and resets the page

### 8. Invalid data & failed requests
- Falsy API values (`null` / `undefined` / empty) become Bangla fallbacks, so
  `undefined` is never printed in the UI
- Failed requests show a relevant message instead of leaving the spinner spinning forever
- All API text is HTML‑escaped before it reaches the DOM
- Outdated responses are discarded, so a slow request can never overwrite a newer one

---

## 🛠️ Tech stack

| Layer | Used |
| --- | --- |
| Markup | HTML5 (semantic sections, `dialog` for the modal) |
| Styling | Tailwind CSS v4 (browser build via CDN) + daisyUI 5 components |
| Icons & fonts | Font Awesome 7, Google Fonts (Poppins + Hind Siliguri) |
| Logic | Vanilla JavaScript (ES2020+), no framework, no bundler, no build step |
| APIs | `fetch` against the Programming Hero open API |
| Extras | Web Speech API (pronunciation) + `localStorage` (saved words) |

---

## 📁 Project structure

```text
english-janala/
├── index.html          # the whole page: navbar, hero, lessons, search, words, saved words, FAQ
├── script/
│   └── index.js        # all app logic: API calls, rendering, search, saved words, speech
├── style/
│   └── style.css       # fonts, active lesson button, saved heart states
├── assets/             # logo, hero image, alert icon, social thumbnails
├── .gitignore          # keeps macOS / editor junk out of the repository
└── README.md
```

---

## 🚀 Getting started

There is **no install and no build step** — clone and open the page.

```bash
git clone https://github.com/khalidhasan-m/english-janala.git
cd english-janala
```

Serve the folder over HTTP (recommended):

```bash
python3 -m http.server 5500
# or: npx serve .
```

Then open <http://localhost:5500> in your browser.

> **Why a server?** Chrome blocks `localStorage` on `file://`, so the **Saved Vocabulary**
> box cannot persist when you open `index.html` by double-clicking it. Lessons, cards,
> the modal, search and pronunciation all work fine from `file://`.

---

## ⚡ API Endpoints

1. Get ⚡ All Levels

```bash
https://openapi.programming-hero.com/api/levels/all
```

2. Get ⚡ Words by Levels <br/>
   `https://openapi.programming-hero.com/api/level/{id}`

```bash
https://openapi.programming-hero.com/api/level/5
```

3. Get ⚡ Words Detail <br/>
   `https://openapi.programming-hero.com/api/word/{id}`

```bash
https://openapi.programming-hero.com/api/word/5
```

4. Get ⚡ All Words <br/>

```bash
https://openapi.programming-hero.com/api/words/all
```

## ✅ Assignment checklist

Everything below is implemented and verified in a real browser.

### 1. Show Levels on The UI

- [x] Show a center-aligned heading as Figma

---

- [x] Create dynamically generated buttons from **API-01** for each lesson
- [x] Lesson Buttons will be displayed on page load

---

### 2. Show Word Cards Based on Level

- [x] Show a default text that will be displayed in the Vocabulary section initially
- [x] on Clicking a Specific Lesson Button Load All the words from **API-02**
- [x] Display all words for a selected lesson in a card format, showing:

  - [x] Word
  - [x] Word meaning & pronunciation
  - [x] Two buttons with relevant icons as per Figma

- [x] Show **\*No Word Found** message if no words exist for a lesson

---

- [x] Create functionality to highlight the active lesson button

---

### 3. Use Different Color on The Active Level Button

- [x] After Successfully Loading words of a level , diffirentiate the button so user can understand which button is active

### 4. Vocabulary Details

- [x] Create functionality to open a modal when clicking the details icon
- [x] Data will be load from **API-03**
- [x] modal will displays:
  - [x] Word with pronunciation
  - [x] Example sentence
  - [x] Synonyms
  - [x] A "Complete Learning" button to close the modal

### 5. Handling Invalid Data

- [x] avoid displaying falsy values like `undefined` or `null`
- [x] display relevant words if no data is found

### 6. Loading Spinner

- [x] Create a loading spinner that will be display when vocabulary is loading from API

### 7. Implement Search Functionality

- [x] Take a input Box.
- [x] on Changing value It will Search word and show in the UI.
- [x] If anyone Do search reset active button

### 8. Save Word Feature

- [x] in the UI of Card add a button `Heart icon`
- [x] on Clicking it. Store the Word in the Saved Box
- [x] Show Saved words in a Different Section.

### 9. Speak your Vocabularies

- [x] Create functionality for voice pronunciation of vocabulary words
- [x] Use below function and implement on clicking sound icon

```js
function pronounceWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-EN"; // English
  window.speechSynthesis.speak(utterance);
}
```

For More >> you can explore this implementation 👉 [https://codepen.io/Ferdous-Zihad/pen/PwoJMmJ](https://codepen.io/Ferdous-Zihad/pen/PwoJMmJ)

---
### 📌 Notes & limitations

- **Login is UI‑only.** There is no backend, so *Get Started* / *Logout* only validate the
  input and show or hide the hero banner — nothing is sent anywhere.
- **Saved words are per browser.** They live in `localStorage`, so they belong to the
  device/browser you used and are not synced to an account.
- **Pronunciation needs a voice.** It uses the browser's built-in speech synthesis, so the
  available English voices depend on your OS and browser.
- **The API is a public teaching API.** If it is unreachable, the app shows a Bangla error
  message with a retry hint instead of failing silently.
- **Files kept out of the repository.** macOS metadata (`.DS_Store`, `._*` AppleDouble
  files) and editor folders are ignored through `.gitignore`.

---

## 🔗 Assignment links

- Reference implementation 👉 [CodePen – English Speakar](https://codepen.io/Ferdous-Zihad/pen/PwoJMmJ)
- Bonus: how to create a private repository for the next assignments
- Test repo: <https://classroom.github.com/a/Fgjib-lr>
