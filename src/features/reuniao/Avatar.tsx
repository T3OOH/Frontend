import { corDaPessoa, iniciais } from './util';

interface Props {
    id: string;
    nome: string;
    /** Diâmetro em pixels. */
    tamanho?: number;
}

/** Círculo com as iniciais, de cor estável por pessoa. */
export function Avatar({ id, nome, tamanho = 80 }: Props) {
    return (
        <div
            className="rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none"
            style={{ width: tamanho, height: tamanho, background: corDaPessoa(id), fontSize: tamanho * 0.38 }}
            aria-hidden="true"
        >
            {iniciais(nome)}
        </div>
    );
}
