Feature: Category Management (Standard User Scenarios)

  Background:
    Given I am logged in as a Standard User

  Scenario: UI TC 11 - Verify that the Category List loads with correct columns and pagination
    Given I am on the Category Management Page
    Then I should see the category table
    And the table should have columns "Name" and "Parent"
    And I should see pagination controls at the bottom
    