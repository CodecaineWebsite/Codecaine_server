import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  getComments,
  postComment,
  updateComment,
  deleteComment,
} from "../controllers/commentsController.js";

const router = Router();

/**
 * GET /api/comments?pen_id={pen_id}
 * Get all comments for a specific pen
 *
 * @query {number} pen_id - The ID of the pen to fetch comments for (required)
 *
 * @response {200} Successfully returned the list of comments with user info
 * @response {400} Missing or invalid pen_id parameter
 * @response {404} Pen not found (no comments associated with this pen)
 * @response {500} Internal server error (e.g., database query failed)
 *
 * @example
 * GET /api/comments?pen_id=42
 *
 * Response:
 * [
 *   {
 *     "id": 1,
 *     "content": "This is a great pen!",
 *     "created_at": "2025-06-15T12:34:56.000Z",
 *     "user": {
 *       "id": "abc123",
 *       "username": "lucy",
 *       "display_name": "Lucy Harrison",
 *       "profile_image_url": "https://example.com/avatar.jpg"
 *     }
 *   },
 *   {
 *     "id": 2,
 *     "content": "Very helpful, thanks!",
 *     "created_at": "2025-06-15T13:00:00.000Z",
 *     "user": {
 *       "id": "def456",
 *       "username": "bob",
 *       "display_name": "Bob T.",
 *       "profile_image_url": "https://example.com/avatar2.jpg"
 *     }
 *   }
 * ]
 */
router.get("/", getComments);

/**
 * POST /api/comments
 * Add a new comment to a pen (authentication required)
 *
 * @body {number} pen_id - The ID of the pen to comment on (required)
 * @body {string} content - The comment content (required)
 *
 * @header Authorization Bearer token (provided by Firebase)
 *
 * @response {201} Successfully added the comment
 * @response {400} Missing or invalid pen_id or content
 * @response {404} Pen not found
 * @response {500} Failed to add comment due to a server or database error
 *
 * @example
 * POST /api/comments
 * {
 *   "pen_id": 42,
 *   "content": "This is a great project! Thanks for sharing."
 * }
 *
 * Response:
 * {
 *   "id": 123,
 *   "pen_id": 42,
 *   "user_id": "abc123",
 *   "content": "This is a great project! Thanks for sharing.",
 *   "created_at": "2025-06-15T13:47:00.000Z",
 * }
 */
router.post("/", verifyFirebase, postComment);

/**
 * PUT /api/comments/:id
 * Edit an existing comment (authentication required)
 *
 * @param {number} id - The ID of the comment to be edited (in path)
 * @body {string} content - The updated comment content (required)
 *
 * @header Authorization Bearer token (provided by Firebase)
 *
 * @response {200} Successfully updated the comment
 * @response {400} Missing or invalid comment_id or content
 * @response {403} No permission to edit this comment (not the author)
 * @response {404} Comment not found
 * @response {500} Failed to update the comment due to a server or database error
 *
 * @example
 * PUT /api/comments/123
 * {
 *   "content": "Updated comment content with **markdown**"
 * }
 *
 * Response:
 * {
 *   "id": 123,
 *   "pen_id": 42,
 *   "user_id": "abc123",
 *   "content": "Updated comment content with **markdown**",
 *   "created_at": "2025-06-15T12:00:00.000Z",
 *   "updated_at": "2025-06-15T13:00:00.000Z"
 * }
 */
router.put("/:id", verifyFirebase, updateComment);

/**
 * DELETE /api/comments/:id
 * Delete an existing comment (authentication required)
 *
 * @param {number} id - The ID of the comment to delete (in path)
 *
 * @header Authorization Bearer token (provided by Firebase)
 *
 * @response {204} Successfully deleted the comment
 * @response {400} Invalid comment ID
 * @response {403} No permission to delete this comment (not the author)
 * @response {500} Failed to delete the comment due to a server or database error
 *
 * @example
 * DELETE /api/comments/123
 *
 * Response: (No Content)
 */
router.delete("/:id", verifyFirebase, deleteComment);

export default router;
