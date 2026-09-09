import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

export interface AuroraProps {
    colorStops?: string[];
    amplitude?: number;
    blend?: number;
    speed?: number;
}

export default function Aurora({
    colorStops = ['#5227FF', '#7cff67', '#5227FF'],
    amplitude = 0.7,
    blend = 0.5,
    speed = 0.35
}: AuroraProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // 1. Inicializa o Renderer otimizado (fundo transparente para blend no CSS)
        const renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
        const gl = renderer.gl;
        container.appendChild(gl.canvas);

        // 2. Geometria de tela cheia super leve
        const geometry = new Triangle(gl);

        // 3. Shaders (Mágica da Aurora com ondas matematicas no tempo)
        const vert = `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

        const frag = `
            precision highp float;
            uniform float uTime;
            uniform float uAmplitude;
            uniform float uBlend;
            uniform vec3 uColor1;
            uniform vec3 uColor2;
            uniform vec3 uColor3;
            varying vec2 vUv;

            void main() {
                vec2 uv = vUv;
                float t = uTime;
                
                // Movimentação orgânica tipo Aurora Boreal
                float wave1 = sin(uv.x * 4.0 + t) * 0.5 + 0.5;
                float wave2 = cos(uv.y * 3.0 - t * 0.8) * 0.5 + 0.5;
                
                // Mesclagem de cores usando a amplitude e o blend
                float mix1 = smoothstep(0.0, 1.0 + uBlend, wave1 * wave2 + (uv.y * uAmplitude));
                float mix2 = smoothstep(0.0, 1.0 + uBlend, wave2 - (uv.x * uAmplitude));
                
                vec3 color = mix(uColor1, uColor2, mix1);
                color = mix(color, uColor3, mix2);
                
                // Renderiza a cor final 
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // 4. Injeta as props diretamente no Shader
        const program = new Program(gl, {
            vertex: vert,
            fragment: frag,
            uniforms: {
                uTime: { value: 0 },
                uAmplitude: { value: amplitude },
                uBlend: { value: blend },
                uColor1: { value: new Color(colorStops[0]) },
                uColor2: { value: new Color(colorStops[1]) },
                uColor3: { value: new Color(colorStops[2]) },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });

        // 5. Responsividade 100% nativa sem travar o layout
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                renderer.setSize(width, height);
            }
        });
        resizeObserver.observe(container);

        // 6. Loop de Animação Otimizado
        let animationId: number;
        const update = (t: number) => {
            animationId = requestAnimationFrame(update);
            program.uniforms.uTime.value = t * 0.001 * speed;
            renderer.render({ scene: mesh });
        };
        animationId = requestAnimationFrame(update);

        // 7. Unmount Seguro (Evita vazamento de memória e duplicação)
        return () => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            if (container && gl.canvas.parentNode === container) {
                container.removeChild(gl.canvas);
            }
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, [colorStops, amplitude, blend, speed]);

    return <div ref={containerRef} className="w-full h-full" />;
}