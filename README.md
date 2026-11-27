# 🛡️ PrivyShield

**Detect. Understand. Sanitize. Verify. Your data stays yours.**

PrivyShield is an enterprise-grade, 100% client-side privacy protection, PII detection, validation, and sanitization platform. All document processing, pattern recognition, and checksum verifications execute purely inside browser memory and local Web Workers—**zero bytes of your sensitive data are ever transmitted to external servers or AI APIs**.

Featuring an interactive cyberpunk-themed **Three.js 3D visualization suite**, including an animated quantum cyber shield, holographic scanner reticles, cyber circuit matrices, and dynamic particle swarms.

---

## ✨ Key Features

### 🔍 1. Rigorous PII Detection & Checksum Validation
* **Credit Cards**: Luhn checksum validation with IIN/BIN card network identification (Visa, Mastercard, Amex, Discover, Diners Club, JCB).
* **Aadhaar Numbers**: Verhoeff checksum algorithm with Indian government format checks (UIDAI).
* **PAN Cards**: Structural regex with 4th character entity code validation (Individual, Company, Firm, Trust, etc.).
* **Phone Numbers**: Full E.164 and international format parsing via `libphonenumber-js`.
* **IP Addresses**: Strict IPv4 and IPv6 parsing, CIDR checks, and reserved range filtering via `ipaddr.js`.
* **Email Addresses**: RFC 5322 syntax validation, TLD verification, and suspicious domain checking.
* **Residual PII Scanner**: Post-sanitization safety verification scan to detect any potential leftover supported identifiers.

### 🎭 2. Three Flexible Redaction Modes
* **Full Masking**: Complete token replacement (e.g. `[REDACTED]`, `[CONFIDENTIAL_EMAIL]`).
* **Partial Masking**: Keeps non-identifying structural context (e.g. `v****@domain.com`, `•••• •••• •••• 1234`).
* **Consistent Pseudonymization**: Maps repeated entities to deterministic, context-preserving pseudonyms across entire documents (e.g. `EMAIL_01`, `PHONE_01`) using an in-memory namespaced Map.

### 🌐 3. Interactive 3D Cyber Visuals (Three.js)
* **3D Quantum Defense Shield**: Extruded cyber-glass shield with dual wireframes, a multifaceted rotating Quantum Core, and triple gyroscope orbital rings.
* **Cyber Defense Satellite Nodes**: 4 orbiting security orbs revolving on eccentric orbits.
* **Animated Cybersecurity Background**: Procedural holographic shields, encrypted binary padlocks, cyber circuit processors, radar reticles, and honeycomb barriers floating in 3D space.
* **Dynamic Mouse Parallax**: Camera and specular point lights follow cursor movement.

### 📊 4. Workspace & Enterprise Privacy Tools
* **Multi-format Support**: Paste text, or upload `.txt` and `.csv` files (parsed securely with `papaparse` and formula injection guards).
* **Detection Lab**: Interactive sandbox with labelled synthetic test cases, live scan beams, and automated Precision, Recall, and F1 score calculations.
* **Audit & Reports**: Complete session audit logs, category detection distribution charts, and exportable JSON & Markdown reports with zero raw PII logged.
* **Privacy Center**: Verified client-side architectural proof, live network zero-leakage tests, PWA offline cache status, and per-category redaction policies.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* `npm` or `pnpm`

### Installation
```bash
# Clone the repository
git clone https://github.com/vishalreddyn143-cyber/priveyshield.git
cd priveyshield

# Install dependencies
npm install
```

### Running Locally
```bash
# Start local development server with Vite
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### Running Tests
```bash
# Run unit tests with Vitest
npm test

# Run End-to-End browser tests with Playwright
npm run test:e2e
```

### Building for Production
```bash
# Typecheck and build optimized bundle
npm run build
```

---

## 🔒 Privacy & Security Guarantee

* **100% In-Memory Processing**: All document text, parse trees, and pseudonym mapping tables are held strictly in volatile RAM.
* **Zero Network Uploads**: Verified by the built-in Network Privacy Test tool.
* **Safe Exports**: Audit reports and logs strictly omit original text and raw PII.
* **XSS & Formula Injection Guard**: CSV cells starting with `=`, `+`, `-`, or `@` are automatically escaped with single quotes.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
* **3D Graphics**: Three.js
* **Parsers & Engines**: Papa Parse, libphonenumber-js, ipaddr.js
* **Build & Dev**: Vite
* **Testing**: Vitest, React Testing Library, Playwright E2E

---

## 📄 License

MIT License. Designed and built with privacy-first principles.
