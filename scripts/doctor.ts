import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const homeDir = os.homedir();
const configPath = path.join(homeDir, ".openclaw", "openclaw.json");
const requiredAgents = ["dispatcher", "frontend", "qa", "reviewer"];

function ok(label: string, detail: string) {
  console.log(`OK   ${label}: ${detail}`);
}

function warn(label: string, detail: string) {
  console.log(`WARN ${label}: ${detail}`);
}

function fail(label: string, detail: string) {
  console.log(`FAIL ${label}: ${detail}`);
}

function commandExists(command: string) {
  try {
    execFileSync("which", [command], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  let hasFailure = false;

  if (commandExists("openclaw")) {
    ok("openclaw", "命令可用");
  } else {
    fail("openclaw", "未安装或未加入 PATH");
    hasFailure = true;
  }

  if (existsSync(configPath)) {
    ok("openclaw config", configPath);
  } else {
    fail(
      "openclaw config",
      "未找到 ~/.openclaw/openclaw.json，请先执行 pnpm setup",
    );
    hasFailure = true;
  }

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf8")) as {
        agents?: { list?: Array<{ id?: string }> };
      };
      const configuredIds = new Set(
        (config.agents?.list || []).map((item) => item.id).filter(Boolean),
      );
      const missing = requiredAgents.filter((id) => !configuredIds.has(id));
      if (missing.length === 0) {
        ok("agent registry", requiredAgents.join(", "));
      } else {
        fail("agent registry", `缺少 agent: ${missing.join(", ")}`);
        hasFailure = true;
      }
    } catch {
      fail("openclaw config", "配置文件无法解析为 JSON");
      hasFailure = true;
    }
  }

  try {
    execFileSync("openclaw", ["config", "validate"], { stdio: "pipe" });
    ok("config validate", "配置校验通过");
  } catch {
    warn(
      "config validate",
      "自动校验未通过，请手动执行 openclaw config validate 查看详情",
    );
  }

  const envPath = path.join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    ok("env", ".env 已存在");
  } else {
    warn("env", "未找到 .env，建议先复制 .env.example");
  }

  const pollerPidPath = path.join(process.cwd(), ".task-poller.pid");
  if (existsSync(pollerPidPath)) {
    ok("poller", "检测到本地 poller pid 文件");
  } else {
    warn("poller", "未检测到后台 poller，可按需运行 pnpm task:poller");
  }

  process.exit(hasFailure ? 1 : 0);
}

main();
