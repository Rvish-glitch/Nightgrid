package errors

import (
	"errors"
)

type ErrorType string

const (
	ErrorTypeValidation ErrorType = "VALIDATION"
	ErrorTypeNotFound   ErrorType = "NOT_FOUND"
	ErrorTypeConflict   ErrorType = "CONFLICT"
	ErrorTypeInternal   ErrorType = "INTERNAL"
)

type AppError struct {
	Type    ErrorType `json:"type"`
	Message string    `json:"message"`
	Code    string    `json:"code,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewValidationError(msg string) *AppError {
	return &AppError{Type: ErrorTypeValidation, Message: msg}
}

func NewNotFoundError(msg string) *AppError {
	return &AppError{Type: ErrorTypeNotFound, Message: msg}
}

func NewConflictError(msg string) *AppError {
	return &AppError{Type: ErrorTypeConflict, Message: msg}
}

func NewInternalError(msg string) *AppError {
	return &AppError{Type: ErrorTypeInternal, Message: msg}
}

func IsValidation(err error) bool {
	var appErr *AppError
	return errors.As(err, &appErr) && appErr.Type == ErrorTypeValidation
}

func IsNotFound(err error) bool {
	var appErr *AppError
	return errors.As(err, &appErr) && appErr.Type == ErrorTypeNotFound
}

func IsConflict(err error) bool {
	var appErr *AppError
	return errors.As(err, &appErr) && appErr.Type == ErrorTypeConflict
}

func IsInternal(err error) bool {
	var appErr *AppError
	return errors.As(err, &appErr) && appErr.Type == ErrorTypeInternal
}

