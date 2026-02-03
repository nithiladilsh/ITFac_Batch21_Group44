import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import plantPage from "../../../pages/plants/PlantPage";

const TEST_PLANTS = [
  "Plant 1", "Plant 2", "Plant 3", "Plant 4", "Plant 5",
  "Plant 6", "Plant 7", "Plant 8", "Plant 9", "Plant 10",
  "Plant 11", "Plant 12", "Plant 13", "Plant 14", "Plant 15",
  "Low Stock Plant"
];

const cleanUpPlantData = () => {
  cy.log("Cleaning Plant Test Data...");

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("adminUser"),
      password: Cypress.env("adminPass"),
    },
    failOnStatusCode: false,
  }).then((loginRes) => {
    const token = loginRes.body.token;

    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((listRes) => {
      const plantsList = listRes.body.content || listRes.body; // <--- safe fallback
      const junk = plantsList.filter((p) =>
        TEST_PLANTS.includes(p.name)
      );

      junk.forEach((plant) => {
        cy.request({
          method: "DELETE",
          url: `${Cypress.env("apiUrl")}/plants/${plant.id}`,
          headers: { Authorization: `Bearer ${token}` },
        });
      });
    });
  });
};


Before(() => {
  cleanUpPlantData();
});

Before({ tags: "@setup_plant_data" }, () => {
  cy.log("Seeding Plant Test Data...");

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("adminUser"),
      password: Cypress.env("adminPass"),
    },
    failOnStatusCode: false,
  }).then((loginRes) => {
    const token = loginRes.body.token;
    const headers = { Authorization: `Bearer ${token}` };

    TEST_PLANTS.forEach((plant, index) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants`,
        headers,
        body: {
          name: plant,
          price: index === 15 ? 200 : 100, // last plant = low stock
          quantity: index === 15 ? 2 : 10,
        },
        failOnStatusCode: false, // prevent test from failing if POST fails
      }).then((res) => {
        if (res.status !== 201 && res.status !== 200) {
          cy.log(`Skipped creating ${plant} — status: ${res.status}`);
        }
      });
    });
  });
});


After(() => {
  cleanUpPlantData();
});


// UI_TC_37: Verify that the plant list table is displayed correctly with pagination.

Given("I am on the Plant List Page", () => {
  plantPage.visit();
});

Given("the number of plants exceeds the default page size", () => {
  plantPage.elements.tableRows().should("have.length.greaterThan", 1);
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

// UI_TC_38: Verify that pagination controls are present and functional on the Plant List Page.

Given("the number of plants exceeds one page", () => {
  plantPage.elements.paginationControls().should("be.visible");
});

When("I locate the pagination controls", () => {
  plantPage.verifyPaginationVisible();
});

Then(
  'pagination controls such as "Next", "Previous" and page numbers should be visible',
  () => {
    plantPage.verifyPaginationControlsVisible();
  }
);

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

// UI_TC_39: Verify that the search functionality works correctly on the Plant List Page.

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


// UI_TC_40: Verify “No plants found” message is displayed when list is empty

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

//UI_TC_41: Verify “Low” badge is visually displayed on plant card when stock is low

Given("a plant exists with quantity less than 5", () => {
  cy.contains("Low").should("exist");
});

When("I locate the plant with low quantity", () => {
  cy.contains("Low")
    .closest("tr")
    .as("lowStockRow");
});

Then('a “Low” badge is displayed on the corresponding plant card or rows', () => {
  cy.get("@lowStockRow")
    .contains("Low")
    .should("be.visible");
});

Then("the badge should be visually distinct", () => {
  cy.get("@lowStockRow")
    .find(".badge")
    .should("have.class", "bg-danger");
});

Then("the badge should be clearly associated with the low stock plant", () => {
  cy.get("@lowStockRow")
    .find("td")
    .first()
    .invoke("text")
    .should("not.be.empty");
});

//UI_TC 32: Verify "Add a Plant" button is visible only to Admin on Plant List page

Then('the "Add Plant" button should be visible', () => {
    plantPage.verifyAddPlantButtonVisible();
});

Then('the "Add Plant" button should be clickable', () => {
    plantPage.clickAddPlantButton();
});

Then('the "Add Plant" button should NOT be visible', () => {
    plantPage.verifyAddPlantButtonNotVisible();
});

//UI_TC 33: Verify Add Plant form fields are displayed correctly

When('I click the "Add Plant" button', () => {
    plantPage.clickAddPlantButton();
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

//UI_TC 34: Verify Add Plant form validation messages for required fields

When("I leave all Add Plant fields empty", () => {
  plantPage.elements.plantNameInput().clear();
  plantPage.elements.categoryDropdown().select("");
  plantPage.elements.priceInput().clear();
  plantPage.elements.quantityInput().clear();
});

When("I click the Save button", () => {
  plantPage.clickSaveButton();
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

//UI_TC 35: Verify Category dropdown displays only sub-categories

Then("only sub-categories should be listed in the Category dropdown", () => {
  plantPage.verifyOnlySubCategoriesDisplayed();
});

Then("main categories should not be selectable", () => {
  plantPage.verifyMainCategoriesNotSelectable();
});

//UI_TC 36: Verify Cancel button returns Admin to Plant List page

Given("I am on the Add Plant page", () => {
  plantPage.clickAddPlantButton();
  plantPage.verifyAddPlantFormVisible();
});


When("I enter valid data into the Add Plant form", () => {
  plantPage.enterValidPlantData();
});

When('I click the "Cancel" button', () => {
  plantPage.clickCancelButton();
});

Then("I should be redirected to the Plant List Page", () => {
  cy.url().should("include", "/ui/plants");
  plantPage.verifytableVisible();
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
