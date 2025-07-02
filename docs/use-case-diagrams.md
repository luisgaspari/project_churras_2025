# Diagramas de Caso de Uso - ChurrasJa

## Visão Geral do Sistema

O ChurrasJa é uma plataforma que conecta clientes que desejam contratar serviços de churrasco com churrasqueiros profissionais.

## Atores do Sistema

### Atores Primários
- **Cliente**: Usuário que busca e contrata serviços de churrasco
- **Churrasqueiro**: Profissional que oferece serviços de churrasco

### Atores Secundários
- **Sistema de Autenticação**: Gerencia login/logout
- **Sistema de Notificação**: Envia notificações por email/WhatsApp
- **Sistema de Pagamento**: Processa pagamentos (futuro)

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
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │ Ver Detalhes do │
                                  │    Serviço      │
                                  └─────────────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │ Fazer Reserva   │
                                  └─────────────────┘
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │ Gerenciar       │
                                  │ Agendamentos    │
                                  └─────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
            │ Cancelar        │    │ Contatar        │    │ Avaliar         │
            │ Agendamento     │    │ Churrasqueiro   │    │ Churrasqueiro   │
            └─────────────────┘    └─────────────────┘    └─────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
            │ Enviar WhatsApp │    │ Fazer Ligação  │    │ Enviar Email    │
            └─────────────────┘    └─────────────────┘    └─────────────────┘
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

#### UC02 - Buscar Serviços
- **Ator**: Cliente
- **Descrição**: Cliente busca churrasqueiros disponíveis
- **Fluxo Principal**:
  1. Cliente acessa tela de busca
  2. Cliente pode aplicar filtros (preço, localização, avaliação)
  3. Sistema exibe lista de serviços
  4. Cliente pode ver detalhes de cada serviço

#### UC03 - Fazer Reserva
- **Ator**: Cliente
- **Descrição**: Cliente agenda um serviço de churrasco
- **Fluxo Principal**:
  1. Cliente seleciona um serviço
  2. Cliente preenche dados do evento (data, hora, local, convidados)
  3. Cliente confirma reserva
  4. Sistema cria agendamento com status "pendente"

#### UC04 - Gerenciar Agendamentos
- **Ator**: Cliente
- **Descrição**: Cliente visualiza e gerencia seus agendamentos
- **Fluxo Principal**:
  1. Cliente acessa "Meus Agendamentos"
  2. Sistema exibe agendamentos por status
  3. Cliente pode cancelar, contatar churrasqueiro ou avaliar

#### UC05 - Contatar Churrasqueiro
- **Ator**: Cliente
- **Descrição**: Cliente entra em contato com churrasqueiro
- **Fluxo Principal**:
  1. Cliente seleciona opção de contato
  2. Sistema oferece opções (WhatsApp, telefone, email)
  3. Cliente escolhe meio de contato
  4. Sistema abre aplicativo correspondente

#### UC06 - Avaliar Churrasqueiro
- **Ator**: Cliente
- **Descrição**: Cliente avalia serviço após conclusão
- **Fluxo Principal**:
  1. Cliente acessa agendamento concluído
  2. Cliente clica em "Avaliar"
  3. Cliente dá nota (1-5 estrelas) e comentário
  4. Sistema salva avaliação

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
            │ Criar Serviço   │    │ Editar Serviço │           │ Adicionar Fotos │
            └─────────────────┘    └─────────────────┘           └─────────────────┘
                                             │
                                             ▼
                                   ┌─────────────────┐
                                   │ Excluir Serviço │
                                   └─────────────────┘
                                             │
                                             ▼
                                   ┌─────────────────┐
                                   │ Gerenciar       │
                                   │ Agendamentos    │
                                   └─────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌─────────────────┐    ┌─────────────────┐      ┌─────────────────┐
            │ Aceitar         │    │ Recusar         │      │ Finalizar       │
            │ Agendamento     │    │ Agendamento     │      │ Agendamento     │
            └─────────────────┘    └─────────────────┘      └─────────────────┘
                                             │
                                             ▼
                                   ┌─────────────────┐
                                   │ Ver Relatórios  │
                                   │ e Analytics     │
                                   └─────────────────┘
