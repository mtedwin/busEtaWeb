# HK Bus Real-Time ETA Web Application (`busEtaWeb`)

A lightweight, responsive web application designed to fetch, parse, and display real-time Estimated Time of Arrival (ETA) data for franchised bus routes in Hong Kong. This project leverages official open data portals to provide commuters with instant transit updates through a streamlined user interface.

## 🚀 Key Features
* **Real-Time Data Integration:** Connects directly to local public transit open APIs (Data.gov.hk) to fetch live route schedules and stop coordinates.
* **Smart Route Filtering:** Enables users to search by bus company (KMB, Citybus, etc.), route number, and direction.
* **Responsive Frontend UI:** Optimized for both desktop and mobile viewing, ensuring smooth rendering for users on the move.
* **Optimized API Handling:** Built with efficient backend/client logic to handle rate limits, manage JSON payloads, and minimize data overhead.

## 🛠️ Technology Stack
* **Frontend:** HTML5, CSS3 (Responsive Design), JavaScript (ES6+)
* **Backend/Data Layer:** Python / Fetch API (Asynchronous API handling)
* **Data Source:** GovHK Open Data (Data.gov.hk API)

## 📦 Project Structure & Setup

### 1. Installation & Environment Setup
Clone the repository to your local server or environment:
```bash
git clone [https://github.com/mtedwin/busEtaWeb.git](https://github.com/mtedwin/busEtaWeb.git)
cd busEtaWeb
