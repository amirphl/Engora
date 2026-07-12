import { getWalletCopy } from '../translations';

// Proforma preview renderer for wallet deposit receipts.
// It keeps the existing blob-preview flow and only swaps the generated HTML.

export interface ProformaData {
  invoice_number?: string;
  date?: string;
  service?: { description?: string; quantity?: number };
  amount?: number;
  tax?: number;
  amount_with_tax?: number;
  notes?: string;
  buyer?: Record<string, any>;
  seller?: Record<string, any>;
  lang?: string;
}

type LooseRecord = Record<string, any>;

const DEFAULT_SELLER = {
  name_fa: 'راه‌کارهای هدفمند خلاق',
  name_en: 'Khalagh Targeted Solutions',
  national_id: '14014229780',
  registration_number: '646905',
  address_fa:
    'استان تهران، شهرستان تهران، بخش مرکزی، شهر تهران، امانیه، خیابان آرامش، خیابان نیلوفر، پلاک ۱۰، طبقه ۵، واحد جنوبی',
  address_en:
    'No. 10, 5th Floor, South Unit, Niloufar St., Aramesh St., Amanieh, Tehran, Iran',
  postal_code: '1967758454',
  phone: '02126213962',
  bank_name_fa: 'اقتصادنوین',
  bank_name_en: 'Eghtesad Novin',
  branch_fa: 'شیراز شمالی',
  branch_en: 'North Shiraz',
  iban: 'IR770550011744507450752001',
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const numberFmt = (n: unknown, language: string) =>
  n === undefined || n === null || Number.isNaN(Number(n))
    ? ''
    : Number(n).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US');

const moneyFmt = (n: unknown, language: string, currencyLabel: string) => {
  const formatted = numberFmt(n, language);
  return formatted ? `${formatted} ${currencyLabel}` : '-';
};

const valueOrDash = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  return normalized ? escapeHtml(normalized) : '-';
};

const pick = (...values: unknown[]) =>
  values.find(value => String(value ?? '').trim().length > 0);

const pickFrom = (record: LooseRecord, ...keys: string[]) =>
  pick(...keys.map(key => record?.[key]));

const isLegalBuyer = (buyer: Record<string, any>) =>
  Boolean(
    pick(
      buyer.company_name,
      buyer.registration_number,
      buyer.economic_code,
      buyer.company_phone
    )
  );

