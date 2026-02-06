@setup_plant_data
Feature: Plant List Management (Admin Scenarios)

Background:
    Given I am logged in as an Admin
    And I am on the Plant List Page

# -------------------------------------------------------------------------
# ADD PLANT BUTTON VISIBILITY
# -------------------------------------------------------------------------

Scenario: UI TC 32a Verify "Add Plant" button is visible for Admin
    Then the "Add Plant" button should be visible
    And the "Add Plant" button should be clickable

Scenario: UI TC 32b Verify "Add Plant" button is hidden for Standard User
    Given I log out
    And I am logged in as a Standard User
    And I am on the Plant List Page
    Then the "Add Plant" button should NOT be visible

Scenario: UI TC 33 Verify Add Plant form fields are displayed correctly
    When I click the "Add Plant" button
    Then the Add Plant form should be visible
    And the "Plant Name" input field should be displayed
    And the "Category" dropdown should be displayed
    And the "Price" input field should be displayed
    And the "Quantity" input field should be displayed

Scenario: UI TC 34 - Verify validation messages are displayed for invalid Add Plant inputs
  When I click the "Add Plant" button
  And I leave all Add Plant fields empty
  And I click the Save button
  Then validation messages should appear below the respective fields
  And the Add Plant form should not be submitted

Scenario: UI TC 35 Verify Category dropdown displays only sub-categories
  When I click the "Add Plant" button
  Then only sub-categories should be listed in the Category dropdown
  And main categories should not be selectable

Scenario: UI TC 36 Verify Cancel button returns Admin to Plant List page
  When I click the "Add Plant" button
  When I enter valid data into the Add Plant form
  And I click the "Cancel" button
  Then I should be redirected to the Plant List Page
  And no new plant should be created
  And previously entered form data should be discarded
