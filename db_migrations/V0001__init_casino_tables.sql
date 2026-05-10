
CREATE TABLE t_p21650443_slot_game_project.users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    balance NUMERIC(18,2) DEFAULT 0.00,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE TABLE t_p21650443_slot_game_project.game_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_p21650443_slot_game_project.users(id),
    game_type VARCHAR(32) NOT NULL,
    bet NUMERIC(18,2) NOT NULL,
    result NUMERIC(18,2) NOT NULL,
    multiplier NUMERIC(10,4) DEFAULT 1,
    game_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p21650443_slot_game_project.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_p21650443_slot_game_project.users(id),
    type VARCHAR(32) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p21650443_slot_game_project.support_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES t_p21650443_slot_game_project.users(id),
    subject VARCHAR(256) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'open',
    admin_reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON t_p21650443_slot_game_project.game_sessions(user_id);
CREATE INDEX ON t_p21650443_slot_game_project.transactions(user_id);
CREATE INDEX ON t_p21650443_slot_game_project.support_tickets(user_id);
