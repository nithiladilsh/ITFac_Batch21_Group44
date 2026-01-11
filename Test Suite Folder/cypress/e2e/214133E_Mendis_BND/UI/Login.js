import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import loginPage from "../../../pages/LoginPage"; // Import the class you just made

Given("I open the login page", () => {
  loginPage.visit();
});

When("I enter valid credentials", () => {
  loginPage.enterUsername("admin");
  loginPage.enterPassword("admin123");
  loginPage.clickLogin();
});

Then("I should see the dashboard", () => {
  loginPage.verifyDashboard();
});