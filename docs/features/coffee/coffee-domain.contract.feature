@contract
Feature: Coffee Domain - Contract Tests

  MCP tool listing returns expected metadata conforming to protocol contracts.

  Scenario: Tool listing includes get-coffees metadata
    Given the coffee domain is registered on a server
    When I list the registered tools
    Then the "get-coffees" tool should have a description
    And the "get-coffees" tool should not require input

  Scenario: Tool listing includes get-a-coffee metadata
    Given the coffee domain is registered on a server
    When I list the registered tools
    Then the "get-a-coffee" tool should have a description
    And the "get-a-coffee" tool should require a "name" input
