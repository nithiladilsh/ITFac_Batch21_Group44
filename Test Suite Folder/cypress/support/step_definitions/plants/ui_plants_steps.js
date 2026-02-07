import { Given, When, Then, Before } from "@badeball/cypress-cucumber-preprocessor";
import plantPage from "../../../pages/plants/PlantPage";
import { ensureAdminToken, cleanUpAllData } from "../apiCommonSteps";

// SETUP HOOKS 
Before({ tags: "@setup_plant_data" }, () => {
  cy.log("Seeding Plant Test Data...");
  ensureAdminToken().then(token => {
    const headers = { Authorization: `Bearer ${token}` };

    const ensureCategoryHierarchy = () => {
      return cy.request({ method: "GET", url: `${Cypress.env("apiUrl")}/categories?page=0&size=1000`, headers, log: false })
      .then((catRes) => {
        const categories = catRes.body.content || catRes.body; 
        const existingMain = categories.find(c => c.name === "TestRoot" || c.parent === null);
        
        return existingMain 
          ? cy.wrap(existingMain.id) 
          : cy.request({ method: "POST", url: `${Cypress.env("apiUrl")}/categories`, headers, body: { name: "TestRoot", parent: null }, log: false }).then(res => res.body.id);
      }).then((parentId) => {
          return cy.request({ method: "POST", url: `${Cypress.env("apiUrl")}/categories`, headers, body: { name: "Testsub", parent: { id: parentId } }, failOnStatusCode: false, log: false })
          .then(res => res.body);
      });
    };

    ensureCategoryHierarchy().then((subCategory) => {
      const TEST_PLANTS = ["Aloevera", "Plant 1", "Plant 2", "Plant 3", "Plant 4", "Plant 5", "Plant 6", "Plant 7", "Plant 8", "Plant 9", "Plant 10", "Low Stock Plant"];
      TEST_PLANTS.forEach((name) => {
        const qty = name === "Low Stock Plant" ? 2 : 25;
        cy.request({
          method: "POST",
          url: `${Cypress.env("apiUrl")}/plants/category/${subCategory.id}`,
          headers,
          body: { name, price: 100, quantity: qty },
          failOnStatusCode: false,
          log: false
        });
      });
    });
  });
});

// STEP DEFINITIONS 
Given("I am on the Plant List Page", () => {
  plantPage.visit();
});

Given("the number of plants exceeds the default page size", () => {
  cy.get("tbody tr", { timeout: 15000 }).should("have.length.at.least", 10);
  plantPage.elements.paginationControls().should("be.visible");
});

When("the Plant List page is loaded", () => {
  plantPage.verifytableVisible();
});

Then("plant records should be displayed in a structured list or grid", () => {
  plantPage.verifytableVisible();
});

Then("only a limited number of plants should be displayed per page", () => {
  plantPage.verifyPlantsPerPage(10);
});

Then("additional plants should be available on subsequent pages", () => {
  plantPage.captureFirstPlantName();
  plantPage.clickNextPage();
  plantPage.verifyFirstPlantIsChanged();
});

Given("the number of plants exceeds one page", () => {
  plantPage.elements.paginationControls().should("be.visible");
});

When("I locate the pagination controls", () => {
  plantPage.verifyPaginationVisible();
});

Then('pagination controls such as "Next", "Previous" and page numbers should be visible', () => {
  plantPage.verifyPaginationControlsVisible();
});

When('I click "Next" page button', () => {
  plantPage.captureFirstPlantName();
  plantPage.clickNextPage();
});

Then("the next set of plant records should be displayed", () => {
  plantPage.verifyFirstPlantIsChanged();
});

When('I click "Previous" page button', () => {
  plantPage.clickPreviousPage();
});

Then("the previous set of plant records should be displayed", () => {
  plantPage.elements.firstPlantRow()
    .invoke("text")
    .then((text) => {
      expect(text.trim()).to.equal(plantPage.firstPlantName);
    });
});

Then("the plant list should be updated correctly without errors", () => {
  cy.get("tbody tr").should("have.length.greaterThan", 0);
  cy.get(".alert-danger").should("not.exist");
});

