import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

export async function launchSecurityBrowser() {
 const executable = [process.env.E2E_BROWSER_EXECUTABLE, "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", chromium.executablePath()].find(path => path && existsSync(path));
 if (!executable) throw new Error("Install Microsoft Edge or set E2E_BROWSER_EXECUTABLE");
 const root = resolve("test-results");
 await mkdir(root, { recursive: true });
 const profile = await mkdtemp(join(root, "browser-"));
 const child = spawn(executable, ["--headless=new", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check", "--disable-popup-blocking", "--user-data-dir=" + profile, "about:blank"], { windowsHide: true });
 const exited = new Promise<void>(resolve => child.once("exit", () => resolve()));
 const cleanup = async () => {
  if (child.exitCode === null) child.kill();
  await exited;
  // Only this run's generated profile can be recursively removed.
  if (!relative(root, profile).startsWith("browser-") || relative(root, profile).includes("..")) throw new Error("Unexpected browser profile path");
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
 };
 try {
  const endpoint = await new Promise<string>((resolve, reject) => {
   const timeout = setTimeout(() => reject(new Error("Edge did not expose its DevTools endpoint")), 15000);
   let output = "";
   child.once("error", error => { clearTimeout(timeout); reject(error); });
   child.once("exit", () => { clearTimeout(timeout); reject(new Error("Edge exited before connecting")); });
   child.stderr.on("data", chunk => {
    output += chunk.toString();
    const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) { clearTimeout(timeout); resolve(match[1]); }
   });
  });
  // A second CDP session cannot remove the visibility override installed by
  // Playwright's original session. Keep the default context native instead.
  const browser = await chromium.connectOverCDP(endpoint, { noDefaults: true });
  return { browser, close: async () => {
   const cdp = await browser.newBrowserCDPSession();
   await cdp.send("Browser.close").catch(() => undefined);
   await browser.close();
   await cleanup();
  } };
 } catch (error) { await cleanup(); throw error; }
}
