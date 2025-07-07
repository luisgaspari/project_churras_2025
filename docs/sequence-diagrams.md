# Diagramas de Sequência - ChurrasJa

Este documento descreve os fluxos de interação mais importantes do sistema ChurrasJa através de diagramas de sequência.

---

## 1. Fluxo de Autenticação de Usuário

Este diagrama ilustra como um usuário (Cliente ou Churrasqueiro) faz login no sistema.

```plantuml
@startuml "Fluxo de Autenticação"
title "Diagrama de Sequência - Autenticação de Usuário"

actor User

participant "LoginScreen" as screen
participant "AuthContext" as auth
participant "SupabaseClient" as supabase
participant "Supabase Auth" as sb_auth
database "Database (PostgreSQL)" as db

autonumber

User -> screen: Insere email/senha e clica em "Entrar"
activate screen

screen -> auth: signIn(email, password)
activate auth

auth -> supabase: auth.signInWithPassword(...)
activate supabase

supabase -> sb_auth: Valida credenciais
activate sb_auth
sb_auth --> supabase: Retorna Session
deactivate sb_auth

supabase --> auth: Retorna sucesso
deactivate supabase

auth -> auth: onAuthStateChange dispara
activate auth
auth -> auth: setSession(session), setUser(user)
auth -> auth: loadProfile(userId)
activate auth

auth -> supabase: from('profiles').select().eq('id', userId)
activate supabase
supabase -> db: SELECT * FROM profiles WHERE id = ...
activate db
db --> supabase: Retorna dados do perfil
deactivate db
supabase --> auth: Retorna dados
deactivate supabase

auth -> auth: setProfile(profile)
deactivate auth

auth -> screen: Navega para a rota correta (cliente/profissional)
deactivate auth
deactivate auth

deactivate screen

@enduml
```

---

## 2. Fluxo de Criação de Serviço

Este diagrama mostra o processo de um Churrasqueiro criando um novo serviço na plataforma.

```plantuml
@startuml "Fluxo de Criação de Serviço"
title "Diagrama de Sequência - Criação de Serviço pelo Profissional"

actor Churrasqueiro as pro

participant "CreateServiceScreen" as screen
participant "SupabaseClient" as supabase
participant "Supabase Storage" as storage
database "Database (PostgreSQL)" as db

autonumber

pro -> screen: Preenche formulário do serviço
pro -> screen: Adiciona imagem

activate screen
screen -> storage: upload('service_images', file)
activate storage
storage --> screen: Retorna publicUrl
deactivate storage
screen -> screen: Adiciona URL da imagem ao estado
deactivate screen

pro -> screen: Clica em "Criar Serviço"
activate screen

screen -> screen: handleCreateService()
activate screen

screen -> screen: validateForm()
activate screen
screen --> screen: true
deactivate screen

screen -> supabase: insert('services', serviceData)
activate supabase

supabase -> db: INSERT INTO services ...
activate db
db --> supabase: Success
deactivate db

supabase --> screen: Retorna sucesso
deactivate supabase

screen -> pro: Exibe alerta de "Sucesso"
screen -> screen: router.push('/(professional)/services')

deactivate screen
deactivate screen

@enduml
```

---

## 3. Fluxo de Reserva de Serviço

Este diagrama detalha como um Cliente solicita a reserva de um serviço.

```plantuml
@startuml "Fluxo de Reserva de Serviço"
title "Diagrama de Sequência - Reserva de Serviço pelo Cliente"

actor Cliente as client

participant "ServiceDetailsScreen" as screen
participant "AuthContext" as auth
participant "SupabaseClient" as supabase
database "Database (PostgreSQL)" as db

autonumber

client -> screen: Preenche formulário de reserva e clica em "Confirmar"
activate screen

screen -> screen: handleCreateBooking()
activate screen

screen -> screen: validateBookingForm()
activate screen
screen --> screen: true
deactivate screen

screen -> auth: Obtém profile do cliente
activate auth
auth --> screen: Retorna profile
deactivate auth

screen -> supabase: insert('bookings', bookingData)
activate supabase

supabase -> db: INSERT INTO bookings ...
activate db
db --> supabase: Success
deactivate db

supabase --> screen: Retorna sucesso
deactivate supabase

screen -> client: Exibe alerta de "Sucesso"
screen -> screen: router.push('/(client)/bookings')

deactivate screen
deactivate screen

@enduml
```