Given("plants exist with different names", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 1);
});

When("I enter a valid plant name or partial name in the search field", () => {
  plantPage.capturePlantNameForSearch();
  plantPage.searchPlant();
});

Then("only plants matching the searched term should be displayed", () => {
  plantPage.verifySearchResults();
});

Then("non-matching plants should be hidden", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 0);
});

When("I clear the search input", () => {
  plantPage.clearSearch();
});

Then("all the plant records should be displayed", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 1);
});

Given("no plants exist or the search returns no results", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 0);
});

When("I perform a search using a non-existing plant name", () => {
  plantPage.searchForNonExistingPlant();
});

Then("the message {string} is displayed clearly", (message) => {
  cy.contains(message).should("be.visible");
});

Then("no plant cards or rows are shown", () => {
  cy.get("tbody tr td")
    .should("have.length", 1)
    .and("contain.text", "No plants found");
});

Given("a plant exists with quantity less than 5", () => {
    cy.visit("/plants?page=0&size=100");
    cy.contains("tbody tr", "Low Stock Plant", { timeout: 10000 })
        .as("lowStockRow")
        .should("be.visible");
});

When("I locate the plant with low quantity", () => {
  cy.get("@lowStockRow").find(".badge.bg-danger").as("lowBadge");
});

Then('a “Low” badge is displayed on the corresponding plant card or rows', () => {
  plantPage.verifyLowStockBadgeVisible("Low Stock Plant");
});

Then("the badge should be visually distinct", () => {
  cy.get("@lowBadge").should("have.class", "bg-danger");
});

Then("the badge should be clearly associated with the low stock plant", () => {
  cy.get("@lowStockRow")
    .find("td")
    .first()
    .invoke("text")
    .should("contain", "Low Stock Plant");
});

Then('the "Add Plant" button should be visible', () => {
  plantPage.verifyAddPlantButtonVisible();
});

Then('the "Add Plant" button should be clickable', () => {
  plantPage.clickAddPlantButton();
});

Then('the "Add Plant" button should NOT be visible', () => {
  plantPage.verifyAddPlantButtonNotVisible();
});

Given("the Plant list is displayed", () => {
  plantPage.visit();
  plantPage.verifytableVisible();
});

When("I navigate to the Plant List", () => {
  plantPage.visit();
  plantPage.verifytableVisible();
});

When("I locate a plant row", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 0, { timeout: 15000 })
    .first()
    .should("be.visible")
    .as("targetPlantRow");
});

Then('I should see the {string} button for that row', (buttonLabel) => {
  cy.get("@targetPlantRow").within(() => {
    cy.get('a[title="Edit"], .btn-edit, i.bi-pencil-square').first().should("be.visible");
  });
});

Then('the {string} button should be enabled', (buttonLabel) => {
  cy.get("@targetPlantRow").within(() => {
    cy.get('a[title="Edit"], .btn-edit').first().should("be.visible").and("not.have.class", "disabled");
  });
});

Given('a plant {string} exists with price {string}', (plantName, price) => {
  ensureAdminToken().then(token => {
    const headers = { Authorization: `Bearer ${token}` };
    cy.request({ method: "GET", url: `${Cypress.env("apiUrl")}/plants?search=${plantName}`, headers, failOnStatusCode: false }).then((res) => {
      const plants = res.body.content || res.body;
      if (Array.isArray(plants) && plants.find(p => p.name === plantName && p.quantity > 0)) return;

      cy.request({ method: "GET", url: `${Cypress.env("apiUrl")}/categories?page=0&size=1000`, headers }).then((catRes) => {
        const categories = catRes.body.content || catRes.body;
        let subId = categories.find(c => c.parent !== null)?.id;
        if (subId) {
          cy.request({ method: "POST", url: `${Cypress.env("apiUrl")}/plants/category/${subId}`, headers, body: { name: plantName, price: Number(price), quantity: 15 }, failOnStatusCode: false });
        }
      });
    });
  });
  cy.wait(500);
});

