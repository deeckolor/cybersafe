# CyberSafe Training Suite: A Girls in ICT Day Initiative · DICT Region IV-A

CyberSafe is an interactive, browser-based cybersecurity awareness training platform built for the 2026 Girls in ICT Day celebration. Designed for participants with no technical background, it teaches real-world digital defense skills through hands-on simulations — not lectures.
The suite consists of four self-contained modules that players complete at their own pace. Each module presents realistic attack scenarios drawn from actual cybercrime techniques documented by the ITU, DICT, and global cybersecurity agencies, and challenges participants to make decisions the way they would in real life.
PhishGuard trains participants to identify phishing emails and SMS attacks across four escalating difficulty levels — from obvious advance-fee scams to near-pixel-perfect domain spoofing attacks that fool even experienced professionals. Players earn XP, maintain streaks, and unlock badges as they build the habit of reading sender domains, spotting urgency manipulation, and questioning unsolicited requests.
Password Arena puts participants in front of a live password strength analyzer that calculates crack time in real time using entropy mathematics and simulates a modern GPU cracking cluster running ten billion guesses per second. Five progressive challenges guide players from basic complexity rules through to passphrases — the most practical strong-password strategy for everyday users.
Safe Browsing Challenge presents twelve fully rendered browser mock-ups — complete with address bars, SSL padlock indicators, and realistic page content — and asks players to judge each site as safe or unsafe. The module specifically addresses one of the most dangerous misconceptions in digital literacy: that the HTTPS padlock means a website is trustworthy. It also covers subdomain spoofing, typosquatting, and the Philippine government's exclusive use of the .gov.ph domain.
MFA Attack Simulator walks participants through five real multi-factor authentication attack scenarios, including push fatigue bombing, OTP social engineering over phone calls, SIM swap attacks, and real-time relay proxies that defeat TOTP codes within their thirty-second windows. Participants interact with animated phone screens, SMS conversations, and branching decision points, learning not just that MFA can be bypassed but exactly how — and what defenses actually work.
All modules feed into a unified hub with a combined leaderboard backed by Cloudflare KV, so scores persist across the event and participants can see where they rank against everyone in the room in real time.

## Setup

Built with: React · Vite · Cloudflare Workers · Cloudflare KV
Deployed on: Cloudflare Pages
Target audience: Women and girls in technology, general public, non-technical participants
Languages: English (Filipino localization-ready)
Duration: Approximately 45–90 minutes to complete all four modules

## CyberSafe for Girls in ICT Day

CyberSafe was developed to support the ITU's Girls in ICT Day mission of empowering women and girls to pursue careers in technology — and to ensure that every woman who enters the digital world does so equipped to protect herself in it.
