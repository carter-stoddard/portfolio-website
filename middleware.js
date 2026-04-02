/* ============================================================
   EDGE MIDDLEWARE — Bot & Scanner Protection
   Runs on EVERY request before hitting your static files.
   Blocks known bad bots, scanner paths, and abuse patterns.
   Returns a bare 403 instead of your full 404 page.
============================================================ */
import { next } from '@vercel/edge';

// ── Known bad bot user-agent substrings (lowercase) ──
const BAD_BOTS = [
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'blexbot',
  'gptbot', 'ccbot', 'google-extended', 'anthropic-ai', 'claudebot',
  'bytespider', 'petalbot', 'sogou', 'yandexbot', 'baiduspider',
  'megaindex', 'ltx71', 'go-http-client', 'python-requests',
  'python-urllib', 'scrapy', 'wget', 'curl/', 'libwww-perl',
  'java/', 'httpunit', 'httrack', 'nikto', 'sqlmap', 'nmap',
  'masscan', 'zgrab', 'nuclei', 'dirbuster', 'gobuster',
  'wpscan', 'nessus', 'openvas', 'acunetix', 'w3af',
  'havij', 'webshag', 'skipfish', 'arachni', 'vega/',
  'whatweb', 'jbrofuzz', 'commix', 'wapiti', 'xsstrike',
  'censys', 'shodan', 'netcraft', 'dataforseo', 'zoominfobot',
  'amazonbot',
];

// ── Scanner paths that no real visitor would ever request ──
const SCANNER_PATHS = [
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/wordpress', '/wp-json', '/xmlrpc.php', '/wp-cron',
  '/.env', '/.git', '/.svn', '/.htaccess', '/.htpasswd',
  '/.aws', '/.docker', '/.ssh',
  '/admin', '/administrator', '/phpmyadmin', '/pma',
  '/cpanel', '/webmail', '/cgi-bin',
  '/config.php', '/config.yml', '/config.json', '/config.bak',
  '/backup', '/db', '/database', '/dump', '/sql',
  '/shell', '/cmd', '/exec', '/eval',
  '/login', '/signin', '/auth',
  '/api/v1', '/api/v2', '/graphql',
  '/server-status', '/server-info',
  '/vendor', '/node_modules', '/composer',
  '/telescope', '/horizon', '/nova',
  '/actuator', '/health', '/metrics',
  '/solr', '/jenkins', '/struts',
  '/debug', '/trace', '/console',
  '/elfinder', '/filemanager', '/uploads',
];

// ── File extensions that scanners probe for ──
const BAD_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl',
  '.bak', '.old', '.orig', '.save', '.swp', '.tmp',
  '.sql', '.tar', '.gz', '.zip', '.rar',
  '.log', '.ini', '.conf', '.cfg',
];

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const ua = (request.headers.get('user-agent') || '').toLowerCase();

  // ── 1. Block bad bots by user-agent ──
  if (ua && BAD_BOTS.some(bot => ua.includes(bot))) {
    return new Response(null, { status: 403 });
  }

  // ── 2. Block empty/tiny user-agents (almost always bots) ──
  if (!ua || ua.length < 5) {
    return new Response(null, { status: 403 });
  }

  // ── 3. Block known scanner paths ──
  if (SCANNER_PATHS.some(p => path.startsWith(p))) {
    return new Response(null, { status: 403 });
  }

  // ── 4. Block bad file extensions ──
  if (BAD_EXTENSIONS.some(ext => path.endsWith(ext))) {
    return new Response(null, { status: 403 });
  }

  // ── 5. Block excessively deep paths (scanners probing nested dirs) ──
  const depth = path.split('/').filter(Boolean).length;
  if (depth > 5) {
    return new Response(null, { status: 403 });
  }

  // ── 6. Block requests with suspicious query strings ──
  const search = url.search.toLowerCase();
  if (search.includes('union+select') ||
      search.includes('script>') ||
      search.includes('../') ||
      search.includes('etc/passwd') ||
      search.includes('cmd=') ||
      search.includes('exec=')) {
    return new Response(null, { status: 403 });
  }

  // ── Pass through — let Vercel serve the static file normally ──
  return next();
}

export const config = {
  matcher: '/(.*)',
};
