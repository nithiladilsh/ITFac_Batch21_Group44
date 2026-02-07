@api
Feature: Plant API Validation (Admin)

Background:
    Given the API Service is running
    And an Admin Auth Token is available

Scenario: API_TC_46 - Verify that the API allows updating Price and Quantity with valid values
    Given a valid plant exists for update
    When I send a PUT request to update the plant with valid price and quantity
    Then the plant response status should be 200
    And the response body should contain the updated price and quantity

Scenario: API_TC_47 - Verify that the API rejects updating Price to a zero or negative value
    Given a valid plant exists for update
    When I send a PUT request to update the plant with invalid price
    Then the plant response status should be 400
    And the response should indicate "Price must be greater than 0"

Scenario: API_TC_48 - Verify that the API rejects updating Quantity to a negative value
    Given a valid plant exists for update
    When I send a PUT request to update the plant with invalid quantity
    Then the plant response status should be 400
    And the response should indicate "Quantity cannot be negative"

Scenario: API_TC_49 - Verify that the API returns 400 when attempting to update a non-existent Plant ID
    Given a non-existent plant ID 9999
    When I send a PUT request to update the non-existent plant
    Then the plant response status should be 400

Scenario: API_TC_50 - Verify successful deletion of a plant by Admin
    Given a valid plant exists for deletion
    When I send a DELETE request to remove the plant
    Then the plant response status should be 204
    And the plant should no longer exist in the system