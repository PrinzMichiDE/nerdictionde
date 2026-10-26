import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ShareButtons } from "@/components/ui/ShareButtons";

vi.mock("@/lib/feature-flags", () => ({
  FEATURE_SOCIAL_SHARING: true,
  FEATURE_SHARE_TRACKING: true,
}));

vi.mock("@/lib/share-urls", () => ({
  buildShareUrls: vi.fn(() => ({
    twitter: "https://twitter.com/intent/tweet?text=Test",
    bluesky: "https://bsky.app/intent/compose?text=Test",
    mastodon: "https://mastodon.social/share?text=Test",
    reddit: "https://reddit.com/submit?url=Test",
    discord: "https://discord.com/share?url=Test",
    copyLink: "https://nerdiction.de/reviews/test",
  })),
  getPlatformDisplayName: vi.fn((p: string) => p),
  getPlatformIcon: vi.fn((p: string) => p),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <span data-testid="dropdown-trigger">{children}</span>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props} data-testid="dropdown-item">
      {children}
    </button>
  ),
  DropdownMenuSeparator: ({ ...props }: any) => <div {...props} data-testid="dropdown-separator" />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogTrigger: ({ children }: any) => <span data-testid="dialog-trigger">{children}</span>,
  DialogClose: ({ ...props }: any) => <button {...props} data-testid="dialog-close" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, size, className, "aria-label": ariaLabel, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label data-testid="label">{children}</label>,
}));

const defaultProps = {
  contentType: "review" as const,
  contentId: "review-1",
  title: "Test Review",
  url: "/reviews/test-review",
  description: "A great review",
};

describe("ShareButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.open = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders inline variant with all 6 platforms by default", () => {
    render(<ShareButtons {...defaultProps} variant="inline" />);

    const buttons = screen.getAllByTestId("button");
    expect(buttons.length).toBe(6);
  });

  it("renders minimal variant with 6 buttons", () => {
    render(<ShareButtons {...defaultProps} variant="minimal" />);

    const buttons = screen.getAllByTestId("button");
    expect(buttons.length).toBe(6);
  });

  it("renders dropdown variant with trigger", () => {
    render(<ShareButtons {...defaultProps} variant="dropdown" />);

    expect(screen.getByTestId("dropdown-trigger")).toBeTruthy();
  });

  it("filters platforms when platforms prop is provided", () => {
    render(<ShareButtons {...defaultProps} platforms={["TWITTER", "COPY_LINK"]} />);

    const buttons = screen.getAllByTestId("button");
    expect(buttons.length).toBe(2);
  });

  it("has correct aria labels on all buttons", () => {
    render(<ShareButtons {...defaultProps} variant="inline" />);

    const buttons = screen.getAllByTestId("button");
    buttons.forEach((button) => {
      expect(button.getAttribute("aria-label")).toBeTruthy();
    });
  });

  it("applies custom className", () => {
    const { container } = render(<ShareButtons {...defaultProps} variant="inline" className="custom-class" />);

    const group = container.querySelector('[role="group"]');
    expect(group?.classList.contains("custom-class")).toBe(true);
  });

  it("renders platform names in inline variant", () => {
    render(<ShareButtons {...defaultProps} variant="inline" />);

    const platformNames = ["TWITTER", "BLUESKY", "MASTODON", "REDDIT", "DISCORD", "COPY_LINK"];
    platformNames.forEach((name) => {
      const elements = screen.getAllByText(name);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});