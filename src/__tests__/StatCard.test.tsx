import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StatCard } from "@/components/shared/StatCard";
import { Headphones } from "lucide-react";

describe("StatCard", () => {
  it("renders the label and value", () => {
    render(
      <StatCard
        label="Total Questions"
        value={42}
        icon={Headphones}
        color="bg-primary/10 text-primary"
      />,
    );
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Total Questions")).toBeInTheDocument();
  });

  it("renders string values", () => {
    render(
      <StatCard
        label="Status"
        value="Active"
        icon={Headphones}
        color="bg-green-100 text-green-600"
      />,
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = render(
      <StatCard
        label="Test"
        value={10}
        icon={Headphones}
        color="bg-blue-100 text-blue-600"
      />,
    );
    // Lucide icons render as SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies color class to icon container", () => {
    const { container } = render(
      <StatCard
        label="Test"
        value={0}
        icon={Headphones}
        color="bg-red-100 text-red-600"
      />,
    );
    const iconContainer = container.querySelector(".bg-red-100");
    expect(iconContainer).toBeInTheDocument();
  });
});
