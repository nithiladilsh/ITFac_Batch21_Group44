Feature: Category API Validation (Admin)

    Background:
        Given the API Service is running
        And an Admin Auth Token is available

    Scenario: API_TC_34 - Verify that deletion for a category is allowed
        Given a category exists for deletion testing
        When the Admin sends a DELETE request to the category deletion endpoint with a valid Admin Token
        Then the API should respond with a 204 No Content status
        And the category should no longer exist

    Scenario: API_TC_35 - Verify that update for a category is allowed
        Given I create a category for update testing
        When the Admin sends a PUT request to the category update endpoint with a new name
        Then the API should respond with a 200 OK status
        And the category should have the updated name

    Scenario: API_TC_36 - Prevent deletion of category with active child categories
        Given Category A exists with Sub-Category B as its child
        When the Admin sends a DELETE request to the CategoryA endpoint with a valid Admin Token
        Then the API should respond with a 500 Internal Server Error status
        And the response message should indicate that the category cannot be deleted due to active child categories
        And Category A should still exist
        And Sub-Category B should still exist

    Scenario: API_TC_37 - Verify error on deleting non-existent Category ID
        Given Category ID 99999 does not exist
        When the Admin sends a DELETE request to the "/categories/99999" endpoint with a valid Admin Token
        Then the API should respond with a 404 Not Found status
        And the response message should indicate that the category does not exist
        And the system should remain stable

    Scenario: API_TC_38 - Verify that the API prevents updating a category name to a Null value
        Given I create a category for update testing
        And an Admin Auth Token is available
        When the Admin sends a PUT request to the category update endpoint with body
            | name   | parentId |
            | <null> | <null>   |
        Then the API should respond with a 400 Bad Request status
        And the response message should indicate "Name is required"

    Scenario: API_TC_39 - Verify that the API prevents updating a category name to one that already exists
        Given two categories "A" and "B" exist for update uniqueness testing
        When the Admin sends a PUT request to update category "B" with name "A"
        Then the API should respond with a 400 Bad Request or 403 Forbidden status
        And the response message should indicate "Name already exists"


    Scenario: API_TC_40 - Prevent category from becoming its own parent (Circular Reference)
        Given I create a category for circular parent testing
        When the Admin sends a PUT request to the category update endpoint with body
            | name   | parentId |
            | <null> | <self>   |
        Then the API should respond with a 400 Bad Request status
        And the response message should indicate "Category cannot be its own parent"

    Scenario: API_TC_41 - Verify that the API rejects updating a category's parent to a non-existent ID
        Given I create a category for parent integrity testing
        And an Admin Auth Token is available
        When the Admin sends a PUT request to the category update endpoint with body
            | parentId |
            | 99999    |
        Then the API should respond with a 400 Bad Request status or 404 Not Found status
        And the response message should indicate "Parent category not found"





