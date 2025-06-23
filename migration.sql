
GRANT ALL PRIVILEGES ON DATABASE cvintelligence TO cvintelligence;

-- Passo 4: Criar o banco de dados novamente
CREATE DATABASE cvintelligence;

-- Passo 5: Conceder todos os privilégios
GRANT ALL PRIVILEGES ON DATABASE cvintelligence TO cvintelligence;

-- Extra: Definir o dono do banco (boa prática)
ALTER DATABASE cvintelligence OWNER TO cvintelligence;



-- Tabela 1: users
-- O PostgreSQL criará esta tabela no schema 'public' por padrão.
CREATE TABLE public.users (
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_image_url VARCHAR(255),
    credits INTEGER NOT NULL DEFAULT 2,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local'
);

-- Tabela 2: cv_analyses
-- A referência da chave estrangeira agora aponta para 'public.users'.
CREATE TABLE public.cv_analyses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    analysis_result JSONB NOT NULL,
    score INTEGER NOT NULL,
    suggestions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT cv_analyses_user_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabela 3: sessions
CREATE TABLE public.sessions (
    sid VARCHAR(255) NOT NULL PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Cria o índice para a tabela de sessões.
CREATE INDEX "IDX_session_expire" ON public.sessions("expire");