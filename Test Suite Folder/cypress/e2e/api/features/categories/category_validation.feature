Feature: Category API Validation

  Scenario: API_TC_01 - Verify that the API rejects non-string data types for Category Name
    Given the API Service is running
    And an Admin Auth Token is available
    When I send a POST request to create a category with numeric name 12345
    Then the category response status should be 400
    And the response body should confirm "Validation failed" for category name