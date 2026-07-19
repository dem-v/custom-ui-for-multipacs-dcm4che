# OHIF Viewer (v3) with our multi-PACS, no-auth config baked in.
#
# OHIF_TAG selects the base image (set in .env / compose build args):
#   latest-beta -> v3.13 beta line (current default; better study-list behaviour)
#   latest      -> latest stable v3
# NOTE: use `ohif/app` (v3). The old `ohif/viewer:latest` elsewhere in this repo
# is the legacy v2 build from 2023 — do not use it.
ARG OHIF_TAG=latest-beta
FROM ohif/app:${OHIF_TAG}

# OHIF's own nginx serves the SPA from this directory; index.html loads
# /app-config.js at runtime, so baking the file here is all that's needed.
COPY app-config.js /usr/share/nginx/html/app-config.js
