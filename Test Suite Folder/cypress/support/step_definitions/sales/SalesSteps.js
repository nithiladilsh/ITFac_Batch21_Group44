import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import salesPage from "../../../pages/sales/SalesPage";
import sellPlantPage from "../../../pages/sales/SellPlantPage";

Given("I am on the Sales Page", () => {
    salesPage.visit();
});

Given("I am on the {string} page", (pageName) => {
    if (pageName === "Sell Plant") {
        sellPlantPage.visit();
    }
});

Then("the {string} button should be visible", (buttonText) => {
    salesPage.elements.sellPlantBtn().should("be.visible");
});

When("I click the {string} button", (buttonText) => {
    salesPage.clickSellPlant();
});

Then("I should be redirected to {string}", (url) => {
    cy.url().should("include", url);
});

// Plant Dropdown Steps
When("I click on the Plant dropdown menu", () => {
    sellPlantPage.clickPlantDropdown();
});

Then("the dropdown should be enabled", () => {
    sellPlantPage.verifyDropdownEnabled();
});

Then("the dropdown should display a list of available plants", () => {
    sellPlantPage.verifyPlantsDisplayed();
});

Then("each plant entry should display its stock quantity", () => {
    sellPlantPage.verifyPlantHasStockInfo();
});
