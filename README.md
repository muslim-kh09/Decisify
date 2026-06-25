# Decisify

🚀 **Live Demo:** [https://decisify-web.vercel.app](https://decisify-web.vercel.app)

A premium, client-side Weighted Decision Matrix tool built to help users make complex mathematical choices with high precision. Decisify features a striking "Dark Tech / Minimalist" aesthetic, fluid motion, bilingual support (English/Arabic), and local persistence.

## Features
- **Mathematical Synthesis**: Assign weights to criteria and score options to calculate the mathematically optimal choice.
- **Premium UI/UX**: Built with a sleek, dark-mode-first aesthetic using high-contrast typography, glassmorphism, and dynamic layout scaling.
- **Bilingual (English & Arabic)**: Full RTL support with dedicated premium typography (`Outfit` for English, `Cairo` for Arabic).
- **Export to Image**: Download a beautiful visual synthesis of your decision matrix directly as a high-quality PNG.
- **Visual Charts**: Instantly visualize the score gaps between options via dynamic CSS/SVG bars.
- **Privacy First**: Fully client-side. No servers. All context is saved locally in your browser (`localStorage`).

## Tech Stack
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion (motion/react)](https://motion.dev/)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)
- **Image Export**: [html-to-image](https://github.com/bubkoo/html-to-image)

## Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/muslim-kh09/Decisify.git
   cd Decisify
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

## Deployment

Because this is a static client-side Vite application, you can deploy it anywhere for free.

### Option 1: Vercel (Recommended)
The fastest way to deploy. Vercel perfectly supports Vite out of the box.
1. Create an account on [Vercel](https://vercel.com/).
2. Click **Add New Project** and connect your GitHub repository.
3. Vercel will auto-detect Vite. Click **Deploy**.
4. Your site is live! Every time you push to `main`, it will auto-update.

### Option 2: GitHub Pages
1. Install the `gh-pages` package:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Update your `vite.config.ts` to include your repo name as the base path:
   ```ts
   export default defineConfig({
     plugins: [react()],
     base: '/Decisify/',
   })
   ```
3. Run `npm run build`, then upload the contents of the `dist` folder to your `gh-pages` branch.

### Option 3: Netlify / Cloudflare Pages
Simply connect your GitHub repo to Netlify or Cloudflare Pages, set the build command to `npm run build`, and the output directory to `dist`.

## License
MIT License
