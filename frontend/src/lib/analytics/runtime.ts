import { configuredMeasurementId } from "./config";
import type { AnalyticsConfig } from "./config";
import type { ConsentChoice } from "./consent";
import { discoveryEvent } from "./events";
import { classifyAssistantReferrer } from "./assistant-referrals";
import type { AssistantSource } from "./assistant-referrals";
import type { DiscoveryEvent } from "./events";
export interface AnalyticsTransport {
  start(id: string, page: DiscoveryEvent): void;
  send(event: DiscoveryEvent): void;
  stop(clearCookies?: boolean): void;
}

// Dependency injection lets tests exercise the real gate without sending Google traffic.
export class DiscoveryRuntime {
  private active = false;
  private lastPage = "";
  private assistantSource: AssistantSource | null = null;
  private referralClassified = false;
  constructor(
    private config: AnalyticsConfig,
    private transport: AnalyticsTransport,
    private getReferrer: () => string = () => "",
  ) {}
  update(href: string, consent: ConsentChoice | null): void {
    const id = configuredMeasurementId(this.config);
    if (!id || consent !== "granted") {
      this.pause(true);
      return;
    }
    // Do not even read a referrer without consent or on excluded paths.
    if (!discoveryEvent(href, "page_view")) {
      this.pause();
      this.lastPage = "";
      return;
    }
    if (!this.referralClassified) {
      // A referring URL is used only locally and discarded immediately.
      try {
        this.assistantSource = classifyAssistantReferrer(this.getReferrer());
      } catch {
        this.assistantSource = null;
      }
      this.referralClassified = true;
    }
    const page = discoveryEvent(href, "page_view", undefined, this.assistantSource)!;
    if (!this.active) {
      this.transport.start(id, page);
      this.active = true;
    }
    const identity = JSON.stringify(page.parameters);
    if (identity !== this.lastPage) {
      this.transport.send(page);
      this.lastPage = identity;
    }
  }
  event(href: string, consent: ConsentChoice | null, name: string, selectedId?: string): void {
    this.update(href, consent);
    const event = discoveryEvent(href, name, selectedId, this.assistantSource);
    if (this.active && event) this.transport.send(event);
  }
  pause(clearCookies = false): void {
    this.transport.stop(clearCookies);
    this.active = false;
    if (clearCookies) {
      this.lastPage = "";
      this.referralClassified = false;
      this.assistantSource = null;
    }
  }
}
