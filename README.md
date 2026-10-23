# Trend Getter

App que busca os **trending topics do X (Twitter)** quando você clica em **Buscar agora** e destaca só as trends ligadas aos assuntos que você acompanha. Se quiser, a busca também pode rodar sozinha duas vezes por dia.

1. No primeiro acesso você configura **uma única vez** o local e os seus assuntos de interesse (com palavras-chave opcionais).
2. A busca é **manual** por padrão: um clique em **Buscar agora**. A busca automática (padrão **08:00 e 20:00**, horário de Brasília) é opcional.
3. O painel mostra, por assunto, as trends relacionadas, o motivo da relação, todas as trends da busca e o histórico.

O mesmo código roda de três jeitos:

| Modo | Onde | Busca | Configuração |
|---|---|---|---|
| **App para Mac** | janela própria e ícone na barra de menus | botão ou horários, de graça pelo trends24.in | salva no SQLite pela tela do app |
| **Site no GitHub Pages** | `https://<usuário>.github.io/trend-getter/` | botão que dispara o GitHub Actions (precisa da API paga do X) | arquivo `trends.config.json` no repositório, criado pela própria tela do site |
| **Servidor local** | `http://localhost:3000` | botão que busca na hora | salva no SQLite pela tela do site |

## App para Mac

Roda no seu Mac com janela própria e um ícone na barra de menus. Como a busca sai da sua internet, e não de um servidor, o trends24.in funciona: **não precisa da API paga do X**.

### Instalar

