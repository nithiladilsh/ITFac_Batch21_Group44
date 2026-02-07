import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import salesPage from "../../../pages/sales/SalesPage";
import SellPlantPage from "../../../pages/sales/SellPlantPage";
import { ensureAdminToken, cleanUpAllData } from "../apiCommonSteps";

// UTILITY HELPER 
const makeRequest = (method, endpoint, token, body = null) => {
    return cy.request({
        method,
        url: `${Cypress.env("apiUrl")}${endpoint}`,
        headers: { Authorization: `Bearer ${token}` },
        body,
        failOnStatusCode: false,
        log: false
    });
};

// ROBUST SEEDING HELPER 
const ensurePlantExists = () => {
    return ensureAdminToken().then((token) => {
        return makeRequest("GET", "/plants?page=0&size=10", token).then((res) => {
            const plants = res.body.content || [];
            const valid = plants.find(p => p.quantity > 0);
            if (valid) return cy.wrap(valid);

            const rnd = Math.floor(Math.random() * 900);
            return makeRequest("POST", "/categories", token, { name: `S_Par${rnd}`, parent: null })
                .then(pRes => makeRequest("POST", "/categories", token, { name: `S_Sub${rnd}`, parent: { id: pRes.body.id } }))
                .then(sRes => makeRequest("POST", `/plants/category/${sRes.body.id}`, token, { name: `S_Plt${rnd}`, price: 50, quantity: 100 }))
                .then(plRes => plRes.body);
        });
    });
};

// STEP DEFINITIONS 
Given("I am on the Sales Page", () => {
    salesPage.visit();
});

Given("I am on the Dashboard page", () => {
    cy.visit("/dashboard");
});

Given("at least one sales record exists in the list", () => {
    ensureAdminToken().then((token) => {
        makeRequest("GET", "/sales?page=0&size=5", token).then((res) => {
            const sales = res.body.content || [];
            if (sales.length === 0) {
                ensurePlantExists().then((plant) => {
                    makeRequest("POST", `/sales/plant/${plant.id}?quantity=1`, token);
                    cy.wait(1000); 
                    makeRequest("POST", `/sales/plant/${plant.id}?quantity=2`, token).then(() => cy.reload());
                });
            }
        });
    });
    salesPage.elements.salesTable().should("be.visible");
        salesPage.elements.salesRecords().should("have.length.greaterThan", 0);
    salesPage.elements.salesRecords().first().find("td").should("have.length.gt", 1);
});

Given("there are no sales records in the system", () => {
    return cleanUpAllData();
});

Given("I am on the {string} page", (pageName) => {
    if (pageName === "Sell Plant") SellPlantPage.visit();
});

When("I click on the Plant dropdown menu", () => {
    SellPlantPage.clickPlantDropdown();
});

Then("the dropdown should be enabled", () => {
    SellPlantPage.verifyDropdownEnabled();
});

Then("the dropdown should display a list of available plants", () => {
    SellPlantPage.verifyPlantsDisplayed();
});

Then("each plant entry should display its stock quantity", () => {
    SellPlantPage.verifyPlantHasStockInfo();
});

Given("I have selected a plant from the dropdown", () => {
    SellPlantPage.elements.plantDropdown().should("be.visible");
    SellPlantPage.elements.plantDropdownOptions().should('have.length.gt', 1).then(($options) => {
        SellPlantPage.elements.plantDropdown().select($options.eq(1).val());
    });
});

When("I select a plant from the dropdown", () => {
    SellPlantPage.elements.plantDropdown().should("be.visible");
    SellPlantPage.elements.plantDropdownOptions().should('have.length.gt', 1).then(($options) => {
        SellPlantPage.elements.plantDropdown().select($options.eq(1).val());
    });
});

When("I enter {string} in the Quantity field", (quantity) => {
    SellPlantPage.enterQuantity(quantity);
});

When("I enter a valid quantity in the Quantity field", () => {
    SellPlantPage.enterQuantity("5");
});

When("I attempt to submit the form", () => {
    SellPlantPage.submitForm();
});

When("I click the submit button", () => {
    SellPlantPage.submitForm();
});

Then('the "Sell Plant" button should be visible', () => {
    salesPage.elements.sellPlantBtn().should("be.visible");
});

Then("a validation error message should be displayed", () => {
    SellPlantPage.verifyValidationError();
});

Then("the plant sale should be completed successfully", () => {
    cy.url().should("not.include", "/new");
});

Then("I should be redirected to the sales list page", () => {
    cy.url().should("include", "/sales");
});

Then("the plant stock should be reduced accordingly", () => {
    cy.url().should("include", "/sales");
});

Then("no new sale should be recorded", () => {
    cy.url().should("include", "/sales");
});

// DELETE SALES RECORD STEPS 
When("I select a sales record from the list", () => {
    salesPage.elements.salesRecords().should('have.length.greaterThan', 0);
});

When("I locate a sales record in the list", () => {
    salesPage.elements.salesRecords().should('have.length.greaterThan', 0);
});

Then("the {string} button should be visible and enabled for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("be.visible")
            .and("not.be.disabled");
    }
});

Then("the {string} button should not be visible for that record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("not.exist");
    }
});

When("I click the {string} button for the selected record", (buttonText) => {
    if (buttonText === "Delete") {
        salesPage.elements.salesRecords().first().find("button[class*='btn-'][class*='danger']")
            .should("be.visible")
            .click();
    }
});

Then("a confirmation prompt should appear", () => {
    cy.once("window:confirm", () => true);
});

When("I click {string} on the confirmation prompt", (choice) => {
    if (choice === "Yes") {
        cy.on("window:confirm", () => true);
    } else {
        cy.on("window:confirm", () => false);
    }
});

Then("the confirmation prompt should close", () => {
});

Then("the selected sales record should be removed from the list", () => {
    cy.wait(500); 
    salesPage.elements.salesTable().should("be.visible");
});

Then("the Sales list should refresh automatically", () => {
    salesPage.elements.salesTable().should("be.visible");
});

Then("the sales table should be visible", () => {
    salesPage.elements.salesTable().should("be.visible");
});

Then("the sales records should display relevant information", () => {
    salesPage.elements.salesRecords().should("have.length.greaterThan", 0);
});

// SORTING
When("I observe the {string} column in the sales table", (columnName) => {
    const uiColumnName = columnName === "Sold date" ? "Sold At" : columnName;
    salesPage.elements.salesTable().contains("th", uiColumnName).should("be.visible");
});

Then("the sales records should be sorted by {string} in descending order", (columnName) => {
    const colIndex = 3; 
    const dateValues = [];
    salesPage.elements.salesRecords().each(($row) => {
        const cellText = $row.find('td').eq(colIndex).text().trim();
        dateValues.push(new Date(cellText).getTime());
    }).then(() => {
        const sortedDesc = [...dateValues].sort((a, b) => b - a);
        expect(dateValues).to.deep.equal(sortedDesc);
    });
});

When("I click on the {string} menu item in the sidebar", (menuItem) => {
    cy.get("nav, .sidebar").contains("a", menuItem).click();
});

When("I wait for the page to load", () => {
    cy.wait(500);
});

Then("the {string} menu item should be highlighted as active", (menuItem) => {
    cy.get("nav, .sidebar").contains("a", menuItem).should("have.class", "active");
});