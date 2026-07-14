# 🔠 Typamine

> **The ultimate typographic apothecary.** A modern, high-performance platform designed to discover, test, synthesize, and archive fonts, structured entirely around a medical-pharmaceutical metaphor.

Typamine is not your usual font directory: it is a true digital laboratory for designers, developers, and typography enthusiasts. By treating typography as a science, Typamine offers advanced tools, curated collections ("formulas"), and a deep historical archive to elevate the quality of any visual project.

---

## 🧪 The Laboratory Architecture (Route Map)

The platform is divided into specialized departments, each tackling a specific phase of the typographic workflow:

### 🌾 `/ingredients` — The Font Catalog (Ingredients)
The base components for your designs. A massive, high-performance catalog equipped with:
* **Advanced Search:** Filter by categories, licenses, weights, and specific structural font attributes.
* **Dynamic Preview:** Test fonts in real-time by inputting custom text, adjusting sizes, and testing different CSS combinations.

### 🧪 `/formulas` — Curated Collections (Formulas)
Ready-to-use mixtures to solve specific design challenges. High-impact collections created and updated by our editorial team, such as:
* *Trend Serif 2026*
* *Best Handwritten Fonts of September*
* *Retro-Futurism Essentials*

### 🔬 `/labs` — Tools & Synthesis (Laboratory)
The engine room where font files are processed, optimized, and tested:
* **Font-Face Generator:** Instantly generate production-ready `@font-face` CSS declarations.
* **WOFF2 Converter:** Transform heavy desktop formats (`.ttf`, `.otf`) into ultra-compressed, web-optimized `.woff2` files.
* **Contrast Checker (WCAG):** Check accessibility and contrast between font text and background to comply with WCAG guidelines.
* **Variable Font Scripts:** Download dedicated scripts and code snippets to make the most of variable font axes, optimizing asset loading.

### 🩺 `/prescriptions` — Pairings & Editorial Use (Prescriptions)
Expert-curated typographic "diagnoses" and pairing guides:
* **Font Pairings:** Ready-made combinations for headings, subheadings, and body text, complete with real-world examples in web and editorial layouts.
* **`/prescriptions/archive` — Historical Archive:** A digital museum celebrating vintage typography, organized by eras, styles, and movements:
    * *Soviet propaganda and constructivist posters*
    * *Vintage arthouse movie posters*
    * *Historic Vogue covers and fashion editorial*
    * *Futurist artworks and manifestos*
    * *Vintage Japanese graphic design and typography*

### 💊 `/pills` — The Blog (Pills)
Small, concentrated doses of typographic culture. Articles, historical deep-dives, technical guides, interviews with type designers, and news from the world of typefaces.

---

## 🛠️ Tech Stack

The application is designed to offer lightning-fast loading and secure asset management:

* **Framework:** Next.js (App Router) & React
* **Styling:** Tailwind CSS
* **Database:** PostgreSQL (with Prisma ORM) / Cloudflare D1
* **Storage & CDN:** Cloudflare R2 for fast and secure font file storage and distribution

---

## 🚀 Getting Started (Local Development)

To run Typamine locally on your machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/typamine.git
   cd typamine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file from the example file:
   ```bash
   cp .env.example .env
   ```
   *Configure your database and Cloudflare R2 storage keys inside it.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 🤝 Contributing

Contributions are always welcome! If you have an idea for a new tool in `/labs` or a new collection for `/formulas`, open a pull request or report it in the Issues section.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).