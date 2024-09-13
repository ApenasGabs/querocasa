// src/api/ping.js

export default async function handler(req, res) {
  try {
    res.status(200).json({ Pong: true });
  } catch (error) {
    console.error("Erro ao responder pong", error);
    res.status(500).json({ message: "Erro ao responder pong" });
  }
}
