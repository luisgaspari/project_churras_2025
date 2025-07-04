# Escopo do Projeto ChurrasJa

## Visão Geral

O ChurrasJa é uma plataforma mobile que conecta clientes que desejam contratar serviços de churrasco com churrasqueiros profissionais. A aplicação permite que clientes encontrem, avaliem e contratem churrasqueiros, enquanto os profissionais podem gerenciar seus serviços, agendamentos e assinaturas.

## Objetivos do Projeto

1. Facilitar a conexão entre clientes e churrasqueiros profissionais
2. Oferecer uma plataforma completa para gestão de serviços de churrasco
3. Proporcionar uma experiência de usuário intuitiva e agradável
4. Implementar um sistema de avaliações para garantir qualidade
5. Monetizar a plataforma através de assinaturas para profissionais

## Público-Alvo

### Clientes
- Pessoas que desejam contratar serviços de churrasco para eventos
- Faixa etária: 25-60 anos
- Usuários de smartphones com acesso à internet
- Interessados em eventos sociais e gastronomia

### Churrasqueiros Profissionais
- Profissionais que oferecem serviços de churrasco
- Autônomos ou pequenas empresas
- Interessados em expandir sua clientela
- Dispostos a pagar por uma plataforma que aumente sua visibilidade

## Funcionalidades Principais

### Para Clientes

1. **Autenticação e Perfil**
   - Cadastro e login
   - Edição de perfil (nome, email, telefone, localização)
   - Upload de avatar
   - Exclusão de conta

2. **Busca e Filtros**
   - Listagem de churrasqueiros disponíveis
   - Filtros por preço, localização, avaliação, capacidade
   - Visualização de detalhes do serviço
   - Visualização de portfólio e avaliações

3. **Reservas**
   - Solicitação de reserva com data, hora, local e número de convidados
   - Visualização de histórico de reservas
   - Cancelamento de reservas (com restrição de 24h)
   - Contato direto com o churrasqueiro (WhatsApp, telefone, email)

4. **Avaliações**
   - Avaliação de serviços concluídos (1-5 estrelas)
   - Comentários sobre a experiência
   - Visualização de avaliações de outros clientes

### Para Churrasqueiros

1. **Autenticação e Perfil**
   - Cadastro e login
   - Edição de perfil profissional
   - Upload de avatar
   - Exclusão de conta

2. **Gestão de Serviços**
   - Criação de serviços com título, descrição, preço, duração
   - Upload de fotos dos serviços (até 5 por serviço)
   - Edição e exclusão de serviços
   - Definição de capacidade máxima e localização

3. **Gestão de Portfólio**
   - Upload de fotos do trabalho
   - Gerenciamento de galeria de fotos
   - Exibição de portfólio para clientes

4. **Gestão de Agendamentos**
   - Visualização de solicitações pendentes
   - Aceitação ou recusa de agendamentos
   - Finalização de serviços concluídos
   - Contato direto com o cliente

5. **Avaliações e Feedback**
   - Visualização de avaliações recebidas
   - Estatísticas de avaliação (média, distribuição)
   - Dicas para melhorar avaliações

6. **Analytics e Relatórios**
   - Dashboard com métricas principais
   - Gráfico de receita mensal
   - Serviços mais populares
   - Taxa de conclusão de agendamentos

7. **Sistema de Assinatura**
   - Planos de assinatura (Mensal, Semestral, Anual)
   - Pagamento com cartão de crédito
   - Gerenciamento de assinatura
   - Renovação automática

## Arquitetura Técnica

### Frontend
- **React Native** com Expo
- **Expo Router** para navegação
- **React Native Paper** para UI
- **TypeScript** para type safety
- **Lucide React Native** para ícones

### Backend
- **Supabase** como Backend as a Service (BaaS)
- **PostgreSQL** para banco de dados
- **Supabase Auth** para autenticação
- **Supabase Storage** para armazenamento de imagens
- **Row Level Security (RLS)** para segurança de dados

### Banco de Dados
- **7 tabelas principais**: profiles, services, bookings, reviews, professional_photos, subscriptions
- **4 enums**: user_type, booking_status, subscription_plan_type, subscription_status
- **Funções SQL**: para lógica de negócio no servidor
- **Políticas RLS**: para segurança em nível de linha

## Fluxos Principais

### Fluxo do Cliente
1. Cliente se cadastra na plataforma
2. Busca churrasqueiros disponíveis
3. Filtra por critérios específicos
4. Visualiza detalhes do serviço e avaliações
5. Solicita reserva com detalhes do evento
6. Recebe confirmação do churrasqueiro
7. Após o evento, avalia o serviço

### Fluxo do Churrasqueiro
1. Churrasqueiro se cadastra na plataforma
2. Adquire uma assinatura (Mensal, Semestral ou Anual)
3. Cria perfil profissional com fotos
4. Cadastra serviços oferecidos
5. Recebe solicitações de reserva
6. Aceita ou recusa agendamentos
7. Realiza o serviço e marca como concluído
8. Recebe avaliações dos clientes
9. Analisa métricas de desempenho

## Regras de Negócio

