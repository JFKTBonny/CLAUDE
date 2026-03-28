package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// ── Model ──────────────────────────────────────────────────────────

type Order struct {
	ID         int     `json:"id"`
	UserID     int     `json:"user_id"`
	ProductID  int     `json:"product_id"`
	Quantity   int     `json:"quantity"`
	TotalPrice float64 `json:"total_price"`
	Status     string  `json:"status"`
	CreatedAt  string  `json:"created_at,omitempty"`
}

type StatusUpdate struct {
	Status string `json:"status"`
}

// ── Helpers ────────────────────────────────────────────────────────

func jsonResponse(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func errorResponse(w http.ResponseWriter, status int, msg string) {
	jsonResponse(w, status, map[string]string{"error": msg})
}

// ── Handlers ───────────────────────────────────────────────────────

func healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]string{
		"status":  "UP",
		"service": "order-service",
		"version": getEnv("APP_VERSION", "1.0.0"),
	})
}

// GET /api/orders
func listOrdersHandler(w http.ResponseWriter, r *http.Request) {
	// Optional filter by user_id via query param e.g. ?user_id=5
	userIDParam := r.URL.Query().Get("user_id")

	var (
		rows *sql.Rows
		err  error
	)

	if userIDParam != "" {
		uid, convErr := strconv.Atoi(userIDParam)
		if convErr != nil {
			errorResponse(w, http.StatusBadRequest, "invalid user_id")
			return
		}
		rows, err = db.Query(
			`SELECT id, user_id, product_id, quantity, total_price, status, created_at
			 FROM orders WHERE user_id = ? ORDER BY created_at DESC`, uid,
		)
	} else {
		rows, err = db.Query(
			`SELECT id, user_id, product_id, quantity, total_price, status, created_at
			 FROM orders ORDER BY created_at DESC`,
		)
	}

	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to fetch orders")
		return
	}
	defer rows.Close()

	orders := []Order{}
	for rows.Next() {
		var o Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.ProductID,
			&o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt,
		); err != nil {
			errorResponse(w, http.StatusInternalServerError, "failed to parse order")
			return
		}
		orders = append(orders, o)
	}

	jsonResponse(w, http.StatusOK, orders)
}

// POST /api/orders
func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	var o Order
	if err := json.NewDecoder(r.Body).Decode(&o); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Basic validation
	if o.UserID == 0 || o.ProductID == 0 || o.Quantity <= 0 || o.TotalPrice <= 0 {
		errorResponse(w, http.StatusBadRequest, "user_id, product_id, quantity and total_price are required")
		return
	}

	o.Status = "PENDING"

	result, err := db.Exec(
		`INSERT INTO orders (user_id, product_id, quantity, total_price, status)
		 VALUES (?, ?, ?, ?, ?)`,
		o.UserID, o.ProductID, o.Quantity, o.TotalPrice, o.Status,
	)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to create order")
		return
	}

	id, _ := result.LastInsertId()
	o.ID = int(id)

	jsonResponse(w, http.StatusCreated, o)
}

// GET /api/orders/{id}
func getOrderHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid order id")
		return
	}

	var o Order
	err = db.QueryRow(
		`SELECT id, user_id, product_id, quantity, total_price, status, created_at
		 FROM orders WHERE id = ?`, id,
	).Scan(&o.ID, &o.UserID, &o.ProductID, &o.Quantity, &o.TotalPrice, &o.Status, &o.CreatedAt)

	if err == sql.ErrNoRows {
		errorResponse(w, http.StatusNotFound, "order not found")
		return
	}
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to fetch order")
		return
	}

	jsonResponse(w, http.StatusOK, o)
}

// PATCH /api/orders/{id}  — update status only
func updateOrderStatusHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid order id")
		return
	}

	var su StatusUpdate
	if err := json.NewDecoder(r.Body).Decode(&su); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	validStatuses := map[string]bool{
		"PENDING": true, "CONFIRMED": true,
		"SHIPPED": true, "DELIVERED": true, "CANCELLED": true,
	}
	if !validStatuses[su.Status] {
		errorResponse(w, http.StatusBadRequest, "invalid status value")
		return
	}

	result, err := db.Exec(
		`UPDATE orders SET status = ? WHERE id = ?`, su.Status, id,
	)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to update order")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		errorResponse(w, http.StatusNotFound, "order not found")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{
		"message": "order status updated",
		"status":  su.Status,
	})
}

// DELETE /api/orders/{id}  — soft cancel only
func deleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid order id")
		return
	}

	result, err := db.Exec(
		`UPDATE orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING'`, id,
	)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to cancel order")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		errorResponse(w, http.StatusBadRequest, "order not found or cannot be cancelled")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"message": "order cancelled"})
}