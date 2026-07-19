# xrayservice — OHIF viewer for the 4-PACS dcm4chee cluster

Builds the **latest OHIF viewer** (`ohif/app:latest-beta` by default, v3.13 line;
flip to `latest` stable via `OHIF_TAG` in `.env`) and puts an nginx reverse proxy
in front of it. The proxy serves the viewer **and** forwards DICOMweb to each of
the four dcm4chee PACS, so the browser only ever talks to **one origin** — which
makes CORS a non-issue and makes LAN access and the Cloudflare tunnel behave
identically. No login (OIDC is stripped out).

```
browser ──http──> nginx (proxy) ──> ohif container      (the SPA)
                        │
                        ├─ /pacs-xray/  ─https─> <PACS_HOST>:8443  (XRAYPACS)
                        ├─ /pacs-ct/    ─https─> <PACS_HOST>:8444  (CTPACS)
                        ├─ /pacs-angio/ ─https─> <PACS_HOST>:8445  (ANGIOPACS)
                        └─ /pacs-us/    ─https─> <PACS_HOST>:8446  (USPACS)
```

The four PACS are configured as four OHIF data sources. OHIF v3 has **no built-in
source dropdown**, so a small picker page is served at **`/pacs`** (see below).
DIMSE ports 11112–11115 are for C-STORE/C-FIND and are **not** used by the viewer.

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | `FROM ohif/app:${OHIF_TAG}` + bakes in `app-config.js` |
| `app-config.js` | OHIF config: 4 data sources, relative roots, no auth |
| `picker.html` | source-picker landing page served at `/pacs` |
| `nginx/default.conf.template` | reverse proxy + CORS (rendered via envsubst at start) |
| `docker-compose.yml` | `ohif` (built) + `proxy` (nginx), optional `cloudflared` |
| `.env` | OHIF tag, PACS host, scheme, ports, published HTTP port |

## Run it

Requires Docker Desktop **running** (only the compose CLI is present otherwise).

```bash
cd ohif_to_xrayservice
cp .env.example .env              # then edit .env — set PACS_HOST, scheme, ports
docker compose up -d --build      # pulls latest OHIF, builds our image, starts nginx
```

Then open **http://<this-host-ip>/** on the LAN (or your Cloudflare hostname).
If port 80 is taken, set `HTTP_PORT=8088` in `.env` and use `http://<host>:8088/`.

Rebuild after editing `app-config.js`: `docker compose up -d --build`.
Reload after editing nginx/`.env`: `docker compose up -d` (nginx re-renders the
template on restart).

## Source picker, date filter, sort, and result count

OHIF v3 has **no built-in data-source dropdown**. Everything is driven by
study-list URL parameters (all confirmed against the OHIF source):

