@category
Feature: Category Management (Admin Scenarios)

  Background:
    Given I am logged in as an Admin
    Given I am on the Category Management Page

  # HAPPY PATHS
  Scenario: UI TC 01 - Verify that an Admin can successfully create a new Main Category
    When I click the "Add Category" button
    And I enter "Herbs" in the Category Name field
    And I ensure the "Parent Category" dropdown is empty
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Herbs" in the category list

  @requires_parent
  Scenario: UI TC 02 - Verify that an Admin can successfully create a Sub-Category
    When I click the "Add Category" button
    And I enter "Chives" in the Category Name field
    And I select "Herbs" from the Parent Category dropdown
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Chives" in the category list

  Scenario: UI TC 03 - Verify that the Cancel button functionality closes the form without saving
    When I click the "Add Category" button
    And I enter "Temp" in the Category Name field
    And I click the "Cancel" button
    Then I should be redirected to the Category List
    And I should not see "Temp" in the category list

  Scenario: UI TC 04 - Verify that the "Add Category" button is visible for an Admin User
    Then the "Add Category" button should be visible and clickable

  @requires_parent
  Scenario: UI TC 05 - Verify that the "Parent Category" dropdown updates dynamically after adding a new Category
    When I click the "Add Category" button
    Then the "Parent Category" dropdown should contain "Herbs"

  # VALIDATION & BOUNDARY TESTING
  Scenario: UI TC 06 - Verify that the system prevents creating a category with an Empty Name
    When I click the "Add Category" button
    And I leave the Category Name field empty
    And I click the "Save" button
    Then I should see the validation error "Category name is required"

  Scenario: UI TC 07 - Verify that the system prevents creating a category name with 2 characters
    When I click the "Add Category" button
    And I enter "Ru" in the Category Name field
    And I click the "Save" button
    Then I should see the validation error "Category name must be between 3 and 10 characters"

  Scenario: UI TC 08 - Verify that an Admin can create a category with the minimum allowed length (3 characters)
    When I click the "Add Category" button
    And I enter "Rue" in the Category Name field
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Rue" in the category list

  Scenario: UI TC 09 - Verify that an Admin can create a category with the maximum allowed length (10 characters)
    When I click the "Add Category" button
    And I enter "Vegetables" in the Category Name field
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Vegetables" in the category list

  Scenario: UI TC 10 - Verify that the system prevents creating a category name with 11 characters
    When I click the "Add Category" button
    And I enter "Blueberries" in the Category Name field
    And I click the "Save" button
    Then I should see the validation error "Category name must be between 3 and 10 characters"

  @setup_duplicate_data
  Scenario: UI TC 66 - Verify that the system prevents duplicate categories
    When I click the "Add Category" button
    And I enter "plants" in the Category Name field
    And I select "Main Category" from the Parent Category dropdown
    And I click the "Save" button
    Then I should see the error banner "Sub-category 'plants' already exists under this parent"