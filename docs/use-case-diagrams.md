# Diagramas de Caso de Uso - ChurrasJa

## Visão Geral do Sistema

O ChurrasJa é uma plataforma que conecta clientes que desejam contratar serviços de churrasco com churrasqueiros profissionais. O sistema oferece funcionalidades completas de agendamento, avaliação, gestão de serviços e sistema de assinatura para profissionais.

## Atores do Sistema

### Atores Primários
- **Cliente**: Usuário que busca e contrata serviços de churrasco
- **Churrasqueiro**: Profissional que oferece serviços de churrasco

### Atores Secundários
- **Sistema de Autenticação**: Gerencia login/logout e criação de contas
- **Sistema de Notificação**: Envia notificações por email/WhatsApp
- **Sistema de Storage**: Gerencia upload e armazenamento de imagens
- **Sistema de Pagamento**: Processa assinaturas (implementado)

---

## Diagrama de Caso de Uso - Cliente

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    CLIENTE                              │
                    └─────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────────┐
                    │                         │                             │
                    ▼                         ▼                             ▼
            ┌─────────────────┐    ┌─────────────────┐           ┌─────────────────┐
            │   Fazer Login   │    │ Buscar Serviços│           │ Gerenciar Perfil│
            └─────────────────┘    └─────────────────┘           └─────────────────┘
                    │                         │                             │
                    │                         │                             │
                    ▼                         ▼                             ▼
            ┌─────────────────┐    ┌─────────────────┐           ┌─────────────────┐
            │ Criar Conta     │    │ Filtrar Serviços│          │ Editar Perfil   │
            └─────────────────┘    └─────────────────┘           └─────────────────┘
                                            │                             │
                                            ▼                             ▼
                                  ┌─────────────────┐           ┌─────────────────┐
                                  │ Ver Detalhes do │           │ Alterar Avatar  │
                                  │    Serviço      │           └─────────────────┘
                                  └─────────────────┘                     │
                                            │                             ▼
                                            ▼                   ┌─────────────────┐
                                  ┌─────────────────┐           │ Configurações   │
                                  │ Fazer Reserva   │           │ da Conta        │
                                  └─────────────────┘           └─────────────────┘
                                            │                             │
                                            ▼                             ▼
                                  ┌─────────────────┐           ┌─────────────────┐
                                  │ Gerenciar       │           │ Excluir Conta   │
                                  │ Agendamentos    │           └─────────────────┘
                                  └─────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
            │ Cancelar        │    │ Contatar        │    │ Avaliar         │
            │ Agendamento     │    │ Churrasqueiro   │    │ Churrasqueiro   │
            └─────────────────┘    └─────────────────┘    └─────────────────┘
                                            │                       │
                    ┌───────────────────────┼───────────────────────┼─────────┐
                    │                       │                       │         │
                    ▼                       ▼                       ▼         ▼
            ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
            │ Enviar WhatsApp │    │ Fazer Ligação  │    │ Enviar Email    │ │
            │                 │    │                 │    │                 │ │
            └─────────────────┘    └─────────────────┘    └─────────────────┘ │
                                                                              │
                                                                              ▼
                                                                    ┌─────────────────┐
                                                                    │ Dar Nota e      │
                                                                    │ Comentário      │
                                                                    └─────────────────┘