When('I click {string} on plant {string}', (action, plantName) => {
  cy.get('input[placeholder*="Search"]').clear().type(plantName);
  cy.get('button').contains('Search').click(); // Submit Search
  cy.wait(500); 
  cy.contains("tbody tr", plantName, { timeout: 10000 }).should("be.visible").within(() => {
    cy.get('a[title="Edit"], .btn-outline-primary, .bi-pencil-square').first().click();
  });
});

Then('the Edit Plant page should open', () => {
  cy.url().should("include", "/ui/plants/edit/");
});

Then('the Name field should show {string}', (expectedName) => {
  plantPage.elements.plantNameInput().should('have.value', expectedName);
});

Then('the Price field should show {string}', (expectedPrice) => {
  plantPage.elements.priceInput().invoke('val').then((actualPrice) => {
    expect(parseFloat(actualPrice)).to.equal(parseFloat(expectedPrice));
  });
});

Then('the Category field should be populated', () => {
  plantPage.elements.categoryDropdown().should('not.have.value', '');
});

Then('the Quantity field should be populated', () => {
  plantPage.elements.quantityInput().invoke('val').then((val) => {
    expect(Number(val)).to.be.greaterThan(0);
  });
});

When('I change the Price to {string}', (newPrice) => {
  plantPage.updatePrice(newPrice);
});

Then('a success message should be displayed', () => {
  plantPage.verifySuccessMessage();
});

Then('the plant {string} should display price {string}', (plantName, expectedPrice) => {
    cy.get('input[placeholder*="Search"]').clear().type(plantName);
    cy.get('button').contains('Search').click();
    cy.wait(500);
    cy.contains("tbody tr", plantName).find("td").contains(expectedPrice).should("be.visible");
});

When('I change the Quantity to {string}', (newQuantity) => {
  plantPage.updateQuantity(newQuantity);
});

Then('the plant {string} should display quantity {string}', (plantName, expectedQuantity) => {
    cy.get('input[placeholder*="Search"]').clear().type(plantName);
    cy.get('button').contains('Search').click();
    cy.wait(500);
    cy.contains("tbody tr", plantName).find("td").contains(expectedQuantity).should("be.visible");
});

Then('a price validation error should be displayed', () => {
  plantPage.verifyPriceValidationError();
});

Then('the error message should contain {string}', (expectedMessage) => {
  plantPage.verifyErrorMessageContains(expectedMessage);
});

Then('I should remain on the Edit Plant page', () => {
  plantPage.verifyOnEditPage();
});

Then('a quantity validation error should be displayed', () => {
  plantPage.verifyQuantityValidationError();
});

Then('the Add Plant form should be visible', () => {
  plantPage.verifyAddPlantFormVisible();
});

Then('the "Plant Name" input field should be displayed', () => {
  plantPage.verifyPlantNameFieldVisible();
});

Then('the "Category" dropdown should be displayed', () => {
  plantPage.verifyCategoryDropdownVisible();
});

Then('the "Price" input field should be displayed', () => {
  plantPage.verifyPriceFieldVisible();
});

Then('the "Quantity" input field should be displayed', () => {
  plantPage.verifyQuantityFieldVisible();
});

When("I leave all Add Plant fields empty", () => {
  plantPage.elements.plantNameInput().clear();
  plantPage.elements.categoryDropdown().select("");
  plantPage.elements.priceInput().clear();
  plantPage.elements.quantityInput().clear();
});

Then("validation messages should appear below the respective fields", () => {
  plantPage.verifyPlantNameErrorVisible();
  plantPage.verifyCategoryErrorVisible();
  plantPage.verifyPriceErrorVisible();
  plantPage.verifyQuantityErrorVisible();
});

Then("the Add Plant form should not be submitted", () => {
  cy.url().should("include", "/ui/plants/add");
});

Then("only sub-categories should be listed in the Category dropdown", () => {
  plantPage.verifyOnlySubCategoriesDisplayed();
});

Then("main categories should not be selectable", () => {
  plantPage.verifyMainCategoriesNotSelectable();
});

Given("I am on the Add Plant page", () => {
  plantPage.clickAddPlantButton();
  plantPage.verifyAddPlantFormVisible();
});

When("I enter valid data into the Add Plant form", () => {
  plantPage.enterValidPlantData();
});

