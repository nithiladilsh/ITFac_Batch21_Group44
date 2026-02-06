@setup_plant_data
Feature: Plant List Sorting by Name (User Scenarios)

Background:
    Given I am logged in as a Standard User
    And I am on the Plant List Page

  # -------------------------------------------------------------------------
  # SORTING BY NAME
  # -------------------------------------------------------------------------

Scenario: UI TC 62 - Verify sorting by Plant Name (Ascending)
    Given plants exist with names in the list
    When I click on the "Name" column header to sort ascending
    Then the plant list should be sorted by name in ascending order
    And the plants should be ordered alphabetically from A to Z

# -------------------------------------------------------------------------
  # SORTING BY PRICE
  # -------------------------------------------------------------------------

Scenario: UI TC 63 - Verify sorting by Price
    Given plants exist with different prices
    When I click on the "Price" column header to sort ascending
    Then the plant list should be sorted by price in ascending order
    And the plants should be ordered from low to high price 