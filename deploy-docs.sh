#!/bin/bash

set -euo pipefail

: "${S3_BUCKET:?S3_BUCKET is required}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID is required}"

npm run astro:build

aws s3 sync docs-site/ "s3://${S3_BUCKET}" --delete

aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"
