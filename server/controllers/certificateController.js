const PDFDocument = require('pdfkit');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

// GET /api/certificates/:registrationId — generate PDF certificate
exports.generateCertificate = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.registrationId)
      .populate('user', 'name email')
      .populate('event', 'title startDate endDate organizer category');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    if (registration.status !== 'attended') {
      return res.status(400).json({ success: false, message: 'Certificate only available for attended events' });
    }

    const { user, event } = registration;
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${registration.ticketCode}.pdf`);
    doc.pipe(res);

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#2563eb');
    doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke('#93c5fd');

    // Header
    doc.fontSize(14).fillColor('#6b7280').text('EVENTHUB', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(36).fillColor('#1e3a5f').text('Certificate of Participation', { align: 'center' });
    doc.moveDown(0.3);
    doc.moveTo(200, doc.y).lineTo(doc.page.width - 200, doc.y).stroke('#2563eb');

    // Body
    doc.moveDown(1.5);
    doc.fontSize(14).fillColor('#374151').text('This is to certify that', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(28).fillColor('#1e40af').text(user.name, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#374151').text('has successfully participated in', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(22).fillColor('#1e3a5f').text(event.title, { align: 'center' });
    doc.moveDown(0.5);

    const startStr = new Date(event.startDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const endStr = new Date(event.endDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.fontSize(12).fillColor('#6b7280').text(`held on ${startStr} — ${endStr}`, { align: 'center' });

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).fillColor('#9ca3af').text(`Ticket: ${registration.ticketCode}`, { align: 'center' });
    doc.text(`Issued on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
};
