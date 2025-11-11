import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { FileUpload } from "@/components/ui/file-upload";

jest.mock("@/lib/media.utils", () => ({
  getMediaDuration: jest.fn(),
}));

const { getMediaDuration } = jest.requireMock("@/lib/media.utils") as {
  getMediaDuration: jest.Mock;
};

const createFile = (name: string, type: string) =>
  new File(["dummy"], name, { type });

describe("FileUpload media validation", () => {
  const onFileSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    onFileSelect.mockReset();
  });

  it("rejects videos longer than 5 minutes", async () => {
    getMediaDuration.mockResolvedValue(360);

    const { container } = render(
      <FileUpload onFileSelect={onFileSelect} resourceType="video" />
    );

    const file = createFile("lesson.mp4", "video/mp4");
    const input = container.querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(getMediaDuration).toHaveBeenCalledTimes(1);
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/El video dura/)).toBeInTheDocument();
    });
  });

  it("rejects audios longer than 5 minutes", async () => {
    getMediaDuration.mockResolvedValue(400);

    const { container } = render(
      <FileUpload onFileSelect={onFileSelect} resourceType="audio" />
    );

    const file = createFile("podcast.mp3", "audio/mpeg");
    const input = container.querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(getMediaDuration).toHaveBeenCalledTimes(1);
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/El audio dura/)).toBeInTheDocument();
    });
  });

  it("allows audio shorter than 5 minutes", async () => {
    getMediaDuration.mockResolvedValue(120);

    const { container } = render(
      <FileUpload onFileSelect={onFileSelect} resourceType="audio" />
    );

    const file = createFile("short.mp3", "audio/mpeg");
    const input = container.querySelector(
      "input[type='file']"
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(getMediaDuration).toHaveBeenCalledTimes(1);
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    expect(screen.queryByText(/El audio dura/)).not.toBeInTheDocument();
  });
});
