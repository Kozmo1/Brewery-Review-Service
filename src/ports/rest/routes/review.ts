import express, { Request, Response, NextFunction } from "express";
import { body } from "express-validator";
import { ReviewController } from "../../../controllers/reviewController";
import { verifyToken, AuthRequest } from "../../../middleware/auth";

const router = express.Router();
const reviewController = new ReviewController();

router.post(
	"/add-review",
	verifyToken,
	body("userId")
		.isInt({ min: 1 })
		.withMessage("User ID must be a positive integer"),
	body("productId")
		.isInt({ min: 1 })
		.withMessage("Product ID must be a positive integer"),
	body("reviewRating")
		.isFloat({ min: 0, max: 5 })
		.withMessage("Review rating must be between 0 and 5"),
	body("reviewMessage").notEmpty().withMessage("Review message is required"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		reviewController.addReview(req, res, next)
);

router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
	reviewController.getReviewById(req, res, next)
);

router.put(
	"/:id",
	verifyToken,
	body("reviewRating")
		.optional()
		.isFloat({ min: 0, max: 5 })
		.withMessage("Review rating must be between 0 and 5"),
	body("reviewMessage")
		.optional()
		.notEmpty()
		.withMessage("Review message cannot be empty"),
	(req: AuthRequest, res: Response, next: NextFunction) =>
		reviewController.updateReview(req, res, next)
);

router.delete(
	"/:id",
	verifyToken,
	(req: AuthRequest, res: Response, next: NextFunction) =>
		reviewController.deleteReview(req, res, next)
);

router.get("/", (req: Request, res: Response, next: NextFunction) =>
	reviewController.getAllReviews(req, res, next)
);

router.get(
	"/product/:productId",
	(req: Request, res: Response, next: NextFunction) =>
		reviewController.getReviewsByProduct(req, res, next)
);

export = router;
