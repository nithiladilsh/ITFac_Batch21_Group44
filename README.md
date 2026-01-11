# IS3440 - IT Quality Assurance (Group 44)

## Project Overview
[cite_start]This repository contains the test automation artifacts for the **IS3440 Group Assignment**[cite: 274]. [cite_start]The objective is to design, implement, and execute automated tests for the **QA Training App** using UI and API automation techniques[cite: 280, 285].

## Tech Stack
* [cite_start]**Framework:** Cypress [cite: 296]
* [cite_start]**Approach:** Behavior-Driven Development (BDD) using Cucumber [cite: 313]
* **Language:** JavaScript/Node.js

## Repository Structure
[cite_start]This project follows the strict folder structure required by the assignment guidelines[cite: 305]:

* [cite_start]**Test Suite Folder/**: Contains the Cypress source code, feature files, and step definitions[cite: 307].
* [cite_start]**Test Case Document/**: Stores the manual test case documentation[cite: 308].
* [cite_start]**Defect Report/**: Stores the detailed bug reports[cite: 310].

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