import { Environment } from "@/core/boundary/environment";
import { Media } from "@/core/domain/media/media";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface PageDependencies {
  fetch: typeof fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: (file: { url: string; tags: string }) => Media | null;
  rule34: Rule34Client;
  rule34Document: Rule34Document;
  rule34Cdn: Rule34CdnClient;
  hostPage: Rule34HostPage;
}

export type PageEnvironment = Omit<Environment, "mode">;

export type ComposePage = (environment: PageEnvironment, dependencies: PageDependencies) => void;
