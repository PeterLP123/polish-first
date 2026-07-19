// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import DiacriticsBar from "./DiacriticsBar.jsx";

function Harness() {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  return (
    <>
      <DiacriticsBar inputRef={inputRef} value={value} onChange={setValue} />
      <input ref={inputRef} aria-label="Polish answer" value={value} onChange={(event) => setValue(event.target.value)} />
    </>
  );
}

describe("DiacriticsBar", () => {
  afterEach(cleanup);

  it("inserts letters at the caret and lets typing continue", async () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Polish answer" });
    fireEvent.change(input, { target: { value: "Dzi" } });
    input.setSelectionRange(3, 3);

    fireEvent.click(screen.getByRole("button", { name: "Insert ę" }));
    expect(input).toHaveValue("Dzię");

    fireEvent.change(input, { target: { value: "Dziękuj" } });
    input.setSelectionRange(7, 7);
    fireEvent.click(screen.getByRole("button", { name: "Insert ę" }));
    expect(input).toHaveValue("Dziękuję");
  });

  it("keeps focus in the input after pointer insertion", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Polish answer" });
    input.focus();
    fireEvent.pointerDown(screen.getByRole("button", { name: "Insert ł" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert ł" }));
    expect(input).toHaveValue("ł");
    expect(document.activeElement).toBe(input);
  });
});
