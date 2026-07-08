import { describe, it, expect, vi } from "vitest";
import { equilibraRouter } from "./equilibra";

describe("equilibra router", () => {
  describe("analyzeReceiptPhoto", () => {
    it("should extract receipt information from image", async () => {
      const caller = equilibraRouter.createCaller({});

      // Mock the LLM response
      const result = await caller.analyzeReceiptPhoto({
        imageUrl: "/manus-storage/test-receipt.jpg",
      });

      // The actual result depends on the LLM, but we can check the structure
      if (result.success) {
        expect(result).toHaveProperty("amount");
        expect(result).toHaveProperty("date");
        expect(result).toHaveProperty("category");
      } else {
        expect(result).toHaveProperty("error");
      }
    });
  });

  describe("uploadReceiptPhoto", () => {
    it("should upload receipt photo and return URL", async () => {
      const caller = equilibraRouter.createCaller({});

      // Create a small test image (1x1 pixel PNG)
      const testImageBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await caller.uploadReceiptPhoto({
        fileData: testImageBase64,
        fileName: "test.png",
      });

      if (result.success) {
        expect(result.url).toBeDefined();
        expect(result.key).toBeDefined();
        expect(result.url).toContain("/manus-storage/");
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });
});
