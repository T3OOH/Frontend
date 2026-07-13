/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#000000',      // Preto absoluto (Fundo iOS)
                    surface: '#1C1C1E',    // Superfícies e Cards (Elevado iOS)
                    border: '#38383A',     // Bordas super discretas
                    neon: '#FF5E00',       // Laranja Neon Principal
                    neonHover: '#FF7A29',  // Laranja para hover
                    text: '#F5F5F7',       // Branco suave da Apple para leitura
                    muted: '#86868B',      // Cinza oficial de textos secundários iOS
                }
            },
            fontFamily: {
                // Fonte do sistema (San Francisco no Mac/iOS)
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 20px -8px rgba(255, 94, 0, 0.5)',
                'ios': '0 8px 32px rgba(0, 0, 0, 0.4)',
            }
        },
    },
    plugins: [],
}