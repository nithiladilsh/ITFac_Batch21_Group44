Feature: Sales Functionality

    Scenario: UI-Test-19 Verify Sell Plant button is visible and clickable
        Given I am logged in as an Admin
        And I am on the Sales Page
        Then the "Sell Plant" button should be visible
        When I click the "Sell Plant" button
        Then I should be redirected to "/ui/sales/new"

    Scenario: UI-Test-20 Verify that the Plant dropdown lists available plants with their current stock levels
        Given I am logged in as an Admin
        And I am on the "Sell Plant" page
        When I click on the Plant dropdown menu
        Then the dropdown should be enabled
        And the dropdown should display a list of available plants
        And each plant entry should display its stock quantity

