Feature: Category Validation and Retrieval (Standard User)

    Background:
        Given the API Service is running
        And a User Auth Token is available

    Scenario: API_TC_42 Verify that the API correctly sorts the category list by Name in Ascending order
        Given multiple categories exist with different names
        When the user sends a GET request to "/categories/page?sort=name,asc" with a valid User Token
        Then the response status should be 200
        And the category list should be returned in alphabetical order by Name (A to Z)

    Scenario: API_TC_43 Verify that the API correctly sorts the category list by Parent Category in Ascending order
        Given multiple categories exist with different parent categories
        When the user sends a GET request to "/categories/page?sort=parent,asc" with a valid User Token
        Then the response status should be 200
        And the category list should be returned in ascending order by Parent Category (A to Z)

    Scenario: API_TC_44 Verify that the API rejects requests containing invalid sort fields
        Given multiple categories exist with different names
        When the user sends a GET request to "/categories/page?sort=invalid_col" with a valid User Token
        Then the API should respond with a 400 Bad Request status or 404 Not Found status
        And the response should contain the error message "Invalid sort field"

    Scenario: API_TC_45 Verify that the API correctly handles multiple sort parameters
        Given multiple categories exist with different parent categories and names
        When the user sends a GET request to "/categories/page?sort=parent,asc&sort=name,desc" with a valid User Token
        Then the response status should be 200
        And the category list should be sorted first by Parent Category in ascending order, then by Name in descending order

    Scenario: API_TC_46 Verify that Standard Users are forbidden from deleting categories
        Given a category exists to be deleted
        When the user sends a DELETE request to the category endpoint with a valid User Token
        Then the API should respond with a 403 Forbidden status or 401 Unauthorized status
        And the response message should indicate that the request is denied

    Scenario: API_TC_47 Verify that Standard Users are forbidden from updating categories
        Given a category exists to be updated
        When the user sends a PUT request to the category endpoint with a valid User Token
        Then the API should respond with a 403 Forbidden status or 401 Unauthorized status
        And the response message should indicate that the request is denied