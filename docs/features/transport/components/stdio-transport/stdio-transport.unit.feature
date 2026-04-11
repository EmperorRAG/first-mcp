@unit
Feature: Stdio Transport - Unit Tests

  The stdio transport module exports a startStdioServer function.

  Scenario: startStdioServer is a function
    Given the stdio transport module is loaded
    Then startStdioServer should be a function
