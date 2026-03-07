import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { PrivacyPolicy } from "./PrivacyPolicy";

describe("PrivacyPolicy", () => {
  function renderPrivacyPolicy() {
    return render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>,
    );
  }

  it("renders the privacy policy heading", () => {
    renderPrivacyPolicy();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/privacy policy/i);
  });

  it("has a link back to home", () => {
    renderPrivacyPolicy();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });

  it("displays data collection section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/data we collect/i)).toBeInTheDocument();
  });

  it("displays GDPR rights section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/your rights \(gdpr\)/i)).toBeInTheDocument();
  });

  it("displays data retention section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/data retention/i)).toBeInTheDocument();
  });

  it("displays cookies and sessions section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/cookies & sessions/i)).toBeInTheDocument();
  });

  it("displays contact information section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/contact information/i)).toBeInTheDocument();
  });

  it("displays introduction section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/1\. introduction/i)).toBeInTheDocument();
  });

  it("displays how we use your data section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/how we use your data/i)).toBeInTheDocument();
  });

  it("displays data storage and security section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/data storage & security/i)).toBeInTheDocument();
  });

  it("displays third-party sharing section", () => {
    renderPrivacyPolicy();
    expect(screen.getByText(/third-party sharing/i)).toBeInTheDocument();
  });
});
