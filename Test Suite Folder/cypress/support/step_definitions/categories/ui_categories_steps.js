import { Given, When, Then, Before, After } from "@badeball/cypress-cucumber-preprocessor";
import categoryPage from "../../../pages/categories/CategoryPage";

// CACHED ADMIN TOKEN
let cachedAdminToken = null;

const getAdminToken = () => {
  if (cachedAdminToken) return cy.wrap(cachedAdminToken);
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { username: Cypress.env('adminUser'), password: Cypress.env('adminPass') },
    log: false 
  }).then((res) => {
    cachedAdminToken = res.body.token;
    return cachedAdminToken;
  });
};

// Test Data Names for Cleanup
const TEST_DATA_NAMES = [
  "Chives", "Rue", "Vegetables", "Blueberries", "plants", "Temp", "Herbs"
];

// Optimized Cleanup Function
const cleanUpTestData = () => {
  // Use cached token to avoid re-logging in
  getAdminToken().then(token => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`,
      headers: { 'Authorization': `Bearer ${token}` },
      failOnStatusCode: false,
      log: false
    }).then((listRes) => {
      if (listRes.body && listRes.body.content) {
        const junkItems = listRes.body.content.filter(c =>
          TEST_DATA_NAMES.includes(c.name) || c.name.startsWith("plants_") || c.name.startsWith("sort_")
        );

        if (junkItems.length > 0) {
            cy.log(`🧹 Cleaning up ${junkItems.length} categories...`);
            junkItems.forEach((item) => {
              cy.request({
                method: 'DELETE',
                url: `${Cypress.env('apiUrl')}/categories/${item.id}`,
                headers: { 'Authorization': `Bearer ${token}` },
                failOnStatusCode: false,
                log: false
              });
            });
        }
      }
    });
  });
};

// 1. GLOBAL CLEANUP (RESTRICTED TO @category)
Before({ tags: "@category" }, () => {
  cleanUpTestData();
});

// 2. ADMIN SETUP (@requires_parent)
Before({ tags: "@requires_parent" }, () => {
  cy.log("Creating 'Herbs' parent for Admin test...");
  getAdminToken().then(token => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/categories`,
      headers: { 'Authorization': `Bearer ${token}` },
      body: { "name": "Herbs", "parent": null },
      failOnStatusCode: false,
      log: false
    });
  });
});

// 3. STANDARD USER SETUP (@setup_standard_data)
Before({ tags: "@setup_standard_data" }, () => {
  cy.log("Seeding Database for Standard User Tests...");
  getAdminToken().then(token => {
    const headers = { 'Authorization': `Bearer ${token}` };

    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "Vegetables", "parent": null }, failOnStatusCode: false, log: false });

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/categories`,
      headers,
      body: { "name": "Herbs", "parent": null },
      failOnStatusCode: false,
      log: false
    }).then((herbsRes) => {
      const herbsId = herbsRes.body.id;
      if (herbsId) {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/categories`,
          headers,
          body: { "name": "Chives", "parent": { "id": herbsId } },
          failOnStatusCode: false,
          log: false
        });
      }
    });

    // Bulk creation loop
    for (let i = 1; i <= 15; i++) {
      const num = i < 10 ? `0${i}` : i;
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/categories`,
        headers,
        body: { "name": `plants_${num}`, "parent": null },
        failOnStatusCode: false,
        log: false
      });
    }
  });
});

// 4. DUPLICATE DATA SETUP (@setup_duplicate_data)
Before({ tags: "@setup_duplicate_data" }, () => {
    cy.log("Seeding 'plants' for duplicate check...");
    getAdminToken().then(token => {
        cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/categories`,
            headers: { 'Authorization': `Bearer ${token}` },
            body: { "name": "plants", "parent": null },
            failOnStatusCode: false,
            log: false
        });
    });
});

