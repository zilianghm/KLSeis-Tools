/*
 Navicat PostgreSQL Data Transfer

 Source Server         : 10.88.51.112
 Source Server Type    : PostgreSQL
 Source Server Version : 120012 (120012)
 Source Host           : 10.88.51.112:5432
 Source Catalog        : klseis_panel
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 120012 (120012)
 File Encoding         : 65001

 Date: 11/02/2025 17:27:51
*/


-- ----------------------------
-- Sequence structure for kl_app_category_i18n_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_app_category_i18n_id_seq";
CREATE SEQUENCE "public"."kl_app_category_i18n_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 1000000
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kl_app_category_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_app_category_id_seq";
CREATE SEQUENCE "public"."kl_app_category_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 1000000
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kl_app_i18n_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_app_i18n_id_seq";
CREATE SEQUENCE "public"."kl_app_i18n_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 100000000
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kl_app_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_app_id_seq";
CREATE SEQUENCE "public"."kl_app_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 100000000
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kl_comment_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_comment_id_seq";
CREATE SEQUENCE "public"."kl_comment_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 10000000000
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for kl_package_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."kl_package_id_seq";
CREATE SEQUENCE "public"."kl_package_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 100000000
START 1
CACHE 1;

-- ----------------------------
-- Table structure for kl_app
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app";
CREATE TABLE "public"."kl_app" (
  "app_id" int4 NOT NULL DEFAULT nextval('kl_app_id_seq'::regclass),
  "app_name" varchar(255) COLLATE "pg_catalog"."default",
  "category_id" int4,
  "version" float4,
  "description" varchar(255) COLLATE "pg_catalog"."default",
  "logo" text COLLATE "pg_catalog"."default",
  "detail" text COLLATE "pg_catalog"."default",
  "app_start_item" varchar(255) COLLATE "pg_catalog"."default",
  "base_package_version" varchar(255) COLLATE "pg_catalog"."default",
  "type" int4,
  "charts" text COLLATE "pg_catalog"."default",
  "rich_text_detail" text COLLATE "pg_catalog"."default",
  "sort" int4,
  "runnable" int4,
  "image_url" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_category
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_category";
CREATE TABLE "public"."kl_app_category" (
  "category_id" int4 NOT NULL DEFAULT nextval('kl_app_category_id_seq'::regclass),
  "category_name" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(2550) COLLATE "pg_catalog"."default",
  "logo" text COLLATE "pg_catalog"."default",
  "code" varchar(255) COLLATE "pg_catalog"."default",
  "context" text COLLATE "pg_catalog"."default",
  "charts" text COLLATE "pg_catalog"."default",
  "sort" int4,
  "image_url" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_category_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_category_i18n";
CREATE TABLE "public"."kl_app_category_i18n" (
  "source_id" int4 NOT NULL,
  "category_name" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(2550) COLLATE "pg_catalog"."default",
  "id" int4 NOT NULL DEFAULT nextval('kl_app_category_i18n_id_seq'::regclass),
  "language_code" varchar(255) COLLATE "pg_catalog"."default",
  "context" text COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_i18n";
CREATE TABLE "public"."kl_app_i18n" (
  "source_id" int4 NOT NULL,
  "app_name" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(255) COLLATE "pg_catalog"."default",
  "id" int4 NOT NULL DEFAULT nextval('kl_app_i18n_id_seq'::regclass),
  "language_code" varchar(255) COLLATE "pg_catalog"."default",
  "detail" text COLLATE "pg_catalog"."default",
  "rich_text_detail" text COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_icon
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_icon";
CREATE TABLE "public"."kl_app_icon" (
  "id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "tag" varchar(255) COLLATE "pg_catalog"."default",
  "app_id" int4,
  "app_version" float4,
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "size" int4,
  "deleted" int2,
  "path" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_icon_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_icon_i18n";
CREATE TABLE "public"."kl_app_icon_i18n" (
  "id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "tag" varchar(255) COLLATE "pg_catalog"."default",
  "app_id" int4,
  "app_version" float4,
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "size" int4,
  "deleted" int2,
  "path" varchar(255) COLLATE "pg_catalog"."default",
  "source_id" int4,
  "language_code" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Table structure for kl_app_log
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_log";
CREATE TABLE "public"."kl_app_log" (
  "id" int4 NOT NULL,
  "app_id" int4,
  "version" float4,
  "download_time" timestamptz(0),
  "download_user" varchar(255) COLLATE "pg_catalog"."default",
  "flag" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(2550) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_app_log_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_app_log_i18n";
CREATE TABLE "public"."kl_app_log_i18n" (
  "id" int4 NOT NULL,
  "app_id" int4,
  "version" varchar(255) COLLATE "pg_catalog"."default",
  "download_time" timestamptz(0),
  "download_user" varchar(255) COLLATE "pg_catalog"."default",
  "flag" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "source_id" int4,
  "language_code" varchar(255) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_carousel_image
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_carousel_image";
CREATE TABLE "public"."kl_carousel_image" (
  "id" int4 NOT NULL,
  "carousel_image" varchar(255) COLLATE "pg_catalog"."default",
  "context" varchar(255) COLLATE "pg_catalog"."default",
  "group" int4,
  "order" int4,
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6)
)
;



-- ----------------------------
-- Table structure for kl_carousel_image_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_carousel_image_i18n";
CREATE TABLE "public"."kl_carousel_image_i18n" (
  "id" int4 NOT NULL,
  "carousel_image" varchar(255) COLLATE "pg_catalog"."default",
  "context" varchar(255) COLLATE "pg_catalog"."default",
  "group" int4,
  "order" int4,
  "upload_user" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "source_id" int4,
  "language_code" varchar(255) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_comment
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_comment";
CREATE TABLE "public"."kl_comment" (
  "id" int4 NOT NULL DEFAULT nextval('kl_comment_id_seq'::regclass),
  "parent_id" int4,
  "app_id" int4,
  "content" varchar(2550) COLLATE "pg_catalog"."default",
  "images" varchar(2550) COLLATE "pg_catalog"."default",
  "thumb_up_num" int4,
  "user_id" int8,
  "create_time" timestamptz(6),
  "mac" varchar(255) COLLATE "pg_catalog"."default",
  "ip" varchar(255) COLLATE "pg_catalog"."default",
  "username" varchar(255) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_dll_ require
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_dll_ require";
CREATE TABLE "public"."kl_dll_ require" (
  "id" int4 NOT NULL,
  "dll_name" varchar(255) COLLATE "pg_catalog"."default",
  "dll_path" varchar(255) COLLATE "pg_catalog"."default",
  "app_id" int4,
  "app_version" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "os" varchar(255) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_dll_ require_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_dll_ require_i18n";
CREATE TABLE "public"."kl_dll_ require_i18n" (
  "id" int4 NOT NULL,
  "dll_name" varchar(255) COLLATE "pg_catalog"."default",
  "dll_path" varchar(255) COLLATE "pg_catalog"."default",
  "app_id" int4,
  "app_version" varchar(255) COLLATE "pg_catalog"."default",
  "upload_time" timestamptz(6),
  "os" varchar(255) COLLATE "pg_catalog"."default",
  "source_id" int4,
  "language_code" varchar(255) COLLATE "pg_catalog"."default"
)
;



-- ----------------------------
-- Table structure for kl_package
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_package";
CREATE TABLE "public"."kl_package" (
  "package_id" int4 NOT NULL DEFAULT nextval('kl_package_id_seq'::regclass),
  "package_name" varchar(255) COLLATE "pg_catalog"."default",
  "package_version" varchar(24) COLLATE "pg_catalog"."default",
  "object_name" varchar(255) COLLATE "pg_catalog"."default",
  "size" int8,
  "deleted" int4 DEFAULT 0,
  "path" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(255) COLLATE "pg_catalog"."default",
  "klseis_version" varchar(24) COLLATE "pg_catalog"."default",
  "type" int4,
  "bucket_name" varchar(255) COLLATE "pg_catalog"."default"
)
;
COMMENT ON COLUMN "public"."kl_package"."type" IS '1:安装包,2:klseis,3:klseis单一应用';


-- ----------------------------
-- Table structure for kl_package_i18n
-- ----------------------------
DROP TABLE IF EXISTS "public"."kl_package_i18n";
CREATE TABLE "public"."kl_package_i18n" (
  "id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "app_id" int4,
  "app_version" float4,
  "os" varchar(255) COLLATE "pg_catalog"."default",
  "size" int8,
  "deleted" int2,
  "path" varchar(255) COLLATE "pg_catalog"."default",
  "description" varchar(255) COLLATE "pg_catalog"."default",
  "source_id" int4,
  "language_code" varchar(255) COLLATE "pg_catalog"."default"
)
;


-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_app_category_i18n_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_app_category_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_app_i18n_id_seq"', 3, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_app_id_seq"', 102, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_comment_id_seq"', 32, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
SELECT setval('"public"."kl_package_id_seq"', 4, true);

-- ----------------------------
-- Primary Key structure for table kl_app
-- ----------------------------
ALTER TABLE "public"."kl_app" ADD CONSTRAINT "kl_app_pkey" PRIMARY KEY ("app_id");

-- ----------------------------
-- Primary Key structure for table kl_app_category
-- ----------------------------
ALTER TABLE "public"."kl_app_category" ADD CONSTRAINT "kl_app_category_pkey" PRIMARY KEY ("category_id");

-- ----------------------------
-- Primary Key structure for table kl_app_category_i18n
-- ----------------------------
ALTER TABLE "public"."kl_app_category_i18n" ADD CONSTRAINT "kl_app_category_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_app_i18n
-- ----------------------------
ALTER TABLE "public"."kl_app_i18n" ADD CONSTRAINT "kl_app_i18n_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_app_icon
-- ----------------------------
ALTER TABLE "public"."kl_app_icon" ADD CONSTRAINT "kl_app_icon_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_app_icon_i18n
-- ----------------------------
ALTER TABLE "public"."kl_app_icon_i18n" ADD CONSTRAINT "kl_app_icon_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_app_log
-- ----------------------------
ALTER TABLE "public"."kl_app_log" ADD CONSTRAINT "kl_app_download_log_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_app_log_i18n
-- ----------------------------
ALTER TABLE "public"."kl_app_log_i18n" ADD CONSTRAINT "kl_app_log_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_carousel_image
-- ----------------------------
ALTER TABLE "public"."kl_carousel_image" ADD CONSTRAINT "kl_app_carousel_image_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_carousel_image_i18n
-- ----------------------------
ALTER TABLE "public"."kl_carousel_image_i18n" ADD CONSTRAINT "kl_carousel_image_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_comment
-- ----------------------------
ALTER TABLE "public"."kl_comment" ADD CONSTRAINT "kl_comment_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_dll_ require
-- ----------------------------
ALTER TABLE "public"."kl_dll_ require" ADD CONSTRAINT "kl_app_dll_ require_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_dll_ require_i18n
-- ----------------------------
ALTER TABLE "public"."kl_dll_ require_i18n" ADD CONSTRAINT "kl_dll_ require_copy1_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table kl_package
-- ----------------------------
ALTER TABLE "public"."kl_package" ADD CONSTRAINT "kl_package_pkey" PRIMARY KEY ("package_id");

-- ----------------------------
-- Primary Key structure for table kl_package_i18n
-- ----------------------------
ALTER TABLE "public"."kl_package_i18n" ADD CONSTRAINT "kl_package_copy1_pkey" PRIMARY KEY ("id");
