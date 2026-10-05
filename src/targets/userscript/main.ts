import { AppMode, Environment } from "@/core/boundary/environment";
import { ComposePage, PageDependencies } from "@/targets/userscript/pages/page";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { composeFavoritesPage } from "@/targets/userscript/pages/favorites";
import { composePostListPage } from "@/targets/userscript/pages/post_list";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;

const PAGES: Record<AppMode, ComposePage> = {
  favorites: composeFavoritesPage,
  postList: composePostListPage
};

function readEnvironment(rule34Document: Rule34Document): Environment {
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment === null) {
    throw new Error(`Unsupported page: ${location.href}`);
  }
  return { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment };
}

function createPageDependencies(environment: Environment, rule34Document: Rule34Document): PageDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34Document, page: new BrowserHostPage() });
  return { fetch: boundFetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, hostPage };
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);

  PAGES[environment.mode](environment, createPageDependencies(environment, rule34Document));
}

main();
