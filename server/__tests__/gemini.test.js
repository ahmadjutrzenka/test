const mockGenerate = jest.fn();

jest.mock("@google/genai", () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerate,
    },
  })),
}));

const { generateContent, parseGeminiJSON } = require("../helpers/gemini");

describe("helpers/gemini", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generateContent mengembalikan text dari SDK", async () => {
    mockGenerate.mockResolvedValue({ text: '{"anime":[]}' });

    const result = await generateContent("test prompt");

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(mockGenerate).toHaveBeenCalledWith({
      model: "gemini-3-flash-preview",
      contents: "test prompt",
    });
    expect(result).toBe('{"anime":[]}');
  });

  it("parseGeminiJSON mengubah JSON valid menjadi object", () => {
    const parsed = parseGeminiJSON('{"manga":[]}');
    expect(parsed).toEqual({ manga: [] });
  });

  it("parseGeminiJSON melempar BadRequest untuk JSON invalid", () => {
    expect(() => parseGeminiJSON("bukan-json")).toThrow();

    try {
      parseGeminiJSON("bukan-json");
    } catch (error) {
      expect(error).toEqual({
        name: "BadRequest",
        message: "AI returned an invalid format. Please try again.",
      });
    }
  });
});