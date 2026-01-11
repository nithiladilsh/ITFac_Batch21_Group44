# Group 44 - BugBusters

## Team Members
214133E Mendis B.N.D
215023B Danthanarayana S.
215131E Dissanayake A S H
215108P Samaraweera P.K.L.P
215107L Samarasinghe SATLT

---

## Project Overview
This repository contains the test automation artifacts for the **IS3440 Group Assignment**.
The objective is to design, implement, and execute automated tests for the **QA Training App** using UI and API automation techniques.

## Tech Stack
* **Framework:** Cypress
* **Approach:** Behavior-Driven Development (BDD) using Cucumber
* **Language:** JavaScript/Node.js

## Repository Structure
This project follows the strict folder structure required by the assignment guidelines:

* **`Test Suite Folder/`**: Contains the Cypress source code, feature files, and step definitions.
* **`Test Case Document/`**: Stores the manual test case documentation.
* **`Defect Report/`**: Stores the detailed bug reports.

---

## 🚀 Setup Instructions

### 1. Prerequisites (Application Under Test)
Before running automation, the QA Training App must be running locally.
* **Java:** JDK 21 or compatible version.
* **Database:** MySQL 8.0 running on port 3306.
* **Setup Steps:**
    1. Create a database named `qa_training` in MySQL (`CREATE DATABASE qa_training;`).
    2. Run the provided JAR file: `java -jar qa-training-app.jar`.
    3. Ensure the app is accessible at `http://localhost:8080`.

### 2. Clone the Repository
```bash
git clone [https://github.com/nithiladilsh/IS3440-Group44_BugBusters.git](https://github.com/nithiladilsh/IS3440-Group44_BugBusters.git)
cd IS3440-Group44_BugBusters

## Setup Instructions for Team Members

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/IS3440-Group44.git](https://github.com/YOUR_USERNAME/IS3440-Group44.git)
    cd IS3440-Group44
    ```

2.  **Install Dependencies**
    You must navigate to the test suite folder before installing dependencies.
    ```bash
    cd "Test Suite Folder"
    npm install
    ```

3.  **Run the Tests**
    * **Open Test Runner:** `npx cypress open`
    * **Run Headless:** `npx cypress run`

## Development Guidelines
* **Branching:** Do not push directly to `main`. Create a feature branch for your test cases (e.g., `feature/student-name-admin-tests`).
* **Test Locations:**
    * Admin Tests: `cypress/e2e/Admin/*.feature`
    * User Tests: `cypress/e2e/User/*.feature`