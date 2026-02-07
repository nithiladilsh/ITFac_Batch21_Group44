@api
Feature: Plant API Validation (Admin)

Background:
    Given the API Service is running
    And an Admin Auth Token is available

Scenario: API_TC_24 - Verify plant is successfully added with valid data
    Given a valid plant category exists
    When I send a POST request to create a plant with valid data
    Then the plant response status should be 201
    And the response body should contain the newly created plant details

Scenario: API_TC_25 - Verify error when plant name is missing
    Given a valid plant category exists
    When I send a POST request to create a plant with empty name
    Then the plant response status should be 400
    And the response should indicate "Plant name must be between 3 and 25 characters"

Scenario: API_TC_26 - Verify error when plant name length is less than 3 characters
    Given a valid plant category exists
    When I send a POST request to create a plant with name shorter than 3 characters
    Then the plant response status should be 400
    And the response should indicate "Plant name must be between 3 and 25 characters"

Scenario: API_TC_27 - Verify error when price is zero
    Given a valid plant sub-category exists
    When I send a POST request to create a plant with price 0
    Then the plant response status should be 400
    And the response should indicate "Price must be greater than 0"

Scenario: API_TC_28 - Verify error when quantity is negative
    Given a valid plant sub-category exists
    When I send a POST request to create a plant with quantity -12
    Then the plant response status should be 400
    And the response should indicate "Quantity cannot be negative"
