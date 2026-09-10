import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  open,
  realpath,
  rm,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Pin both the official release and its archive bytes. No npm ZIP installer is
// involved, and nothing from an archive is executed before verification.
const version = "1.44.0";
const releases = {
  win32: {
    x64: [
      "windows_amd64.zip",
      "4c9a32c175ae4cda14206f6df87d3e2753a91bbea424f4523e50892684130430",
    ],
    arm64: [
      "windows_arm64.zip",
      "480c465813492c07098a84eaf5385384b90b52f750b120ee9476f84916b6f1f0",
    ],
  },
  linux: {
    x64: [
      "linux_amd64.tar.gz",
      "befb603ff3cd79f46980cf9309d65b35edcd323deb000b237e94c6b68d8f5be2",
    ],
    arm64: [
      "linux_arm64.tar.gz",
      "9c28bb9438e276f70ddfe0914cc34a960312eef37c88577b4b21c64b12dd0a2b",
    ],
  },
  darwin: {
    x64: [
      "darwin_amd64.tar.gz",
      "b0ad10f0e17d580d6014a6ff05ff59a8890b279a8364ab9b9957b37e1a62e2fa",
    ],
    arm64: [
      "darwin_arm64.tar.gz",
      "d426eced8fff5f0500d74ad411e53401d2f976d7521409b34908f7cd568dda69",
    ],
  },
};
const maxArchiveBytes = 200 * 1024 * 1024;
const maxExecutableBytes = 512 * 1024 * 1024;
const workspace = await realpath(
  resolve(dirname(fileURLToPath(import.meta.url)), ".."),
);
const controller = new AbortController();
let cacheDirectory,
  runDirectory,
  child,
  stopping = false;

async function requireRegularFile(path, limit) {
  const info = await lstat(path);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size < 1 ||
    info.size > limit
  )
    throw new Error(`Refusing an unexpected file or file size: ${path}`);
}

async function ensureCacheDirectory() {
  let current = workspace;
  for (const segment of [".artifacts", "tooling", "inngest"]) {
    current = join(current, segment);
    try {
      await mkdir(current);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
    const info = await lstat(current);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      (await realpath(current)) !== current
    )
      throw new Error(`Refusing a redirected tooling directory: ${current}`);
  }
  return current;
}

async function verifyArchive(path, expected) {
  await requireRegularFile(path, maxArchiveBytes);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  if (hash.digest("hex") !== expected)
    throw new Error(
      `Inngest archive checksum mismatch. Nothing was executed. Inspect any cached archive in ${cacheDirectory}; the rejected temporary copy will be removed.`,
    );
}

async function downloadArchive(url, destination) {
  const signal = AbortSignal.any([
    controller.signal,
    AbortSignal.timeout(180000),
  ]);
  const allowedHosts = new Set([
    "github.com",
    "release-assets.githubusercontent.com",
    "objects.githubusercontent.com",
  ]);
  let response;
  for (let redirects = 0; redirects <= 4; redirects++) {
    const target = new URL(url);
    if (
      target.protocol !== "https:" ||
      target.port ||
      target.username ||
      target.password ||
      !allowedHosts.has(target.hostname)
    )
      throw new Error(
        "The Inngest download redirected outside official GitHub release hosting.",
      );
    response = await fetch(target, { redirect: "manual", signal });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirects === 4)
      throw new Error("Too many Inngest download redirects.");
    url = new URL(location, target).href;
  }
  if (!response.ok || !response.body)
    throw new Error(`Inngest download failed (HTTP ${response.status}).`);
  if (Number(response.headers.get("content-length")) > maxArchiveBytes) {
    await response.body.cancel();
    throw new Error("The Inngest archive exceeds the download size limit.");
  }
  const file = await open(destination, "wx", 0o600);
  try {
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > maxArchiveBytes)
        throw new Error("The Inngest archive exceeds the download size limit.");
      await file.writeFile(chunk);
    }
  } finally {
    await file.close();
  }
}

async function run(command, args, options = {}) {
  controller.signal.throwIfAborted();
  child = spawn(command, args, {
    windowsHide: true,
    stdio: "inherit",
    ...options,
  });
  const active = child;
  try {
    return await new Promise((done, reject) => {
      active.once("error", reject);
      active.once("exit", (code) => done(code ?? (stopping ? 130 : 1)));
    });
  } finally {
    if (child === active) child = undefined;
  }
}