```

### Casos de Uso - Cliente

#### UC01 - Autenticação
- **Ator**: Cliente
- **Descrição**: Cliente faz login ou cria nova conta
- **Fluxo Principal**:
  1. Cliente acessa a tela de login
  2. Cliente informa email e senha
  3. Sistema valida credenciais
  4. Cliente é redirecionado para área principal
- **Status**: ✅ Implementado

#### UC02 - Buscar Serviços
- **Ator**: Cliente
- **Descrição**: Cliente busca churrasqueiros disponíveis
- **Fluxo Principal**:
  1. Cliente acessa tela de busca
  2. Cliente pode aplicar filtros (preço, localização, avaliação, duração, convidados)
  3. Sistema exibe lista de serviços ordenados por avaliação
  4. Cliente pode ver detalhes de cada serviço
- **Status**: ✅ Implementado

#### UC03 - Fazer Reserva
- **Ator**: Cliente
- **Descrição**: Cliente agenda um serviço de churrasco
- **Fluxo Principal**:
  1. Cliente seleciona um serviço
  2. Cliente preenche dados do evento (data, hora, local, convidados)
  3. Cliente adiciona observações opcionais
  4. Sistema calcula preço total
  5. Cliente confirma reserva
  6. Sistema cria agendamento com status "pendente"
- **Status**: ✅ Implementado

#### UC04 - Gerenciar Agendamentos
- **Ator**: Cliente
- **Descrição**: Cliente visualiza e gerencia seus agendamentos
- **Fluxo Principal**:
  1. Cliente acessa "Meus Agendamentos"
  2. Sistema exibe agendamentos por status (próximos/histórico)
  3. Cliente pode cancelar (com restrição de 24h), contatar churrasqueiro ou avaliar
- **Status**: ✅ Implementado

#### UC05 - Contatar Churrasqueiro
- **Ator**: Cliente
- **Descrição**: Cliente entra em contato com churrasqueiro
- **Fluxo Principal**:
  1. Cliente seleciona opção de contato
  2. Sistema oferece opções (WhatsApp, telefone, email)
  3. Cliente escolhe meio de contato
  4. Sistema abre aplicativo correspondente com mensagem pré-formatada
- **Status**: ✅ Implementado

#### UC06 - Avaliar Churrasqueiro
- **Ator**: Cliente
- **Descrição**: Cliente avalia serviço após conclusão
- **Fluxo Principal**:
  1. Cliente acessa agendamento concluído
  2. Cliente clica em "Avaliar"
  3. Cliente dá nota (1-5 estrelas) obrigatória
  4. Cliente adiciona comentário opcional (até 500 caracteres)
  5. Sistema salva avaliação
- **Status**: ✅ Implementado

#### UC07 - Gerenciar Perfil
- **Ator**: Cliente
- **Descrição**: Cliente gerencia suas informações pessoais
- **Fluxo Principal**:
  1. Cliente acessa perfil
  2. Cliente pode editar informações (nome, email, telefone, localização)
  3. Cliente pode alterar avatar
  4. Sistema valida e salva alterações
- **Status**: ✅ Implementado

#### UC08 - Configurações da Conta
- **Ator**: Cliente
- **Descrição**: Cliente gerencia configurações da conta
- **Fluxo Principal**:
  1. Cliente acessa configurações
  2. Cliente pode excluir conta permanentemente
  3. Sistema exibe aviso detalhado sobre exclusão
  4. Cliente confirma exclusão
  5. Sistema remove todos os dados em cascata
- **Status**: ✅ Implementado

---

## Diagrama de Caso de Uso - Churrasqueiro

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                 CHURRASQUEIRO                           │
                    └─────────────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────────┐
                    │                         │                             │
                    ▼                         ▼                             ▼
            ┌─────────────────┐    ┌─────────────────┐           ┌─────────────────┐
            │   Fazer Login   │    │ Gerenciar       │           │ Gerenciar Perfil│
            └─────────────────┘    │ Serviços        │           └─────────────────┘
                    │              └─────────────────┘                       │
                    │                         │                             │
                    ▼                         │                             ▼
            ┌─────────────────┐              │                   ┌─────────────────┐
            │ Criar Conta     │              │                   │ Editar Perfil   │
            └─────────────────┘              │                   └─────────────────┘
                                             │                             │
                    ┌────────────────────────┼────────────────────────────┼─────┐
                    │                        │                            │     │
                    ▼                        ▼                            ▼     ▼
            ┌─────────────────┐    ┌─────────────────┐           ┌─────────────────┐
            │ Criar Serviço   │    │ Editar Serviço │           │ Gerenciar       │
            └─────────────────┘    └─────────────────┘           │ Portfólio       │
                    │                        │                  └─────────────────┘
                    │                        ▼                            │
                    │              ┌─────────────────┐                    │
                    │              │ Excluir Serviço │                    ▼
                    │              └─────────────────┘           ┌─────────────────┐
                    │                        │                  │ Adicionar/      │
                    │                        ▼                  │ Remover Fotos   │
                    │              ┌─────────────────┐           └─────────────────┘
                    │              │ Gerenciar       │
                    │              │ Agendamentos    │
                    │              └─────────────────┘
                    │                        │
                    │        ┌───────────────┼───────────────┐
                    │        │               │               │
                    │        ▼               ▼               ▼
                    │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                    │ │ Aceitar         │ │ Recusar         │ │ Finalizar       │
                    │ │ Agendamento     │ │ Agendamento     │ │ Agendamento     │
                    │ └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │                                                  │
                    │                                                  ▼
                    │                                        ┌─────────────────┐
                    │                                        │ Ver Avaliações  │
                    │                                        │ Recebidas       │
                    │                                        └─────────────────┘
                    │                                                  │
                    │                                                  ▼
                    │                                        ┌─────────────────┐
                    │                                        │ Ver Relatórios  │
                    │                                        │ e Analytics     │
                    │                                        └─────────────────┘
                    │                                                  │
                    │                                                  ▼
                    │                                        ┌─────────────────┐
                    │                                        │ Configurações   │
                    │                                        │ da Conta        │
                    │                                        └─────────────────┘
                    │                                                  │
                    │                        ┌─────────────────────────┼─────────────────────────┐
                    │                        │                         │                         │
                    │                        ▼                         ▼                         ▼
                    │              ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
                    │              │ Gerenciar       │       │ Comprar         │       │ Excluir Conta   │
                    │              │ Assinatura      │       │ Assinatura      │       └─────────────────┘
                    │              └─────────────────┘       └─────────────────┘
                    │                        │                         │
                    │                        │                         ▼
                    │                        │               ┌─────────────────┐
                    │                        │               │ Escolher Plano  │
                    │                        │               │ (Mensal/Semestral/│
                    │                        │               │ Anual)          │
                    │                        │               └─────────────────┘
                    │                        │                         │
                    │                        │                         ▼
                    │                        │               ┌─────────────────┐
                    │                        │               │ Pagamento com   │
                    │                        │               │ Cartão Crédito  │
                    │                        │               └─────────────────┘
                    │                        │
                    │                        ▼
                    │              ┌─────────────────┐
                    │              │ Renovar/Alterar │
                    │              │ Plano           │
                    │              └─────────────────┘
                    │
                    └──────────────────────────────────────────────────────────────────────────────────┘
```

