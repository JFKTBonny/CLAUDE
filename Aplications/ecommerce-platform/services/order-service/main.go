package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
)

var db *sql.DB

func main() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/orders_db?parseTime=true",
		getEnv("DB_USER", "root"),
		getEnv("DB_PASS", "secret"),
		getEnv("DB_HOST", "localhost"),
	)

	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("DB not reachable: %v", err)
	}
	log.Println("Connected to MySQL")

	r := mux.NewRouter()

	r.HandleFunc("/health", healthHandler).Methods("GET")

	api := r.PathPrefix("/api").Subrouter()
	api.Use(jwtMiddleware)
	api.HandleFunc("/orders",              listOrdersHandler).Methods("GET")
	api.HandleFunc("/orders",              createOrderHandler).Methods("POST")
	api.HandleFunc("/orders/{id}",         getOrderHandler).Methods("GET")
	api.HandleFunc("/orders/{id}/status",  updateOrderStatusHandler).Methods("PATCH")
	api.HandleFunc("/orders/{id}",         deleteOrderHandler).Methods("DELETE")

	log.Println("Order service running on :8083")
	log.Fatal(http.ListenAndServe(":8083", r))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
