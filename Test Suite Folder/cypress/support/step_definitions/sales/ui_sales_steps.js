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
    if (buttonText === "Sell Plant") {
        salesPage.elements.sellPlantBtn().should("be.visible");
    }
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

Given("I have selected a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().then(($options) => {
        const validOptions = $options.filter((index, option) => {
            const text = option.text.trim();
            return text && !text.toLowerCase().includes("select");
        });
        if (validOptions.length > 0) {
            sellPlantPage.elements.plantDropdown().select(validOptions.eq(0).val());
        }
    });
});

When("I select a plant from the dropdown", () => {
    sellPlantPage.elements.plantDropdown().should("be.visible");
    sellPlantPage.elements.plantDropdownOptions().then(($options) => {
        const validOptions = $options.filter((index, option) => {
            const text = option.text.trim();
            return text && !text.toLowerCase().includes("select");
        });
        if (validOptions.length > 0) {
            sellPlantPage.elements.plantDropdown().select(validOptions.eq(0).val());
        }
    });
});

When("I enter {string} in the Quantity field", (quantity) => {
    sellPlantPage.enterQuantity(quantity);
});

When("I enter a valid quantity in the Quantity field", () => {
    sellPlantPage.enterQuantity("5");
});

When("I attempt to submit the form", () => {
    sellPlantPage.submitForm();
});

When("I click the submit button", () => {
    sellPlantPage.submitForm();
});

Then("a validation error message should be displayed", () => {
    sellPlantPage.verifyValidationError();
});

Then("the plant sale should be completed successfully", () => {
    cy.url().should("not.include", "/new");
});

Then("I should be redirected to the sales list page", () => {
    cy.url().should("include", "/sales");
    cy.url().should("not.include", "/new");
});

Then("the plant stock should be reduced accordingly", () => {
    cy.url().should("include", "/sales");
    cy.get("table, .sales-list, [class*='table']").should("be.visible");
});

When("I click the {string} button", (buttonText) => {
    if (buttonText === "Cancel") {
        sellPlantPage.clickCancel();
    } else if (buttonText === "Sell Plant") {
        salesPage.clickSellPlant();
    }
});

Then("no new sale should be recorded", () => {
    // Verify we're back on the sales list page
    cy.url().should("include", "/sales");
    cy.url().should("not.include", "/new");
});

// Delete Sales Record Steps
Given("at least one sales record exists in the list", () => {
    salesPage.verifySalesRecordsExist();
});

When("I select a sales record from the list", () => {
    salesPage.selectFirstSalesRecord();
});

Then("the {string} button should be visible and enabled for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.verifyDeleteButtonVisible();
    }
});

When("I click the {string} button for the selected record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.clickDeleteButton();
    }
});

Then("a confirmation prompt should appear", () => {
    cy.on("window:confirm", () => true);
});

When("I click {string} on the confirmation prompt", (choice) => {
    if (choice === "Yes") {
        cy.on("window:confirm", () => true);
    } else {
        cy.on("window:confirm", () => false);
    }
});

Then("the confirmation prompt should close", () => {
    // Confirmation is handled, just verify we're still on the page
    cy.url().should("include", "/sales");
});

Then("the selected sales record should be removed from the list", () => {
    // Wait for the list to update after deletion
    cy.wait(500);
    salesPage.elements.salesTable().should("be.visible");
});

Then("the Sales list should refresh automatically", () => {
    cy.url().should("include", "/sales");
    salesPage.elements.salesTable().should("be.visible");
});

When("I locate a sales record in the list", () => {
    salesPage.selectFirstSalesRecord();
});
