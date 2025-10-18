import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserManagementClient } from "../UserManagementClient";

const mockPromote = jest.fn();
const mockDemote = jest.fn();
const mockDelete = jest.fn();
const mockReset = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, unoptimized, src, alt, ...otherProps } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...otherProps} src={src} alt={alt || ""} />;
  },
}));

jest.mock("@/src/presentation/actions/profile.actions", () => ({
  promoteToTeacher: (...args: any[]) => mockPromote(...args),
  demoteToStudent: (...args: any[]) => mockDemote(...args),
}));

jest.mock("@/src/presentation/actions/user-management.actions", () => ({
  deleteUser: (...args: any[]) => mockDelete(...args),
  sendPasswordResetEmail: (...args: any[]) => mockReset(...args),
}));

const baseStudent = {
  id: "student-1",
  email: "student@example.com",
  fullName: "Student Example",
  avatarUrl: null,
  role: "student",
  displayName: "Student Example",
  createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
};

const baseTeacher = {
  id: "teacher-1",
  email: "teacher@example.com",
  fullName: "Teacher Example",
  avatarUrl: null,
  role: "teacher",
  displayName: "Teacher Example",
  createdAt: new Date("2024-01-02T00:00:00Z").toISOString(),
};

beforeEach(() => {
  mockPromote.mockResolvedValue({ success: true });
  mockDemote.mockResolvedValue({ success: true });
  mockDelete.mockResolvedValue({ success: true });
  mockReset.mockResolvedValue({ success: true });
  mockRefresh.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("UserManagementClient", () => {
  it("should display email and role badges for users", () => {
    render(
      <UserManagementClient students={[baseStudent]} teachers={[baseTeacher]} />
    );

    expect(screen.getByText(baseStudent.email)).toBeInTheDocument();
    expect(screen.getByText("Estudiante")).toBeInTheDocument();
    expect(screen.getByText(baseTeacher.email)).toBeInTheDocument();
    expect(screen.getByText("Docente")).toBeInTheDocument();
  });

  it("should only close after clicking the close button post-success", async () => {
    const user = userEvent.setup();

    render(<UserManagementClient students={[baseStudent]} teachers={[]} />);

    await user.click(screen.getAllByRole("button", { name: /promover/i })[0]);

    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /promover/i }));

    await waitFor(() =>
      expect(mockPromote).toHaveBeenCalledWith(baseStudent.id)
    );

    await waitFor(() =>
      expect(
        within(dialog).getByText("Usuario promovido a docente")
      ).toBeInTheDocument()
    );

    const closeButton = within(dialog).getByRole("button", { name: /cerrar/i });
    expect(closeButton).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /promover/i })
    ).not.toBeInTheDocument();

    await user.click(closeButton);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
