#!/bin/bash
# Publish the Astro docs site to S3 + CloudFront.
#
# Order matters. Astro emits content-hashed assets under `_astro/` (e.g.
# `common.BSjAWvTL.css`). A naive `aws s3 sync --delete` can remove an old
# hash while CloudFront is still serving HTML that points at it → CSS 404 →
# fully unstyled page. Publish new hashes first, swap HTML second, invalidate
# third, and never delete `_astro/` objects in the same deploy.

set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET is required}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID is required}"

npm run astro:build

# 1) New hashed assets only — additive. Old hashes stay until orphaned forever
#    (cheap) so any still-cached HTML keeps working during CDN catch-up.
aws s3 sync docs-site/_astro/ "s3://${S3_BUCKET}/_astro/" \
  --cache-control "public,max-age=31536000,immutable"

# 2) HTML + everything else. `--delete` may drop removed pages, but never
#    touches `_astro/` (excluded), so stylesheet hashes are not yanked.
aws s3 sync docs-site/ "s3://${S3_BUCKET}/" \
  --exclude "_astro/*" \
  --delete \
  --cache-control "public,max-age=60,must-revalidate"

# 3) Drop stale HTML from edges. Assets are immutable + still present, so a
#    slow invalidation cannot recreate the unstyled-page failure mode.
aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/*"
