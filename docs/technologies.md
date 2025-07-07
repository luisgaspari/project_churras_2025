# Tecnologias Utilizadas no Projeto ChurrasJa

Este documento lista todas as principais tecnologias, frameworks, linguagens e plataformas que compõem o projeto ChurrasJa.

---

## Frontend

O frontend é uma aplicação mobile desenvolvida com as seguintes tecnologias:

- **Linguagem de Programação**: **TypeScript**

  - Utilizado para adicionar tipagem estática ao JavaScript, garantindo maior segurança e manutenibilidade do código.

- **Framework Principal**: **React Native**

  - Permite o desenvolvimento de aplicações nativas para iOS e Android a partir de uma única base de código em JavaScript/TypeScript.

- **Plataforma de Desenvolvimento**: **Expo**

  - Um framework e plataforma que simplifica o desenvolvimento, a construção e a implantação de aplicações React Native, gerenciando a complexidade das configurações nativas.

- **Roteamento e Navegação**: **Expo Router**

  - Uma biblioteca de roteamento baseada em arquivos para aplicações React Native e web, facilitando a navegação entre telas.

- **UI (Interface do Usuário)**:

  - **React Native Paper**: Uma biblioteca de componentes de UI de alta qualidade que segue as diretrizes do Material Design.
  - **Lucide React Native**: Fornece um conjunto de ícones leves e consistentes para a aplicação.

- **Gerenciamento de Estado**: **React Context API**
  - Utilizado para gerenciar o estado global da aplicação, como o estado de autenticação do usuário, de forma nativa no React.

---

## Backend

O backend é construído sobre a plataforma **Supabase**, que oferece um conjunto de serviços integrados.

- **Plataforma**: **Supabase (Backend as a Service - BaaS)**

  - Fornece a infraestrutura de backend completa, incluindo banco de dados, autenticação, armazenamento de arquivos e APIs.

- **Banco de Dados**: **PostgreSQL**

  - Um poderoso banco de dados relacional de código aberto, utilizado para armazenar todos os dados da aplicação, como perfis, serviços e agendamentos.

- **Autenticação**: **Supabase Auth**

  - Serviço integrado para gerenciamento de identidade de usuários, incluindo cadastro, login com email/senha e gerenciamento de sessões seguras.

- **Armazenamento de Arquivos**: **Supabase Storage**

  - Utilizado para armazenar arquivos de mídia, como fotos de perfil, imagens de serviços e fotos de portfólio dos profissionais.

- **API**: **PostgREST**
  - O Supabase gera automaticamente uma API RESTful a partir do schema do banco de dados PostgreSQL, que é utilizada pelo frontend para todas as operações de dados.

---

## Ferramentas de Desenvolvimento e DevOps

- **Controle de Versão**: **Git**

  - Utilizado para o controle de versão do código-fonte.

- **Gerenciador de Pacotes**: **npm**

  - Usado para gerenciar as dependências do projeto JavaScript/TypeScript.

- **Linter**: **ESLint (via `expo lint`)**

  - Ferramenta para análise estática de código que ajuda a encontrar e corrigir problemas no código JavaScript/TypeScript.

- **Editor de Código**: **Visual Studio Code**

  - O ambiente de desenvolvimento integrado utilizado para escrever e depurar o código.

- **Plataforma de Documentação**: **PlantUML**
  - Utilizado para gerar os diagramas de arquitetura e modelagem do sistema (UML) a partir de scripts de texto simples.
