package main

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func loggingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		bodyBytes, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		log.Printf("[%s] [INFO] [http] [%s %s] remote=%s body=%s",
			start.Format(time.RFC3339),
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			string(bodyBytes))

		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}
		next(wrapped, r)

		log.Printf("[%s] [INFO] [http] [%s %s] status=%d duration=%dms",
			time.Now().Format(time.RFC3339),
			r.Method,
			r.URL.Path,
			wrapped.statusCode,
			time.Since(start).Milliseconds())
	}
}
