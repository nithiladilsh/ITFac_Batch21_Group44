import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import plantPage from "../../../pages/plants/PlantPage";

const TEST_PLANTS = [
  "Testsub", "Aloevera", "Plant 1", "Plant 2", "Plant 3", "Plant 4", "Plant 5",
  "Plant 6", "Plant 7", "Plant 8", "Plant 9", "Plant 10",
  "Plant 11", "Plant 12", "Plant 13", "Plant 14", "Plant 15",
  "Low Stock Plant"
];

const cleanUpPlantData = () => {
  cy.log("STARTING CLEANUP...");

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

    // 1. DELETE PLANTS (Clean up Foreign Keys first)
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/plants?page=0&size=2000`, 
      headers,
      failOnStatusCode: false,
    }).then((res) => {
      const plants = res.body.content || res.body;
      const namesToDelete = [...TEST_PLANTS, "Aloevera"];
      
      const junkPlants = plants.filter((p) => 
         namesToDelete.includes(p.name) || 
         (p.category && /^P\d+$/.test(p.category.name)) 
      );

      if (junkPlants.length > 0) {
        cy.log(`Deleting ${junkPlants.length} plants...`);
        junkPlants.forEach((plant) => {
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("apiUrl")}/plants/${plant.id}`,
            headers,
            failOnStatusCode: false
          });
        });
      }
    });

    cy.wait(2000); 

    // 2. DYNAMICALLY IDENTIFY PARENTS & DELETE CATEGORIES
    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/categories?page=0&size=2000`,
      headers,
      failOnStatusCode: false
    }).then((res) => {
      const categories = res.body.content || res.body;

      // A. Find the "Junk Children" (P### or Testsub)
      const childrenToDelete = categories.filter(c => 
        /^P\d+$/.test(c.name) || c.name === "Testsub"
      );

      // B. EXTRACT PARENT IDs from these children
      const parentIdsToDelete = new Set();
      
      childrenToDelete.forEach(child => {
        if (child.parent && child.parent.id) {
          parentIdsToDelete.add(child.parent.id);
        }
      });
      
      const testRoot = categories.find(c => c.name === "TestRoot");
      if (testRoot) parentIdsToDelete.add(testRoot.id);

      // C. Delete Children FIRST
      if (childrenToDelete.length > 0) {
        cy.log(`Deleting ${childrenToDelete.length} sub-categories...`);
        childrenToDelete.forEach(sub => {
             cy.request({
                method: "DELETE",
                url: `${Cypress.env("apiUrl")}/categories/${sub.id}`,
                headers,
                failOnStatusCode: false
             });
        });
      }
      
      cy.wait(1000);

      // D. Delete the Parents which were discovered
      if (parentIdsToDelete.size > 0) {
        cy.log(`Deleting ${parentIdsToDelete.size} detected Parent Categories...`);
        parentIdsToDelete.forEach(parentId => {
             cy.request({
                method: "DELETE",
                url: `${Cypress.env("apiUrl")}/categories/${parentId}`,
                headers,
                failOnStatusCode: false
             });
        });
      }
    });
  });
};


Before(() => {
  cleanUpPlantData();
});

const createPlantsSequentially = (subCategory, headers) => {
  TEST_PLANTS.forEach((plantName, index) => {
    const isLowStock = index === TEST_PLANTS.length - 1;
    const body = {
      id: 0, 
      name: plantName,
      price: Number(isLowStock ? 200 : 100), 
      quantity: Number(isLowStock ? 2 : 25),
      category: {
        id: subCategory.id,
        name: subCategory.name
      }
    };

    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/plants/category/${subCategory.id}`,
      headers,
      body,
      failOnStatusCode: false
    }).then((res) => {
      if (res.status !== 201 && res.status !== 200) {
        cy.log(`Failed ${plantName} - Status: ${res.status} - Msg: ${JSON.stringify(res.body)}`);
      }
    });
  });
};

