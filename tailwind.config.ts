import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "rgb(var(--color-primary) / <alpha-value>)",
                "background-light": "rgb(var(--color-background-light) / <alpha-value>)",
                "background-dark": "rgb(var(--color-background-dark) / <alpha-value>)",
                "surface-light": "rgb(var(--color-surface-light) / <alpha-value>)",
                "surface-dark": "rgb(var(--color-surface-dark) / <alpha-value>)",
                "surface-dim": "rgb(var(--color-surface-dim) / <alpha-value>)",
                "surface-darkDim": "rgb(var(--color-surface-darkDim) / <alpha-value>)",
                "border-light": "rgb(var(--color-border-light) / <alpha-value>)",
                "border-dark": "rgb(var(--color-border-dark) / <alpha-value>)",
                "text-main": "rgb(var(--color-text-main) / <alpha-value>)",
                "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Status Palette
                success: "rgb(var(--color-status-success) / <alpha-value>)",
                warning: "rgb(var(--color-status-warning) / <alpha-value>)",
                error: "rgb(var(--color-status-error) / <alpha-value>)",
                info: "rgb(var(--color-status-info) / <alpha-value>)",
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'glow': '0 0 20px rgba(37, 99, 235, 0.15)',
                'bottom-nav': '0 -10px 40px rgba(0, 0, 0, 0.08)',
            }
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
    ],
};
export default config;
