#!/bin/bash
set -e

# ─── KONFIGURASI YANG BISA DIUBAH ────────────────────────────────────────────
APP_DIR="wedding-invitation-platform"
BRAND_NAME="MomenNikah"
WHATSAPP_NUMBER="6281234567890"
WEBSITE_URL="https://momennikah.com"
# ─────────────────────────────────────────────────────────────────────────────

if ! command -v php >/dev/null 2>&1; then
  echo "ERROR: PHP CLI diperlukan untuk membuat password hash."
  echo "Install PHP lalu jalankan script ini kembali."
  exit 1
fi

ADMIN_HASH=$(php -r "echo password_hash('admin123', PASSWORD_DEFAULT);")

mkdir -p "$APP_DIR"/{public,admin,api,config,database}

# ══════════════════════════════════════════════════════════════════════════════
# config/database.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/config/database.php" << 'PHPEOF'
<?php
function get_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $host    = 'localhost';
    $dbname  = 'wedding_db';
    $user    = 'root';
    $pass    = '';
    $charset = 'utf8mb4';
    $dsn     = "mysql:host={$host};dbname={$dbname};charset={$charset}";
    $opts    = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        $pdo = new PDO($dsn, $user, $pass, $opts);
    } catch (PDOException $e) {
        error_log('DB Error: ' . $e->getMessage());
        die('Koneksi database gagal. Silakan hubungi administrator.');
    }
    return $pdo;
}
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# config/app.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/config/app.php" << PHPEOF
<?php
define('BRAND_NAME',       '${BRAND_NAME}');
define('WHATSAPP_NUMBER',  '${WHATSAPP_NUMBER}');
define('WEBSITE_URL',      '${WEBSITE_URL}');
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# config/helpers.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/config/helpers.php" << 'PHPEOF'
<?php
function h(mixed $v): string {
    return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
function redirect(string $url): never {
    header('Location: ' . $url);
    exit;
}
function json_response(bool $success, string $message, array $data = []): never {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}
function sanitize(string $v): string {
    return trim(strip_tags($v));
}
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# config/csrf.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/config/csrf.php" << 'PHPEOF'
<?php
function csrf_start(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
}
function csrf_token(): string {
    csrf_start();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}
function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . h(csrf_token()) . '">';
}
function csrf_verify(string $token): bool {
    csrf_start();
    if (empty($_SESSION['csrf_token'])) return false;
    return hash_equals($_SESSION['csrf_token'], $token);
}
function csrf_enforce(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (!csrf_verify($token)) {
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            json_response(false, 'Token keamanan tidak valid. Muat ulang halaman.');
        }
        http_response_code(403);
        die('Token keamanan tidak valid.');
    }
}
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# config/auth.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/config/auth.php" << 'PHPEOF'
<?php
function require_admin(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (empty($_SESSION['admin_id'])) {
        header('Location: login.php');
        exit;
    }
}
function admin_login(int $id, string $username): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    session_regenerate_id(true);
    $_SESSION['admin_id']       = $id;
    $_SESSION['admin_username'] = $username;
}
function admin_logout(): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# database/schema.sql
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/database/schema.sql" << 'SQLEOF'
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `admins` (
  `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(80)     NOT NULL UNIQUE,
  `password_hash` VARCHAR(255)    NOT NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `invitations` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug`             VARCHAR(120) NOT NULL UNIQUE,
  `bride_name`       VARCHAR(120) NOT NULL,
  `groom_name`       VARCHAR(120) NOT NULL,
  `wedding_date`     DATE         NOT NULL,
  `akad_time`        VARCHAR(80)  NOT NULL DEFAULT '',
  `reception_time`   VARCHAR(80)  NOT NULL DEFAULT '',
  `venue_name`       VARCHAR(200) NOT NULL DEFAULT '',
  `venue_address`    TEXT         NOT NULL,
  `map_embed_url`    TEXT         NOT NULL DEFAULT '',
  `music_url`        VARCHAR(500) NOT NULL DEFAULT '',
  `gallery_json`     JSON         NOT NULL,
  `opening_message`  TEXT         NOT NULL DEFAULT '',
  `package_name`     VARCHAR(80)  NOT NULL DEFAULT 'Basic',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `orders` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_name`    VARCHAR(120) NOT NULL,
  `couple_name`      VARCHAR(200) NOT NULL,
  `wedding_date`     DATE         NOT NULL,
  `package_name`     VARCHAR(80)  NOT NULL,
  `notes`            TEXT         NOT NULL DEFAULT '',
  `whatsapp_number`  VARCHAR(30)  NOT NULL DEFAULT '',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rsvp` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invitation_id`     INT UNSIGNED NOT NULL,
  `guest_name`        VARCHAR(150) NOT NULL,
  `attendance_status` ENUM('hadir','tidak_hadir','belum_pasti') NOT NULL DEFAULT 'belum_pasti',
  `message`           TEXT         NOT NULL DEFAULT '',
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invitation_id` (`invitation_id`),
  CONSTRAINT `fk_rsvp_invitation` FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `guestbook_messages` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invitation_id` INT UNSIGNED NOT NULL,
  `guest_name`    VARCHAR(150) NOT NULL,
  `message`       TEXT         NOT NULL,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invitation_id` (`invitation_id`),
  CONSTRAINT `fk_guestbook_invitation` FOREIGN KEY (`invitation_id`) REFERENCES `invitations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
SQLEOF

# ══════════════════════════════════════════════════════════════════════════════
# database/seed.sql   (admin hash injected via printf)
# ══════════════════════════════════════════════════════════════════════════════
{
  echo "SET NAMES utf8mb4;"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  echo ""
  printf "INSERT IGNORE INTO \`admins\` (\`username\`, \`password_hash\`) VALUES ('admin', '%s');\n" "$ADMIN_HASH"
  echo ""
  cat << 'SQLEOF'
INSERT IGNORE INTO `invitations`
  (`slug`, `bride_name`, `groom_name`, `wedding_date`,
   `akad_time`, `reception_time`, `venue_name`, `venue_address`,
   `map_embed_url`, `music_url`, `gallery_json`, `opening_message`, `package_name`)
VALUES (
  'budi-dan-sari',
  'Sari Rahayu',
  'Budi Santoso',
  '2025-09-20',
  '08.00 – 10.00 WIB',
  '11.00 – selesai WIB',
  'Gedung Serbaguna Permata',
  'Jl. Pahlawan No. 45, Kelurahan Maju Jaya, Kota Bandung, Jawa Barat 40123',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.0!2d107.6!3d-6.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnMDAuMCJTIDEwN8KwMzYnMDAuMCJF!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid',
  '',
  '[]',
  'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami.',
  'Premium'
);

INSERT IGNORE INTO `rsvp` (`invitation_id`, `guest_name`, `attendance_status`, `message`)
SELECT id, 'Ahmad Fauzi', 'hadir', 'Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah mawaddah warahmah.'
FROM `invitations` WHERE `slug` = 'budi-dan-sari' LIMIT 1;

INSERT IGNORE INTO `rsvp` (`invitation_id`, `guest_name`, `attendance_status`, `message`)
SELECT id, 'Dewi Lestari', 'hadir', 'Semoga rumah tangganya langgeng dan penuh berkah.'
FROM `invitations` WHERE `slug` = 'budi-dan-sari' LIMIT 1;

INSERT IGNORE INTO `guestbook_messages` (`invitation_id`, `guest_name`, `message`)
SELECT id, 'Rizky Pratama', 'Barakallahu lakuma wa baraka alaikuma wa jama''a bainakuma fi khair. Selamat ya!'
FROM `invitations` WHERE `slug` = 'budi-dan-sari' LIMIT 1;

INSERT IGNORE INTO `guestbook_messages` (`invitation_id`, `guest_name`, `message`)
SELECT id, 'Ninda Kartika', 'Selamat berbahagia untuk pasangan baru, semoga selalu harmonis dan diberikan keturunan yang sholeh sholehah.'
FROM `invitations` WHERE `slug` = 'budi-dan-sari' LIMIT 1;

INSERT IGNORE INTO `orders` (`customer_name`, `couple_name`, `wedding_date`, `package_name`, `notes`, `whatsapp_number`)
VALUES ('Hendra Gunawan', 'Hendra & Maya', '2025-10-15', 'Premium', 'Mohon bantu desain tema bunga putih elegan.', '628119876543');

SET FOREIGN_KEY_CHECKS = 1;
SQLEOF
} > "$APP_DIR/database/seed.sql"

# ══════════════════════════════════════════════════════════════════════════════
# public/styles.css
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/public/styles.css" << 'CSSEOF'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --blue:      #3b82f6;
  --blue-dark: #1d4ed8;
  --blue-lt:   #eff6ff;
  --slate:     #1e293b;
  --slate-m:   #475569;
  --slate-l:   #94a3b8;
  --border:    #e2e8f0;
  --white:     #ffffff;
  --bg:        #f8fafc;
  --gold:      #d97706;
  --radius:    0.5rem;
  --shadow:    0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
  --shadow-lg: 0 10px 15px rgba(0,0,0,.07), 0 4px 6px rgba(0,0,0,.05);
}
html { scroll-behavior: smooth; }
body { font-family: 'Segoe UI', system-ui, sans-serif; color: var(--slate); background: var(--white); line-height: 1.6; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; }

/* ── Navbar ── */
.navbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); }
.nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; display: flex; align-items: center; justify-content: space-between; height: 64px; }
.nav-brand { font-size: 1.25rem; font-weight: 700; color: var(--slate); display: flex; align-items: center; gap: .5rem; }
.nav-brand span { color: var(--blue); }
.nav-links { display: flex; align-items: center; gap: 1.75rem; list-style: none; }
.nav-links a { font-size: .9rem; color: var(--slate-m); font-weight: 500; transition: color .2s; }
.nav-links a:hover { color: var(--blue); }
.nav-cta { display: flex; gap: .75rem; }
.hamburger { display: none; background: none; border: none; cursor: pointer; padding: .25rem; }
.hamburger span { display: block; width: 24px; height: 2px; background: var(--slate); margin: 5px 0; transition: all .3s; }
@media(max-width:768px) {
  .nav-links, .nav-cta { display: none; flex-direction: column; gap: .5rem; }
  .nav-links.open, .nav-cta.open { display: flex; }
  .nav-links { position: absolute; top: 64px; left: 0; right: 0; background: var(--white); border-bottom: 1px solid var(--border); padding: 1rem 1.5rem; }
  .nav-cta { position: absolute; top: auto; left: 0; right: 0; background: var(--white); padding: .75rem 1.5rem 1rem; border-bottom: 1px solid var(--border); }
  .hamburger { display: block; }
  .mobile-menu-wrap { position: relative; }
}

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .6rem 1.4rem; border-radius: var(--radius); font-size: .9rem; font-weight: 600; cursor: pointer; border: none; transition: all .2s; text-align: center; }
.btn-primary { background: var(--blue); color: var(--white); }
.btn-primary:hover { background: var(--blue-dark); }
.btn-outline { background: transparent; border: 1.5px solid var(--blue); color: var(--blue); }
.btn-outline:hover { background: var(--blue-lt); }
.btn-white { background: var(--white); color: var(--blue); font-weight: 700; }
.btn-white:hover { background: var(--blue-lt); }
.btn-wa { background: #25d366; color: #fff; }
.btn-wa:hover { background: #1ebe5d; }
.btn-lg { padding: .85rem 2rem; font-size: 1rem; }
.btn-sm { padding: .4rem 1rem; font-size: .82rem; }
.btn-block { width: 100%; }

/* ── Section layout ── */
.section { padding: 5rem 1.5rem; }
.section-alt { background: var(--bg); }
.container { max-width: 1100px; margin: 0 auto; }
.section-label { display: inline-block; background: var(--blue-lt); color: var(--blue); font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: .3rem .9rem; border-radius: 2rem; margin-bottom: 1rem; }
.section-title { font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 800; color: var(--slate); line-height: 1.25; margin-bottom: .75rem; }
.section-sub { font-size: 1rem; color: var(--slate-m); max-width: 560px; }
.text-center { text-align: center; }
.text-center .section-sub { margin: 0 auto; }

/* ── Hero ── */
.hero { background: linear-gradient(135deg, var(--blue-lt) 0%, #ffffff 60%); padding: 6rem 1.5rem; }
.hero-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
.hero-badge { display: inline-flex; align-items: center; gap: .4rem; background: var(--blue-lt); color: var(--blue); font-size: .78rem; font-weight: 700; padding: .3rem .9rem; border-radius: 2rem; margin-bottom: 1.25rem; border: 1px solid rgba(59,130,246,.2); }
.hero-title { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; color: var(--slate); line-height: 1.15; margin-bottom: 1rem; }
.hero-title em { color: var(--blue); font-style: normal; }
.hero-desc { color: var(--slate-m); font-size: 1.05rem; margin-bottom: 2rem; max-width: 480px; }
.hero-btns { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem; }
.hero-stats { display: flex; flex-wrap: wrap; gap: 2rem; }
.hero-stat strong { display: block; font-size: 1.3rem; font-weight: 800; color: var(--slate); }
.hero-stat span { font-size: .82rem; color: var(--slate-m); }
.hero-card { background: var(--white); border-radius: 1.25rem; padding: 2rem; box-shadow: var(--shadow-lg); border: 1px solid var(--border); }
.hero-card-title { font-size: 1.1rem; font-weight: 700; text-align: center; color: var(--blue); margin-bottom: .25rem; }
.hero-card-names { font-size: 1.5rem; font-weight: 800; text-align: center; margin-bottom: .5rem; }
.hero-card-date { text-align: center; color: var(--slate-m); font-size: .9rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.hero-card-detail { display: flex; flex-direction: column; gap: .6rem; }
.hero-detail-row { display: flex; align-items: flex-start; gap: .6rem; font-size: .88rem; }
.hero-detail-row .icon { color: var(--blue); flex-shrink: 0; font-size: 1rem; }
@media(max-width:768px) { .hero-inner { grid-template-columns: 1fr; } .hero-card { display: none; } }

/* ── Features grid ── */
.features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.feature-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; box-shadow: var(--shadow); transition: box-shadow .2s, transform .2s; }
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-icon { width: 46px; height: 46px; border-radius: .75rem; background: var(--blue-lt); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 1rem; }
.feature-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: .4rem; }
.feature-card p { font-size: .88rem; color: var(--slate-m); }

/* ── Pricing ── */
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 3rem; align-items: start; }
.pricing-card { background: var(--white); border: 1.5px solid var(--border); border-radius: 1rem; padding: 2rem; position: relative; }
.pricing-card.popular { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(59,130,246,.12), var(--shadow-md); }
.popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--blue); color: var(--white); font-size: .75rem; font-weight: 700; padding: .3rem 1rem; border-radius: 2rem; white-space: nowrap; }
.pricing-name { font-size: 1.1rem; font-weight: 700; margin-bottom: .5rem; }
.pricing-price { font-size: 2rem; font-weight: 900; color: var(--slate); }
.pricing-price span { font-size: 1rem; font-weight: 500; color: var(--slate-m); }
.pricing-desc { font-size: .85rem; color: var(--slate-m); margin-bottom: 1.5rem; margin-top: .25rem; }
.pricing-features { list-style: none; margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: .6rem; }
.pricing-features li { font-size: .9rem; display: flex; align-items: flex-start; gap: .5rem; }
.pricing-features li::before { content: '✓'; color: var(--blue); font-weight: 700; flex-shrink: 0; }

/* ── Steps ── */
.steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; margin-top: 3rem; }
.step { text-align: center; }
.step-num { width: 56px; height: 56px; background: var(--blue); color: var(--white); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; margin: 0 auto 1rem; }
.step h3 { font-size: 1rem; font-weight: 700; margin-bottom: .4rem; }
.step p { font-size: .88rem; color: var(--slate-m); }

/* ── Testimonials ── */
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
.testi-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.75rem; box-shadow: var(--shadow); }
.testi-stars { color: var(--gold); font-size: 1.1rem; margin-bottom: .75rem; }
.testi-text { font-size: .92rem; color: var(--slate-m); margin-bottom: 1.25rem; font-style: italic; }
.testi-author { font-weight: 700; font-size: .9rem; }
.testi-role { font-size: .8rem; color: var(--slate-l); }

/* ── FAQ ── */
.faq-list { margin-top: 3rem; max-width: 720px; margin-left: auto; margin-right: auto; display: flex; flex-direction: column; gap: .75rem; }
.faq-item { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.faq-question { width: 100%; text-align: left; background: var(--white); border: none; padding: 1.1rem 1.25rem; font-size: .95rem; font-weight: 600; color: var(--slate); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 1rem; transition: background .2s; }
.faq-question:hover { background: var(--bg); }
.faq-arrow { font-size: 1rem; transition: transform .25s; flex-shrink: 0; }
.faq-item.open .faq-arrow { transform: rotate(180deg); }
.faq-answer { display: none; padding: 0 1.25rem 1.1rem; font-size: .9rem; color: var(--slate-m); line-height: 1.7; }
.faq-item.open .faq-answer { display: block; }

/* ── Order form ── */
.order-section { background: var(--blue-lt); }
.order-form-wrap { background: var(--white); border-radius: 1rem; padding: 2.5rem; box-shadow: var(--shadow-lg); max-width: 700px; margin: 2.5rem auto 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
@media(max-width:600px) { .form-grid { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: .4rem; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: .85rem; font-weight: 600; color: var(--slate); }
.form-group input, .form-group select, .form-group textarea {
  padding: .65rem .9rem; border: 1.5px solid var(--border); border-radius: var(--radius);
  font-size: .9rem; color: var(--slate); background: var(--white); transition: border-color .2s;
  font-family: inherit;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--blue); }
.form-group textarea { resize: vertical; min-height: 90px; }
.form-group .field-err { font-size: .78rem; color: #dc2626; display: none; }
.form-group.has-error input, .form-group.has-error select, .form-group.has-error textarea { border-color: #dc2626; }
.form-group.has-error .field-err { display: block; }
#form-feedback { margin-top: 1rem; padding: .8rem 1rem; border-radius: var(--radius); font-size: .9rem; display: none; }
#form-feedback.success { background: #d1fae5; color: #065f46; }
#form-feedback.error { background: #fee2e2; color: #991b1b; }

/* ── Footer ── */
.footer { background: var(--slate); color: #94a3b8; padding: 3rem 1.5rem; }
.footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; }
.footer-brand { font-size: 1.2rem; font-weight: 700; color: var(--white); margin-bottom: .75rem; }
.footer-brand span { color: var(--blue); }
.footer-desc { font-size: .88rem; line-height: 1.7; }
.footer h4 { color: var(--white); font-size: .95rem; font-weight: 700; margin-bottom: 1rem; }
.footer ul { list-style: none; display: flex; flex-direction: column; gap: .5rem; }
.footer ul li a { font-size: .88rem; transition: color .2s; }
.footer ul li a:hover { color: var(--white); }
.footer-bottom { max-width: 1100px; margin: 2rem auto 0; border-top: 1px solid #334155; padding-top: 1.5rem; font-size: .82rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .5rem; }
@media(max-width:768px) { .footer-inner { grid-template-columns: 1fr; gap: 1.75rem; } }

/* ── Admin ── */
.admin-body { background: var(--bg); min-height: 100vh; font-size: .9rem; }
.admin-top { background: var(--slate); color: var(--white); padding: .75rem 1.5rem; display: flex; align-items: center; justify-content: space-between; }
.admin-top .brand { font-weight: 700; font-size: 1.1rem; }
.admin-top a { color: #94a3b8; font-size: .85rem; }
.admin-top a:hover { color: var(--white); }
.admin-nav { background: var(--white); border-bottom: 1px solid var(--border); padding: 0 1.5rem; display: flex; gap: 0; overflow-x: auto; }
.admin-nav a { display: inline-flex; align-items: center; padding: .85rem 1.1rem; font-size: .88rem; font-weight: 500; color: var(--slate-m); border-bottom: 2.5px solid transparent; white-space: nowrap; transition: all .2s; }
.admin-nav a:hover, .admin-nav a.active { color: var(--blue); border-bottom-color: var(--blue); }
.admin-content { max-width: 1200px; margin: 2rem auto; padding: 0 1.5rem; }
.admin-page-title { font-size: 1.4rem; font-weight: 800; color: var(--slate); margin-bottom: 1.75rem; }
.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem; }
.stat-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow); }
.stat-card .label { font-size: .8rem; color: var(--slate-m); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }
.stat-card .value { font-size: 2rem; font-weight: 900; color: var(--slate); }
.admin-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow); margin-bottom: 2rem; }
.admin-card h2 { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: .75rem; border-bottom: 1px solid var(--border); }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: .65rem .75rem; font-size: .78rem; color: var(--slate-m); text-transform: uppercase; letter-spacing: .04em; background: var(--bg); border-bottom: 1px solid var(--border); }
.admin-table td { padding: .8rem .75rem; border-bottom: 1px solid var(--border); vertical-align: top; font-size: .88rem; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table-wrap { overflow-x: auto; }
.badge { display: inline-flex; align-items: center; padding: .2rem .65rem; border-radius: 2rem; font-size: .75rem; font-weight: 700; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-yellow { background: #fef9c3; color: #713f12; }
.badge-blue { background: var(--blue-lt); color: var(--blue); }
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 1.5rem; }
.login-box { background: var(--white); border: 1px solid var(--border); border-radius: 1rem; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); }
.login-title { font-size: 1.4rem; font-weight: 800; text-align: center; margin-bottom: .4rem; }
.login-sub { text-align: center; color: var(--slate-m); font-size: .88rem; margin-bottom: 2rem; }
.alert { padding: .75rem 1rem; border-radius: var(--radius); font-size: .88rem; margin-bottom: 1.25rem; }
.alert-error { background: #fee2e2; color: #991b1b; }
.alert-success { background: #d1fae5; color: #065f46; }
.empty-state { text-align: center; padding: 3rem 1.5rem; color: var(--slate-l); font-size: .9rem; }

/* ── Invitation page ── */
.inv-body { background: #f5f0eb; font-family: Georgia, 'Times New Roman', serif; color: var(--slate); }
.inv-hero { min-height: 100vh; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 50%, #1e3a5f 100%); display: flex; align-items: center; justify-content: center; text-align: center; padding: 3rem 1.5rem; position: relative; overflow: hidden; }
.inv-hero::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,.05) 0%, transparent 50%); }
.inv-hero-content { position: relative; z-index: 1; max-width: 560px; }
.inv-label { font-size: .75rem; letter-spacing: .2em; text-transform: uppercase; color: #a8c4e0; margin-bottom: 1.5rem; }
.inv-names { font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 700; color: var(--white); line-height: 1.2; margin-bottom: .5rem; }
.inv-amp { color: #c9a96e; font-size: 1.5em; font-style: italic; display: block; margin: .25rem 0; }
.inv-date { color: #a8c4e0; font-size: 1rem; margin-top: 1rem; }
.inv-opening { color: rgba(255,255,255,.8); font-size: .9rem; margin-top: 1.5rem; font-style: italic; line-height: 1.7; }
.inv-divider { width: 60px; height: 2px; background: #c9a96e; margin: 1.5rem auto; }
.inv-section { padding: 4rem 1.5rem; }
.inv-section-alt { background: var(--white); }
.inv-container { max-width: 680px; margin: 0 auto; }
.inv-section-title { font-size: 1.5rem; font-weight: 700; text-align: center; margin-bottom: 2rem; color: #1e3a5f; }
.inv-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
@media(max-width:500px) { .inv-detail-grid { grid-template-columns: 1fr; } }
.inv-detail-box { background: var(--white); border: 1px solid var(--border); border-radius: .75rem; padding: 1.5rem; text-align: center; }
.inv-detail-box h3 { font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: #c9a96e; margin-bottom: .6rem; }
.inv-detail-box p { font-size: .95rem; line-height: 1.6; color: var(--slate); }
.inv-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .75rem; margin-top: 1.5rem; }
.inv-gallery-grid img { border-radius: .5rem; width: 100%; height: 140px; object-fit: cover; }
.inv-gallery-empty { text-align: center; color: var(--slate-l); font-size: .9rem; padding: 2rem; }
.countdown { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin: 2rem 0; }
.countdown-box { text-align: center; min-width: 80px; }
.countdown-num { font-size: 2.5rem; font-weight: 800; color: #1e3a5f; line-height: 1; }
.countdown-label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--slate-l); margin-top: .3rem; }
.inv-form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
.inv-form input, .inv-form textarea, .inv-form select {
  padding: .7rem 1rem; border: 1.5px solid var(--border); border-radius: var(--radius);
  font-size: .9rem; font-family: inherit; color: var(--slate); background: var(--white);
}
.inv-form input:focus, .inv-form textarea:focus, .inv-form select:focus { outline: none; border-color: #2d5a8e; }
.inv-form textarea { min-height: 90px; resize: vertical; }
.inv-feedback { padding: .75rem 1rem; border-radius: var(--radius); font-size: .88rem; display: none; margin-top: .5rem; }
.inv-feedback.success { background: #d1fae5; color: #065f46; display: block; }
.inv-feedback.error { background: #fee2e2; color: #991b1b; display: block; }
.guestbook-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }
.guestbook-item { background: var(--white); border: 1px solid var(--border); border-radius: .75rem; padding: 1.25rem; }
.guestbook-item .gb-name { font-weight: 700; font-size: .95rem; margin-bottom: .35rem; }
.guestbook-item .gb-msg { font-size: .9rem; color: var(--slate-m); line-height: 1.6; }
.guestbook-item .gb-time { font-size: .75rem; color: var(--slate-l); margin-top: .4rem; }
.map-wrap iframe { width: 100%; height: 320px; border: none; border-radius: .75rem; }
.music-bar { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(30,58,95,.95); backdrop-filter: blur(8px); padding: .75rem 1.5rem; display: flex; align-items: center; gap: 1rem; z-index: 200; }
.music-bar audio { flex: 1; height: 32px; }
.music-toggle { background: #c9a96e; color: var(--white); border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
.inv-share { display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }
CSSEOF

# ══════════════════════════════════════════════════════════════════════════════
# public/script.js
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/public/script.js" << 'JSEOF'
/* ── Mobile menu ── */
document.addEventListener('DOMContentLoaded', function () {
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('nav-links');
  var navCta    = document.getElementById('nav-cta');

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var open = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!open));
      if (navLinks) navLinks.classList.toggle('open');
      if (navCta)   navCta.classList.toggle('open');
    });
  }

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── WhatsApp package buttons ── */
  document.querySelectorAll('[data-wa-package]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pkg  = btn.getAttribute('data-wa-package');
      var wa   = btn.getAttribute('data-wa-number') || '6281234567890';
      var text = 'Halo, saya ingin memesan undangan digital paket ' + pkg + '.';
      window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank');
    });
  });

  /* ── Landing page order form ── */
  var orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;

      orderForm.querySelectorAll('[required]').forEach(function (field) {
        var group = field.closest('.form-group');
        if (!field.value.trim()) {
          group.classList.add('has-error');
          valid = false;
        } else {
          group.classList.remove('has-error');
        }
      });

      if (!valid) return;

      var feedback = document.getElementById('form-feedback');
      var submitBtn = orderForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';

      var data = new FormData(orderForm);

      fetch(orderForm.getAttribute('action'), { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.success) {
            feedback.className = 'success';
            feedback.style.display = 'block';
            feedback.textContent = res.message;
            orderForm.reset();
            setTimeout(function () {
              if (res.wa_url) window.open(res.wa_url, '_blank');
            }, 800);
          } else {
            feedback.className = 'error';
            feedback.style.display = 'block';
            feedback.textContent = res.message;
          }
        })
        .catch(function () {
          feedback.className = 'error';
          feedback.style.display = 'block';
          feedback.textContent = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kirim Pesanan';
        });
    });

    orderForm.querySelectorAll('[required]').forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.value.trim()) field.closest('.form-group').classList.remove('has-error');
      });
    });
  }

  /* ── Countdown timer ── */
  var weddingDate = document.getElementById('wedding-datetime');
  if (weddingDate) {
    var target = new Date(weddingDate.getAttribute('data-date'));

    function updateCountdown() {
      var now  = new Date();
      var diff = target - now;
      if (diff <= 0) {
        ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.textContent = '00';
        });
        return;
      }
      var days    = Math.floor(diff / 86400000);
      var hours   = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000)  / 60000);
      var seconds = Math.floor((diff % 60000)    / 1000);

      function pad(n) { return String(n).padStart(2,'0'); }
      var elD = document.getElementById('cd-days');
      var elH = document.getElementById('cd-hours');
      var elM = document.getElementById('cd-minutes');
      var elS = document.getElementById('cd-seconds');
      if (elD) elD.textContent = pad(days);
      if (elH) elH.textContent = pad(hours);
      if (elM) elM.textContent = pad(minutes);
      if (elS) elS.textContent = pad(seconds);
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ── Music player toggle ── */
  var musicToggle = document.getElementById('music-toggle');
  var audioEl     = document.getElementById('bg-audio');
  if (musicToggle && audioEl) {
    musicToggle.addEventListener('click', function () {
      if (audioEl.paused) {
        audioEl.play().catch(function () {});
        musicToggle.textContent = '⏸';
      } else {
        audioEl.pause();
        musicToggle.textContent = '▶';
      }
    });
  }

  /* ── RSVP AJAX ── */
  var rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var feedback = document.getElementById('rsvp-feedback');
      var btn = rsvpForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';

      var data = new FormData(rsvpForm);

      fetch(rsvpForm.getAttribute('action'), { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          feedback.className = 'inv-feedback ' + (res.success ? 'success' : 'error');
          feedback.textContent = res.message;
          if (res.success) rsvpForm.reset();
        })
        .catch(function () {
          feedback.className = 'inv-feedback error';
          feedback.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Kirim RSVP';
        });
    });
  }

  /* ── Guestbook AJAX ── */
  var gbForm = document.getElementById('guestbook-form');
  if (gbForm) {
    gbForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var feedback = document.getElementById('guestbook-feedback');
      var btn = gbForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';

      var data = new FormData(gbForm);

      fetch(gbForm.getAttribute('action'), { method: 'POST', body: data })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          feedback.className = 'inv-feedback ' + (res.success ? 'success' : 'error');
          feedback.textContent = res.message;
          if (res.success) {
            gbForm.reset();
            setTimeout(function () { location.reload(); }, 1500);
          }
        })
        .catch(function () {
          feedback.className = 'inv-feedback error';
          feedback.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = 'Kirim Ucapan';
        });
    });
  }
});
JSEOF

# ══════════════════════════════════════════════════════════════════════════════
# public/index.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/public/index.php" << PHPEOF
<?php
require __DIR__ . '/../config/app.php';
require __DIR__ . '/../config/csrf.php';
require __DIR__ . '/../config/helpers.php';
csrf_start();
\$csrf_field = csrf_field();
\$wa = WHATSAPP_NUMBER;
\$brand = BRAND_NAME;
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= h(\$brand) ?> – Undangan Pernikahan Digital Elegan</title>
<meta name="description" content="Buat undangan pernikahan digital yang elegan, responsif, dan mudah dibagikan bersama <?= h(\$brand) ?>.">
<link rel="stylesheet" href="styles.css">
</head>
<body>

<!-- NAVBAR -->
<nav class="navbar">
  <div class="nav-inner mobile-menu-wrap">
    <a class="nav-brand" href="#beranda">💍 <span><?= h(\$brand) ?></span></a>
    <ul class="nav-links" id="nav-links">
      <li><a href="#fitur">Fitur</a></li>
      <li><a href="#harga">Harga</a></li>
      <li><a href="#cara-pesan">Cara Pesan</a></li>
      <li><a href="#testimoni">Testimoni</a></li>
      <li><a href="#faq">FAQ</a></li>
    </ul>
    <div class="nav-cta" id="nav-cta">
      <a class="btn btn-primary btn-sm" href="#pesan">Pesan Sekarang</a>
    </div>
    <button class="hamburger" id="hamburger" aria-label="Menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- HERO -->
<section class="hero" id="beranda">
  <div class="hero-inner">
    <div>
      <div class="hero-badge">✨ Undangan Digital Terpercaya</div>
      <h1 class="hero-title">Undangan Pernikahan <em>Digital</em> yang Elegan & Modern</h1>
      <p class="hero-desc">Buat undangan pernikahan digital yang memukau, responsif di semua perangkat, lengkap dengan RSVP, buku tamu, galeri foto, dan countdown. Tanpa biaya cetak, mudah dibagikan.</p>
      <div class="hero-btns">
        <a class="btn btn-primary btn-lg" href="#pesan">Pesan Undangan</a>
        <a class="btn btn-outline btn-lg" href="https://wa.me/<?= h(\$wa) ?>?text=Halo+saya+ingin+konsultasi+undangan+digital" target="_blank" rel="noopener">💬 Konsultasi Gratis</a>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><strong>500+</strong><span>Undangan Dikirim</span></div>
        <div class="hero-stat"><strong>4.9/5</strong><span>Rating Pelanggan</span></div>
        <div class="hero-stat"><strong>100%</strong><span>Responsif Mobile</span></div>
      </div>
    </div>
    <div>
      <div class="hero-card">
        <div class="hero-card-title">✦ Undangan Pernikahan ✦</div>
        <div class="hero-card-names">Budi & Sari</div>
        <div class="hero-card-date">📅 Sabtu, 20 September 2025 &nbsp;|&nbsp; Bandung</div>
        <div class="hero-card-detail">
          <div class="hero-detail-row"><span class="icon">🕌</span><span><strong>Akad:</strong> 08.00 – 10.00 WIB · Gedung Serbaguna Permata</span></div>
          <div class="hero-detail-row"><span class="icon">🎉</span><span><strong>Resepsi:</strong> 11.00 – selesai WIB · Gedung Serbaguna Permata</span></div>
          <div class="hero-detail-row"><span class="icon">📍</span><span>Jl. Pahlawan No. 45, Bandung</span></div>
          <div style="margin-top:1rem"><a class="btn btn-primary btn-block" href="invitation.php?slug=budi-dan-sari">Lihat Contoh Undangan →</a></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FITUR -->
<section class="section section-alt" id="fitur">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Fitur Lengkap</span>
      <h2 class="section-title">Semua yang Kamu Butuhkan</h2>
      <p class="section-sub">Undangan digital kami dilengkapi fitur-fitur modern untuk pengalaman undangan yang tak terlupakan.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card"><div class="feature-icon">🎨</div><h3>Desain Elegan</h3><p>Template premium dengan desain mewah dan modern, bisa dikustomisasi sesuai konsep pernikahan kamu.</p></div>
      <div class="feature-card"><div class="feature-icon">📱</div><h3>Responsif Semua Perangkat</h3><p>Tampil sempurna di HP, tablet, maupun laptop. Tamu bisa membuka dari perangkat apapun.</p></div>
      <div class="feature-card"><div class="feature-icon">🕌</div><h3>Detail Akad & Resepsi</h3><p>Informasi lengkap waktu dan tempat akad nikah dan resepsi tersaji secara jelas dan rapi.</p></div>
      <div class="feature-card"><div class="feature-icon">⏳</div><h3>Countdown Acara</h3><p>Hitung mundur otomatis menuju hari H yang akan terus berjalan real-time di perangkat tamu.</p></div>
      <div class="feature-card"><div class="feature-icon">🖼️</div><h3>Galeri Foto</h3><p>Tampilkan foto-foto prewedding atau momen spesial kalian dalam galeri yang elegan dan cantik.</p></div>
      <div class="feature-card"><div class="feature-icon">✅</div><h3>RSVP Online</h3><p>Tamu bisa konfirmasi kehadiran secara online lengkap dengan pesan. Data tersimpan di dashboard admin.</p></div>
      <div class="feature-card"><div class="feature-icon">💬</div><h3>Buku Tamu Digital</h3><p>Tamu bisa meninggalkan ucapan selamat yang tersimpan dan ditampilkan di halaman undangan.</p></div>
      <div class="feature-card"><div class="feature-icon">🎵</div><h3>Musik Latar</h3><p>Tambahkan musik romantis sebagai latar halaman undangan untuk kesan yang lebih berkesan.</p></div>
      <div class="feature-card"><div class="feature-icon">🗺️</div><h3>Peta Lokasi</h3><p>Embed Google Maps langsung di undangan agar tamu mudah menemukan lokasi acara.</p></div>
      <div class="feature-card"><div class="feature-icon">🔗</div><h3>Link Mudah Dibagikan</h3><p>Cukup kirim satu link pendek via WhatsApp, Instagram, atau media sosial lainnya kepada semua tamu.</p></div>
    </div>
  </div>
</section>

<!-- MENGAPA KAMI -->
<section class="section" id="kenapa-kami">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Mengapa Memilih Kami</span>
      <h2 class="section-title">Dipercaya Ratusan Pasangan</h2>
    </div>
    <div class="features-grid" style="margin-top:2.5rem">
      <div class="feature-card"><div class="feature-icon">⚡</div><h3>Proses Cepat</h3><p>Undangan siap dalam 1–2 hari kerja setelah data diterima. Tidak perlu tunggu lama.</p></div>
      <div class="feature-card"><div class="feature-icon">💰</div><h3>Harga Terjangkau</h3><p>Harga bersahabat tanpa mengorbankan kualitas. Jauh lebih hemat dibanding undangan cetak.</p></div>
      <div class="feature-card"><div class="feature-icon">🛡️</div><h3>Revisi Gratis</h3><p>Tidak puas dengan tampilan? Kami berikan revisi gratis sesuai paket yang kamu pilih.</p></div>
      <div class="feature-card"><div class="feature-icon">📞</div><h3>Support Responsif</h3><p>Tim kami siap membantu via WhatsApp selama jam kerja. Pertanyaan dijawab dengan cepat.</p></div>
    </div>
  </div>
</section>

<!-- HARGA -->
<section class="section section-alt" id="harga">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Paket Harga</span>
      <h2 class="section-title">Pilih Paket yang Sesuai</h2>
      <p class="section-sub">Semua paket sudah termasuk link undangan dan akses admin untuk kelola RSVP.</p>
    </div>
    <div class="pricing-grid">
      <div class="pricing-card">
        <div class="pricing-name">Basic</div>
        <div class="pricing-price">Rp 99.000 <span></span></div>
        <div class="pricing-desc">Cocok untuk pernikahan sederhana dengan fitur esensial.</div>
        <ul class="pricing-features">
          <li>1 Halaman Undangan</li>
          <li>RSVP Online</li>
          <li>Buku Tamu Digital</li>
          <li>Countdown Acara</li>
          <li>Peta Lokasi</li>
          <li>1x Revisi</li>
          <li>Aktif 3 Bulan</li>
        </ul>
        <button class="btn btn-outline btn-block" data-wa-package="Basic" data-wa-number="<?= h(\$wa) ?>">Pesan Paket Basic</button>
      </div>
      <div class="pricing-card popular">
        <div class="popular-badge">⭐ Paling Populer</div>
        <div class="pricing-name">Premium</div>
        <div class="pricing-price">Rp 149.000 <span></span></div>
        <div class="pricing-desc">Pilihan terbaik dengan fitur lengkap dan desain premium.</div>
        <ul class="pricing-features">
          <li>1 Halaman Undangan Premium</li>
          <li>RSVP Online</li>
          <li>Buku Tamu Digital</li>
          <li>Countdown Acara</li>
          <li>Galeri Foto (10 foto)</li>
          <li>Musik Latar</li>
          <li>Peta Lokasi</li>
          <li>Tombol Bagikan WhatsApp</li>
          <li>3x Revisi</li>
          <li>Aktif 6 Bulan</li>
        </ul>
        <button class="btn btn-primary btn-block" data-wa-package="Premium" data-wa-number="<?= h(\$wa) ?>">Pesan Paket Premium</button>
      </div>
      <div class="pricing-card">
        <div class="pricing-name">Eksklusif</div>
        <div class="pricing-price">Rp 249.000 <span></span></div>
        <div class="pricing-desc">Paket terlengkap dengan desain custom dan fitur maksimal.</div>
        <ul class="pricing-features">
          <li>1 Halaman Undangan Custom</li>
          <li>RSVP Online</li>
          <li>Buku Tamu Digital</li>
          <li>Countdown Acara</li>
          <li>Galeri Foto (30 foto)</li>
          <li>Musik Latar Custom</li>
          <li>Peta Lokasi</li>
          <li>Tombol Bagikan WhatsApp</li>
          <li>Animasi & Efek Transisi</li>
          <li>Revisi Tidak Terbatas</li>
          <li>Aktif 12 Bulan</li>
          <li>Prioritas Support</li>
        </ul>
        <button class="btn btn-outline btn-block" data-wa-package="Eksklusif" data-wa-number="<?= h(\$wa) ?>">Pesan Paket Eksklusif</button>
      </div>
    </div>
  </div>
</section>

<!-- CARA PESAN -->
<section class="section" id="cara-pesan">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Cara Pemesanan</span>
      <h2 class="section-title">Mudah dalam 4 Langkah</h2>
    </div>
    <div class="steps-grid">
      <div class="step"><div class="step-num">1</div><h3>Isi Formulir Pesanan</h3><p>Lengkapi formulir di bawah dengan data pernikahan dan pilih paket yang diinginkan.</p></div>
      <div class="step"><div class="step-num">2</div><h3>Konfirmasi via WhatsApp</h3><p>Tim kami menghubungi kamu via WhatsApp untuk konfirmasi pesanan dan detail undangan.</p></div>
      <div class="step"><div class="step-num">3</div><h3>Proses & Revisi</h3><p>Undangan dibuat sesuai data yang diberikan. Kamu bisa request revisi sesuai paket.</p></div>
      <div class="step"><div class="step-num">4</div><h3>Link Siap Dibagikan</h3><p>Link undangan aktif dan siap kamu kirimkan kepada semua tamu undangan.</p></div>
    </div>
  </div>
</section>

<!-- TESTIMONI -->
<section class="section section-alt" id="testimoni">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Testimoni</span>
      <h2 class="section-title">Kata Mereka</h2>
    </div>
    <div class="testimonials-grid">
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Undangannya sangat cantik dan elegan! Semua tamu memuji. Prosesnya cepat dan tim-nya super responsif. Sangat puas!"</p>
        <div class="testi-author">Rina & Fajar</div>
        <div class="testi-role">Pernikahan di Jakarta, Maret 2025</div>
      </div>
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Fitur RSVP-nya sangat membantu kami mengelola tamu. Tidak perlu repot-repot lagi konfirmasi satu per satu via WA."</p>
        <div class="testi-author">Dewi & Andi</div>
        <div class="testi-role">Pernikahan di Surabaya, April 2025</div>
      </div>
      <div class="testi-card">
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"Harga terjangkau tapi kualitasnya tidak murahan sama sekali. Desainnya mewah, musiknya pas, dan countdown-nya bikin excited!"</p>
        <div class="testi-author">Siti & Hendra</div>
        <div class="testi-role">Pernikahan di Yogyakarta, Mei 2025</div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section" id="faq">
  <div class="container">
    <div class="text-center">
      <span class="section-label">FAQ</span>
      <h2 class="section-title">Pertanyaan yang Sering Diajukan</h2>
    </div>
    <div class="faq-list">
      <div class="faq-item">
        <button class="faq-question">Berapa lama proses pembuatan undangan? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Proses pembuatan undangan membutuhkan waktu 1–2 hari kerja setelah semua data diterima dengan lengkap.</div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Apakah link undangan bisa dibagikan ke WhatsApp? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Ya, link undangan bisa langsung dikirim via WhatsApp, SMS, email, atau media sosial lainnya. Cukup salin dan bagikan.</div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Bagaimana cara melihat data RSVP tamu? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Setiap pesanan akan diberikan akses ke halaman admin khusus untuk memantau data RSVP dan buku tamu secara real-time.</div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Apakah undangan bisa diedit setelah dibuat? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Bisa, sesuai dengan jumlah revisi yang tersedia di paket pilihan kamu. Hubungi kami via WhatsApp untuk request perubahan.</div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Metode pembayaran apa yang tersedia? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Kami menerima transfer bank (BCA, Mandiri, BNI, BRI), GoPay, OVO, Dana, dan QRIS. Detail akan diberikan setelah konfirmasi pesanan.</div>
      </div>
      <div class="faq-item">
        <button class="faq-question">Apakah undangan bisa ditambah foto? <span class="faq-arrow">▼</span></button>
        <div class="faq-answer">Ya, paket Premium dan Eksklusif sudah dilengkapi fitur galeri foto. Kamu bisa kirimkan foto-foto untuk ditampilkan di undangan.</div>
      </div>
    </div>
  </div>
</section>

<!-- FORM PESAN -->
<section class="section order-section" id="pesan">
  <div class="container">
    <div class="text-center">
      <span class="section-label">Formulir Pesanan</span>
      <h2 class="section-title">Pesan Undangan Sekarang</h2>
      <p class="section-sub">Isi data di bawah ini dan kami akan segera menghubungi kamu via WhatsApp.</p>
    </div>
    <div class="order-form-wrap">
      <form id="order-form" action="../api/create_order.php" method="POST" novalidate>
        <?= \$csrf_field ?>
        <div class="form-grid">
          <div class="form-group">
            <label for="customer_name">Nama Pemesan *</label>
            <input type="text" id="customer_name" name="customer_name" placeholder="Nama lengkap kamu" required>
            <span class="field-err">Nama pemesan wajib diisi.</span>
          </div>
          <div class="form-group">
            <label for="whatsapp_number">Nomor WhatsApp *</label>
            <input type="tel" id="whatsapp_number" name="whatsapp_number" placeholder="628xxxxxxxxxx" required>
            <span class="field-err">Nomor WhatsApp wajib diisi.</span>
          </div>
          <div class="form-group">
            <label for="couple_name">Nama Mempelai *</label>
            <input type="text" id="couple_name" name="couple_name" placeholder="Nama Pengantin Pria & Wanita" required>
            <span class="field-err">Nama mempelai wajib diisi.</span>
          </div>
          <div class="form-group">
            <label for="wedding_date">Tanggal Acara *</label>
            <input type="date" id="wedding_date" name="wedding_date" required>
            <span class="field-err">Tanggal acara wajib diisi.</span>
          </div>
          <div class="form-group">
            <label for="package_name">Paket yang Dipilih *</label>
            <select id="package_name" name="package_name" required>
              <option value="">-- Pilih Paket --</option>
              <option value="Basic">Basic – Rp 99.000</option>
              <option value="Premium">Premium – Rp 149.000</option>
              <option value="Eksklusif">Eksklusif – Rp 249.000</option>
            </select>
            <span class="field-err">Pilih paket terlebih dahulu.</span>
          </div>
          <div class="form-group full">
            <label for="notes">Catatan Tambahan</label>
            <textarea id="notes" name="notes" placeholder="Konsep, warna favorit, permintaan khusus, dsb. (opsional)"></textarea>
          </div>
        </div>
        <div id="form-feedback"></div>
        <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:1rem">Kirim Pesanan</button>
      </form>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-inner">
    <div>
      <div class="footer-brand">💍 <span><?= h(\$brand) ?></span></div>
      <p class="footer-desc">Platform undangan pernikahan digital yang elegan, modern, dan mudah dibagikan. Kami membantu momen spesialmu menjadi lebih berkesan.</p>
    </div>
    <div>
      <h4>Tautan</h4>
      <ul>
        <li><a href="#fitur">Fitur</a></li>
        <li><a href="#harga">Harga</a></li>
        <li><a href="#cara-pesan">Cara Pesan</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
    </div>
    <div>
      <h4>Kontak</h4>
      <ul>
        <li><a href="https://wa.me/<?= h(\$wa) ?>" target="_blank" rel="noopener">💬 WhatsApp</a></li>
        <li><a href="invitation.php?slug=budi-dan-sari">🔗 Contoh Undangan</a></li>
        <li><a href="../admin/login.php">🔐 Admin Login</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© <?= date('Y') ?> <?= h(\$brand) ?>. Semua hak dilindungi.</span>
    <a href="https://wa.me/<?= h(\$wa) ?>?text=Halo+saya+ingin+tanya+tentang+undangan+digital" target="_blank" rel="noopener" class="btn btn-wa btn-sm">💬 Chat WhatsApp</a>
  </div>
</footer>

<script src="script.js"></script>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# public/invitation.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/public/invitation.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/app.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/csrf.php';
csrf_start();

$slug = isset($_GET['slug']) ? trim(preg_replace('/[^a-z0-9\-]/', '', strtolower($_GET['slug']))) : '';
if ($slug === '') {
    http_response_code(404);
    die('<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Tidak Ditemukan</title></head><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>404</h1><p>Undangan tidak ditemukan.</p><a href="index.php">← Kembali</a></body></html>');
}

$db   = get_db();
$stmt = $db->prepare('SELECT * FROM `invitations` WHERE `slug` = ? LIMIT 1');
$stmt->execute([$slug]);
$inv  = $stmt->fetch();

if (!$inv) {
    http_response_code(404);
    die('<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Tidak Ditemukan</title></head><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>404</h1><p>Undangan dengan link ini tidak ditemukan.</p><a href="index.php">← Kembali</a></body></html>');
}

$stmtR   = $db->prepare('SELECT * FROM `rsvp` WHERE `invitation_id` = ? ORDER BY `created_at` DESC LIMIT 50');
$stmtR->execute([$inv['id']]);
$rsvps   = $stmtR->fetchAll();

$stmtG   = $db->prepare('SELECT * FROM `guestbook_messages` WHERE `invitation_id` = ? ORDER BY `created_at` DESC LIMIT 50');
$stmtG->execute([$inv['id']]);
$gbMsgs  = $stmtG->fetchAll();

$gallery = [];
if (!empty($inv['gallery_json'])) {
    $decoded = json_decode($inv['gallery_json'], true);
    if (is_array($decoded)) $gallery = $decoded;
}

$weddingDateTime = $inv['wedding_date'] . 'T' . (!empty($inv['akad_time'])
    ? substr($inv['akad_time'], 0, 5) . ':00'
    : '08:00:00');

$csrf_field = csrf_field();
$page_url   = WEBSITE_URL . '/public/invitation.php?slug=' . urlencode($slug);
$wa         = WHATSAPP_NUMBER;
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Undangan Pernikahan <?= h($inv['groom_name']) ?> & <?= h($inv['bride_name']) ?></title>
<meta name="description" content="Anda diundang ke pernikahan <?= h($inv['groom_name']) ?> & <?= h($inv['bride_name']) ?> pada <?= h($inv['wedding_date']) ?>">
<link rel="stylesheet" href="styles.css">
</head>
<body class="inv-body">

<?php if (!empty($inv['music_url'])): ?>
<div class="music-bar">
  <button class="music-toggle" id="music-toggle" title="Play/Pause Musik">▶</button>
  <audio id="bg-audio" loop preload="none">
    <source src="<?= h($inv['music_url']) ?>">
  </audio>
  <span style="color:#a8c4e0;font-size:.82rem;font-family:sans-serif">🎵 Musik Latar</span>
</div>
<div style="padding-bottom:56px"></div>
<?php endif; ?>

<!-- HERO -->
<section class="inv-hero">
  <div class="inv-hero-content">
    <div class="inv-label">✦ Undangan Pernikahan ✦</div>
    <?php if (!empty($inv['opening_message'])): ?>
    <p class="inv-opening"><?= h($inv['opening_message']) ?></p>
    <div class="inv-divider"></div>
    <?php endif; ?>
    <div class="inv-names">
      <?= h($inv['groom_name']) ?>
      <span class="inv-amp">&</span>
      <?= h($inv['bride_name']) ?>
    </div>
    <div class="inv-date">
      📅 <?= h(date('l, d F Y', strtotime($inv['wedding_date']))) ?>
    </div>
    <div id="wedding-datetime" data-date="<?= h($weddingDateTime) ?>" style="display:none"></div>
  </div>
</section>

<!-- COUNTDOWN -->
<section class="inv-section">
  <div class="inv-container">
    <h2 class="inv-section-title">Menuju Hari Bahagia</h2>
    <div class="countdown">
      <div class="countdown-box"><div class="countdown-num" id="cd-days">00</div><div class="countdown-label">Hari</div></div>
      <div class="countdown-box"><div class="countdown-num" id="cd-hours">00</div><div class="countdown-label">Jam</div></div>
      <div class="countdown-box"><div class="countdown-num" id="cd-minutes">00</div><div class="countdown-label">Menit</div></div>
      <div class="countdown-box"><div class="countdown-num" id="cd-seconds">00</div><div class="countdown-label">Detik</div></div>
    </div>
  </div>
</section>

<!-- DETAIL ACARA -->
<section class="inv-section inv-section-alt">
  <div class="inv-container">
    <h2 class="inv-section-title">Detail Acara</h2>
    <div class="inv-detail-grid">
      <div class="inv-detail-box">
        <h3>🕌 Akad Nikah</h3>
        <p><?= h($inv['akad_time'] ?: '-') ?></p>
        <p style="margin-top:.5rem;font-size:.9rem;color:#475569"><?= h($inv['venue_name']) ?></p>
      </div>
      <div class="inv-detail-box">
        <h3>🎉 Resepsi</h3>
        <p><?= h($inv['reception_time'] ?: '-') ?></p>
        <p style="margin-top:.5rem;font-size:.9rem;color:#475569"><?= h($inv['venue_name']) ?></p>
      </div>
    </div>
    <?php if (!empty($inv['venue_address'])): ?>
    <div style="margin-top:1.25rem;background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;padding:1.25rem">
      <div style="font-size:.8rem;font-weight:700;color:#c9a96e;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.4rem">📍 Alamat</div>
      <p style="font-size:.95rem;color:#1e293b;line-height:1.6"><?= h($inv['venue_address']) ?></p>
    </div>
    <?php endif; ?>
  </div>
</section>

<!-- GALERI -->
<?php if (!empty($gallery)): ?>
<section class="inv-section">
  <div class="inv-container">
    <h2 class="inv-section-title">Galeri Foto</h2>
    <div class="inv-gallery-grid">
      <?php foreach ($gallery as $img): ?>
        <?php if (!empty($img)): ?>
        <img src="<?= h($img) ?>" alt="Foto Pernikahan <?= h($inv['groom_name']) ?> & <?= h($inv['bride_name']) ?>" loading="lazy">
        <?php endif; ?>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>

<!-- PETA -->
<?php if (!empty($inv['map_embed_url'])): ?>
<section class="inv-section inv-section-alt">
  <div class="inv-container">
    <h2 class="inv-section-title">Lokasi Acara</h2>
    <div class="map-wrap">
      <iframe
        src="<?= h($inv['map_embed_url']) ?>"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Peta Lokasi Pernikahan">
      </iframe>
    </div>
    <?php if (!empty($inv['venue_address'])): ?>
    <p style="text-align:center;margin-top:1rem;font-size:.9rem;color:#475569"><?= h($inv['venue_name']) ?> · <?= h($inv['venue_address']) ?></p>
    <?php endif; ?>
  </div>
</section>
<?php endif; ?>

<!-- RSVP -->
<section class="inv-section">
  <div class="inv-container">
    <h2 class="inv-section-title">Konfirmasi Kehadiran (RSVP)</h2>
    <form id="rsvp-form" action="../api/save_rsvp.php" method="POST" class="inv-form">
      <?= $csrf_field ?>
      <input type="hidden" name="invitation_slug" value="<?= h($slug) ?>">
      <input type="text" name="guest_name" placeholder="Nama lengkap kamu *" required maxlength="150">
      <select name="attendance_status" required>
        <option value="">-- Konfirmasi Kehadiran --</option>
        <option value="hadir">✅ Hadir</option>
        <option value="tidak_hadir">❌ Tidak Hadir</option>
        <option value="belum_pasti">🤔 Belum Pasti</option>
      </select>
      <textarea name="message" placeholder="Pesan atau doa untuk kedua mempelai (opsional)" maxlength="500"></textarea>
      <button type="submit" class="btn btn-primary">Kirim RSVP</button>
    </form>
    <div id="rsvp-feedback" class="inv-feedback"></div>
    <?php if (!empty($rsvps)): ?>
    <div style="margin-top:2rem">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem;color:#1e3a5f">Konfirmasi Kehadiran (<?= count($rsvps) ?> tamu)</h3>
      <?php foreach ($rsvps as $r): ?>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:.5rem;padding:1rem;margin-bottom:.75rem">
        <div style="font-weight:700;font-size:.9rem">
          <?= h($r['guest_name']) ?>
          <?php
            $statuses = ['hadir' => '✅ Hadir', 'tidak_hadir' => '❌ Tidak Hadir', 'belum_pasti' => '🤔 Belum Pasti'];
            $badge    = $statuses[$r['attendance_status']] ?? h($r['attendance_status']);
          ?>
          <span style="margin-left:.5rem;font-size:.78rem;font-weight:500;color:#475569"><?= $badge ?></span>
        </div>
        <?php if (!empty($r['message'])): ?>
        <div style="font-size:.88rem;color:#475569;margin-top:.35rem;font-style:italic">"<?= h($r['message']) ?>"</div>
        <?php endif; ?>
      </div>
      <?php endforeach; ?>
    </div>
    <?php endif; ?>
  </div>
</section>

<!-- BUKU TAMU -->
<section class="inv-section inv-section-alt">
  <div class="inv-container">
    <h2 class="inv-section-title">Buku Tamu & Ucapan</h2>
    <form id="guestbook-form" action="../api/save_guestbook.php" method="POST" class="inv-form">
      <?= $csrf_field ?>
      <input type="hidden" name="invitation_slug" value="<?= h($slug) ?>">
      <input type="text" name="guest_name" placeholder="Nama kamu *" required maxlength="150">
      <textarea name="message" placeholder="Tulis ucapan selamat atau doa untuk kedua mempelai *" required maxlength="1000"></textarea>
      <button type="submit" class="btn btn-primary">Kirim Ucapan</button>
    </form>
    <div id="guestbook-feedback" class="inv-feedback"></div>
    <?php if (!empty($gbMsgs)): ?>
    <div class="guestbook-list">
      <?php foreach ($gbMsgs as $g): ?>
      <div class="guestbook-item">
        <div class="gb-name">💌 <?= h($g['guest_name']) ?></div>
        <div class="gb-msg"><?= h($g['message']) ?></div>
        <div class="gb-time"><?= h(date('d M Y H:i', strtotime($g['created_at']))) ?></div>
      </div>
      <?php endforeach; ?>
    </div>
    <?php else: ?>
    <p style="text-align:center;color:#94a3b8;font-size:.9rem;margin-top:1.5rem">Belum ada ucapan. Jadilah yang pertama!</p>
    <?php endif; ?>
  </div>
</section>

<!-- SHARE -->
<section class="inv-section">
  <div class="inv-container" style="text-align:center">
    <h2 class="inv-section-title">Bagikan Undangan</h2>
    <p style="color:#475569;font-size:.95rem;margin-bottom:1.5rem">Bagikan link undangan ini kepada keluarga dan sahabat.</p>
    <div class="inv-share">
      <a class="btn btn-wa" href="https://wa.me/?text=<?= urlencode('Dengan hormat, kami mengundang kamu ke pernikahan ' . $inv['groom_name'] . ' & ' . $inv['bride_name'] . '. Lihat undangan: ' . $page_url) ?>" target="_blank" rel="noopener">💬 Bagikan via WhatsApp</a>
      <button class="btn btn-outline" onclick="navigator.clipboard.writeText('<?= h($page_url) ?>').then(function(){alert('Link berhasil disalin!')})">📋 Salin Link</button>
    </div>
  </div>
</section>

<script src="script.js"></script>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# api/create_order.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/api/create_order.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/app.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/csrf.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Metode tidak diizinkan.');
}

csrf_start();
csrf_enforce();

$customer_name   = sanitize($_POST['customer_name']   ?? '');
$couple_name     = sanitize($_POST['couple_name']     ?? '');
$wedding_date    = sanitize($_POST['wedding_date']    ?? '');
$package_name    = sanitize($_POST['package_name']    ?? '');
$notes           = sanitize($_POST['notes']           ?? '');
$whatsapp_number = sanitize($_POST['whatsapp_number'] ?? '');

if ($customer_name === '')   json_response(false, 'Nama pemesan wajib diisi.');
if ($couple_name === '')     json_response(false, 'Nama mempelai wajib diisi.');
if ($wedding_date === '')    json_response(false, 'Tanggal acara wajib diisi.');
if ($package_name === '')    json_response(false, 'Paket wajib dipilih.');
if ($whatsapp_number === '') json_response(false, 'Nomor WhatsApp wajib diisi.');

$allowed_packages = ['Basic', 'Premium', 'Eksklusif'];
if (!in_array($package_name, $allowed_packages, true)) {
    json_response(false, 'Paket tidak valid.');
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $wedding_date)) {
    json_response(false, 'Format tanggal tidak valid.');
}

try {
    $db   = get_db();
    $stmt = $db->prepare(
        'INSERT INTO `orders` (`customer_name`, `couple_name`, `wedding_date`, `package_name`, `notes`, `whatsapp_number`)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$customer_name, $couple_name, $wedding_date, $package_name, $notes, $whatsapp_number]);
} catch (Exception $e) {
    error_log('create_order error: ' . $e->getMessage());
    json_response(false, 'Gagal menyimpan pesanan. Silakan coba lagi.');
}

$wa_number  = WHATSAPP_NUMBER;
$date_fmt   = date('d F Y', strtotime($wedding_date));
$wa_message = "Halo {$customer_name}, terima kasih telah memesan undangan digital di " . BRAND_NAME . "!\n\n"
            . "Detail Pesanan:\n"
            . "👤 Nama Mempelai : {$couple_name}\n"
            . "📅 Tanggal Acara : {$date_fmt}\n"
            . "📦 Paket         : {$package_name}\n"
            . ($notes !== '' ? "📝 Catatan       : {$notes}\n" : '')
            . "\nKami akan segera menghubungi kamu untuk proses selanjutnya. 😊";

$wa_url = 'https://wa.me/' . $wa_number . '?text=' . rawurlencode($wa_message);

json_response(true, 'Pesanan berhasil dikirim! Kamu akan diarahkan ke WhatsApp kami.', ['wa_url' => $wa_url]);
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# api/save_rsvp.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/api/save_rsvp.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/csrf.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Metode tidak diizinkan.');
}

csrf_start();
csrf_enforce();

$slug              = isset($_POST['invitation_slug']) ? trim(preg_replace('/[^a-z0-9\-]/', '', strtolower($_POST['invitation_slug']))) : '';
$guest_name        = sanitize($_POST['guest_name']        ?? '');
$attendance_status = sanitize($_POST['attendance_status'] ?? '');
$message           = sanitize($_POST['message']           ?? '');

if ($slug === '')              json_response(false, 'Undangan tidak valid.');
if ($guest_name === '')        json_response(false, 'Nama tamu wajib diisi.');
if ($attendance_status === '') json_response(false, 'Konfirmasi kehadiran wajib dipilih.');

$allowed_statuses = ['hadir', 'tidak_hadir', 'belum_pasti'];
if (!in_array($attendance_status, $allowed_statuses, true)) {
    json_response(false, 'Status kehadiran tidak valid.');
}

try {
    $db    = get_db();
    $stmtI = $db->prepare('SELECT `id` FROM `invitations` WHERE `slug` = ? LIMIT 1');
    $stmtI->execute([$slug]);
    $inv   = $stmtI->fetch();

    if (!$inv) json_response(false, 'Undangan tidak ditemukan.');

    $stmt = $db->prepare(
        'INSERT INTO `rsvp` (`invitation_id`, `guest_name`, `attendance_status`, `message`)
         VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$inv['id'], $guest_name, $attendance_status, $message]);
} catch (Exception $e) {
    error_log('save_rsvp error: ' . $e->getMessage());
    json_response(false, 'Gagal menyimpan RSVP. Silakan coba lagi.');
}

json_response(true, 'RSVP berhasil dikirim! Terima kasih telah konfirmasi kehadiran.');
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# api/save_guestbook.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/api/save_guestbook.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/csrf.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Metode tidak diizinkan.');
}

csrf_start();
csrf_enforce();

$slug       = isset($_POST['invitation_slug']) ? trim(preg_replace('/[^a-z0-9\-]/', '', strtolower($_POST['invitation_slug']))) : '';
$guest_name = sanitize($_POST['guest_name'] ?? '');
$message    = sanitize($_POST['message']    ?? '');

if ($slug === '')       json_response(false, 'Undangan tidak valid.');
if ($guest_name === '') json_response(false, 'Nama tamu wajib diisi.');
if ($message === '')    json_response(false, 'Pesan wajib diisi.');

try {
    $db    = get_db();
    $stmtI = $db->prepare('SELECT `id` FROM `invitations` WHERE `slug` = ? LIMIT 1');
    $stmtI->execute([$slug]);
    $inv   = $stmtI->fetch();

    if (!$inv) json_response(false, 'Undangan tidak ditemukan.');

    $stmt = $db->prepare(
        'INSERT INTO `guestbook_messages` (`invitation_id`, `guest_name`, `message`)
         VALUES (?, ?, ?)'
    );
    $stmt->execute([$inv['id'], $guest_name, $message]);
} catch (Exception $e) {
    error_log('save_guestbook error: ' . $e->getMessage());
    json_response(false, 'Gagal menyimpan ucapan. Silakan coba lagi.');
}

json_response(true, 'Ucapan berhasil dikirim! Terima kasih.');
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/login.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/login.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/csrf.php';
require __DIR__ . '/../config/auth.php';

csrf_start();

if (!empty($_SESSION['admin_id'])) redirect('dashboard.php');

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_enforce();
    $username = sanitize($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Username dan password wajib diisi.';
    } else {
        try {
            $db   = get_db();
            $stmt = $db->prepare('SELECT `id`, `username`, `password_hash` FROM `admins` WHERE `username` = ? LIMIT 1');
            $stmt->execute([$username]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($password, $admin['password_hash'])) {
                admin_login((int)$admin['id'], $admin['username']);
                redirect('dashboard.php');
            } else {
                $error = 'Username atau password salah.';
            }
        } catch (Exception $e) {
            error_log('login error: ' . $e->getMessage());
            $error = 'Terjadi kesalahan sistem.';
        }
    }
}
$csrf_field = csrf_field();
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Login Admin</title>
<link rel="stylesheet" href="../public/styles.css">
</head>
<body class="admin-body">
<div class="login-page">
  <div class="login-box">
    <div class="login-title">🔐 Admin Login</div>
    <div class="login-sub">Masuk ke panel administrasi undangan digital.</div>
    <?php if ($error !== ''): ?>
    <div class="alert alert-error"><?= h($error) ?></div>
    <?php endif; ?>
    <form method="POST" action="login.php">
      <?= $csrf_field ?>
      <div class="form-group" style="margin-bottom:1rem">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" placeholder="Username admin" required autocomplete="username">
      </div>
      <div class="form-group" style="margin-bottom:1.5rem">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Password" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary btn-block">Masuk</button>
    </form>
    <p style="text-align:center;margin-top:1.25rem;font-size:.82rem;color:#94a3b8"><a href="../public/index.php">← Kembali ke Website</a></p>
  </div>
</div>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/logout.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/logout.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/auth.php';
admin_logout();
redirect('login.php');
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/dashboard.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/dashboard.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/auth.php';
require_admin();

$db = get_db();

$totalOrders   = (int)$db->query('SELECT COUNT(*) FROM `orders`')->fetchColumn();
$totalRsvp     = (int)$db->query('SELECT COUNT(*) FROM `rsvp`')->fetchColumn();
$totalGuestbook= (int)$db->query('SELECT COUNT(*) FROM `guestbook_messages`')->fetchColumn();
$totalInv      = (int)$db->query('SELECT COUNT(*) FROM `invitations`')->fetchColumn();

$latestOrders  = $db->query('SELECT * FROM `orders` ORDER BY `created_at` DESC LIMIT 5')->fetchAll();
$latestRsvp    = $db->query(
    'SELECT r.*, i.slug, i.groom_name, i.bride_name
     FROM `rsvp` r
     JOIN `invitations` i ON i.id = r.invitation_id
     ORDER BY r.created_at DESC LIMIT 5'
)->fetchAll();

$admin = $_SESSION['admin_username'] ?? 'Admin';
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dashboard Admin</title>
<link rel="stylesheet" href="../public/styles.css">
</head>
<body class="admin-body">
<div class="admin-top">
  <span class="brand">💍 Admin Panel</span>
  <span>Halo, <?= h($admin) ?> · <a href="logout.php">Keluar</a></span>
</div>
<nav class="admin-nav">
  <a href="dashboard.php" class="active">Dashboard</a>
  <a href="orders.php">Pesanan</a>
  <a href="rsvp.php">RSVP</a>
  <a href="guestbook.php">Buku Tamu</a>
  <a href="../public/index.php" target="_blank">Lihat Website</a>
</nav>
<div class="admin-content">
  <div class="admin-page-title">Dashboard</div>
  <div class="stat-cards">
    <div class="stat-card"><div class="label">Total Pesanan</div><div class="value"><?= $totalOrders ?></div></div>
    <div class="stat-card"><div class="label">Total Undangan</div><div class="value"><?= $totalInv ?></div></div>
    <div class="stat-card"><div class="label">Total RSVP</div><div class="value"><?= $totalRsvp ?></div></div>
    <div class="stat-card"><div class="label">Ucapan Buku Tamu</div><div class="value"><?= $totalGuestbook ?></div></div>
  </div>

  <div class="admin-card">
    <h2>Pesanan Terbaru</h2>
    <?php if (empty($latestOrders)): ?>
    <div class="empty-state">Belum ada pesanan.</div>
    <?php else: ?>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Pemesan</th><th>Mempelai</th><th>Tanggal</th><th>Paket</th><th>Waktu Pesan</th></tr></thead>
        <tbody>
          <?php foreach ($latestOrders as $o): ?>
          <tr>
            <td><?= h($o['customer_name']) ?></td>
            <td><?= h($o['couple_name']) ?></td>
            <td><?= h($o['wedding_date']) ?></td>
            <td><span class="badge badge-blue"><?= h($o['package_name']) ?></span></td>
            <td><?= h(date('d M Y H:i', strtotime($o['created_at']))) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>

  <div class="admin-card">
    <h2>RSVP Terbaru</h2>
    <?php if (empty($latestRsvp)): ?>
    <div class="empty-state">Belum ada data RSVP.</div>
    <?php else: ?>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>Tamu</th><th>Undangan</th><th>Status</th><th>Pesan</th><th>Waktu</th></tr></thead>
        <tbody>
          <?php foreach ($latestRsvp as $r): ?>
          <?php
            $badges = ['hadir' => 'badge-green', 'tidak_hadir' => 'badge-red', 'belum_pasti' => 'badge-yellow'];
            $labels = ['hadir' => 'Hadir', 'tidak_hadir' => 'Tidak Hadir', 'belum_pasti' => 'Belum Pasti'];
            $bc = $badges[$r['attendance_status']] ?? 'badge-blue';
            $bl = $labels[$r['attendance_status']] ?? h($r['attendance_status']);
          ?>
          <tr>
            <td><?= h($r['guest_name']) ?></td>
            <td><?= h($r['groom_name']) ?> & <?= h($r['bride_name']) ?></td>
            <td><span class="badge <?= $bc ?>"><?= $bl ?></span></td>
            <td><?= h(mb_strimwidth($r['message'], 0, 60, '…')) ?></td>
            <td><?= h(date('d M Y H:i', strtotime($r['created_at']))) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/orders.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/orders.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/auth.php';
require_admin();

$db     = get_db();
$orders = $db->query('SELECT * FROM `orders` ORDER BY `created_at` DESC')->fetchAll();
$admin  = $_SESSION['admin_username'] ?? 'Admin';
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manajemen Pesanan</title>
<link rel="stylesheet" href="../public/styles.css">
</head>
<body class="admin-body">
<div class="admin-top">
  <span class="brand">💍 Admin Panel</span>
  <span>Halo, <?= h($admin) ?> · <a href="logout.php">Keluar</a></span>
</div>
<nav class="admin-nav">
  <a href="dashboard.php">Dashboard</a>
  <a href="orders.php" class="active">Pesanan</a>
  <a href="rsvp.php">RSVP</a>
  <a href="guestbook.php">Buku Tamu</a>
  <a href="../public/index.php" target="_blank">Lihat Website</a>
</nav>
<div class="admin-content">
  <div class="admin-page-title">Manajemen Pesanan (<?= count($orders) ?>)</div>
  <div class="admin-card">
    <?php if (empty($orders)): ?>
    <div class="empty-state">Belum ada pesanan masuk.</div>
    <?php else: ?>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nama Pemesan</th>
            <th>Nama Mempelai</th>
            <th>Tanggal Acara</th>
            <th>Paket</th>
            <th>No. WhatsApp</th>
            <th>Catatan</th>
            <th>Waktu Pesan</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($orders as $i => $o): ?>
          <tr>
            <td><?= $i + 1 ?></td>
            <td><?= h($o['customer_name']) ?></td>
            <td><?= h($o['couple_name']) ?></td>
            <td><?= h($o['wedding_date']) ?></td>
            <td><span class="badge badge-blue"><?= h($o['package_name']) ?></span></td>
            <td>
              <?php if (!empty($o['whatsapp_number'])): ?>
              <a href="https://wa.me/<?= h($o['whatsapp_number']) ?>" target="_blank" rel="noopener" style="color:var(--blue)">
                <?= h($o['whatsapp_number']) ?>
              </a>
              <?php else: ?>–<?php endif; ?>
            </td>
            <td><?= $o['notes'] !== '' ? h(mb_strimwidth($o['notes'], 0, 80, '…')) : '–' ?></td>
            <td><?= h(date('d M Y H:i', strtotime($o['created_at']))) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/rsvp.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/rsvp.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/auth.php';
require_admin();

$db   = get_db();
$rows = $db->query(
    'SELECT r.id, r.guest_name, r.attendance_status, r.message, r.created_at,
            i.slug, i.groom_name, i.bride_name
     FROM `rsvp` r
     JOIN `invitations` i ON i.id = r.invitation_id
     ORDER BY r.created_at DESC'
)->fetchAll();
$admin = $_SESSION['admin_username'] ?? 'Admin';
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manajemen RSVP</title>
<link rel="stylesheet" href="../public/styles.css">
</head>
<body class="admin-body">
<div class="admin-top">
  <span class="brand">💍 Admin Panel</span>
  <span>Halo, <?= h($admin) ?> · <a href="logout.php">Keluar</a></span>
</div>
<nav class="admin-nav">
  <a href="dashboard.php">Dashboard</a>
  <a href="orders.php">Pesanan</a>
  <a href="rsvp.php" class="active">RSVP</a>
  <a href="guestbook.php">Buku Tamu</a>
  <a href="../public/index.php" target="_blank">Lihat Website</a>
</nav>
<div class="admin-content">
  <div class="admin-page-title">Data RSVP (<?= count($rows) ?>)</div>
  <div class="admin-card">
    <?php if (empty($rows)): ?>
    <div class="empty-state">Belum ada data RSVP.</div>
    <?php else: ?>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr><th>#</th><th>Tamu</th><th>Undangan</th><th>Status Kehadiran</th><th>Pesan</th><th>Waktu</th></tr>
        </thead>
        <tbody>
          <?php
          $badges = ['hadir' => 'badge-green', 'tidak_hadir' => 'badge-red', 'belum_pasti' => 'badge-yellow'];
          $labels = ['hadir' => 'Hadir', 'tidak_hadir' => 'Tidak Hadir', 'belum_pasti' => 'Belum Pasti'];
          foreach ($rows as $i => $r):
            $bc = $badges[$r['attendance_status']] ?? 'badge-blue';
            $bl = $labels[$r['attendance_status']] ?? h($r['attendance_status']);
          ?>
          <tr>
            <td><?= $i + 1 ?></td>
            <td><?= h($r['guest_name']) ?></td>
            <td>
              <a href="../public/invitation.php?slug=<?= urlencode($r['slug']) ?>" target="_blank" style="color:var(--blue)">
                <?= h($r['groom_name']) ?> & <?= h($r['bride_name']) ?>
              </a>
            </td>
            <td><span class="badge <?= $bc ?>"><?= $bl ?></span></td>
            <td><?= $r['message'] !== '' ? h(mb_strimwidth($r['message'], 0, 100, '…')) : '–' ?></td>
            <td><?= h(date('d M Y H:i', strtotime($r['created_at']))) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# admin/guestbook.php
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/admin/guestbook.php" << 'PHPEOF'
<?php
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../config/helpers.php';
require __DIR__ . '/../config/auth.php';
require_admin();

$db   = get_db();
$rows = $db->query(
    'SELECT g.id, g.guest_name, g.message, g.created_at,
            i.slug, i.groom_name, i.bride_name
     FROM `guestbook_messages` g
     JOIN `invitations` i ON i.id = g.invitation_id
     ORDER BY g.created_at DESC'
)->fetchAll();
$admin = $_SESSION['admin_username'] ?? 'Admin';
?><!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Buku Tamu</title>
<link rel="stylesheet" href="../public/styles.css">
</head>
<body class="admin-body">
<div class="admin-top">
  <span class="brand">💍 Admin Panel</span>
  <span>Halo, <?= h($admin) ?> · <a href="logout.php">Keluar</a></span>
</div>
<nav class="admin-nav">
  <a href="dashboard.php">Dashboard</a>
  <a href="orders.php">Pesanan</a>
  <a href="rsvp.php">RSVP</a>
  <a href="guestbook.php" class="active">Buku Tamu</a>
  <a href="../public/index.php" target="_blank">Lihat Website</a>
</nav>
<div class="admin-content">
  <div class="admin-page-title">Buku Tamu Digital (<?= count($rows) ?>)</div>
  <div class="admin-card">
    <?php if (empty($rows)): ?>
    <div class="empty-state">Belum ada ucapan di buku tamu.</div>
    <?php else: ?>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr><th>#</th><th>Nama Tamu</th><th>Undangan</th><th>Ucapan</th><th>Waktu</th></tr>
        </thead>
        <tbody>
          <?php foreach ($rows as $i => $g): ?>
          <tr>
            <td><?= $i + 1 ?></td>
            <td><?= h($g['guest_name']) ?></td>
            <td>
              <a href="../public/invitation.php?slug=<?= urlencode($g['slug']) ?>" target="_blank" style="color:var(--blue)">
                <?= h($g['groom_name']) ?> & <?= h($g['bride_name']) ?>
              </a>
            </td>
            <td><?= h(mb_strimwidth($g['message'], 0, 120, '…')) ?></td>
            <td><?= h(date('d M Y H:i', strtotime($g['created_at']))) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
PHPEOF

# ══════════════════════════════════════════════════════════════════════════════
# README.md
# ══════════════════════════════════════════════════════════════════════════════
cat > "$APP_DIR/README.md" << MDEOF
# ${BRAND_NAME} – Platform Undangan Pernikahan Digital

Platform undangan pernikahan digital berbasis PHP + MySQL yang ringan, aman, dan siap pakai di shared hosting.

---

## Struktur Folder

\`\`\`
wedding-invitation-platform/
  public/         ← Landing page, halaman undangan, CSS, JS
  admin/          ← Panel admin (login, dashboard, pesanan, RSVP, buku tamu)
  api/            ← Endpoint API untuk form order, RSVP, dan buku tamu
  config/         ← Konfigurasi database, helper, auth, CSRF
  database/       ← Schema SQL dan seed data
  README.md
\`\`\`

---

## Kebutuhan Hosting Minimum

- PHP 8.0 ke atas
- MySQL 5.7 / MariaDB 10.3 ke atas
- Apache atau Nginx dengan mod_rewrite (opsional)
- Ekstensi PHP: PDO, PDO_MySQL, mbstring, openssl

---

## Cara Setup

### 1. Upload File
Upload seluruh folder \`wedding-invitation-platform/\` ke server.

**Opsi A – Upload ke subdirektori public_html:**
\`\`\`
public_html/
  wedding-invitation-platform/   ← upload di sini
\`\`\`
Akses: \`https://domain.com/wedding-invitation-platform/public/\`

**Opsi B – Taruh file public/ langsung ke public_html:**
- Salin semua isi \`public/\` ke \`public_html/\`
- Salin folder \`admin/\`, \`api/\`, \`config/\` ke satu level di atas \`public_html/\`
- Sesuaikan path \`require __DIR__\` di setiap file jika diperlukan

### 2. Buat Database
Di cPanel → MySQL Databases:
- Buat database: \`wedding_db\`
- Buat user MySQL dan assign ke database dengan hak penuh

### 3. Import Schema
Di phpMyAdmin → pilih database \`wedding_db\` → tab Import:
- Import file: \`database/schema.sql\`

### 4. Import Seed Data
Di phpMyAdmin → pilih database \`wedding_db\` → tab Import:
- Import file: \`database/seed.sql\`

### 5. Edit Kredensial Database
Buka file \`config/database.php\` dan sesuaikan:
\`\`\`php
\$host    = 'localhost';
\$dbname  = 'wedding_db';      // nama database
\$user    = 'root';            // username MySQL
\$pass    = '';                // password MySQL
\`\`\`

---

## Akun Admin Default

| Field    | Nilai         |
|----------|---------------|
| Username | admin         |
| Password | admin123      |
| URL      | /admin/login.php |

**Ganti password setelah login pertama kali dengan memperbarui kolom \`password_hash\` di tabel \`admins\` menggunakan hash PHP baru.**

---

## Contoh URL Undangan

Setelah seed data diimport, undangan sample bisa diakses di:
\`\`\`
https://domain.com/wedding-invitation-platform/public/invitation.php?slug=budi-dan-sari
\`\`\`

---

## Mengubah Brand Name, Nomor WhatsApp, dan URL Website

Sebelum menjalankan script, edit variabel di bagian atas \`build.sh\`:
\`\`\`bash
APP_DIR="wedding-invitation-platform"
BRAND_NAME="MomenNikah"
WHATSAPP_NUMBER="6281234567890"
WEBSITE_URL="https://momennikah.com"
\`\`\`
Kemudian jalankan:
\`\`\`bash
bash build.sh
\`\`\`

---

## Catatan Keamanan

- Semua query menggunakan Prepared Statement (PDO)
- Semua output di-escape dengan \`htmlspecialchars()\`
- Semua form dilindungi CSRF token berbasis sesi
- Password admin di-hash dengan \`password_hash()\` (bcrypt)
- Tidak ada stack trace yang ditampilkan ke pengguna

---

Brand: **${BRAND_NAME}**  
WhatsApp: **${WHATSAPP_NUMBER}**  
Website: **${WEBSITE_URL}**
MDEOF

# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "✅ Project berhasil dibuat di folder: ${APP_DIR}/"
echo ""
echo "   Landing Page : ${APP_DIR}/public/index.php"
echo "   Admin Login  : ${APP_DIR}/admin/login.php"
echo "   Contoh Inv.  : ${APP_DIR}/public/invitation.php?slug=budi-dan-sari"
echo ""
echo "   Admin default: admin / admin123"
echo ""
echo "   Langkah selanjutnya:"
echo "   1. Upload folder ke server"
echo "   2. Buat database MySQL: wedding_db"
echo "   3. Import: ${APP_DIR}/database/schema.sql"
echo "   4. Import: ${APP_DIR}/database/seed.sql"
echo "   5. Edit kredensial di: ${APP_DIR}/config/database.php"
echo ""
