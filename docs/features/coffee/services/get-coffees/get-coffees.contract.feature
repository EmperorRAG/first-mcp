@contract
Feature: Get Coffees Service - Contract Tests

  Response conforms to ToolTextResponse and MCP tool schema contracts.

  Scenario: Response conforms to ToolTextResponse shape
    Given the get-coffees module is registered
    When I call the "get-coffees" tool
    Then the response should have a "content" array
    And the first content item should have type "text"
    And the first content item text should be valid JSON

  Scenario: Response content contains Coffee objects
    Given the get-coffees module is registered
    When I call the "get-coffees" tool
    Then each coffee in the response should conform to the Coffee interface
