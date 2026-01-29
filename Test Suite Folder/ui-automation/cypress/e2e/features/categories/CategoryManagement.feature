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

  Scenario: UI TC 02 - Verify that an Admin can successfully create a Sub-Category
    Given I am on the Category Management Page
    When I click the "Add Category" button
    And I enter "Chives" in the Category Name field
    And I select "Herbs" from the Parent Category dropdown
    And I click the "Save" button
    Then I should see the success message "Category created successfully"
    And I should see "Chives" in the category list

  Scenario: UI TC 03 - Verify that the Cancel button functionality closes the form without saving
    Given I am on the Category Management Page
    When I click the "Add Category" button
    And I enter "Temp" in the Category Name field
    And I click the "Cancel" button
    Then I should be redirected to the Category List
    And I should not see "Temp" in the category list

  Scenario: UI TC 04 - Verify that the "Add Category" button is visible for an Admin User
    Given I am on the Category Management Page
    Then the "Add Category" button should be visible and clickable

  Scenario: UI TC 05 - Verify that the "Parent Category" dropdown updates dynamically after adding a new Category
    Given I am on the Category Management Page
    When I click the "Add Category" button
    Then the "Parent Category" dropdown should contain "Herbs"