export const buildProformaHtml = (raw: ProformaData, language: string) => {
  const data = (raw as any)?.data ? (raw as any).data : raw;
  const locale =
    (language || data?.lang || 'en').toLowerCase() === 'fa' ? 'fa' : 'en';
  const isFa = locale === 'fa';
  const copy = getWalletCopy(locale).proforma;
  const dir = isFa ? 'rtl' : 'ltr';
  const displayDate = isFa ? toJalaliTehran(data?.date) : data?.date || '';
  const buyer: LooseRecord = data?.buyer || {};
  const seller: LooseRecord = data?.seller || {};
  const buyerIsLegal = isLegalBuyer(buyer);
  const currencyLabel = getWalletCopy(locale).currency;
  const quantity = pick(data?.service?.quantity, (data as any)?.quantity, 1);
  const serviceDescription = pick(
    data?.service?.description,
    (data as any)?.service_description,
    copy.defaultServiceDescription
  );
  const logoUrl = `${window.location.origin}/Jazebeh.png`;

  const sellerName = pick(
    pickFrom(seller, 'name', 'company_name', 'companyName'),
    isFa ? DEFAULT_SELLER.name_fa : DEFAULT_SELLER.name_en
  );
  const sellerAddress = pick(
    pickFrom(seller, 'address', 'company_address', 'companyAddress'),
    isFa ? DEFAULT_SELLER.address_fa : DEFAULT_SELLER.address_en
  );
  const sellerNationalId = pick(
    pickFrom(seller, 'national_id', 'nationalId'),
    DEFAULT_SELLER.national_id
  );
  const sellerRegistrationNumber = pick(
    pickFrom(seller, 'registration_number', 'registrationNumber'),
    DEFAULT_SELLER.registration_number
  );
  const sellerPostalCode = pick(
    pickFrom(seller, 'postal_code', 'postalCode'),
    DEFAULT_SELLER.postal_code
  );
  const sellerPhone = pick(
    pickFrom(seller, 'phone', 'landline', 'company_phone', 'companyPhone'),
    DEFAULT_SELLER.phone
  );
  const sellerBankName = pick(
    pickFrom(
      seller,
      'bank_name',
      'bankName',
      isFa ? 'bank_name_fa' : 'bank_name_en'
    ),
    isFa ? DEFAULT_SELLER.bank_name_fa : DEFAULT_SELLER.bank_name_en
  );
  const sellerBranchName = pick(
    pickFrom(seller, 'branch_name', 'branchName', 'bank_branch', 'bankBranch'),
    isFa ? DEFAULT_SELLER.branch_fa : DEFAULT_SELLER.branch_en
  );
  const sellerIban = pick(
    pickFrom(seller, 'iban', 'sheba', 'sheba_number', 'shebaNumber'),
    DEFAULT_SELLER.iban
  );

  const buyerFullName = pick(
    buyer.full_name,
    buyer.name,
    [buyer.representative_first_name, buyer.representative_last_name]
      .filter(Boolean)
      .join(' '),
    buyer.company_name
  );

  const sellerRows = [
    [copy.sellerCompanyName, sellerName],
    [copy.sellerNationalId, sellerNationalId],
    [copy.sellerRegistrationNumber, sellerRegistrationNumber],
    [copy.sellerAddress, sellerAddress],
    [copy.sellerPostalCode, sellerPostalCode],
    [copy.sellerPhone, sellerPhone],
  ];

  const legalBuyerRows = [
    [copy.buyerCompanyName, pick(buyer.company_name, buyer.name)],
    [copy.buyerNationalId, buyer.national_id],
    [copy.buyerRegistrationNumber, buyer.registration_number],
    [copy.buyerEconomicCode, buyer.economic_code],
    [copy.buyerRepresentativeName, buyerFullName],
    [copy.buyerPhone, pick(buyer.phone, buyer.mobile, buyer.company_phone)],
    [copy.buyerAddress, pick(buyer.address, buyer.company_address)],
    [copy.buyerPostalCode, buyer.postal_code],
  ];

  const individualBuyerRows = [
    [copy.buyerFullName, buyerFullName],
    [copy.buyerNationalCode, pick(buyer.national_code, buyer.national_id)],
    [copy.buyerMobile, pick(buyer.mobile, buyer.phone, buyer.company_phone)],
    [copy.buyerAddress, pick(buyer.address, buyer.company_address)],
    [copy.buyerPostalCode, buyer.postal_code],
    [copy.buyerEmail, buyer.email],
  ];

  const buyerRows = buyerIsLegal ? legalBuyerRows : individualBuyerRows;
  const footerNotes = data?.notes
    ? `<div class="notes">${escapeHtml(data.notes)}</div>`
    : '';

  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(copy.documentTitle)}${data?.invoice_number ? ` | ${escapeHtml(data.invoice_number)}` : ''}</title>
  <style>
    :root {
      --jazebeh-blue: #005ae1;
      --jazebeh-blue-deep: #234b9b;
      --jazebeh-red: #ff2332;
      --surface: #f6f8fc;
      --card: #ffffff;
      --ink: #101828;
      --muted: #667085;
      --line: #e4e7ec;
      --radius-lg: 24px;
      --radius-md: 18px;
      --shadow: 0 18px 50px rgba(16, 24, 40, 0.08);
      --shadow-soft: 0 10px 30px rgba(16, 24, 40, 0.06);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: 'Inter', 'Helvetica', sans-serif;
      background:
        radial-gradient(circle at top right, rgba(0, 90, 225, 0.13), transparent 34%),
        radial-gradient(circle at top left, rgba(255, 35, 50, 0.10), transparent 28%),
        var(--surface);
      color: var(--ink);
      line-height: 1.8;
    }
    html[lang='fa'] body { font-family: 'Vazirmatn', 'IRANSans', 'Tahoma', sans-serif; }
    .page-shell { width: min(1180px, calc(100% - 40px)); margin: 32px auto; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand-logo { width: 62px; height: 62px; object-fit: contain; display: block; }
    .brand-title { display: flex; flex-direction: column; gap: 2px; }
    .brand-title strong { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .brand-title span { color: var(--muted); font-size: 13px; }
    .btn {
      border: 0;
      border-radius: 14px;
      padding: 11px 16px;
      font-family: inherit;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: linear-gradient(135deg, var(--jazebeh-blue), var(--jazebeh-blue-deep));
      box-shadow: 0 12px 24px rgba(0, 90, 225, 0.22);
      white-space: nowrap;
      cursor: pointer;
    }
    .invoice-card {
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.72);
      border-radius: 32px;
      box-shadow: var(--shadow);
      overflow: hidden;
      backdrop-filter: blur(16px);
    }
    .invoice-hero {
      position: relative;
      padding: 34px 34px 28px;
      background: linear-gradient(135deg, rgba(0, 90, 225, 0.10), rgba(255, 35, 50, 0.05)), #fff;
      border-bottom: 1px solid var(--line);
      overflow: hidden;
    }
    .invoice-hero::before {
      content: "";
      position: absolute;
      inset-inline-start: -90px;
      top: 28px;
      width: 330px;
      height: 92px;
      background: linear-gradient(90deg, rgba(0, 90, 225, 0.14), rgba(255, 35, 50, 0.11));
      border-radius: 999px;
      transform: rotate(-18deg);
    }
    .hero-content {
      position: relative;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 24px;
      align-items: end;
      z-index: 1;
    }
    h1 { margin: 0 0 8px; font-size: clamp(28px, 4vw, 42px); font-weight: 950; letter-spacing: -1.4px; }
    .hero-copy { margin: 0; color: var(--muted); max-width: 620px; font-size: 15px; }
    .invoice-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .meta-item {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      box-shadow: var(--shadow-soft);
    }
    .meta-item span { display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }
    .meta-item strong { font-size: 16px; font-weight: 900; }
    .invoice-body { padding: 28px 34px 34px; }
    .section-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 20px; }
    .info-box, .service-box, .summary-box, .bank-box {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-soft);
    }
    .box-header, .bank-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid var(--line);
    }
    .box-header h2, .bank-box-header h2 { margin: 0; font-size: 17px; font-weight: 950; letter-spacing: -0.3px; }
    .info-list { padding: 14px 20px 20px; display: grid; gap: 9px; }
    .info-row { display: grid; grid-template-columns: 150px 1fr; gap: 14px; align-items: start; min-height: 30px; }
    .label { color: var(--muted); font-size: 13px; font-weight: 700; }
    .value { color: var(--ink); font-size: 14px; font-weight: 800; word-break: break-word; }
    .service-box { overflow: hidden; margin-bottom: 20px; }
    .table-wrap { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 820px; background: #fff; }
    th, td {
      padding: 16px 18px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: middle;
      font-size: 14px;
    }
    html[dir='rtl'] th, html[dir='rtl'] td { text-align: right; }
    th { color: var(--muted); background: #f9fafb; font-size: 12px; font-weight: 900; white-space: nowrap; }
    td { font-weight: 800; }
    .money { white-space: nowrap; font-variant-numeric: tabular-nums; }
    .summary-area { display: grid; grid-template-columns: 1fr 380px; gap: 18px; align-items: start; }
    .summary-box { overflow: hidden; margin-inline-start: auto; width: 100%; max-width: 380px; }
    .summary-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 18px; border-bottom: 1px solid var(--line); font-weight: 850; }
    .summary-row span:first-child { color: var(--muted); font-size: 13px; }
    .summary-row span:last-child { font-size: 15px; }
    .summary-row.total { background: linear-gradient(135deg, var(--jazebeh-blue), var(--jazebeh-blue-deep)); color: #fff; border-bottom: 0; padding: 20px 18px; }
    .summary-row.total span { color: #fff; }
    .summary-row.total span:last-child { font-size: 22px; font-weight: 950; }
    .bank-box {
      margin-top: 22px;
      background: linear-gradient(135deg, rgba(0, 90, 225, 0.08), rgba(255, 35, 50, 0.04)), #fff;
      border-color: #d6e4ff;
      overflow: hidden;
    }
    .bank-info { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; padding: 22px 20px; align-items: center; }
    .iban-card { background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 18px 20px; }
    .iban-label { display: block; color: var(--muted); font-size: 13px; font-weight: 800; margin-bottom: 8px; }
    .iban-value {
      direction: ltr;
      text-align: left;
      display: block;
      color: var(--jazebeh-blue-deep);
      font-size: clamp(22px, 3vw, 32px);
      font-weight: 950;
      letter-spacing: 1px;
      line-height: 1.4;
      word-break: break-all;
    }
    .bank-detail-list { display: grid; gap: 10px; }
    .bank-detail-row { display: grid; grid-template-columns: 90px 1fr; gap: 10px; align-items: start; }
    .bank-detail-row .value { font-size: 15px; font-weight: 900; }
    .footer-strip { margin-top: 22px; color: var(--muted); font-size: 12px; border-top: 1px dashed var(--line); padding-top: 18px; }
    .footer-strip strong { color: var(--ink); }
    .notes { margin-top: 20px; color: var(--ink); font-size: 13px; }
    @media (max-width: 920px) {
      .hero-content, .section-grid, .summary-area, .bank-info { grid-template-columns: 1fr; }
      .topbar { align-items: flex-start; flex-direction: column; }
      .summary-box { max-width: 100%; }
    }
    @media (max-width: 620px) {
      .page-shell { width: min(100% - 24px, 1180px); margin: 18px auto; }
      .invoice-hero, .invoice-body { padding: 22px 18px; }
      .invoice-meta { grid-template-columns: 1fr; }
      .info-row { grid-template-columns: 1fr; gap: 2px; }
    }
    @media print {
      body { background: #fff; }
      .page-shell { width: 100%; margin: 0; }
      .topbar .actions { display: none; }
      .invoice-card, .info-box, .service-box, .summary-box, .bank-box, .meta-item { box-shadow: none; }
      .invoice-card { border-radius: 0; border: 0; }
      .invoice-hero::before { display: none; }
    }
  </style>
</head>
<body>
  <main class="page-shell">
    <header class="topbar">
      <div class="brand" aria-label="${escapeHtml(copy.brandName)}">
        <img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(copy.logoAlt)}" />
        <div class="brand-title">
          <strong>${escapeHtml(copy.brandName)}</strong>
          <span>${escapeHtml(copy.brandSubtitle)}</span>
        </div>
      </div>
      <nav class="actions" aria-label="${escapeHtml(copy.actionsLabel)}">
        <button class="btn" type="button" onclick="window.print()">${escapeHtml(copy.downloadPdf)}</button>
      </nav>
    </header>

    <section class="invoice-card" aria-label="${escapeHtml(copy.documentTitle)}">
      <div class="invoice-hero">
        <div class="hero-content">
          <div>
            <h1>${escapeHtml(copy.documentTitle)}</h1>
            <p class="hero-copy">${escapeHtml(copy.heroCopy)}</p>
          </div>
          <div class="invoice-meta">
            <div class="meta-item">
              <span>${escapeHtml(copy.proformaNumber)}</span>
              <strong>${valueOrDash(data?.invoice_number)}</strong>
            </div>
            <div class="meta-item">
              <span>${escapeHtml(copy.issueDate)}</span>
              <strong>${valueOrDash(displayDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="invoice-body">
        <div class="section-grid">
          <article class="info-box" aria-label="${escapeHtml(copy.sellerInfo)}">
            <div class="box-header"><h2>${escapeHtml(copy.sellerInfo)}</h2></div>
            <div class="info-list">
              ${sellerRows
                .map(
                  ([label, value]) =>
                    `<div class="info-row"><span class="label">${escapeHtml(label)}</span><span class="value">${valueOrDash(value)}</span></div>`
                )
                .join('')}
            </div>
          </article>

          <article class="info-box" aria-label="${escapeHtml(copy.buyerInfo)}">
            <div class="box-header"><h2>${escapeHtml(copy.buyerInfo)}</h2></div>
            <div class="info-list">
              ${buyerRows
                .map(
                  ([label, value]) =>
                    `<div class="info-row"><span class="label">${escapeHtml(label)}</span><span class="value">${valueOrDash(value)}</span></div>`
                )
                .join('')}
            </div>
          </article>
        </div>

        <section class="service-box" aria-label="${escapeHtml(copy.serviceAndAmounts)}">
          <div class="box-header"><h2>${escapeHtml(copy.serviceHeader)}</h2></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${escapeHtml(copy.row)}</th>
                  <th>${escapeHtml(copy.serviceDescription)}</th>
                  <th>${escapeHtml(copy.quantity)}</th>
                  <th>${escapeHtml(copy.netAmount)}</th>
                  <th>${escapeHtml(copy.taxAmount)}</th>
                  <th>${escapeHtml(copy.totalAmount)}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${numberFmt(1, locale)}</td>
                  <td>${valueOrDash(serviceDescription)}</td>
                  <td>${numberFmt(quantity, locale) || '1'}</td>
                  <td class="money">${moneyFmt(data?.amount, locale, currencyLabel)}</td>
                  <td class="money">${moneyFmt(data?.tax, locale, currencyLabel)}</td>
                  <td class="money">${moneyFmt(data?.amount_with_tax, locale, currencyLabel)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="summary-area">
          <div></div>
          <section class="summary-box" aria-label="${escapeHtml(copy.summaryTitle)}">
            <div class="summary-row"><span>${escapeHtml(copy.netAmount)}</span><span class="money">${moneyFmt(data?.amount, locale, currencyLabel)}</span></div>
            <div class="summary-row"><span>${escapeHtml(copy.taxAmount)}</span><span class="money">${moneyFmt(data?.tax, locale, currencyLabel)}</span></div>
            <div class="summary-row total"><span>${escapeHtml(copy.payableAmount)}</span><span class="money">${moneyFmt(data?.amount_with_tax, locale, currencyLabel)}</span></div>
          </section>
        </div>

        <section class="bank-box" aria-label="${escapeHtml(copy.paymentInfo)}">
          <div class="bank-box-header"><h2>${escapeHtml(copy.paymentInfo)}</h2></div>
          <div class="bank-info">
            <div class="iban-card">
              <span class="iban-label">${escapeHtml(copy.iban)}</span>
              <strong class="iban-value">${valueOrDash(sellerIban)}</strong>
            </div>
            <div class="bank-detail-list">
              <div class="bank-detail-row"><span class="label">${escapeHtml(copy.bank)}</span><span class="value">${valueOrDash(sellerBankName)}</span></div>
              <div class="bank-detail-row"><span class="label">${escapeHtml(copy.branch)}</span><span class="value">${valueOrDash(sellerBranchName)}</span></div>
            </div>
          </div>
        </section>

        ${footerNotes}
        <footer class="footer-strip"><strong>${escapeHtml(copy.brandName)}</strong></footer>
      </div>
    </section>
  </main>
</body>
</html>`;
};

export const openProformaPreview = (data: ProformaData, language: string) => {
  const html = buildProformaHtml(data, language);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `proforma-${data.invoice_number || 'preview'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    win.focus();
    win.onload = () => URL.revokeObjectURL(url);
  }
};

function toJalaliTehran(iso?: string) {
  try {
    if (!iso) return '';
    const date = new Date(iso);
    const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(date);
  } catch {
    return iso || '';
  }
}
