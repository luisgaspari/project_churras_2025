# Diagrama de Atividade - ChurrasJa

## Visão Geral

Este documento apresenta os diagramas de atividade do sistema ChurrasJa, mostrando o fluxo de processos, decisões e ações para as principais funcionalidades do sistema.

## Índice

1. [Fluxos de Autenticação](#1-fluxos-de-autenticação)
2. [Fluxos do Cliente](#2-fluxos-do-cliente)
3. [Fluxos do Churrasqueiro](#3-fluxos-do-churrasqueiro)
4. [Fluxos de Comunicação](#4-fluxos-de-comunicação)
5. [Fluxos de Assinatura](#5-fluxos-de-assinatura)
6. [Fluxos de Gestão de Conta](#6-fluxos-de-gestão-de-conta)

---

## 1. Fluxos de Autenticação

### 1.1 Cadastro de Usuário

```mermaid
flowchart TD
    A[Início] --> B[Usuário acessa tela inicial]
    B --> C[Seleciona tipo: Cliente ou Churrasqueiro]
    C --> D[Clica em 'Criar Conta']
    D --> E[Preenche formulário de cadastro]
    E --> F{Validar dados}
    F -- Dados inválidos --> G[Exibe mensagens de erro]
    G --> E
    F -- Dados válidos --> H[Envia requisição para Supabase Auth]
    H --> I{Cadastro bem-sucedido?}
    I -- Não --> J[Exibe erro de cadastro]
    J --> E
    I -- Sim --> K[Cria perfil no banco de dados]
    K --> L{Perfil criado?}
    L -- Não --> M[Exibe erro de criação de perfil]
    M --> E
    L -- Sim --> N[Atualiza estado de autenticação]
    N --> O[Redireciona para área principal]
    O --> P[Fim]
```

### 1.2 Login de Usuário

```mermaid
flowchart TD
    A[Início] --> B[Usuário acessa tela de login]
    B --> C[Preenche email e senha]
    C --> D[Clica em 'Entrar']
    D --> E{Validar dados}
    E -- Dados inválidos --> F[Exibe mensagens de erro]
    F --> C
    E -- Dados válidos --> G[Envia requisição para Supabase Auth]
    G --> H{Login bem-sucedido?}
    H -- Não --> I[Exibe erro de autenticação]
    I --> C
    H -- Sim --> J[Carrega perfil do usuário]
    J --> K{Tipo de usuário?}
    K -- Cliente --> L[Redireciona para área do cliente]
    K -- Churrasqueiro --> M[Redireciona para área do churrasqueiro]
    L --> N[Fim]
    M --> N
```

---

## 2. Fluxos do Cliente

### 2.1 Busca e Filtro de Serviços

```mermaid
flowchart TD
    A[Início] --> B[Cliente acessa tela de busca]
    B --> C[Carrega lista de serviços]
    C --> D[Exibe serviços ordenados por avaliação]
    D --> E{Cliente deseja filtrar?}
    E -- Não --> F[Cliente visualiza serviços]
    E -- Sim --> G[Cliente define filtros]
    G --> H[Aplica filtros localmente]
    H --> I[Exibe resultados filtrados]
    I --> F
    F --> J{Cliente seleciona serviço?}
    J -- Não --> K[Fim]
    J -- Sim --> L[Navega para detalhes do serviço]
    L --> M[Fim]
```

### 2.2 Criação de Reserva

```mermaid
flowchart TD
    A[Início] --> B[Cliente visualiza detalhes do serviço]
    B --> C[Clica em 'Fazer Reserva']
    C --> D[Exibe formulário de reserva]
    D --> E[Cliente preenche data, hora, local e convidados]
    E --> F{Validar dados}
    F -- Dados inválidos --> G[Exibe mensagens de erro]
    G --> E
    F -- Dados válidos --> H[Calcula preço total]
    H --> I[Cliente confirma reserva]
    I --> J[Envia requisição para criar reserva]
    J --> K{Reserva criada?}
    K -- Não --> L[Exibe erro de criação]
    L --> E
    K -- Sim --> M[Exibe mensagem de sucesso]
    M --> N[Redireciona para 'Meus Agendamentos']
    N --> O[Fim]
```

### 2.3 Cancelamento de Reserva

```mermaid
flowchart TD
    A[Início] --> B[Cliente acessa 'Meus Agendamentos']
    B --> C[Seleciona agendamento pendente]
    C --> D[Clica em 'Cancelar']
    D --> E{Agendamento é em menos de 24h?}
    E -- Sim --> F[Exibe alerta de impossibilidade]
    F --> G[Oferece opção de contato direto]
    G --> H{Cliente deseja contatar?}
    H -- Não --> I[Fim]
    H -- Sim --> J[Abre opções de contato]
    J --> I
    E -- Não --> K[Exibe confirmação de cancelamento]
    K --> L{Cliente confirma?}
    L -- Não --> I
    L -- Sim --> M[Atualiza status para 'cancelled']
    M --> N[Exibe mensagem de sucesso]
    N --> O[Atualiza lista de agendamentos]
    O --> I
```

### 2.4 Avaliação de Serviço

```mermaid
flowchart TD
    A[Início] --> B[Cliente acessa 'Meus Agendamentos']
    B --> C[Filtra por agendamentos concluídos]
    C --> D[Seleciona agendamento não avaliado]
    D --> E[Clica em 'Avaliar']
    E --> F[Exibe modal de avaliação]
    F --> G[Cliente seleciona estrelas]
    G --> H[Cliente adiciona comentário opcional]
    H --> I[Clica em 'Enviar Avaliação']
    I --> J{Avaliação válida?}
    J -- Não --> K[Exibe erro de validação]
    K --> G
    J -- Sim --> L[Envia avaliação para o banco]
    L --> M{Avaliação salva?}
    M -- Não --> N[Exibe erro de salvamento]
    N --> G
    M -- Sim --> O[Exibe mensagem de sucesso]
    O --> P[Fecha modal]
    P --> Q[Atualiza status de avaliação]
    Q --> R[Fim]
```

---

## 3. Fluxos do Churrasqueiro

### 3.1 Criação de Serviço

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Meus Serviços']
    B --> C[Clica em 'Criar Serviço']
    C --> D[Preenche informações básicas]
    D --> E[Define preços]
    E --> F[Configura detalhes do serviço]
    F --> G[Adiciona fotos]
    G --> H{Validar formulário}
    H -- Dados inválidos --> I[Exibe mensagens de erro]
    I --> D
    H -- Dados válidos --> J[Faz upload das imagens]
    J --> K[Cria serviço no banco]
    K --> L{Serviço criado?}
    L -- Não --> M[Exibe erro de criação]
    M --> D
    L -- Sim --> N[Exibe mensagem de sucesso]
    N --> O[Redireciona para lista de serviços]
    O --> P[Fim]
```

### 3.2 Gestão de Agendamentos

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Agendamentos']
    B --> C[Seleciona filtro: Pendentes/Confirmados/Todos]
    C --> D[Visualiza lista de agendamentos]
    D --> E{Seleciona agendamento}
    E -- Pendente --> F[Visualiza detalhes do agendamento pendente]
    F --> G{Ação escolhida}
    G -- Aceitar --> H[Atualiza status para 'confirmed']
    G -- Recusar --> I[Atualiza status para 'cancelled']
    G -- Contatar --> J[Abre opções de contato]
    E -- Confirmado --> K[Visualiza detalhes do agendamento confirmado]
    K --> L{Ação escolhida}
    L -- Finalizar --> M[Atualiza status para 'completed']
    L -- Contatar --> J
    H --> N[Exibe mensagem de confirmação]
    I --> O[Exibe mensagem de recusa]
    M --> P[Exibe mensagem de finalização]
    N --> Q[Atualiza lista de agendamentos]
    O --> Q
    P --> Q
    J --> R[Fim]
    Q --> R
```

### 3.3 Gestão de Portfólio

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Perfil']
    B --> C[Visualiza seção 'Minhas Fotos']
    C --> D{Ação escolhida}
    D -- Adicionar Foto --> E[Exibe opções: Câmera/Galeria]
    E --> F[Seleciona fonte da imagem]
    F --> G[Captura ou seleciona imagem]
    G --> H[Valida tamanho e formato]
    H --> I[Faz upload para Supabase Storage]
    I --> J[Salva referência no banco]
    J --> K[Atualiza lista de fotos]
    D -- Excluir Foto --> L[Exibe confirmação]
    L --> M{Confirma exclusão?}
    M -- Não --> C
    M -- Sim --> N[Remove do Storage]
    N --> O[Remove do banco de dados]
    O --> K
    K --> P[Fim]
```

### 3.4 Visualização de Analytics

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Relatórios']
    B --> C[Carrega dados de agendamentos]
    C --> D[Carrega dados de avaliações]
    D --> E[Calcula métricas principais]
    E --> F[Calcula receita mensal]
    F --> G[Identifica serviços mais populares]
    G --> H[Exibe dashboard com métricas]
    H --> I[Exibe gráfico de receita]
    I --> J[Exibe lista de serviços populares]
    J --> K[Exibe dicas para melhorar]
    K --> L[Fim]
```

---

## 4. Fluxos de Comunicação

### 4.1 Contato via WhatsApp

```mermaid
flowchart TD
    A[Início] --> B[Usuário seleciona 'Contatar']
    B --> C[Escolhe opção 'WhatsApp']
    C --> D[Formata número de telefone]
    D --> E[Prepara mensagem pré-formatada]
    E --> F[Gera URL do WhatsApp]
    F --> G[Tenta abrir WhatsApp nativo]
    G --> H{WhatsApp instalado?}
    H -- Sim --> I[Abre conversa no WhatsApp]
    H -- Não --> J[Tenta abrir WhatsApp Web]
    J --> K{Navegador disponível?}
    K -- Sim --> L[Abre WhatsApp Web]
    K -- Não --> M[Exibe erro]
    I --> N[Fim]
    L --> N
    M --> N
```

### 4.2 Contato via Email

```mermaid
flowchart TD
    A[Início] --> B[Usuário seleciona 'Contatar']
    B --> C[Escolhe opção 'E-mail']
    C --> D[Prepara assunto do email]
    D --> E[Prepara corpo do email com detalhes]
    E --> F[Gera URL mailto]
    F --> G[Tenta abrir app de email]
    G --> H{App de email disponível?}
    H -- Sim --> I[Abre composer de email]
    H -- Não --> J[Exibe erro]
    I --> K[Fim]
    J --> K
```

---

## 5. Fluxos de Assinatura

### 5.1 Compra de Assinatura

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Configurações da Conta']
    B --> C[Visualiza status da assinatura atual]
    C --> D[Clica em 'Ver Planos' ou 'Assinar Agora']
    D --> E[Exibe modal com planos disponíveis]
    E --> F[Seleciona plano: Mensal/Semestral/Anual]
    F --> G[Clica em 'Continuar']
    G --> H[Exibe formulário de pagamento]
    H --> I[Preenche dados do cartão]
    I --> J[Clica em 'Finalizar Compra']
    J --> K{Validar dados do cartão}
    K -- Dados inválidos --> L[Exibe erros de validação]
    L --> I
    K -- Dados válidos --> M{Assinatura ativa existente?}
    M -- Sim --> N[Cancela assinatura anterior]
    M -- Não --> O[Calcula data de vencimento]
    N --> O
    O --> P[Cria nova assinatura no banco]
    P --> Q{Assinatura criada?}
    Q -- Não --> R[Exibe erro de processamento]
    R --> I
    Q -- Sim --> S[Exibe confirmação de sucesso]
    S --> T[Atualiza status da assinatura]
    T --> U[Fecha modais]
    U --> V[Fim]
```

### 5.2 Verificação de Status da Assinatura

```mermaid
flowchart TD
    A[Início] --> B[Sistema verifica assinatura do churrasqueiro]
    B --> C[Consulta função get_current_subscription]
    C --> D{Assinatura encontrada?}
    D -- Não --> E[Define status como 'sem assinatura']
    D -- Sim --> F{Status da assinatura}
    F -- active --> G{Data de vencimento > hoje?}
    G -- Sim --> H[Calcula dias restantes]
    H --> I[Exibe status 'Ativa' com dias restantes]
    G -- Não --> J[Atualiza status para 'expired']
    J --> K[Exibe status 'Expirada']
    F -- expired --> K
    F -- cancelled --> L[Exibe status 'Cancelada']
    E --> M[Exibe opção 'Assinar Agora']
    I --> N[Exibe opção 'Renovar/Alterar']
    K --> M
    L --> M
    M --> O[Fim]
    N --> O
```

---

## 6. Fluxos de Gestão de Conta

### 6.1 Exclusão de Conta

```mermaid
flowchart TD
    A[Início] --> B[Usuário acessa 'Configurações da Conta']
    B --> C[Clica em 'Excluir Conta']
    C --> D[Exibe modal de confirmação com avisos]
    D --> E{Usuário confirma exclusão?}
    E -- Não --> F[Fecha modal]
    F --> G[Fim]
    E -- Sim --> H[Inicia processo de exclusão]
    H --> I[Chama Supabase Auth para excluir usuário]
    I --> J{Exclusão bem-sucedida?}
    J -- Não --> K[Exibe erro de exclusão]
    K --> G
    J -- Sim --> L[Limpa estado de autenticação]
    L --> M[Exibe mensagem de sucesso]
    M --> N[Redireciona para tela inicial]
    N --> G
```

### 6.2 Edição de Perfil

```mermaid
flowchart TD
    A[Início] --> B[Usuário acessa 'Editar Perfil']
    B --> C[Carrega dados atuais do perfil]
    C --> D[Exibe formulário preenchido]
    D --> E[Usuário edita informações]
    E --> F{Usuário altera avatar?}
    F -- Sim --> G[Exibe opções: Câmera/Galeria]
    G --> H[Captura ou seleciona imagem]
    H --> I[Faz upload para Storage]
    I --> J[Atualiza URL do avatar]
    F -- Não --> K[Usuário clica em 'Salvar']
    J --> K
    K --> L{Validar dados}
    L -- Dados inválidos --> M[Exibe mensagens de erro]
    M --> E
    L -- Dados válidos --> N[Atualiza perfil no banco]
    N --> O{Atualização bem-sucedida?}
    O -- Não --> P[Exibe erro de atualização]
    P --> E
    O -- Sim --> Q[Exibe mensagem de sucesso]
    Q --> R[Atualiza contexto de autenticação]
    R --> S[Retorna para tela de perfil]
    S --> T[Fim]
```

---

## Fluxos Adicionais

### Gestão de Avaliações

```mermaid
flowchart TD
    A[Início] --> B[Churrasqueiro acessa 'Avaliações']
    B --> C[Carrega avaliações do banco]
    C --> D[Calcula estatísticas]
    D --> E[Exibe resumo de avaliações]
    E --> F[Exibe lista de avaliações]
    F --> G{Tem avaliações?}
    G -- Sim --> H[Exibe detalhes de cada avaliação]
    G -- Não --> I[Exibe mensagem 'Sem avaliações']
    I --> J[Exibe dicas para receber avaliações]
    H --> K[Fim]
    J --> K
```

### Processamento de Pagamento

```mermaid
flowchart TD
    A[Início] --> B[Usuário seleciona plano de assinatura]
    B --> C[Preenche dados do cartão]
    C --> D[Clica em 'Finalizar Compra']
    D --> E{Validar dados do cartão}
    E -- Inválidos --> F[Exibe erros de validação]
    F --> C
    E -- Válidos --> G[Simula processamento de pagamento]
    G --> H{Pagamento aprovado?}
    H -- Não --> I[Exibe erro de pagamento]
    I --> C
    H -- Sim --> J[Cria registro de assinatura]
    J --> K[Exibe confirmação de sucesso]
    K --> L[Atualiza status da assinatura]
    L --> M[Fim]
```

---

## Conclusão

Os diagramas de atividade apresentados neste documento ilustram os principais fluxos de trabalho do sistema ChurrasJa, demonstrando:

1. **Fluxos de Autenticação**: Cadastro e login de usuários
2. **Fluxos do Cliente**: Busca, reserva, cancelamento e avaliação
3. **Fluxos do Churrasqueiro**: Criação de serviços, gestão de agendamentos e portfólio
4. **Fluxos de Comunicação**: Contato via diferentes canais
5. **Fluxos de Assinatura**: Compra e verificação de assinaturas
6. **Fluxos de Gestão de Conta**: Edição de perfil e exclusão de conta

Estes diagramas servem como referência para entender o comportamento do sistema e as interações entre os diferentes componentes e atores. Eles são essenciais para:

- **Desenvolvimento**: Guiar a implementação de funcionalidades
- **Testes**: Definir casos de teste e cenários
- **Documentação**: Facilitar o entendimento do sistema
- **Manutenção**: Auxiliar na identificação de pontos de melhoria

O sistema ChurrasJa implementa todos estes fluxos de forma robusta, garantindo uma experiência completa e intuitiva tanto para clientes quanto para churrasqueiros profissionais.