Feature: Plant API Validation (User)

Background:
    Given the API Service is running
    And a User Auth Token is available

Scenario: API_TC_29 - Verify non-admin cannot add a plant
    Given a valid plant sub-category exists
    When I send a POST request to create a plant as a non-admin
    Then the plant response status should be 403
    Then the response indicates non-admin access is forbidden

Scenario: API_TC_30 - Verify plants can be searched by name
    When I search for plants by name "Rose"
    Then the search response status should be 200
    And the response contains plants matching "Aloevera"

Scenario: API_TC_31 - Verify message returned when no plants exist
    Given no plants exist in the system
    When I fetch all plants
    Then the response status should be 200
    And the response indicates "No plants found"

Scenario: API_TC_32 - Verify low stock flag is true when quantity is below 5
    Given a plant with quantity below 5 exists
    When I fetch all plants for low stock check
    Then the response status should be 200
    And plants with quantity less than 5 have lowStock true

Scenario: API_TC_33 - Verify low stock flag is false when quantity is 5 or more
    Given a plant with quantity of at least 5 exists
    When I fetch all plants for normal stock check
    Then the response status should be 200
    And plants with quantity of at least 5 have lowStock false
