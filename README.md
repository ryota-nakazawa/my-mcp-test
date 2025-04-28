目的：自作のMCPを作成して、MCPを自作する場合の流れを掴む

# 始める前に

前提としてnodeのインストールが必要。

この辺はQiitaとか参考にしてよしなに行なってください。
参考サイト：https://qiita.com/sefoo0104/items/0653c935ea4a4db9dc2b

作成の際の言語はtypescriptかpython。

個人的にjavascriptの方が触ったことがあるので、typescriptを採用。

# FastMCPを使って自作のMCPサーバーの作成

プロジェクトを作成するディレクトリを作る。

今回は/Users/あなたのユーザー名/testの配下で作業を行なった。

```bash
mkdir my-mcp-server
```

作ったディレクトリに移動

```bash
cd my-mcp-server
```

npmの初期化

```bash
npm init -y
```

必要なパッケージをインストール

```bash
npm install fastmcp typescript zod @types/node
```

もしくは

```bash
npm install fastmcp zod tsx --save 
```

nodeでtypescriptを起動するとコンパイルが走るみたいなので、tsxで直接起動できるようにする

```bash
npm install -D tsx
```

src配下にserver.tsを作成する。このファイルにサーバーの定義を記載する

```bash
mkdir src
touch src/server.ts 
```

package.jsonのscriptを編集する

```json
{
  "scripts": {
    "dev": "tsx src/server.ts"
  }
}
```

src/server.tsの内容を記載

```tsx
import { FastMCP } from "fastmcp";
import { z } from "zod";

// 1. サーバーインスタンス生成
const server = new FastMCP({
  name: "My First MCP Server",
  version: "0.1.0",
});

// 2. ツールを 1 つ登録（a+b を返すだけ）
server.addTool({
  name: "add",
  description: "2 つの数値を加算します",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => String(a + b),
});

// 3. 標準入出力(stdio)で待ち受け
server.start({ transportType: "stdio" });

```

サーバーを起動する

```bash
npm run dev
```

※ 起動の際に[FastMCP warning] could not infer client capabilitiesのような表示があっても特に問題はない

# Claude for Desktopの設定

**`claude_desktop_config.json`** の編集

```json
{
  "mcpServers": {
    "my-fastmcp": {
      "command": "npx",
      "args": ["tsx", "/Users/あなたのユーザー名/test/my-mcp-server/src/server.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}

```

Claude for desktopのconfigの設定が完了したら、claudeを再起動して、設定がうまくできているか確認する。

うまくいかないケースとしては以下のようなエラーが生じてclaudeがMCPサーバーにアクセスできないエラーが生じる。

原因としてはclaudeが参照するnpxのpathをclaudeが認識していないので、サーバーの立ち上げに失敗しているケースである。（homebrewでインストールするとこのケースが生じやすい）

この場合のエラーの解消方法はclaudeから参照できるところにnpxのラッパーを作ってあげることで解消する。

![スクリーンショット 2025-04-28 21.09.35.png](attachment:0a437940-3abb-4478-a868-8a8e580d8f21:スクリーンショット_2025-04-28_21.09.35.png)

まずはwhichコマンドでnodeやnpxがどこに格納されているか確認する。

```bash
which node
which npx
```

homebrewでのインストールの場合、格納場所は以下のようになっているはずである。

```bash
/opt/homebrew/bin/node
/opt/homebrew/bin/npx
```

普通のGUIアプリ（今回のClaudeのような）は`/opt/homebrew/bin` を知らないため、ここを参照優先して参照するようにpathを通す必要がある。

スクリプトの作成

```bash
sudo nano /usr/local/bin/npx-for-claude
```

以下で内容を記載

```bash
#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
exec npx "$@"

```

保存して終了（`Ctrl+O` → `Enter` → `Ctrl+X`）。

実行権限も付与。

```bash
sudo chmod +x /usr/local/bin/npx-for-claude
```

**`claude_desktop_config.json`** を以下のように書き換える。

```bash
{
  "mcpServers": {
    "my-fastmcp": {
      "command": "npx-for-claude",
      "args": ["tsx", "/Users/あなたのユーザー名/test/my-mcp-server/src/server.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}

```

こうすることで、npx-for-claude経由でGUI（Claude）が`/opt/homebrew/bin` 配下のnpxを参照できるようになるため、サーバーの立ち上げが問題なく実施できる。

