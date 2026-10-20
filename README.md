# Trend Getter

Site que busca os **trending topics do X (Twitter) duas vezes por dia** e destaca só as trends ligadas aos assuntos que você acompanha.

1. No primeiro acesso você configura **uma única vez** o local e os seus assuntos de interesse (com palavras-chave opcionais).
2. A partir daí um agendador interno (cron) busca as trends nos horários definidos (padrão **08:00 e 20:00**).
3. O painel mostra, por assunto, as trends relacionadas, o motivo da relação, todas as trends da busca e o histórico.

## Requisitos

- Node.js **22.13+** (testado no 24). Sem banco externo: usa o SQLite embutido no Node.

## Como rodar

```bash
npm install
```

```bash
copy .env.example .env
```

```bash
npm start
```

Abra http://localhost:3000. Enquanto os interesses não forem configurados, o site redireciona para `/setup` e nenhuma busca é feita. Ao salvar, a primeira busca roda na hora.

## Agendamento

- O servidor agenda as buscas em `SCHEDULE_TIMES` (horário local, definido por `TZ`).
- Se o servidor ficou desligado e perdeu um horário, ao iniciar ele faz a busca que faltou.
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
| `trends24` | Página pública do [trends24.in](https://trends24.in) | Gratuito, sem chave. Depende do layout da página. |
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
| `SCHEDULE_TIMES` | `08:00,20:00` | Horários das buscas, separados por vírgula |
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
  infrastructure/  SQLite, fontes de trends e estratégias de correspondência
  http/            servidor, rotas e arquivos estáticos
  main.js          servidor + agendador
  collect.js       busca avulsa para cron externo
public/            front-end sem framework
test/              testes com node:test
```

## Testes

```bash
npm test
```

## Segurança

O site não tem login: por padrão escuta só em `127.0.0.1`. Se for publicar na internet, coloque-o atrás de um proxy com autenticação.
