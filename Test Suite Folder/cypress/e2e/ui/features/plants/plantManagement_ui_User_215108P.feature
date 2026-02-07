@plant @setup_plant_data
Feature: Plant List Sorting by Name (User Scenarios)

Background:
    Given I am logged in as a Standard User
    And I am on the Plant List Page

Scenario: UI TC 62 - Verify sorting by Plant Name (Ascending)
    Given plants exist with names in the list
    When I click on the "Name" column header to sort ascending
    Then the plant list should be sorted by name in ascending order
    And the plants should be ordered alphabetically from A to Z

Scenario: UI TC 63 - Verify sorting by Price
    Given plants exist with different prices
    When I click on the "Price" column header to sort ascending
    Then the plant list should be sorted by price in ascending order
    And the plants should be ordered from low to high price 

Scenario: UI TC 64 - Verify sorting by Quantity
    Given plants exist with different stock quantities
    When I click on the "Stock" column header to sort ascending
    Then the plant list should be sorted by quantity in ascending order
    And the plants should be ordered from low to high stock quantity

Scenario: UI TC 65 - Verify Edit/Delete actions are not visible for non-Admin users
    Given I am logged in as a Standard User
    And I am on the Plant List Page
    When I check the plant rows for action buttons
    Then the "Edit" button should not be visible
    And the "Delete" button should not be visible