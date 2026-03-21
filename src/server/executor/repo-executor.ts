import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";

export interface ShellResult {
  command: string;
  cwd: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface RepoValidationResult {
  repoExists: boolean;
  isGitRepo: boolean;
  currentBranch?: string;
}

export interface CommandAvailabilityResult {
  runnable: boolean;
  reason?: string;
}

const packageManagerBuiltins = {
  pnpm: new Set([
    "exec",
    "dlx",
    "install",
    "add",
    "remove",
    "update",
    "run",
    "test",
    "import",
  ]),
  npm: new Set(["run", "exec", "install", "test", "ci"]),
  yarn: new Set(["run", "exec", "install", "add", "remove", "test"]),
  bun: new Set(["run", "x", "install", "add", "remove", "test"]),
} as const;

function normalizeRelativeFile(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

export class RepoExecutor {
  private packageScriptsCache?: Record<string, string> | null;

  constructor(
    public readonly repoPath: string,
    private readonly allowedPaths: string[],
    private readonly forbiddenPaths: string[],
  ) {}

  async validateProjectRepo(): Promise<RepoValidationResult> {
    let repoExists = false;
    try {
      await access(this.repoPath, constants.R_OK);
      repoExists = true;
    } catch {
      return {
        repoExists: false,
        isGitRepo: false,
      };
    }

    const gitResult = await this.run(
      "git rev-parse --is-inside-work-tree",
      this.repoPath,
    ).catch(() => null);
    if (
      !gitResult ||
      gitResult.exitCode !== 0 ||
      !gitResult.stdout.includes("true")
    ) {
      return {
        repoExists,
        isGitRepo: false,
      };
    }

    const branchResult = await this.run(
      "git branch --show-current",
      this.repoPath,
    );

    return {
      repoExists,
      isGitRepo: true,
      currentBranch: branchResult.stdout.trim(),
    };
  }

  async createTaskBranch(branchName: string) {
    return this.run(`git checkout -b ${branchName}`, this.repoPath);
  }

  async getCurrentBranch() {
    return this.run("git branch --show-current", this.repoPath);
  }

  async getChangedFiles() {
    const result = await this.run("git diff --name-only", this.repoPath);
    return result.stdout
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async getDirtyFiles() {
    const result = await this.run(
      "git status --short --untracked-files=all",
      this.repoPath,
    );
    return result.stdout
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[ MARCUD?!]{1,3}/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const renameParts = line.split(" -> ");
        return renameParts[renameParts.length - 1]?.trim() || line;
      });
  }

  assertFilesWithinScope(files: string[]) {
    const normalizedAllowed = this.allowedPaths.map(normalizeRelativeFile);
    const normalizedForbidden = this.forbiddenPaths.map(normalizeRelativeFile);

    const violations = files.filter((file) => {
      const normalized = normalizeRelativeFile(file);
      const isForbidden = normalizedForbidden.some(
        (scope) => normalized === scope || normalized.startsWith(`${scope}/`),
      );
      const isAllowed =
        normalizedAllowed.length === 0 ||
        normalizedAllowed.some(
          (scope) => normalized === scope || normalized.startsWith(`${scope}/`),
        );

      return isForbidden || !isAllowed;
    });

    if (violations.length > 0) {
      throw new Error(`检测到越界改动: ${violations.join(", ")}`);
    }
  }

  async runConfiguredCommand(command: string) {
    return this.run(command, this.repoPath);
  }

  async inspectConfiguredCommand(
    command: string,
  ): Promise<CommandAvailabilityResult> {
    const trimmed = command.trim();
    if (!trimmed) {
      return {
        runnable: false,
        reason: "命令为空",
      };
    }

    const packageScripts = await this.getPackageScripts();
    if (!packageScripts) {
      return {
        runnable: true,
      };
    }

    const parts = trimmed.split(/\s+/);
    const [runner, firstArg, secondArg] = parts;

    if (!runner || !(runner in packageManagerBuiltins)) {
      return {
        runnable: true,
      };
    }

    if (runner === "npm" && firstArg === "run" && secondArg) {
      return secondArg in packageScripts
        ? { runnable: true }
        : {
            runnable: false,
            reason: `package.json 未定义 script: ${secondArg}`,
          };
    }

    if (
      (runner === "pnpm" || runner === "yarn" || runner === "bun") &&
      firstArg === "run" &&
      secondArg
    ) {
      return secondArg in packageScripts
        ? { runnable: true }
        : {
            runnable: false,
            reason: `package.json 未定义 script: ${secondArg}`,
          };
    }

    if (
      firstArg &&
      !packageManagerBuiltins[
        runner as keyof typeof packageManagerBuiltins
      ].has(firstArg)
    ) {
      return firstArg in packageScripts
        ? { runnable: true }
        : {
            runnable: false,
            reason: `package.json 未定义 script: ${firstArg}`,
          };
    }

    return {
      runnable: true,
    };
  }

  private async getPackageScripts() {
    if (this.packageScriptsCache !== undefined) {
      return this.packageScriptsCache;
    }

    try {
      const raw = await readFile(
        path.join(this.repoPath, "package.json"),
        "utf8",
      );
      const json = JSON.parse(raw) as { scripts?: Record<string, string> };
      this.packageScriptsCache = json.scripts || null;
      return this.packageScriptsCache;
    } catch {
      this.packageScriptsCache = null;
      return this.packageScriptsCache;
    }
  }

  async run(command: string, cwd = this.repoPath): Promise<ShellResult> {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        cwd,
        shell: true,
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);

      child.on("close", (code) => {
        resolve({
          command,
          cwd: path.resolve(cwd),
          exitCode: code ?? 1,
          stdout,
          stderr,
          durationMs: Date.now() - startedAt,
        });
      });
    });
  }
}
