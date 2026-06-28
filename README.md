# Veros Typing Services (VTS) - Production Workflow Engine

A self-contained, lightweight Node.js local network application designed to automate workflow management, enforce role-based access control (RBAC), and eliminate manual pricing inaccuracies in a multi-station business environment.

## 🚀 The Business Problem & Solution
* **The Challenge:** Managing a high-volume multi-station printing, design, and typing hub via manual tracking led to production communication gaps and inconsistent multi-tier customer billing.
* **The Solution:** This bespoke central workflow engine binds to all local network interfaces (`0.0.0.0:3000`), allowing real-time order injection, proof submissions, managerial revisions, and fulfillment synchronization across multiple physical desktop terminals and mobile devices simultaneously.

---

## 🛠️ Tech Stack & Architecture Highlights
* **Backend:** Node.js (Vanilla `http` & `querystring` modules for a zero-dependency, ultra-lightweight footprint).
* **Database:** Local JSON file stream serialization (`fs` module) for persistent data storage.
* **Frontend:** Fully responsive HTML5 layout featuring native, embedded styling to remove external CDN internet dependencies, guaranteeing high-speed performance on local area network (LAN) connections.
* **Security:** Cookie-based session tracking implementing distinct **Role-Based Access Control (RBAC)** across four operational divisions:
  * `Intake`: Full order creation matrix with tier-calculated automation.
  * `Designer`: File sharing capabilities and creative proof tracking.
  * `Manager`: Live pipeline oversight with dynamic Reject/Approve capabilities.
  * `Printer`: Fulfillment queue cleanup upon absolute order completion.

---

## 📈 Embedded Business Logic (Pricing Matrix Engine)
The core architecture contains a programmatic pricing engine that entirely eliminates manual calculation errors by enforcing strict business rules:
* **Black & White Printing:** Tiered volume discounts (1-9 pages @ R5, 10-19 pages @ R4, 20+ pages @ R3).
* **Lamination:** Dynamic structural fee variants based on document scaling (A4 @ R20 vs. A3 @ R30).
* **ID Photos:** Scaled fixed package rates (1 Photo @ R30, 2 Photos @ R40, 4 Photos @ R60).
* **Digital Scan Engine:** Base administrative setup fee (R10) combined with a linear per-page cost execution (R5).

---

## ☁️ Future Cloud Architecture Roadmap (AWS Migration)
As part of my professional progression into **Cloud Engineering**, the next phase of this project will migrate from an on-premise LAN server to a robust cloud infrastructure setup on **Amazon Web Services (AWS)**:
1. **Compute Migration:** Host the Node.js runtime engine on an **AWS EC2 (Elastic Compute Cloud)** free-tier Linux instance.
2. **Network Security:** Implement **AWS Security Groups** to restrict incoming traffic and securely expose the operational web port `3000`.
3. **Storage Tiering:** Move local file uploads and digital proof storage away from local drives and into an **AWS S3 (Simple Storage Service)** bucket for durable, high-availability data backup.

---

## 💻 How to Run This Locally
1. Clone this repository or download `server.js`.
2. Ensure [Node.js](https://nodejs.org/) is installed on your machine.
3. Open a terminal/command prompt inside the directory and execute:
   ```bash
   node server.js
