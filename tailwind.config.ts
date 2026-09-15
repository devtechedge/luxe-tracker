import type { Config } from 'tailwindcss'

// ============================================================
// TAILWIND v4 - config is now CSS-first via globals.css.
// This file is kept minimal for backward compatibility.
// All theme tokens (@theme), sources (@source), and variants
// live in src/app/globals.css.
// ============================================================

const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}'],
}

export default config
