/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', 
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        // Visual editorial: sem cantos arredondados (exceto círculos, como indicadores e avatares)
        borderRadius: {
            none: '0', DEFAULT: '0', sm: '0', md: '0', lg: '0', xl: '0', '2xl': '0', '3xl': '0', full: '9999px',
        },
        extend: {
            colors: {
                brand: {
                    // O Tailwind agora sabe como injetar opacidade dinamicamente nessas variáveis
                    background: 'rgb(var(--brand-background) / <alpha-value>)',
                    black: 'rgb(var(--brand-background) / <alpha-value>)', 
                    surface: 'rgb(var(--brand-surface) / <alpha-value>)',
                    border: 'rgb(var(--brand-border) / <alpha-value>)',
                    text: 'rgb(var(--brand-text) / <alpha-value>)',
                    muted: 'rgb(var(--brand-muted) / <alpha-value>)',
                    neon: '#FF5E00',
                    neonHover: '#FF7A29',
                },
                // Neutros do site público: off-black e superfícies, sem preto puro
                ink: {
                    950: '#0B0B0C',
                    900: '#111113',
                    850: '#161618',
                    800: '#1C1C1F',
                    700: '#2A2A2E',
                    500: '#6E6E73',
                    400: '#8E8E93',
                    300: '#B4B4B9',
                    100: '#ECECEE',
                },
            },
            fontFamily: {
                sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },
            boxShadow: {
                'ios': '0 8px 32px rgba(0, 0, 0, 0.4)',
                'panel': '0 24px 48px -24px rgba(11, 11, 12, 0.9)',
            },
            perspective: {
                '1000': '1000px',
            },
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.perspective-1000': { perspective: '1000px' },
            });
        }
    ],
}