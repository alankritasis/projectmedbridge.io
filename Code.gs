/* ==========================================================
   Project MedBridge — donation backend (Google Apps Script)
   ==========================================================

   WHAT THIS DOES
   - Receives a message from your website every time someone
     completes a PayPal payment.
   - Calls PayPal's own servers to CONFIRM the payment is real
     and for the amount claimed (so nobody can fake a donation
     by talking to this script directly).
   - Logs it to a "Donations" tab: donor name, email, amount,
     patient, date/time, PayPal order ID.
   - Adds the amount to that patient's "raised" total in your
     "Patients" tab — which is the same sheet your website
     already reads from. So the site's funding bars update.

   SETUP (about 10 minutes, no coding required beyond pasting)
   --------------------------------------------------------------
   1. Open the same Google Sheet you made for SHEET_CSV_URL.
      Add a second tab (bottom of the screen, "+") named exactly:
        Donations
      Give it this header row (row 1):
        timestamp | donorName | donorEmail | patientId | patientName | amount | orderId | status

   2. In the Sheet, go to Extensions → Apps Script.
      Delete anything in the editor and paste this entire file.

   3. Near the top, fill in:
        PAYPAL_CLIENT_ID     — from developer.paypal.com (see LAUNCH-GUIDE.md)
        PAYPAL_CLIENT_SECRET — same place. Keep this private; never put it
                                in your website's code, only here.
        PAYPAL_ENV           — "sandbox" while testing, "live" when real.
        PATIENTS_SHEET_NAME  — the tab name your patient rows live in
                                (probably "Patients" or "Sheet1").

   4. Click Deploy → New deployment → type "Web app".
        - Execute as: Me
        - Who has access: Anyone
      Click Deploy, authorize it with your Google account when asked.
      Copy the Web app URL it gives you.

   5. Paste that URL into APPS_SCRIPT_URL at the top of script.js
      on your website.

   That's it — donations will now log automatically and funding
   bars will update (on the site's next data refresh).
   ========================================================== */

const PAYPAL_CLIENT_ID = "";       // paste your PayPal REST app Client ID
const PAYPAL_CLIENT_SECRET = "";   // paste your PayPal REST app Secret — keep private
const PAYPAL_ENV = "sandbox";      // "sandbox" for testing, "live" for real money
const PATIENTS_SHEET_NAME = "Patients";
const DONATIONS_SHEET_NAME = "Donations";

function paypalApiBase() {
  return PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function getPayPalAccessToken() {
  const auth = Utilities.base64Encode(PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET);
  const res = UrlFetchApp.fetch(paypalApiBase() + "/v1/oauth2/token", {
    method: "post",
    headers: { Authorization: "Basic " + auth },
    payload: { grant_type: "client_credentials" },
    muteHttpExceptions: true
  });
  const data = JSON.parse(res.getContentText());
  if (!data.access_token) throw new Error("Could not get PayPal access token: " + res.getContentText());
  return data.access_token;
}

// Ask PayPal directly: is this order real, completed, and for this amount?
function verifyOrderWithPayPal(orderId, expectedAmount) {
  const token = getPayPalAccessToken();
  const res = UrlFetchApp.fetch(paypalApiBase() + "/v2/checkout/orders/" + orderId, {
    method: "get",
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true
  });
  const order = JSON.parse(res.getContentText());

  if (order.status !== "COMPLETED") {
    return { ok: false, reason: "Order status is " + order.status + ", not COMPLETED" };
  }

  const unit = order.purchase_units && order.purchase_units[0];
  const capture = unit && unit.payments && unit.payments.captures && unit.payments.captures[0];
  const paidAmount = capture ? parseFloat(capture.amount.value) : 0;

  if (Math.abs(paidAmount - expectedAmount) > 0.01) {
    return { ok: false, reason: "Amount mismatch: paid " + paidAmount + ", expected " + expectedAmount };
  }

  const payer = order.payer || {};
  const name = payer.name ? [payer.name.given_name, payer.name.surname].filter(Boolean).join(" ") : "Anonymous";
  const email = payer.email_address || "";

  return { ok: true, amount: paidAmount, donorName: name || "Anonymous", donorEmail: email };
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const orderId = body.orderId;
    const claimedAmount = parseFloat(body.amount);
    const patientId = body.patientId || "general-fund";
    const patientName = body.patientName || "General Medicine Fund";

    if (!orderId || !claimedAmount) {
      return jsonOut({ ok: false, error: "Missing orderId or amount" });
    }

    // Guard against logging the same order twice (e.g. double-click, retry)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const donationsSheet = ss.getSheetByName(DONATIONS_SHEET_NAME);
    const existingIds = donationsSheet.getRange("G2:G").getValues().flat();
    if (existingIds.includes(orderId)) {
      return jsonOut({ ok: true, duplicate: true });
    }

    const verified = verifyOrderWithPayPal(orderId, claimedAmount);
    if (!verified.ok) {
      donationsSheet.appendRow([new Date(), "", "", patientId, patientName, claimedAmount, orderId, "REJECTED: " + verified.reason]);
      return jsonOut({ ok: false, error: verified.reason });
    }

    // Log the verified donation
    donationsSheet.appendRow([
      new Date(),
      verified.donorName,
      verified.donorEmail,
      patientId,
      patientName,
      verified.amount,
      orderId,
      "COMPLETED"
    ]);

    // Update that patient's raised total in the Patients sheet
    if (patientId !== "general-fund") {
      const patientsSheet = ss.getSheetByName(PATIENTS_SHEET_NAME);
      const values = patientsSheet.getDataRange().getValues();
      const headers = values[0];
      const idCol = headers.indexOf("id");
      const raisedCol = headers.indexOf("raised");
      for (let r = 1; r < values.length; r++) {
        if (values[r][idCol] === patientId) {
          const current = parseFloat(values[r][raisedCol]) || 0;
          patientsSheet.getRange(r + 1, raisedCol + 1).setValue(current + verified.amount);
          break;
        }
      }
    }

    return jsonOut({ ok: true, donorName: verified.donorName, amount: verified.amount });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you (the owner) fetch a JSON list of all donations, e.g. for an admin view.
// Visiting the Web App URL directly in a browser triggers this.
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const donationsSheet = ss.getSheetByName(DONATIONS_SHEET_NAME);
  const values = donationsSheet.getDataRange().getValues();
  const headers = values[0];
  const rows = values.slice(1).map((row) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = row[i]));
    return o;
  });
  return jsonOut({ ok: true, donations: rows.reverse() });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
