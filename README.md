# OBS Remote

Controle remoto do OBS Studio pelo navegador — funciona no Safari do iPhone,
sem precisar instalar app nenhum. Feito em React + obs-websocket-js.

## 1. Configurar o OBS

No PC com OBS aberto:

1. Menu **Ferramentas → WebSocket Server Settings**
2. Marque **Enable WebSocket server**
3. Anote a **porta** (padrão `4455`)
4. Clique em **Show Connect Info** e anote a **senha** (ou desmarque
   "Enable Authentication" se não quiser usar senha)

## 2. Rodar o projeto

```bash
npm install
npm run dev
```

O terminal vai mostrar algo como:

```
Local:   http://localhost:5173/
Network: http://192.168.0.10:5173/
```

Use o endereço em **Network** — é esse que o iPhone vai acessar.

> Importante: o PC e o iPhone precisam estar **na mesma rede Wi-Fi**.
> Se o Windows/Mac tiver firewall ativo, pode ser necessário liberar a porta
> 5173 (do site) e a 4455 (do OBS WebSocket) para a rede local.

## 3. Acessar pelo iPhone

1. Abra o Safari
2. Digite o endereço "Network" que apareceu no terminal (ex: `http://192.168.0.10:5173`)
3. Na tela de conexão do app, informe o **IP do PC**, a **porta 4455** e a
   **senha** do WebSocket do OBS
4. Toque em **Conectar**

Dica: no Safari, toque em Compartilhar → **Adicionar à Tela de Início** pra
deixar o remoto com carinha de app, em tela cheia, sem a barra do navegador.

## 4. Rodar sempre ligado (opcional)

Pra não depender do `npm run dev` toda vez:

```bash
npm run build
npm run preview
```

Isso serve a versão de produção (mais rápida) no mesmo endereço de rede.
Se quiser deixar rodando sempre que o PC ligar, dá pra usar `pm2` ou rodar
como serviço do Windows/serviço do sistema — mas isso já é além do escopo
deste projeto.

## Funcionalidades

- **Cenas** — grade com todas as cenas, troca com 1 toque, indica a ativa
- **Sources** — liga/desliga a visibilidade de cada fonte da cena atual
- **Áudio** — mute e volume (dB) de cada entrada de áudio
- **Stream** — inicia/para transmissão, com cronômetro
- **Gravação** — inicia/para/pausa gravação, com cronômetro
- **Botões** — crie atalhos customizados (trocar cena, disparar hotkey do
  OBS, ou mutar uma fonte específica), salvos no navegador