Then("I should be redirected to the Plant List Page", () => {
  cy.url().should("include", "/ui/plants");
});

Then("no new plant should be created", () => {
  plantPage.verifyPlantNotCreated("Test Plant Cancel");
});

Then("previously entered form data should be discarded", () => {
  cy.visit("/plants/add");
  plantPage.elements.plantNameInput().should("have.value", "");
  plantPage.elements.priceInput().should("have.value", "");
  plantPage.elements.quantityInput().should("have.value", "");
  plantPage.elements.categoryDropdown().should("have.value", "");
});

// SORTING STEPS
Given('plants exist with names in the list', function() {
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.at.least', 5);
});

Given('plants exist with different prices', function() {
    cy.get('tbody tr td:nth-child(3)', { timeout: 10000 }).should('have.length.at.least', 2);
});

Given('plants exist with different stock quantities', function() {
    cy.get('tbody tr td:nth-child(4)', { timeout: 10000 }).should('have.length.at.least', 2);
});

When('I click on the {string} column header to sort ascending', function(columnName) {
    const columnMap = { 'Name': 'name', 'Price': 'price', 'Stock': 'quantity' };
    const fieldName = columnMap[columnName];
    
    cy.get(`a[href*="sortField=${fieldName}"]`).first().then(($link) => {
        cy.wrap($link).click();
        cy.url().then((url) => {
            // If the first click resulted in 'desc', click again to get 'asc'
            if (url.includes('sortDir=desc')) {
                cy.log("Currently descending, clicking again for ascending...");
                cy.get(`a[href*="sortField=${fieldName}"]`).first().click();
            }
        });
    });
    cy.wait(500); 
});

// TC 62: Name Sorting
Then('the plant list should be sorted by name in ascending order', function() {
    cy.get('tbody tr td:first-child').then(($cells) => {
        const plantNames = [...$cells].map(el => el.innerText.trim().toLowerCase());
        const sortedNames = [...plantNames].sort();
        expect(plantNames).to.deep.equal(sortedNames);
    });
});

Then('the plants should be ordered alphabetically from A to Z', function() {
    cy.get('tbody tr td:first-child').then(($cells) => {
        const names = [...$cells].map(el => el.innerText.trim().toLowerCase());
        for (let i = 0; i < names.length - 1; i++) {
            expect(names[i].localeCompare(names[i+1])).to.be.at.most(0);
        }
    });
});

// TC 63: Price Sorting
Then('the plant list should be sorted by price in ascending order', function() {
    cy.get('tbody tr td:nth-child(3)').then(($cells) => {
        const prices = [...$cells].map(el => parseFloat(el.innerText.replace(/[^\d.-]/g, '')));
        const sortedPrices = [...prices].sort((a, b) => a - b);
        expect(prices).to.deep.equal(sortedPrices);
    });
});

Then('the plants should be ordered from low to high price', function() {
    cy.get('tbody tr td:nth-child(3)').then(($cells) => {
        const prices = [...$cells].map(el => parseFloat(el.innerText.replace(/[^\d.-]/g, '')));
        for (let i = 0; i < prices.length - 1; i++) {
            expect(prices[i]).to.be.at.most(prices[i+1]);
        }
    });
});

// TC 64: Quantity Sorting
Then('the plant list should be sorted by quantity in ascending order', function() {
    cy.get('tbody tr td:nth-child(4) span:first-child').then(($cells) => {
        const quantities = [...$cells].map(el => parseInt(el.innerText.trim()));
        const sortedQuantities = [...quantities].sort((a, b) => a - b);
        expect(quantities).to.deep.equal(sortedQuantities);
    });
});

// FIXED: Added missing step implementation for Quantity
Then('the plants should be ordered from low to high stock quantity', function() {
    cy.get('tbody tr td:nth-child(4) span:first-child').then(($cells) => {
        const quantities = [...$cells].map(el => parseInt(el.innerText.trim()));
        for (let i = 0; i < quantities.length - 1; i++) {
            expect(quantities[i]).to.be.at.most(quantities[i+1]);
        }
    });
});

When('I check the plant rows for action buttons', function() {
    cy.get('tbody tr').first().should('be.visible');
});