立ち上げがうまくいくと以下のようにトンカチマークが出現する。

![スクリーンショット 2025-04-28 21.29.22.png](attachment:b6c236f9-f50d-42c5-8c06-8cda1d5e9c88:スクリーンショット_2025-04-28_21.29.22.png)

ツールとしても先ほどserver.tsに記載したToolが確認できるようになる。

![スクリーンショット 2025-04-28 21.30.13.png](attachment:513ac521-b6dc-4c8d-a665-4e27566d34ba:スクリーンショット_2025-04-28_21.30.13.png)

今回試験的に作成しているMCPは二つの数字を足し算する簡単なものなので、これがきちんと動くのか確認する。

以下のようにプロンプトを入力

`add：100, 200`

![スクリーンショット 2025-04-28 21.33.51.png](attachment:99915eee-068e-40a3-b57c-5ac3d85339e4:スクリーンショット_2025-04-28_21.33.51.png)

MCPがうまく起動している際は外部へのアクセスの許可を求めるような画面が表示されるので、許可をする。

![スクリーンショット 2025-04-28 21.34.12.png](attachment:2284baac-3848-4e79-a8e4-c0e51930de42:スクリーンショット_2025-04-28_21.34.12.png)

許可をするとMCPとの連携ができて、回答が出力される。

![スクリーンショット 2025-04-28 21.34.29.png](attachment:cfac8513-42a8-4a70-993e-f27a77d199d4:スクリーンショット_2025-04-28_21.34.29.png)

もちろんaddToolから外部API呼び出しをすることも可能。

例えば以下のようにChatGPTのAPIを呼び出すようなコードを記載する。

```tsx
import { FastMCP } from "fastmcp";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "sk-your-real-key-here",   // ← 直書き
});

// 1. サーバーインスタンス生成
const server = new FastMCP({
  name: "My First MCP Server",
  version: "0.1.0",
});

// 2. ツールを 1 つ登録（a+b を返すだけ）
server.addTool({
  name: "add",
  description: "2 つの数値を加算します",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ a, b }) => String(a + b),
});

// ChatGPT ツールを追加
server.addTool({
  name: "chatgpt",
  description: "任意のプロンプトを ChatGPT に投げて応答を返します",
  parameters: z.object({
    prompt: z.string().describe("ユーザーのプロンプト"),
    model: z
      .string()
      .optional()
      .describe("使用するモデル名（省略時は gpt-4o-mini）"),
  }),
  execute: async ({ prompt, model = "gpt-4o-mini" }) => {
    // OpenAI Chat Completions API を呼び出し
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });

    // 生成結果を返す（Tool は文字列を返却）
    return completion.choices[0].message?.content?.trim() ?? "";
  },
});

// 3. 標準入出力(stdio)で待ち受け
server.start({ transportType: "stdio" });

```

そうするとchatgptというtoolが使いされるようになる。

![スクリーンショット 2025-04-28 23.26.18.png](attachment:45e96067-fc23-4891-9aed-43d33d03b305:スクリーンショット_2025-04-28_23.26.18.png)

以下のようにchatgptのツールを使うようにプロンプトを打ち込むと、chatgptのAPI経由で回答をくれて出力することができる。

![スクリーンショット 2025-04-28 23.24.03.png](attachment:d35200a0-dcd6-4ac1-8766-cb822c21ee61:スクリーンショット_2025-04-28_23.24.03.png)

上記より、addToolへの記載によって外部APIを叩くことができることがわかった。

これらから、基本的にMCPを叩く際はaddToolのところでAPI通信をするためのコードを記載することになる。

なので独自のAPIに対してMCPを作成する場合も、addToolのところに自分たちのAPI接続するためのコードを記載してMCPを作成する流れになる。

ちなみにプロンプト次第では二つのツールを有効に使いながらタスクをこなすことができるので、MCPの拡張性に期待できる。

![スクリーンショット 2025-04-28 23.32.43.png](attachment:7be05304-8bc6-4cb5-875a-57afdbcdfd95:スクリーンショット_2025-04-28_23.32.43.png)

![スクリーンショット 2025-04-28 23.32.52.png](attachment:4fe864ad-0154-473d-afc8-1efeee962b03:スクリーンショット_2025-04-28_23.32.52.png)