// 5. SORTING SETUP (@setup_sorting_data)
Before({ tags: "@setup_sorting_data" }, () => {
  cy.log("Seeding specific data for Sorting Test...");
  getAdminToken().then(token => {
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch and delete potential leftovers first
    cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/categories/page?page=0&size=2000`,
        headers,
        failOnStatusCode: false,
        log: false
    }).then((listRes) => {
        if (listRes.body && listRes.body.content) {
            const leftovers = listRes.body.content.filter(c => c.name.startsWith("sort_"));
            leftovers.forEach(item => {
                cy.request({ method: 'DELETE', url: `${Cypress.env('apiUrl')}/categories/${item.id}`, headers, failOnStatusCode: false, log: false });
            });
        }
    });

    // Create Sorting Data
    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "sort_Parent_A", "parent": null }, failOnStatusCode: false, log: false })
      .then((resA) => {
         if (resA.body.id) {
             cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "sort_Child_A", "parent": { "id": resA.body.id } }, failOnStatusCode: false, log: false });
         }
      });

    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "sort_Parent_Z", "parent": null }, failOnStatusCode: false, log: false })
      .then((resZ) => {
         if (resZ.body.id) {
             cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "sort_Child_Z", "parent": { "id": resZ.body.id } }, failOnStatusCode: false, log: false });
         }
      });

    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/categories`, headers, body: { "name": "sort_Child_Orphan", "parent": null }, failOnStatusCode: false, log: false });
  });
});

After({ tags: "@category" }, () => {
  cleanUpTestData();
});

// Helper: Numeric Retry Logic ---
function tryToAchieveNumericSortOrder(targetOrder, attempts) {
  if (attempts >= 3) return; 

  categoryPage.getIdColumnValues().then((values) => {
    if (values.length < 2) return;

    const first = values[0];
    const last = values[values.length - 1];

    // Numeric Comparison
    const isDescending = first > last;
    const isAscending = !isDescending;

    let needClick = false;
    if (targetOrder === 'asc' && !isAscending) needClick = true;
    if (targetOrder === 'desc' && !isDescending) needClick = true;

    if (needClick) {
      cy.log(`ID Sort Incorrect. Clicking again...`);
      categoryPage.clickIdColumnHeader();
      cy.wait(200); 
      tryToAchieveNumericSortOrder(targetOrder, attempts + 1);
    }
  });
}

// Helper: Alphabetical Retry Logic 
function tryToAchieveSortOrder(targetOrder, attempts) {
  if (attempts >= 3) return; 

  categoryPage.getNameColumnValues().then((values) => {
    if (values.length < 2) return;

    const first = values[0];
    const last = values[values.length - 1];
    const isDescending = first.localeCompare(last) > 0;
    const isAscending = !isDescending;

    let needClick = false;
    if (targetOrder === 'asc' && !isAscending) needClick = true;
    if (targetOrder === 'desc' && !isDescending) needClick = true;

    if (needClick) {
      cy.log("Incorrect order. Clicking header again...");
      categoryPage.clickNameColumnHeader();
      cy.wait(200); 
      tryToAchieveSortOrder(targetOrder, attempts + 1);
    }
  });
}

// --- STEP DEFINITIONS ---

// UI_TC_01: Verify that a user can add a new category with an empty parent category.
Given("I am on the Category Management Page", () => {
  categoryPage.visit();
});

When('I enter {string} in the Category Name field', (name) => {
  categoryPage.enterCategoryName(name);
});

When('I ensure the "Parent Category" dropdown is empty', () => {
  categoryPage.selectParent("empty");
});

Then('I should see the success message {string}', (message) => {
  categoryPage.elements.successMessage().should('contain', message);
});

Then('I should see {string} in the category list', (categoryName) => {
  categoryPage.elements.categoryList().should('contain', categoryName);
});

// UI_TC_02 : Verify that a user can add a new category with an existing category as the parent.
When('I select {string} from the Parent Category dropdown', (parentName) => {
  categoryPage.selectParent(parentName);
});

// UI_TC_03 - Verify that the Cancel button functionality closes the form without saving
Then('I should be redirected to the Category List', () => {
  cy.url().should('include', '/categories');
  cy.contains('Add A Category').should('be.visible');
});

// UI_TC_04 - Verify that the "Add Category" button is visible for an Admin User
Then('the "Add Category" button should be visible and clickable', () => {
  categoryPage.verifyAddCategoryButtonVisible();
});

