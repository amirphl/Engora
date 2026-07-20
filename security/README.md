# Reproducing the OWASP ZAP report

The supplied `security issues/` directory is a **Modern HTML Report** created
by OWASP ZAP 2.17.0. Its medium findings combine passive header checks with
active requests, so use an environment you own and are authorised to attack.

Build and start the production container first:

```sh
npm run security:check
cp -n .env.example .env
docker compose up --build -d nginx
```

To scan that local container and create the same modern HTML report format plus
a machine-readable JSON report:

```sh
mkdir -p security-reports
docker run --rm --network host \
  -e ZAP_TARGET=http://127.0.0.1 \
  -v "$PWD:/zap/wrk:rw" \
  -t ghcr.io/zaproxy/zaproxy:2.17.0 \
  zap.sh -cmd -autorun /zap/wrk/security/zap.yaml
```

For an authorised deployed environment, omit `--network host` and replace
`ZAP_TARGET` with its origin, for example `https://staging.example.com`.

Results are written to `security-reports/zap-modern.html` (and its asset
directory) and `security-reports/zap-report.json`. The original report was
also producible from ZAP Desktop using **Report > Generate Report > Modern**
after spidering and running an active scan.

## Required production edge changes

The supplied production configuration is the source of the second CSP in the
report. Apply all three snippets in [`security/nginx`](nginx/):

1. Replace `/etc/nginx/security.conf` with `security.conf`.
2. Add `proxy-security.conf` to `/etc/nginx/proxy.conf` (or include it there).
3. Add `frontend-server-hardening.conf` inside the `jazebeh.ir` TLS server.

The outer Nginx must have the headers-more module. For an Alpine-based runtime,
install `nginx` and `nginx-mod-http-headers-more` from the same Alpine release;
the repository `Dockerfile` demonstrates this. Do not install an Alpine module
beside the binary from the official `nginx:*` image because those builds are
not guaranteed to be binary compatible.

Validate and reload the production proxy:

```sh
nginx -t
nginx -s reload
```

Then check the exact report probes before running ZAP:

```sh
curl -sS -D - -o /dev/null https://jazebeh.ir/
curl -sS -D - -o /dev/null 'https://jazebeh.ir/static/css%20-%20Copy%20(2)'
curl -sS -X TRACE -D - -o /dev/null https://jazebeh.ir/contact
curl -sS -X OPTIONS -D - -o /dev/null https://jazebeh.ir/contact
```

Expect one CSP header with no `unsafe-*`/wildcard schemes, a 404 for the backup
probe, 405 for TRACE and frontend OPTIONS, and no `Server`/`X-Powered-By`
header. Multiple CSP headers are enforced and scanned independently.
