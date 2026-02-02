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
