import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import categoryPage from "../../../pages/categories/CategoryPage";

// UI_TC_01: Verify that a user can add a new category with an empty parent category.
Given("I am on the Category Management Page", () => {
  categoryPage.visit();
});

When('I click the "Add Category" button', () => {
  categoryPage.clickAddCategory();
});

When('I enter {string} in the Category Name field', (name) => {
  categoryPage.enterCategoryName(name);
});

When('I ensure the "Parent Category" dropdown is empty', () => {
  categoryPage.selectParent("empty");
});

When('I click the "Save" button', () => {
  categoryPage.clickSave();
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
When('I click the "Cancel" button', () => {
  categoryPage.clickCancel();
});

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

When('I click the "Search" button', () => {
  categoryPage.clickSearch();
});

Then('I should not see {string} in the category list', (name) => {
  categoryPage.elements.categoryTable().should('not.contain', name);
});