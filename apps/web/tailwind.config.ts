import type { Config } from 'tailwindcss'
import preset from '@repo/ui/tailwind.preset'

const config: Config = {
  presets: [preset],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Include shared UI package components
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
}

export default config