1. Baixe o `.dmg` em [Releases](https://github.com/henribon/trend-getter/releases): `arm64` para Macs com chip Apple (M1 ou mais novo), `x64` para Macs com Intel. Enquanto não houver uma versão publicada, ele fica nos artefatos do workflow **App para Mac**, na aba Actions.
2. Abra o `.dmg` e arraste o **Trend Getter** para **Aplicativos**.
3. O app não tem assinatura de desenvolvedor da Apple, então o macOS bloqueia a primeira abertura. Tente abrir uma vez, vá em *Ajustes do Sistema → Privacidade e Segurança* e clique em **Abrir Mesmo Assim**. Ou rode no Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/Trend Getter.app"
```

### Usar

- Na primeira abertura, configure o local e os seus assuntos.
- Fechar a janela não encerra o app: ele continua no ícone da barra de menus, para fazer as buscas agendadas. Para sair, use **Sair do Trend Getter** nesse ícone (ou ⌘Q com a janela aberta).
- No ícone da barra de menus:
  - **Buscar sozinho às 08:00 e 20:00** liga ou desliga a busca automática (o app reabre para aplicar).
  - **Abrir ao iniciar o Mac** abre o app só na barra de menus quando você entra no Mac, para não perder os horários. O macOS pode pedir aprovação em *Ajustes do Sistema → Geral → Itens de Início*.
  - **Configurações avançadas…** abre o arquivo `configuracoes.env` (horários, chave da Anthropic para a IA, token da API do X). Depois de editar, saia do app e abra de novo.
- Depois de uma busca automática, uma notificação mostra as trends ligadas aos seus assuntos, ou avisa se a busca falhou.
- Se o Mac estava dormindo ou desligado no horário, a busca que faltou é feita quando ele acorda ou quando o app abre.
- Os dados ficam em `~/Library/Application Support/Trend Getter/`.

### Gerar o app no seu Mac

```bash
npm install
```

```bash
npm run desktop
```

```bash
npm run package:mac
```

`npm run desktop` abre o app direto do código. `npm run package:mac` gera os `.dmg` em `release/`. O app gerado no seu próprio Mac (`release/mac-arm64/Trend Getter.app`) abre sem o bloqueio do passo 3.

### Publicar uma versão

Atualize `version` no `package.json` e crie uma tag com o mesmo número (ex.: `git tag v1.0.0` e `git push origin v1.0.0`). O workflow [`.github/workflows/mac-app.yml`](.github/workflows/mac-app.yml) gera os `.dmg` num Mac do GitHub, confere se o app abre e publica a versão em Releases. Nos outros pushes que mexem no código, ele gera os `.dmg` só como artefato.

## Site no GitHub Pages

O workflow [`.github/workflows/trends.yml`](.github/workflows/trends.yml) busca as trends e publica um site estático no GitHub Pages. O histórico fica nos próprios arquivos publicados (`data/runs.json`): **nenhuma trend é salva por commit**.

| Gatilho do workflow | Faz uma nova busca? |
|---|---|
| Botão **Buscar agora** (ou *Run workflow* na aba Actions) | Sim |
| Commit na `main` (código ou `trends.config.json`) | Não: só republica o site com os dados que já existem |
| Horário (11:00 e 23:00 UTC) | Só se a variável `AUTO_SEARCH` for `true` |

Primeiro acesso:

1. Abra o site. Sem configuração, ele mostra a tela de interesses.
2. Preencha e clique em **Salvar e começar**: o site abre o GitHub com o `trends.config.json` já preenchido. Clique em **Commit changes**.
3. Em cerca de 1 minuto o site é atualizado. Clique em **Buscar agora**.

### Botão Buscar agora

O botão chama a API do GitHub para disparar o workflow e mostra a nova busca sozinho assim que ela é publicada (cerca de 1 minuto). Para isso, no primeiro clique o site pede um **token fine-grained do GitHub**:

- o link do site já abre a criação do token com a permissão **Actions: Read and write**;
- em **Repository access**, escolha **Only select repositories** e marque só o `trend-getter`;
- o token fica salvo apenas no seu navegador (`localStorage`) e só serve para disparar o workflow. Se ele expirar ou for revogado, o site pede outro.

### Busca automática (opcional)

Para voltar a buscar sozinho às 08:00 e 20:00, crie a variável `AUTO_SEARCH` com valor `true` em *Settings → Secrets and variables → Actions → Variables*. Sem ela, as execuções agendadas aparecem como puladas na aba Actions e nenhuma busca é feita.

### Fonte e IA

- **Editar interesses** gera o novo conteúdo e abre o editor do `trends.config.json` no GitHub. Salvar os interesses não dispara uma busca.
- **No GitHub Actions a fonte precisa ser a API oficial do X**: o trends24.in bloqueia os servidores do GitHub com um desafio anti-robô (status 403). Crie um app em [developer.x.com](https://developer.x.com), gere o *Bearer Token* e cadastre-o como secret `X_BEARER_TOKEN` em *Settings → Secrets and variables → Actions*.
- Para usar IA, cadastre também o secret `ANTHROPIC_API_KEY`.
- Com a busca automática ligada, o GitHub pode atrasar execuções agendadas em alguns minutos e desativa crons de repositórios públicos sem atividade por 60 dias (ele avisa por e-mail; basta reativar na aba Actions).

Para gerar o site estático localmente:

```bash
npm run build:site
```

(precisa de `GITHUB_REPOSITORY=dono/repositorio`; o resultado fica em `dist/`).

## Requisitos

- Node.js **22.13+** (testado no 24). Sem banco externo: usa o SQLite embutido no Node.

## Servidor local

```bash
npm install
```

```bash
copy .env.example .env
```

```bash
npm start
```

Abra http://localhost:3000. Enquanto os interesses não forem configurados, o site redireciona para `/setup.html` e nenhuma busca é feita. Depois de salvar, clique em **Buscar agora**.

## Busca automática no servidor local

- Desligada por padrão. Com `AUTO_SEARCH=true` no `.env`, o servidor busca em `SCHEDULE_TIMES` (horário local, definido por `TZ`), faz a primeira busca logo após a configuração e, se ficou desligado e perdeu um horário, faz a busca que faltou ao iniciar.
- Prefere usar um cron do sistema? Rode a busca avulsa (sai com código 1 em caso de falha):

```bash
npm run collect
```

Exemplo no Agendador de Tarefas do Windows (repita para 20:00):

```bash
schtasks /Create /SC DAILY /ST 08:00 /TN "TrendGetter 08h" /TR "cmd /c cd /d C:\caminho\trend-getter && npm run collect"
```

Exemplo no crontab (Linux/macOS):

```bash
0 8,20 * * * cd /caminho/trend-getter && npm run collect
```

## De onde vêm as trends

| `TREND_PROVIDER` | Fonte | Observações |
|---|---|---|
| `auto` (padrão) | API do X se houver `X_BEARER_TOKEN`, senão trends24.in | |
| `trends24` | Página pública do [trends24.in](https://trends24.in) | Gratuito, sem chave. Funciona em conexões residenciais, mas é bloqueado em servidores como o GitHub Actions. Depende do layout da página. |
| `x` | [API oficial do X](https://docs.x.com/x-api/trends/get-trends-by-woeid) (`GET /2/trends/by/woeid`) | Requer plano pago da API do X. Traz o volume de posts. |

## Como as trends são ligadas aos seus assuntos

| `MATCHER` | Comportamento |
|---|---|
| `auto` (padrão) | Usa IA se houver `ANTHROPIC_API_KEY`, senão só palavras-chave |
| `keyword` | Compara o nome do assunto e as palavras-chave com o nome da trend (ignora acentos e caixa, entende hashtags como `#LulaDeuShow`) |
| `ai` | Usa o Claude para relacionar trends ao assunto mesmo sem palavra-chave (ex.: "Gabigol" em Futebol) e soma com o resultado das palavras-chave |

Com IA, o modelo padrão é `claude-opus-5-5` (troque em `ANTHROPIC_MODEL`). O fallback de servidor da Anthropic fica ligado para que uma recusa indevida não interrompa a busca. Se a IA falhar (chave inválida, limite, rede), a busca continua só com palavras-chave e o painel mostra um aviso.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` para expor na rede |
| `TZ` | fuso do sistema | Fuso dos horários agendados, ex.: `America/Sao_Paulo` |
| `AUTO_SEARCH` | `false` | `true` liga a busca automática nos horários de `SCHEDULE_TIMES` |
| `SCHEDULE_TIMES` | `08:00,20:00` | Horários da busca automática, separados por vírgula |
| `HISTORY_LIMIT` | `60` | Quantidade de buscas guardadas no histórico |
| `DATABASE_PATH` | `data/trend-getter.db` | Arquivo SQLite |
| `TREND_PROVIDER` | `auto` | `auto`, `trends24` ou `x` |
| `X_BEARER_TOKEN` | | Token da API do X |
| `MATCHER` | `auto` | `auto`, `keyword` ou `ai` |
| `ANTHROPIC_API_KEY` | | Chave da API da Anthropic |
| `ANTHROPIC_MODEL` | `claude-opus-5-5` | Modelo usado na classificação |

## API

| Método | Rota | Uso |
|---|---|---|
| `GET` | `/api/state` | Configuração, próximos horários, fonte e estratégia |
| `PUT` | `/api/settings` | Salva `{ locationId, interests: [{ name, keywords }] }` |
| `GET` | `/api/runs?limit=20` | Histórico de buscas |
| `POST` | `/api/runs` | Dispara uma busca agora |

## Estrutura

```
src/
  domain/          regras puras: texto, horários, validação, locais
  application/     casos de uso: coletor, agendador, configurações
  infrastructure/  SQLite, arquivo de configuração, fontes de trends, correspondência e geração do site
  http/            servidor, rotas e arquivos estáticos
  desktop/         app para Mac (Electron): janela, barra de menus, notificações e configurações
  app.js           servidor + agendador, usado pelo main.js e pelo app para Mac
  main.js          servidor local
  collect.js       busca avulsa para cron externo
  build-site.js    busca + geração do site estático (GitHub Actions)
public/            front-end sem framework (server-api.js no servidor, static-api.js no Pages)
build/             ícone do app para Mac
test/              testes com node:test
.github/workflows/ cron do GitHub Actions + deploy no Pages, build do app para Mac
```

## Testes

```bash
npm test
```

## Segurança

O site não tem login: por padrão escuta só em `127.0.0.1`. Se for publicar na internet, coloque-o atrás de um proxy com autenticação.
