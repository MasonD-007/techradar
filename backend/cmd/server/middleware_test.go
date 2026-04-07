package main

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoggingMiddleware(t *testing.T) {
	var logBuffer bytes.Buffer
	originalWriter := log.Writer()
	log.SetOutput(&logBuffer)
	defer log.SetOutput(originalWriter)

	var forwardedBody string
	handler := loggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		data, _ := io.ReadAll(r.Body)
		forwardedBody = string(data)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte("done"))
	})

	req := httptest.NewRequest(http.MethodPost, "/health", strings.NewReader(`{"ok":true}`))
	req.RemoteAddr = "127.0.0.1:1234"
	recorder := httptest.NewRecorder()
	handler(recorder, req)

	assert.Equal(t, http.StatusCreated, recorder.Code)
	assert.Equal(t, `{"ok":true}`, forwardedBody)
	logs := logBuffer.String()
	assert.Contains(t, logs, "body={\"ok\":true}")
	assert.Contains(t, logs, "status=201")
}
