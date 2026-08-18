--
-- PostgreSQL database dump
--

\restrict qevvb0G1hTLtxLTrST9eeIMkRdFbIly4ehb3tclDoWhfJbweQBCLTh2litEuRUP

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-08-18 23:39:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16434)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16433)
-- Name: admins_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_admin_id_seq OWNER TO postgres;

--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 225
-- Name: admins_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_admin_id_seq OWNED BY public.admins.admin_id;


--
-- TOC entry 238 (class 1259 OID 16532)
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    application_id integer NOT NULL,
    student_id integer NOT NULL,
    job_id integer NOT NULL,
    status character varying(30) DEFAULT 'Applied'::character varying,
    applied_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['Applied'::character varying, 'Shortlisted'::character varying, 'Interview Scheduled'::character varying, 'Rejected'::character varying, 'Selected'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16531)
-- Name: applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_application_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_application_id_seq OWNER TO postgres;

--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 237
-- Name: applications_application_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_application_id_seq OWNED BY public.applications.application_id;


--
-- TOC entry 258 (class 1259 OID 16710)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(255),
    log_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 16709)
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO postgres;

--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 257
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- TOC entry 266 (class 1259 OID 16777)
-- Name: certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificates (
    certificate_id integer NOT NULL,
    student_id integer,
    certificate_name character varying(150),
    issued_by character varying(150),
    issue_date date
);


ALTER TABLE public.certificates OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 16776)
-- Name: certificates_certificate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.certificates_certificate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certificates_certificate_id_seq OWNER TO postgres;

--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 265
-- Name: certificates_certificate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.certificates_certificate_id_seq OWNED BY public.certificates.certificate_id;


--
-- TOC entry 228 (class 1259 OID 16450)
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    company_id integer NOT NULL,
    company_name character varying(150) NOT NULL,
    industry character varying(100),
    website character varying(255),
    location character varying(100),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16449)
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_company_id_seq OWNER TO postgres;

--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 227
-- Name: companies_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_company_id_seq OWNED BY public.companies.company_id;


--
-- TOC entry 268 (class 1259 OID 16790)
-- Name: experience; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experience (
    experience_id integer NOT NULL,
    student_id integer,
    company character varying(150),
    designation character varying(150),
    duration character varying(50)
);


ALTER TABLE public.experience OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 16789)
-- Name: experience_experience_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.experience_experience_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experience_experience_id_seq OWNER TO postgres;

--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 267
-- Name: experience_experience_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.experience_experience_id_seq OWNED BY public.experience.experience_id;


--
-- TOC entry 248 (class 1259 OID 16632)
-- Name: interview_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_answers (
    answer_id integer NOT NULL,
    question_id integer NOT NULL,
    answer text,
    score numeric(5,2)
);


ALTER TABLE public.interview_answers OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16631)
-- Name: interview_answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_answers_answer_id_seq OWNER TO postgres;

--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 247
-- Name: interview_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_answers_answer_id_seq OWNED BY public.interview_answers.answer_id;


--
-- TOC entry 250 (class 1259 OID 16648)
-- Name: interview_evaluation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_evaluation (
    evaluation_id integer NOT NULL,
    session_id integer NOT NULL,
    communication_score numeric(5,2),
    technical_score numeric(5,2),
    confidence_score numeric(5,2),
    overall_feedback text
);


ALTER TABLE public.interview_evaluation OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 16647)
-- Name: interview_evaluation_evaluation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_evaluation_evaluation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_evaluation_evaluation_id_seq OWNER TO postgres;

--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 249
-- Name: interview_evaluation_evaluation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_evaluation_evaluation_id_seq OWNED BY public.interview_evaluation.evaluation_id;


--
-- TOC entry 246 (class 1259 OID 16615)
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_questions (
    question_id integer NOT NULL,
    session_id integer NOT NULL,
    question text NOT NULL
);


ALTER TABLE public.interview_questions OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16614)
-- Name: interview_questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_questions_question_id_seq OWNER TO postgres;

--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 245
-- Name: interview_questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_questions_question_id_seq OWNED BY public.interview_questions.question_id;


--
-- TOC entry 240 (class 1259 OID 16554)
-- Name: interview_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interview_sessions (
    session_id integer NOT NULL,
    application_id integer NOT NULL,
    interview_date timestamp without time zone,
    overall_score numeric(5,2),
    feedback text
);


ALTER TABLE public.interview_sessions OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16553)
-- Name: interview_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interview_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interview_sessions_session_id_seq OWNER TO postgres;

--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 239
-- Name: interview_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interview_sessions_session_id_seq OWNED BY public.interview_sessions.session_id;


--
-- TOC entry 244 (class 1259 OID 16597)
-- Name: job_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_skills (
    job_id integer NOT NULL,
    skill_id integer NOT NULL
);


ALTER TABLE public.job_skills OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16515)
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    job_id integer NOT NULL,
    company_id integer NOT NULL,
    job_title character varying(150),
    description text,
    location character varying(100),
    experience_required integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    salary_min numeric(12,2),
    salary_max numeric(12,2),
    salary_type character varying(20)
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16514)
-- Name: jobs_job_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_job_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_job_id_seq OWNER TO postgres;

--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 235
-- Name: jobs_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_job_id_seq OWNED BY public.jobs.job_id;


--
-- TOC entry 254 (class 1259 OID 16684)
-- Name: learning_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_resources (
    resource_id integer NOT NULL,
    title character varying(255),
    category character varying(100),
    url text,
    description text
);


ALTER TABLE public.learning_resources OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 16683)
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learning_resources_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_resources_resource_id_seq OWNER TO postgres;

--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 253
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learning_resources_resource_id_seq OWNED BY public.learning_resources.resource_id;


--
-- TOC entry 252 (class 1259 OID 16666)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 16665)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 251
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- TOC entry 264 (class 1259 OID 16756)
-- Name: recruiter_feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruiter_feedback (
    feedback_id integer NOT NULL,
    application_id integer,
    recruiter_id integer,
    comments text,
    rating integer,
    CONSTRAINT recruiter_feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.recruiter_feedback OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 16755)
-- Name: recruiter_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruiter_feedback_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruiter_feedback_feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 263
-- Name: recruiter_feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruiter_feedback_feedback_id_seq OWNED BY public.recruiter_feedback.feedback_id;


--
-- TOC entry 224 (class 1259 OID 16418)
-- Name: recruiters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruiters (
    recruiter_id integer NOT NULL,
    user_id integer NOT NULL,
    designation character varying(100),
    phone character varying(15),
    company_id integer
);


ALTER TABLE public.recruiters OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16417)
-- Name: recruiters_recruiter_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruiters_recruiter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruiters_recruiter_id_seq OWNER TO postgres;

--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 223
-- Name: recruiters_recruiter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruiters_recruiter_id_seq OWNED BY public.recruiters.recruiter_id;


--
-- TOC entry 232 (class 1259 OID 16479)
-- Name: resume_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resume_analysis (
    analysis_id integer NOT NULL,
    resume_id integer NOT NULL,
    ats_score numeric(5,2),
    strengths text,
    weaknesses text,
    missing_skills text,
    recommendation text
);