```

### Casos de Uso - Churrasqueiro

#### UC07 - Gerenciar Serviços
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro cria e gerencia seus serviços
- **Fluxo Principal**:
  1. Churrasqueiro acessa "Meus Serviços"
  2. Churrasqueiro pode criar novo serviço
  3. Churrasqueiro preenche dados (título, descrição, preço, duração)
  4. Churrasqueiro adiciona fotos
  5. Sistema salva serviço

#### UC08 - Gerenciar Agendamentos
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro gerencia solicitações de agendamento
- **Fluxo Principal**:
  1. Churrasqueiro recebe notificação de novo agendamento
  2. Churrasqueiro visualiza detalhes da solicitação
  3. Churrasqueiro pode aceitar ou recusar
  4. Sistema atualiza status do agendamento

#### UC09 - Finalizar Agendamento
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro marca serviço como concluído
- **Fluxo Principal**:
  1. Churrasqueiro acessa agendamento confirmado
  2. Churrasqueiro clica em "Finalizar"
  3. Sistema atualiza status para "concluído"
  4. Cliente pode avaliar o serviço

#### UC10 - Ver Relatórios
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro visualiza analytics do negócio
- **Fluxo Principal**:
  1. Churrasqueiro acessa tela de relatórios
  2. Sistema exibe métricas (receita, agendamentos, avaliações)
  3. Churrasqueiro pode filtrar por período

#### UC11 - Gerenciar Portfólio
- **Ator**: Churrasqueiro
- **Descrição**: Churrasqueiro adiciona fotos do seu trabalho
- **Fluxo Principal**:
  1. Churrasqueiro acessa perfil
  2. Churrasqueiro adiciona fotos do portfólio
  3. Sistema salva fotos no storage
  4. Fotos ficam visíveis para clientes

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
                            │Autenticação │ │Notificação  │ │ Storage     │
                            └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Casos de Uso Transversais

### UC12 - Autenticação
- **Atores**: Cliente, Churrasqueiro
- **Descrição**: Gerenciamento de login/logout
- **Inclui**: Validação de credenciais, criação de sessão

### UC13 - Notificações
- **Atores**: Sistema
- **Descrição**: Envio de notificações por email/WhatsApp
- **Inclui**: Notificação de novo agendamento, confirmação, cancelamento

### UC14 - Upload de Imagens
- **Atores**: Churrasqueiro
- **Descrição**: Upload e gerenciamento de imagens
- **Inclui**: Validação de arquivo, compressão, storage

### UC15 - Sistema de Avaliações
- **Atores**: Cliente
- **Descrição**: Sistema de reviews e ratings
- **Inclui**: Validação de avaliação, cálculo de média

---

## Regras de Negócio

### RN01 - Cancelamento de Agendamento
- Clientes só podem cancelar agendamentos com mais de 24h de antecedência
- Agendamentos com menos de 24h requerem contato direto

### RN02 - Avaliação de Serviço
- Apenas clientes com agendamentos "concluídos" podem avaliar
- Uma avaliação por agendamento
- Avaliação de 1 a 5 estrelas obrigatória

### RN03 - Gerenciamento de Serviços
- Apenas churrasqueiros podem criar/editar seus próprios serviços
- Serviços devem ter pelo menos uma foto
- Preço mínimo obrigatório

### RN04 - Status de Agendamento
- Fluxo: Pendente → Confirmado → Concluído
- Churrasqueiro pode recusar agendamentos pendentes
- Apenas agendamentos confirmados podem ser finalizados

### RN05 - Segurança e Privacidade
- Row Level Security (RLS) em todas as tabelas
- Usuários só acessam seus próprios dados
- Fotos de perfil e portfólio são públicas

---

## Extensões Futuras

### UC16 - Sistema de Pagamento
- Integração com gateway de pagamento
- Pagamento online via cartão/PIX
- Controle de comissões da plataforma

### UC17 - Chat em Tempo Real
- Mensagens diretas entre cliente e churrasqueiro
- Notificações push
- Histórico de conversas

### UC18 - Geolocalização
- Busca por proximidade
- Mapa com churrasqueiros próximos
- Cálculo de distância e tempo

### UC19 - Sistema de Favoritos
- Clientes podem favoritar churrasqueiros
- Lista de favoritos
- Notificações de disponibilidade

### UC20 - Agendamento Recorrente
- Eventos regulares (mensais, semanais)
- Desconto para clientes frequentes
- Gestão de contratos