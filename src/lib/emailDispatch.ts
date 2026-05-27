// ============================================================
// EMAIL DISPATCH — Lead summary emails via nodemailer
// Sends formatted lead summary to owner on intake completion.
// Config via SMTP_* env vars. Logs to console if unconfigured.
// ============================================================

import nodemailer from 'nodemailer';
import type { ClientRow } from '@/lib/db';

// ── Transporter (lazy init) ────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    auth: { user, pass },
  });
}

// ── HTML email template ────────────────────────────────────────

function buildEmailHtml(client: ClientRow, appUrl: string): string {
  const badge = (label: string, color: string) =>
    `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;background:${color};color:#fff;">${label}</span>`;

  const statusColor: Record<string, string> = {
    'High Value': '#10b981',
    'Commercial': '#3b82f6',
    'Residential': '#8b5cf6',
    'Small Repair': '#f59e0b',
    'Unscored': '#6b7280',
  };

  const scoreBadge = badge(
    client.lead_score_label,
    statusColor[client.lead_score_label] ?? '#6b7280'
  );

  const contactTypeBadge = badge(
    client.contact_type === 'sms' ? 'SMS Intake' : client.contact_type === 'voice' ? 'Voice Intake' : 'Manual',
    '#1d4ed8'
  );

  const row = (label: string, value: string | null | undefined) =>
    value
      ? `<tr>
          <td style="padding:8px 12px;font-weight:600;color:#374151;width:160px;vertical-align:top;">${label}</td>
          <td style="padding:8px 12px;color:#111827;">${value}</td>
        </tr>`
      : '';

  const newConst = client.new_construction === 1
    ? 'New Construction'
    : client.new_construction === 0
    ? 'Renovation / Replacement'
    : null;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">

    <div style="background:#111827;border-radius:12px 12px 0 0;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">New Lead</p>
        <h1 style="margin:4px 0 0;font-size:22px;color:#f9fafb;">${process.env.COMPANY_NAME ?? 'GlazePro DMV'}</h1>
      </div>
      <div style="text-align:right;">
        ${scoreBadge}
        <br><br>
        ${contactTypeBadge}
      </div>
    </div>

    <div style="background:#fff;padding:0;border:1px solid #e5e7eb;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Name', client.name)}
        ${row('Phone', client.phone)}
        ${row('Email', client.email)}
        ${row('Location', client.project_location)}
        ${row('Project Type', client.project_type_raw)}
        ${row('Glazing Category', client.glazing_category?.replace(/_/g, ' '))}
        ${row('New vs Reno', newConst)}
        ${row('Approx. Size', client.approx_size)}
        ${row('Timeline', client.timeline)}
        ${row('Lead Score', `${client.lead_score}/100 — ${client.lead_score_label}`)}
      </table>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
      <p style="margin:0;font-size:12px;color:#6b7280;">
        ${new Date(client.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET
      </p>
      <a href="${appUrl}/clients/${client.id}"
         style="display:inline-block;padding:8px 18px;background:#1d4ed8;color:#fff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
        Open in App →
      </a>
    </div>

  </div>
</body>
</html>`;
}

// ── Plain text fallback ────────────────────────────────────────

function buildEmailText(client: ClientRow): string {
  const newConst = client.new_construction === 1
    ? 'New Construction'
    : client.new_construction === 0
    ? 'Renovation / Replacement'
    : 'Unknown';

  return [
    `NEW LEAD — ${process.env.COMPANY_NAME ?? 'GlazePro DMV'}`,
    `Lead Score: ${client.lead_score}/100 (${client.lead_score_label})`,
    '',
    `Name:     ${client.name ?? 'Not captured'}`,
    `Phone:    ${client.phone}`,
    `Email:    ${client.email ?? 'Not captured'}`,
    `Location: ${client.project_location ?? 'Not captured'}`,
    `Type:     ${client.project_type_raw ?? 'Not captured'}`,
    `Category: ${client.glazing_category ?? 'Unknown'}`,
    `New/Reno: ${newConst}`,
    `Size:     ${client.approx_size ?? 'Not captured'}`,
    `Timeline: ${client.timeline ?? 'Not captured'}`,
    '',
    `Received: ${new Date(client.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`,
  ].join('\n');
}

// ── Send lead summary ──────────────────────────────────────────

export async function sendLeadSummaryEmail(client: ClientRow): Promise<void> {
  const ownerEmail = process.env.OWNER_NOTIFY_EMAIL;
  if (!ownerEmail) {
    console.log('[emailDispatch] OWNER_NOTIFY_EMAIL not set — skipping email');
    return;
  }

  const transporter = getTransporter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const subject = `New Lead: ${client.lead_score_label} — ${client.project_location ?? client.phone} (${process.env.COMPANY_NAME ?? 'GlazePro DMV'})`;

  if (!transporter) {
    // Log to console for development / when SMTP not configured
    console.log('[emailDispatch] SMTP not configured. Lead summary:');
    console.log(buildEmailText(client));
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? ownerEmail,
    to: ownerEmail,
    subject,
    text: buildEmailText(client),
    html: buildEmailHtml(client, appUrl),
  });

  console.log(`[emailDispatch] Lead summary sent to ${ownerEmail} for ${client.phone}`);
}
