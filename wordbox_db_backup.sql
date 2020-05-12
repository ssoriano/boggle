--
-- PostgreSQL database dump
--

-- Dumped from database version 12.2
-- Dumped by pg_dump version 12.2

-- Started on 2020-05-12 17:30:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2850 (class 1262 OID 24855)
-- Name: wordbox_game_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE wordbox_game_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252';


ALTER DATABASE wordbox_game_db OWNER TO postgres;

\connect wordbox_game_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24865)
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- TOC entry 2851 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- TOC entry 212 (class 1255 OID 33121)
-- Name: remove_accents(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_accents(text) RETURNS text
    LANGUAGE sql
    AS $_$
   SELECT TRANSLATE($1, 'áéíóú', 'aeiou');
$_$;


ALTER FUNCTION public.remove_accents(text) OWNER TO postgres;

--
-- TOC entry 211 (class 1255 OID 33082)
-- Name: set_board_name(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_board_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$begin
	EXECUTE format('UPDATE board SET name_sp = ''Tablero_'' || $1, name_en = ''Board_'' || $1 WHERE id = $1')
	USING NEW.id;
	RETURN NEW;
end
$_$;


ALTER FUNCTION public.set_board_name() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 205 (class 1259 OID 33066)
-- Name: board; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.board (
    id bigint NOT NULL,
    name_sp text,
    name_en text,
    matrix json NOT NULL,
    status text,
    creation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.board OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 33064)
-- Name: board_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.board_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.board_id_seq OWNER TO postgres;

--
-- TOC entry 2852 (class 0 OID 0)
-- Dependencies: 204
-- Name: board_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_id_seq OWNED BY public.board.id;


--
-- TOC entry 206 (class 1259 OID 33097)
-- Name: player_board; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.player_board (
    board_id bigint NOT NULL,
    player character varying(30) NOT NULL,
    score integer NOT NULL,
    word text
);


ALTER TABLE public.player_board OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 24856)
-- Name: spanish_words; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spanish_words (
    word text NOT NULL,
    source text,
    type text,
    unaccented_word text NOT NULL
);


ALTER TABLE public.spanish_words OWNER TO postgres;

--
-- TOC entry 2707 (class 2604 OID 33069)
-- Name: board id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board ALTER COLUMN id SET DEFAULT nextval('public.board_id_seq'::regclass);


--
-- TOC entry 2716 (class 2606 OID 33074)
-- Name: board board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board
    ADD CONSTRAINT board_pkey PRIMARY KEY (id);


--
-- TOC entry 2714 (class 2606 OID 24863)
-- Name: spanish_words words_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spanish_words
    ADD CONSTRAINT words_pkey PRIMARY KEY (word);


--
-- TOC entry 2709 (class 1259 OID 33045)
-- Name: source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX source_idx ON public.spanish_words USING btree (source);


--
-- TOC entry 2710 (class 1259 OID 33122)
-- Name: unacc_word_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX unacc_word_idx ON public.spanish_words USING btree (unaccented_word text_pattern_ops);


--
-- TOC entry 2711 (class 1259 OID 33044)
-- Name: word_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX word_idx ON public.spanish_words USING btree (word);


--
-- TOC entry 2712 (class 1259 OID 33046)
-- Name: word_source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX word_source_idx ON public.spanish_words USING btree (word, source);


--
-- TOC entry 2718 (class 2620 OID 33083)
-- Name: board set_board_name; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_board_name AFTER INSERT ON public.board FOR EACH ROW EXECUTE FUNCTION public.set_board_name();


--
-- TOC entry 2717 (class 2606 OID 33100)
-- Name: player_board board_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.player_board
    ADD CONSTRAINT board_id_fk FOREIGN KEY (board_id) REFERENCES public.board(id);


-- Completed on 2020-05-12 17:30:31

--
-- PostgreSQL database dump complete
--

