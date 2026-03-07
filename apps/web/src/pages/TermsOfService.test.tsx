import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { TermsOfService } from "./TermsOfService";

describe("TermsOfService", () => {
  function renderTermsOfService() {
    return render(
      <MemoryRouter>
        <TermsOfService />
      </MemoryRouter>,
    );
  }

  it("renders the terms of service heading", () => {
    renderTermsOfService();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/terms of service/i);
  });

  it("has a link back to home", () => {
    renderTermsOfService();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });

  it("displays acceptance of terms section", () => {
    renderTermsOfService();
    expect(screen.getByText(/acceptance of terms/i)).toBeInTheDocument();
  });

  it("displays user accounts section with age requirement", () => {
    renderTermsOfService();
    expect(screen.getByText(/user accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/at least 16 years/i)).toBeInTheDocument();
  });

  it("displays acceptable use section", () => {
    renderTermsOfService();
    expect(screen.getByText(/acceptable use/i)).toBeInTheDocument();
  });

  it("displays intellectual property section", () => {
    renderTermsOfService();
    expect(screen.getByText(/intellectual property/i)).toBeInTheDocument();
  });

  it("displays limitation of liability section", () => {
    renderTermsOfService();
    expect(screen.getByText(/limitation of liability/i)).toBeInTheDocument();
  });

  it("displays educational content disclaimer", () => {
    renderTermsOfService();
    expect(screen.getByText(/educational content disclaimer/i)).toBeInTheDocument();
  });

  it("displays description of service section", () => {
    renderTermsOfService();
    expect(screen.getByText(/description of service/i)).toBeInTheDocument();
  });

  it("displays termination section", () => {
    renderTermsOfService();
    expect(screen.getByText(/8\. termination/i)).toBeInTheDocument();
  });

  it("displays governing law section", () => {
    renderTermsOfService();
    expect(screen.getByText(/governing law/i)).toBeInTheDocument();
  });

  it("displays changes to terms section", () => {
    renderTermsOfService();
    expect(screen.getByText(/changes to terms/i)).toBeInTheDocument();
  });
});
