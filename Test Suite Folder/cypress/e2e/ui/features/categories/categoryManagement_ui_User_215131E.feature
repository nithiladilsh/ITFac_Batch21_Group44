@category
Feature: Category Management (User Scenarios)

    Background:
        Given I am logged in as a Non-Admin User
        Given I am on the Category Management Page

    Scenario: UI TC 48 - Verify that the "Edit" button is disabled or hidden
        Given at least one Category exists
        When I view the Category List
        Then the "Edit" button should not be visible or should be disabled for each Category row

    Scenario: UI TC 49 - Verify that the "Delete" button is disabled or hidden
        Given at least one Category exists
        When I view the Category List
        Then the "Delete" button should not be visible or should be disabled for each Category row

    @setup_sorting_data
    Scenario: UI TC 50 - Verify that Parent Category column supports Alphabetical Sorting
      When I click the "Parent" column header to sort ascending
      Then the Parent Category column should be sorted in ascending order
      When I click the "Parent" column header to sort descending
      Then the Parent Category column should be sorted in descending order

    @setup_standard_data
    Scenario: UI TC 51 - Verify that Name column supports Alphabetical Sorting
      Given at least one Category exists
      When I click the "Name" column header to sort ascending
      Then the Name column should be sorted in ascending order
      When I click the "Name" column header to sort descending
      Then the Name column should be sorted in descending order

    @setup_standard_data
    Scenario: UI TC 52 - Verify that ID column supports Numeric Sorting
      Given at least one Category exists
      When I click the "ID" column header to sort ascending
      Then the ID column should be sorted in ascending order
      When I click the "ID" column header to sort descending
      Then the ID column should be sorted in descending order