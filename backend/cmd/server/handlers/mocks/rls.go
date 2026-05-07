package mocks

import (
	"context"
	"sync"

	"github.com/MasonD-007/template/backend/cmd/server/handlers"
	"github.com/stretchr/testify/mock"
)

type MockRLSExecutor struct {
	mock.Mock
	mu      sync.Mutex
	Calls   []RLSCall
	Querier *MockQuerier
}

type RLSCall struct {
	UserID string
	Role   string
}

func NewMockRLSExecutor() *MockRLSExecutor {
	return &MockRLSExecutor{Calls: make([]RLSCall, 0)}
}

func (m *MockRLSExecutor) SetQuerier(q *MockQuerier) {
	m.Querier = q
}

func (m *MockRLSExecutor) Execute(ctx context.Context, userID string, role string, fn func(handlers.Querier) error) error {
	m.mu.Lock()
	m.Calls = append(m.Calls, RLSCall{UserID: userID, Role: role})
	m.mu.Unlock()

	args := m.Called(ctx, userID, role, mock.Anything)
	if args.Get(0) != nil {
		return args.Get(0).(error)
	}

	if m.Querier != nil {
		return fn(m.Querier)
	}
	return fn(nil)
}