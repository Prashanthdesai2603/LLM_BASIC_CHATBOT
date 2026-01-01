// server.js
console.log("SERVER FILE LOADED: FINAL VERSION");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import db from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ---------- PATH SETUP ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- SESSION STORAGE ----------
const sessions = new Map();

/**
 * Create or restore session from DB
 */
function getSession(req, res) {
  let sessionId = req.headers["x-session-id"];

  if (!sessionId) {
    sessionId = uuidv4();
    res.setHeader("x-session-id", sessionId);
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);

    // Restore conversation from DB
    db.all(
      "SELECT role, content FROM messages WHERE session_id = ? ORDER BY created_at",
      [sessionId],
      (err, rows) => {
        if (err) {
          console.error("DB LOAD ERROR:", err);
          return;
        }

        rows.forEach(row => {
          sessions.get(sessionId).push({
            role: row.role,
            content: [{
              type: row.role === "user" ? "input_text" : "output_text",
              text: row.content
            }]
          });
        });
      }
    );
  }

  return { sessionId, conversation: sessions.get(sessionId) };
}

// ---------- SERVE FRONTEND ----------
app.use(express.static(path.join(__dirname, "public")));

// ---------- CHAT ----------
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  const { sessionId, conversation } = getSession(req, res);

  conversation.push({
    role: "user",
    content: [{ type: "input_text", text: userMessage }]
  });

  db.run(
    "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
    [sessionId, "user", userMessage]
  );

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: conversation
      })
    });

    const data = await response.json();

    let reply = "No response received.";
    if (data.output) {
      for (const item of data.output) {
        for (const block of item.content || []) {
          if (block.type === "output_text") reply = block.text;
        }
      }
    }

    conversation.push({
      role: "assistant",
      content: [{ type: "output_text", text: reply }]
    });

    db.run(
      "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
      [sessionId, "assistant", reply]
    );

    if (conversation.length > 12) {
      conversation.splice(0, conversation.length - 12);
    }

    res.json({ reply });

  } catch (err) {
    console.error("LLM ERROR:", err);
    res.status(500).json({ error: "LLM request failed" });
  }
});

// ---------- LOAD FULL CHAT ----------
app.get("/load-all", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.json([]);
  }
  res.json(sessions.get(sessionId));
});

// ---------- RECENT CHATS ----------
app.get("/recent-chats", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (!sessionId || !sessions.has(sessionId)) {
    return res.json([]);
  }

  const conversation = sessions.get(sessionId);
  const recent = conversation
    .map((msg, index) => ({ msg, index }))
    .filter(item => item.msg.role === "user")
    .slice(-5)
    .map(item => ({
      index: item.index,
      text: item.msg.content[0].text
    }));

  res.json(recent);
});

// ---------- CLEAR CHAT ----------
app.post("/clear", (req, res) => {
  const sessionId = req.headers["x-session-id"];
  if (sessionId) {
    sessions.delete(sessionId);
    db.run("DELETE FROM messages WHERE session_id = ?", [sessionId]);
  }
  res.json({ status: "cleared" });
});

// ---------- START SERVER ----------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
