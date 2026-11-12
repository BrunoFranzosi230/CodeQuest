# CodeQuest

Jogo web educacional de programação em blocos para crianças de 6 a 11 anos. A
criança monta o programa do robô **Bit** para ele pegar a chave e voltar para
casa, aprendendo sequência, repetição, condicional e função.

**TCC — Engenharia de Software · Católica SC · Bruno Franzosi**

| | |
|---|---|
| 🎮 Jogar | https://code-quest-bot-beep.vercel.app |
| 🪞 Espelho | https://brunofranzosi230.github.io/CodeQuest/ |
| 💻 Código | https://github.com/BrunoFranzosi230/CodeQuest |
| 🔎 Qualidade | [SonarCloud](https://sonarcloud.io/project/overview?id=BrunoFranzosi230_CodeQuest) |

## Documentação

| Página | Conteúdo |
|---|---|
| [GDD](GDD.md) | Game Design Document: visão, gameplay, interface, arte, áudio, playtests, riscos |
| [Arquitetura](ARQUITETURA.md) | Frontend em camadas, backend, o caminho do clique até o banco |
| [Backend na AWS](AWS.md) | API, modelo de dados, segurança, como publicar a Lambda |
| [Autenticação](AUTENTICACAO.md) | Login com Google, modo convidado, sincronização do progresso, LGPD |
| [Eventos](EVENTOS.md) | Catálogo dos eventos entre os módulos e os estados da aplicação |
| [Qualidade, CI/CD e monitoramento](QUALIDADE-E-DEPLOY.md) | Ambientes, pipeline, testes, SonarCloud, Grafana |
| [Decisões](DECISOES.md) | O que foi decidido, por quê e o que foi descartado |
| [Música](MUSICA.md) | Trilhas, créditos e como adicionar faixas |

## Rodar localmente

```bash
git clone https://github.com/BrunoFranzosi230/CodeQuest.git
cd CodeQuest
npm install
npm run dev        # http://localhost:5173
```

Sem configurar nada, o jogo abre no modo convidado. Para o login com Google e a
nuvem, veja [Autenticação](AUTENTICACAO.md).

> Esta Wiki é gerada a partir da pasta `docs/` do repositório. Para alterar uma
> página, edite o arquivo correspondente em `docs/` e abra um pull request.