// UI_TC_05 - Verify that the "Parent Category" dropdown updates dynamically after adding a new Category
Then('the "Parent Category" dropdown should contain {string}', (categoryName) => {
  categoryPage.verifyParentDropdownContains(categoryName);
});

// UI_TC_06 - Clear the Name field and verify validation error
When('I leave the Category Name field empty', () => {
  categoryPage.clearNameField();
});

Then('I should see the validation error {string}', (message) => {
  categoryPage.verifyValidationError(message);
});

// UI_TC_11 - Verify that the Category List displays correctly with pagination
Then('I should see the category table', () => {
  categoryPage.verifyTableVisible();
});

Then('the table should have columns {string} and {string}', (col1, col2) => {
  categoryPage.verifyTableColumns(col1, col2);
});

Then('I should see pagination controls at the bottom', () => {
  categoryPage.verifyPaginationVisible();
});


// UI_TC_12 - Verify that a User can successfully search for a category by full name
When('I enter {string} in the Search bar', (searchTerm) => {
  categoryPage.enterSearchTerm(searchTerm);
});

Then('I should not see {string} in the category list', (name) => {
  categoryPage.elements.categoryTable().should('not.contain', name);
});

// UI_TC_14 - Verify that searching for a non-existent category shows "No Results Found"
Then('I should see the table message {string}', (message) => {
  categoryPage.verifyNoResultsMessage(message);
});

// UI_TC_15 - Verify that filtering by Parent Category works correctly
When('I select {string} from the "Filter by Parent" dropdown', (parentName) => {
  categoryPage.selectFilterParent(parentName);
});

// UI_TC_16 - Verify that pagination works correctly in the Category List
When('I note the name of the first category in the list', () => {
  categoryPage.captureFirstItemName();
});

When('I click the "Next" pagination button', () => {
  categoryPage.clickNextPage();
});

Then('the first category in the list should be different', () => {
  categoryPage.verifyFirstItemIsDifferent();
});

Then('the "Previous" pagination button should be enabled', () => {
  categoryPage.verifyPreviousButtonEnabled();
});

When('I click the "Previous" pagination button', () => {
  categoryPage.clickPreviousPage();
});

Then('the first category in the list should be the same as before', () => {
  categoryPage.verifyFirstItemIsSame();
});

// UI_TC_17 - Verify that the "Add Category" button is NOT visible for a Standard User
Then('the "Add Category" button should NOT be visible', () => {
  categoryPage.verifyAddCategoryButtonNotVisible();
});

// UI_TC_18 - Verify that search term persists after performing a search
Then('the Search bar should still contain {string}', (term) => {
  categoryPage.verifySearchInputValue(term);
});

Then('all items in the list should contain {string}', (term) => {
  categoryPage.verifyAllRowsContain(term);
});

// UI_TC_66 - Verify that the system prevents duplicate categories
Then('I should see the error banner {string}', (message) => {
  categoryPage.verifyDuplicateError(message);
});

// UI_TC_67 - Verify that resetting the search clears the input field
Then('the Search bar should be empty', () => {
  categoryPage.verifySearchInputEmpty();
});

Then('the category list should show multiple items', () => {
  categoryPage.verifyMultipleItems();
});

// UI_TC_42 - Verify that the "Delete" button is visible and clickable
Given('if no Category exists, I create a new Category named "TemporyC"', function () {
  categoryPage.ensureAtLeastOneCategoryExists("TemporyC");
});

When('I click the "Cancel" button in the Edit Category form', () => {
  categoryPage.clickEditCancel();
});

When("I view the Category List", function () {
  categoryPage.verifyTableVisible();
});

Then('the "Delete" button should be visible for each Category row', () => {
  categoryPage.verifyDeleteButtonVisibleAndClickable();
});

Then('the "Delete" button should be enabled and clickable', () => {
  categoryPage.verifyDeleteButtonVisibleAndClickable();
});

// UI_TC_43 - Verify the "Delete" button functionality
When('I click the "Delete" button for the first category', () => {
  categoryPage.elements.deleteButton().first().click();
});

When('I confirm the deletion in the confirmation dialog', () => {
  categoryPage.elements.deleteModal().should('be.visible');
  cy.get('#deleteModal').find('button[type="submit"]').contains('Delete').click();
});

