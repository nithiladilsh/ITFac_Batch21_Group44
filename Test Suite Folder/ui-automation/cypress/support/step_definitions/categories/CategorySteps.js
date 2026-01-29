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

Then('I should not see {string} in the category list', (name) => {
  cy.contains(name).should('not.exist');
});