1. **Cancelamento de Agendamento**
   - Clientes só podem cancelar agendamentos com mais de 24h de antecedência
   - Agendamentos com menos de 24h requerem contato direto

2. **Avaliação de Serviço**
   - Apenas clientes com agendamentos "concluídos" podem avaliar
   - Uma avaliação por agendamento (constraint única)
   - Avaliação de 1 a 5 estrelas obrigatória, comentário opcional

3. **Gerenciamento de Serviços**
   - Apenas churrasqueiros podem criar/editar seus próprios serviços
   - Serviços devem ter pelo menos uma foto (até 5 fotos)
   - Preço mínimo obrigatório, preço máximo opcional

4. **Status de Agendamento**
   - Fluxo: Pendente → Confirmado → Concluído
   - Churrasqueiro pode recusar agendamentos pendentes
   - Apenas agendamentos confirmados podem ser finalizados

5. **Segurança e Privacidade**
   - Row Level Security (RLS) em todas as tabelas
   - Usuários só acessam seus próprios dados
   - Fotos de perfil e portfólio são públicas

6. **Sistema de Assinatura**
   - Churrasqueiros precisam de assinatura ativa para usar a plataforma
   - 3 planos disponíveis: Mensal (R$30), Semestral (R$170), Anual (R$340)
   - Controle automático de datas de vencimento
   - Cancelamento automático de assinatura anterior ao comprar nova

7. **Exclusão de Conta**
   - Exclusão em cascata de todos os dados relacionados
   - Aviso detalhado sobre dados que serão removidos
   - Ação irreversível com confirmação obrigatória

## Limitações e Restrições

1. **Pagamentos**
   - Sistema de pagamento simulado para assinaturas
   - Sem integração real com gateways de pagamento
   - Pagamentos entre cliente e churrasqueiro são tratados fora da plataforma

2. **Comunicação**
   - Sem chat interno em tempo real
   - Comunicação via aplicativos externos (WhatsApp, telefone, email)

3. **Geolocalização**
   - Sem busca baseada em localização geográfica
   - Localização informada manualmente pelos usuários

4. **Notificações**
   - Sem sistema de notificações push
   - Usuários precisam verificar a plataforma para atualizações

## Extensões Futuras

1. **Sistema de Chat em Tempo Real**
   - Mensagens diretas entre cliente e churrasqueiro
   - Notificações push
   - Histórico de conversas

2. **Geolocalização**
   - Busca por proximidade
   - Mapa com churrasqueiros próximos
   - Cálculo de distância e tempo

3. **Sistema de Favoritos**
   - Clientes podem favoritar churrasqueiros
   - Lista de favoritos
   - Notificações de disponibilidade

4. **Agendamento Recorrente**
   - Eventos regulares (mensais, semanais)
   - Desconto para clientes frequentes
   - Gestão de contratos

5. **Integração com Gateway de Pagamento Real**
   - Integração com Stripe/PagSeguro
   - Pagamento online via cartão/PIX
   - Controle de comissões da plataforma

## Cronograma e Marcos

1. **Fase 1: MVP (Concluída)**
   - Autenticação e perfis
   - Cadastro de serviços
   - Busca e filtros básicos
   - Sistema de reservas simples

2. **Fase 2: Recursos Avançados (Concluída)**
   - Sistema de avaliações
   - Gestão de portfólio
   - Comunicação integrada
   - Analytics básicos

3. **Fase 3: Monetização (Concluída)**
   - Sistema de assinaturas
   - Planos diferenciados
   - Processamento de pagamentos
   - Gestão de assinaturas

4. **Fase 4: Expansão (Futura)**
   - Chat em tempo real
   - Geolocalização
   - Sistema de favoritos
   - Notificações push

5. **Fase 5: Integração Completa (Futura)**
   - Gateway de pagamento real
   - Agendamento recorrente
   - Cupons e promoções
   - API para parceiros

## Métricas de Sucesso

1. **Engajamento**
   - Número de usuários ativos mensais
   - Tempo médio de sessão
   - Taxa de retenção

2. **Transações**
   - Número de reservas concluídas
   - Valor médio por reserva
   - Taxa de conversão (visualizações → reservas)

3. **Monetização**
   - Receita mensal com assinaturas
   - Lifetime Value (LTV) dos churrasqueiros
   - Taxa de renovação de assinaturas

4. **Qualidade**
   - Avaliação média dos serviços
   - Taxa de cancelamento
   - Número de reclamações

## Conclusão

O ChurrasJa é uma plataforma completa que resolve o problema de conexão entre clientes e churrasqueiros profissionais, oferecendo uma experiência digital moderna para um serviço tradicionalmente contratado por indicação ou meios informais.

A plataforma está estruturada para crescer organicamente, com uma base sólida de funcionalidades essenciais já implementadas e um roadmap claro para expansões futuras. O modelo de negócio baseado em assinaturas para profissionais garante a sustentabilidade financeira do projeto.

Com foco na experiência do usuário, segurança de dados e escalabilidade, o ChurrasJa tem potencial para se tornar a principal referência no mercado de serviços de churrasco, beneficiando tanto clientes quanto profissionais do setor.