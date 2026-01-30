Feature: Category Management (Standard User Scenarios)

  Background:
    Given I am logged in as a Standard User

  Scenario: UI TC 11 - Verify that the Category List loads with correct columns and pagination
    Given I am on the Category Management Page
    Then I should see the category table
    And the table should have columns "Name" and "Parent"
    And I should see pagination controls at the bottom

  Scenario: UI TC 12 - Verify that a User can successfully search for a category by full name
    Given I am on the Category Management Page
    When I enter "Vegetables" in the Search bar
    And I click the "Search" button
    Then I should see "Vegetables" in the category list
    And I should not see "Fruits" in the category list

  Scenario: UI TC 13 - Verify that a User can search for a category by a Partial Name
    Given I am on the Category Management Page
    When I enter "Veg" in the Search bar
    And I click the "Search" button
    Then I should see "Vegetables" in the category list
    And I should not see "Fruits" in the category list
    
  Scenario: UI TC 14 - Verify that the system displays an empty state message when no search results are found
    Given I am on the Category Management Page
    When I enter "Spaceship" in the Search bar
    And I click the "Search" button
    Then I should see the table message "No category found"