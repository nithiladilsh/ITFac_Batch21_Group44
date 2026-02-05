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

    @setup_standard_data
    Scenario: UI TC 50 - Verify that Parent Category column supports Alphabetical Sorting
      When I click the "Parent" column header to sort ascending
      Then the Parent Category column should be sorted in ascending order
      When I click the "Parent" column header to sort descending
      Then the Parent Category column should be sorted in descending order