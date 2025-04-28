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
