import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import categoryPage from "../../../pages/categories/CategoryPage";

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

When('I select {string} from the Parent Category dropdown', (parentName) => {
  categoryPage.selectParent(parentName);
});