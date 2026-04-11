@contract
Feature: Get A Coffee Service - Contract Tests

  Response and input schema conform to ToolTextResponse and Zod DTO contracts.

  Scenario: Response conforms to ToolTextResponse shape
    Given the get-a-coffee module is registered
    When I call the "get-a-coffee" tool with name "Espresso"
    Then the response should have a "content" array
    And the first content item should have type "text"
    And the first content item text should be valid JSON

  Scenario: Found coffee conforms to Coffee interface
    Given the get-a-coffee module is registered
    When I call the "get-a-coffee" tool with name "Espresso"
    Then the coffee in the response should conform to the Coffee interface

  Scenario: Input schema requires a name string
    Given the get-a-coffee module is registered
    Then the "get-a-coffee" tool should have an input schema requiring "name"