ALTER TABLE public.resume_analysis OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16478)
-- Name: resume_analysis_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resume_analysis_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resume_analysis_analysis_id_seq OWNER TO postgres;

--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 231
-- Name: resume_analysis_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resume_analysis_analysis_id_seq OWNED BY public.resume_analysis.analysis_id;


--
-- TOC entry 234 (class 1259 OID 16497)
-- Name: resume_embeddings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resume_embeddings (
    embedding_id integer NOT NULL,
    resume_id integer NOT NULL,
    embedding_vector text
);


ALTER TABLE public.resume_embeddings OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16496)
-- Name: resume_embeddings_embedding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resume_embeddings_embedding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resume_embeddings_embedding_id_seq OWNER TO postgres;

--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 233
-- Name: resume_embeddings_embedding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resume_embeddings_embedding_id_seq OWNED BY public.resume_embeddings.embedding_id;


--
-- TOC entry 230 (class 1259 OID 16462)
-- Name: resumes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resumes (
    resume_id integer NOT NULL,
    student_id integer NOT NULL,
    resume_name character varying(255),
    resume_path text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.resumes OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16461)
-- Name: resumes_resume_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resumes_resume_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resumes_resume_id_seq OWNER TO postgres;

--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 229
-- Name: resumes_resume_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resumes_resume_id_seq OWNED BY public.resumes.resume_id;


--
-- TOC entry 256 (class 1259 OID 16694)
-- Name: roadmaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roadmaps (
    roadmap_id integer NOT NULL,
    student_id integer NOT NULL,
    title character varying(255),
    description text
);


ALTER TABLE public.roadmaps OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 16693)
-- Name: roadmaps_roadmap_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roadmaps_roadmap_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roadmaps_roadmap_id_seq OWNER TO postgres;

--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 255
-- Name: roadmaps_roadmap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roadmaps_roadmap_id_seq OWNED BY public.roadmaps.roadmap_id;


--
-- TOC entry 262 (class 1259 OID 16737)
-- Name: saved_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_jobs (
    saved_id integer NOT NULL,
    student_id integer,
    job_id integer,
    saved_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.saved_jobs OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 16736)
-- Name: saved_jobs_saved_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_jobs_saved_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_jobs_saved_id_seq OWNER TO postgres;

--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 261
-- Name: saved_jobs_saved_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_jobs_saved_id_seq OWNED BY public.saved_jobs.saved_id;


--
-- TOC entry 260 (class 1259 OID 16724)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    setting_id integer NOT NULL,
    setting_key character varying(100),
    setting_value text
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 16723)
-- Name: settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_setting_id_seq OWNER TO postgres;

--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 259
-- Name: settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_setting_id_seq OWNED BY public.settings.setting_id;


--
-- TOC entry 242 (class 1259 OID 16570)
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skills (
    skill_id integer NOT NULL,
    skill_name character varying(100) NOT NULL,
    category character varying(100)
);


ALTER TABLE public.skills OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16569)
-- Name: skills_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skills_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skills_skill_id_seq OWNER TO postgres;

--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 241
-- Name: skills_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skills_skill_id_seq OWNED BY public.skills.skill_id;


--
-- TOC entry 243 (class 1259 OID 16580)
-- Name: student_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_skills (
    student_id integer NOT NULL,
    skill_id integer NOT NULL,
    proficiency_level character varying(20)
);


ALTER TABLE public.student_skills OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16402)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    student_id integer NOT NULL,
    user_id integer NOT NULL,
    college_name character varying(150),
    degree character varying(100),
    specialization character varying(100),
    graduation_year integer,
    cgpa numeric(3,2),
    phone character varying(15),
    city character varying(100)
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16401)
-- Name: students_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_student_id_seq OWNER TO postgres;

--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 221
-- Name: students_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_student_id_seq OWNED BY public.students.student_id;


