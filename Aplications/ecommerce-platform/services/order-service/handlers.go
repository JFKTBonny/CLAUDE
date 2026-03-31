package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

// ── Models ─────────────────────────────────────────────────────────

type OrderItem struct {
	ID        int     `json:"id"`
	OrderID   int     `json:"order_id"`
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

type Order struct {
	ID         int         `json:"id"`
	UserID     int         `json:"user_id"`
	Status     string      `json:"status"`
	TotalPrice float64     `json:"total_price"`
	Notes      string      `json:"notes,omitempty"`
	CreatedAt  string      `json:"created_at,omitempty"`
	UpdatedAt  string      `json:"updated_at,omitempty"`
	Items      []OrderItem `json:"items,omitempty"`
}

type CreateOrderRequest struct {
	UserID int         `json:"user_id"`
	Notes  string      `json:"notes"`
	Items  []OrderItem `json:"items"`
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
		rows, err = db.Query(`
			SELECT id, user_id, status, total_price,
			       COALESCE(notes,''), created_at, updated_at
			FROM orders WHERE user_id = ?
			ORDER BY created_at DESC`, uid)
	} else {
		rows, err = db.Query(`
			SELECT id, user_id, status, total_price,
			       COALESCE(notes,''), created_at, updated_at
			FROM orders ORDER BY created_at DESC`)
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
			&o.ID, &o.UserID, &o.Status,
			&o.TotalPrice, &o.Notes,
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			errorResponse(w, http.StatusInternalServerError, "failed to parse order")
			return
		}
		// Load items for each order
		o.Items = getOrderItems(o.ID)
		orders = append(orders, o)
	}

	jsonResponse(w, http.StatusOK, orders)
}

// POST /api/orders
func createOrderHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.UserID == 0 {
		errorResponse(w, http.StatusBadRequest, "user_id is required")
		return
	}
	if len(req.Items) == 0 {
		errorResponse(w, http.StatusBadRequest, "at least one item is required")
		return
	}

	// Calculate total
	var total float64
	for _, item := range req.Items {
		total += item.UnitPrice * float64(item.Quantity)
	}

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to start transaction")
		return
	}

	// Insert order
	result, err := tx.Exec(`
		INSERT INTO orders (user_id, status, total_price, notes)
		VALUES (?, 'PENDING', ?, ?)`,
		req.UserID, total, req.Notes,
	)
	if err != nil {
		tx.Rollback()
		errorResponse(w, http.StatusInternalServerError, "failed to create order")
		return
	}

	orderID, _ := result.LastInsertId()

	// Insert order items
	for _, item := range req.Items {
		_, err := tx.Exec(`
			INSERT INTO order_items (order_id, product_id, quantity, unit_price)
			VALUES (?, ?, ?, ?)`,
			orderID, item.ProductID, item.Quantity, item.UnitPrice,
		)
		if err != nil {
			tx.Rollback()
			errorResponse(w, http.StatusInternalServerError, "failed to create order items")
			return
		}
	}

	tx.Commit()

	// Return created order
	order := Order{
		ID:         int(orderID),
		UserID:     req.UserID,
		Status:     "PENDING",
		TotalPrice: total,
		Notes:      req.Notes,
		Items:      getOrderItems(int(orderID)),
	}

	jsonResponse(w, http.StatusCreated, order)
}

// GET /api/orders/{id}
func getOrderHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid order id")
		return
	}

	var o Order
	err = db.QueryRow(`
		SELECT id, user_id, status, total_price,
		       COALESCE(notes,''), created_at, updated_at
		FROM orders WHERE id = ?`, id,
	).Scan(&o.ID, &o.UserID, &o.Status,
		&o.TotalPrice, &o.Notes,
		&o.CreatedAt, &o.UpdatedAt)

	if err == sql.ErrNoRows {
		errorResponse(w, http.StatusNotFound, "order not found")
		return
	}
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to fetch order")
		return
	}

	o.Items = getOrderItems(o.ID)
	jsonResponse(w, http.StatusOK, o)
}

// PATCH /api/orders/{id}
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

// DELETE /api/orders/{id} — soft cancel
func deleteOrderHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(mux.Vars(r)["id"])
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid order id")
		return
	}

	result, err := db.Exec(`
		UPDATE orders SET status = 'CANCELLED'
		WHERE id = ? AND status = 'PENDING'`, id,
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

// ── Helper: load order items ───────────────────────────────────────

func getOrderItems(orderID int) []OrderItem {
	rows, err := db.Query(`
		SELECT id, order_id, product_id, quantity, unit_price
		FROM order_items WHERE order_id = ?`, orderID,
	)
	if err != nil {
		return []OrderItem{}
	}
	defer rows.Close()

	items := []OrderItem{}
	for rows.Next() {
		var item OrderItem
		if err := rows.Scan(
			&item.ID, &item.OrderID,
			&item.ProductID, &item.Quantity, &item.UnitPrice,
		); err != nil {
			continue
		}
		items = append(items, item)
	}
	return items
}
