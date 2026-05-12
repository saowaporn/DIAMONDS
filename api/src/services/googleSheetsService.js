const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function getGoogleAuthClient() {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
  const keyFilePath = path.join(process.cwd(), 'credentials.json');
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n')
      },
      scopes
    });
    return auth.getClient();
  }

  if (fs.existsSync(keyFilePath)) {
    const auth = new google.auth.GoogleAuth({ keyFile: keyFilePath, scopes });
    return auth.getClient();
  }

  throw new Error('Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY or add credentials.json locally');
}

async function getGoogleSheetsClient() {
  const auth = await getGoogleAuthClient();
  return google.sheets({ version: 'v4', auth });
}

module.exports = {
  getGoogleSheetsClient
};
