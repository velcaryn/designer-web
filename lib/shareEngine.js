/**
 * WhatsApp Fast-Share Link Builder Engine.
 * 
 * Constructs uniform formatting loops to instantly broadcast
 * standard documents across instant messaging applications.
 */

/**
 * Generates a WhatsApp deep link URL with a pre-formatted message
 * containing the document details and public cloud URL.
 * 
 * @param {string} businessName - The tenant's business name
 * @param {string} docType - 'Quote' or 'Invoice'
 * @param {string} docNumber - The document reference number
 * @param {number} grandTotal - The grand total amount
 * @param {string} publicUrl - The secure public cloud URL
 * @returns {string} WhatsApp API URL ready for redirect
 */
export function generateWhatsAppPayload(businessName, docType, docNumber, grandTotal, publicUrl) {
    const baseMessage = `Greetings from *${businessName}*.\n\nPlease find your official digital *${docType}* attached for review.\n\n*Document Reference:* ${docNumber}\n*Total Valuation:* ₹${(grandTotal || 0).toFixed(2)}\n\nClick the secure cloud portal address below to view detailed specifications, print layouts, and validation options:\n👉 ${publicUrl}`;

    const encodedText = encodeURIComponent(baseMessage);

    return `https://api.whatsapp.com/send?text=${encodedText}`;
}
