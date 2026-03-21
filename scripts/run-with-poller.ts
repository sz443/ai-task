import { spawn } from "node:child_process";

const mode = process.argv[2];

if (!mode || !["dev", "start"].includes(mode)) {
  console.error("Usage: tsx scripts/run-with-poller.ts <dev|start>");
  process.exit(1);
}

const webArgs = mode === "dev" ? ["next", "dev"] : ["next", "start"];
const pollerArgs = ["tsx", "scripts/task-poller.ts"];

const children = [
  {
    name: mode === "dev" ? "web:dev" : "web:start",
    child: spawn("pnpm", webArgs, {
      stdio: "inherit",
      env: process.env,
    }),
  },
  {
    name: "poller",
    child: spawn("pnpm", pollerArgs, {
      stdio: "inherit",
      env: process.env,
    }),
  },
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  for (const { child } of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 200);
}

for (const { name, child } of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`${name} exited with signal ${signal}`);
      shutdown(1);
      return;
    }

    if ((code ?? 0) !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code ?? 1);
      return;
    }

    shutdown(0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
