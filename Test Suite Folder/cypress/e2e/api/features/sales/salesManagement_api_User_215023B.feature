Feature: Sales API - User Scenarios

  Background:
    Given the API Service is running
    And a User Auth Token is available
  
  Scenario: API TC 19 - Verify Sales Record Retrieval for a non-existing ID
    When I send a GET request for sales record with non-existent ID 88888
    Then the sales response status should be 404
    And the response body should confirm "not found" or "does not exist"

  Scenario: API TC 20 -  Verify Sales creation for normal use
    When I send a POST request to sell a plant with valid data as a User
    Then the sales response status should be 403
    And the response body should confirm "Forbidden" or "Access Denied"

  Scenario: API TC 21 -  Verify Sales deletion for normal user
    When I send a DELETE request for an existing sales record as a User
    Then the sales response status should be 403
    And the response body should confirm "Forbidden" or "Access Denied"

  Scenario: API TC 22 - Verify Sales retrieval using a String ID
    When I send a GET request for sales record with string ID "ABC"
    Then the sales response status should be 400
    And the response body should confirm "type mismatch" or "Invalid format"
    When I send a GET request for sales record with string ID "ABC"
    Then the sales response status should be 400
    And the response body should confirm "type mismatch" or "Invalid format"

  Scenario: API TC 23 -  Verify Sale Deletion using a String ID
    When I send a DELETE request with string ID "XYZ"
    Then the sales response status should be 400
    And the response body should confirm "type mismatch" or "Invalid format"