### Casos de Uso - Churrasqueiro

#### UC09 - Gerenciar Serviços
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro cria e gerencia seus serviços
- **Fluxo Principal**:
  1. Churrasqueiro acessa "Meus Serviços"
  2. Churrasqueiro pode criar novo serviço
  3. Churrasqueiro preenche dados (título, descrição, preço, duração, localização)
  4. Churrasqueiro adiciona até 5 fotos obrigatórias
  5. Sistema salva serviço
  6. Churrasqueiro pode editar ou excluir serviços existentes
- **Status**: ✅ Implementado

#### UC10 - Gerenciar Agendamentos
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro gerencia solicitações de agendamento
- **Fluxo Principal**:
  1. Churrasqueiro recebe notificação de novo agendamento
  2. Churrasqueiro visualiza detalhes da solicitação
  3. Churrasqueiro pode aceitar, recusar ou contatar cliente
  4. Sistema atualiza status do agendamento
  5. Churrasqueiro pode finalizar agendamentos confirmados
- **Status**: ✅ Implementado

#### UC11 - Gerenciar Portfólio
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro adiciona fotos do seu trabalho
- **Fluxo Principal**:
  1. Churrasqueiro acessa perfil
  2. Churrasqueiro adiciona fotos do portfólio (câmera ou galeria)
  3. Sistema faz upload para storage
  4. Fotos ficam visíveis para clientes
  5. Churrasqueiro pode remover fotos
