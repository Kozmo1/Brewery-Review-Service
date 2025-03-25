import { ReviewController } from "../reviewController";
import { Request, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import axios from "axios";

// Mock axios for API calls
jest.mock("axios", () => ({
	get: jest.fn(),
	post: jest.fn(),
	put: jest.fn(),
	delete: jest.fn(),
}));

describe("ReviewController", () => {
	let reviewController: ReviewController;
	let mockRequest: Partial<AuthRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock;

	// Fresh setup before each test
	beforeEach(() => {
		reviewController = new ReviewController();
		mockRequest = {
			user: { id: 1, email: "test@example.com" },
			headers: { authorization: "Bearer mock-token" },
			body: {},
			params: {},
		};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		mockNext = jest.fn();
		// Clear mocks to keep it clean
		jest.clearAllMocks();
		// Silence console.error during tests
		jest.spyOn(console, "error").mockImplementation(() => {});
	});

	describe("addReview", () => {
		// Setup for addReview with string userId (realistic request)
		beforeEach(() => {
			mockRequest.body = {
				userId: "1", // String, as from a real request
				productId: 2,
				reviewRating: 4.5,
				reviewMessage: "Great beer!",
			};
		});

		it("should bounce with 403 if userId doesn’t match req.user", async () => {
			mockRequest.body.userId = "2"; // String, parsed to 2

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
			expect(axios.get).not.toHaveBeenCalled(); // No API calls
		});

		it("should add review and return 201 when all’s good", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({ data: {} });
			(axios.post as jest.Mock).mockResolvedValueOnce({
				data: { id: 1 },
			});

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/inventory/2"
			);
			expect(axios.post).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews",
				{
					UserId: 1, // Parsed to number
					ProductId: 2,
					ReviewRating: 4.5,
					ReviewMessage: "Great beer!",
				}
			);
			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should handle product check failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: {
					status: 404,
					data: { message: "Product not found" },
				},
			});

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Product not found",
				error: undefined,
			});
		});

		it("should handle review post failure", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({ data: {} });
			(axios.post as jest.Mock).mockRejectedValueOnce({
				response: { status: 400, data: { message: "Bad review" } },
			});

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Bad review",
				error: undefined,
			});
		});

		it("should handle generic error", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce(
				new Error("Network glitch")
			);

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Error adding review",
				error: "Network glitch",
			});
		});

		it("should handle req.user undefined", async () => {
			mockRequest.user = undefined;

			await reviewController.addReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
			expect(axios.get).not.toHaveBeenCalled(); // No API calls
		});
	});

	describe("getReviewById", () => {
		beforeEach(() => {
			mockRequest.params = { id: "1" };
		});

		it("should fetch review and return 200", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { id: 1 },
			});

			await reviewController.getReviewById(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1"
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should handle fetch failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: { status: 404, data: { message: "Not found" } },
			});

			await reviewController.getReviewById(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Not found",
				error: undefined,
			});
		});
	});

	describe("updateReview", () => {
		beforeEach(() => {
			mockRequest.params = { id: "1" };
			mockRequest.body = { reviewRating: 5 };
		});

		it("should block with 403 if user doesn’t own review", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 2, ProductId: 2 },
			});

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
		});

		it("should update review and return 200", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});
			(axios.put as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1"
			);
			expect(axios.put).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1",
				{
					Id: 1,
					UserId: 1,
					ProductId: 2,
					ReviewRating: 5,
				}
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should update review with message only", async () => {
			mockRequest.body = { reviewMessage: "Updated review!" };
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});
			(axios.put as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.put).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1",
				{
					Id: 1,
					UserId: 1,
					ProductId: 2,
					ReviewMessage: "Updated review!",
				}
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should update review with both rating and message", async () => {
			mockRequest.body = {
				reviewRating: 4,
				reviewMessage: "Revised opinion!",
			};
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});
			(axios.put as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.put).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1",
				{
					Id: 1,
					UserId: 1,
					ProductId: 2,
					ReviewRating: 4,
					ReviewMessage: "Revised opinion!",
				}
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should handle empty body update", async () => {
			mockRequest.body = {};
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});
			(axios.put as jest.Mock).mockResolvedValueOnce({ data: { id: 1 } });

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.put).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1",
				{
					Id: 1,
					UserId: 1,
					ProductId: 2,
				}
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
		});

		it("should handle req.user undefined", async () => {
			mockRequest.user = undefined;
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
		});

		it("should handle fetch failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: { status: 404, data: { message: "Gone" } },
			});

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Gone",
				error: undefined,
			});
		});

		it("should handle update failure", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1, ProductId: 2 },
			});
			(axios.put as jest.Mock).mockRejectedValueOnce({
				response: { status: 400, data: { message: "Bad update" } },
			});

			await reviewController.updateReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Bad update",
				error: undefined,
			});
		});
	});

	describe("deleteReview", () => {
		beforeEach(() => {
			mockRequest.params = { id: "1" };
		});

		it("should block with 403 if user doesn’t own review", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 2 },
			});

			await reviewController.deleteReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
		});

		it("should delete review and return 200", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1 },
			});
			(axios.delete as jest.Mock).mockResolvedValueOnce({});

			await reviewController.deleteReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1"
			);
			expect(axios.delete).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/1"
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Review deleted successfully",
			});
		});

		it("should handle req.user undefined", async () => {
			mockRequest.user = undefined;
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: { UserId: 1 },
			});

			await reviewController.deleteReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(403);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Unauthorized",
			});
		});

		it("should handle fetch failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: { status: 404, data: { message: "Gone" } },
			});

			await reviewController.deleteReview(
				mockRequest as AuthRequest,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(404);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Gone",
				error: undefined,
			});
		});
	});

	describe("getAllReviews", () => {
		it("should fetch all reviews and return 200", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: [{ id: 1 }],
			});

			await reviewController.getAllReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews"
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1 }]);
		});

		it("should handle fetch failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: { status: 500, data: { message: "Server down" } },
			});

			await reviewController.getAllReviews(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Server down",
				error: undefined,
			});
		});
	});

	describe("getReviewsByProduct", () => {
		beforeEach(() => {
			mockRequest.params = { productId: "2" };
		});

		it("should fetch product reviews and return 200", async () => {
			(axios.get as jest.Mock).mockResolvedValueOnce({
				data: [{ id: 1 }],
			});

			await reviewController.getReviewsByProduct(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(axios.get).toHaveBeenCalledWith(
				"http://localhost:5089/api/reviews/product/2"
			);
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1 }]);
		});

		it("should handle fetch failure", async () => {
			(axios.get as jest.Mock).mockRejectedValueOnce({
				response: { status: 500, data: { message: "Oops" } },
			});

			await reviewController.getReviewsByProduct(
				mockRequest as Request,
				mockResponse as Response,
				mockNext
			);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Oops",
				error: undefined,
			});
		});
	});
});
