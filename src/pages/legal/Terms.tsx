import { Link } from 'react-router-dom';
import { LegalPage } from './LegalPage';

const CONTACT_EMAIL = 'contato@t3comunicacao.com';

/** Termos de Uso da plataforma. */
export function Terms() {
    return (
        <LegalPage
            title="Termos de Uso"
            description="Regras de uso do site, do mapa de painéis e da área do cliente da T3 OOH."
            path="/termos"
            updatedAt="27 de outubro de 2026"
        >
            <p>
                Ao usar o site e a plataforma da T3 OOH, você concorda com estes termos. Se não concordar, não utilize os serviços.
            </p>

            <h2>1. O que a plataforma oferece</h2>
            <p>
                A plataforma permite consultar painéis de LED e mídia exterior, montar um carrinho, simular valores e enviar
                solicitações de orçamento. <strong>Valores, descontos e disponibilidade exibidos são estimativas</strong> e só
                se tornam definitivos após a proposta comercial e a assinatura do contrato de veiculação.
            </p>

            <h2>2. Cadastro</h2>
            <ul>
                <li>Você deve informar dados verdadeiros e mantê-los atualizados.</li>
                <li>A senha é pessoal e intransferível. Você é responsável pelo uso da sua conta.</li>
                <li>Podemos suspender contas usadas de forma fraudulenta ou contrária a estes termos.</li>
            </ul>

            <h2>3. Orçamentos, cupons e contratação</h2>
            <ul>
                <li>O envio de um orçamento não garante a reserva do painel.</li>
                <li>Descontos por prazo e cupons seguem as regras vigentes no momento da proposta. Cupons podem ter validade, valor mínimo e uso único.</li>
                <li>Preços, prazos de veiculação, conteúdo e pagamento são definidos no contrato firmado com a T3 OOH.</li>
            </ul>

            <h2>4. Conteúdo das campanhas</h2>
            <p>
                O anunciante é responsável pelo conteúdo enviado para veiculação, que deve respeitar a legislação, o Código de
                Defesa do Consumidor, as normas do CONAR e direitos de terceiros. A T3 OOH pode recusar conteúdo inadequado.
            </p>

            <h2>5. Uso permitido</h2>
            <p>É proibido:</p>
            <ul>
                <li>tentar acessar áreas restritas, contas de terceiros ou dados que não sejam seus;</li>
                <li>usar robôs, raspagem automatizada ou sobrecarregar a plataforma;</li>
                <li>copiar marcas, imagens e conteúdos da T3 OOH sem autorização.</li>
            </ul>

            <h2>6. Disponibilidade e responsabilidade</h2>
            <p>
                Trabalhamos para manter a plataforma disponível e correta, mas ela pode passar por manutenções ou instabilidades.
                Informações como estimativas de impacto e audiência são referências e não garantem resultados de campanha.
            </p>

            <h2>7. Privacidade</h2>
            <p>
                O tratamento de dados pessoais está descrito na <Link to="/privacidade">Política de Privacidade</Link>.
            </p>

            <h2>8. Alterações e foro</h2>
            <p>
                Estes termos podem ser atualizados, e a data da última versão fica no topo da página. Aplica-se a legislação
                brasileira. Dúvidas: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
        </LegalPage>
    );
}
