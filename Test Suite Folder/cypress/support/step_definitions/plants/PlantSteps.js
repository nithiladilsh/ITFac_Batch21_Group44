import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import plantPage from "../../../pages/plants/PlantPage";

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



