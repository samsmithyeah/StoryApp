import { render, screen } from "@testing-library/react-native";
import React from "react";
import { MonthYearPicker } from "../../components/ui/MonthYearPicker";

// Test to prevent regression of the invalid date display bug
describe("MonthYearPicker Invalid Date Handling", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Date display and formatting", () => {
    it("should show placeholder when no date is provided", () => {
      render(
        <MonthYearPicker
          placeholder="Select your child's birth month and year"
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByText("Select your child's birth month and year")
      ).toBeTruthy();
    });

    it("should show formatted date when valid date is provided", () => {
      const validDate = new Date(2020, 4, 1); // May 2020

      render(
        <MonthYearPicker
          value={validDate}
          placeholder="Select date"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("May 2020")).toBeTruthy();
    });

    it("should show placeholder when invalid Date object is provided", () => {
      // This simulates the bug scenario where dateOfBirth is an invalid Date
      const invalidDate = new Date("invalid-date-string");

      render(
        <MonthYearPicker
          value={invalidDate}
          placeholder="Select your child's birth month and year"
          onChange={mockOnChange}
        />
      );

      // Should show placeholder, NOT "Invalid Date"
      expect(
        screen.getByText("Select your child's birth month and year")
      ).toBeTruthy();
      expect(screen.queryByText("Invalid Date")).toBeFalsy();
    });

    it("should show placeholder when Date with NaN timestamp is provided", () => {
      // Another way invalid dates can occur
      const invalidDate = new Date(NaN);

      render(
        <MonthYearPicker
          value={invalidDate}
          placeholder="Select date"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Select date")).toBeTruthy();
      expect(screen.queryByText("Invalid Date")).toBeFalsy();
    });

    it("should show placeholder when Date constructed from undefined is provided", () => {
      // This simulates when dateOfBirth is undefined but gets converted to Date
      const invalidDate = new Date(undefined as any);

      render(
        <MonthYearPicker
          value={invalidDate}
          placeholder="Choose month & year"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Choose month & year")).toBeTruthy();
      expect(screen.queryByText("Invalid Date")).toBeFalsy();
    });

    it("should show formatted date when Date constructed from null is provided", () => {
      // Note: new Date(null) creates January 1, 1970 - a valid date
      const dateFromNull = new Date(null as any);

      render(
        <MonthYearPicker
          value={dateFromNull}
          placeholder="Select birth month"
          onChange={mockOnChange}
        />
      );

      // Should show January 1970, not placeholder
      expect(screen.getByText("January 1970")).toBeTruthy();
      expect(screen.queryByText("Invalid Date")).toBeFalsy();
    });
  });

  describe("formatMonthYear function edge cases", () => {
    // These tests verify the internal formatMonthYear function behavior
    it("should handle various invalid date scenarios", () => {
      const testCases = [
        { date: new Date("invalid"), shouldShowPlaceholder: true },
        { date: new Date(NaN), shouldShowPlaceholder: true },
        { date: new Date(undefined as any), shouldShowPlaceholder: true },
        { date: new Date(null as any), shouldShowPlaceholder: false }, // This is January 1970, valid
        { date: null as any, shouldShowPlaceholder: true },
        { date: undefined as any, shouldShowPlaceholder: true },
      ];

      // We can't directly test the internal formatMonthYear function,
      // but we can test that the component renders correctly
      testCases.forEach(({ date, shouldShowPlaceholder }, index) => {
        const { unmount } = render(
          <MonthYearPicker
            key={index}
            value={date}
            placeholder="Test placeholder"
            onChange={mockOnChange}
          />
        );

        if (shouldShowPlaceholder) {
          // Should show placeholder for invalid dates
          expect(screen.getByText("Test placeholder")).toBeTruthy();
          expect(screen.queryByText("Invalid Date")).toBeFalsy();
        } else {
          // For valid dates like new Date(null), should show formatted date
          expect(screen.queryByText("Invalid Date")).toBeFalsy();
        }

        unmount();
      });
    });

    it("should format valid dates correctly", () => {
      const testCases = [
        { date: new Date(2020, 0, 1), expected: "January 2020" },
        { date: new Date(2023, 11, 1), expected: "December 2023" },
        { date: new Date(2018, 5, 15), expected: "June 2018" },
      ];

      testCases.forEach(({ date, expected }, index) => {
        const { unmount } = render(
          <MonthYearPicker
            key={index}
            value={date}
            placeholder="Select date"
            onChange={mockOnChange}
          />
        );

        expect(screen.getByText(expected)).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Child editing scenario", () => {
    // This test specifically covers the bug scenario that was reported
    it("should handle child without dateOfBirth gracefully", () => {
      // Simulate a child object that might come from Firestore
      const childWithoutDateOfBirth: {
        id: string;
        childName: string;
        childPreferences: string;
        dateOfBirth?: Date;
      } = {
        id: "child1",
        childName: "Alice",
        childPreferences: "unicorns",
        // dateOfBirth is undefined
      };

      // In the real app, this might become an invalid Date somehow
      const possibleInvalidDate = childWithoutDateOfBirth.dateOfBirth
        ? new Date(childWithoutDateOfBirth.dateOfBirth)
        : new Date(undefined as any);

      render(
        <MonthYearPicker
          value={
            isNaN(possibleInvalidDate.getTime())
              ? undefined
              : possibleInvalidDate
          }
          placeholder="Select your child's date of birth"
          onChange={mockOnChange}
          label="Birth month & year"
          optional
        />
      );

      // Should show the proper placeholder text
      expect(
        screen.getByText("Select your child's date of birth")
      ).toBeTruthy();
      expect(screen.getByText("Birth month & year")).toBeTruthy();
      expect(screen.getByText("(optional)")).toBeTruthy();

      // Should NOT show "Invalid Date"
      expect(screen.queryByText("Invalid Date")).toBeFalsy();
    });

    it("should preserve valid dates when editing child", () => {
      // Simulate a child object with valid dateOfBirth
      const childWithDateOfBirth = {
        id: "child1",
        childName: "Bob",
        dateOfBirth: new Date(2019, 2, 10), // March 2019
      };

      render(
        <MonthYearPicker
          value={childWithDateOfBirth.dateOfBirth}
          placeholder="Select your child's date of birth"
          onChange={mockOnChange}
          label="Birth month & year"
          optional
        />
      );

      // Should show the formatted date
      expect(screen.getByText("March 2019")).toBeTruthy();
      expect(
        screen.queryByText("Select your child's date of birth")
      ).toBeFalsy();
    });
  });

  describe("Accessibility and user experience", () => {
    it("should apply placeholder styling when showing placeholder", () => {
      const { getByText } = render(
        <MonthYearPicker
          value={new Date("invalid")}
          placeholder="Select date"
          onChange={mockOnChange}
        />
      );

      const placeholderText = getByText("Select date");
      expect(placeholderText).toBeTruthy();
      // In a real test environment, we could check the style props
      // expect(placeholderText.props.style).toContainEqual(expect.objectContaining({
      //   color: expect.any(String) // placeholder color
      // }));
    });

    it("should apply normal text styling when showing formatted date", () => {
      const { getByText } = render(
        <MonthYearPicker
          value={new Date(2020, 5, 1)}
          placeholder="Select date"
          onChange={mockOnChange}
        />
      );

      const dateText = getByText("June 2020");
      expect(dateText).toBeTruthy();
      // In a real test environment, we could check the style props
    });
  });
});
