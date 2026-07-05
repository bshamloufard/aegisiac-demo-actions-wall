# AegisIaC Actions Wall Demo

This repository is a live, intentionally small demo for AegisIaC.

It simulates a Terraform pull request gate:

- generate a Terraform plan JSON fixture
- redact sensitive values
- classify risk and cost with a local Aegis demo scanner
- publish a GitHub Actions job summary that looks like an approval wall
- upload the redacted plan and Aegis report as workflow artifacts
- deploy a static architecture review page from `site/`

The workflow is `.github/workflows/aegis-wall.yml`.

## Demo intent

This is not a real cloud deployment. It is a controlled fixture that makes the product behavior visible in GitHub Actions without requiring cloud credentials.
