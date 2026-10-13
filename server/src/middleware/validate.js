import { ApiError } from "../utils/ApiError.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return next(
        new ApiError(400, "VALIDATION_ERROR", "The request contains invalid data.", details)
      );
    }

    req.body = value;
    next();
  };
}
