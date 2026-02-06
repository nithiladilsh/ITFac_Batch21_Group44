Feature: Category Management (Admin Scenarios)

    Background:
        Given I am logged in as an Admin
        Given I am on the Category Management Page

    Scenario: UI TC 42 - Verify that the "Delete" button is visible and clickable
        Given if no Category exists, I create a new Category named "TemporyC"
        When I view the Category List
        Then the "Delete" button should be visible for each Category row
        And the "Delete" button should be enabled and clickable

    Scenario: UI TC 43 - Verify the "Delete" button functionality
        Given if no Category exists, I create a new Category named "TemporyC"
        When I view the Category List
        And I click the "Delete" button for the first category
        And I confirm the deletion in the confirmation dialog
        Then I should see the success message "Category deleted successfully"
        And the deleted category should no longer appear in the Category List

    Scenario: UI TC 44 - Verify that the "Edit" button is visible and clickable
        Given if no Category exists, I create a new Category named "TemporyC"
        When I view the Category List
        Then the "Edit" button should be visible for each Category row
        And the "Edit" button should be enabled and clickable
        When I click the "Edit" button for the first category
        Then I should be navigated to the Edit Category form

    Scenario: UI TC 45 - Verify editing the Category Name
        Given if no Category exists, I create a new Category named "TemporyC"
        When I view the Category List
        And I click the "Edit" button for the first category
        And I enter "Herbs" in the Category Name field
        And I click the "Save" button
        Then I should see the success message "Category updated successfully"
        And I should see "Herbs" in the category list

    Scenario: UI TC 47 - Verify the "Cancel" button functionality in Edit Category
        Given if no Category exists, I create a new Category named "TemporyC"
        When I view the Category List
        And I note the current name of the first category
        And I click the "Edit" button for the first category
        And I enter "Herbs" in the Category Name field
        And I click the "Cancel" button in the Edit Category form
        Then I should be navigated back to the Category List
        And the category name should remain unchanged