Veros Typing Services (VTS) - Production Workflow Engine
This is a self-contained, lightweight Node.js local network application designed to automate workflow management, enforce role-based access control, and eliminate manual pricing inaccuracies in a business environment.

The Business Problem and Solution
The challenge of managing a high-volume printing, design, and typing hub via manual tracking led to production communication gaps and inconsistent multi-tier customer billing.

The solution is this workflow engine, which binds to all local network interfaces. It allows for real-time order injection, proof submissions, managerial revisions, and fulfillment synchronization across multiple physical desktop terminals and mobile devices simultaneously.

Technical Architecture
Backend: Node.js using vanilla http and querystring modules for a zero-dependency footprint.

Database: Local JSON file stream serialization for persistent data storage.

Frontend: Responsive HTML5 layout with native embedded styling to remove external dependencies, ensuring high-speed performance on local area network connections.

Security: Cookie-based session tracking implementing Role-Based Access Control (RBAC) across four operational divisions:

Intake: Order creation with automated pricing.

Designer: Proof submission and tracking.

Manager: Pipeline oversight with revision capabilities.

Printer: Fulfillment queue management.

Pricing Logic
The core architecture includes a programmatic pricing engine that minimizes manual errors by enforcing consistent business rules for:

Black and White Printing: Tiered volume discounts.

Lamination: Dynamic fee variants based on document size.

ID Photos: Scaled fixed package rates.

Scanning: Base administrative fees combined with per-page costs.

Future Cloud Architecture Roadmap
As I progress in Cloud Engineering, the next phase of this project involves migrating from an on-premise network to an AWS infrastructure:

Compute Migration: Host the Node.js runtime on an AWS EC2 Linux instance.

Network Security: Configure AWS Security Groups to securely manage traffic.

Storage: Migrate proof storage to an AWS S3 bucket for high-availability data management.

How to Run Locally
Clone this repository.

Ensure Node.js is installed on your machine.

Open a terminal in the directory and execute: node server.js

Navigate to http://localhost:3000 in your web browser.
