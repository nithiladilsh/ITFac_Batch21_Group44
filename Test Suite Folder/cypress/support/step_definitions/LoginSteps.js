import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import loginPage from "../../pages/LoginPage";

// 1. BASIC NAVIGATION
Given("I am on the login page", () => {
  loginPage.visit();
});

// 2. LOGIN ACTIONS 
When("I enter valid admin credentials", () => {
  loginPage.submitLogin("admin", "admin123"); 
});

When("I enter {string} and {string}", (username, password) => {
  loginPage.submitLogin(username, password);
});

// Specific Login Button
When("I click the login button", () => {
  loginPage.elements.loginBtn().click();
});

// 3. ASSERTIONS
Then("I should be redirected to the Dashboard", () => {
  cy.url().should("include", "/dashboard"); 
});

Then("I should see an error message {string}", (message) => {
  loginPage.elements.globalError().should("contain", message);
});

// 4. REUSABLE BACKGROUND STEPS
Given("I am logged in as an Admin", () => {
  loginPage.visit();
  loginPage.submitLogin("admin", "admin123");
});

Given("I am logged in as a Standard User", () => {
  loginPage.visit();
  loginPage.submitLogin("testuser", "test123");
});

// 5. Logout Steps
Given("I log out", () => {
  cy.get('a.nav-link.text-danger[href="/ui/logout"]').click();
  cy.url().should("include", "/login");
});