import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { FilterDropdown, FilterTag } from "@/components/media/SermonFilters";
import { User } from "lucide-react";

describe("FilterDropdown", () => {
  const options = [
    { value: 1, label: "Speaker A", count: 10 },
    { value: 2, label: "Speaker B", count: 5 },
    { value: 3, label: "Speaker C", count: 0 },
  ];

  it("renders all options plus the 'All' default", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={() => {}}
        isLoading={false}
        id="test-filter"
      />,
    );
    const select = screen.getByRole("combobox");
    // Default + 3 options = 4
    expect(select.querySelectorAll("option")).toHaveLength(4);
  });

  it("shows 'All Speakers' as default option", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={() => {}}
        isLoading={false}
        id="test-filter"
      />,
    );
    expect(screen.getByText("All Speakers")).toBeInTheDocument();
  });

  it("shows count in option text when not hidden", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={() => {}}
        isLoading={false}
        id="test-filter"
      />,
    );
    expect(screen.getByText("Speaker A (10)")).toBeInTheDocument();
    expect(screen.getByText("Speaker B (5)")).toBeInTheDocument();
  });

  it("hides count when hideCount is true", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Year"
        value={undefined}
        options={[{ value: 2025, label: "2025", count: 10 }]}
        onChange={() => {}}
        isLoading={false}
        id="test-filter"
        hideCount
      />,
    );
    // Should show "2025 " (no count), not "2025 (10)"
    expect(screen.queryByText("2025 (10)")).not.toBeInTheDocument();
  });

  it("calls onChange with numeric value on selection", () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={onChange}
        isLoading={false}
        id="test-filter"
      />,
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onChange with undefined when 'All' is selected", () => {
    const onChange = vi.fn();
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={1}
        options={options}
        onChange={onChange}
        isLoading={false}
        id="test-filter"
      />,
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("disables select when loading", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={() => {}}
        isLoading={true}
        id="test-filter"
      />,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("sets the correct id on the select element", () => {
    render(
      <FilterDropdown
        icon={<User className="w-4 h-4" />}
        label="Speaker"
        value={undefined}
        options={options}
        onChange={() => {}}
        isLoading={false}
        id="my-custom-id"
      />,
    );
    expect(document.getElementById("my-custom-id")).toBeInTheDocument();
  });
});

describe("FilterTag", () => {
  it("renders the label", () => {
    render(<FilterTag label="Pastor Smith" onRemove={() => {}} />);
    expect(screen.getByText("Pastor Smith")).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<FilterTag label="2024" onRemove={onRemove} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
