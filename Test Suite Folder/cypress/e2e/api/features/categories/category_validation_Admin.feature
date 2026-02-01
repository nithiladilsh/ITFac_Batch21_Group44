Feature: Category API Validation

  Scenario: API_TC_01 - Verify that the API rejects non-string data types for Category Name
    Given the API Service is running
    And an Admin Auth Token is available
    When I send a POST request to create a category with numeric name 123456
    Then the category response status should be 400
    And the response body should confirm "Validation failed" for category name

  Scenario: API_TC_02 - Verify that the API rejects creation with a non-existent Parent ID
    Given the API Service is running
    And an Admin Auth Token is available
    When I send a POST request to create a category with non-existent parent "99999"
    Then the category response status should be 400
    And the response body should confirm "Validation failed"