--
-- TOC entry 220 (class 1259 OID 16386)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'recruiter'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16385)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4983 (class 2604 OID 16437)
-- Name: admins admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN admin_id SET DEFAULT nextval('public.admins_admin_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 16535)
-- Name: applications application_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN application_id SET DEFAULT nextval('public.applications_application_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 16713)
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 16780)
-- Name: certificates certificate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates ALTER COLUMN certificate_id SET DEFAULT nextval('public.certificates_certificate_id_seq'::regclass);


--
-- TOC entry 4984 (class 2604 OID 16453)
-- Name: companies company_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN company_id SET DEFAULT nextval('public.companies_company_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 16793)
-- Name: experience experience_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience ALTER COLUMN experience_id SET DEFAULT nextval('public.experience_experience_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 16635)
-- Name: interview_answers answer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_answers ALTER COLUMN answer_id SET DEFAULT nextval('public.interview_answers_answer_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 16651)
-- Name: interview_evaluation evaluation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_evaluation ALTER COLUMN evaluation_id SET DEFAULT nextval('public.interview_evaluation_evaluation_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 16618)
-- Name: interview_questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_questions ALTER COLUMN question_id SET DEFAULT nextval('public.interview_questions_question_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 16557)
-- Name: interview_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.interview_sessions_session_id_seq'::regclass);


--
-- TOC entry 4990 (class 2604 OID 16518)
-- Name: jobs job_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN job_id SET DEFAULT nextval('public.jobs_job_id_seq'::regclass);


--
-- TOC entry 5003 (class 2604 OID 16687)
-- Name: learning_resources resource_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_resources ALTER COLUMN resource_id SET DEFAULT nextval('public.learning_resources_resource_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 16669)
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 16759)
-- Name: recruiter_feedback feedback_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.recruiter_feedback_feedback_id_seq'::regclass);


--
-- TOC entry 4982 (class 2604 OID 16421)
-- Name: recruiters recruiter_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters ALTER COLUMN recruiter_id SET DEFAULT nextval('public.recruiters_recruiter_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 16482)
-- Name: resume_analysis analysis_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_analysis ALTER COLUMN analysis_id SET DEFAULT nextval('public.resume_analysis_analysis_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 16500)
-- Name: resume_embeddings embedding_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_embeddings ALTER COLUMN embedding_id SET DEFAULT nextval('public.resume_embeddings_embedding_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 16465)
-- Name: resumes resume_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes ALTER COLUMN resume_id SET DEFAULT nextval('public.resumes_resume_id_seq'::regclass);


--
-- TOC entry 5004 (class 2604 OID 16697)
-- Name: roadmaps roadmap_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps ALTER COLUMN roadmap_id SET DEFAULT nextval('public.roadmaps_roadmap_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 16740)
-- Name: saved_jobs saved_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs ALTER COLUMN saved_id SET DEFAULT nextval('public.saved_jobs_saved_id_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 16727)
-- Name: settings setting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN setting_id SET DEFAULT nextval('public.settings_setting_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 16573)
-- Name: skills skill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills ALTER COLUMN skill_id SET DEFAULT nextval('public.skills_skill_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 16405)
-- Name: students student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN student_id SET DEFAULT nextval('public.students_student_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 16389)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5267 (class 0 OID 16434)
-- Dependencies: 226
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (admin_id, user_id) FROM stdin;
\.


--
-- TOC entry 5279 (class 0 OID 16532)
-- Dependencies: 238
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (application_id, student_id, job_id, status, applied_at) FROM stdin;
1	1	1	Applied	2026-08-07 14:22:17.025246
2	2	2	Interview Scheduled	2026-08-07 14:22:17.025246
3	3	5	Applied	2026-08-07 14:22:17.025246
4	4	16	Shortlisted	2026-08-07 14:22:17.025246
5	5	3	Applied	2026-08-07 14:22:17.025246
6	6	12	Selected	2026-08-07 14:22:17.025246
7	7	9	Applied	2026-08-07 14:22:17.025246
8	8	6	Interview Scheduled	2026-08-07 14:22:17.025246
9	9	7	Applied	2026-08-07 14:22:17.025246
10	10	13	Shortlisted	2026-08-07 14:22:17.025246
11	11	11	Applied	2026-08-07 14:22:17.025246
12	12	15	Applied	2026-08-07 14:22:17.025246
13	13	5	Rejected	2026-08-07 14:22:17.025246
14	14	16	Interview Scheduled	2026-08-07 14:22:17.025246
15	15	4	Applied	2026-08-07 14:22:17.025246
16	16	2	Selected	2026-08-07 14:22:17.025246
17	17	9	Applied	2026-08-07 14:22:17.025246
18	18	20	Applied	2026-08-07 14:22:17.025246
19	19	18	Shortlisted	2026-08-07 14:22:17.025246
20	20	17	Interview Scheduled	2026-08-07 14:22:17.025246
21	21	3	Applied	2026-08-07 14:22:17.025246
22	22	4	Rejected	2026-08-07 14:22:17.025246
23	23	5	Applied	2026-08-07 14:22:17.025246
24	24	13	Selected	2026-08-07 14:22:17.025246
25	25	2	Applied	2026-08-07 14:22:17.025246
26	26	11	Interview Scheduled	2026-08-07 14:22:17.025246
27	27	9	Applied	2026-08-07 14:22:17.025246
28	28	6	Applied	2026-08-07 14:22:17.025246
29	29	1	Shortlisted	2026-08-07 14:22:17.025246
30	30	20	Selected	2026-08-07 14:22:17.025246
31	31	13	Interview Scheduled	2026-08-07 14:22:17.025246
32	32	16	Applied	2026-08-07 14:22:17.025246
33	33	18	Selected	2026-08-07 14:22:17.025246
34	34	20	Applied	2026-08-07 14:22:17.025246
\.


--
-- TOC entry 5299 (class 0 OID 16710)
-- Dependencies: 258
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (log_id, user_id, action, log_time) FROM stdin;
1	1	Uploaded Resume	2026-08-07 14:22:54.820933
2	2	Applied Job	2026-08-07 14:22:54.820933
3	3	Updated Profile	2026-08-07 14:22:54.820933
4	4	Completed Interview	2026-08-07 14:22:54.820933
5	31	Generated ATS Report	2026-08-07 14:22:54.820933
6	33	Accepted Job Offer	2026-08-07 14:22:54.820933
\.


--
-- TOC entry 5307 (class 0 OID 16777)
-- Dependencies: 266
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificates (certificate_id, student_id, certificate_name, issued_by, issue_date) FROM stdin;
\.


--
-- TOC entry 5269 (class 0 OID 16450)
-- Dependencies: 228
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (company_id, company_name, industry, website, location, description, created_at) FROM stdin;
1	Tata Consultancy Services	IT Services	https://www.tcs.com	Mumbai	IT Consulting	2026-08-07 14:22:17.025246
2	Infosys	IT Services	https://www.infosys.com	Bengaluru	Digital Services	2026-08-07 14:22:17.025246
3	Accenture	Consulting	https://www.accenture.com	Mumbai	Technology Consulting	2026-08-07 14:22:17.025246
4	Capgemini	IT Services	https://www.capgemini.com	Pune	Cloud Solutions	2026-08-07 14:22:17.025246
5	Wipro	IT Services	https://www.wipro.com	Hyderabad	Software Development	2026-08-07 14:22:17.025246
6	Cognizant	IT Services	https://www.cognizant.com	Chennai	Enterprise Solutions	2026-08-07 14:22:17.025246
7	LTIMindtree	IT Services	https://www.ltimindtree.com	Mumbai	Digital Transformation	2026-08-07 14:22:17.025246
8	Deloitte	Consulting	https://www.deloitte.com	Hyderabad	Business Consulting	2026-08-07 14:22:17.025246
9	Tech Mahindra	IT Services	https://www.techmahindra.com	Pune	Software Services	2026-08-07 14:22:17.025246
10	Persistent Systems	Software	https://www.persistent.com	Pune	Product Engineering	2026-08-07 14:22:17.025246
\.


--
-- TOC entry 5309 (class 0 OID 16790)
-- Dependencies: 268
-- Data for Name: experience; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experience (experience_id, student_id, company, designation, duration) FROM stdin;
1	1	Tata Consultancy Services	Software Developer Intern	3 months
2	2	Infosys	Web Development Intern	6 months
3	3	Accenture	Data Analyst Intern	4 months
\.


--
-- TOC entry 5289 (class 0 OID 16632)
-- Dependencies: 248
-- Data for Name: interview_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_answers (answer_id, question_id, answer, score) FROM stdin;
1	1	Confident self introduction	9.00
2	2	Explained all four pillars	9.00
3	3	Correct definition	10.00
4	4	Answered with examples	9.00
5	5	Explained INNER LEFT RIGHT	8.00
6	6	Correct explanation	8.00
7	7	Lifecycle methods explained	9.00
8	8	Correct answer	10.00
9	9	Docker containers explanation	8.00
10	10	Basic Kubernetes explanation	7.00
\.


--
-- TOC entry 5291 (class 0 OID 16648)
-- Dependencies: 250
-- Data for Name: interview_evaluation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_evaluation (evaluation_id, session_id, communication_score, technical_score, confidence_score, overall_feedback) FROM stdin;
1	1	9.00	9.00	8.00	Recommended
2	2	9.00	10.00	9.00	Excellent
3	3	8.00	8.00	8.00	Average
4	4	9.00	9.00	9.00	Very Good
5	5	8.00	8.00	7.00	Needs improvement
6	6	10.00	10.00	9.00	Outstanding
7	7	9.00	9.00	8.00	Strong Candidate
8	8	10.00	10.00	9.00	Selected
9	9	8.00	9.00	8.00	Good
10	10	9.00	10.00	9.00	Recommended
\.


--
-- TOC entry 5287 (class 0 OID 16615)
-- Dependencies: 246
-- Data for Name: interview_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_questions (question_id, session_id, question) FROM stdin;
1	1	Tell me about yourself.
2	1	Explain OOP concepts.
3	2	What is Machine Learning?
4	2	Difference between Classification and Regression?
5	3	Explain SQL Joins.
6	3	Difference between WHERE and HAVING.
7	4	Explain React lifecycle.
8	4	What is Virtual DOM?
9	5	Difference between Docker and VM?
10	5	Explain Kubernetes.
\.


--
-- TOC entry 5281 (class 0 OID 16554)
-- Dependencies: 240
-- Data for Name: interview_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interview_sessions (session_id, application_id, interview_date, overall_score, feedback) FROM stdin;
1	2	2026-08-15 10:00:00	87.00	Good technical knowledge.
2	4	2026-08-16 11:30:00	92.00	Excellent AI concepts.
3	8	2026-08-17 09:30:00	84.00	Needs confidence.
4	10	2026-08-18 02:00:00	90.00	Very good communication.
5	14	2026-08-19 11:00:00	86.00	Strong fundamentals.
6	16	2026-08-20 10:30:00	95.00	Outstanding candidate.
7	20	2026-08-21 01:00:00	89.00	Good problem solving.
8	24	2026-08-22 12:30:00	93.00	Excellent portfolio.
9	26	2026-08-23 03:00:00	88.00	Needs deployment knowledge.
10	31	2026-08-24 10:00:00	91.00	Strong AI profile.
\.


--
-- TOC entry 5285 (class 0 OID 16597)
-- Dependencies: 244
-- Data for Name: job_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_skills (job_id, skill_id) FROM stdin;
\.


--
-- TOC entry 5277 (class 0 OID 16515)
-- Dependencies: 236
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (job_id, company_id, job_title, description, location, experience_required, created_at, salary_min, salary_max, salary_type) FROM stdin;
1	1	Software Developer	Java Spring Boot Development	Mumbai	0	2026-08-07 14:22:17.025246	600000.00	600000.00	YEAR
2	1	Data Analyst	SQL Power BI Python	Mumbai	1	2026-08-07 14:22:17.025246	700000.00	700000.00	YEAR
3	2	Python Developer	Backend APIs	Bengaluru	1	2026-08-07 14:22:17.025246	800000.00	800000.00	YEAR
4	2	AI Engineer	Machine Learning Projects	Bengaluru	2	2026-08-07 14:22:17.025246	1200000.00	1200000.00	YEAR
5	3	Frontend Developer	React JS	Mumbai	1	2026-08-07 14:22:17.025246	750000.00	750000.00	YEAR
6	3	Full Stack Developer	React Node	Mumbai	2	2026-08-07 14:22:17.025246	1000000.00	1000000.00	YEAR
7	4	Cloud Engineer	AWS Azure	Pune	2	2026-08-07 14:22:17.025246	1100000.00	1100000.00	YEAR
8	4	DevOps Engineer	Docker Kubernetes	Pune	2	2026-08-07 14:22:17.025246	1200000.00	1200000.00	YEAR
9	5	Cyber Security Analyst	SOC Security	Hyderabad	1	2026-08-07 14:22:17.025246	800000.00	800000.00	YEAR
10	5	QA Engineer	Automation Testing	Hyderabad	1	2026-08-07 14:22:17.025246	700000.00	700000.00	YEAR
11	6	Business Analyst	SQL Tableau	Chennai	2	2026-08-07 14:22:17.025246	900000.00	900000.00	YEAR
12	6	Data Engineer	ETL SQL	Chennai	2	2026-08-07 14:22:17.025246	1000000.00	1000000.00	YEAR
13	7	ML Engineer	Deep Learning	Mumbai	2	2026-08-07 14:22:17.025246	1300000.00	1300000.00	YEAR
14	7	Backend Developer	Node Express	Mumbai	1	2026-08-07 14:22:17.025246	800000.00	800000.00	YEAR
15	8	BI Developer	Power BI SQL	Hyderabad	2	2026-08-07 14:22:17.025246	900000.00	900000.00	YEAR
16	8	Data Scientist	Machine Learning	Hyderabad	2	2026-08-07 14:22:17.025246	1400000.00	1400000.00	YEAR
17	9	Java Developer	Spring Boot	Pune	1	2026-08-07 14:22:17.025246	850000.00	850000.00	YEAR
18	9	Android Developer	Android Studio	Pune	1	2026-08-07 14:22:17.025246	800000.00	800000.00	YEAR
19	10	Software Engineer	Product Development	Pune	1	2026-08-07 14:22:17.025246	900000.00	900000.00	YEAR
20	10	AI Intern	Computer Vision	Pune	0	2026-08-07 14:22:17.025246	35000.00	35000.00	MONTH
\.


--
-- TOC entry 5295 (class 0 OID 16684)
-- Dependencies: 254
-- Data for Name: learning_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_resources (resource_id, title, category, url, description) FROM stdin;
1	Python Complete Course	Programming	https://www.youtube.com	Complete Python
2	SQL for Beginners	Database	https://www.youtube.com	SQL Tutorial
3	Machine Learning A-Z	AI	https://www.udemy.com	Complete ML
4	React Crash Course	Frontend	https://www.youtube.com	React Basics
5	AWS Cloud Practitioner	Cloud	https://aws.amazon.com	AWS Learning
\.


--
-- TOC entry 5293 (class 0 OID 16666)
-- Dependencies: 252
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, message, is_read, created_at) FROM stdin;
1	1	Resume uploaded successfully.	t	2026-08-07 14:22:54.820933
2	2	Interview Scheduled.	f	2026-08-07 14:22:54.820933
3	3	Application Submitted.	t	2026-08-07 14:22:54.820933
4	4	Resume ATS Score Updated.	f	2026-08-07 14:22:54.820933
5	5	Job Recommendation Available.	f	2026-08-07 14:22:54.820933
6	31	Interview Scheduled.	f	2026-08-07 14:22:54.820933
7	32	Resume Reviewed.	t	2026-08-07 14:22:54.820933
8	33	Selected for Final Round.	f	2026-08-07 14:22:54.820933
9	34	New AI Course Recommended.	f	2026-08-07 14:22:54.820933
\.


--
-- TOC entry 5305 (class 0 OID 16756)
-- Dependencies: 264
-- Data for Name: recruiter_feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruiter_feedback (feedback_id, application_id, recruiter_id, comments, rating) FROM stdin;
1	1	1	Good communication and strong technical fundamentals.	4
2	2	2	Strong candidate with good problem-solving skills.	5
3	4	4	Good profile, but needs more practical project experience.	3
\.


--
-- TOC entry 5265 (class 0 OID 16418)
-- Dependencies: 224
-- Data for Name: recruiters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruiters (recruiter_id, user_id, designation, phone, company_id) FROM stdin;
1	35	HR Manager	9876511111	1
2	36	Talent Acquisition	9876511112	2
3	37	Recruitment Lead	9876511113	3
4	38	HR Executive	9876511114	4
5	39	Senior Recruiter	9876511115	5
\.


--
-- TOC entry 5273 (class 0 OID 16479)
-- Dependencies: 232
-- Data for Name: resume_analysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resume_analysis (analysis_id, resume_id, ats_score, strengths, weaknesses, missing_skills, recommendation) FROM stdin;
2	2	91.00	Excellent Python skills	No projects	Power BI	Build dashboards
3	3	80.00	Good communication	Weak DSA	Java	Practice DSA
4	4	86.00	Strong AI basics	No internship	TensorFlow	Build ML projects
5	5	83.00	Good programming	Weak frontend	React	Learn React
6	6	89.00	Excellent analytics	No deployment	Docker	Deploy projects
7	7	78.00	Cybersecurity knowledge	Few certifications	Linux	Complete Security+
8	8	84.00	Good SQL	Weak backend	Node.js	Learn Express
9	9	87.00	Good projects	Low cloud exposure	AWS	AWS Cloud Practitioner
11	11	86.00	Strong Java and DSA	Limited projects	AWS	Build cloud projects
12	12	90.00	Python and SQL	Weak communication	Power BI	Create dashboards
13	13	82.00	Frontend skills	No internship	React	Build React portfolio
14	14	91.00	Data Science projects	No cloud	Azure	Learn Azure
15	15	84.00	AI basics	Weak backend	Node.js	Learn Express
16	16	89.00	Excellent analytics	No deployment	Docker	Deploy ML models
17	17	79.00	Cybersecurity fundamentals	Few certifications	Linux	Earn Security+
18	18	87.00	Good full-stack knowledge	Low testing experience	JUnit	Practice testing
19	19	88.00	Strong SQL	Weak DevOps	Docker	Learn CI/CD
21	21	89.00	Strong Java and SQL	Limited cloud exposure	AWS	Complete AWS Cloud Practitioner
22	22	91.00	Excellent Python and Power BI	Few projects	Machine Learning	Build ML portfolio
23	23	83.00	Strong HTML/CSS	Weak backend	Node.js	Develop REST APIs
24	24	94.00	Excellent AI & ML skills	No internship	Docker	Deploy ML models
25	25	85.00	Good Data Analysis	Weak DSA	Java	Practice LeetCode
26	26	90.00	Strong SQL and Excel	Needs cloud knowledge	Azure	Learn Azure Fundamentals
27	27	80.00	Cybersecurity basics	Few certifications	Linux	Earn CompTIA Security+
28	28	88.00	Good Full Stack skills	Testing experience lacking	JUnit	Practice unit testing
29	29	87.00	Strong Database knowledge	Weak DevOps	Docker	Learn Docker & CI/CD
30	30	96.00	Outstanding AI portfolio	Needs production deployment	Kubernetes	Learn Kubernetes
1	1	88.00	Strong Java and SQL	No cloud experience	AWS, Docker	Learn AWS
10	10	94.00	Excellent AI portfolio	No DevOps	Docker, Kubernetes	Learn CI/CD
20	20	95.00	Excellent AI portfolio	Needs cloud exposure	AWS, GCP	Complete cloud certification
31	31	95.00	Excellent AI and Data Engineering profile with ML projects.	Needs industry internship.	AWS, Docker, Kubernetes	Gain cloud deployment experience.
32	32	90.00	Strong Data Science fundamentals and analytical thinking.	Limited real-world experience.	Power BI, TensorFlow	Build end-to-end ML projects.
33	33	93.00	Strong Computer Engineering background with Android and ML.	Needs cloud technologies.	AWS, CI/CD	Learn DevOps and Cloud.
34	34	87.00	Good programming fundamentals.	Needs more major projects.	React, Node.js, Docker	Build full-stack portfolio.
\.


--
-- TOC entry 5275 (class 0 OID 16497)
-- Dependencies: 234
-- Data for Name: resume_embeddings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resume_embeddings (embedding_id, resume_id, embedding_vector) FROM stdin;
\.


--
-- TOC entry 5271 (class 0 OID 16462)
-- Dependencies: 230
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resumes (resume_id, student_id, resume_name, resume_path, uploaded_at) FROM stdin;
1	1	Resume_Aarav_Sharma.pdf	/resumes/Resume01.pdf	2026-08-07 14:19:18.900921
2	2	Resume_Priya_Patel.pdf	/resumes/Resume02.pdf	2026-08-07 14:19:18.900921
3	3	Resume_Rahul_Mehta.pdf	/resumes/Resume03.pdf	2026-08-07 14:19:18.900921
4	4	Resume_Sneha_Nair.pdf	/resumes/Resume04.pdf	2026-08-07 14:19:18.900921
5	5	Resume_Aditya_Verma.pdf	/resumes/Resume05.pdf	2026-08-07 14:19:18.900921
6	6	Resume_Riya_Gupta.pdf	/resumes/Resume06.pdf	2026-08-07 14:19:18.900921
7	7	Resume_Karan_Singh.pdf	/resumes/Resume07.pdf	2026-08-07 14:19:18.900921
8	8	Resume_Neha_Joshi.pdf	/resumes/Resume08.pdf	2026-08-07 14:19:18.900921
9	9	Resume_Vivek_Iyer.pdf	/resumes/Resume09.pdf	2026-08-07 14:19:18.900921
10	10	Resume_Pooja_Kulkarni.pdf	/resumes/Resume10.pdf	2026-08-07 14:19:18.900921
11	11	Resume_Ananya_Desai.pdf	/resumes/Resume11.pdf	2026-08-07 14:21:04.708194
12	12	Resume_Rohan_Kulkarni.pdf	/resumes/Resume12.pdf	2026-08-07 14:21:04.708194
13	13	Resume_Ishita_Shah.pdf	/resumes/Resume13.pdf	2026-08-07 14:21:04.708194
14	14	Resume_Harsh_Patel.pdf	/resumes/Resume14.pdf	2026-08-07 14:21:04.708194
15	15	Resume_Tanvi_Joshi.pdf	/resumes/Resume15.pdf	2026-08-07 14:21:04.708194
16	16	Resume_Nikhil_Reddy.pdf	/resumes/Resume16.pdf	2026-08-07 14:21:04.708194
17	17	Resume_Meera_Singh.pdf	/resumes/Resume17.pdf	2026-08-07 14:21:04.708194
18	18	Resume_Kabir_Jain.pdf	/resumes/Resume18.pdf	2026-08-07 14:21:04.708194
19	19	Resume_Aditi_Roy.pdf	/resumes/Resume19.pdf	2026-08-07 14:21:04.708194
20	20	Resume_Yash_Mishra.pdf	/resumes/Resume20.pdf	2026-08-07 14:21:04.708194
21	21	Resume_Dev_Bansal.pdf	/resumes/Resume21.pdf	2026-08-07 14:21:27.057511
22	22	Resume_Kriti_Sharma.pdf	/resumes/Resume22.pdf	2026-08-07 14:21:27.057511
23	23	Resume_Arjun_Nair.pdf	/resumes/Resume23.pdf	2026-08-07 14:21:27.057511
24	24	Resume_Sakshi_Gupta.pdf	/resumes/Resume24.pdf	2026-08-07 14:21:27.057511
25	25	Resume_Aman_Verma.pdf	/resumes/Resume25.pdf	2026-08-07 14:21:27.057511
26	26	Resume_Ritika_Mehta.pdf	/resumes/Resume26.pdf	2026-08-07 14:21:27.057511
27	27	Resume_Siddharth_Rao.pdf	/resumes/Resume27.pdf	2026-08-07 14:21:27.057511
28	28	Resume_Riya_Kapoor.pdf	/resumes/Resume28.pdf	2026-08-07 14:21:27.057511
29	29	Resume_Vihaan_Patel.pdf	/resumes/Resume29.pdf	2026-08-07 14:21:27.057511
30	30	Resume_Krishna_Tople.pdf	/resumes/Resume30.pdf	2026-08-07 14:21:27.057511
31	31	Varad_Tardekar_Resume.pdf	/resumes/Varad_Tardekar.pdf	2026-08-07 14:21:47.466913
32	32	Shruti_Prajapati_Resume.pdf	/resumes/Shruti_Prajapati.pdf	2026-08-07 14:21:47.466913
33	33	Vishakha_Gite_Resume.pdf	/resumes/Vishakha_Gite.pdf	2026-08-07 14:21:47.466913
34	34	Yukti_Khawas_Resume.pdf	/resumes/Yukti_Khawas.pdf	2026-08-07 14:21:47.466913
\.


--
-- TOC entry 5297 (class 0 OID 16694)
-- Dependencies: 256
-- Data for Name: roadmaps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roadmaps (roadmap_id, student_id, title, description) FROM stdin;
1	1	Java Developer	DSA → Java → Spring Boot → Projects
2	10	AI Engineer	Python → ML → Deep Learning → MLOps
3	24	Data Scientist	Python → Pandas → ML → SQL
4	31	AI Engineer	Cloud + MLOps + GenAI
5	33	Android Developer	Android → Kotlin → Firebase
\.


--
-- TOC entry 5303 (class 0 OID 16737)
-- Dependencies: 262
-- Data for Name: saved_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_jobs (saved_id, student_id, job_id, saved_at) FROM stdin;
1	1	1	2026-08-15 17:03:09.703649
2	2	3	2026-08-15 17:03:09.703649
3	3	5	2026-08-15 17:03:09.703649
\.


--
-- TOC entry 5301 (class 0 OID 16724)
-- Dependencies: 260
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (setting_id, setting_key, setting_value) FROM stdin;
1	ATS_PASS_SCORE	75
2	MAX_RESUME_SIZE	5MB
3	ALLOWED_FORMATS	PDF,DOCX
4	DEFAULT_LANGUAGE	English
5	INTERVIEW_DURATION	30 Minutes
\.


--
-- TOC entry 5283 (class 0 OID 16570)
-- Dependencies: 242
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skills (skill_id, skill_name, category) FROM stdin;
1	Python	Programming
2	Java	Programming
3	SQL	Database
4	MySQL	Database
5	PostgreSQL	Database
6	Machine Learning	AI
7	Data Analysis	Analytics
8	Power BI	Analytics
9	Scikit-learn	AI
10	NumPy	Python
11	Pandas	Python
12	Matplotlib	Visualization
13	HTML	Frontend
14	CSS	Frontend
15	JavaScript	Frontend
16	Git	Tools
17	GitHub	Tools
18	Android Studio	Mobile
19	SQLite	Database
20	Data Cleaning	Analytics
\.


--
-- TOC entry 5284 (class 0 OID 16580)
-- Dependencies: 243
-- Data for Name: student_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_skills (student_id, skill_id, proficiency_level) FROM stdin;
31	1	Advanced
31	3	Advanced
31	4	Advanced
31	5	Intermediate
31	6	Advanced
31	7	Advanced
31	9	Intermediate
31	16	Intermediate
32	1	Intermediate
32	2	Beginner
32	3	Intermediate
32	10	Intermediate
32	11	Intermediate
32	12	Intermediate
32	20	Advanced
33	1	Advanced
33	2	Advanced
33	3	Intermediate
33	13	Advanced
33	14	Advanced
33	15	Intermediate
33	18	Intermediate
33	19	Advanced
34	1	Intermediate
34	2	Intermediate
34	3	Intermediate
34	13	Intermediate
34	14	Intermediate
34	15	Intermediate
34	16	Intermediate
\.


--
-- TOC entry 5263 (class 0 OID 16402)
-- Dependencies: 222
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, user_id, college_name, degree, specialization, graduation_year, cgpa, phone, city) FROM stdin;
1	1	Mumbai University	B.Tech	Computer Engineering	2027	8.52	9876543210	Mumbai
2	2	SPPU	B.Tech	Information Technology	2026	8.14	9876543211	Pune
3	3	Anna University	B.E	Computer Science	2025	7.91	9876543212	Chennai
4	4	VTU	B.Tech	Artificial Intelligence	2027	8.73	9876543213	Bengaluru
5	5	Delhi University	B.Tech	Computer Science	2026	8.25	9876543214	Delhi
6	6	Mumbai University	B.Sc	Data Science	2027	8.61	9876543215	Mumbai
7	7	SPPU	B.Tech	Cyber Security	2025	7.84	9876543216	Pune
8	8	Anna University	B.E	Information Technology	2026	8.45	9876543217	Chennai
9	9	VTU	B.Tech	Computer Engineering	2027	8.18	9876543218	Bengaluru
10	10	Mumbai University	B.Tech	AI & ML	2026	8.90	9876543219	Mumbai
11	11	Mumbai University	B.Tech	Computer Engineering	2027	8.35	9876543220	Mumbai
12	12	SPPU	B.Tech	Information Technology	2026	8.02	9876543221	Pune
13	13	Anna University	B.E	Computer Science	2025	7.98	9876543222	Chennai
14	14	VTU	B.Tech	Data Science	2027	8.62	9876543223	Bengaluru
15	15	Delhi University	B.Tech	Artificial Intelligence	2026	8.41	9876543224	Delhi
16	16	Mumbai University	B.Sc	Data Science	2027	8.74	9876543225	Mumbai
17	17	SPPU	B.Tech	Cyber Security	2025	7.92	9876543226	Pune
18	18	Anna University	B.E	Computer Engineering	2026	8.27	9876543227	Chennai
19	19	VTU	B.Tech	Information Technology	2027	8.58	9876543228	Bengaluru
20	20	Mumbai University	B.Tech	AI & ML	2026	8.95	9876543229	Mumbai
21	21	Mumbai University	B.Tech	Computer Engineering	2027	8.41	9876543230	Mumbai
22	22	SPPU	B.Tech	Information Technology	2026	8.18	9876543231	Pune
23	23	Anna University	B.E	Computer Science	2025	8.02	9876543232	Chennai
24	24	VTU	B.Tech	Artificial Intelligence	2027	8.76	9876543233	Bengaluru
25	25	Delhi University	B.Tech	Data Science	2026	8.33	9876543234	Delhi
26	26	Mumbai University	B.Sc	Data Science	2027	8.67	9876543235	Mumbai
27	27	SPPU	B.Tech	Cyber Security	2025	7.95	9876543236	Pune
28	28	Anna University	B.E	Computer Engineering	2026	8.55	9876543237	Chennai
29	29	VTU	B.Tech	Information Technology	2027	8.29	9876543238	Bengaluru
30	30	Mumbai University	B.Tech	AI & ML	2026	9.01	9876543239	Mumbai
31	31	Vidyalankar Institute of Technology	B.Tech	Computer Science	2028	8.70	8291876294	Mumbai
32	32	KES Shroff College	Bachelor of Data Science	Data Science	2027	8.82	9867184860	Mumbai
33	33	Vidyanagar Institute of Technology	B.E	Computer Engineering	2027	8.94	9322177516	Mumbai
34	34	Vidyalankar Institute of Technology	B.Tech	Computer Engineering	2027	8.40	9876543240	Mumbai
\.


--
-- TOC entry 5261 (class 0 OID 16386)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, full_name, email, password, role, created_at) FROM stdin;
1	Aarav Sharma	aarav.sharma@gmail.com	password123	student	2026-08-07 14:19:18.900921
2	Priya Patel	priya.patel@gmail.com	password123	student	2026-08-07 14:19:18.900921
3	Rahul Mehta	rahul.mehta@gmail.com	password123	student	2026-08-07 14:19:18.900921
4	Sneha Nair	sneha.nair@gmail.com	password123	student	2026-08-07 14:19:18.900921
5	Aditya Verma	aditya.verma@gmail.com	password123	student	2026-08-07 14:19:18.900921
6	Riya Gupta	riya.gupta@gmail.com	password123	student	2026-08-07 14:19:18.900921
7	Karan Singh	karan.singh@gmail.com	password123	student	2026-08-07 14:19:18.900921
8	Neha Joshi	neha.joshi@gmail.com	password123	student	2026-08-07 14:19:18.900921
9	Vivek Iyer	vivek.iyer@gmail.com	password123	student	2026-08-07 14:19:18.900921
10	Pooja Kulkarni	pooja.kulkarni@gmail.com	password123	student	2026-08-07 14:19:18.900921
11	Ananya Desai	ananya.desai@gmail.com	password123	student	2026-08-07 14:21:04.708194
12	Rohan Kulkarni	rohan.kulkarni@gmail.com	password123	student	2026-08-07 14:21:04.708194
13	Ishita Shah	ishita.shah@gmail.com	password123	student	2026-08-07 14:21:04.708194
14	Harsh Patel	harsh.patel@gmail.com	password123	student	2026-08-07 14:21:04.708194
15	Tanvi Joshi	tanvi.joshi@gmail.com	password123	student	2026-08-07 14:21:04.708194
16	Nikhil Reddy	nikhil.reddy@gmail.com	password123	student	2026-08-07 14:21:04.708194
17	Meera Singh	meera.singh@gmail.com	password123	student	2026-08-07 14:21:04.708194
18	Kabir Jain	kabir.jain@gmail.com	password123	student	2026-08-07 14:21:04.708194
19	Aditi Roy	aditi.roy@gmail.com	password123	student	2026-08-07 14:21:04.708194
20	Yash Mishra	yash.mishra@gmail.com	password123	student	2026-08-07 14:21:04.708194
21	Dev Bansal	dev.bansal@gmail.com	password123	student	2026-08-07 14:21:27.057511
22	Kriti Sharma	kriti.sharma@gmail.com	password123	student	2026-08-07 14:21:27.057511
23	Arjun Nair	arjun.nair@gmail.com	password123	student	2026-08-07 14:21:27.057511
24	Sakshi Gupta	sakshi.gupta@gmail.com	password123	student	2026-08-07 14:21:27.057511
25	Aman Verma	aman.verma@gmail.com	password123	student	2026-08-07 14:21:27.057511
26	Ritika Mehta	ritika.mehta@gmail.com	password123	student	2026-08-07 14:21:27.057511
27	Siddharth Rao	siddharth.rao@gmail.com	password123	student	2026-08-07 14:21:27.057511
28	Riya Kapoor	riya.kapoor@gmail.com	password123	student	2026-08-07 14:21:27.057511
29	Vihaan Patel	vihaan.patel@gmail.com	password123	student	2026-08-07 14:21:27.057511
30	Krishna Tople	krishna.tople@gmail.com	password123	student	2026-08-07 14:21:27.057511
31	Varad Tardekar	varadtardekar@gmail.com	password123	student	2026-08-07 14:21:47.466913
32	Shruti Prajapati	shrutiprajapati681@gmail.com	password123	student	2026-08-07 14:21:47.466913
33	Vishakha Gite	vishakha120106@gmail.com	password123	student	2026-08-07 14:21:47.466913
34	Yukti Khawas	yuktikhawas@gmail.com	password123	student	2026-08-07 14:21:47.466913
35	Ankit HR	ankit.hr@tcs.com	password123	recruiter	2026-08-07 14:22:17.025246
36	Rohan HR	rohan.hr@infosys.com	password123	recruiter	2026-08-07 14:22:17.025246
37	Sneha HR	sneha.hr@accenture.com	password123	recruiter	2026-08-07 14:22:17.025246
38	Neha HR	neha.hr@capgemini.com	password123	recruiter	2026-08-07 14:22:17.025246
39	Vikas HR	vikas.hr@wipro.com	password123	recruiter	2026-08-07 14:22:17.025246
\.


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 225
-- Name: admins_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_admin_id_seq', 1, false);


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 237
-- Name: applications_application_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_application_id_seq', 34, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 257
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 6, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 265
-- Name: certificates_certificate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.certificates_certificate_id_seq', 1, false);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 227
-- Name: companies_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_company_id_seq', 10, true);


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 267
-- Name: experience_experience_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experience_experience_id_seq', 3, true);


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 247
-- Name: interview_answers_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interview_answers_answer_id_seq', 10, true);


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 249
-- Name: interview_evaluation_evaluation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interview_evaluation_evaluation_id_seq', 10, true);


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 245
-- Name: interview_questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interview_questions_question_id_seq', 10, true);


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 239
-- Name: interview_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interview_sessions_session_id_seq', 10, true);


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 235
-- Name: jobs_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_job_id_seq', 20, true);


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 253
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learning_resources_resource_id_seq', 5, true);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 251
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 9, true);


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 263
-- Name: recruiter_feedback_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruiter_feedback_feedback_id_seq', 3, true);


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 223
-- Name: recruiters_recruiter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruiters_recruiter_id_seq', 5, true);


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 231
-- Name: resume_analysis_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resume_analysis_analysis_id_seq', 34, true);


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 233
-- Name: resume_embeddings_embedding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resume_embeddings_embedding_id_seq', 1, false);


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 229
-- Name: resumes_resume_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resumes_resume_id_seq', 34, true);


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 255
-- Name: roadmaps_roadmap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roadmaps_roadmap_id_seq', 5, true);


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 261
-- Name: saved_jobs_saved_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_jobs_saved_id_seq', 3, true);


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 259
-- Name: settings_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_setting_id_seq', 5, true);


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 241
-- Name: skills_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_skill_id_seq', 20, true);


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 221
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_student_id_seq', 34, true);


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 39, true);


--
-- TOC entry 5029 (class 2606 OID 16441)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- TOC entry 5031 (class 2606 OID 16443)
-- Name: admins admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);


--
-- TOC entry 5047 (class 2606 OID 16542)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (application_id);


--
-- TOC entry 5073 (class 2606 OID 16717)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5083 (class 2606 OID 16783)
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (certificate_id);


--
-- TOC entry 5033 (class 2606 OID 16460)
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- TOC entry 5085 (class 2606 OID 16796)
-- Name: experience experience_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience
    ADD CONSTRAINT experience_pkey PRIMARY KEY (experience_id);


--
-- TOC entry 5061 (class 2606 OID 16641)
-- Name: interview_answers interview_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_answers
    ADD CONSTRAINT interview_answers_pkey PRIMARY KEY (answer_id);


--
-- TOC entry 5063 (class 2606 OID 16657)
-- Name: interview_evaluation interview_evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_evaluation
    ADD CONSTRAINT interview_evaluation_pkey PRIMARY KEY (evaluation_id);


--
-- TOC entry 5065 (class 2606 OID 16659)
-- Name: interview_evaluation interview_evaluation_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_evaluation
    ADD CONSTRAINT interview_evaluation_session_id_key UNIQUE (session_id);


--
-- TOC entry 5059 (class 2606 OID 16625)
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 5049 (class 2606 OID 16563)
-- Name: interview_sessions interview_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_sessions
    ADD CONSTRAINT interview_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 5057 (class 2606 OID 16603)
-- Name: job_skills job_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_pkey PRIMARY KEY (job_id, skill_id);


--
-- TOC entry 5045 (class 2606 OID 16525)
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (job_id);


--
-- TOC entry 5069 (class 2606 OID 16692)
-- Name: learning_resources learning_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_pkey PRIMARY KEY (resource_id);


--
-- TOC entry 5067 (class 2606 OID 16677)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5081 (class 2606 OID 16765)
-- Name: recruiter_feedback recruiter_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_feedback
    ADD CONSTRAINT recruiter_feedback_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 5025 (class 2606 OID 16425)
-- Name: recruiters recruiters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_pkey PRIMARY KEY (recruiter_id);


--
-- TOC entry 5027 (class 2606 OID 16427)
-- Name: recruiters recruiters_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_user_id_key UNIQUE (user_id);


--
-- TOC entry 5037 (class 2606 OID 16488)
-- Name: resume_analysis resume_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_analysis
    ADD CONSTRAINT resume_analysis_pkey PRIMARY KEY (analysis_id);


--
-- TOC entry 5039 (class 2606 OID 16490)
-- Name: resume_analysis resume_analysis_resume_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_analysis
    ADD CONSTRAINT resume_analysis_resume_id_key UNIQUE (resume_id);


--
-- TOC entry 5041 (class 2606 OID 16506)
-- Name: resume_embeddings resume_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_embeddings
    ADD CONSTRAINT resume_embeddings_pkey PRIMARY KEY (embedding_id);


--
-- TOC entry 5043 (class 2606 OID 16508)
-- Name: resume_embeddings resume_embeddings_resume_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_embeddings
    ADD CONSTRAINT resume_embeddings_resume_id_key UNIQUE (resume_id);


--
-- TOC entry 5035 (class 2606 OID 16472)
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (resume_id);


--
-- TOC entry 5071 (class 2606 OID 16703)
-- Name: roadmaps roadmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_pkey PRIMARY KEY (roadmap_id);


--
-- TOC entry 5079 (class 2606 OID 16744)
-- Name: saved_jobs saved_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_pkey PRIMARY KEY (saved_id);


--
-- TOC entry 5075 (class 2606 OID 16732)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (setting_id);


--
-- TOC entry 5077 (class 2606 OID 16734)
-- Name: settings settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_setting_key_key UNIQUE (setting_key);


--
-- TOC entry 5051 (class 2606 OID 16577)
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);


--
-- TOC entry 5053 (class 2606 OID 16579)
-- Name: skills skills_skill_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_name_key UNIQUE (skill_name);


--
-- TOC entry 5055 (class 2606 OID 16586)
-- Name: student_skills student_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_pkey PRIMARY KEY (student_id, skill_id);


--
-- TOC entry 5021 (class 2606 OID 16409)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- TOC entry 5023 (class 2606 OID 16411)
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- TOC entry 5017 (class 2606 OID 16399)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5019 (class 2606 OID 16397)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5089 (class 2606 OID 16444)
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5094 (class 2606 OID 16548)
-- Name: applications applications_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE;


--
-- TOC entry 5095 (class 2606 OID 16543)
-- Name: applications applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 16718)
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5111 (class 2606 OID 16784)
-- Name: certificates certificates_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id);


--
-- TOC entry 5112 (class 2606 OID 16797)
-- Name: experience experience_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experience
    ADD CONSTRAINT experience_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id);


--
-- TOC entry 5087 (class 2606 OID 16802)
-- Name: recruiters fk_recruiters_company; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT fk_recruiters_company FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- TOC entry 5086 (class 2606 OID 16412)
-- Name: students fk_student_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5102 (class 2606 OID 16642)
-- Name: interview_answers interview_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_answers
    ADD CONSTRAINT interview_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.interview_questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 5103 (class 2606 OID 16660)
-- Name: interview_evaluation interview_evaluation_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_evaluation
    ADD CONSTRAINT interview_evaluation_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.interview_sessions(session_id) ON DELETE CASCADE;


--
-- TOC entry 5101 (class 2606 OID 16626)
-- Name: interview_questions interview_questions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.interview_sessions(session_id) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 16564)
-- Name: interview_sessions interview_sessions_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interview_sessions
    ADD CONSTRAINT interview_sessions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id) ON DELETE CASCADE;


--
-- TOC entry 5099 (class 2606 OID 16604)
-- Name: job_skills job_skills_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id) ON DELETE CASCADE;


--
-- TOC entry 5100 (class 2606 OID 16609)
-- Name: job_skills job_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_skills
    ADD CONSTRAINT job_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- TOC entry 5093 (class 2606 OID 16526)
-- Name: jobs jobs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id) ON DELETE CASCADE;


