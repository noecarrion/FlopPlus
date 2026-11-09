# LAB DevOps — Pipeline CI/CD com IA Generativa
**Instituto J&F — Centro de Educação para os Negócios**  
**Equipe de Professores de TI — DevOps-LAB (Out/2026)**  
**Link de Envio (Forms):** [https://forms.cloud.microsoft/r/Gbb4U2yXbm](https://forms.cloud.microsoft/r/Gbb4U2yXbm)

---

## Informações do Projeto

- **Aluno / Autor:** Noé Carrion (`noecarrion`)
- **Projeto Escolhido:** Flop+ (`FlopPlus`) — Streaming Web App
- **Link do Repositório:** [https://github.com/noecarrion/FlopPlus](https://github.com/noecarrion/FlopPlus)
- **Branch Desenvolvida e Enviada:** [`feature/ci-cd-pipeline`](https://github.com/noecarrion/FlopPlus/tree/feature/ci-cd-pipeline)
- **Link do Pull Request:** [https://github.com/noecarrion/FlopPlus/pull/new/feature/ci-cd-pipeline](https://github.com/noecarrion/FlopPlus/pull/new/feature/ci-cd-pipeline)
- **Ambiente de Publicação (CD):** [https://noecarrion.github.io/FlopPlus/](https://noecarrion.github.io/FlopPlus/)

---

## 1. Visão Geral do Projeto e Justificativa da Estratégia de Deployment

O **Flop+** é uma aplicação web front-end desenvolvida com **HTML5**, **CSS3** e elementos visuais multimídia (FontAwesome, imagens AVIF/PNG), satirizando um serviço de streaming de filmes e séries de baixo orçamento ou fracasso de bilheteria.

### Justificativa da Escolha do Deployment (GitHub Pages via GitHub Actions)
Conforme solicitado na página 2 do Lab, a estratégia de Continuous Deployment (CD) foi selecionada e justificada com base na tecnologia da aplicação:
1. **Adequação Arquitetural:** O Flop+ é uma aplicação estática client-side. Utilizar contêineres Docker ou servidores com runtime backend (como Render ou Railway) geraria custos e complexidade de manutenção desnecessários.
2. **Alta Disponibilidade e Performance:** O **GitHub Pages** distribui os arquivos estáticos por uma CDN global de alta velocidade (Fastly) com terminação SSL/TLS automática e latência mínima.
3. **Segurança Nativa (OIDC):** A implantação é feita por actions oficiais (`actions/deploy-pages@v4` e `actions/upload-pages-artifact@v3`) com permissões seguras baseadas no OpenID Connect do repositório (`pages: write`, `id-token: write`), sem necessidade de injetar API Tokens ou credenciais de terceiros.
4. **Quality Gate Estrito:** O CD depende obrigatoriamente do sucesso prévio do job de CI (`needs: continuous-integration`) e só executa sob o evento de `push` na branch `main`, garantindo que versões com erros sintáticos ou links quebrados nunca sejam publicadas.

---

## 2. Arquivo da Pipeline (.github/workflows/ci-cd.yml)

```yaml
name: Pipeline CI/CD - FlopPlus

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

# Permissões necessárias para publicação segura no GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Permite apenas uma implantação concorrente no Pages
concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  # ==========================================================
  # ETAPA 1: CONTINUOUS INTEGRATION (CI)
  # Executada a cada push e pull_request direcionados a main
  # ==========================================================
  continuous-integration:
    name: CI - Build, Validacao e Testes
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout do Repositorio
        uses: actions/checkout@v4

      - name: 2. Configurar Ambiente Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 3. Instalar Dependencias
        run: npm ci

      - name: 4. Executar Testes de Integridade de Links e Assets
        run: npm test

      - name: 5. Executar Validacao Sintatica HTML (HTMLHint)
        run: npm run lint:ci

  # ==========================================================
  # ETAPA 2: CONTINUOUS DEPLOYMENT (CD)
  # Executada apenas em push na main, apos conclusao da CI
  # ==========================================================
  continuous-deployment:
    name: CD - Deploy no GitHub Pages
    needs: continuous-integration
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: 1. Checkout do Repositorio
        uses: actions/checkout@v4

      - name: 2. Configurar GitHub Pages
        uses: actions/configure-pages@v5

      - name: 3. Fazer Upload do Artefato do Site
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: 4. Realizar Deploy no GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 3. Registro do Processo de Desenvolvimento com IA Generativa

Durante a atividade, foram documentadas as 5 interações relevantes com a ferramenta de IA Generativa:

### Iteração 1: Diagnóstico Inicial e Arquitetura da Pipeline
- **Prompt Utilizado:** *"Analise esse Lab anexado, avalie a estrutura do projeto FlopPlus e elabore a arquitetura da pipeline de CI/CD via GitHub Actions com teste e deployment adequados."*
- **Resultado Obtido:** Proposta de pipeline dividida em dois jobs independentes (`continuous-integration` e `continuous-deployment`), com deployment direcionado ao GitHub Pages.
- **Problema Encontrado:** O projeto original não possuía nenhum teste nem gerenciador de pacotes (`package.json`), o que deixaria a etapa de CI vazia.
- **Alteração Realizada:** Criação do `package.json`, planejamento de testes automatizados e inclusão da ferramenta de linting `htmlhint`.

### Iteração 2: Diagnóstico de Portabilidade de Caminhos
- **Prompt Utilizado:** *"Como assegurar que a navegação e recursos estáticos do FlopPlus funcionem perfeitamente no ambiente do GitHub Pages e localmente?"*
- **Resultado Obtido:** A IA alertou que projetos no GitHub Pages são servidos no subdiretório `https://<usuario>.github.io/<repositorio>/`. Links com barra inicial absoluta (ex: `href="/index.html"`) buscam a raiz do domínio e resultam em erro 404.
- **Problema Encontrado:** 5 links com barras absolutas foram encontrados em `index.html`, `HTML/cadastro.html`, `HTML/inicio.html` e `HTML/login.html`.
- **Alteração Realizada:** Refatoração de todos os 5 links para referências relativas portáteis (`../index.html`, `aboutme.html`, `HTML/aboutme.html`).

### Iteração 3: Implementação dos Testes e Tratamento de Erro de Caminho no Windows
- **Prompt Utilizado:** *"Desenvolva o teste automatizado em Node.js para checar tags HTML essenciais, integridade de assets e bloquear links absolutos, e configure o package.json."*
- **Resultado Obtido:** Implementação do arquivo `tests/validate-integrity.js` com 44 verificações automáticas e instalação do `htmlhint`.
- **Problema Encontrado:** No ambiente Windows local, o caminho da pasta continha o caractere especial `&` (`OneDrive - Instituto J&F`). O interpretador `cmd.exe` quebrava ao executar os atalhos `.cmd` do npm.
- **Alteração Realizada:** Criação do script `lint:ci` executando diretamente via `node node_modules/htmlhint/bin/htmlhint`, garantindo compatibilidade cross-platform (Windows e Linux Ubuntu do GitHub Actions).

### Iteração 4: Refinamento de Segurança, Concorrência e Proteção de Branch
- **Prompt Utilizado:** *"Estruture o arquivo ci-cd.yml garantindo permissões OIDC mínimas, controle de concorrência e que o CD ocorra estritamente após a conclusão com sucesso do CI na branch main."*
- **Resultado Obtido:** Pipeline configurada com `needs: continuous-integration`, condicional `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, bloco `concurrency: group: 'pages'` e permissões `pages: write`, `id-token: write`.
- **Problema Encontrado:** Nenhum. Validação estática do YAML realizada com sucesso.
- **Alteração Realizada:** Inclusão de comentários explicativos e detalhamento dos steps.

### Iteração 5: Versionamento Git, Criação da Branch e Push Remoto
- **Prompt Utilizado:** *"Crie a branch de trabalho solicitada pelo Lab, configure o .gitignore para ignorar artefatos locais/IDEs e faça o push para o repositório remoto."*
- **Resultado Obtido:** Criação e checkout da branch `feature/ci-cd-pipeline`, criação do `.gitignore`, commit das alterações e push com sucesso para `origin/feature/ci-cd-pipeline`.
- **Problema Encontrado:** Arquivos de workspace de IDE (`.idea/`) estavam no repositório local sem estarem no `.gitignore`.
- **Alteração Realizada:** Criação de `.gitignore` na raiz ignorando `.idea/`, `node_modules/` e logs.

---

## 4. Respostas aos 5 Questionamentos do Lab

| Questionamento | Resposta |
| :--- | :--- |
| **1. Quantos prompts foram necessários para chegar à versão final?** | Foram necessárias **5 iterações estruturadas (prompts)** com a IA Generativa para cobrir arquitetura, testes, correção de caminhos, pipeline e publicação Git. |
| **2. Quais foram os principais problemas encontrados?** | 1) Ausência original de testes e linters no projeto;<br>2) Presença de 5 links com barras absolutas que gerariam erro 404 no GitHub Pages;<br>3) Erro no Windows ao rodar binários `.cmd` do npm devido ao caractere `&` no caminho `Instituto J&F`;<br>4) Pasta de IDE `.idea/` sem arquivo `.gitignore`. |
| **3. Quais alterações foram necessárias?** | Criação de `.github/workflows/ci-cd.yml`; criação de `package.json` e `package-lock.json`; implementação de `tests/validate-integrity.js`; correção de 5 links em 4 arquivos HTML; e criação de `.gitignore`. |
| **4. Quais alterações foram realizadas manualmente?** | Inspeção visual dos layouts e estilos para assegurar ausência de regressões; validação das credenciais do Git no Windows; e definição do padrão de nome da branch (`feature/ci-cd-pipeline`). |
| **5. Como você verificou que a pipeline estava funcionando corretamente?** | 1) Execução local com sucesso de `npm test` (44 verificações aprovadas);<br>2) Execução de `npm run lint:ci` (5 arquivos HTML sem erros);<br>3) Validação sintática do YAML de workflow;<br>4) Envio da branch `feature/ci-cd-pipeline` ao repositório remoto com link de PR gerado pelo GitHub. |

---

## 5. Breve Análise do Processo de Desenvolvimento com IA

O suporte da IA Generativa foi essencial para acelerar a criação das configurações de DevOps e mitigar riscos arquiteturais antes mesmo da primeira execução remota. A capacidade da IA de antecipar problemas específicos de hospedagem em subdomínios (como links absolutos no GitHub Pages) evitou retrabalho após o deploy.

Simultaneamente, a experiência reforçou a necessidade de validação técnica humana contínua: peculiaridades do sistema operacional local (como colisões de sintaxe do `cmd.exe` com caracteres especiais de pastas) exigiram diagnóstico crítico e direcionamento pontual para que os scripts fossem adaptados para execução cross-platform.

---

## 6. Evidências de Execução e Passo a Passo de Ativação

### Log de Execução dos Testes Locais de CI
```text
> flopplus@1.0.0 test
> node tests/validate-integrity.js

====================================================
  FLOP+ - TESTE DE INTEGRIDADE E VALIDAÇÃO DE ASSETS
====================================================

[1/3] Verificando arquivos essenciais da aplicacao...
  ✓ index.html encontrado.
  ✓ LICENSE encontrado.
  ✓ CSS\style.css encontrado.
  ✓ IMG\logo.png encontrado.
  ✓ IMG\background.avif encontrado.
  ✓ index.html encontrado.
  ✓ HTML\aboutme.html encontrado.
  ✓ HTML\cadastro.html encontrado.
  ✓ HTML\inicio.html encontrado.
  ✓ HTML\login.html encontrado.

[2/3] Verificando estrutura e doctype dos arquivos HTML...
  ✓ Estrutura basica de index.html validada.
  ✓ Estrutura basica de HTML\aboutme.html validada.
  ✓ Estrutura basica de HTML\cadastro.html validada.
  ✓ Estrutura basica de HTML\inicio.html validada.
  ✓ Estrutura basica de HTML\login.html validada.

[3/3] Validando links (href) e assets (src)...

====================================================
TOTAL DE VERIFICACOES REALIZADAS: 44
SUCESSO: Todos os arquivos, estruturas e links estao integros!
====================================================

> flopplus@1.0.0 lint:ci
> node node_modules/htmlhint/bin/htmlhint index.html HTML/*.html

Scanned 5 files, no errors found (56 ms).
```

### Log do Git: Criação de Branch e Push Remoto
```text
$ git checkout -b feature/ci-cd-pipeline
Switched to a new branch 'feature/ci-cd-pipeline'

$ git add .gitignore package.json package-lock.json tests/ .github/ HTML/ index.html
$ git commit -m "feat: implementa pipeline de CI/CD com GitHub Actions e GitHub Pages"
[feature/ci-cd-pipeline b9f6f7a] feat: implementa pipeline de CI/CD com GitHub Actions e GitHub Pages
 9 files changed, 605 insertions(+), 5 deletions(-)

$ git push -u origin feature/ci-cd-pipeline
branch 'feature/ci-cd-pipeline' set up to track 'origin/feature/ci-cd-pipeline'.
To https://github.com/noecarrion/FlopPlus.git
 * [new branch]      feature/ci-cd-pipeline -> feature/ci-cd-pipeline
```

### Passo a Passo para Ativação e Demonstração no GitHub
1. No repositório [github.com/noecarrion/FlopPlus](https://github.com/noecarrion/FlopPlus), acerte a configuração de Pages em **Settings > Pages**.
2. Em **Build and deployment > Source**, selecione **"GitHub Actions"**.
3. Crie o **Pull Request** da branch `feature/ci-cd-pipeline` para a branch `main` através do link: [Criar Pull Request](https://github.com/noecarrion/FlopPlus/pull/new/feature/ci-cd-pipeline).
4. Na aba **Actions**, observe a execução automática do job `CI - Build, Validacao e Testes`.
5. Ao aprovar e realizar o merge para a branch `main`, o job `CD - Deploy no GitHub Pages` será acionado automaticamente e publicará o site na URL: [https://noecarrion.github.io/FlopPlus/](https://noecarrion.github.io/FlopPlus/).
