import http from "node:http";
import { spawn } from "node:child_process";
import { SMTPServer } from "smtp-server";

const messages: string[] = [];
const smtp = new SMTPServer({ authOptional: true, disabledCommands: ["STARTTLS"], onAuth(_auth, _session, callback) { callback(null, { user: "local" }); }, onData(stream, _session, callback) { const chunks: Buffer[] = []; stream.on("data", (chunk: Buffer) => chunks.push(chunk)); stream.on("end", () => { messages.push(Buffer.concat(chunks).toString("utf8")); callback(); }); } });
const httpServer = http.createServer((request, response) => {
  if (request.url === "/__test/emails") { response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify({ messages })); return; }
  if (request.method === "POST" && request.url?.startsWith("/v1/ach/transfers")) { let body = ""; request.on("data", (chunk) => { body += chunk; }); request.on("end", () => { response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify({ id: `col_local_${Date.now()}`, status: "processing", received: JSON.parse(body || "{}") })); }); return; }
  response.writeHead(404); response.end();
});

function listen(server: { listen: (port: number, host: string, callback: () => void) => void }) { return new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve)); }

async function main() {
  await listen(smtp);
  await listen(httpServer);
  httpServer.close();
  await new Promise<void>((resolve) => httpServer.listen(4010, "127.0.0.1", resolve));
  const inspectServer = http.createServer((request, response) => { if (request.url === "/__test/emails") { response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify({ messages })); } else { response.writeHead(404); response.end(); } });
  await new Promise<void>((resolve) => inspectServer.listen(4011, "127.0.0.1", resolve));
  const smtpAddress = smtp.server.address() as { port: number };
  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3001"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: "pg-mem://local-integration", COLUMN_API_KEY: "local-column-key", COLUMN_API_BASE: "http://127.0.0.1:4010", COLUMN_ACH_TRANSFER_PATH: "/v1/ach/transfers", COLUMN_RECEIVING_ACCOUNT_ID: "local-receiving-account", COLUMN_WEBHOOK_SECRET: "local-column-secret", SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtpAddress.port), SMTP_USER: "local", SMTP_PASSWORD: "local", EMAIL_FROM: "KEVESTA <local@kevesta.test>", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001", NODE_ENV: "test", LOCAL_INTEGRATION: "1" } });
  let shuttingDown = false;
  const cleanup = () => { if (shuttingDown) return; shuttingDown = true; child.kill("SIGTERM"); smtp.close(); httpServer.close(); inspectServer.close(); setTimeout(() => process.exit(0), 250); };
  process.on("SIGINT", cleanup); process.on("SIGTERM", cleanup); child.on("exit", (code) => { if (!shuttingDown) process.exit(code || 0); });
}
main().catch((error) => { console.error(error); process.exit(1); });
