@unit
Feature: Server Factory - Unit Tests

  The createServer factory returns a configured McpServer instance.

  Scenario: createServer returns an McpServer
    When I create a server instance
    Then the server should be an McpServer

  Scenario: Server has coffee domain tools registered
    When I create a server instance
    Then the server should have a "get-coffees" tool
    And the server should have a "get-a-coffee" tool
