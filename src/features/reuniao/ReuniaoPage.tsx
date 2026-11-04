import { useNavigate, useParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Chamada } from './Chamada';
import { SalaEspera } from './SalaEspera';
import { TelaMensagem, botaoPrimario, botaoSecundario } from './TelaMensagem';
import { useReuniao } from './useReuniao';

/** Fecha a janela (modo app do Edge); se o navegador não deixar, volta para o site. */
function fecharJanela(irParaSite: () => void) {
    window.close();
    window.setTimeout(() => { if (!window.closed) irParaSite(); }, 300);
}

export function ReuniaoPage() {
    const { id = '' } = useParams();
    return <Reuniao key={id} id={id} />;
}

function Reuniao({ id }: { id: string }) {
    const r = useReuniao(id);
    const navigate = useNavigate();
    const sairDaTela = () => fecharJanela(() => navigate('/crm/agenda', { replace: true }));
    const titulo = r.meeting?.title ?? 'Reunião';

    let corpo;
    switch (r.fase) {
        case 'carregando':
            corpo = <TelaMensagem titulo="Abrindo a reunião" carregando />;
            break;
        case 'erro':
            corpo = (
                <TelaMensagem titulo="Não foi possível entrar" texto={r.erro ?? undefined}>
                    <button type="button" className={botaoSecundario} onClick={sairDaTela}>Fechar janela</button>
                </TelaMensagem>
            );
            break;
        case 'cheia':
            corpo = (
                <TelaMensagem titulo="Reunião cheia" texto="A reunião já está com o máximo de 8 pessoas. Peça para alguém sair e tente de novo.">
                    <button type="button" className={botaoPrimario} onClick={r.acoes.voltarParaEspera}>Tentar novamente</button>
                    <button type="button" className={botaoSecundario} onClick={sairDaTela}>Fechar janela</button>
                </TelaMensagem>
            );
            break;
        case 'saiu':
            corpo = (
                <TelaMensagem titulo="Você saiu da chamada" texto="A reunião continua para quem ficou.">
                    <button type="button" className={botaoPrimario} onClick={r.acoes.voltarParaEspera}>Entrar novamente</button>
                    <button type="button" className={botaoSecundario} onClick={sairDaTela}>Fechar janela</button>
                </TelaMensagem>
            );
            break;
        case 'encerrada':
            corpo = (
                <TelaMensagem titulo="Reunião encerrada" texto={`${r.meeting ? `"${r.meeting.title}" foi encerrada.` : 'Esta reunião foi encerrada.'} Obrigado por participar.`}>
                    <button type="button" className={botaoPrimario} onClick={sairDaTela}>Fechar janela</button>
                </TelaMensagem>
            );
            break;
        case 'espera':
        case 'entrando':
            corpo = r.meeting && (
                <>
                    <SalaEspera
                        meeting={r.meeting}
                        eu={r.eu}
                        estado={r.estado}
                        streamLocal={r.streamLocal}
                        temMic={r.temMic}
                        temCam={r.temCam}
                        pedindoMidia={r.pedindoMidia || r.fase === 'entrando'}
                        problemas={r.problemas}
                        dispositivos={r.dispositivos}
                        escolhidos={r.escolhidos}
                        onMic={r.acoes.alternarMic}
                        onCam={r.acoes.alternarCam}
                        onTrocarMic={r.acoes.trocarMic}
                        onTrocarCam={r.acoes.trocarCam}
                        onTrocarSaida={r.acoes.trocarSaida}
                        onEntrar={r.acoes.entrar}
                    />
                </>
            );
            break;
        default:
            corpo = <Chamada r={r} />;
    }

    return (
        <>
            <Seo title={titulo} description="Chamada de reunião da equipe T3." path={`/reuniao/${id}`} noIndex />
            {corpo}
        </>
    );
}
