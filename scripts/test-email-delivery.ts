import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/server/email";

const messages: Buffer[] = [];
const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onAuth(_auth, _session, callback) { callback(null, { user: "local-test" }); },
  onData(stream, _session, callback) {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => { messages.push(Buffer.concat(chunks)); callback(); });
  },
});

function listen() { return new Promise<number>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", () => resolve((server.server.address() as { port: number }).port)); }); }
function close() { return new Promise<void>((resolve) => server.close(() => resolve())); }
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`Email smoke test failed: ${message}`); }

async function main() {
  const port = await listen();
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(port);
  process.env.SMTP_SECURE = "false";
  process.env.SMTP_USER = "local-test";
  process.env.SMTP_PASSWORD = "local-test";
  process.env.EMAIL_FROM = "KEVESTA <test@kevesta.local>";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  try {
    await sendVerificationEmail("traveler@example.com", "Amina", "verification-token-123");
    await sendPasswordResetEmail("traveler@example.com", "Amina", "reset-token-456");
    assert(messages.length === 2, `expected 2 messages, received ${messages.length}`);
    const verification = await simpleParser(messages[0]);
    const reset = await simpleParser(messages[1]);
    assert(verification.subject === "Confirm your KEVESTA email", "verification subject mismatch");
    assert(reset.subject === "Reset your KEVESTA password", "reset subject mismatch");
    for (const [label, message, expectedToken] of [["verification", verification, "verification-token-123"], ["reset", reset, "reset-token-456"]] as const) {
      const html = typeof message.html === "string" ? message.html : "";
      assert(html.includes("KEVESTA"), `${label} email is missing KEVESTA branding`);
      assert(html.includes("Move with confidence"), `${label} email is missing brand strapline`);
      assert(html.includes(expectedToken), `${label} email is missing its action token`);
      assert(html.includes("http://"), `${label} email is missing an action URL`);
    }
    console.log("Email SMTP smoke test passed: verification and password-reset HTML delivered and rendered.");
  } finally { await close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