--
-- TOC entry 5104 (class 2606 OID 16678)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5109 (class 2606 OID 16766)
-- Name: recruiter_feedback recruiter_feedback_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_feedback
    ADD CONSTRAINT recruiter_feedback_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(application_id);


--
-- TOC entry 5110 (class 2606 OID 16771)
-- Name: recruiter_feedback recruiter_feedback_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiter_feedback
    ADD CONSTRAINT recruiter_feedback_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.recruiters(recruiter_id);


--
-- TOC entry 5088 (class 2606 OID 16428)
-- Name: recruiters recruiters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruiters
    ADD CONSTRAINT recruiters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5091 (class 2606 OID 16491)
-- Name: resume_analysis resume_analysis_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_analysis
    ADD CONSTRAINT resume_analysis_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(resume_id) ON DELETE CASCADE;


--
-- TOC entry 5092 (class 2606 OID 16509)
-- Name: resume_embeddings resume_embeddings_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resume_embeddings
    ADD CONSTRAINT resume_embeddings_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(resume_id) ON DELETE CASCADE;


--
-- TOC entry 5090 (class 2606 OID 16473)
-- Name: resumes resumes_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 5105 (class 2606 OID 16704)
-- Name: roadmaps roadmaps_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roadmaps
    ADD CONSTRAINT roadmaps_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 5107 (class 2606 OID 16750)
-- Name: saved_jobs saved_jobs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(job_id);


--
-- TOC entry 5108 (class 2606 OID 16745)
-- Name: saved_jobs saved_jobs_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_jobs
    ADD CONSTRAINT saved_jobs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id);


--
-- TOC entry 5097 (class 2606 OID 16592)
-- Name: student_skills student_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE;


--
-- TOC entry 5098 (class 2606 OID 16587)
-- Name: student_skills student_skills_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_skills
    ADD CONSTRAINT student_skills_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


-- Completed on 2026-08-18 23:39:54

--
-- PostgreSQL database dump complete
--

\unrestrict qevvb0G1hTLtxLTrST9eeIMkRdFbIly4ehb3tclDoWhfJbweQBCLTh2litEuRUP

