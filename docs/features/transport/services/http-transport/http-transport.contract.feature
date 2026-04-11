@contract
Feature: HTTP Transport - Contract Tests

  The HTTP transport conforms to MCP Streamable HTTP protocol contracts.

  Scenario: Health endpoint returns JSON with status field
    Given an HTTP transport server is started
    When I request GET "/health"
    Then the response content-type should be "application/json"
    And the response body should have a "status" field of type "string"

  Scenario: Invalid POST returns JSON error
    Given an HTTP transport server is started
    When I send a POST to "/mcp" with an invalid body
    Then the response content-type should be "application/json"
    And the response body should have an "error" field
