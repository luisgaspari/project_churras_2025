# Descrição dos Casos de Uso - ChurrasJa

Este documento detalha os casos de uso para os atores do sistema ChurrasJa, descrevendo as interações e os fluxos principais.

## Atores

- **Cliente**: Usuário que busca, contrata e avalia serviços de churrasco.
- **Churrasqueiro**: Profissional que oferece, gerencia e executa os serviços de churrasco.
- **Sistemas Externos**: Atores secundários como Sistema de Autenticação, Pagamento, Storage e Comunicação.

---

## Casos de Uso do Cliente

### UC01: Gerenciar Conta

- **Ator**: Cliente
- **Descrição**: Permite que o cliente crie uma nova conta, faça login/logout e exclua sua conta de forma segura.
- **Fluxo Principal (Login)**:
  1.  Cliente acessa a tela de autenticação.
  2.  Informa email e senha.
  3.  O **Sistema de Autenticação** valida as credenciais.
  4.  Cliente é redirecionado para a tela principal da aplicação.
- **Observação**: A exclusão da conta é uma ação irreversível que remove todos os dados associados ao cliente.

### UC02: Gerenciar Perfil

- **Ator**: Cliente
- **Descrição**: O cliente pode visualizar e editar suas informações pessoais, como nome, telefone, localização e foto de perfil.
- **Fluxo Principal**:
  1.  Cliente acessa a tela "Meu Perfil".
  2.  Edita os campos desejados.
  3.  Pode fazer o upload de uma nova foto de perfil, que é enviada para o **Sistema de Storage**.
  4.  O sistema salva as alterações no banco de dados.

### UC03: Buscar Serviços

- **Ator**: Cliente
- **Descrição**: Cliente busca e filtra os serviços de churrasco disponíveis na plataforma.
- **Fluxo Principal**:
  1.  Cliente acessa a tela de busca.
  2.  Visualiza a lista de todos os serviços.
  3.  Aplica filtros (preço, localização, avaliação, etc.) para refinar a busca.
  4.  Seleciona um serviço para ver os detalhes completos.

### UC04: Gerenciar Agendamentos

- **Ator**: Cliente
- **Descrição**: Cliente visualiza seu histórico de agendamentos, solicita novos e cancela existentes.
- **Fluxo Principal (Solicitar Reserva)**:
  1.  Após escolher um serviço, o cliente clica em "Reservar".
  2.  Preenche os detalhes do evento: data, hora, local e número de convidados.
  3.  Confirma a solicitação.
  4.  O sistema cria um agendamento com status "Pendente" e notifica o profissional.

### UC05: Avaliar Serviço

- **Ator**: Cliente
- **Descrição**: Após a conclusão de um evento, o cliente pode avaliar o serviço prestado pelo profissional.
- **Fluxo Principal**:
  1.  Cliente acessa um agendamento com status "Concluído".
  2.  Clica em "Avaliar".
  3.  Atribui uma nota de 1 a 5 estrelas (obrigatório) e um comentário (opcional).
  4.  A avaliação é salva e se torna pública no perfil do profissional.

### UC06: Contatar Profissional

- **Ator**: Cliente
- **Descrição**: Cliente pode entrar em contato direto com o profissional para tirar dúvidas.
- **Fluxo Principal**:
  1.  Na página do serviço ou do agendamento, o cliente clica em "Contato".
  2.  O sistema oferece opções como WhatsApp, Telefone ou Email.
  3.  Ao escolher uma opção, o **Sistema de Comunicação Externa** correspondente é acionado (ex: abre o WhatsApp com uma mensagem pré-definida).

---

## Casos de Uso do Churrasqueiro

### UC07: Gerenciar Serviços

- **Ator**: Churrasqueiro
- **Descrição**: O profissional pode criar, editar e remover os serviços que oferece na plataforma.
- **Fluxo Principal (Criar Serviço)**:
  1.  Churrasqueiro acessa "Meus Serviços" e clica em "Novo Serviço".
  2.  Preenche todos os detalhes: título, descrição, faixa de preço, duração, etc.
  3.  Faz o upload de fotos do serviço, que são salvas no **Sistema de Storage**.
  4.  O serviço é publicado e fica disponível para busca pelos clientes.

### UC08: Gerenciar Portfólio

- **Ator**: Churrasqueiro
- **Descrição**: Permite que o profissional adicione e gerencie fotos de seus trabalhos anteriores para construir um portfólio atraente.
- **Fluxo Principal**:
  1.  Churrasqueiro acessa seu perfil.
  2.  Faz o upload de novas fotos para a galeria.
  3.  As imagens são salvas no **Sistema de Storage** e exibidas publicamente.

### UC09: Gerenciar Agendamentos

- **Ator**: Churrasqueiro
- **Descrição**: O profissional gerencia as solicitações de reserva recebidas.
- **Fluxo Principal**:
  1.  Churrasqueiro recebe uma notificação de uma nova solicitação de agendamento.
  2.  Visualiza os detalhes do evento.
  3.  Pode "Aceitar", "Recusar" ou "Contatar Cliente".
  4.  Ao aceitar, o status do agendamento muda para "Confirmado".
  5.  Após o evento, ele marca o agendamento como "Concluído".

### UC10: Ver Avaliações

- **Ator**: Churrasqueiro
- **Descrição**: O profissional pode visualizar todas as avaliações e comentários recebidos dos clientes.
- **Fluxo Principal**:
  1.  Acessa a tela "Minhas Avaliações".
  2.  Visualiza a nota média, a distribuição de notas e a lista de todos os comentários.
  3.  Usa o feedback para melhorar seus serviços.

### UC11: Ver Analytics

- **Ator**: Churrasqueiro
- **Descrição**: Fornece ao profissional um painel com métricas de desempenho do seu negócio na plataforma.
- **Fluxo Principal**:
  1.  Acessa a tela "Analytics".
  2.  Visualiza gráficos e dados sobre receita mensal, número de agendamentos, serviços mais populares e taxa de conclusão.

### UC12: Gerenciar Assinatura

- **Ator**: Churrasqueiro
- **Descrição**: O profissional gerencia seu plano de assinatura para ter acesso às funcionalidades da plataforma.
- **Fluxo Principal**:
  1.  Acessa a área de "Assinatura".
  2.  Escolhe um plano (Mensal, Semestral, Anual).
  3.  Procede para o **Sistema de Pagamento**, onde insere os dados do cartão.
  4.  Após a confirmação, a assinatura é ativada e a data de vencimento é definida.
