package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	req  := httptest.NewRequest("GET", "/health", nil)
	rec  := httptest.NewRecorder()
	healthHandler(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var body map[string]string
	json.NewDecoder(rec.Body).Decode(&body)
	if body["status"] != "UP" {
		t.Errorf("expected UP, got %s", body["status"])
	}
}

func TestCreateOrderValidation(t *testing.T) {
	// Missing items
	payload := `{"user_id": 1, "items": []}`
	req  := httptest.NewRequest("POST", "/api/orders",
		bytes.NewBufferString(payload))
	rec  := httptest.NewRecorder()
	createOrderHandler(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestGetEnv(t *testing.T) {
	t.Setenv("TEST_KEY", "hello")
	if got := getEnv("TEST_KEY", "fallback"); got != "hello" {
		t.Errorf("expected hello, got %s", got)
	}
	if got := getEnv("MISSING_KEY", "fallback"); got != "fallback" {
		t.Errorf("expected fallback, got %s", got)
	}
}
