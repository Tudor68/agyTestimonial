/**
 * PraisePulse / Testimonial Hub - Google Apps Script Backend
 * 
 * Configured with Script Properties:
 * - GEMINI_API_KEY: Google Gemini API Key
 * - DRIVE_FOLDER_ID: ID of Google Drive folder for headshots
 * - CHAT_WEBHOOK_URL: (Optional) Google Chat incoming webhook URL
 * - SPREADSHEET_ID: (Optional) Google Sheet ID if not container-bound
 */

const HEADERS = [
  'Timestamp',
  'Name',
  'Email',
  'Organization',
  'Rating',
  'Testimonial',
  'Headshot_URL',
  'Extracted_Quote',
  'Tags',
  'Status'
];

/**
 * Configuration helper to retrieve script properties
 */
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    geminiApiKey: props.getProperty('GEMINI_API_KEY') || '',
    driveFolderId: props.getProperty('DRIVE_FOLDER_ID') || '',
    chatWebhookUrl: props.getProperty('CHAT_WEBHOOK_URL') || '',
    spreadsheetId: props.getProperty('SPREADSHEET_ID') || ''
  };
}

/**
 * Gets or initializes the active Google Sheet with proper schema
 */
function getTestimonialsSheet() {
  const config = getConfig();
  let ss;
  
  if (config.spreadsheetId) {
    ss = SpreadsheetApp.openById(config.spreadsheetId);
  } else {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {
      // Fallback: create or search for a sheet named "Testimonials Database"
      const files = DriveApp.getFilesByName("Testimonials Database");
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create("Testimonials Database");
        PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
      }
    }
  }

  let sheet = ss.getSheetByName('Testimonials');
  if (!sheet) {
    sheet = ss.insertSheet('Testimonials');
  }

  // Ensure header row exists
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#4F46E5')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Web App Routing:
 * - ?page=form (default): Testimonial Submission Form
 * - ?page=admin: Admin Moderation Dashboard
 * - ?page=wall: Wall of Love Embeddable Showcase
 */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page.toLowerCase() : 'form';
  let templateName = 'form';
  let title = 'Submit Your Story | PraisePulse';

  if (page === 'admin') {
    templateName = 'admin';
    title = 'Admin Moderation | PraisePulse';
  } else if (page === 'wall') {
    templateName = 'wall';
    title = 'Wall of Love | PraisePulse';
  }

  return HtmlService.createTemplateFromFile(templateName)
    .evaluate()
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Utility for templating includes in HTML files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Saves uploaded headshot image to Google Drive and sets public read permissions
 * @param {Object} fileData { name, type, base64 }
 * @return {string} Public URL of the uploaded image
 */
