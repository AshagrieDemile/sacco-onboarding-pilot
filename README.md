# LiFT SACCO Onboarding — Mini App (Controlled Technical Pilot)

**This repository is a deployment artifact only.** It contains the compiled, secret-free static
frontend of the LiFT SACCO onboarding Mini App, served over GitHub Pages for a controlled
technical pilot.

> **CONTROLLED TECHNICAL PILOT — NOT REAL MEMBER REGISTRATION.**
> This pilot is connected to a **staging** onboarding API and uses a clearly-labelled **TEST
> OTP shown on screen — not a real SMS.** Completing the form does **not** create an
> authoritative SACCO membership record. It is for usability, language (English/Amharic),
> device, and workflow testing.

## Status

- **Frontend:** GitHub Pages — `https://ashagriedemile.github.io/sacco-onboarding-pilot/`
- **API:** controlled **staging** pilot API over HTTPS (test OTP; no real SMS).
- **Persistence:** the pilot uses ephemeral server state — a restart may discard test
  submissions. Records are **not** authoritative membership data.

## What this is / is not

- **Is:** a compiled static build (HTML/CSS/JS) served via GitHub Pages, talking to a controlled
  staging API.
- **Is not:** source code, and not a source of truth. The application is developed in a
  **private** repository and deliberately exported here as a build artifact.

## Live URL

`https://ashagriedemile.github.io/sacco-onboarding-pilot/`
