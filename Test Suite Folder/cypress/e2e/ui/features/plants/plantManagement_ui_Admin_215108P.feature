@UI_TC_53 @admin
Feature: Plant management - Admin actions
  Validate Admin users can see and use the Edit action for plants.

  Background:
    Given I am logged in as an Admin
    And the Plant list is displayed

  @smoke
  Scenario: Verify that the "Edit" button is visible for Admin users
    When I navigate to the Plant List
    And I locate a plant row
    Then I should see the "Edit" button for that row
    And the "Edit" button should be enabled

@UI_TC_54 @admin
Scenario: Verify that clicking "Edit" opens the Edit Plant page with pre-filled data
  Given I am logged in as an Admin
  And a plant "Rose" exists with price "10"
  And the Plant list is displayed
  When I click "Edit" on plant "Rose"
  Then the Edit Plant page should open
  And the Name field should show "Rose"
  And the Price field should show "10"
  And the Category field should be populated
  And the Quantity field should be populated
  
@UI_TC_55 @admin
Scenario: Verify updating Price with a valid value saves successfully
  Given I am logged in as an Admin
  And a plant "Sunflower" exists with price "25"
  And the Plant list is displayed
  When I click "Edit" on plant "Sunflower"
  And I change the Price to "50"
  And I click the Save button
  Then a success message should be displayed
  And I should be redirected to the Plant List Page
  And the plant "Sunflower" should display price "50"

@UI_TC_56 @admin
Scenario: Verify updating Quantity with a valid value saves successfully
  Given I am logged in as an Admin
  And a plant "Sunflower" exists with price "50"
  And the Plant list is displayed
  When I click "Edit" on plant "Sunflower"
  And I change the Quantity to "100"
  And I click the Save button
  Then a success message should be displayed
  And I should be redirected to the Plant List Page
  And the plant "Sunflower" should display quantity "100"

@UI_TC_57 @admin
Scenario: Verify validation error when updating Price to a negative value
  Given I am logged in as an Admin
  And a plant "Rose" exists with price "10"
  And the Plant list is displayed
  When I click "Edit" on plant "Rose"
  And I change the Price to "-5"
  And I click the Save button
  Then a price validation error should be displayed
  And the error message should contain "Price must be greater than 0"
  And I should remain on the Edit Plant page

@UI_TC_58 @admin
Scenario: Verify validation error when updating Quantity to a negative value
  Given I am logged in as an Admin
  And a plant "Sunflower" exists with price "50"
  And the Plant list is displayed
  When I click "Edit" on plant "Sunflower"
  And I change the Quantity to "-1"
  And I click the Save button
  Then a quantity validation error should be displayed
  And the error message should contain "Quantity cannot be negative"
  And I should remain on the Edit Plant page