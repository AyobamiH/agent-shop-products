import { configuredMeasurementId } from "./config";
import type { AnalyticsConfig } from "./config";
import type { ConsentChoice } from "./consent";
import { discoveryEvent } from "./events";
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
  constructor(
    private config: AnalyticsConfig,
    private transport: AnalyticsTransport,
  ) {}
  update(href: string, consent: ConsentChoice | null): void {
    const id = configuredMeasurementId(this.config);
    const page = discoveryEvent(href, "page_view");
    if (!id || consent !== "granted") {
      this.pause(true);
      return;
    }
    if (!page) {
      this.pause();
      this.lastPage = "";
      return;
    }
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
    const event = discoveryEvent(href, name, selectedId);
    if (this.active && event) this.transport.send(event);
  }
  pause(clearCookies = false): void {
    this.transport.stop(clearCookies);
    this.active = false;
    if (clearCookies) this.lastPage = "";
  }
}
