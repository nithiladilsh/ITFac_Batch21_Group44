Feature: Category Management

  Background:
    Given I am logged in as an Admin

  Scenario: UI TC 01 - Verify that an Admin can successfully create a new Main Category
    Given I am on the Category Management Page
    When I click the "Add Category" button
    And I enter "Herbs" in the Category Name field
    And I ensure the "Parent Category" dropdown is empty
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Herbs" in the category list