Feature: Sales Functionality - Admin Scenarios

    Background:
        Given I am logged in as an Admin
        And I am on the Sales Page 

    Scenario: UI TC 19 - Verify Sell Plant button is visible and clickable
        Then the "Sell Plant" button should be visible
        When I click the "Sell Plant" button
        Then I should be redirected to "/ui/sales/new"

    Scenario: UI TC 20 - Verify that the Plant dropdown lists available plants with their current stock levels
        Given I am on the "Sell Plant" page
        When I click on the Plant dropdown menu
        Then the dropdown should be enabled
        And the dropdown should display a list of available plants
        And each plant entry should display its stock quantity
    
    Scenario: UI TC 21 - Verify that the system prevents selling plants with a quantity of zero or less
        Given I am on the "Sell Plant" page
        And I have selected a plant from the dropdown
        When I enter "0" in the Quantity field
        And I attempt to submit the form
        Then a validation error message should be displayed
        When I enter "-1" in the Quantity field
        And I attempt to submit the form
        Then a validation error message should be displayed

    Scenario: UI TC 22 - Verify that an Admin can successfully complete a plant sale
        Given I am on the "Sell Plant" page
        When I select a plant from the dropdown
        And I enter a valid quantity in the Quantity field
        And I click the submit button
        Then the plant sale should be completed successfully
        And I should be redirected to the sales list page
        And the plant stock should be reduced accordingly

    Scenario: UI TC 23 - Verify that clicking the Cancel button returns the user to the Sales List without saving
        Given I am on the "Sell Plant" page
        When I select a plant from the dropdown
        And I enter a valid quantity in the Quantity field
        And I click the "Cancel" button
        Then I should be redirected to the sales list page
        And no new sale should be recorded

    @requires_sales_records
    Scenario: UI TC 24 -  Verify that an Admin can successfully delete a Sales record.
        Given at least one sales record exists in the list
        When I select a sales record from the list
        Then the "Delete" button should be visible and enabled for that record
        When I click the "Delete" button for the selected record
        Then a confirmation prompt should appear
        When I click "Yes" on the confirmation prompt
        Then the confirmation prompt should close
        And the selected sales record should be removed from the list
        And the Sales list should refresh automatically

    @requires_sales_records
    Scenario: UI TC 25 - Verify that clicking the Delete action triggers a browser confirmation prompt
        Given at least one sales record exists in the list
        When I locate a sales record in the list
        And I click the "Delete" button for the selected record
        Then a confirmation prompt should appear

 
