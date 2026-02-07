@sales
Feature: Sales Functionality - Standard User Scenarios

    Background:
        Given I am logged in as a Standard User
        And I am on the Sales Page 
    
    Scenario: UI TC 26 -  Verify that the "Sell Plant" button is not visible to a Normal User
        Then the "Sell Plant" button should not be visible

    @requires_sales_records
    Scenario: UI TC 27 - Verify that the "Delete" icon/action is not visible to a Normal User
        Given at least one sales record exists in the list
        When I locate a sales record in the list
        Then the "Delete" button should not be visible for that record

    @cleanup_all
    Scenario: UI TC 28 -  Verify the UI display when no sales records exist (Empty State)
        Given there are no sales records in the system
        When I am on the Sales Page
        Then I should see the message "No sales found"

    @requires_sales_records
    Scenario: UI TC 29 - Verify that sales data correctly displays when the user navigates to the sales page
        Given at least one sales record exists in the list
        Then the sales table should be visible
        And the sales records should display relevant information

    @requires_sales_records
    Scenario: UI TC 30 - Verify that the Sales List automatically sorts by "Sold date" in descending order
        Given at least one sales record exists in the list
        When I observe the "Sold date" column in the sales table
        Then the sales records should be sorted by "Sold date" in descending order

    Scenario: UI TC 31 - Verify the navigation Sidebar menu correctly highlights the "Sales" page when active
        Given I am on the Dashboard page
        When I click on the "Sales" menu item in the sidebar
        And I wait for the page to load
        Then the "Sales" menu item should be highlighted as active


        
        