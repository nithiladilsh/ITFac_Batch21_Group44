# 🐞 Group 44 - BugBusters
**IS3440 Test Automation Assignment**

## 👥 Team Members
* **214133E** - Mendis B.N.D
* **215023B** - Danthanarayana S.
* **215131E** - Dissanayake A S H
* **215108P** - Samaraweera P.K.L.P
* **215107L** - Samarasinghe SATLT

---

## 📖 Project Overview
This repository contains the test automation artifacts for the **IS3440 Group Assignment**.
The objective is to design, implement, and execute automated tests for the **QA Training App** using:
1.  **UI Automation:** Cypress + Cucumber (BDD)
2.  **API Automation:** Java + RestAssured

## 📂 Repository Structure
* **`ui-automation/`**: Cypress source code, feature files, and step definitions.
* **`api-automation/`**: Java/Maven source code for API testing.
* **`Test Case Document/`**: Manual test case documentation.
* **`Defect Report/`**: Detailed bug reports.

---

## 🚀 Prerequisites (Before You Start)
Ensure the following are installed on your machine:
* **Node.js (LTS Version):** Required for Cypress.
* **Java JDK 21+:** Required for API tests and running the app.
* **Maven:** Required for API dependency management.
* **MySQL Server (v8.0):** Running on port `3306`.

### ⚡ Step 1: Start the Application Under Test
The automation will fail if the app is not running locally.

1.  **Database:** Create a database named `qa_training` in MySQL:
    ```sql
    CREATE DATABASE qa_training;
    ```
2.  **Launch App:** Navigate to where your JAR file is saved and run:
    ```bash
    java -jar qa-training-app.jar
    ```
3.  **Verify:** Open your browser and ensure the login page loads at:
    👉 **http://localhost:8080/ui**

---

## 🛠️ Setup Instructions for Team

### 1. Clone the Repository
```bash
git clone [https://github.com/nithiladilsh/ITFac_Batch21_Group44.git](https://github.com/nithiladilsh/ITFac_Batch21_Group44.git)
cd ITFac_Batch21_Group44