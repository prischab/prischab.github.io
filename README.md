# Prischa Bajeli — Portfolio (multi-page)

A clean, minimal portfolio. Plain HTML/CSS — no build step, no frameworks.

## Pages
- `index.html`    → Home (just your name + photo)
- `about.html`    → About, Toolkit, Education
- `experience.html` → Choice TechLab internship + internship projects
- `work.html`     → Projects
- `research.html` → Publications (with preview cards + paper links)
- `beyond.html`   → Dhvani music club + competition wins
- `contact.html`  → Contact details
- `style.css`     → Shared styling for every page

All pages link to each other through the top navigation.

---

## Put it online (GitHub Pages)

1. Make a GitHub account at https://github.com (username: prischab).
2. Create a new repo named EXACTLY: `prischab.github.io`, set to Public.
3. Click "uploading an existing file" and drag in ALL files:
   index.html, about.html, work.html, research.html, beyond.html,
   contact.html, style.css, and the `images` folder.
4. Commit. Then Settings -> Pages -> Branch: main / root -> Save.
5. After ~1-2 min visit:  https://prischab.github.io

Keep all files in the SAME folder (don't put HTML files inside subfolders),
or the navigation and style.css links will break.

---

## Adding images
Put files in `images/`. In each page find the `img-slot` placeholder, delete the
placeholder text, and uncomment the `<img>` line under it.

Expected filenames:
- images/profile.jpg        (home + ~4:5 portrait)
- images/project-face.jpg   (work)
- images/project-energy.jpg (work)
- images/project-xray.jpg   (work)
- images/project-dashboard.jpg (work)
- images/project-mathgame.jpg  (work)
- images/dhvani.jpg         (beyond, ~4:5)
- images/paper-face.jpg     (research — optional real paper screenshot)
- images/paper-energy.jpg   (research — optional real paper screenshot)

For the publication preview: by default each card shows a stylized "mock paper".
To use a real screenshot of the paper instead, add the image (e.g. paper-face.jpg),
delete the `<div class="paper-mock">...</div>` block, and uncomment the `<img>` line.

---

## Still to edit
- experience.html: add Digital ILAC features + stack (see TODO comments)
- experience.html: add internship screenshots to assets/internship/<project>/ui-1.png, ui-2.png

---

## Résumé download button (Contact page)
The Contact page has a "Download résumé" button that links to `resume.pdf`.
Put your resume PDF in the SAME folder as the HTML files and name it exactly
`resume.pdf` — then the button works automatically. (Upload it to your GitHub
repo alongside index.html etc.)
