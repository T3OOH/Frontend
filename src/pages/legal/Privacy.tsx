import { Link } from 'react-router-dom';
import { LegalPage } from './LegalPage';

const CONTACT_EMAIL = 'contato@t3comunicacao.com';

/** Política de Privacidade (LGPD — Lei nº 13.709/2018). */
export function Privacy() {
    return (
        <LegalPage
            title="Política de Privacidade"
            description="Como a T3 OOH coleta, usa e protege seus dados pessoais, de acordo com a LGPD."
            path="/privacidade"
            updatedAt="27 de outubro de 2026"
        >
            <p>
                Esta política explica como a T3 OOH trata os dados pessoais de quem usa o site, o mapa de painéis,
                a área do cliente e os canais de atendimento, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>

            <h2>1. Dados que coletamos</h2>
            <ul>
                <li><strong>Cadastro e conta:</strong> nome, e-mail, telefone, CPF ou CNPJ, nome da empresa e senha (armazenada de forma criptografada).</li>
                <li><strong>Orçamentos e pedidos:</strong> painéis escolhidos, prazo da campanha, cupom utilizado e observações enviadas.</li>
                <li><strong>Contato:</strong> nome, e-mail, telefone, empresa e mensagem enviados pelos formulários.</li>
                <li><strong>Dados técnicos:</strong> endereço IP e navegador no envio de formulários, para segurança e prevenção de fraude.</li>
                <li><strong>Estatísticas de visita:</strong> páginas vistas, tipo de aparelho, navegador e a origem da visita (por exemplo, Google, Instagram ou link de campanha). São anônimas: usamos um código aleatório que vale só enquanto a aba está aberta e não guardamos o IP. A origem também acompanha os formulários de orçamento, contato e cadastro.</li>
                <li><strong>Localização:</strong> somente quando você autoriza no navegador, para mostrar painéis próximos. Ela não é armazenada.</li>
            </ul>

            <h2>2. Para que usamos</h2>
            <ul>
                <li>Responder solicitações de orçamento e atendimento comercial, inclusive pelo WhatsApp.</li>
                <li>Criar e manter sua conta e o histórico de orçamentos e pedidos.</li>
                <li>Elaborar propostas e contratos de veiculação.</li>
                <li>Garantir a segurança da plataforma (verificação reCAPTCHA, limites de acesso).</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>

            <h2>3. Bases legais</h2>
            <p>
                Tratamos dados para a execução de contrato e de procedimentos preliminares (orçamentos), para o cumprimento
                de obrigação legal, pelo legítimo interesse em segurança e atendimento, e com o seu consentimento quando
                exigido (por exemplo, localização).
            </p>

            <h2>4. Compartilhamento</h2>
            <p>Não vendemos dados pessoais. Compartilhamos apenas com fornecedores necessários à operação:</p>
            <ul>
                <li>hospedagem e banco de dados (Supabase e provedores de nuvem);</li>
                <li>envio de e-mails transacionais (Resend);</li>
                <li>proteção contra robôs (Google reCAPTCHA);</li>
                <li>mapas (OpenStreetMap);</li>
                <li>autoridades públicas, quando houver obrigação legal.</li>
            </ul>

            <h2>5. Cookies e armazenamento no navegador</h2>
            <p>
                Usamos apenas recursos <strong>essenciais</strong> ao funcionamento do site: a sessão de login (válida só na aba aberta),
                o carrinho de painéis, as preferências de aparência e o registro da sua escolha sobre cookies. O Google reCAPTCHA pode
                definir cookies próprios para identificar acessos automatizados. Não utilizamos cookies de publicidade.
            </p>
            <p>
                Para as estatísticas de visita, guardamos no navegador um código da visita (apagado ao fechar a aba) e, por até 90 dias,
                a origem da primeira visita. Ao escolher <strong>"Só o essencial"</strong> no aviso de privacidade, nada disso é registrado.
                Para mudar a escolha, limpe os dados do site no navegador.
            </p>

            <h2>6. Por quanto tempo guardamos</h2>
            <p>
                Mantemos os dados enquanto sua conta estiver ativa ou enquanto forem necessários para atender à finalidade
                informada, e pelos prazos exigidos em lei (por exemplo, fiscais e contratuais). Depois disso, eles são
                excluídos ou anonimizados.
            </p>

            <h2>7. Seus direitos</h2>
            <p>Você pode, a qualquer momento:</p>
            <ul>
                <li>confirmar se tratamos seus dados e acessá-los;</li>
                <li>corrigir dados incompletos ou desatualizados (também pela página <Link to="/perfil">Meu Perfil</Link>);</li>
                <li>pedir a anonimização, o bloqueio ou a exclusão de dados desnecessários;</li>
                <li>pedir a portabilidade dos dados;</li>
                <li>revogar o consentimento e saber com quem compartilhamos seus dados.</li>
            </ul>
            <p>
                Para exercer esses direitos, escreva para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>

            <h2>8. Segurança</h2>
            <p>
                Adotamos medidas técnicas e administrativas para proteger os dados: conexões criptografadas (HTTPS),
                senhas com hash, controle de acesso por perfil e registro de acesso restrito à equipe autorizada.
            </p>

            <h2>9. Alterações</h2>
            <p>
                Esta política pode ser atualizada. A data da última alteração fica sempre no topo da página.
                Mudanças relevantes serão comunicadas no site.
            </p>
        </LegalPage>
    );
}
