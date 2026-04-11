@e2e
Feature: Coffee Domain - End-to-End Tests

  Full MCP protocol flows via in-process client and HTTP transport.

  @in-process
  Scenario: Full MCP flow via in-process client
    Given an MCP server with in-process client
    When I initialize the MCP session
    And I list tools via the MCP client
    Then the tool list should contain "get-coffees" and "get-a-coffee"
    When I call "get-coffees" via the MCP client
    Then the MCP response should contain 4 coffees
    When I call "get-a-coffee" with name "Espresso" via the MCP client
    Then the MCP response should contain a coffee named "Espresso"

  @http
  Scenario: Full MCP flow via HTTP transport
    Given an MCP HTTP server is running
    When I send an initialize request via HTTP
    Then I should receive a valid session ID
    When I list tools via HTTP
    Then the HTTP tool list should contain "get-coffees" and "get-a-coffee"
    When I call "get-coffees" via HTTP
    Then the HTTP response should contain 4 coffees

  @http
  Scenario: Health endpoint returns ok
    Given an MCP HTTP server is running
    When I request the health endpoint
    Then the health response should be ok

  @http
  Scenario: Session termination via DELETE
    Given an MCP HTTP server is running
    When I send an initialize request via HTTP
    And I terminate the session via HTTP
    Then the session should be terminated