| Param | Meaning |
|---|---|
| `dataSources=<sourceName>` | active PACS — the `sourceName` from `app-config.js` (`xraypacs`, `ctpacs`, `angiopacs`, `uspacs`), **not** the friendly name |
| `startDate` / `endDate` | date filter, `YYYYMMDD` |
| `sortBy=<columnId>` | column id — the date column is **`studyDateTime`** (not `studyDate`, which silently won't sort). Also: `patientName`, `mrn`, `accession`, `modalities` |
| `sortDirection` | `desc` \| `asc` (both `desc`/`descending` accepted) |
| `resultsPerPage=<n>` | studies per page — accepts **any integer**, not just the 25/50/100 dropdown presets |

The proxy serves a **source picker** at **`/pacs`** (`picker.html`). Each archive
has a **Today** button (filters to today, newest-first, `resultsPerPage=500`) and
an **All dates** link. Example generated link:

```
/?dataSources=xraypacs&sortBy=studyDateTime&sortDirection=desc&resultsPerPage=500&startDate=20260706&endDate=20260706
```

Point users at **`http://<host>/pacs`** and have them bookmark it. Tunables live
in the `CFG` block at the top of `picker.html` (`perPage`, `sortBy`, `sortDir`) —
edit once, applies to every archive.

**Showing more than 100 studies/day** — `resultsPerPage=500` makes OHIF *request*
500. But dcm4chee also caps results server-side via its **`queryMaxNumberOfResults`**
(archive- or AE-level). If the list plateaus at ~100 despite `resultsPerPage=500`,
raise/zero that setting on dcm4chee — it's a server config, not something this
viewer can override.

**"Today" is the browser's local date.** A remote user whose timezone differs
from the clinic (Europe/Kyiv) may see "today" off by a day; the **All dates** link
sidesteps it.

**On the "source resets when you go back" behaviour** (seen on the stable image;
beta persists `dataSources` in sessionStorage so it may already differ): OHIF has
no single-instance config to force this. To pin down what's happening on beta,
open a study then click **back** and look at the URL bar:
- params still present (`?dataSources=…`) but list shows the default → a state
  init/precedence issue inside OHIF;
- params dropped (bare `/`) → the viewer's back button isn't preserving the query
  string.

Either way the reliable re-entry is the **`/pacs`** picker. Tell me which of the
two you see and I'll target the fix.

## ⚠️ Confirm these two assumptions (host was unreachable when this was built)

Everything is env-driven, so fixing either is a one-line edit:

1. **Scheme of ports 8443–8446** — assumed **HTTPS**. If they're plain HTTP, set
   `PACS_SCHEME=http` in `.env` and `docker compose up -d`.
2. **DICOMweb path / AET on each PACS** — assumed the standard
   `/dcm4chee-arc/aets/<AET>/rs` with each instance's AET equal to its name
   (`XRAYPACS`, `CTPACS`, `ANGIOPACS`, `USPACS`). If an instance instead uses the
   default `DCM4CHEE` AET (or a different base path), edit that data source's
   `qidoRoot` / `wadoRoot` / `wadoUriRoot` in `app-config.js` and rebuild.

Quick check of a single PACS from any machine that can reach it:
```bash
curl -k "https://<PACS_HOST>:8443/dcm4chee-arc/aets/XRAYPACS/rs/studies?limit=1"
```
`200` + JSON ⇒ path/scheme are right. `401/403` ⇒ auth is required (see below).
`404` ⇒ wrong AET/base path. Connection refused/SSL error ⇒ wrong port/scheme.

## Cloudflare tunnel

Same-origin design means the tunnel needs no special handling — just point it at
this proxy. Two options:

- **Tunnel on the host (recommended):** in Cloudflare Zero Trust, route your
  public hostname to `http://localhost:<HTTP_PORT>` (e.g. `http://localhost:80`).
  cloudflared terminates TLS publicly; the origin stays plain HTTP.
- **Tunnel in-stack:** uncomment the `cloudflared` service in
  `docker-compose.yml`, put your token in `.env` (`CLOUDFLARE_TUNNEL_TOKEN=…`),
  and route the public hostname to `http://proxy:80`.

The `ssl/` folder (Cloudflare Origin cert/key + Origin-Pull CA) is **not needed**
for the tunnel path and is left untouched. It's only relevant if you later
expose nginx directly over HTTPS (orange-cloud proxied DNS instead of a tunnel).

## "No auth"

- **Viewer:** no login — the OIDC block is removed from `app-config.js`.
- **PACS:** the proxy sends no credentials. If a PACS returns `401/403`, that
  AET's DICOMweb still enforces auth. Either open it to unauthenticated read on
  the dcm4chee side, or uncomment the `proxy_set_header Authorization "Bearer …"`
  line in `nginx/default.conf.template` (note: Keycloak tokens expire).

## Troubleshooting

- **Studies list is empty / network errors** → run the `curl` check above; fix
  `PACS_SCHEME`, the port, or the AET path per the two confirm-items.
- **Thumbnails load but images/frames don't** → a PACS may return **absolute**
  BulkDataURIs pointing straight at `:8443` (a different origin). `app-config.js`
  already sets `bulkDataURI.relativeResolution: 'studies'` to force same-origin
  resolution; if a server still emits absolute URLs, configure dcm4chee to return
  relative WADO URLs.
- **nginx won't start / can't resolve `ohif`** → `docker compose up -d ohif`
  first, then `docker compose up -d proxy`.
- **Logs:** `docker compose logs -f proxy` and `docker compose logs -f ohif`.
- **See the rendered nginx config:**
  `docker compose exec proxy cat /etc/nginx/conf.d/default.conf`.
