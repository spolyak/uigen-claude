import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

describe("ToolCallBadge", () => {
  describe("str_replace_editor tool", () => {
    it("shows 'Creating <filename>' for create command", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "create", path: "/components/Card.jsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Creating Card.jsx")).toBeDefined();
    });

    it("shows 'Editing <filename>' for str_replace command", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "str_replace", path: "/components/Button.tsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Editing Button.tsx")).toBeDefined();
    });

    it("shows 'Editing <filename>' for insert command", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "insert", path: "/App.jsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Editing App.jsx")).toBeDefined();
    });

    it("shows 'Reading <filename>' for view command", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "view", path: "/src/index.ts" }}
          done={false}
        />
      );
      expect(screen.getByText("Reading index.ts")).toBeDefined();
    });

    it("shows 'Reverting <filename>' for undo_edit command", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "undo_edit", path: "/src/utils.ts" }}
          done={false}
        />
      );
      expect(screen.getByText("Reverting utils.ts")).toBeDefined();
    });

    it("extracts filename from nested path", () => {
      render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "create", path: "/src/components/ui/Modal.tsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Creating Modal.tsx")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("shows 'Renaming <filename> → <new filename>'", () => {
      render(
        <ToolCallBadge
          toolName="file_manager"
          args={{ command: "rename", path: "/OldName.jsx", new_path: "/NewName.jsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Renaming OldName.jsx → NewName.jsx")).toBeDefined();
    });

    it("shows 'Renaming <filename>' when new_path is absent", () => {
      render(
        <ToolCallBadge
          toolName="file_manager"
          args={{ command: "rename", path: "/OldName.jsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Renaming OldName.jsx")).toBeDefined();
    });

    it("shows 'Deleting <filename>' for delete command", () => {
      render(
        <ToolCallBadge
          toolName="file_manager"
          args={{ command: "delete", path: "/src/Unused.tsx" }}
          done={false}
        />
      );
      expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
    });
  });

  describe("unknown tool", () => {
    it("falls back to the raw tool name", () => {
      render(
        <ToolCallBadge
          toolName="some_unknown_tool"
          args={{}}
          done={false}
        />
      );
      expect(screen.getByText("some_unknown_tool")).toBeDefined();
    });
  });

  describe("done state", () => {
    it("renders a green dot when done", () => {
      const { container } = render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          done={true}
        />
      );
      expect(container.querySelector(".bg-emerald-500")).toBeDefined();
      expect(container.querySelector(".animate-spin")).toBeNull();
    });

    it("renders a spinner when not done", () => {
      const { container } = render(
        <ToolCallBadge
          toolName="str_replace_editor"
          args={{ command: "create", path: "/App.jsx" }}
          done={false}
        />
      );
      expect(container.querySelector(".animate-spin")).toBeDefined();
      expect(container.querySelector(".bg-emerald-500")).toBeNull();
    });
  });
});
