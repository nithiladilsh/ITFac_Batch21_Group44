Feature: Category Management (Standard User Scenarios)

  Background:
    Given I am logged in as a Standard User
    Given I am on the Category Management Page

  @setup_standard_data
  Scenario: UI TC 11 - Verify that the Category List loads with correct columns and pagination
    Then I should see the category table
    And the table should have columns "Name" and "Parent"
    And I should see pagination controls at the bottom

  @setup_standard_data
  Scenario: UI TC 12 - Verify that a User can successfully search for a category by full name
    When I enter "Vegetables" in the Search bar
    And I click the "Search" button
    Then I should see "Vegetables" in the category list
    And I should not see "Fruits" in the category list

  @setup_standard_data
  Scenario: UI TC 13 - Verify that a User can search for a category by a Partial Name
    When I enter "Veg" in the Search bar
    And I click the "Search" button
    Then I should see "Vegetables" in the category list
    And I should not see "Fruits" in the category list
    
  Scenario: UI TC 14 - Verify that the system displays an empty state message when no search results are found
    When I enter "Spaceship" in the Search bar
    And I click the "Search" button
    Then I should see the table message "No category found"

  @setup_standard_data
  Scenario: UI TC 15 - Verify that a User can filter the list to show only Sub-Categories of a specific Parent
    When I select "Herbs" from the "Filter by Parent" dropdown
    And I click the "Search" button
    Then I should see "Chives" in the category list
    And I should not see "Vegetables" in the category list

  @setup_standard_data
  Scenario: UI TC 16 - Verify that clicking Next and Previous pagination buttons works correctly
    Then I should see pagination controls at the bottom
    When I note the name of the first category in the list
    And I click the "Next" pagination button
    Then the first category in the list should be different
    And the "Previous" pagination button should be enabled
    When I click the "Previous" pagination button
    Then the first category in the list should be the same as before

  Scenario: UI TC 17 - Verify that the "Add Category" button is hidden for a Standard User
    Then the "Add Category" button should NOT be visible

  @setup_standard_data
  Scenario: UI TC 18 - Verify that the Search keyword is retained when navigating between pagination pages
    When I enter "plants" in the Search bar
    And I click the "Search" button
    Then I should see "plants" in the category list
    When I click the "Next" pagination button
    Then the Search bar should still contain "plants"
    And all items in the list should contain "plants"

  @setup_standard_data
  Scenario: UI TC 67 - Verify that the Reset button clears the search and reloads the list
    When I enter "Vegetables" in the Search bar
    And I click the "Search" button
    Then I should see "Vegetables" in the category list
    When I click the "Reset" button
    Then the Search bar should be empty
    And the category list should show multiple items