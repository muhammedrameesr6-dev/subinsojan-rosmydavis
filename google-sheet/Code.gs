/**
 * Google Apps Script for Subin & Rosmy Wedding Community Sheet
 * Stores BOTH Wishes and RSVPs together in the first sheet tab.
 */

const SHEET_HEADERS = ['Date & Time', 'Type', 'Name', 'Attending', 'Guests', 'Message'];
const MAX_ITEMS = 500;

function getTargetSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function toIsoString_(val) {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val || '').trim();
}

function readCommunityPayload_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, configured: true, wishes: [], rsvps: [] };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  const wishes = [];
  const rsvps = [];

  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    const createdAt = toIsoString_(row[0]);
    const type = String(row[1] || '').trim().toUpperCase();
    const name = String(row[2] || '').trim();
    if (!name) continue;

    if (type === 'WISH' && wishes.length < MAX_ITEMS) {
      const message = String(row[5] || '').trim();
      if (message) {
        wishes.push({ name: name, message: message, createdAt: createdAt });
      }
    } else if (type === 'RSVP' && rsvps.length < MAX_ITEMS) {
      const attendingRaw = String(row[3] || '').trim().toLowerCase();
      const attending = attendingRaw === 'yes' || attendingRaw === 'true';
      const guestsNum = parseInt(row[4], 10);
      const guests = attending ? Math.max(1, Math.min(20, isNaN(guestsNum) ? 1 : guestsNum)) : 0;
      const message = String(row[5] || '').trim();
      rsvps.push({
        name: name,
        attending: attending,
        guests: guests,
        message: message,
        createdAt: createdAt,
      });
    }
  }

  return { ok: true, configured: true, wishes: wishes, rsvps: rsvps };
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sheet = getTargetSheet_();
  return jsonResponse_(readCommunityPayload_(sheet));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const kind = String(body.kind || '').trim().toLowerCase();
    const raw = body.entry || {};
    const name = String(raw.name || '').trim().slice(0, 200);
    if (!name) {
      return jsonResponse_({ ok: false, configured: true, error: 'Name is required' });
    }

    const sheet = getTargetSheet_();
    const createdAt = toIsoString_(raw.createdAt) || new Date().toISOString();

    if (kind === 'wish') {
      const message = String(raw.message || '').trim().slice(0, 5000);
      if (!message) {
        return jsonResponse_({ ok: false, configured: true, error: 'Message is required' });
      }
      if (!hasDuplicateRow_(sheet, 'Wish', name, createdAt)) {
        sheet.appendRow([createdAt, 'Wish', name, '', '', message]);
      }
    } else if (kind === 'rsvp') {
      const attending = Boolean(raw.attending);
      const parsedGuests = parseInt(raw.guests, 10);
      const guests = attending ? Math.max(1, Math.min(20, isNaN(parsedGuests) ? 1 : parsedGuests)) : 0;
      const message = String(raw.message || '').trim().slice(0, 1000);
      if (!hasDuplicateRow_(sheet, 'RSVP', name, createdAt)) {
        sheet.appendRow([createdAt, 'RSVP', name, attending ? 'Yes' : 'No', guests, message]);
      }
    } else {
      return jsonResponse_({ ok: false, configured: true, error: 'Invalid kind' });
    }

    return jsonResponse_(readCommunityPayload_(sheet));
  } catch (err) {
    return jsonResponse_({ ok: false, configured: true, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function hasDuplicateRow_(sheet, typeLabel, name, createdAt) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (
      toIsoString_(rows[i][0]) === createdAt &&
      String(rows[i][1] || '').trim().toLowerCase() === typeLabel.toLowerCase() &&
      String(rows[i][2] || '').trim() === name
    ) {
      return true;
    }
  }
  return false;
}
