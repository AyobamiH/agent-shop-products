# Calibration cases

- Server renders light state; the first client reads persisted dark state: stabilize the first snapshot and apply preference after the supported hydration boundary.
- Waiting two frames happens to remove a warning once: this is not a correctness guarantee.
- The document element is outside the verified root: a deliberate post-hydration class update can avoid changing initial React output.
- The whole document is hydrated: do not assume a document class is outside React ownership.
- An external store's server and first hydration snapshots differ: repair its serialization or server-snapshot contract.
- Theme is fixed but auth data still differs on first render: provider acceptance remains incomplete.

## Primary references

- [React hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot): matching server HTML and initial client output.
- [React useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore): server snapshot behaviour during hydration.

Refresh these contracts when applying the skill to a different React or framework version.
