@plant @setup_plant_data
Feature: Plant List Management (User Scenarios)

Background:
    Given I am logged in as a Standard User
    And I am on the Plant List Page

  # LIST DISPLAY & PAGINATION
Scenario: UI TC 37 - Verify plants are displayed in a paginated list
    Given the number of plants exceeds the default page size
    When the Plant List page is loaded
    Then plant records should be displayed in a structured list or grid
    And only a limited number of plants should be displayed per page
    And additional plants should be available on subsequent pages

Scenario: UI TC 38 - Verify pagination controls are visible and functional
    Given the number of plants exceeds one page
    When I locate the pagination controls
    Then pagination controls such as "Next", "Previous" and page numbers should be visible
    When I click "Next" page button
    Then the next set of plant records should be displayed
    When I click "Previous" page button
    Then the previous set of plant records should be displayed
    And the plant list should be updated correctly without errors

  # SEARCH FUNCTIONALITY
Scenario: UI TC 39 - Verify searching by plant name updates the displayed results
    Given plants exist with different names
    When I enter a valid plant name or partial name in the search field
    Then only plants matching the searched term should be displayed
    And non-matching plants should be hidden
    When I clear the search input
    Then all the plant records should be displayed

Scenario: UI TC 40 - Verify “No plants found” message is displayed when list is empty
    Given no plants exist or the search returns no results
    When I perform a search using a non-existing plant name
    Then the message "No plants found" is displayed clearly
    And no plant cards or rows are shown


  # VISUAL INDICATORS
Scenario: UI TC 41 - Verify “Low” badge is visually displayed on plant card when stock is low
    Given a plant exists with quantity less than 5
    When I locate the plant with low quantity
    Then a “Low” badge is displayed on the corresponding plant card or rows
    And the badge should be visually distinct
    And the badge should be clearly associated with the low stock plant
