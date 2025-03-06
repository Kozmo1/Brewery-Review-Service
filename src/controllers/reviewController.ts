import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import axios from "axios";
import { config } from "../config/config";
import { AuthRequest } from "../middleware/auth";

export class ReviewController {
	private readonly breweryApiUrl = config.breweryApiUrl;

	async addReview(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		if (req.user?.id !== req.body.userId.toString()) {
			res.status(403).json({ message: "Unauthorized" });
			return;
		}

		try {
			// Validate product exists
			await axios.get(
				`${this.breweryApiUrl}/api/inventory/${req.body.productId}`
			);
			const response = await axios.post(
				`${this.breweryApiUrl}/api/reviews`,
				req.body
			);
			res.status(201).json(response.data);
		} catch (error: any) {
			console.error(
				"Error adding review:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message: error.response?.data?.message || "Error adding review",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async getReviewById(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const response = await axios.get(
				`${this.breweryApiUrl}/api/reviews/${req.params.id}`
			);
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error fetching review:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 404).json({
				message: error.response?.data?.message || "Review not found",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async updateReview(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({ errors: errors.array() });
			return;
		}

		try {
			const reviewResponse = await axios.get<{ userId: string }>(
				`${this.breweryApiUrl}/api/reviews/${req.params.id}`
			);
			const reviewData = reviewResponse.data as { userId: string };
			if (req.user?.id !== reviewData.userId.toString()) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}
			const response = await axios.put(
				`${this.breweryApiUrl}/api/reviews/${req.params.id}`,
				req.body
			);
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error updating review:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 404).json({
				message: error.response?.data?.message || "Review not found",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async deleteReview(
		req: AuthRequest,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const reviewResponse = await axios.get(
				`${this.breweryApiUrl}/api/reviews/${req.params.id}`
			);
			const reviewData = reviewResponse.data as { userId: string };
			if (req.user?.id !== reviewData.userId.toString()) {
				res.status(403).json({ message: "Unauthorized" });
				return;
			}
			await axios.delete(
				`${this.breweryApiUrl}/api/reviews/${req.params.id}`
			);
			res.status(200).json({ message: "Review deleted successfully" });
		} catch (error: any) {
			console.error(
				"Error deleting review:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 404).json({
				message: error.response?.data?.message || "Review not found",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async getAllReviews(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const response = await axios.get(
				`${this.breweryApiUrl}/api/reviews`
			);
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error fetching reviews:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error fetching reviews",
				error: error.response?.data?.errors || error.message,
			});
		}
	}

	async getReviewsByProduct(
		req: Request,
		res: Response,
		next: NextFunction
	): Promise<void> {
		try {
			const response = await axios.get(
				`${this.breweryApiUrl}/api/reviews/product/${req.params.productId}`
			);
			res.status(200).json(response.data);
		} catch (error: any) {
			console.error(
				"Error fetching product reviews:",
				error.response?.data || error.message
			);
			res.status(error.response?.status || 500).json({
				message:
					error.response?.data?.message || "Error fetching reviews",
				error: error.response?.data?.errors || error.message,
			});
		}
	}
}