// BEFORE HOOK
Before({ tags: "@setup_plant_data" }, () => {
  cy.log("Seeding Plant Test Data...");

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: { username: Cypress.env("adminUser"), password: Cypress.env("adminPass") }
  }).then((loginRes) => {
    const token = loginRes.body.token;
    const headers = { Authorization: `Bearer ${token}` };

    // STEP 1: Ensure a Valid "Main Category" exists
    const ensureMainCategory = () => {
      return cy.request({
        method: "GET",
        url: `${Cypress.env("apiUrl")}/categories?page=0&size=1000`, 
        headers
      }).then((catRes) => {
        const categories = catRes.body.content || catRes.body; 
        const existingMain = categories.find(c => c.name === "TestRoot" || c.parent === null);
        
        if (existingMain) {
          return cy.wrap(existingMain.id);
        } else {
          cy.log("No Main Category found. Creating 'TestRoot'...");
          return cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/categories`,
            headers,
            body: { name: "TestRoot", parent: null },
            failOnStatusCode: false
          }).then((res) => {
             if (res.status !== 201) throw new Error(`Failed to create TestRoot category. Status: ${res.status}`);
             return res.body.id;
          });
        }
      });
    };

    // STEP 2: Force-Recreate "Testsub" using the Valid Parent ID
    const ensureSubCategory = (parentId) => {
      cy.request({ 
        method: "GET", 
        url: `${Cypress.env("apiUrl")}/categories?page=0&size=1000`, 
        headers 
      }).then((catRes) => {
          const categories = catRes.body.content || catRes.body;
          const existingSub = categories.find(c => c.name === "Testsub");

          const createFreshSub = () => {
            cy.request({
              method: "POST",
              url: `${Cypress.env("apiUrl")}/categories`,
              headers,
              body: { name: "Testsub", parent: { id: parentId } }, 
              failOnStatusCode: false
            }).then((res) => {
              if (res.status !== 201) {
                throw new Error(`Failed to create sub-category! Status: ${res.status} - Msg: ${JSON.stringify(res.body)}`);
              }
              cy.log(`Fresh Sub-category created (ID: ${res.body.id})`);
              createPlantsSequentially(res.body, headers);
            });
          };

          if (existingSub) {
             cy.log(`🗑️ Deleting stale category: ${existingSub.id}`);
             cy.request({
               method: "DELETE",
               url: `${Cypress.env("apiUrl")}/categories/${existingSub.id}`,
               headers,
               failOnStatusCode: false
             }).then(() => {
               cy.wait(2000); 
               createFreshSub();
             });
          } else {
             createFreshSub();
          }
        });
    };

    ensureMainCategory().then((validParentId) => {
      cy.log(`Using Parent Category ID: ${validParentId}`);
      ensureSubCategory(validParentId);
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

// UI_TC_53: Edit button visibility for Admin
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
    cy.get(
      'a[title="Edit"], a[aria-label="Edit"], button[aria-label="Edit"], button[title="Edit"], .btn-edit, .edit-btn, .action-edit, i.bi-pencil-square, .bi-pencil-square, i.bi.bi-pencil-square'
    )
      .first()
      .should("be.visible");
  });
});

Then('the {string} button should be enabled', (buttonLabel) => {
  cy.get("@targetPlantRow").within(() => {
    cy.get('a[title="Edit"], a[aria-label="Edit"], button[aria-label="Edit"], button[title="Edit"], .btn-edit, .edit-btn, .action-edit')
      .first()
      .should("be.visible")
      .and((el) => {
        expect(el).not.to.have.class("disabled");
        expect(el).not.to.have.attr("aria-disabled", "true");
      });
  });
});

// UI_TC_54: Verify that clicking "Edit" opens the Edit Plant page with pre-filled data

Given('a plant {string} exists with price {string}', (plantName, price) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username: Cypress.env("adminUser"),
      password: Cypress.env("adminPass"),
    }
  }).then((loginRes) => {
    const token = loginRes.body.token;
    const headers = { Authorization: `Bearer ${token}` };

    cy.request({
      method: "GET",
      url: `${Cypress.env("apiUrl")}/categories?page=0&size=1000`,
      headers
    }).then((catRes) => {
      const categories = catRes.body.content || catRes.body;
      const subCategory = categories.find(c => c.parent !== null) || categories[0];

      cy.request({
        method: "POST",
        url: `${Cypress.env("apiUrl")}/plants/category/${subCategory.id}`,
        headers,
        body: {
          id: 0,
          name: plantName,
          price: Number(price),
          quantity: 15,
          category: {
            id: subCategory.id,
            name: subCategory.name
          }
        },
        failOnStatusCode: false
      }).then((plantRes) => {
        cy.log(`Plant "${plantName}" created with ID: ${plantRes.body.id}`);
        cy.wrap(plantRes.body.id).as('createdPlantId');
      });
    });
  });

  cy.wait(1000);
});

When('I click {string} on plant {string}', (action, plantName) => {
  plantPage.clickEditButtonForPlant(plantName);
});

Then('the Edit Plant page should open', () => {
  cy.url().should("include", "/ui/plants/edit/");
});

Then('the Name field should show {string}', (expectedName) => {
  plantPage.elements.plantNameInput().should('have.value', expectedName);
});

Then('the Price field should show {string}', (expectedPrice) => {
  plantPage.elements.priceInput().invoke('val').then((actualPrice) => {
    // Compare as numbers to handle 10 vs 10.0
    expect(parseFloat(actualPrice)).to.equal(parseFloat(expectedPrice));
  });
});

Then('the Category field should be populated', () => {
  plantPage.elements.categoryDropdown().should('not.have.value', '');
});

Then('the Quantity field should be populated', () => {
  plantPage.elements.quantityInput().invoke('val').then((val) => {
    expect(val).to.not.be.empty;
    expect(Number(val)).to.be.greaterThan(0);
  });
});

// UI_TC_55: Verify updating Price with a valid value saves successfully

When('I change the Price to {string}', (newPrice) => {
  plantPage.updatePrice(newPrice);
});

Then('a success message should be displayed', () => {
  plantPage.verifySuccessMessage();
});

Then('the plant {string} should display price {string}', (plantName, expectedPrice) => {
  plantPage.verifyPlantPrice(plantName, expectedPrice);
});

// UI_TC_56: Verify updating Quantity with a valid value saves successfully

When('I change the Quantity to {string}', (newQuantity) => {
  plantPage.updateQuantity(newQuantity);
});

Then('the plant {string} should display quantity {string}', (plantName, expectedQuantity) => {
  plantPage.verifyPlantQuantity(plantName, expectedQuantity);
});

// UI_TC_57: Verify validation error when updating Price to a negative value

Then('a price validation error should be displayed', () => {
  plantPage.verifyPriceValidationError();
});

Then('the error message should contain {string}', (expectedMessage) => {
  plantPage.verifyErrorMessageContains(expectedMessage);
});

Then('I should remain on the Edit Plant page', () => {
  plantPage.verifyOnEditPage();
});

// UI_TC_58: Verify validation error when updating Quantity to a negative value

Then('a quantity validation error should be displayed', () => {
  plantPage.verifyQuantityValidationError();
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