- **Status**: ✅ Implementado

#### UC12 - Ver Avaliações
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro visualiza avaliações recebidas
- **Fluxo Principal**:
  1. Churrasqueiro acessa tela de avaliações
  2. Sistema exibe estatísticas (média, distribuição por estrelas)
  3. Sistema lista avaliações com comentários
  4. Churrasqueiro pode ver dicas para melhorar
- **Status**: ✅ Implementado

#### UC13 - Ver Relatórios
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro visualiza analytics do negócio
- **Fluxo Principal**:
  1. Churrasqueiro acessa tela de relatórios
  2. Sistema exibe métricas (receita, agendamentos, avaliações, taxa de conclusão)
  3. Sistema mostra gráfico de receita mensal
  4. Sistema lista serviços mais populares
  5. Sistema oferece dicas para melhorar
- **Status**: ✅ Implementado

#### UC14 - Sistema de Assinatura
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro gerencia assinatura da plataforma
- **Fluxo Principal**:
  1. Churrasqueiro acessa configurações da conta
  2. Sistema exibe status atual da assinatura
  3. Churrasqueiro pode escolher plano (Mensal R$30, Semestral R$170, Anual R$340)
  4. Churrasqueiro preenche dados do cartão de crédito
  5. Sistema processa pagamento e ativa assinatura
  6. Sistema calcula data de vencimento automaticamente
- **Status**: ✅ Implementado

#### UC15 - Configurações da Conta
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro gerencia configurações da conta
- **Fluxo Principal**:
  1. Churrasqueiro acessa configurações
  2. Churrasqueiro pode gerenciar assinatura
  3. Churrasqueiro pode excluir conta permanentemente
  4. Sistema exibe aviso detalhado sobre exclusão
  5. Sistema remove todos os dados em cascata
- **Status**: ✅ Implementado

---

## Diagrama de Caso de Uso - Sistema Geral