async function terminateOwnedChild() {
  const active = child;
  if (!active?.pid || active.exitCode !== null || active.signalCode !== null)
    return;
  if (process.platform === "win32") {
    const killer = spawn(
      "taskkill.exe",
      ["/PID", String(active.pid), "/T", "/F"],
      { windowsHide: true, stdio: "ignore" },
    );
    const code = await new Promise((done, reject) => {
      killer.once("error", reject);
      killer.once("exit", done);
    });
    if (code !== 0 && active.exitCode === null && active.signalCode === null)
      throw new Error(
        `Could not stop this launcher's process ${active.pid}; stop it before removing its temporary files.`,
      );
  } else active.kill("SIGTERM");
}

function stop() {
  if (stopping) return;
  stopping = true;
  controller.abort();
  void terminateOwnedChild().catch((error) => console.error(error.message));
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  const release = releases[process.platform]?.[process.arch];
  if (!release)
    throw new Error(
      `No pinned Inngest CLI for ${process.platform}/${process.arch}.`,
    );
  const [suffix, checksum] = release;
  const archiveName = `inngest_${version}_${suffix}`;
  cacheDirectory = await ensureCacheDirectory();
  runDirectory = await mkdtemp(join(cacheDirectory, "run-"));
  const archive = join(runDirectory, archiveName);
  const cachedArchive = join(cacheDirectory, archiveName);
  let cached = true;
  try {
    await requireRegularFile(cachedArchive, maxArchiveBytes);
  } catch (error) {
    if (error.code === "ENOENT") cached = false;
    else throw error;
  }
  if (cached) await copyFile(cachedArchive, archive, constants.COPYFILE_EXCL);
  else {
    console.log(
      `Downloading the checksum-pinned official Inngest CLI ${version} (first run only).`,
    );
    await downloadArchive(
      `https://github.com/inngest/inngest/releases/download/v${version}/${archiveName}`,
      archive,
    );
  }
  await verifyArchive(archive, checksum);
  if (!cached) {
    try {
      await copyFile(archive, cachedArchive, constants.COPYFILE_EXCL);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const executable = join(
    runDirectory,
    process.platform === "win32" ? "inngest.exe" : "inngest",
  );
  let extractionCode;
  if (process.platform === "win32") {
    // Literal script + environment values: paths never become PowerShell code.
    // Extract one regular entry, with no archive-controlled output path.
    const extraction = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($env:STILLMARK_CLI_ARCHIVE)
try {
  $entries = @($archive.Entries | Where-Object { $_.FullName -ceq 'inngest.exe' })
  if ($entries.Count -ne 1) { throw 'Expected one root-level inngest.exe entry.' }
  $entry = $entries[0]
  if ($entry.Length -lt 1 -or $entry.Length -gt 536870912) { throw 'Unexpected executable size.' }
  $unixType = ($entry.ExternalAttributes -shr 16) -band 61440
  if ($unixType -ne 0 -and $unixType -ne 32768) { throw 'Executable must be a regular file.' }
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $env:STILLMARK_CLI_EXECUTABLE, $false)
} finally { $archive.Dispose() }
`;
    extractionCode = await run(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", extraction],
      {
        env: {
          ...process.env,
          STILLMARK_CLI_ARCHIVE: archive,
          STILLMARK_CLI_EXECUTABLE: executable,
        },
      },
    );
  } else {
    extractionCode = await run("tar", [
      "-xzf",
      archive,
      "-C",
      runDirectory,
      "inngest",
    ]);
  }
  if (extractionCode !== 0)
    throw new Error("Could not extract the verified Inngest executable.");
  await requireRegularFile(executable, maxExecutableBytes);
  if (process.platform !== "win32") await chmod(executable, 0o700);
  const args = process.argv.slice(2);
  process.exitCode = await run(
    executable,
    args.length
      ? args
      : [
          "dev",
          "--host",
          "127.0.0.1",
          "--no-discovery",
          "-u",
          "http://127.0.0.1:3000/api/inngest",
        ],
  );
} catch (error) {
  if (!stopping)
    console.error(
      error instanceof Error
        ? error.message
        : "Could not start the local Inngest CLI.",
    );
  process.exitCode = stopping ? 130 : 1;
} finally {
  await terminateOwnedChild();
  if (runDirectory) {
    // Only remove the fresh directory this invocation created, never the cache.
    const info = await lstat(runDirectory);
    if (
      info.isSymbolicLink() ||
      !info.isDirectory() ||
      dirname(runDirectory) !== cacheDirectory ||
      !basename(runDirectory).startsWith("run-") ||
      (await realpath(runDirectory)) !== runDirectory
    )
      throw new Error(
        `Refusing to clean an unexpected tooling path: ${runDirectory}`,
      );
    await rm(runDirectory, { recursive: true, force: false });
  }
}