Then('the deleted category should no longer appear in the Category List', () => {
  categoryPage.elements.noResultsRow().should('be.visible');
});

// UI_TC_44 - Verify that the "Edit" button is visible and clickable
Then('the "Edit" button should be visible for each Category row', () => {
  categoryPage.verifyEditButtonVisibleAndClickable();
});

Then('the "Edit" button should be enabled and clickable', () => {
  categoryPage.verifyEditButtonVisibleAndClickable();
});

When('I click the "Edit" button for the first category', () => {
  categoryPage.clickEditButtonForFirstCategory();
});

Then('I should be navigated to the Edit Category form', () => {
  categoryPage.verifyNavigatedToEditForm();
});

// UI_TC_47 - Cancel button in Edit Category
When('I note the current name of the first category', () => {
  categoryPage.captureCategoryNameAtRow(0);
});

Then('I should be navigated back to the Category List', () => {
  categoryPage.verifyNavigatedBackToCategoryList();
});

Then('the category name should remain unchanged', () => {
  categoryPage.verifyCategoryNameUnchangedAtRow(0);
});

// UI_TC_48 - Verify "Edit" button is not visible or disabled for non-admin users
Given('I am logged in as a Non-Admin User', () => {
  categoryPage.loginAsStandardUser();
});

Then('the "Edit" button should not be visible or should be disabled for each Category row', () => {
  categoryPage.verifyEditButtonNotVisibleOrDisabled();
});

Given("at least one Category exists", function () {
  categoryPage.ensureAtLeastOneCategoryExists();
});

// UI_TC_49 - Verify "Delete" button is not visible or disabled for non-admin users
Then('the "Delete" button should not be visible or should be disabled for each Category row', () => {
  categoryPage.elements.deleteButton().then(($btns) => {
    if ($btns.length) {
      cy.wrap($btns).each(($btn) => cy.wrap($btn).should('be.disabled'));
    } else {
      expect($btns.length).to.eq(0);
    }
  });
});

// UI_TC_50 - Verify that Parent Category column supports Alphabetical Sorting
Given("multiple categories with different parents exist", () => {
    cy.reload();
});

When('I click the "Parent" column header to sort ascending', () => {
  categoryPage.clickParentColumnHeader();
  cy.wait(200); 
});

Then('the Parent Category column should be sorted in ascending order', () => {
  categoryPage.verifyParentColumnSorted('asc');
});

When('I click the "Parent" column header to sort descending', () => {
  categoryPage.clickParentColumnHeader();
  cy.wait(200);
});

Then('the Parent Category column should be sorted in descending order', () => {
  categoryPage.verifyParentColumnSorted('desc');
});

// UI_TC_51 - Verify that Name column supports Alphabetical Sorting
When('I click the "Name" column header to sort ascending', () => {
  categoryPage.clickNameColumnHeader();
  cy.wait(200);
  cy.wrap(null).then(() => {
    return tryToAchieveSortOrder('asc', 0);
  });
});

Then('the Name column should be sorted in ascending order', () => {
  categoryPage.verifyNameColumnSorted('asc');
});

When('I click the "Name" column header to sort descending', () => {
  categoryPage.clickNameColumnHeader();
  cy.wait(200);
  cy.wrap(null).then(() => {
    return tryToAchieveSortOrder('desc', 0);
  });
});

Then('the Name column should be sorted in descending order', () => {
  categoryPage.verifyNameColumnSorted('desc');
});

// UI_TC_52 - Verify that ID column supports Numeric Sorting
When('I click the "ID" column header to sort ascending', () => {
  categoryPage.clickIdColumnHeader();
  cy.wait(200);
  cy.wrap(null).then(() => {
    return tryToAchieveNumericSortOrder('asc', 0);
  });
});

Then('the ID column should be sorted in ascending order', () => {
  categoryPage.verifyIdColumnSorted('asc');
});

When('I click the "ID" column header to sort descending', () => {
  categoryPage.clickIdColumnHeader();
  cy.wait(200);
  cy.wrap(null).then(() => {
    return tryToAchieveNumericSortOrder('desc', 0);
  });
});

Then('the ID column should be sorted in descending order', () => {
  categoryPage.verifyIdColumnSorted('desc');
});