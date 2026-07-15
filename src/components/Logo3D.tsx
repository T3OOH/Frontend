import { motion } from 'framer-motion';

export function Logo3D() {
    return (
        <div className="flex justify-center items-center h-64 perspective-1000">
            <motion.div
                className="relative w-64 h-64"
                initial={{ rotateY: 0 }}
                // Animação que gira 360 graus a cada 5 segundos
                animate={{ rotateY: 360 }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    repeatDelay: 3, // Pausa de 3 segundos entre os giros
                    ease: "easeInOut"
                }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Imagem da Logo */}
                <img 
                    src="/LOGO T3 BRANCO COM LARANJA somente t3.PNG" 
                    alt="Logo T3 3D" 
                    className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,94,0,0.4)]"
                />
            </motion.div>
        </div>
    );
}