```
                    ┌─────────────────┐                    ┌─────────────────┐
                    │     CLIENTE     │                    │ CHURRASQUEIRO   │
                    └─────────────────┘                    └─────────────────┘
                             │                                       │
                             │                                       │
                    ┌────────┼───────────────────────────────────────┼────────┐
                    │        │                                       │        │
                    │        ▼                                       ▼        │
                    │ ┌─────────────────┐                 ┌─────────────────┐ │
                    │ │ Buscar Serviços │                 │ Criar Serviços  │ │
                    │ └─────────────────┘                 └─────────────────┘ │
                    │        │                                       │        │
                    │        ▼                                       ▼        │
                    │ ┌─────────────────┐                 ┌─────────────────┐ │
                    │ │ Fazer Reserva   │◄────────────────┤ Gerenciar       │ │
                    │ └─────────────────┘                 │ Agendamentos    │ │
                    │        │                            └─────────────────┘ │
                    │        ▼                                       │        │
                    │ ┌─────────────────┐                          ▼        │
                    │ │ Avaliar Serviço │                 ┌─────────────────┐ │
                    │ └─────────────────┘                 │ Ver Relatórios  │ │
                    │        │                            └─────────────────┘ │
                    │        ▼                                       │        │
                    │ ┌─────────────────┐                          ▼        │
                    │ │ Excluir Conta   │                 ┌─────────────────┐ │
                    │ └─────────────────┘                 │ Sistema de      │ │
                    │                                     │ Assinatura      │ │
                    │                                     └─────────────────┘ │
                    │                                                          │
                    │                    SISTEMA CHURRASJA                     │
                    └──────────────────────────────────────────────────────────┘
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                                    ▼              ▼              ▼
                            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
                            │ Sistema de  │ │ Sistema de  │ │ Sistema de  │
                            │Autenticação │ │ Storage     │ │ Pagamento   │
                            └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Casos de Uso Transversais

### UC16 - Autenticação
- **Atores**: Cliente, Churrasqueiro
- **Descrição**: Gerenciamento de login/logout
- **Inclui**: Validação de credenciais, criação de sessão, refresh tokens
- **Status**: ✅ Implementado

### UC17 - Upload de Imagens
- **Atores**: Churrasqueiro
- **Descrição**: Upload e gerenciamento de imagens
- **Inclui**: Validação de arquivo, compressão, storage no Supabase
- **Status**: ✅ Implementado

### UC18 - Sistema de Avaliações
- **Atores**: Cliente
- **Descrição**: Sistema de reviews e ratings
- **Inclui**: Validação de avaliação, cálculo de média, exibição de estatísticas
- **Status**: ✅ Implementado

### UC19 - Sistema de Notificações
- **Atores**: Sistema
- **Descrição**: Integração com WhatsApp, telefone e email
- **Inclui**: Formatação de mensagens, abertura de aplicativos nativos
- **Status**: ✅ Implementado

### UC20 - Sistema de Pagamento
- **Atores**: Churrasqueiro
- **Descrição**: Processamento de assinaturas
- **Inclui**: Validação de cartão, cálculo de datas, controle de status
- **Status**: ✅ Implementado

---

## Regras de Negócio

### RN01 - Cancelamento de Agendamento
- Clientes só podem cancelar agendamentos com mais de 24h de antecedência
- Agendamentos com menos de 24h requerem contato direto com o churrasqueiro
- **Status**: ✅ Implementado

### RN02 - Avaliação de Serviço
- Apenas clientes com agendamentos "concluídos" podem avaliar
- Uma avaliação por agendamento (constraint única)
- Avaliação de 1 a 5 estrelas obrigatória, comentário opcional
- **Status**: ✅ Implementado

### RN03 - Gerenciamento de Serviços
- Apenas churrasqueiros podem criar/editar seus próprios serviços
- Serviços devem ter pelo menos uma foto (até 5 fotos)
- Preço mínimo obrigatório, preço máximo opcional
- **Status**: ✅ Implementado

### RN04 - Status de Agendamento
- Fluxo: Pendente → Confirmado → Concluído
- Churrasqueiro pode recusar agendamentos pendentes
- Apenas agendamentos confirmados podem ser finalizados
- **Status**: ✅ Implementado

### RN05 - Segurança e Privacidade
- Row Level Security (RLS) em todas as tabelas
- Usuários só acessam seus próprios dados
- Fotos de perfil e portfólio são públicas
- **Status**: ✅ Implementado

### RN06 - Sistema de Assinatura
- Churrasqueiros precisam de assinatura ativa para usar a plataforma
- 3 planos disponíveis: Mensal (R$30), Semestral (R$170), Anual (R$340)
- Controle automático de datas de vencimento
- Cancelamento automático de assinatura anterior ao comprar nova
- **Status**: ✅ Implementado

### RN07 - Exclusão de Conta
- Exclusão em cascata de todos os dados relacionados
- Aviso detalhado sobre dados que serão removidos
- Ação irreversível com confirmação obrigatória
- **Status**: ✅ Implementado

---

## Funcionalidades Implementadas

### ✅ Autenticação e Perfis
- [x] Login/Logout para clientes e churrasqueiros
- [x] Criação de contas com tipos diferentes
- [x] Edição de perfil com upload de avatar
- [x] Validação de dados e campos obrigatórios

### ✅ Gestão de Serviços (Churrasqueiro)
- [x] Criar, editar e excluir serviços
- [x] Upload de múltiplas imagens (até 5)
- [x] Definição de preços, duração e capacidade
- [x] Gestão de portfólio com fotos do trabalho

### ✅ Busca e Reservas (Cliente)
- [x] Busca de serviços com filtros avançados
- [x] Visualização de detalhes do serviço
- [x] Sistema de reserva com cálculo de preço
- [x] Validação de datas e horários

### ✅ Gestão de Agendamentos
- [x] Dashboard para churrasqueiros
- [x] Aceitar/recusar agendamentos
- [x] Finalizar serviços
- [x] Histórico completo de agendamentos

### ✅ Sistema de Avaliações
- [x] Avaliação com estrelas (1-5) e comentários
- [x] Cálculo de média e estatísticas
- [x] Exibição de avaliações para clientes
- [x] Dashboard de avaliações para churrasqueiros

### ✅ Comunicação
- [x] Integração com WhatsApp
- [x] Ligações telefônicas
- [x] Envio de emails
- [x] Mensagens pré-formatadas

### ✅ Relatórios e Analytics
- [x] Dashboard com métricas de negócio
- [x] Gráficos de receita mensal
- [x] Serviços mais populares
- [x] Taxa de conclusão e estatísticas

### ✅ Sistema de Assinatura
- [x] 3 planos de assinatura
- [x] Pagamento com cartão de crédito
- [x] Controle de datas de vencimento
- [x] Status da assinatura em tempo real

### ✅ Configurações da Conta
- [x] Exclusão permanente de conta
- [x] Gerenciamento de assinatura
- [x] Avisos de segurança

---

## Extensões Futuras

### 🔄 Sistema de Chat em Tempo Real
- Mensagens diretas entre cliente e churrasqueiro
- Notificações push
- Histórico de conversas

### 🔄 Geolocalização
- Busca por proximidade
- Mapa com churrasqueiros próximos
- Cálculo de distância e tempo

### 🔄 Sistema de Favoritos
- Clientes podem favoritar churrasqueiros
- Lista de favoritos
- Notificações de disponibilidade

### 🔄 Agendamento Recorrente
- Eventos regulares (mensais, semanais)
- Desconto para clientes frequentes
- Gestão de contratos

### 🔄 Integração com Gateway de Pagamento Real
- Integração com Stripe/PagSeguro
- Pagamento online via cartão/PIX
- Controle de comissões da plataforma

### 🔄 Sistema de Notificações Push
- Notificações em tempo real
- Lembretes de agendamentos
- Atualizações de status

### 🔄 Sistema de Cupons e Promoções
- Códigos de desconto
- Promoções sazonais
- Programa de fidelidade

---

## Arquitetura Técnica

### Frontend
- **React Native** com Expo Router
- **React Native Paper** para UI
- **Lucide React Native** para ícones
- **Expo Image Picker** para upload de imagens

### Backend
- **Supabase** como BaaS (Backend as a Service)
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança
- **Supabase Storage** para arquivos

### Autenticação
- **Supabase Auth** com email/senha
- Gestão automática de sessões
- Refresh tokens para segurança

### Storage
- **Supabase Storage** para imagens
- Buckets separados (avatars, professional_photos, service_images)
- URLs públicas para visualização

### Banco de Dados
- **7 tabelas principais**: profiles, services, bookings, reviews, professional_photos, subscriptions
- **4 enums**: user_type, booking_status, subscription_plan_type, subscription_status
- **Índices otimizados** para performance
- **Triggers** para atualização automática de timestamps

---

## Conclusão

O ChurrasJa está com todas as funcionalidades principais implementadas e funcionais. O sistema oferece uma experiência completa tanto para clientes quanto para churrasqueiros, com recursos avançados de gestão, comunicação, avaliação e monetização.

A arquitetura é robusta, segura e escalável, utilizando tecnologias modernas e melhores práticas de desenvolvimento. O sistema está pronto para produção e pode ser facilmente expandido com as funcionalidades futuras planejadas.