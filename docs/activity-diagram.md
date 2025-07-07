# Diagramas de Atividade - ChurrasJa

Este documento apresenta os principais fluxos de trabalho do sistema ChurrasJa usando diagramas de atividade.

---

## 1. Fluxo de Cadastro de Novo Usuário

Este diagrama mostra o processo de um novo usuário se cadastrando na plataforma, seja como Cliente ou como Churrasqueiro.

```plantuml
@startuml "Fluxo de Cadastro de Usuário"
title "Diagrama de Atividade - Cadastro de Novo Usuário"

start

:Acessar tela inicial;
:Selecionar tipo de usuário (Cliente ou Profissional);
:Preencher formulário de cadastro (nome, email, senha);
:Submeter formulário;

if (Validação do formulário) then (sucesso)
  :Criar usuário no **Supabase Auth**;
  if (Usuário criado com sucesso?) then (sim)
    :Criar perfil na tabela **profiles** com o tipo de usuário;
    if (Perfil criado com sucesso?) then (sim)
      :Redirecionar para a tela de login;
      :Exibir mensagem de "Cadastro realizado com sucesso!";
      stop
    else (não)
      :Excluir usuário do Supabase Auth (rollback);
      :Exibir mensagem de erro;
      stop
    endif
  else (não)
    :Exibir mensagem de erro (ex: email já existe);
    stop
  endif
else (falha)
  :Exibir erros de validação no formulário;
  stop
endif

@enduml
```

---

## 2. Fluxo de Contratação e Realização do Serviço

Este diagrama ilustra o fluxo completo de um serviço, desde a busca pelo cliente até a avaliação final, envolvendo as interações entre o Cliente e o Churrasqueiro.

```plantuml
@startuml "Fluxo de Contratação de Serviço"
title "Diagrama de Atividade - Contratação e Realização do Serviço"

|Cliente|
start
:Buscar por serviços;
:Aplicar filtros (opcional);
:Selecionar um serviço;
:Visualizar detalhes do serviço e do profissional;
:Preencher formulário de reserva (data, local, convidados);
:Enviar solicitação de reserva;

|Churrasqueiro|
:Receber notificação de nova reserva;
:Analisar detalhes da solicitação;
if (Pode atender?) then (sim)
  :Aceitar reserva;
  |Cliente|
  :Receber confirmação do agendamento;
  |Churrasqueiro|
  :Realizar o serviço na data combinada;
  :Marcar serviço como "Concluído";
  |Cliente|
  :Receber notificação de conclusão;
  :Avaliar o serviço (nota e comentário);
  |Churrasqueiro|
  :Visualizar nova avaliação recebida;
  stop
else (não)
  :Recusar reserva;
  |Cliente|
  :Receber notificação de recusa;
  stop
endif

@enduml
```
