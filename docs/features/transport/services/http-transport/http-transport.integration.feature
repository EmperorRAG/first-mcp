@integration
Feature: HTTP Transport - Integration Tests

  The HTTP transport exposes MCP endpoints and health check.

  Scenario: Health endpoint returns ok
    Given an HTTP transport server is started
    When I request GET "/health"
    Then the response status should be 200
    And the response body should have status "ok"

  Scenario: POST /mcp without initialize returns 400
    Given an HTTP transport server is started
    When I send a POST to "/mcp" with an invalid body
    Then the response status should be 400

  Scenario: GET /mcp without session returns 400
    Given an HTTP transport server is started
    When I request GET "/mcp"
    Then the response status should be 400

  Scenario: DELETE /mcp without session returns 400
    Given an HTTP transport server is started
    When I send DELETE to "/mcp"
    Then the response status should be 400
