# Autenticação e progresso na nuvem

## Duas formas de entrar

| Forma | O que acontece | Onde fica o progresso |
|---|---|---|
| **Entrar com Google** | O navegador recebe do Google um *ID token* (JWT assinado) com id, nome e e-mail | No aparelho **e** na nuvem (AWS) |
| **Entrar como convidado** | Nenhuma conta, nenhum dado pessoal | Só no aparelho (`localStorage`) |

O jogo não tem senha própria nem cadastro: quem autentica é o Google.

## Como o login funciona

1. A tela de login chama `AuthManager.entrarComGoogle()`, que usa o
   [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview).
2. O Google devolve o ID token. O `AuthManager` lê o perfil (id, nome, e-mail,
   foto) e guarda a sessão em `localStorage` (`codequest_sessao`), junto com o
   token e a validade dele.
3. O token vale cerca de 1 hora. Antes de falar com a API, o `ApiBackend` pede
   um token válido; se o atual venceu, `renovarTokenSilencioso()` pede outro ao
   Google sem mostrar tela nenhuma.
4. Cada chamada à API leva `Authorization: Bearer <ID token>`. Quem confere o
   token é a Lambda (ver [AWS.md](AWS.md)) — o navegador nunca é a autoridade.

**Autorização.** Não há papéis nem telas restritas: a única regra é "cada
jogador só enxerga o próprio progresso", e ela é aplicada no servidor, usando o
id que está dentro do token.

**Sair.** O botão Sair do menu apaga a sessão e volta para a tela de login. O
progresso local daquela conta permanece no aparelho, em uma chave separada por
conta.

## Conciliação do progresso

Ao entrar, `ProgressoStorage.sincronizar()` junta o que está no aparelho com o
que está na nuvem, fase por fase, e fica com **o melhor de cada uma** (mais
estrelas, menos blocos). O resultado é gravado dos dois lados.

| Nuvem | Aparelho | Resultado |
|---|---|---|
| tem dados | tem dados | mescla: o melhor de cada fase |
| tem dados | vazio | desce da nuvem |
| vazia | tem dados | sobe para a nuvem |
| vazia | vazio | começa do zero |

Durante a partida a gravação é *write-through*: vai para o `localStorage` na
hora e para a nuvem em segundo plano. O jogo nunca trava esperando a rede.

## Configuração

Copie `.env.example` para `.env.local` (ignorado pelo git) e preencha:

```
VITE_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
VITE_API_URL=https://xxxxxxxx.execute-api.sa-east-1.amazonaws.com
```

- Sem `VITE_GOOGLE_CLIENT_ID`, o botão do Google some e só o modo convidado funciona.
- Sem `VITE_API_URL`, quem entra com Google joga normalmente, mas o progresso
  fica só no aparelho.

Os dois valores são públicos (vão embarcados no JavaScript de qualquer site que
usa login do Google). A proteção vem da lista de origens autorizadas no Google e
da validação do token no servidor.

### Criar o Client ID

1. [Google Cloud Console](https://console.cloud.google.com/) → crie um projeto.
2. **APIs e serviços → Tela de permissão OAuth** → tipo *Externo* → preencha
   nome do app e e-mail de suporte.
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo Web**.
4. Em **Origens JavaScript autorizadas**, inclua cada endereço onde o jogo roda:
   `http://localhost:5173`, `https://code-quest-bot-beep.vercel.app` e
   `https://brunofranzosi230.github.io`.

### Liberar o login para qualquer conta

Enquanto o app estiver em modo **Teste**, só os e-mails cadastrados como
usuários de teste conseguem entrar. Para liberar: **Tela de permissão OAuth →
Público-alvo → Publicar aplicativo**. Como o jogo pede apenas o perfil básico
(nome e e-mail), o Google não exige verificação.

## LGPD

O público são crianças de 6 a 11 anos.

- O **modo convidado** não coleta nenhum dado pessoal e está sempre disponível.
- Com Google, o servidor guarda só o necessário: id, nome, e-mail e o progresso.
- O login de uma criança deve ser feito com a autorização do responsável
  (LGPD, art. 14).
- A exclusão é possível pelo endpoint `DELETE /progresso`, que apaga o jogador e
  todo o progresso dele.
- A telemetria fica só no aparelho e não registra nome, e-mail nem identificador
  permanente.
- O Grafana usa um usuário de banco que não enxerga nome nem e-mail.