function saveHeadshot(fileData) {
  if (!fileData || !fileData.base64) return '';

  const config = getConfig();
  let folder;

  if (config.driveFolderId) {
    try {
      folder = DriveApp.getFolderById(config.driveFolderId);
    } catch (e) {
      console.warn('Could not find folder by DRIVE_FOLDER_ID, saving to root folder: ' + e.message);
      folder = DriveApp.getRootFolder();
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  const cleanBase64 = fileData.base64.replace(/^data:image\/\w+;base64,/, '');
  const decodedBytes = Utilities.base64Decode(cleanBase64);
  const blob = Utilities.newBlob(decodedBytes, fileData.type || 'image/jpeg', fileData.name || 'headshot.jpg');

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  // Return direct thumbnail/view URL suitable for <img> tags
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

/**
 * Calls Gemini API to auto-tag testimonial and extract the single most impactful quote
 * @param {string} testimonialText
 * @return {Object} { extractedQuote, tags }
 */
function processWithGemini(testimonialText) {
  const config = getConfig();
  if (!config.geminiApiKey || !testimonialText) {
    return {
      extractedQuote: testimonialText ? testimonialText.slice(0, 140) + '...' : '',
      tags: 'Customer Story'
    };
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(config.geminiApiKey);

  const systemInstruction = 
    "You are an expert marketing copywriter analyzing customer testimonials.\n" +
    "Perform two tasks:\n" +
    "1. Topic Tagging: Generate 2 to 4 concise topic tags categorizing what the customer praised (e.g. \"Beginner-friendly\", \"Time-saving\", \"Workflow Automation\", \"Exceptional Support\").\n" +
    "2. Best Quote Extraction: Extract the single most punchy, powerful, and authentic sentence or phrase from the testimonial suitable for a hero banner on a high-converting sales page.\n\n" +
    "Respond ONLY with valid JSON matching this schema:\n" +
    "{\n" +
    '  "extractedQuote": "string",\n' +
    '  "tags": ["string", "string"]\n' +
    "}";

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction + "\n\nCustomer Testimonial:\n\"\"\"" + testimonialText + "\"\"\"" }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    if (code === 200) {
      const data = JSON.parse(response.getContentText());
      const candidateText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
      if (candidateText) {
        const parsed = JSON.parse(candidateText);
        const tagsString = Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (parsed.tags || 'General');
        return {
          extractedQuote: parsed.extractedQuote || testimonialText.slice(0, 140),
          tags: tagsString
        };
      }
    } else {
      console.error('Gemini API error status ' + code + ': ' + response.getContentText());
    }
  } catch (err) {
    console.error('Error in processWithGemini: ' + err.message);
  }

  return {
    extractedQuote: testimonialText.slice(0, 140),
    tags: 'Customer Story'
  };
}

/**
 * Sends a rich notification card to Google Chat Webhook matching the Stitch Alert design
 * @param {Object} data Testimonial data
 */
function sendChatNotification(data) {
  const config = getConfig();
  if (!config.chatWebhookUrl) {
    console.info('No CHAT_WEBHOOK_URL set. Skipping chat notification.');
    return;
  }

  const webAppUrl = ScriptApp.getService().getUrl() || '#';
  const adminUrl = webAppUrl + (webAppUrl.includes('?') ? '&' : '?') + 'page=admin';

  const stars = '★'.repeat(Number(data.rating) || 5) + '☆'.repeat(Math.max(0, 5 - (Number(data.rating) || 5)));

  const cardPayload = {
    cardsV2: [
      {
        cardId: "newTestimonialAlert_" + new Date().getTime(),
        card: {
          header: {
            title: "🌟 New Testimonial Submitted!",
            subtitle: "PraisePulse Feedback Hub",
            imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/recommend/default/48px.svg",
            imageType: "CIRCLE"
          },
          sections: [
            {
              header: "Submitter Information",
              widgets: [
                {
                  textParagraph: {
                    text: `<b>${data.name}</b> ${data.organization ? '• ' + data.organization : ''}<br>Rating: <font color="#f59e0b">${stars} (${data.rating}/5)</font>`
                  }
                },
                {
                  textParagraph: {
                    text: `<b>Extracted Hook:</b><br><i>"${data.extractedQuote || data.testimonial}"</i>`
                  }
                },
                {
                  textParagraph: {
                    text: `<b>Tags:</b> ${data.tags || 'General'}`
                  }
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "Open Admin Moderation Queue",
                        onClick: {
                          openLink: {
                            url: adminUrl
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      }
    ]
  };

  try {
    UrlFetchApp.fetch(config.chatWebhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(cardPayload),
      muteHttpExceptions: true
    });
  } catch (e) {
    console.error('Error dispatching chat notification: ' + e.message);
  }
}

/**
 * Public Submission Endpoint called by submission form (google.script.run)
 * @param {Object} formObject
 * @return {Object} Response status
 */
function submitTestimonial(formObject) {
  try {
    if (!formObject.name || !formObject.email || !formObject.testimonial) {
      return { success: false, error: 'Name, email, and testimonial are required fields.' };
    }

    // 1. Handle Headshot Upload if provided
    let headshotUrl = '';
    if (formObject.headshot && formObject.headshot.base64) {
      headshotUrl = saveHeadshot(formObject.headshot);
    }

    // 2. Run Gemini AI Pipeline for Quote Extraction & Tagging
    const aiResult = processWithGemini(formObject.testimonial);

    // 3. Save to Google Sheet
    const sheet = getTestimonialsSheet();
    const timestamp = new Date();
    const rating = parseInt(formObject.rating, 10) || 5;
    const organization = formObject.organization || '';
    const status = 'Pending'; // Default status per specification

    const rowData = [
      timestamp,
      formObject.name.trim(),
      formObject.email.trim(),
      organization.trim(),
      rating,
      formObject.testimonial.trim(),
      headshotUrl,
      aiResult.extractedQuote,
      aiResult.tags,
      status
    ];

    sheet.appendRow(rowData);
    const rowId = sheet.getLastRow();

    // 4. Trigger Chat Notification
    sendChatNotification({
      rowId: rowId,
      name: formObject.name.trim(),
      organization: organization.trim(),
      rating: rating,
      testimonial: formObject.testimonial.trim(),
      extractedQuote: aiResult.extractedQuote,
      tags: aiResult.tags
    });

    return {
      success: true,
      rowId: rowId,
      extractedQuote: aiResult.extractedQuote,
      tags: aiResult.tags
    };
  } catch (err) {
    console.error('Error in submitTestimonial: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Public Wall of Love Endpoint
 * STRICT PRIVACY REQUIREMENT: Emails are excluded from the return payload.
 * Only returns items where Status === 'Approved'.
 * @return {Array<Object>} Approved testimonials
 */
function getApprovedTestimonials() {
  const sheet = getTestimonialsSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const colIndex = {
    timestamp: headers.indexOf('Timestamp'),
    name: headers.indexOf('Name'),
    organization: headers.indexOf('Organization'),
    rating: headers.indexOf('Rating'),
    testimonial: headers.indexOf('Testimonial'),
    headshotUrl: headers.indexOf('Headshot_URL'),
    extractedQuote: headers.indexOf('Extracted_Quote'),
    tags: headers.indexOf('Tags'),
    status: headers.indexOf('Status')
  };

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[colIndex.status];

    if (String(status).toLowerCase() === 'approved') {
      // Tags can be comma-separated string
      const rawTags = row[colIndex.tags] || '';
      const tagsArray = String(rawTags)
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      results.push({
        id: i + 1, // 1-based sheet row index
        name: row[colIndex.name] || 'Anonymous',
        organization: row[colIndex.organization] || '',
        rating: Number(row[colIndex.rating]) || 5,
        testimonial: row[colIndex.testimonial] || '',
        extractedQuote: row[colIndex.extractedQuote] || '',
        tags: tagsArray,
        headshotUrl: row[colIndex.headshotUrl] || '',
        timestamp: row[colIndex.timestamp] ? Utilities.formatDate(new Date(row[colIndex.timestamp]), Session.getScriptTimeZone(), 'MMM d, yyyy') : ''
      });
    }
  }

  return results;
}

/**
 * Admin Endpoint: Fetches all testimonials including emails, raw content, and status
 * @return {Object} { testimonials: Array, metrics: Object }
 */
function getAdminTestimonials() {
  const sheet = getTestimonialsSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { testimonials: [], metrics: { total: 0, pending: 0, approved: 0, rejected: 0, avgRating: 0 } };
  }

  const testimonials = [];
  let totalRating = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowId = i + 1;
    const rating = Number(row[4]) || 5;
    const status = (row[9] || 'Pending').toString();

    totalRating += rating;
    if (status.toLowerCase() === 'approved') approvedCount++;
    else if (status.toLowerCase() === 'rejected') rejectedCount++;
    else pendingCount++;

    testimonials.push({
      rowId: rowId,
      timestamp: row[0] ? Utilities.formatDate(new Date(row[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '',
      name: row[1] || '',
      email: row[2] || '',
      organization: row[3] || '',
      rating: rating,
      testimonial: row[5] || '',
      headshotUrl: row[6] || '',
      extractedQuote: row[7] || '',
      tags: row[8] || '',
      status: status
    });
  }

  // Sort: Pending first, then newest
  testimonials.sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return b.rowId - a.rowId;
  });

  const total = data.length - 1;
  const avgRating = total > 0 ? (totalRating / total).toFixed(1) : '0.0';

  return {
    testimonials: testimonials,
    metrics: {
      total: total,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      avgRating: avgRating
    }
  };
}

/**
 * Admin Endpoint: Updates testimonial moderation status
 * @param {number} rowId
 * @param {string} newStatus 'Approved' | 'Rejected' | 'Pending'
 * @return {Object}
 */
function updateTestimonialStatus(rowId, newStatus) {
  try {
    const sheet = getTestimonialsSheet();
    const validStatuses = ['Approved', 'Rejected', 'Pending'];
    const matched = validStatuses.find(s => s.toLowerCase() === newStatus.toLowerCase());
    const finalStatus = matched || 'Pending';

    sheet.getRange(rowId, 10).setValue(finalStatus);
    return { success: true, rowId: rowId, status: finalStatus };
  } catch (err) {
    console.error('Error updating status: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Admin Endpoint: Updates manually edited quote and tags
 * @param {number} rowId
 * @param {string} extractedQuote
 * @param {string} tags
 * @return {Object}
 */
function updateTestimonialDetails(rowId, extractedQuote, tags) {
  try {
    const sheet = getTestimonialsSheet();
    sheet.getRange(rowId, 8).setValue(extractedQuote);
    sheet.getRange(rowId, 9).setValue(tags);
    return { success: true, rowId: rowId, extractedQuote: extractedQuote, tags: tags };
  } catch (err) {
    console.error('Error updating details: ' + err.message);
    return { success: false, error: err.message };
  }
}
